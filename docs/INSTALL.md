# Button Game — Android Installation and Build

## Always-upgradable Android APKs — signing policy (26 October 2026)

Android updates require the **same application ID**, **higher versionCode**, and **the same signing certificate as the currently installed app**. Earlier Button Game upgrades worked because we reused Babuni.dev's original signing key, `Buttongame-signing-keystore.p12`. GitHub Actions' ordinary debug builds generate new keys; those debug APKs **cannot reliably replace earlier installs**.

**Current limitation:** The original P12 private key is not available in this workspace. Nor is the temporary private key from the 1.0.2-beta debug APK. If the phone currently runs that debug build, the original signing certificate **cannot** directly upgrade it. Android offers no safe bypass. Preserve scores using [scripts/transfer-host-scores.py](../scripts/transfer-host-scores.py) before a **one-time** reinstall with the permanent original signer, then all subsequent higher-version releases using that signer can update normally.

**Safe local update signing:** Obtain the latest **unsigned release APK**, your **original private P12**, and a reference APK signed with the same certificate as the app currently on the phone. With the Android SDK's `aapt`, `zipalign` and `apksigner` on PATH, run:

```bash
bash scripts/sign-android-update.sh app-release-unsigned.apk \
  "/private/path/Buttongame-signing-keystore.p12" \
  previous-installed-version.apk \
  ButtonGame-update.apk
```

The signing tool prompts for your password; **never paste it into chat, command arguments or GitHub**. The helper checks the reference APK's signature, matching package name, increasing versionCode and matching **new** signer. It refuses to output an incompatible APK. The previous APK must actually represent your installed app's signing identity.

**Optional automatic updates from GitHub:** The workflow now supports uploading an `ButtonGame-Update-Original-Signing-Key` artifact **only after you configure encrypted GitHub Actions secrets** for the original P12: `BUTTON_GAME_KEYSTORE_B64` (base64-encoded P12 bytes), `BUTTON_GAME_KEYSTORE_PASSWORD`, optionally `BUTTON_GAME_KEY_ALIAS`. This is opt-in; signing material stays outside the public repository. The runner verifies that the signed result matches the historically verified original public certificate SHA-256 `3f7a1386adb23903ebd09c54a4f7105d197b7a6611be4b5dd53c7fe5e0902392`. With secrets absent, GitHub continues to provide debug and unsigned APKs but **no genuine original-signed update**.

**Do not uninstall your current app as a routine update step.** If you are using an old debug signer we no longer possess, first back up host high scores, verify the backup and make the one-time migration only after the correctly signed replacement exists.

Developer / creative direction: **Babuni.dev**. Current normal package: `com.babunigaming.buttongame`.

## Pull the newest code locally

In the existing Button Game Git repository, after checking `git status -sb` for uncommitted changes:

```bash
git pull --ff-only origin main
```

This updates the local **source**, not the already installed Android app. The older personal stash remains separate; do not blindly apply it over newer overlapping files. A new Android app needs a new compiled APK and a matching signing certificate to upgrade in place.

## Desktop hosting with persistent high scores (26 October 2026)

**Use this instead of** `python3 -m http.server 8000` if you want saved high scores, live players and LAN guests:

```bash
python3 scripts/serve-desktop.py
```

Open **http://localhost:8000/** on the hosting PC. From another phone or computer on the same reachable Wi-Fi/LAN, open **http://YOUR_COMPUTER_IP:8000/**. Find your computer's IPv4 address with `hostname -I` on Linux and use that LAN address, **not localhost**, on guest devices. Keep the host terminal running; **Ctrl+C** stops it. If guests cannot connect, check the PC firewall's TCP port **8000**, routing and Wi-Fi client isolation before changing game code.

The new server uses only Python's standard library. It serves `index.html`, `game.js` and public `assets/` and implements the same JSON paths used by the Android host: `GET/POST /api/scores` and `GET/POST /api/presence`. As on Android, the **host machine** owns one score list; connected browser guests submit scores to the host and see live player statistics. Desktop scores are saved at `.local-data/desktop-scores.json` (Git-ignored and never served over HTTP). They persist through restarts of this Python server. They are **independent of Android app scores**.

