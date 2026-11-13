"""Integration tests for the Button Game public server (standard library)."""
import importlib.util
import json
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("button_game_public", ROOT / "server" / "buttongame_server.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PublicServerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / "scores.sqlite3"
        self.start()

    def start(self, trust_proxy=False):
        self.app = module.App(ROOT, self.db, "/Buttongame", trust_proxy)
        self.server = module.make_server("127.0.0.1", 0, self.app)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def stop(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)
        self.app.scores.conn.close()

    def tearDown(self):
        self.stop()
        self.tmp.cleanup()

    def call(self, method, path, payload=None, headers=None):
        conn = HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        body = None if payload is None else (payload if isinstance(payload, bytes) else json.dumps(payload).encode())
        conn.request(method, path, body=body, headers={"Content-Type": "application/json", **(headers or {})})
        res = conn.getresponse()
        data = res.read()
        conn.close()
        return res, data

    def post_score(self, score, name="P", **extra):
        res, data = self.call("POST", "/Buttongame/api/scores", {"name": name, "score": score, **extra})
        self.assertEqual(res.status, 200, data)
        return json.loads(data)

    def test_keeps_only_best_100_and_reports_rank(self):
        self.app.limiter.limits = {"scores": 1000, "presence": 1000}
        for i in range(1, 101):
            self.post_score(i * 10, name=f"P{i}")
        low = self.post_score(5, name="Low")
        self.assertIsNone(low["rank"])
        self.assertEqual(low["maxScores"], 100)
        self.assertEqual(len(low["scores"]), 100)
        self.assertNotIn("Low", [s["name"] for s in low["scores"]])
        top = self.post_score(5000, name="Top")
        self.assertEqual(top["rank"], 1)
        self.assertEqual(len(top["scores"]), 100)
        self.assertNotIn(10, [s["score"] for s in top["scores"]], "101st place is removed")
        # Equal score ranks below the earlier run.
        tie = self.post_score(5000, name="Tie")
        self.assertEqual(tie["rank"], 2)
        rows = self.app.scores.admin_rows()
        self.assertEqual(len(rows), 100, "database itself holds only 100 rows")

    def test_persists_across_restart_and_keeps_fields(self):
        self.post_score(77, name="Saved", reactionMs=210, apm=95, durationMs=61000, trapsEnabled=True)
        self.stop()
        self.start()
        res, data = self.call("GET", "/Buttongame/api/scores")
        self.assertEqual(json.loads(data)["scores"], [{"name": "Saved", "score": 77, "reactionMs": 210,
                                                       "apm": 95, "durationMs": 61000, "trapsEnabled": True}])

    def test_input_is_cleaned(self):
        s = self.post_score(float("1e30"), name="  A‮B\x00  very long name here  ",
                            reactionMs=-5, apm="9", trapsEnabled="yes")["scores"][0]
        self.assertEqual(s["name"], "AB very long nam")
        self.assertEqual(s["score"], module.MAX_SCORE_VALUE)
        self.assertEqual((s["reactionMs"], s["apm"], s["trapsEnabled"]), (0, 0, False))
        self.assertEqual(self.post_score(1, name="   ")["scores"][-1]["name"], "Player")

    def test_base_path_with_and_without_proxy_prefix(self):
        res, _ = self.call("GET", "/Buttongame")
        self.assertEqual((res.status, res.getheader("Location")), (301, "/Buttongame/"))
        for prefix in ("/Buttongame", ""):
            res, data = self.call("GET", prefix + "/")
            self.assertEqual(res.status, 200)
            self.assertIn(b"game.js", data)
            res, _ = self.call("GET", prefix + "/assets/button.svg")
            self.assertEqual(res.status, 200)
            res, _ = self.call("GET", prefix + "/api/presence")
            self.assertEqual(res.status, 200)

    def test_only_public_files_are_served(self):
        for path in ("/Buttongame/server/buttongame_server.py", "/Buttongame/.git/config",
                     "/Buttongame/AGENTS.md", "/Buttongame/assets/../AGENTS.md",
                     "/Buttongame/assets/%2e%2e/AGENTS.md", "/Buttongame/assets/"):
            for method in ("GET", "HEAD"):
                res, _ = self.call(method, path)
                self.assertEqual(res.status, 404, (method, path))
        res, body = self.call("HEAD", "/Buttongame/game.js")
        self.assertEqual((res.status, body), (200, b""))

    def test_bad_requests(self):
        for body in (b"[]", b"{bad", b"x" * (module.MAX_BODY + 1)):
            res, _ = self.call("POST", "/Buttongame/api/scores", body)
            self.assertEqual(res.status, 400)
        res, _ = self.call("POST", "/Buttongame/api/presence", {"name": "no id"})
        self.assertEqual(res.status, 400)
        res, _ = self.call("POST", "/Buttongame/api/other", {})
        self.assertEqual(res.status, 404)

    def test_score_rate_limit_per_client(self):
        self.stop()
        self.start(trust_proxy=True)
        for _ in range(module.RATE_LIMITS["scores"]):
            self.call("POST", "/Buttongame/api/scores", {"score": 1}, {"X-Real-IP": "203.0.113.5"})
        res, _ = self.call("POST", "/Buttongame/api/scores", {"score": 1}, {"X-Real-IP": "203.0.113.5"})
        self.assertEqual(res.status, 429)
        res, _ = self.call("POST", "/Buttongame/api/scores", {"score": 1}, {"X-Real-IP": "198.51.100.7"})
        self.assertEqual(res.status, 200, "other players are unaffected")

    def test_presence_lists_live_players(self):
        res, data = self.call("POST", "/Buttongame/api/presence",
                              {"id": "a", "name": "", "score": 3, "playing": True, "timeLeft": 40})
        p = json.loads(data)["players"][0]
        self.assertEqual((p["label"], p["score"], p["playing"], p["timeLeft"]), ("Player 1", 3, True, 40))

    def test_admin_delete(self):
        self.post_score(50, name="Spam")
        score_id = self.app.scores.admin_rows()[0][0]
        self.assertEqual(self.app.scores.delete(score_id), 1)
        self.assertEqual(self.app.scores.list_scores(), {"scores": []})


if __name__ == "__main__":
    unittest.main()
