# Changelog

## 2026-11-13 — Reaction and APM in the High scores panel

- `game.js`, `index.html` (and Android mirror): each row of the top-5 High scores panel now shows the run's average reaction time and APM (`258 ms · 214 APM`, `—` when not recorded) next to the name and points. Session time stays only in the full Game Over list.
- Phone/stacked layout: one line per run. Wide-screen right-hand column: stats on a second line under the name, so points are not cut off.

## 2026-11-13 — Public server for babuni.dev/Buttongame

- Added `server/buttongame_server.py`: serves the game and `/api/scores`, `/api/presence` under `/Buttongame/` (with or without the proxy stripping the prefix); SQLite leaderboard keeping only the best 100 (ties: earlier run first); returns the new run's `rank`; cleans names, bounds numbers, limits body size and per-IP request rate; serves only `index.html`, `game.js` and `assets/`; `list-scores` / `delete-score` admin commands.
- Added `server/build-web.sh` (upload folder with Ogg + ffmpeg-made MP3 sounds), `server/buttongame.service`, `server/nginx-buttongame-locations.conf`, `server/install-on-server.sh`, `server/publish.sh` and `server/README.md`, matching the babuni.dev server layout.
- Added `website/buttongame-qr.svg`, `website/buttongame-qr.png` and `website/buttongame-embed.html` (link "Play Button Game" with QR code below).
- `game.js` (and Android mirror): API calls are now relative (`api/scores`, `api/presence`) — same result on the Android and desktop hosts, which serve from `/`; client list limit 50 → 100; shows "Saved — #N of top 100!" / "Not in the top 100 this time" when the server reports a rank.
- Added `tests/test_public_server.py`, also run in CI.
- Deployed 2026-11-13 to https://babuni.dev/Buttongame/ (release `20261113-220747-8559e95`).

## 2026-11-10 — Documentation readability

- Rewrote the game introduction around play, LAN hosting, Android distribution, sound and actual verification boundaries. Preserved original creative history and technical records in their existing references; application code was unchanged.

## 2026-10-27 — Portfolio audit #27 (documentation only)

- Reviewed the current Button Game tree and its preserved 2009 Flash artifact, recovered original-concept documentation, three game/client generations, the Android Kotlin host, the desktop Python host and sound/Trap regressions.
- Reconciled the README's superseded “entire Trap Mode is not started” wording with the **26 October approved and committed 10% implementation**. Earlier pre-approval documentation remains readable as dated history.
- Distinguished **ten tracked Ogg recordings** from MP3 conversions reported in the separately prepared desktop sharing ZIP. The current browser fallback requests MP3 for non-Ogg browsers, but the Git tree itself has no MP3 assets.
- Preserved Babuni.dev's creative credit and explicit decision history, including corrections to previous AI delivery/signing claims.
- Touched only the eleven canonical Markdown docs. No source, script, tests, Android build, Flash media, audio, image, font, private signing material or historical root journal changed. No tests were run in this audit.


## 2026-10-26 — More reliable desktop sound playback

- **User observation:** A delivered 1.0.3-beta desktop session appeared entirely silent. Investigation of the actual share-with-nephew ZIP confirmed all ten original Ogg Vorbis files were present, nonempty, and valid. A missing-media packaging claim would be incorrect.
- **Possible causes:** Browser mute choice is persisted in `localStorage`; Web Audio preloading/decoding begins before a user gesture and silently swallowed failures; some browsers lack the same Ogg/Vorbis behavior.
- **AI changes:** When a buffer is unavailable or the audio context remains suspended, try a browser HTMLAudioElement path so the first user click can still play sounds. Choose MP3 instead of Ogg on browsers that do not advertise Ogg/Vorbis playback; stop swallowing Web Audio load/decode failures silently by warning in the browser console and updating the speaker-button tooltip. Respect existing mute preference. Add a Node regression test for sound fallback.
- **Distribution:** The refreshed desktop sharing ZIP includes **the ten original Ogg clips plus ten transcoded MP3 fallback copies**, sound troubleshooting, and the unchanged Wi-Fi host. MP3 copies are ZIP distribution assets; the GitHub source continues to hold canonical original Ogg files. No change to scoring or trap probabilities.
- **Verification boundary:** File-integrity and offline regression/HTTP checks pass; successful audible playback on Babuni.dev's/recipient's physical desktop browser still awaits testing. The exact cause of that person's silence is not asserted without their browser/audio settings.

## 2026-10-26 — Make release APK signing stable and explicitly verifiable

- **User request:** Every future update APK must install over the same Button Game app rather than forcing a reinstall and potentially losing persistent scores. Earlier updates had done so.
- **Diagnosis:** Older APKs reused the original PKCS#12 signing certificate. New GitHub Actions debug APKs were signed using different ephemeral CI certificates. Android refuses a package update across unrelated signing certificates, regardless of matching name or version.
- **Changes:** Added a local `scripts/sign-android-update.sh` helper to sign unsigned Android releases with an existing private key and require matching signer, package and increased versionCode. GitHub Actions can optionally use the original key from **encrypted repository secrets** and publishes an explicitly named signed-update artifact **only if the original public certificate fingerprint matches**.
- **Limitation:** Original P12 key is not currently available to this session; the ephemeral CI-debug key cannot be recovered from an APK. No newly original-signed update was generated. An installed debug build may need one backed-up migration before future seamless updates.
- **Testing:** Shell script syntax checked; GitHub build and optional signing path require separate validation. No game logic or Android application code changed.

## 2026-10-26 — Desktop LAN host with persistent high scores (no Android version change)

