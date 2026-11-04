# Button Game — Current Project To-Do

## Public server with one global high-score leaderboard — proposed, not deployed (4 November 2026)

**Babuni's requested outcome:** Run Button Game on their own internet-accessible server so every visitor can play the same HTML5 game and all online players contribute to **one central high-score leaderboard**. Reuse the current browser game; the Android and desktop local-host score files are separate today and are **not** automatically global. This section is a plan only; no server has been configured.

### Phase 1 — Keep the existing game and specify the public scoreboard

- [ ] Confirm a deployment address on the creator's server (domain/subdomain or URL path), without assuming an existing hosting route can be changed.
- [ ] Keep the current `index.html`, `game.js`, artwork, sound, and Traps mode; serve game and API from the **same origin** so existing relative `/api/scores` and `/api/presence` calls work without extra client setup.
- [ ] Implement **one global, all-time leaderboard** shared by every player using the public server. **Do not cap the global list at 50**: every submitted result must remain available, including lower-ranked and older results, unless removed for legitimate moderation or data-integrity reasons.
- [ ] Make the leaderboard **scrollable all the way to the end** so visitors can see all historical entries, not just the top players. Load older/lower-ranked entries incrementally (e.g. paginated or infinite scroll) instead of trying to download the entire history at once.
- [ ] Preserve and display every score entry's **player name, points, Reaction, APM, run duration, and Traps flag/red button marker**, retaining existing gameplay and responsive layouts.
- [ ] Specify how repeated submissions under the same name appear and whether names represent distinct players. Do not silently merge or remove entries: no login/identity rule has yet been chosen.
- [ ] Decide whether native Android app users should later connect to this **global server** instead of the app's separate local host; that requires deliberate Android integration, not an assumption that current APKs sync.

### Phase 2 — Adapt the desktop LAN server for internet use

- [ ] Reuse the Python server's API contract as a starting point, but run a production backend instead of directly exposing `scripts/serve-desktop.py` on the internet.
- [ ] Introduce durable storage suited to concurrent public writes (SQLite is a reasonable small-scale default) and **retain the complete all-time submission history**, not just the current desktop host's top 50. Add stable ranking, a deterministic tie-break order, efficient indexes, and an API that can page through **every** record. Consider a migration from `.local-data/desktop-scores.json` only if importing existing desktop scores is desired.
- [ ] Validate all score/presence inputs server-side: length, type, size limits, allowed fields, and reasonable bounds. Display names must be rendered safely. Current browser clients can submit arbitrary numbers, so do **not** promise cheat-proof scores without further design.
- [ ] Add essential public abuse safeguards: reasonable POST rate limits, protection against score spam and excessively large payloads, basic server-side logging without disclosing unnecessary player data, and administrative removal of malicious entries.
- [ ] Decide how to handle live player presence globally and how frequently to poll it at higher traffic; keep game scoring independent of presence.
- [ ] Ensure the original Ogg recordings work and package MP3 alternatives for browsers lacking Ogg/Vorbis support; actual browser sound verification is still pending.
- [ ] Review redistribution/licensing and third-party asset rights before public launch.

### Phase 3 — Deploy to the creator's own server

- [ ] Prepare a dedicated deployment directory and low-privilege service account; keep database, backups, private configuration and logs **outside** the web-served directory.
- [ ] Run the backend on a loopback-only port, controlled by `systemd` (or equivalent), restarting safely after machine reboot.
- [ ] Set up a reverse proxy (e.g. Caddy or Nginx) for the chosen domain, HTTPS/TLS, and routes for static gameplay and `/api/*`. Expose only the intended public web ports, not raw LAN port 8000.
- [ ] Configure deployment updates from the GitHub repository, permissions, migration/rollback behavior, and backups with a tested restore procedure.
- [ ] Check that the website and leaderboard survive service restarts and do not discard existing records on deployments.

### Phase 4 — Verify real public play and publish

- [ ] Test from two or more **different networks**, not just another device on the home Wi-Fi, with score submission and shared leaderboard refresh.
- [ ] Test simultaneous submissions, normal and Traps runs, Game Over pending-point settlement, persistence after server reboot, username rendering, basic malformed/spam requests, and score moderation.
- [ ] Test with **more than 50 submitted scores** and verify that every entry remains stored, correctly ranked, and reachable by scrolling through all leaderboard pages—including the oldest and lowest-ranked entries—without duplicates or missing rows.
- [ ] Verify mobile/desktop browser gameplay, live player list, keyboard/touch controls, Ogg/MP3 sound, and HTTPS/browser security behavior.
- [ ] Document the public URL, server setup, safe update/rollback and backup procedure in `README.md`, `INSTALL.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md` and `docs/DEVLOG.md` **after actual implementation and verification**.

