# Button Game — Technical Architecture

## 2026-11-13 — Public server (`server/`)

`server/buttongame_server.py` is a third host for the same `index.html` + `game.js`, meant for `https://babuni.dev/Buttongame/` behind the babuni.dev nginx site on the shared Hetzner VPS (snippet included before the website catch-all, like `/Morkahja/`). Releases live in `/var/www/buttongame/releases/` with a `current` symlink uploaded by `babunideploy` (outside the website root, which `publish-site.sh` replaces); the web root is not resolved at startup, so switching `current` takes effect without a restart. It listens on `127.0.0.1:8787`, accepts paths with or without the `/Buttongame` prefix, and redirects `/Buttongame` to `/Buttongame/`. Scores live in SQLite (`/var/lib/buttongame/scores.sqlite3` in the systemd unit, WAL, `synchronous=FULL`); after each insert rows outside the best 100 (`ORDER BY score DESC, id ASC`) are deleted, and the POST response adds `rank` (or `null`) and `maxScores`. Presence is in memory as on the other hosts (5 s TTL, max 100). Client IP for rate limits comes from `X-Real-IP`/`X-Forwarded-For` only with `--trust-proxy`. The client now calls relative `api/...` URLs; Android (`http://127.0.0.1:8766/`) and the desktop host serve from `/`, so they behave as before. `server/build-web.sh` creates the upload folder with MP3 copies made by ffmpeg. The public, Android and desktop score lists are separate.

## 2026-10-27 — Current source and media-contract audit

**Separate execution generations:** `Game.swf` and `Game.html` preserve the 2009 Flash origin; `ChatGPT Remake/` preserves an intermediate prototype; root `index.html` + `game.js` drive current play, mirrored under Android's `assets/www/`. The Android Kotlin host provides scores/presence at **port 8766**, whereas `scripts/serve-desktop.py` defaults to **8000** and stores a different host-owned ledger in ignored `.local-data/desktop-scores.json`. These are not two clients writing one shared central database.

**Audio resource contract:** `game.js` attempts Web Audio preloading of Ogg samples. On unavailable buffers/suspended context it switches to a media element, choosing `.mp3` instead of `.ogg` when the browser reports no Ogg/Vorbis decoder. The current Git tree includes the ten Ogg masters and mirrors, but **no matching MP3 files**. Thus a fresh repo checkout on a non-Ogg browser may request unavailable fallback resources; the previously produced desktop ZIP reportedly included those conversions. The source-level [sound regression](../tests/sound-playback-fallback.cjs) checks mock URL selection, mute behavior and Ogg presence, **not actual audible output**.

**Implemented status:** `TRAP_CHANCE = 0.10` and red-trap event handling are present in current JS and Android-mirrored JS; original no-implementation analyses are historical. Local Python API fixture tests exist but are not live multi-device verification. No code or game tests were run in this documentation pass.


