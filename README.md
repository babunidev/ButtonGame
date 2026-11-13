# Button Game

An arcade game about chasing a moving button, combining flying numbers and squeezing as much as possible out of sixty seconds. The idea began as a Flash game in 2009; today's project brings it to the browser, Android and local Wi-Fi play.

**Creative direction:** Babuni · **Platforms:** browser, Android and desktop LAN · **Status:** playable source with ongoing release and distribution work

## How it plays

Each round begins with a moving turquoise button and a 60-second clock. Pressing it produces a number that travels across the screen. Numbers can meet, combine and become points or extra time. Quick Strikes reward fast reactions; unusual combinations include **21 → 42** and **37 → 73**.

**Traps** is an optional variation. When enabled, 10% of subsequent button spawns are red. Leaving a red button alone awards **3 points every third of a second (9 per second)**; tapping it ends the round immediately, after already-earned points finish collecting. The leaderboard identifies scores earned with Traps enabled.

The full behavior is in [the game concept](CONCEPT.md) and [Trap Mode specification](docs/TRAP_MODE.md).

## Ways to play

| Version | How it works |
| --- | --- |
| **Browser** | The main game is in `index.html` and `game.js`. |
| **Android** | The app runs the game in a WebView and can host other players over local Wi-Fi. Guests join using a displayed address or QR code. |
| **Desktop LAN** | A small Python server hosts the browser game and the score/presence API for other devices on the same network. |
| **Online** | `https://babuni.dev/Buttongame/` (link or QR code): one shared list of the best 100 runs. Server, deployment and website module: [server/README.md](server/README.md). |

### Run the desktop LAN host

From the repository root:

```sh
python3 scripts/serve-desktop.py
```

Open `http://localhost:8000/` on the host computer. Other devices on the same reachable network can use `http://COMPUTER_LAN_IP:8000/`; `hostname -I` may help identify the local address.

Use the supplied Python host, **not** `python3 -m http.server`: the generic static server does not provide the `/api/scores` and `/api/presence` endpoints. Desktop scores are stored in the ignored `.local-data/desktop-scores.json`, separately from Android-hosted scores. **This host is intended for a trusted LAN, not the public internet.**

See [installation and hosting](INSTALL.md) for Android builds, network setup and packaging.

## What's working, and what's not yet verified

The game, Red Trap Button variation, host-backed high scores and Android Wi-Fi hosting are represented in source. Prior Android and two-device Wi-Fi play were reported successful, and CI has compiled the Android app. This does not establish that every current variation has been tested on physical devices.

The remaining release boundaries matter:

- **Android updates:** an APK must be signed with the original installation certificate to upgrade the installed app in place. The certificate is not in this repository. Debug-signed CI APKs are not replacements for an original-signed release. See [installation and signing](INSTALL.md).
- **Desktop sound:** ten original Ogg recordings are kept in `sfx/` and copied to game assets. MP3 fallbacks were included in a separately prepared desktop ZIP, but are not in the Git tree; sound can therefore differ by browser and package. A reported silent session has not been conclusively diagnosed. See [sound notes](SOUNDS.md).
- **Global leaderboard:** a public server with one scrollable lifetime leaderboard is a planned extension, not established here as a deployed service. See [roadmap](ROADMAP.md).

Older dated claims, test evidence and release history belong in the [changelog](CHANGELOG.md) and [QA notes](docs/QA.md), rather than being treated as current simply because they appeared in an earlier README.

## Where to read next

| Interested in… | Start with… |
| --- | --- |
| The idea and game mechanics | [Concept](CONCEPT.md) · [Design](docs/DESIGN.md) |
| Playing, building or sharing | [Installation](INSTALL.md) · [Sounds](SOUNDS.md) |
| What has been done, and what remains | [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md) · [QA](docs/QA.md) |
| Code structure and data flow | [Architecture](docs/ARCHITECTURE.md) |
| How the original idea changed | [Creative origins](docs/CREATIVE_ORIGINS.md) · [Development journal](docs/DEVLOG.md) |
| Decisions, alternatives and attribution | [Decisions](docs/DECISIONS.md) · [AI collaboration](docs/AI_COLLABORATION.md) |

The repository keeps the [original Flash game](Game.swf) and an [early reconstruction](ChatGPT%20Remake/README.md) as history, not as the current release. Its original detailed [development log](DEVLOG.md) is preserved alongside the curated journal.

## For contributors

The current web source is in `index.html`, `game.js` and `assets/`; Android source is under `android/`. Use `bash scripts/sync-www.sh` to synchronize the web assets before an Android build. The Android application ID is `com.babunigaming.buttongame`.

CI includes `node --check game.js`, `node tests/live-leaderboard-refresh.cjs`, Android Gradle debug/release builds and asset checks. A passing build is not physical-device validation or a verified signed update.

Read [AGENTS.md](AGENTS.md) and [the documentation standard](docs/DOCUMENTATION.md) before changing behavior or project records. Document what was actually implemented and tested, without attributing Babuni's original ideas to AI assistance.

## License

Original game code is licensed under [MIT](LICENSE). Original sounds, artwork and brand assets are treated separately in [asset rights](ASSET_RIGHTS.md).