Why the old command failed: `python3 -m http.server 8000` returns a 404/unsupported response to `POST /api/scores`, which the client reports as **“Could not reach host — try again.”** It serves static files but implements no score or presence API. It **can** serve static pages over the LAN, but without shared rankings.

**Security boundary:** The desktop host is for a trusted local network only. No accounts, authentication or internet-hardening have been added. Do not expose port 8000 directly to the public internet. Serving only the public game assets prevents LAN guests from fetching the repository's local `.git`, `.local-data`, documentation and private files. For a public website, a separate supported/deployed server design is needed.

**Testing:** Local integration tests cover saving scores, preserving all four score statistics and Traps flag, sorting rankings, restarting the server, connecting players, and blocking private file access. GitHub Actions runs `python3 -m unittest discover -s tests -p test_desktop_host.py`. Physical two-device desktop hosting remains an acceptance step for Babuni.dev.

## Play on a desktop computer (static-only alternative)

The game is already a browser game. For **static-only play with no shared saved scores**, you can run:

```bash
python3 -m http.server 8000
```

Open **http://localhost:8000/** in a desktop browser. The game itself works; the simple static server does **not** provide `/api/scores` or `/api/presence` endpoints, so it cannot save shared scores or show live players. For those multiplayer features, connect your desktop browser to the **Serve on Wi-Fi** address displayed in the Android host app. On wide landscape screens, connected players appear to the **left**, the game is in the center, and host high scores appear to the **right**.

For sharing publicly later, `index.html`, `game.js`, and `assets/` can be served by a web host. A public score service would be a separate project from the existing Android-only host leaderboard. Stop the local Python server with **Ctrl+C**.

## Version and signing warning

New interface/layout source is **1.0.3-beta (versionCode 4)**. CI-produced debug APKs may use a newly generated debug certificate **on each runner**, so one CI debug build may not be able to update another one without uninstalling. A release-signed app certainly cannot be replaced by a differently signed debug APK. To keep the installed host scores, locally sign the new unsigned release with the **same key as the currently installed version**. Never upload private signing material.

## Preserve host high scores before switching between differently signed APKs

**Verified signing incompatibility:** The GitHub-built 1.0.2-beta debug APK delivered earlier and the new 1.0.3-beta debug APK have **different signing-certificate fingerprints**. Android cannot perform a normal in-place update between those specific binaries. Uninstalling an Android app can erase the host-owned saved high scores, even though they survive ordinary app and hosting restarts.

If you have the *same certificate/private key used for the version currently installed*, locally signing the new unsigned release APK with that key is preferable. If you instead choose to uninstall and install a new debug APK, save the scores **first** while the old app's **Serve on Wi-Fi** host is running. The included utility uses the existing score API, preserving names, points, Reaction, APM, session duration and Traps-mode flags; it does **not** modify gameplay:

```bash
python3 scripts/transfer-host-scores.py backup http://PHONE_IP:8766/ scores-backup.json
```

Replace `PHONE_IP` with the IP address displayed in the old Android host. Keep `scores-backup.json` locally; the backup command refuses to overwrite an existing file. After installing the new app, enable Serve on Wi-Fi again and restore to its **empty** score list:

```bash
python3 scripts/transfer-host-scores.py restore http://PHONE_IP:8766/ scores-backup.json
```

The restore refuses to run if the new host already contains scores, to prevent duplicate imports. A local mock-server test verified backup/restore of scores and the Traps flag, but this is **not** proof of a physical-device transfer. Do not uninstall the old app until you have successfully backed up and checked the file.

## Host a session

1. Install a correctly **release-signed** APK of the normal Button Game package.
2. On the host Android phone choose **Serve on Wi-Fi**.
3. Guests join the displayed `http://<host-ip>:8766/` URL or scan the QR code while on the same reachable network.
4. Play from host and guest. The Android server owns the high-score database; guests submit final scores to it.

Babuni.dev has tested host-and-guest Wi-Fi play, live player statistics, high-score submission and automatic Game Over refresh on two actual devices and reports them working.

## Release APK versus CI artifacts

The current GitHub Actions workflow builds an installable **debug-signed** APK and an **unsigned release** APK. Neither is an upgrade to an existing app signed with Babuni.dev's original release certificate. The historical independently signed APK documented in `DEVLOG.md` preceded the most recent guest Game Over refresh change; do not claim it is the newest update.

