#!/usr/bin/env python3
"""Button Game public server: the web game, one global top-100 leaderboard
and the live player list, for https://babuni.dev/Buttongame/.

Standard library only (Python 3.9+). Intended to run on loopback behind an
the babuni.dev nginx HTTPS site; see server/README.md.

    python3 server/buttongame_server.py serve --web-root /var/www/buttongame/current/www \
        --db /var/lib/buttongame/scores.sqlite3

Administration (run on the server while it is stopped or running):

    python3 server/buttongame_server.py --db ... list-scores
    python3 server/buttongame_server.py --db ... delete-score ID
"""

import argparse
import json
import math
import re
import sqlite3
import sys
import threading
import time
from collections import deque
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

MAX_SCORES = 100          # Only the best 100 runs are kept; 101+ are removed.
MAX_NAME = 16
MAX_SCORE_VALUE = 1_000_000_000
MAX_STAT_VALUE = 86_400_000
MAX_BODY = 4096
PRESENCE_TTL = 5.0
MAX_LIVE_PLAYERS = 100
# Requests per client IP per minute. Presence is pushed roughly every second
# and on score changes, so its allowance is generous.
RATE_LIMITS = {"scores": 20, "presence": 900}
CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f-\x9f​-‏ -‮⁦-⁩]")


def bounded(value, limit):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return 0
    return int(min(max(0, value), limit))


def clean_name(value):
    text = CONTROL_CHARS.sub("", str(value or ""))
    return " ".join(text.split())[:MAX_NAME]


