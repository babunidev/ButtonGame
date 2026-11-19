# Button Game — Recovered Seven-Category Development Checklist (25 October 2026)

**Provenance:** Babuni.dev pasted a response from the older Button Game conversation on 26 October 2026. That response states it went back to an earlier original checklist and preserved its seven categories, while updating progress. The full archived conversation was not independently accessible here. Preserve its task wording as recovered historical evidence; do not conflate these historical items with the currently approved release scope or with assistant-added recommendations.

## 1. Button & Quick Strike

- Turquoise button, four holes, white rings
- Random rotation and spawn animation
- Impact flash, pulse and realistic shattering
- Quick Strike: 73 ms post-spawn window
- 150% spinning Quick Strike animation
- Green center dot and double points
- Dedicated Quick Strike tap sounds (2 variants)

## 2. Floating Numbers & Combinations

- Center emitter and floating-number physics
- Full-label wall collisions and slower growth
- Green score pickup, collection and shared bank
- 37 → 73 reversal animation
- 21 → 42 bouncing, transformation and fusion
- Golden jackpot-number glow
- Random bells at jackpot milestones
- 4273 sound for the centered 42 and 73

## 3. Timer & Interface

- Golden bonus-time pickups
- Shared golden time balance and countdown
- Mirrored Points and Time HUD
- Centered Reaction/APM panel with divider
- Reaction measured after spawn animation
- Smash it! starting prompt

## 4. High Scores & Session Statistics

- Store player name and final points
- Store final average reaction time in milliseconds
- Store final APM
- Store elapsed session time from first click to Game Over
- Display all four statistics in the leaderboard
- Complete Android host storage for the four statistics
- Maintain compatibility with previous leaderboard records — Cancelled by your decision to start with a clean leaderboard.

**Recovered progress comment (historical, now partly superseded):** The response said the calculations, leaderboard UI and Kotlin source updates were implemented, while native APK compilation and verification remained. Subsequent GitHub Actions runs **did compile** the Kotlin host, so current open work is source-complete audio packaging, signing the newest normal-package update, and device verification. No guest-side score storage.

## 5. Trap Mode

- Pre-game Traps toggle with red-button icon
- Random red trap-button spawning
- Instant Game Over when a trap is tapped
- Passive 3 points every 333 ms during a trap
- Normal number physics and score fusion for passive points
- Trap-mode indicator on leaderboard entries

**Recovered design, not implemented.** The checklist does not specify the red trap's exact spawn probability, lifespan, or all timing/settlement edge cases. The recovered earlier checklist does not constitute fresh approval to implement the mode during the current release/documentation work.

## 6. Multiplayer & Networking

- Android Wi-Fi hosting and browser joining
- Live connected-player list and statistics
- Bluetooth hosting option
- True peer-to-peer architecture

Bluetooth and genuine peer-to-peer networking are historical prospective directions; they do not replace the current host-run Wi-Fi session architecture.

## 7. Release & Quality Assurance

- Keep APK signing certificate consistent
- Synchronize text game source with GitHub
- Commit the three new binary OGG assets to GitHub
- Verify the new audio and HUD layout on Android hardware

The three OGGs have since been committed to root `sfx/`; packaged web/Android asset paths and physical audio verification remain open.

## Later clarifications (not changes to the original checklist)

- The Android host is the sole authority for high-score records.
- Beta high-score migration/compatibility was explicitly cancelled.
- Time bonuses changed from fixed +3 s to **7→2 s; 14→3 s; 42→5 s; 73→4 s**.
- Recommendations added in subsequent AI to-do lists, such as publishing via GitHub Releases, are **not original checklist tasks**.

**Related current documents:** [Concept](CONCEPT.md), [Roadmap](ROADMAP.md), [Design](DESIGN.md), [Decisions](DECISIONS.md), [Development journal](DEVLOG.md).

**Historical integrity:** This copy contains the seven recovered categories with their task wording preserved. Commentary and later corrections are explicitly separated.

**Later recovered detail (26 October 2026):** Babuni.dev provided a separate **nine-item Red Trap Button feature checklist** in [TRAP_MODE.md](TRAP_MODE.md). It supplements the original six-item historical summary with ordinary spawn/lifespan/rotation/shatter parity, untouched trap expiry and the next spawn, center-origin passive points and a small red icon beside qualifying leaderboard names. The entire feature is **not started**. This later detail is not silently inserted into the original seven-category checklist.