**Update — 26 October 2026:** Babuni.dev subsequently authorized full Red Trap Button implementation at **10%** replacement probability, with immediate Game Over and conservation of already-earned pending points. The feature is **implemented in GitHub source**, and the native Android compilation and new trap regression passed in [Actions run 40365295833](https://github.com/babunidev/ButtonGame/actions/runs/40365295833). Any earlier language below saying this mode is not started or not authorized records the **historical status at that time** and is superseded. An Android APK signed with the original release certificate and physical Trap Mode verification remain **pending**. See [the current Red Trap Button specification](TRAP_MODE.md).

**Inspected baseline:** GitHub `main` at `d5ce766`, 2026-10-26. Architectural descriptions below concern code paths; production behavior is not proven solely by reading source.

## Desktop LAN host (26 October 2026)

`scripts/serve-desktop.py` is now the supported desktop equivalent of Android's **Serve on Wi-Fi** for local play. It combines public web-asset serving and `GET/POST /api/scores` / `GET/POST /api/presence` with an independent, **host-owned desktop** score file, `.local-data/desktop-scores.json`. The same `game.js` browser client works unmodified, including Traps-mode metadata. Live presence is a transient in-memory five-second list; desktop scores are sorted and persisted to local JSON. Server and score state are not shared with the Android host. Its HTTP static routes are allowlisted to `/`, `index.html`, `game.js`, and public `assets/` to avoid serving local history, stored scores or other private repository files to LAN users.

The original `python3 -m http.server 8000` command remains valid for **static-only** gameplay, but does not satisfy these API routes and therefore cannot save/shared scores. The desktop host instead starts with `python3 scripts/serve-desktop.py` on port 8000 by default and listens on the PC's LAN interfaces. It is intended for a **trusted network**, not direct exposure to the internet: API score submissions have no authentication, as with the original home-LAN Android host.

**Implementation evidence:** Server code and integration tests are committed; unit tests exercise score/Traps persistence across restart, player API and blocked access to private paths. Real desktop/phone two-device use and firewall behavior on Babuni.dev's Nobara system are not yet verified.

## Runtime components

```text
Android host (com.babunigaming.buttongame)
  MainActivity / WebView (local player + "Serve on Wi-Fi" UI)
  HostService (foreground server lifecycle)
  GameServer : NanoHTTPD (TCP 8766)
    GET  /            -> web game assets
    GET  /api/scores  -> ScoreStore leaderboard JSON
    POST /api/scores  -> append/trim persisted scores
    GET  /api/presence -> active player snapshot
    POST /api/presence -> upsert live player heartbeat
  ScoreStore -> app-private files/scores-v2.json
  PresenceStore -> in-memory player sessions (5 s TTL)

Browser guests (same Wi-Fi, QR or URL)
  index.html + game.js -> host-served assets
  /api/presence -> send live stats / get peer snapshot
  /api/scores -> submit and read the one host leaderboard
```

The browser game does not establish an independent, durable guest scoreboard. Nickname, session ID and sound-mute preferences may use browser `localStorage`.

## Gameplay runtime

`game.js` is an immediate-invocation script manipulating DOM nodes in `index.html`; it is not a framework app. It owns timing, button lifecycle, floaters, combinations, score and time banks, audio routing, player presence and network leaderboard requests.

The 60-second `deadline` starts on the first tap. State updates include target/fade phases and `requestAnimationFrame` visual updates. Score-bearing floaters retain pending points through merges. When a floater expires, a flying value deposits into `scoreBank`; this bank gradually credits the displayed total. A similar pipeline exists for golden seconds. Game Over checks outstanding transformations, floaters, pickups and banks before freezing final statistics and enabling submission.

## Network and storage contract

### Leaderboard

`GET /api/scores` returns a JSON object shaped like:

```json
{"scores":[{"name":"Player","score":42,"reactionMs":230,"apm":51,"durationMs":61200}]}
```

`POST /api/scores` accepts a JSON body containing the same five fields. The host sanitizes basic negative values and clips names, sorts descending by score and retains at most 50 entries in `scores-v2.json`. The host is the **only persistence authority**, but **not a cryptographic anti-cheat authority**: clients currently supply final numeric values, and remote requests are unauthenticated.

`ScoreStore` directly rewrites a JSON file; atomic persistence and corruption handling remain release-hardening tasks. Historical beta `scores.json` is deliberately deleted when a `ScoreStore` is initialized. Babuni.dev does not require preservation of expendable beta records.

### Presence

`POST /api/presence` carries `id`, name, score, timeLeft, reactionMs, apm and playing state. A singleton `PresenceStore` tracks these in memory, prunes entries older than five seconds and assigns seat numbers. Browser presence is sent approximately every 900 ms; Android host UI fetches presence on a faster animation/poll interval. Presence is ephemeral and **not** a persisted result.

### Refresh model

`game.js` loads scores initially, refreshes the playing preview every 12 seconds, refreshes Game Over every three seconds, and fetches again when returning to a visible Game Over tab. The targeted Node test verifies those timer conditions; it is not a two-device integration test.

## Build and assets

- Web source: root `index.html`, `game.js`, `assets/`.
- Android packaged mirror: `android/app/src/main/assets/www/`. Root JS/HTML and packaged copies were byte-identical at this inspected head.
- `scripts/sync-www.sh` currently mirrors HTML/JS and `assets/` files, including OGGs **only from `assets/sfx/`**.
- All three custom OGGs were added under root `sfx/` at `d5ce766`; source patch `2fa4539` mirrored those exact original bytes into both `assets/sfx/` and the Android web bundle, and changed synchronization to use canonical `sfx/`.
- Android Gradle config: Java 17, compile/target SDK 35, min SDK 26, `applicationId = com.babunigaming.buttongame`, `versionCode = 2` / `versionName = 1.0.1-beta`.
- CI: `.github/workflows/android-build.yml` synchronizes web and original sounds, checks the source mirror, runs Node syntax/leaderboard regression and Gradle `assembleDebug assembleRelease`, then verifies all 10 OGGs exist byte-identically inside both APKs. It watches `sfx/**`.
- CI release output is unsigned. A release-signed upgrade requires Babuni.dev's original certificate; credentials are not part of the repository. See [INSTALL.md](../INSTALL.md).

## Historical architecture evolution and failed shortcuts

**Flash reference.** `Game.html` is a Flash wrapper with a 450 × 450 stage, and the retained `Game.swf` is the primary binary artifact. `ChatGPT Remake/README.md` describes a later canvas/Path2D reconstruction of the original ActionScript and extracted SVG-like path/font outlines. It preserved approximately 15 FPS update semantics, old fading/movement rules, one point and second per click, and no sound/replay. This is a *separate historical implementation*, not the browser DOM game now shipped under the root paths.

**Modern browser runtime.** The root `game.js` introduced a different division of responsibilities: button art and fracture fragments are DOM/SVG, floating numbers have physical bounds and a **pending-value** ledger, RAF motion animates effects, while legacy-like target lifecycle ticks remain. The original instantaneous tap-credit path was replaced by delayed floaters → foreground pickups → shared score bank → displayed total; special 21/37 handlers retire their source value before exactly one transformed score pickup. A separate gold time flight/bank eventually feeds integer seconds into the deadline. This means the display can temporarily differ from points earned but not yet credited; Game Over checks outstanding work.

**From standalone to Android-owned LAN play.** Native Kotlin Android wraps a WebView, foreground `HostService` and NanoHTTPD API. Wi-Fi guests receive those same HTML/JS assets over HTTP, while the native host alone persists rankings. Presence heartbeats and transient player-status HUD are *not* remote physics synchronization. The earlier workaround of storing/enriching individual guest scores in `localStorage` was explicitly undone after Babuni.dev clarified one shared authority; standalone HTML cannot honestly offer this host scoreboard without the Android server.

**The misleading APK update path (2026-10-25).** Initial Android updates injected only new `index.html`/`game.js` into an older signed APK and re-signed it, leaving compiled Kotlin classes unchanged. The browser UI could display new Reaction/APM/duration fields while native `ScoreStore` still saved just names and points. Source changes to `ScoreStore.kt` were therefore *not proof of an updated distributed host*. A GitHub Actions full native Gradle build corrected that separation. The first CI setup failed on the Android SDK action's obsolete `tools` package; switching to `packages: 'platform-tools'` resolved startup and both debug/unsigned release builds passed. The latest Game Over refresh fix is source/CI verified, but signed upgrade delivery and physical multiplayer acceptance are distinct gates.

**Identity and signing are interface contracts.** A proposed side-by-side `applicationIdSuffix = ".testing"` debug app was not requested and was reverted. Babuni.dev explicitly wants normal-package upgrades using the original release certificate and does not require beta test score preservation. A debug APK or unsigned release artifact does not satisfy that contract. Repository `sfx/` contains the custom files, but synchronized web/Android copies are not yet reproducible from the CI path.

## Red Trap Button integration — source implemented

Babuni.dev's [complete nine-item spec](TRAP_MODE.md) describes an optional pre-game Traps checkbox, random red replacement spawns with **ordinary position, lifespan, rotation and shatter lifecycle**, **instant Game Over when pressed**, and unattended **expiration/shatter/next spawn**. While a red target exists, it emits **3 passive points every one-third second (9 points per second)** from the playfield **center**. These points must use the **existing floating-number collision, merge, expiry and score-fusion accounting**, not a direct `score += 3` shortcut.

High-score persistence must eventually record whether Traps was enabled for each run, and display a **small red button beside matching names**. This implies a future client/server mode metadata contract, but **no field name, storage migration behavior, or API change has been approved or implemented**. A future implementation must define how immediate Game Over interacts with pending score settlement and network submission before altering current behavior.

**The entire Trap Mode is now implemented in source.** This is a documentation-only technical dependency analysis, not executable architecture or an instruction to alter the current host.

## Known failure/abuse surfaces

- Unauthenticated cross-origin HTTP requests on an unencrypted local network; clients can submit fabricated numbers. Intended for trusted LAN play pending safeguards.
- Port bind exceptions and premature WebView load may cause startup trouble; activity-local hosting state can diverge from service.
- Direct score-file writes risk interruption. Presence IDs are client-supplied and transient.
- `WebView.setWebContentsDebuggingEnabled(true)` is currently unconditionally enabled; restrict to development builds.

These are **source-review observations, not reproduced bugs or active work requirements**. Babuni.dev reports no server startup or port conflicts and explicitly prefers simple, working software over speculative hardening. Only revisit if an actual user-observed issue merits work. Release gates and Babuni.dev-confirmed device QA are tracked in [ROADMAP.md](../ROADMAP.md) and [QA.md](QA.md).