class Leaderboard:
    """SQLite-backed global high scores, trimmed to the best MAX_SCORES."""

    def __init__(self, db_file):
        self.db_file = str(db_file)
        if self.db_file != ":memory:":
            Path(self.db_file).parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        self.conn = sqlite3.connect(self.db_file, check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA synchronous=FULL")
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                score INTEGER NOT NULL,
                reaction_ms INTEGER NOT NULL,
                apm INTEGER NOT NULL,
                duration_ms INTEGER NOT NULL,
                traps INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )""")
        self.conn.execute("CREATE INDEX IF NOT EXISTS scores_rank ON scores (score DESC, id ASC)")
        self.conn.commit()

    def _top(self):
        rows = self.conn.execute(
            "SELECT id, name, score, reaction_ms, apm, duration_ms, traps FROM scores "
            "ORDER BY score DESC, id ASC LIMIT ?", (MAX_SCORES,)).fetchall()
        return rows

    @staticmethod
    def _public(row):
        return {"name": row[1], "score": row[2], "reactionMs": row[3], "apm": row[4],
                "durationMs": row[5], "trapsEnabled": bool(row[6])}

    def list_scores(self):
        with self.lock:
            return {"scores": [self._public(r) for r in self._top()]}

    def add_score(self, obj):
        entry = (
            clean_name(obj.get("name")) or "Player",
            bounded(obj.get("score"), MAX_SCORE_VALUE),
            bounded(obj.get("reactionMs"), MAX_STAT_VALUE),
            bounded(obj.get("apm"), MAX_STAT_VALUE),
            bounded(obj.get("durationMs"), MAX_STAT_VALUE),
            1 if obj.get("trapsEnabled") is True else 0,
            datetime.now(timezone.utc).isoformat(timespec="seconds"),
        )
        with self.lock, self.conn:
            new_id = self.conn.execute(
                "INSERT INTO scores (name, score, reaction_ms, apm, duration_ms, traps, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)", entry).lastrowid
            # Ties keep the earlier run, so a new equal score ranks below it.
            self.conn.execute(
                "DELETE FROM scores WHERE id NOT IN "
                "(SELECT id FROM scores ORDER BY score DESC, id ASC LIMIT ?)", (MAX_SCORES,))
            rows = self._top()
        rank = next((i + 1 for i, r in enumerate(rows) if r[0] == new_id), None)
        return {"scores": [self._public(r) for r in rows], "rank": rank, "maxScores": MAX_SCORES}

    def admin_rows(self):
        with self.lock:
            return self.conn.execute(
                "SELECT id, name, score, traps, created_at FROM scores "
                "ORDER BY score DESC, id ASC").fetchall()

    def delete(self, score_id):
        with self.lock, self.conn:
            return self.conn.execute("DELETE FROM scores WHERE id = ?", (score_id,)).rowcount


class Presence:
    """In-memory live player list; entries vanish 5 s after the last update."""

    def __init__(self):
        self.lock = threading.Lock()
        self.players = {}
        self.next_seat = 1

    def _expire(self):
        now = time.monotonic()
        self.players = {k: v for k, v in self.players.items() if now - v["lastSeen"] <= PRESENCE_TTL}

    def list_players(self):
        with self.lock:
            self._expire()
            ordered = sorted(self.players.values(), key=lambda p: p["seat"])
            return {"players": [{k: v for k, v in p.items() if k != "lastSeen"} for p in ordered]}

    def update(self, obj):
        key = str(obj.get("id") or "").strip()[:128]
        if not key:
            raise ValueError("missing id")
        with self.lock:
            self._expire()
            if key not in self.players and len(self.players) >= MAX_LIVE_PLAYERS:
                pass  # Full: still show the list, just don't add this player.
            else:
                if key in self.players:
                    seat = self.players[key]["seat"]
                else:
                    seat = self.next_seat
                    self.next_seat += 1
                name = clean_name(obj.get("name"))
                self.players[key] = {
                    "id": key, "name": name, "seat": seat,
                    "label": name or f"Player {seat}",
                    "score": bounded(obj.get("score"), MAX_SCORE_VALUE),
                    "timeLeft": bounded(obj.get("timeLeft"), 3600),
                    "reactionMs": bounded(obj.get("reactionMs"), MAX_STAT_VALUE),
                    "apm": bounded(obj.get("apm"), MAX_STAT_VALUE),
                    "playing": obj.get("playing") is True,
                    "lastSeen": time.monotonic(),
                }
        return self.list_players()


class RateLimiter:
    def __init__(self, limits):
        self.limits = limits
        self.lock = threading.Lock()
        self.hits = {}

    def allow(self, kind, client):
        now = time.monotonic()
        with self.lock:
            if len(self.hits) > 50_000:
                self.hits = {k: q for k, q in self.hits.items() if q and now - q[-1] < 60}
            q = self.hits.setdefault((kind, client), deque())
            while q and now - q[0] >= 60:
                q.popleft()
            if len(q) >= self.limits[kind]:
                return False
            q.append(now)
            return True


class GameHandler(SimpleHTTPRequestHandler):
    server_version = "ButtonGame"
    sys_version = ""

    def __init__(self, *args, app, **kwargs):
        self.app = app
        super().__init__(*args, directory=str(app.web_root), **kwargs)

    def log_message(self, fmt, *args):
        # Short access log without client IPs or bodies (journald keeps it).
        sys.stderr.write((fmt % args if args else fmt) + "\n")

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        if not self._headers_buffer or b"Cache-Control" not in b"".join(self._headers_buffer):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def client_ip(self):
        if self.app.trust_proxy:
            real = self.headers.get("X-Real-IP")
            if real:
                return real.strip()[:64]
            fwd = self.headers.get("X-Forwarded-For")
            if fwd:
                return fwd.split(",")[-1].strip()[:64]
        return self.client_address[0]

    def json_response(self, result, status=200):
        payload = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def route(self):
        """Return the path inside the game, or None if outside the base path.

        Works whether the reverse proxy strips the /Buttongame prefix or not.
        """
        path = unquote(urlsplit(self.path).path)
        base = self.app.base_path
        if base:
            if path == base:
                return ""  # Needs a trailing slash so relative URLs resolve.
            if path.startswith(base + "/"):
                return path[len(base):]
        return path

    def redirect(self, location):
        self.send_response(301)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def public_file(self, route):
        """Only the game files: never databases, Git data or tooling."""
        root = self.app.web_root
        if route in ("/", "/index.html", "/game.js"):
            return True
        if route.startswith("/assets/") and ".." not in Path(route).parts:
            target = (root / route.lstrip("/")).resolve()
            return target.is_file() and target.is_relative_to((root / "assets").resolve())
        return False

    def do_HEAD(self):
        route = self.route()
        if route == "":
            return self.redirect(self.app.base_path + "/")
        if not self.public_file(route):
            self.send_response(404)
            self.send_header("Content-Length", "0")
            return self.end_headers()
        self.path = route
        return super().do_HEAD()

    def do_GET(self):
        route = self.route()
        if route == "":
            return self.redirect(self.app.base_path + "/")
        if route == "/api/scores":
            return self.json_response(self.app.scores.list_scores())
        if route == "/api/presence":
            return self.json_response(self.app.presence.list_players())
        if route == "/healthz":
            return self.json_response({"ok": True})
        if not self.public_file(route):
            return self.json_response({"error": "not found"}, 404)
        self.path = route
        return super().do_GET()

    def do_POST(self):
        route = self.route()
        kind = {"/api/scores": "scores", "/api/presence": "presence"}.get(route)
        if not kind:
            return self.json_response({"error": "not found"}, 404)
        if not self.app.limiter.allow(kind, self.client_ip()):
            return self.json_response({"error": "too many requests"}, 429)
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 1 or size > MAX_BODY:
                return self.json_response({"error": "invalid request size"}, 400)
            obj = json.loads(self.rfile.read(size))
            if not isinstance(obj, dict):
                raise ValueError("expected a JSON object")
            result = (self.app.scores.add_score(obj) if kind == "scores"
                      else self.app.presence.update(obj))
            return self.json_response(result)
        except (ValueError, UnicodeDecodeError) as exc:
            return self.json_response({"error": str(exc)[:200]}, 400)


class App:
    def __init__(self, web_root, db_file, base_path="/Buttongame", trust_proxy=False):
        # Not resolved: web_root may be the `current` release symlink, and a
        # switched symlink must take effect without a restart.
        self.web_root = Path(web_root).absolute()
        if not (self.web_root / "index.html").is_file():
            raise SystemExit(f"No index.html in web root {self.web_root}")
        self.base_path = base_path.rstrip("/")
        self.trust_proxy = trust_proxy
        self.scores = Leaderboard(db_file)
        self.presence = Presence()
        self.limiter = RateLimiter(RATE_LIMITS)


def make_server(bind, port, app):
    server = ThreadingHTTPServer((bind, port), partial(GameHandler, app=app))
    server.daemon_threads = True
    return server


def main(argv=None):
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Button Game public server")
    parser.add_argument("--db", type=Path, default=Path.cwd() / "public-scores.sqlite3")
    sub = parser.add_subparsers(dest="command")
    serve = sub.add_parser("serve", help="Run the web server (default)")
    serve.add_argument("--bind", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8787)
    # Deploy bundle: www/ beside this script. Repository checkout: the repo root.
    serve.add_argument("--web-root", type=Path,
                       default=here / "www" if (here / "www" / "index.html").is_file() else here.parent)
    serve.add_argument("--base-path", default="/Buttongame")
    serve.add_argument("--trust-proxy", action="store_true",
                       help="Use X-Real-IP / X-Forwarded-For from the local reverse proxy")
    sub.add_parser("list-scores", help="Print all stored scores with their IDs")
    delete = sub.add_parser("delete-score", help="Remove one score by ID")
    delete.add_argument("id", type=int)
    args = parser.parse_args(argv)

    if args.command == "list-scores":
        for row in Leaderboard(args.db).admin_rows():
            print("%6d  %-16s %12d  %-5s %s" % (row[0], row[1], row[2], "traps" if row[3] else "", row[4]))
        return
    if args.command == "delete-score":
        removed = Leaderboard(args.db).delete(args.id)
        print("Deleted" if removed else "No score with that ID")
        return

    if args.command is None:
        args = parser.parse_args(["--db", str(args.db), "serve"])
    app = App(args.web_root, args.db, args.base_path, args.trust_proxy)
    server = make_server(args.bind, args.port, app)
    print(f"Button Game public server on http://{args.bind}:{server.server_port}{app.base_path}/", flush=True)
    print(f"Leaderboard database: {args.db} (best {MAX_SCORES} kept)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