**Not implemented yet:** Public hosting, a shared global database, hardening, public HTTPS, or Android-to-global-server syncing. Existing LAN high-score features remain intact.

## 2026-10-27 — Outstanding verification after documentation audit

- [x] **Source exists:** 10% optional red Trap Mode with pending-score settlement; widescreen player/game/score layout; separate Python LAN host; Web Audio-to-media-element fallback.
- [x] **Artifact boundary documented:** ten original Ogg files are tracked; MP3 fallback copies were reported in a **separate desktop ZIP**, not this source repository.
- [ ] **Recipient desktop audio:** check the saved speaker mute setting, browser codec support, and actual audible playback. If the browser lacks Ogg support, inspect that *specific* shared ZIP for its ten MP3 files; a source checkout does not include them.
- [ ] **Desktop LAN acceptance:** play from a second device and verify desktop-host scores survive a server restart; local HTTP tests are not a substitute.
- [ ] **Compatible Android update:** compare the signing certificate against the actually installed app and use the matching permanent key with a higher versionCode; preserve phone-host scores before an exceptional migration.
- [ ] **Publication rights:** determine license and redistribution permissions for the source, historic Flash work, recordings, images and bundled font before broad external redistribution.

Do not reopen already creator-tested gameplay as a speculative task or claim a new test pass from this docs-only audit.


## Prevent APK signing incompatibilities

- [x] Diagnose why previously signed updates worked but newer CI-debug APKs do not: **different signing certificate**, not a changed package ID or missed version bump.
- [x] Add `scripts/sign-android-update.sh` to sign with an existing P12, verify signer and package identity against the **installed** APK, and enforce a higher versionCode.
- [x] Add optional **original-certificate signed APK artifact** to GitHub Actions, guarded by encrypted private-key secrets and the historical public certificate fingerprint. No secrets are checked into Git.
- [ ] Locate the original private `Buttongame-signing-keystore.p12` on Babuni.dev's trusted computer and compare its certificate with the **actual installed** APK.
- [ ] If the phone holds the **1.0.2 CI debug build**, preserve host scores and perform **one exceptional migration** to a permanent original-key-signed APK, because the private CI-debug key is not retained.
- [ ] After migration, sign every new higher-version release with that **same permanent certificate**; no routine uninstalls.

**Updated 26 October 2026 from Babuni.dev's own device-testing report and the current GitHub source.**

This is a short **active work list**. Previously tested features must not be repeatedly returned as unfinished QA tasks. The original seven-category checklist is preserved [unchanged as historical evidence](docs/HISTORICAL_CHECKLIST_2026-10-25.md); the [complete Red Trap Button specification](docs/TRAP_MODE.md) is separate.

## Desktop LAN high-score fix — 26 October 2026

- [x] Diagnose Babuni.dev's `localhost:8000` high-score error: the standard Python `http.server` has no `POST /api/scores` or `/api/presence` support. The browser game was running but had no scores backend.
- [x] Implement an optional **desktop Wi-Fi/LAN host** with the same score/presence endpoint shapes as Android and private **local, persistent desktop scores**.
- [x] Keep Android high scores separate; preserve the existing Android application, version 1.0.3-beta and current APK rather than rebuilding Android for a desktop-only server.
- [x] Add desktop integration tests for persistence, Traps metadata, live player API, and refusal to serve private files; wire them into CI.
- [ ] Babuni.dev confirms a real desktop-host session with a second device and stored scores after PC server restart.

**How to run:** `python3 scripts/serve-desktop.py` from the updated repository, then browse `http://localhost:8000/` or share `http://COMPUTER_LAN_IP:8000/` on the same reachable network. [Installation instructions](INSTALL.md). Do not open this unauthenticated test server directly to the public internet.

## Current interface update — 1.0.3-beta (26 October 2026)

- [x] Babuni.dev **installed and tested 1.0.2-beta**: red taps end the game immediately; already-earned score finishes collecting; the red icon is saved; host high scores survive closing/reopening the app and stopping/restarting hosting. Passive +3 timing is observed; keep **10%** trap chance.
- [x] Move the Traps label and checkbox to the **bottom-left beside Reaction/APM and Play Again**, keep the selected state through Game Over and allow mode changes before replay; lock it during active runs.
- [x] Show saved host high scores before play starts; preserve full in-game high scores at mobile Game Over.
- [x] Widescreen responsive layout: live players **left**, game **center**, host high scores **right**; phone layout stays stacked.
- [x] Bump Android version to **1.0.3-beta / code 4**, and add source regression coverage.
- [ ] Verify the final 1.0.3-beta CI artifacts and install the new Android build signed with the **currently installed app's signing certificate**.
- [ ] Quick physical visual check of changed positions and score preview; prior gameplay/Trap Mode tests are already confirmed by Babuni.dev.