- **Observed by Babuni.dev:** Running the browser game via `python3 -m http.server 8000` allowed play but score submission failed with “Could not reach host — try again.” Babuni.dev asked whether friends could join over Wi-Fi and why rankings did not save.
- **Diagnosis:** The static Python file server does not implement Button Game's `GET/POST /api/scores` and `GET/POST /api/presence`. The failure is a missing backend, not a defect in the score-collection animation.
- **Implementation:** Added `scripts/serve-desktop.py`, a small, standard-library LAN server using the same browser client and Android-compatible score and player-presence endpoint shapes. Writes up to 50 host-owned scores with full statistics and Traps-mode flag in Git-ignored `.local-data/desktop-scores.json`. Live players expire after five seconds; public game assets alone are served to guests.
- Added integration tests, desktop CI coverage and LAN instructions, explicitly separating PC scores from Android-host scores. **No Android code, version or APK was modified** for this desktop-only feature.
- **Verification:** Local tests passed for score saving/restart, player list, field preservation and private-file restrictions; GitHub CI to be inspected separately. Babuni.dev's real multi-device LAN test remains outstanding.

## 2026-10-26 — Mode switching at Game Over and desktop sidebars (1.0.3-beta)

- **Babuni.dev tested the installed prior APK:** Traps checkbox, red instant loss, pending score collection, passive +3 numbers, the red high-score icon, and host high-score persistence across app and server restarts worked. Kept the trap probability at 10%.
- Relocated the small Traps label and checkbox to the **bottom-left of the game next to Reaction/APM and Play Again**. Remains visible at Game Over with its previous checked state; can be changed before starting a new round, but not during one. Babuni.dev discarded the idea of a trap-frequency slider.
- Made host high scores appear **before the first tap** below the game where available. On wide desktops, arrange **players/game/scores** into left/center/right columns while retaining the stacked phone presentation.
- Updated root and Android mirror assets; added test assertions; bumped version to `1.0.3-beta` (code `4`). No change to normal scoring, red probability or host persistence.
- **Release status:** Full build, original-signature continuity and installed-device visual check remain separate from source status.

## 2026-10-26 — Red Trap Button implemented in source (1.0.2-beta)

- On Babuni.dev's authorization, added the optional pre-game Traps toggle and a matching red four-hole button. The start-screen button stays normal; following spawns use a 10% independent red replacement probability.
- Untouched red targets age out and shatter using existing mechanics; active red targets emit +3 pending points every one-third second via existing floaters, physics and score fusion.
- Tapping red displays **Game Over immediately** and stops play and new passive points. Previously earned points finish collecting before score submission; session duration is frozen at the fatal tap.
- Added a boolean Traps marker in Android host-owned score persistence/HTTP and red icons by names on both leaderboard views; old records without the flag default false.
- Mirrored browser and Android assets, added a regression test and CI coverage, and bumped the Android version to **1.0.2-beta / code 3**.
- **Release distinction:** Source committed; new CI results, original-certificate signing and on-device release installation must be checked separately.

## 2026-10-26 — Author attribution

- Credited **Babuni.dev** in the README and replaced generic author-role wording throughout current project documentation; added a naming rule to `AGENTS.md`.
- This documentation-only attribution pass did not change gameplay, networking or build behavior.

## 2026-10-26 — Fix audio source packaging, re-run Android build, and accept Babuni.dev QA results

