# Button Game — Verification and Release Status

## 2026-11-13 — Public server (local tests only)

- `python3 -m unittest tests/test_public_server.py tests/test_desktop_host.py`: 13 tests pass — best-100 trimming with ties and rank, database holds exactly 100 rows, persistence across restart with all fields incl. Traps, name/number cleaning, base path with and without prefix and redirect, GET/HEAD allowlist (no repository/database files, no `..`), bad bodies, per-IP 429 limit, presence, admin delete.
- `node tests/*.cjs` (3 regressions) pass; `node --check game.js` passes; Android mirror `game.js`/`index.html` byte-equal after `scripts/sync-www.sh`.
- Headless Chromium against the built bundle (`dist/buttongame-server`, mock scores) at desktop and phone size: `/Buttongame` redirects, no failed requests or page errors, top scores and live players render; one real round played and submitted showed "Saved — #6 of top 100!". MP3 served as `audio/mpeg`. Screenshots in Babuni's local development-screenshot collection.
- QR code PNG decoded with OpenCV → `https://babuni.dev/Buttongame/`.
- nginx 1.27 (podman) with a copy of babuni.dev's site template plus the include inserted by the `install-on-server.sh` sed: `nginx -t` OK; `/Buttongame`, `/buttongame`, `/buttongame/` → 301 `/Buttongame/` (query kept); game, `game.js`, MP3, API 200; `AGENTS.md` 404; website `/` 200 and unknown page 404; single `X-Content-Type-Options`/`Referrer-Policy`/`Cache-Control` headers; 20 KB POST → 413; switching the `current` symlink served the new `game.js` without restart; per-IP limit through the proxy gave 429 after 20 posts.
- Not run: `install-on-server.sh` itself (needs root and systemd on the server) and `publish.sh` (no access; the agent's read-only SSH check was declined by the permission system).
- **Not verified:** real deployment, HTTPS proxy, other networks, iPhone sound, load from many players.

## Desktop sound investigation

The shipped 1.0.3 share-with-nephew ZIP contained all ten expected Ogg files. Each was detected as valid Vorbis media; missing files are **not** established as the cause of the user's silent session. New audio regression verifies fallback to the native audio element if a Web Audio buffer/context is unavailable, choosing MP3 for browsers lacking Ogg support and respecting mute. The refreshed desktop ZIP includes matching Ogg and MP3 tracks and a dedicated audio help file.

**Outstanding:** Ask Babuni.dev to confirm sound on the actual browser, check the in-game speaker (saved mute setting) and browser/system output if still silent. Offline tests do not prove real speakers emit audio. No new APK is signed from this fix.

## Android APK upgrade signing gate

A Button Game APK is only a verified **in-place update** when it has the same `com.babunigaming.buttongame` package ID, **higher versionCode**, and **identical signing certificate** to the currently installed APK. A new helper `scripts/sign-android-update.sh` checks these properties, and the optional encrypted-secret CI signing step checks the historical original-release public SHA-256 fingerprint before publishing its special update artifact.

**Testing limits:** The new Bash helper passed syntax validation. Neither original signing material nor the old CI-debug private key is available here, so an actual original-key-signed Android APK has **not** been produced. Never claim a regular CI-debug APK is a compatible update, and do not uninstall a working app without first preserving and verifying its host high scores.

## Signing comparison and developer-only score transfer

Direct certificate-byte comparison of the **previous 1.0.2-beta debug APK** and newly compiled **1.0.3-beta debug APK** found **different SHA-256 signing certificate fingerprints**. An in-place debug APK update between these specific versions is therefore not possible. A newly compiled APK being correct does not justify uninstalling a working host and losing scores without a backup.

Added `scripts/transfer-host-scores.py` to export the host's existing `GET /api/scores` list and restore it via sequential `POST /api/scores` submissions on an empty new host. A local mock HTTP server test exercised backup and restore and confirmed score + trap metadata conservation. This developer utility was **not** tested against a real phone yet; [INSTALL.md](../INSTALL.md) gives protective step-by-step instructions.

## Desktop Wi-Fi host — implementation and test scope

**Cause of failing localhost scores:** The previously suggested `python3 -m http.server 8000` host supplies only public static game files and cannot handle `POST /api/scores` or presence requests, so the browser reports “Could not reach host — try again.” This was confirmed by matching the web client API calls with the Android host implementation.

**New backend tests:** `python3 -m unittest discover -s tests -p test_desktop_host.py` passed locally, covering score/Traps record submission, leaderboard sorting, persistence after desktop host restart, live player seats/labels, invalid requests, and preventing LAN access to private Git files and score data. CI now runs the same test. The earlier Android application was **not rebuilt** for this desktop-only change.

**Still unverified:** Actual Nobara firewall/network reachability from a second device, and user-observed persistence on their machine. Public internet readiness is not claimed; this host is intentionally restricted to trusted local networks.

## Babuni.dev's installed Trap Mode acceptance and the next layout check

**Reported device-tested on 2026-10-26 (installed 1.0.2-beta):** red taps immediately end play; pending points collect before submission; trap's +3 points pulse roughly every third of a second; mode icon appears on the leaderboard; hosting scores persist across closing/opening the app and stopping/restarting the Wi-Fi host. The 10% chance is approved for ongoing testing.

**Changed in 1.0.3-beta source (awaiting new-device visual check):** checkbox beside Reaction/APM/Play Again, mode switch available at Game Over, saved leaderboard shown before starting, and desktop players/game/high-score columns. Do not conflate successful native CI with physical verification of these layout changes. To update in place without losing host scores, the new APK must match the installed app's signing certificate.

**Update — 26 October 2026:** Babuni.dev subsequently authorized full Red Trap Button implementation at **10%** replacement probability, with immediate Game Over and conservation of already-earned pending points. The feature is **implemented in GitHub source**, and the native Android compilation and new trap regression passed in [Actions run 40365295833](https://github.com/babunidev/ButtonGame/actions/runs/40365295833). Any earlier language below saying this mode is not started or not authorized records the **historical status at that time** and is superseded. An Android APK signed with the original release certificate and physical Trap Mode verification remain **pending**. See [the current Red Trap Button specification](TRAP_MODE.md).

**Updated 26 October 2026.** Distinguish **Babuni.dev-tested installed application** from **new source build**, CI verification and installation of a new signed APK.

## Babuni.dev-confirmed physical tests

Babuni.dev reported directly on 26 October 2026 that the following were **tested and work** on actual devices:

| Area | Reported result |
| --- | --- |
| Target graphics, spawn, Quick Strike, shatter and both strike sounds | Tested; works |
| Floating-number collisions/fusion/score collector and special 21→42 / 37→73 | Tested; works |
| Timer bonuses, timer balance, HUD, Game Over, layout and replay | Tested; works |
| Guest → Android-host score POST and shared ranking | Tested; works |
| Already-open Game Over leaderboard auto-refresh | Tested; refreshes every 3 seconds |
| Four final statistics persisted with scores | Babuni.dev reports saved correctly |
| Hosting restart persistence | Tested; survives restart |
| Two-device Wi-Fi play, live player list and statistics | Tested; works |
| Sound volume, gameplay and interface on actual phones | Tested; works |
| Server startup and port collisions | No incidents reported in actual use |

These are **user observations**, not independently instrumented logs. They remove repeated manual testing from the active to-do list for the **already-installed working version**.

## Code / CI evidence

- Previously compiled Android debug and unsigned release APKs: [GitHub Actions 40247849170](https://github.com/babunidev/ButtonGame/actions/runs/40247849170), **passed**.
- The guest Game Over three-second refresh regression is committed in `tests/live-leaderboard-refresh.cjs`.
- On 26 October 2026, source packaging and CI checks were updated: all original OGGs are mirrored into both browser and Android web assets; CI will compare source/mirror bytes and check the **10 actual OGG payloads in both assembled APKs**.
- The new release candidate is `versionCode = 2`, `versionName = 1.0.1-beta`, under the unchanged `com.babunigaming.buttongame` application ID.
- **Latest build verification: PASSED.** [GitHub Actions 40325603457](https://github.com/babunidev/ButtonGame/actions/runs/40325603457) completed successfully for source commit [`2fa4539`](https://github.com/babunidev/ButtonGame/commit/2fa45393a9746366f80927382a628c2745b525c3). All steps passed: original-OGG synchronization, root/Android source parity, JavaScript/leaderboard regression, Gradle debug+release compile, APK contents and exact OGG byte checks, both artifact uploads. Artifacts: `ButtonGame-Native-Android-Debug` and `ButtonGame-Native-Android-Release-Unsigned`.

## Only remaining release checks

1. **Done:** source-synchronized latest Gradle debug/unsigned-release build, Node regression and all ten exact packaged OGGs passed in run 40325603457.
2. Original-certificate sign the new **release** artifact outside GitHub; never expose signing material.
3. Verify exact APK package identity, signer, version, file integrity, and ordinary upgrade installation; quickly open the new build and confirm audio/gameplay/Wi-Fi still work.

A debug-signed APK or unsigned CI artifact is not an update for the installed release-signed app. A new signed release has **not** been produced by this source/CI change.

## No unnecessary QA scope expansion

No additional score retry feature, contrived server conflict reproduction, advanced anti-cheat, or new multiplayer architecture is required for this user-tested casual game unless a concrete issue arises and Babuni.dev asks to address it.

Trap Mode is **implemented in source and CI-compiled**, but physical device verification and an original-certificate-signed installable update remain open.