## Completed — confirmed by Babuni.dev on actual devices

- [x] **Button & Quick Strike:** turquoise target, rotation/spawn animations, pulse, impact feedback, shatter, 73 ms Quick Strike, spinning/green dot/double points, Quick Strike sounds.
- [x] **Floating numbers & combinations:** emission, physics, full-label collisions, mergers, visible score collection, 21→42 and 37→73, golden highlights, milestone bells, special sound effects.
- [x] **Timer & interface:** 7/14/42/73 bonuses (+2/+3/+5/+4 s), golden timer/score banks, HUD, Reaction/APM, Game Over, replay, phone presentation.
- [x] **High scores:** real guest-to-host submission works; host Game Over ranking updates automatically every three seconds; the four final statistics are saved correctly and persist across hosting restarts.
- [x] **Two-device Wi-Fi multiplayer:** guest browser joining, connected-player list, live player statistics and shared leaderboard work.
- [x] **Physical-device QA of existing installed game:** gameplay, interface, sound volume and multiplayer tested and reported working by Babuni.dev.
- [x] **Source OGG recordings present:** all three custom OGGs were already in root `sfx/`.
- [x] **Documentation baseline:** README, concept, decisions, design, architecture, developer guidance, development journal and recovered historical checklists.

These results are **Babuni.dev-reported device verification of the installed version**. They are not automatically proof that a newly rebuilt APK has been installed or signed. See [docs/QA.md](docs/QA.md).

## Current release work

- [x] Copy all three custom OGGs to both `assets/sfx/` and `android/app/src/main/assets/www/assets/sfx/`. Preserve bytes from canonical `sfx/`.
- [x] Update `scripts/sync-www.sh` to include original recordings; update Android CI to sync web assets and check exact sounds in debug/unsigned-release APKs.
- [x] Increment Android version to `versionCode = 2` and `versionName = 1.0.1-beta` for the new native build.
- [x] **Native Android debug and unsigned release build passed** with all ten sounds verified inside both APKs, existing leaderboard regression and web asset synchronization: [GitHub Actions 40325603457](https://github.com/babunidev/ButtonGame/actions/runs/40325603457).
- [ ] **Sign the new release using the original certificate** (held outside this repository) and verify update installation compatibility.
- [ ] **Deliver/install the signed normal-package APK**; a brief smoke test of that *new build* is sufficient. Do not introduce a separate TEST app.

## Red Trap Button — implemented in source; release/device acceptance pending

The nine-item design is preserved without changing gameplay. [Full checklist and rules](docs/TRAP_MODE.md).

- [x] Pre-game Traps checkbox and matching red four-hole SVG button (first target remains normal).
- [x] Random red replacements on **10% of subsequent spawns**; ordinary geometry, rotation and shatter.
- [x] Untouched red buttons automatically expire; red taps show **Game Over immediately**.
- [x] Already-earned pending points continue collecting before the leaderboard form is enabled; no additional points created after a red tap.
- [x] Emit +3 from the playfield center every ⅓ second during an active trap, through normal floaters and green score fusion.
- [x] Store the Traps-mode boolean **on the Android host** and display a red icon beside leaderboard names, including the faded preview.
- [x] Android asset mirrors, Kotlin source, regression test and version bump to **1.0.2-beta (code 3)** committed.
- [ ] Confirm the **new Trap Mode CI build** and retrieve its APK artifact.
- [ ] Sign with the **original Android signing certificate** and deliver a true update to the existing installed game.
- [ ] A short physical-device check of Trap Mode, ordinary mode and the host/guest leaderboard icon.

**The full feature was authorized by Babuni.dev after the earlier planning-only phase.** Checkmarks here mean source implemented; they are **not** a claim that a replacement APK has been signed and installed. See [TRAP_MODE.md](docs/TRAP_MODE.md).

## Maintenance and portfolio documentation

- [ ] Keep `CHANGELOG.md`, `docs/DEVLOG.md` and this roadmap aligned with **actual** released changes, not hypothetical fixes.
- [ ] Collect publication-safe gameplay screenshots/video and the story of development for babuni.dev when desired.

## Explicitly not active tasks

Do **not** create a new score-submission retry system based on a one-off old bug. Do **not** turn hypothetical bind conflicts, startup failures, score-file corruption or anti-cheat hardening into mandatory milestones for this simple game. Babuni.dev reports no server startup or port conflict issues. Additional complexity requires a real demonstrated problem or a new Babuni.dev request.

Exploratory alternative network approaches are historical ideas recorded in [CONCEPT.md](CONCEPT.md) and [docs/DECISIONS.md](docs/DECISIONS.md), **not roadmap milestones**.