- **Babuni.dev-confirmed acceptance:** Button/Quick Strike, numerical physics/combinations, timer/HUD, sound volume and UI all tested and working. Two-device Android Wi-Fi hosting, live player list, four-stat host score persistence through hosting restart, guest score submission and three-second Game Over refresh all tested and working in the installed app.
- **Scope correction:** Do not add score-submission retry as a new feature because an old bug occurred. No actual server startup errors or port conflicts reported. Removed speculative hardening and unapproved networking ideas from the active roadmap; keep the game simple. Bluetooth and peer-to-peer remain ideas only, elsewhere in historical concept documentation.
- **Audio/source change:** Mirrored all ten original `sfx/` OGG files (including `4273.ogg`, `QuickStrikepoints.ogg`, `QuickStrikepoints1.ogg`) into `assets/sfx/` and the Android `www/assets/sfx/` bundle as exact Git blob copies. Updated `scripts/sync-www.sh` to use `sfx/` as canonical source.
- **Build:** Updated `.github/workflows/android-build.yml` to synchronize and enforce source parity, trigger on original recordings and validate the complete OGG byte payload inside both assembled APK variants. Android normal-package version now `1.0.1-beta` / code 2; no separate TEST package.
- **Verification:** [GitHub Actions 40325603457](https://github.com/babunidev/ButtonGame/actions/runs/40325603457) **passed** on [packaging commit 2fa4539](https://github.com/babunidev/ButtonGame/commit/2fa45393a9746366f80927382a628c2745b525c3). Complete web/audio sync, 10 exact OGG payload checks inside both APKs, Node leaderboard regression, native debug+unsigned-release compilation and both artifact uploads succeeded. Babuni.dev's reported device QA applies to their installed app; an original-certificate signed APK for this new source has **not** yet been produced by this change.

## 2026-10-26 — Preserve complete nine-item Red Trap Button specification

- Babuni.dev supplied a more detailed **Red Trap Button** specification and explicitly stated **entire feature not started**. The intended experience is “an optional game mode that rewards patience and punishes careless tapping.”
- Added [`docs/TRAP_MODE.md`](docs/TRAP_MODE.md) preserving all nine tasks: pre-game Traps checkbox/red icon; random red-button replacements; identical ordinary spawn position, lifespan, rotation and shatter; immediate Game Over on a trap tap; untouched trap expiry/shatter/next spawn; +3 passive points every ⅓ second (9/s); center-origin passive floaters with normal combination/expiry/fusion; host high-score mode flag; small red button beside relevant leaderboard names.
- Updated concept, design, decisions, roadmap, architecture, devlog, README, contributor and portfolio/collaboration records to distinguish this complete design from the *earlier* six-part recovered historical checklist.
- **Documentation only.** No Trap Mode feature code, host score format, UI behavior, Android asset, test or released APK was changed. The normal signed-APK release priority remains unchanged.

## 2026-10-26 — Recover original seven-category development checklist and Trap Mode

- Preserved Babuni.dev-provided historical checklist at `docs/HISTORICAL_CHECKLIST_2026-10-25.md`, keeping its seven original categories separate from the live roadmap and later AI recommendations.
- Updated concept, design, decisions, curated devlog, architecture, portfolio-content, authorship and contributor records with six recovered Trap Mode requirements: pre-game toggle/red icon; random red-button spawning; instant Game Over on trap tap; passive +3 points every 333 ms; normal floating-number physics/fusion; and trap-mode leaderboard marker.
- Recorded that compatibility with old beta scores was cancelled, native Kotlin compilation later succeeded, current time bonuses are 2/3/5/4 seconds (7/14/42/73), and the three custom sound files are in source `sfx/` but not yet in packaged web/Android asset paths.
- The full archived conversation remains inaccessible; undocumented Trap Mode edges remain unknown. Recovery does not approve implementation.
- **Documentation-only update:** no JavaScript, Android code, audio, build workflow, executable or hardware verification changed.

## 2026-10-26 — Establish full project documentation structure

- Added root `README.md`, `CONCEPT.md`, `ROADMAP.md`, `AGENTS.md`, and `docs/{DEVLOG,DECISIONS,DESIGN,ARCHITECTURE,QA,CONTENT,AI_COLLABORATION}.md` to separate Babuni.dev's vision, accepted decisions, implemented code, testing evidence and unresolved future concepts.
- Preserved the original root `DEVLOG.md` and all earlier changelog entries as historical primary sources; the structured journal is an editorial continuation rather than a replacement.
- Corrected `INSTALL.md` and `SOUNDS.md` to reflect GitHub commit `d5ce766`: three custom recordings exist under `sfx/` but are not yet synchronized into packaged web/Android assets; the separate TEST app configuration had already been removed in `c46ee3f`.
- Recorded the recovered red/trap button mention as an **unapproved concept without a recovered rule set**. Tracked unsigned native builds, original-certificate signing, physical two-device QA and host hardening as still open.
- **Verification scope:** repository/documentation audit only. No gameplay, build workflow or Android code was changed, no APK was signed or delivered, and no new device testing was performed.

## 2026-10-26 — Keep Game Over high scores live across Wi-Fi players

- **Babuni.dev-reported bug:** a guest player could submit a new high score to the Android host while the host's Game Over screen was open, yet the host's visible list did not update. This was a **client display refresh bug**, not evidence that native score persistence failed: `loadLeaderboard()` ran on Game Over entry and after the local player's own submission, while the 12-second polling condition expressly excluded `gameOver`.
- **Fix:** the host-owned `GET /api/scores` leaderboard now refreshes automatically **every 3 seconds while Game Over is visible**, including on the Android host. Resuming a backgrounded Game Over page also triggers immediate refresh. During a round, the existing subtle below-game preview still polls every 12 seconds; the idle welcome screen avoids polling. The guest submission endpoint and native `ScoreStore` are unchanged.
- Updated `game.js` and `android/app/src/main/assets/www/game.js` in lockstep. Added `tests/live-leaderboard-refresh.cjs` to verify host Game Over polling, gameplay/idle polling, replay and foregrounding, and added the regression to Android GitHub Actions. **Native debug/release build and regression passed:** [run 40245792000](https://github.com/babunidev/ButtonGame/actions/runs/40245792000). Device verification still required: after a guest submits, the host's Game Over screen should display the score within three seconds, with no restart or Play Again.

## 2026-10-25 — FULL native Android host rebuild completed and release signed

- Replaced the temporary web-asset-only APK workflow with a **working GitHub Actions Android Gradle build**, committed at `.github/workflows/android-build.yml`. It uses JDK 17, Android SDK 35 and the Gradle 8.9 wrapper to compile both Kotlin and web assets. First successful full debug build: [run 40243235351](https://github.com/babunidev/ButtonGame/actions/runs/40243235351); successful full debug+release build: [run 40243610565](https://github.com/babunidev/ButtonGame/actions/runs/40243610565).
- Downloaded the **native compiled unsigned release** artifact, verified it contains the updated `scores-v2.json` host storage compiled into `classes.dex`, and packaged the three exact supplied audio recordings (`4273.ogg`, `QuickStrikepoints.ogg`, `QuickStrikepoints1.ogg`) under `assets/www/assets/sfx/`.
- Signed the newly compiled full native release locally using the **existing** PKCS#12 project certificate, without putting the key or password in GitHub. Released `ButtonGame-Native-Host-Highscores-Full-Build.apk` (5,355,669 bytes; SHA-256 `09bfc6a34dc3f2f5dc3997b7ee5a49079b49a14f4553e9991c9de0ded1096097`). Verified APK ZIP integrity, cryptographic APK v2 signature/content digest, certificate SHA-256 `3f7a1386adb23903ebd09c54a4f7105d197b7a6611be4b5dd53c7fe5e0902392` matching prior releases, all new audio asset bytes, and native `scores-v2.json` marker.
- **Host-owned four-stat persistence is now compiled into this signed release.** The app stores name, final points, reactionMs, apm and durationMs in host app-private `scores-v2.json`. All Wi-Fi guests POST and GET the host ledger; guests never save separate high scores. Existing beta `scores.json` records are deliberately not migrated; old file is removed when the new host starts.
- Latest gameplay/web bundle includes variable jackpot time, no passive button time, quieter special SFX, later/faster shattering, Play Again, full Game Over ranking, scrollbar suppression and subtle 50%-opacity below-game live leaderboard preview.
- **Still pending:** physical host/guest Android network test and permanent upload of three user-made binary OGG files to GitHub source folders. The locally signed full release APK already includes them, but unmodified future GitHub Actions artifacts will not until repository assets are added.

## 2026-10-25 — Subtle host leaderboard preview below the playfield

- Added a **compact live high-score preview immediately below the game frame** while a round is active. It uses **50% opacity** and a **vertical transparency gradient** to reveal the first entries without obstructing the actual playfield or competing with the HUD.
- The preview shows up to five ranked players' names and point totals in a minimal, borderless layout. Its height is permanently reserved, preventing the button/playfield from jumping when host scores arrive; it has no click/touch intercepts or scrollbar.
- The preview uses only the **Android host's existing `GET /api/scores`** data. It fetches on page load and refreshes every 12 seconds during an active round. No guest-side score or statistics persistence. It remains hidden before the first tap, when scores are empty, or if the host cannot be reached.
- At Game Over the preview disappears automatically, leaving the existing full-size scrolling leaderboard and Play Again controls undisturbed.
- Web and Android APK HTML/JS assets updated in matching pairs. Automated DOM-mock tests confirmed host-only ranking, 5-row limit, no-scores and Game Over visibility, full leaderboard independence, and 50%/gradient CSS; JavaScript syntax checks passed. The cumulative APK was re-signed using the previous certificate, with ZIP and v2 content digest/signature independently verified. Device-level visual check still pending.
- **Native score-storage limitation remains:** the signed cumulative APK still embeds the original Android `ScoreStore`, which saves names and points only. The updated Kotlin `ScoreStore.kt` and `GameServer.kt` files already support Reaction, APM, session duration, and a clean v2 host ledger, but the Android SDK/native compilation step has not yet been completed. The preview therefore shows only names and points, never invented extra metrics.
- To reset scores in the **currently installed** host APK, use Android Settings → Apps → Button Game → Storage & cache → Clear storage/data (also clears the app's other local data). The future native v2 storage file is `scores-v2.json`; no in-game reset button exists yet.

## 2026-10-25 — Host-only leaderboard, hidden scrollbar, quieter sounds, later breakup

- **Corrected authoritative leaderboard model:** all Wi-Fi guests submit high scores and final Reaction/APM/session-duration values to the **hosting Android device** through `/api/scores`; browsers and guests no longer persist or augment scores in localStorage. The leaderboard renders only host responses. A failed submission stays retryable; a failed leaderboard fetch shows the host is unavailable. Player nickname and mute preferences may still be stored on each device.
- **Native host limitation:** the new Kotlin host-side `ScoreStore.kt`/`GameServer.kt` is committed and implements all four statistics, but today's APK still contains the earlier native `classes*.dex` because the Android SDK is unavailable. That APK saves **points only on the host**; host persistence of reaction, APM, and duration needs a native Android rebuild. Guest-local storage is **not** used as a substitute.
- **Game Over leaderboard:** the scoreboard scrolls with wheel/trackpad/touch, but its visible scrollbar is suppressed with `scrollbar-width:none` and the WebKit scrollbar pseudo-selector.
- **Sound balance:** reduced the three recently supplied sounds another ~3 dB in playback gain: 4273 from 0.49 to 0.35, and QuickStrikepoints variants from 0.37–0.43 to 0.26–0.30. Original OGG bytes and old sound settings remain unchanged.
- **Button destruction:** delay the start of cracks/breakup by 160ms while still accepting taps, then accelerate the entire shatter from 580ms to 420ms. Crack phase is 100ms, initial break 165ms, and shatter fade begins 325ms after breakup. The overall fade-threshold-to-new-target interval remains 580ms.
- Updated root and bundled Android web assets and verified eight current gameplay regression tests, syntax, APK ZIP entries and cryptographic v2 signature with the previous certificate. Physical Android QA remains pending.
- **Still outstanding:** commit the three binary OGG recordings to GitHub; APK already contains them. Android native rebuild to enable host-owned storage for all four final leaderboard statistics.

## 2026-10-25 — Variable jackpot time, final session stats, replay overlay, quieter special audio

- **Time rebalance:** button taps and their respawn/shatter phases no longer grant time. Exact 7, 14, 42 and 73 results award **+2s, +3s, +5s and +4s** respectively. The 21 and 37 intermediates award **0s**; their 42 and 73 results award time upon appearing at the central result position. Golden time pickups show their actual values. The existing 60-second initial round remains.
- **Session statistics:** snapshot final points, average measured reaction in milliseconds, final actions per minute (APM), and elapsed session time from the first click to final Game Over (including pending score/time settlement). No new in-game session timer. Leaderboard entries now present all four values, formatting duration as m:ss.
- **Storage:** switched browser-local scores to a fresh `buttongame_scores_v2` key, deliberately abandoning the previous beta records. Changed Android `ScoreStore.kt` to `scores-v2.json` (and delete `scores.json`), and extended `ScoreEntry` and `GameServer.kt` POST/GET to save reactionMs, apm and durationMs. **These Kotlin changes are committed as source but are NOT in the signed APK**, which currently retains the previous native score API; a full Android native build is required.
- **Legacy-host adaptation in APK:** the submitting browser/device keeps the complete score metadata in localStorage and displays its own details beside host-saved points; entries from other devices served by the old native API show missing detail as a dash rather than fabricated zero statistics. Shared Wi-Fi score metrics require recompiling the native host.
- **Play Again:** raised the button over the shared bottom Reaction/APM panel at Game Over for both local host gameplay and Wi-Fi guests. Replay resets state and starts a new local round.
- **Audio balance:** the three newly supplied clips measured ~4–6 dB louder on average than the existing clips; lowered `4273` playback gain from 0.85 to 0.49 and Quick Strike impacts from 0.62–0.72 to 0.37–0.43, retaining ordinary effects.
- Existing golden bonus bank, number physics, collision fix, 21→42/37→73 animations, Quick Strike 2× scoring and score settlement remain.
- Tests passed for all new timer amounts and transform timing, no tap-time bonus, frozen final stats, replay visibility, old-host local stat enrichment, prior special-combo and sound regressions. Signed APK ZIP/content/digest and prior signer verified. Physical Android testing remains outstanding.
- **Repository audio follow-up:** the three OGGs are included in the signed APK but still need GitHub binary-asset upload; GitHub text code is committed.

## 2026-10-25 — Three new audio recordings installed in Android APK

- Received and verified `4273.ogg` (0.937 s), `QuickStrikepoints.ogg` (0.252 s), and `QuickStrikepoints1.ogg` (0.482 s), all stereo 44.1 kHz Ogg Vorbis.
- Built an Android APK including all three recordings under `assets/www/assets/sfx/`. The previously committed sound-routing code plays `4273` exactly when the center-stage 42 assembles or 73 appears, replacing the bell for those reveals. Active Quick Strike button taps—including the activating tap—choose randomly between the two supplied impacts.
- Ordinary taps still use four impacts; ordinary jackpot milestones still choose among three bells. Existing mute setting and other gameplay remain unchanged.
- Passed JavaScript syntax, mocked sound routing, jackpot-bell, golden time-bank, and floating-number collision tests. ZIP integrity, the APK v2 signature digest, and signing certificate matching the preceding installed release were verified. No physical Android sound check performed.
- **Distribution note:** The complete audio recordings are present in the downloadable APK, but the three binary OGG assets have **not yet been uploaded into the GitHub repository**; GitHub source already includes the sound hooks. Repository checkouts need these files in `assets/sfx/` and `android/app/src/main/assets/www/assets/sfx/` to reproduce the APK.

## 2026-10-25 — Prepared special reveal and Quick Strike audio routing (audio files pending)

- Added a dedicated **`4273` reveal sound hook** for the assembled 42 at the upper-center `Smash it!` position and for the 73 when the 37→73 flip reveals the new digits. It **replaces** the normal bell at those two moments rather than doubling the playback. The original bell still plays when floating totals first reach 21 and 37.
- Prepared two randomly chosen Quick Strike tap recordings: **`QuickStrikepoints`** and **`QuickStrikepoints1`**, used from the *activating first tap* and all later taps while Quick Strike remains active, including during shattering. Ordinary taps keep the original four random impacts.
- Audio preload now includes `assets/sfx/4273.ogg`, `assets/sfx/QuickStrikepoints.ogg`, and `assets/sfx/QuickStrikepoints1.ogg`. Existing sound mute, volume architecture, and other jackpot bells remain unchanged.
- **Audio assets not yet supplied** (not in the conversation files or GitHub). Until those exact files are added, the game falls back to the former random bell for special reveals and ordinary impact for Quick Strike. This is **code wiring only, not an audio-complete APK release**.
- Node sound-routing, existing milestone-bell, special 21→42, golden-bonus, and JS syntax tests passed on the locally mirrored source. Audio content and Android playback cannot be validated until the recordings are received.

## 2026-10-25 — Bell on every jackpot milestone

- Combination bells now sound **each time a merged floating number reaches exactly 7, 14, 21, 37, 42, or 73**. Previously a merged lineage remembered its first bell, silencing later milestones (e.g. 7 → 14), and any value >=7 could ring regardless of eligibility.
- Each eligible number plays a **randomly selected one of the existing three bell recordings**, with the same small pitch and volume variation.
- The special **21 → 42** rings for 21 when reached and again when its fully assembled 42 appears; **37 → 73** rings for 37 when reached and again when the digits flip to 73.
- Normal 42 and 73 jackpots ring once when those values are reached. Removed redundant bells from the generic jackpot and special animation entry points, so a single milestone cannot play two bells simultaneously.
- No changes to impact sounds, master mute preference, scores, golden time bonuses, combination visuals, physics, or multiplayer.
- Node simulated-frame sound regression tests passed for 7 → 14 → 21 → 42, 37 → 73, natural 42 and 73, and silent non-eligible values 8, 22, and 75. Existing physics, special-combination, and time-bank tests passed. APK ZIP integrity and v2 cryptographic signature/content digest verified against prior build using the same certificate. Physical device sound testing pending.

## 2026-10-25 — Full-label floater collisions and slower numerical growth

- Fixed floating-number wall and HUD collisions so they account for the **entire displayed +N label**, including all digits, its actual DOM-measured width/height, CSS scale, and rotation. Previously collisions used a small radius derived from font size, allowing second/third digits to clip outside the field.
- Use the rotated text's full axis-aligned bounding rectangle for wall and HUD contacts. After HUD collision resolution, re-clamp the entire label within the 450px stage, maintaining a small edge margin.
- Slowed floating-number **visual size growth**: `+1` remains 26px, later font sizes rise more gently to a 38px cap instead of 46px; merged scale grows gradually to at most 1.55× instead of 2.4×. Eligible linger growth is reduced.
- Slowed floating-number **value growth**: newly spawned floaters wait 120ms before merging, and every completed merge imposes a short recovery period that increases with the total (roughly 480–780ms). Each floater can participate in at most one merge per frame, avoiding runaway same-frame chains into high values.
- Preserved actual point totals, bonus eligibility, 21→42 and 37→73 specials, green score collection, golden time transfer, and current compact HUD.
- Verified 1–4-digit rotated labels at all field edges, actual measured glyph widths, gradual merger pacing, eventual successful merging, and unchanged 21/37 triggers in a simulated DOM; existing 21→42 and golden bonus bank regression tests passed. Rebuilt APK, verified ZIP content and APK v2 signature/digest with the prior update's certificate. Physical Android visual testing pending.

## 2026-10-25 — Mirrored compact HUD and unified Reaction/APM panel

- Slimmed the Points and Time panels from a 7.75rem baseline to 6.25rem, reduced their horizontal face padding, and moved them from a 22px inset to **10px from their frame edges**, flush with the inner stage boundary.
- The **Time panel is anchored at the right edge** and its golden +seconds bank moved to its **left**, mirroring Points on the left and its green +points bank on the right. Both green and gold balances remain outside the chamfered panels and preserve their existing transfer behavior.
- Replaced the separate lower-left Reaction and lower-right APM boxes with **one 15.5rem bottom-center plate**. Reaction is left-aligned, APM right-aligned, with a thin full-height cyan dividing rule.
- Adjusted physics' stage-space HUD collision bounds for the new two-corner-plus-bottom-center arrangement, including room for the bonus banks, so ordinary floating numbers avoid the relocated panels.
- No point scoring, timers, bonuses, game-state, multiplayer, or Quick Strike behavior changed.
- Verified new DOM IDs and ordering, single divider and bottom plate, frame-edge offsets, Node syntax, 21→42 animation, golden time-bonus bank, APK archive integrity and matching prior APK signing certificate. Headless browser screenshot did not complete in this environment; Android visual testing pending.

## 2026-10-25 — Physical 21 → 42 bounce-and-transform animation

- Reworked the special **21 → 42** animation: exactly **21 normally sized “1” digits** burst from the merged 21 at high velocity, bounce visibly against the 450px stage's four walls, and keep moving freely for approximately **1.14 seconds**.
- Starting about 630 ms after the burst (staggered over 220 ms), each of the 21 “1” digits turns into an equally legible **“2”**, while continuing to bounce. The result is twenty-one 2s, representing 42 total points—**not forty-two 1s or 42 scoring floaters**.
- All twenty-one 2s then travel inwards over approximately 690 ms and assemble into the same large golden 42 at stage center-top (225,110) as the 37→73 special's “Smash it!” position. The 42 holds for 360 ms, then turns green and shrinks during a 250 ms transition before entering the normal green score pickup/bank pipeline.
- Maintained the enlarged 2.64× special-combo size and exact **42-point single payout**, existing +3s golden time bonus, 37→73 animation, and end-of-round settlement/reset safety.
- Verified fast wall rebounds, full-size singles, transformation of all 21 units without duplicate elements, final assembly, single +42 credit, Game Over settlement, Play Again cleanup, golden-time-bank regressions, and 37→73 regressions with deterministic Node simulations. APK signature-v2 content digest/identity and ZIP checks passed; physical Android visual testing pending.

## 2026-10-25 — Golden time-bonus HUD and eligible combo glow

- Eligible floating combination totals **7, 14, 21, 42, 37 and 73** receive the same golden glow as the +3-second bonus pickup while they remain eligible. The glow is removed if the floating number merges into a noneligible total or enters its green score-collection phase.
- Both upper-center special displays (37 → 73 and 21 → 42) glow gold until their final green score pickup phase.
- Added a persistent-position **golden `+Ns` time bank to the right of the Time HUD**, mirroring the shared green score bank. The right-side readout is hidden when empty.
- Golden +3s pickups now fly through the foreground HUD overlay to the golden time bank, rather than being hidden behind the Time HUD or immediately changing the timer on arrival.
- New +3s arrivals merge with the current bank, even while its balance is counting down. The first deposit pauses 350 ms, then banked seconds feed into the timer at 4 seconds per real second, preserving the exact time total without double-awarding. As the golden balance decreases, the timer increases.
- Game Over waits for all inbound time flights **and any remaining banked seconds**, preventing a round from ending before earned time is credited. Play Again clears the time bank and its in-flight pickups.
- Preserved 21 → 42 and 37 → 73 exact green scoring, Quick Strike effects, and score-fusion behavior.
- Tested with a mocked DOM and simulated frame clock: 3+3+3 incoming seconds, mid-drain deposits, 9 seconds of exact deadline credit, foreground pickup placement, gold-on-merge and cleanup, late-game time settlement, Play Again reset, and existing 21/37 specials. APK ZIP and unchanged signing identity validated. Physical Android visual behavior not yet verified.

## 2026-10-25 — 21 → 42 scatter, duplicate, and fuse

- Replaced the generic jackpot behavior for floating **21** with a new special transformation: explode into **21 individual “1” units**, duplicate into **42 visible units**, then gather them at the upper-center “Smash it!” location into one enlarged **42**.
- The assembled **42** holds briefly, glows green, shrinks, and enters the existing green score pickup and shared score-bank countdown flow. It awards exactly **42 points once**, rather than the prior 21+42 generic jackpot total.
- The **37 → 73** special’s upper-center number is now **20% larger**, from 2.2× to 2.64×, and the new assembled 42 uses the same 2.64× scale at the same stage coordinates (225,110).
- All 21/42 visual pieces stay outside normal physics scoring, so they cannot merge into additional unintended jackpots; natural 42 and 73 totals retain existing generic jackpot behavior.
- End-of-round settlement waits for in-progress 21→42 fusions and their green pickups. Play Again cancels all active special fragments.
- Verified deterministic Node tests for 21→42 phases, exact 42 payout, normal green bank transfer, retained 37→73 payout, round-end settlement, and reset. Signed updated Android APK with the original signing certificate and checked ZIP integrity; physical Android display testing is pending.

## 2026-10-25 — “Smash it!” greeting and 37 → 73 reversal

- Changed the initial and Play Again guidance from “Klick druff da!!!” to **“Smash it!”**.
- A merged floating value of **37** no longer triggers the generic doubled jackpot. Instead its live number rises to the upper-center `Smash it!` position (stage x=225, y=110), enlarges, flips to display **73**, holds, then turns green.
- After the transformation, **73 points enter the existing foreground green score-fly pipeline immediately**, without a second floating lifespan; the shared score balance then transfers those points to the final total.
- The exact **73-point payout replaces** the original 37 payout (which previously credited 111 total). Reversed 73 does not re-trigger the separate 73 jackpot; the 21/42 and natural 73 combos keep their existing effects.
- Game Over waits for any in-progress 37 reversal and its outgoing score flight; Play Again cancels outstanding reversal animations.
- Verified using Node syntax and deterministic runtime tests: merged 20+17, movement, reversal, green phase, exact 73 credited once, no double-credit, round-end settlement and reset. The Android APK was signed with the same certificate as previous releases; device visual testing is still pending.

## 2026-10-25 — Correct reaction timing

- Excluded the initial page-load button's first tap from Reaction statistics, including when starting a new round with Play Again. The Reaction panel remains “—” until a subsequent button contributes a valid sample.
- Measure the interval from completion of the **320 ms spawn animation** to the **first tap** of each subsequent button, rather than measuring from the start of spawning.
- First taps during spawn-in do not count as zero-millisecond reaction samples. Repeated hits to the same button are still ignored for the average.
- Keep the existing **73 ms Quick Strike window**, 150% spin, green dot and per-tap double-point reward intact, including possible Quick Strikes on the initial button.
- Verified with simulated-clock tests covering first load, reset, 319/320/393/400 ms timing and reaction averages; rebuilt from the prior signed APK using the same signing certificate and verified APK v2 signature, digest and file integrity. Device-level testing remains pending.

## 2026-10-25 — 150% Quick Strike spin

- Increased the successful Quick Strike animation to **150% of the button's normal size** for the first 60% of its existing 290 ms spin, then smoothly returned to 100% by the end.
- Retained the ordinary **110% tap pulse**; consecutive taps do not stack scaling beyond the Quick Strike peak.
- Quick Strike eligibility (73 ms after 320 ms spawn animation), green emitter and double points per tap remain unchanged.
- No enlargement is triggered automatically by the shatter effect.
- Validated JavaScript syntax, simulated animation-scale transitions, repeat taps and shatter behavior, and APK ZIP integrity plus v2 signing digest with the same certificate as the preceding release. Physical Android visual testing remains pending.

## 2026-10-25 — Quick Strike reward and timing

- Quick Strike opens **after** the button's existing 320 ms spawn-in animation completes, and remains available for 73 ms (320–393 ms after spawn).
- Only the first tap on a new button can activate it; presses during spawn-in or after the narrow window do not qualify.
- A successful Quick Strike retains the existing spin, flash and pulse, and now makes the central point-source dot **glow green** for that button's remaining lifespan, including its destruction sequence.
- Every tap on that qualifying button creates **+2** floating points instead of +1, including repeated taps and taps during shattering. The existing delayed score collection and green score-bank fusion are unaffected.
- The emitter changes back to cyan on the next spawn, restart, or Game Over.
- Tested strict 319/320/393/394 ms boundaries, repeat/shatter doubling, deferred scoring and next-spawn reset in deterministic Node tests. Repacked signed Android APK preserves the previous signer and passes APK v2 content digest and ZIP integrity checks. Physical Android testing pending.

## 2026-10-25 — Pulsing central point-source dot

- Added a tiny, 6 px cyan-white glowing dot directly at the center of the 450 × 450 game field, where normal floating score numbers originate.
- The emitter gently pulses its glow and size on a 2-second cycle, with a faint radial halo.
- The marker stays underneath floating point values and does not catch mouse or touch input. The reduced-motion setting disables the pulse.
- Changes are CSS and HTML only; score fusion, button behavior, time bonuses and multiplayer are unchanged.
- Android package repacked from the prior foreground-score update and signed with the same certificate. APK ZIP integrity, unchanged gameplay JavaScript and signature-v2 content digest verified. Visual behavior on a physical Android device not yet verified.

## 2026-10-25 — Foreground score pickups and right-hand bank

- Move the combined green points bank outside and directly to the right of the Points HUD's chamfered box, at the same 22 px number size as the white total. The panel no longer expands to enclose the bank.
- Render incoming green score pickups in a dedicated frame-level overlay above HUD panels, avoiding clipping and the old behind-the-panel stacking order.
- Use transformed screen-to-frame coordinate conversion so score pickups fly accurately from stage points to the new bank position under responsive frame scaling.
- Preserve the accumulating green bank, ongoing green-to-white countdown, pending-score conservation, score timing, shatter and randomly rotated button spawning.
- Verified delayed collection, concurrent bank deposits, jackpot conservation, Game Over settlement, flight parent/coordinates in mocked runtime, JavaScript syntax, APK ZIP integrity and matching v2 signing certificate; full visual/phone validation remains pending.

## 2026-10-25 — Random button orientation at spawn

- Each newly spawned turquoise jacket button receives an independently chosen starting angle between -45° and +45°, including first page load, subsequent spawns, and the first target after pressing Play Again.
- The angle is stable for the target's full lifespan. Quick Strike spins remain relative to that baseline orientation.
- Crack overlay and all 14 shatter fragments inherit that same orientation because they are rendered inside the rotated button element, varying the final break without modifying the shatter timing or collision area.
- Existing tap pulse, score fusion, and network rules are unchanged.
- Verified initial/reset/60 respawns and unchanged shatter orientation in simulated runtime, JavaScript syntax, archive integrity, and v2 certificate consistency with the prior signed APK. Physical Android gameplay remains untested.

## 2026-10-25 — Shared in-panel score bank

- Green point pickups now travel **inside the Points HUD**, to the right of the total score, instead of lining up outside the panel.
- Their text uses the **same 22 px font size and baseline** as the white score total.
- Every arriving pickup is **added into one shared green +N bank**; arrivals aggregate even while the bank is transferring units into the white score.
- The bank pauses briefly when first filled, then counts down at an adaptive rate while the total counts up by exactly the removed amount; subsequent deposits never interrupt an active countdown.
- The target is measured from the actual HUD position so flight paths follow responsive layout changes.
- Resets and Game Over account for all incoming flights and remaining bank values. Preserved special-combo, shatter and audio behavior.
- Automated deterministic tests confirmed overlapping deposits, conservation across taps and jackpots, round-end settlement, and bank hiding at zero. APK v2 certificate/digest and ZIP integrity verified; device-level rendering remains untested.

## 2026-10-25 — Deferred points and green score fusion

- Replaced immediate per-tap score increases: each tap creates uncredited floating points that can merge until their lifespan ends.
- At the end, earned numbers turn green, shrink and travel to the score HUD, pause briefly, then count down in sync with the total score counting up.
- Removed the old pop-and-fade ending for scoring floaters; values are conserved across merged and simultaneous transfers.
- Preserved jackpot bonus arithmetic by deferring both pending base points and the jackpot bonus until the inert jackpot display finishes. Cosmetic 1-shards cannot credit the same tapped points again.
- The round locks taps at zero time and waits for any pending scoring transfers before showing Game Over or submitting a high score.
- Kept existing time-bonus flow, multiplayer presence, jacket-button tap pulse and shatter behavior unchanged.
- Verified JavaScript syntax, score conservation for normal taps and jackpot, timer-expiry settlement with a simulated JavaScript clock, APK ZIP integrity and APK v2 signature using the prior signing identity. Actual Android-device installation and visual animation performance remain untested.

## 2026-10-24 — Tap size pulse

- Each button press now briefly scales the turquoise jacket button to 110% of its normal 62 px artwork and eases it back to 100% over 145 ms.
- Keeps the existing white hit flash and Quick Strike spin; rapid repeated presses retrigger the pulse.
- The button stays fully opaque for its remaining lifespan. The staged crack/separation/shatter animation does not independently enlarge the button; scoring during the pop remains available.
- Signed the new Android APK with the same certificate as the previous shatter update. Confirmed JavaScript syntax, a headless browser press/repeat test, and the APK v2 signature and digest. Physical-device verification pending.

## 2026-10-24 — Button shatter sequence and tap feedback

- Replaced the previous enlargement-and-particle effect with five clearly ordered destruction stages: intact, cracked, separated into the actual button's vector pieces, scattered, and faded.
- The turquoise button, four black holes, and white rings remain part of each clipped fragment. No unrelated glowing particle burst.
- The button remains at its regular 62 px artwork diameter and 100% opacity throughout its clickable lifespan. Destruction does not enlarge the button or create a screen-filling white flash.
- Every tap produces a brief bright, desaturated Quick Strike-style flash. Quick Strikes retain their spin.
- Presses on the original target area continue awarding points during every stage of its roughly 580 ms destruction.
- Preserve existing timer, scores, multiplayer, audio, and Android hosting mechanics.
- Browser-tested normal tapping, full opacity, crack and scatter stages, scoring during destruction, and clean respawn; APK ZIP integrity and v2 signing digest verified. Physical Android-device testing not performed.

## 2026-10-24 — Earlier button revisions

- Replaced the original two-hole ball graphics with a turquoise four-hole jacket button with two white rings.
- Increased its artwork from 56 px to approximately 62 px (10%).
- Added a first destruction prototype and made every press flash. Superseded the earlier scaling/fading prototype with the staged effect above.

## 2026-10-24 — HTML5 remake and LAN hosting

- Added HTML5 gameplay, animated floating score combinations, sounds and bonuses.
- Added Android Wi-Fi hosting, QR-code browser joining, leaderboard, and per-player live score/time/reaction/APM display.

## 2026-11-13 — License and rights

- Established MIT for original game code, with art/audio separately treated and updated repository documentation to explain the permission boundary.
- Preserved third-party authorship and external assets' separate terms. No gameplay or runtime verification is claimed.
