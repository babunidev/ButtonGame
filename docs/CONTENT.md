# Button Game — Portfolio Content and Publication Outline

## 2026-11-13 — Public page assets

The public server bundle serves `AREssence.ttf`, the button art and the ten sounds (plus MP3 copies made at build time, not tracked in Git). Public hosting is redistribution: confirm the font licence before launch. The website module and QR code live in `website/`. Player names on the public list are chosen by players and moderated with `delete-score`.

## 2026-10-27 — What is actually tracked versus delivered

The Git tree preserves [Game.swf](../Game.swf) and [Game.html](../Game.html) as the Flash-era artifact; the [early ChatGPT remake](../ChatGPT%20Remake/README.md) is not the current version. Active assets include the approved [Button Game logo](../ButtonGameLogo.png), button SVG, imagery and the **ten original Ogg sounds**, replicated in [browser assets](../assets/sfx/) and [Android assets](../android/app/src/main/assets/www/assets/sfx/).

The game code selects `.mp3` paths for browsers without Ogg/Vorbis support. Those copies were included in a **previously produced standalone desktop ZIP**, not in Git; **no MP3 files are currently tracked**. Distinguish the exact distributed ZIP from the repository and the Android WebView when writing portfolio installation or audio claims. A previously checked ZIP is not automatically recoverable from this repository.

Host-owned scores are separate: a phone-hosted Android game persists them on that phone, while `scripts/serve-desktop.py` uses private local `.local-data/desktop-scores.json`. Avoid publishing private player names/scores without appropriate consent. No top-level LICENSE file appears in this tree; don't silently assign redistribution rights over code, Flash art, font or recordings.