The earlier unrequested **`TEST` package variant has been removed** (commits `31c2718` / `c46ee3f`); current debug and release variants have the same base app ID, but different signatures. Attempting to install a debug APK over a release-signed copy will fail certificate matching. Babuni.dev does **not** require preserving expendable beta test scores; uninstalling may discard them, but is not itself a substitute for verifying proper release signing.

Private original signing material must stay out of GitHub and logs. Confirm the signed release's certificate matches previous installed releases; the source now reports `versionCode = 4` / `versionName = 1.0.3-beta` for this update.

## Build current native source

CI workflow: [Android native build](https://github.com/babunidev/ButtonGame/actions/workflows/android-build.yml).

For local Java 17 + Android SDK builds:

```bash
./scripts/sync-www.sh
cd android
./gradlew assembleDebug assembleRelease
```

**Audio packaging fixed in source (26 October 2026):** All ten original OGG recordings, including `4273.ogg`, `QuickStrikepoints.ogg` and `QuickStrikepoints1.ogg`, are now present under `sfx/`, `assets/sfx/` and `android/app/src/main/assets/www/assets/sfx/`. `scripts/sync-www.sh` treats `sfx/` as the canonical originals and synchronizes both targets. GitHub Actions runs the script and checks actual audio bytes inside both APKs. **The complete new GitHub Actions build passed** in [run 40365295833](https://github.com/babunidev/ButtonGame/actions/runs/40365295833); both the debug APK and the unsigned release APK were uploaded as workflow artifacts.

No newly signed APK for this source revision has yet been established. GitHub CI compiles debug and unsigned release packages; only Babuni.dev's original signing certificate (kept outside GitHub) can produce an installable update of the existing release-signed app. The existing installed app's two-phone behavior is confirmed by Babuni.dev, independently of the still-pending new-build signing.

## High-score ownership and format

The Android host saves up to 50 sorted entries to its private `scores-v2.json`. Each entry has `name`, `score`, `reactionMs`, `apm`, `durationMs`, and now `trapsEnabled` (false for older records). Guests send `POST /api/scores` and read `GET /api/scores`; no independent guest scoreboard. Earlier `scores.json` beta records are deliberately not migrated; the v2 native store deletes that file on initialization.

To reset all host app data, Android Settings → Apps → Button Game → Storage → Clear data. This also deletes unrelated app-private preferences. Clearing guest browser cache does not reset host rankings.

## Signing the new 1.0.2-beta Trap Mode release locally

GitHub Actions [run 40365295833](https://github.com/babunidev/ButtonGame/actions/runs/40365295833) passed full Kotlin Android compilation, web/asset synchronization and the deterministic Trap Mode regression. It produced a **debug-signed** build and an **unsigned release**; neither installs directly over Babuni.dev's existing **release-signed** game.

To produce an in-place upgrade, use the **same original private release keystore/certificate** and the Android SDK's `zipalign` and `apksigner` **locally on a trusted machine**. Never upload the keystore or its password to GitHub or paste the password into repository files. After extracting the unsigned release artifact:

```bash
zipalign -f -p 4 app-release-unsigned.apk app-release-aligned.apk
apksigner sign --ks "/private/path/to/original-signing-keystore.p12" --ks-type PKCS12 --out ButtonGame-1.0.2-release-signed.apk app-release-aligned.apk
apksigner verify --verbose --print-certs ButtonGame-1.0.2-release-signed.apk
```

`apksigner` prompts securely for the keystore password. The keystore path above is a **placeholder**, not a claim that the file exists on any particular device. The signed certificate must match the original installed app, and `versionCode=3` must be greater than the installed version. The debug APK is only a fallback for a clean install **after uninstalling** the release-signed app; this loses its app-private data and is **not** an in-place update. No separate TEST app was introduced.

## Verification before distribution

Inspect APK entry list for both `assets/www/game.js` and `assets/www/index.html` **and all ten intended audio OGG files**; confirm native classes, hash and signature. The existing installed app's phone checks have already been completed by Babuni.dev. For the **newly signed version**, a brief installation/launch/audio/Wi-Fi smoke test is enough. Refer to [docs/QA.md](QA.md). A release artifact and successful device check must be recorded in [CHANGELOG.md](../CHANGELOG.md) and [docs/DEVLOG.md](DEVLOG.md).