**Update — 26 October 2026:** Babuni.dev subsequently authorized full Red Trap Button implementation at **10%** replacement probability, with immediate Game Over and conservation of already-earned pending points. The feature is **implemented in GitHub source**, and the native Android compilation and new trap regression passed in [Actions run 40365295833](https://github.com/babunidev/ButtonGame/actions/runs/40365295833). Any earlier language below saying this mode is not started or not authorized records the **historical status at that time** and is superseded. An Android APK signed with the original release certificate and physical Trap Mode verification remain **pending**. See [the current Red Trap Button specification](TRAP_MODE.md).

The website **babuni.dev** is itself a portfolio project. Button Game should eventually show not only a playable artifact but also Babuni.dev's decisions and the AI-assisted engineering process.

## Entry metadata

- **Name:** Button Game / Buttongame
- **Type:** Arcade game; historical Flash-to-HTML5 reconstruction; native Android Wi-Fi host
- **Author:** Babuni.dev
- **Current condition:** Babuni.dev reports completed real-device gameplay/audio/UI and two-device Wi-Fi multiplayer; the latest source update still needs successful CI confirmation and original-certificate signed release delivery.
- **Repository:** https://github.com/babunidev/ButtonGame
- **Primary evidence:** `Game.swf`, `ChatGPT Remake/`, `DEVLOG.md`, `CHANGELOG.md`, active code, GitHub commits and CI runs

## Proposed portfolio sections (presentation proposal, not approved site implementation)

1. **Play it:** direct current game experience, with honest indication that host-based shared rankings require Android.
2. **Origin:** the preserved Flash artifact and its original one-button loop.
3. **Transformation:** earlier remake and present visual language—four-hole turquoise button, staged shatter, physical score numbers.
4. **Unexpected systems:** Quick Strike, milestone numbers, 21→42 and 37→73 transformations, gold time bank and green score collector.
5. **Social layer:** Serve on Wi-Fi, QR joining and host-owned standings.
6. **Development journal:** Babuni.dev requests, AI interpretations, rejected prototypes, mistakes, recovered facts and actual tests.
7. **Historical future designs:** Babuni.dev's [complete nine-item Red Trap Button design](TRAP_MODE.md), **source implemented; release pending**, plus separate deferred Bluetooth/peer-to-peer ideas.

## Media/evidence inventory

| Media | Current status | Notes |
| --- | --- | --- |
| Original Flash game and wrapper | Stored in repository | Requires appropriate legacy viewing method; do not claim modern browser support |
| Earlier HTML5 reconstruction | Stored under `ChatGPT Remake/` | Separate phase, not the modern game |
| Current HTML/JS and SVG target | Stored in repository | Suitable source for future captured screenshots |
| Game Over, number merges, Android host joining | No publication-ready screenshots/video verified by this audit | Capture only after checking actual output |
| Latest delivered, original-certificate Android build | Not established for newest Game Over fix | Do not present earlier signed APK as newest release |
| Original seven-category checklist with Trap Mode rules | [Recovered historical checklist](HISTORICAL_CHECKLIST_2026-10-25.md) | Earlier six historical tasks preserved; later nine-item detailed design at [TRAP_MODE.md](TRAP_MODE.md); not implemented |
| Full archived development conversation | Not directly recovered | Additional dialogue, rationale and unrecorded details remain unavailable |

## Recovered in-game content and narrative beats

This section describes **established historical game content**, not approved portfolio page copy or new features:

- **Earlier Flash/remake presentation:** a black 450 × 450 stage with original German instructions/graphics, a simple appearing/fading cyan target and direct click-based point/time addition. The separate `ChatGPT Remake/README.md` says the source game lacked sound and a restart action. Preserve the distinction between this source-backed retrospective analysis and Babuni.dev's missing original conversations.
- **Instruction wording:** the modern current-game text `Smash it!` explicitly replaced `Klick druff da` during the October 25 work on the 37→73 sequence. This language change marks the move to a more kinetic, international-feeling presentation; a broader branding rationale is not documented.
- **Recognizable identity:** a turquoise four-hole button is not disposable scenery; it must remain visually identifiable while cracking, scattering and accepting late hits. Subtle central cyan emitter becomes green for a Quick Strike.
- **Numerical theater:** the 37 moves upward, flips to 73 and is collected as exactly 73; the 21 animation first used duplication, later became 21 rebounding `1`s changing into `2`s to form a single 42. Ordinary totals also merge, glow, ring at exact milestones, become collectible green values and feed the visible score balance.
- **Time and reward cues:** gold indicates number-based time eligibility. The currently established table is 7→2s, 14→3s, 42→5s, 73→4s; 21/37 are transitions, not themselves time payouts. Older journal entries awarded +3s more broadly—retain them as earlier builds rather than current rules.
- **Co-presence:** Android `Serve on Wi-Fi`, QR joining, host-owned ranking, animated live players and a faded list beneath the running game are the local-social story, **not** a real-time synchronized shared playfield.

**Recovered historical concept:** Babuni.dev subsequently supplied a dedicated [nine-item Red Trap Button specification](TRAP_MODE.md). It adds ordinary target position/lifespan/rotation/destruction parity, untouched expiration/shatter/next spawn, center-emitted passive points (3 each ⅓ second; 9/s), and a small red indicator beside leaderboard names. The feature is now **implemented in source**, while signed delivery remains pending. The early conversation was later recovered privately and curated in [CREATIVE_ORIGINS.md](CREATIVE_ORIGINS.md). The earlier six-part checklist is preserved separately.

## Attribution and privacy

Credit Babuni.dev for original game vision, direction, requirements, decisions, criticism and acceptance/rejection. Credit AI for concrete code generation, documentation synthesis and engineering proposals as applicable. Avoid raw private chats, personal details, passwords, signing credentials and unverified claims of user intent.

A good case study explains **why the first shatter was rejected**, **why host-only score ownership mattered**, and **why an older APK could have new JavaScript but old Kotlin**, without laundering AI guesses into Babuni.dev's narrative.

## Publication readiness

Only mark features demonstrated when executable source or actual media support them. For multiplayer, show real two-device and persistence tests. For releases, link the exact versioned APK and verification record. For archived ideas, mark provenance and uncertainty explicitly.
