# Button Game — Decisions and Open Questions

## D-025 — One public Button Game leaderboard on the creator's own server (requested, planning)

- **Creative direction (4 November 2026):** Babuni wants a version of Button Game hosted on their own server, with **one shared high-score list for everyone**, and asks whether it can reuse the desktop game.
- **Verified starting point:** The existing browser game is reused on desktop and Android. The Python desktop LAN backend already supplies `/api/scores` and `/api/presence` but saves a **host-local top-50 JSON file** and is explicitly designed for trusted LAN use. Android's native host saves scores separately. Neither is currently a public global leaderboard.
- **Proposed technical approach (AI, not yet approved in detail):** Keep the browser frontend and relative API contract; create an internet-safe central API with durable storage (candidate: SQLite), essential abuse controls, same-origin HTTPS behind a reverse proxy, backups and restart-safe deployment. The new online score list would live on the author's server. Optional Android integration and importing existing local scores are **separate decisions**.
- **Creative refinement (4 November 2026):** Babuni explicitly requires **all players who ever played** to remain visible in **one scrollable, all-time high-score list**, without a top-50 cutoff. Each displayed result retains **name, points, Reaction, APM, duration, and the Traps marker**. This replaces the earlier open question about list length. The existing desktop host's 50-entry trim must not be carried into public storage.
- **AI implementation interpretation (proposed, not approved as a specific design):** Store the full result history; use incremental/paginated loading so the interface can scroll through all ranks without requesting the entire database in one response. Do not conflate a visual page size with deletion/retention of records.
- **Unresolved choices:** Exact URL, whether repeated results under the same name appear as separate entries, whether names identify distinct players, importing older local score histories, abuse policy, and whether native Android apps should submit to the public server. No accounts, seasons, chat or additional game mechanics are assumed.
- **Status:** Planning only. No server configuration, publicly reachable instance, database, code changes or external tests are claimed. See [the public-hosting checklist](../ROADMAP.md).

## 2026-10-27 — Audit evidence reconciliation (not a new creative decision)

**Trap Mode status.** A nine-item Red Trap Button specification was first recorded as *not started*. Babuni.dev then explicitly chose the **10%** chance and immediate loss with earned-score settlement, and approved implementation. Commits from 26 October implemented the red button, passive emission, host metadata and score behavior. “Not started” is no longer a present-tense status; retain it only as a dated earlier milestone.

**Desktop sound.** Babuni.dev observed a silent shared game. The assistant inspected a prior ZIP and found the original Ogg files, then added a media fallback and diagnostic warnings. The reported refreshed ZIP included MP3 transcodes; the current Git tree has **none**. No creator decision was made to strip sound, and neither culprit nor real-world audio recovery is verified by source.

**Desktop networking.** A static file server lacked score/presence endpoints; a Python host now implements the existing local API and owns a separate score ledger. That does not approve a public server, authentication account system or score syncing with Android.

**APK signer.** The creator explicitly wants compatible in-place updates. A CI debug APK with another signer is not one. The original private certificate remains a delivery constraint; no new key or bypass is authorized.

These are editorial corrections distinguishing proposals, implemented changes and observed test evidence, not retrospective AI claims over user decisions.


## D-024 — Preserve one permanent Android signer for every release

- **Babuni.dev requirement:** APKs must update the existing installed Button Game without repeated uninstalls. The creator confirmed this worked in earlier releases.
- **Root cause:** New CI-debug outputs use temporary signing certificates, while earlier releases reused Babuni.dev's original private P12 certificate.
- **Implementation:** A safe local original-key signing helper and an opt-in encrypted-secret CI signing step, both enforcing correct certificate identity and separating unsigned/debug builds from genuine update APKs.
- **Constraint:** Do not invent a new key, post private signing bytes/password, or tell Babuni.dev that a different-certificate APK can upgrade an existing app. If the currently installed debug key is lost, preserve host scores and perform a *single* deliberate transition to the permanent signer.
- **Verification:** Build tooling committed; real-key signing and physical installation pending. No new release-signed APK exists yet.

## D-023 — Desktop LAN hosting needs the same score API, not a new game client

- **User observation (26 October 2026):** Babuni.dev ran the HTML5 game on `localhost:8000`, found it playable but could not save high scores, and asked how to let other devices join over Wi-Fi.
- **Diagnosis:** `python3 -m http.server` serves files only; it does not implement `/api/scores` or `/api/presence`. This accounts for the browser's “Could not reach host — try again” submission error.
- **AI proposal/implementation:** A small Python-standard-library `scripts/serve-desktop.py` implementing the **existing** Android-compatible JSON score and presence API, with persistent local desktop high scores in a Git-ignored directory. The game remains the same web client, the Android application is untouched, and no new internet-facing service is assumed.
- **Scope decision:** This is a practical local-LAN extension for desktop play. Its storage is separate from the Android phone's high scores; no automatic cross-host sync and no public account system are implied. Babuni.dev has not yet approved a public service architecture.
- **Verification:** Local API/integration tests passed; a real multi-device desktop-host session is pending.

## D-022 — Persistent Trap selector for replay; three-column desktop presentation

- **Direct 2026-10-26 Babuni.dev feedback:** 1.0.2-beta Trap Mode and host-score persistence tested successfully on a phone; retain the existing **10% chance**.
- **Author decision:** Move a **small Traps label and checkbox to the left of Reaction/APM** beside the Play Again region. Preserve its checked/unchecked state across Game Over and allow editing for the **next** round. A briefly considered rate slider was **rejected**.
- **Author decision:** Saved high scores should be visible **before** play starts, below the game on phones. On desktop, arrange players **left**, game **center**, high scores **right**.
- **AI implementation:** Small permanent footer control, locked during active play; render host preview whenever scores are available, hide duplicate lower preview on narrow Game Over, and use wide-screen CSS grid.
- **State:** Implemented in version 1.0.3-beta source; CI and on-device layout verification are separate. Static desktop serving does not provide the Android score API.

**Update — 26 October 2026:** Babuni.dev subsequently authorized full Red Trap Button implementation at **10%** replacement probability, with immediate Game Over and conservation of already-earned pending points. The feature is **implemented in GitHub source**, and the native Android compilation and new trap regression passed in [Actions run 40365295833](https://github.com/babunidev/ButtonGame/actions/runs/40365295833). Any earlier language below saying this mode is not started or not authorized records the **historical status at that time** and is superseded. An Android APK signed with the original release certificate and physical Trap Mode verification remain **pending**. See [the current Red Trap Button specification](TRAP_MODE.md).

**Notation:** Accepted = established Babuni.dev direction or documented decision. Implemented = present in source. Verified = actually checked at the stated level. Proposed = not authorized. Retrospective entries rely on [original DEVLOG](../DEVLOG.md), [CHANGELOG](../CHANGELOG.md), and Babuni.dev-provided 2026-10-26 to-do list, not an invented transcript.

## D-001 — Preserve original game identity while building a modern edition
- **Direction:** Treat `Game.swf` and the earlier HTML5 reconstruction as stages in the project, not replaceable clutter.
- **State:** Accepted for documentation; historical assets remain in GitHub.
- **Reason:** The development process, discarded prototypes, and evolution are portfolio material.
- **Alternative not taken:** Overwrite the original with an unrelated modernized game.

## D-002 — The button must break as the recognizable button
- **Direction:** Babuni.dev rejected the first swollen, glowing shatter prototype.
- **Decision:** Use clipped fragments of the actual turquoise four-hole button with staged cracks/separation/scatter; still allow taps during destruction.
- **State:** Implemented in `game.js` and `index.html`; documented tests in 2026-10-24 history; latest physical-device verification not established.
- **Source:** [root DEVLOG](../DEVLOG.md) (2026-10-24).

## D-003 — Visibly conserved numerical score transfer
- **Direction/iteration:** Rather than credit on tap and merely decorate with floaters, numbers carry `pendingValue` through collision and fusion, then collect into the green balance and finally the main total.
- **Decision:** Pending values must be settled before Game Over and must not pay twice.
- **State:** Implemented; simulated tests historically reported; broader regression and phone QA remain open.
- **Source:** [root DEVLOG](../DEVLOG.md) (2026-10-25).

## D-004 — The Android host owns the one leaderboard
- **Direction:** All Wi-Fi players see the host's results and the four final statistics; avoid divergent guest-local rankings.
- **Decision:** Guests POST finished runs to host `/api/scores` and GET the same list; browser may retain nickname/mute preference but not a separate high-score ledger.
- **State:** Implemented in JavaScript/Kotlin; physical cross-device acceptance unverified.
- **Rejected approach:** Guest-local persistence or enrichment used to compensate for stale native host builds.
- **Source:** [root DEVLOG](../DEVLOG.md) (2026-10-25).

## D-005 — Correct the stationary Game Over screen, not the data model
- **Observation:** Babuni.dev reported guest high score absent from host Game Over view until another local action.
- **Decision:** Poll host scores every three seconds during Game Over and refresh on return; keep host data authority unchanged.
- **State:** Implemented and CI-regression tested; real two-device confirmation open.
- **Source:** [root DEVLOG](../DEVLOG.md) (2026-10-26).

## D-006 — Release the same installed app, not a new TEST app
- **Direction:** Babuni.dev wants an original-certificate, normal-package APK update. Experimental TEST packaging was not requested; no need to preserve disposable test scores.
- **State:** The TEST build variant was introduced and subsequently removed in commits `31c2718` / `c46ee3f`. Signed and delivered latest update **open**.
- **Do not reintroduce** an alternate package identity without explicit approval.

## D-007 — Treat custom sound recordings as first-class source assets
- **Fact:** Three custom recordings are committed at `sfx/4273.ogg`, `sfx/QuickStrikepoints.ogg`, and `sfx/QuickStrikepoints1.ogg` as of `d5ce766`.
- **Current problem:** Web/Android packaged asset trees lack these exact files; the synchronizer copies only `assets/sfx/`.
- **Decision still to implement:** Reproducible copy/sync/check in release pipeline. Do not say this is already fixed.
- **State:** Source recordings present; packaging open.

## D-008 — Red Trap Button: complete Babuni.dev-supplied feature specification

- **Babuni.dev's goal:** An optional mode that **rewards patience and punishes careless tapping**.
- **User-provided nine-item checklist, 26 October 2026:** pre-game Traps checkbox with red-button icon; some ordinary target spawns randomly become red targets; red buttons retain ordinary **position, lifespan, rotation and destruction** behavior; **a tap triggers immediate Game Over**; untouched traps **expire, shatter and permit the next spawn**; while active they produce **3 passive points every ⅓ second (9/s)**; passive points **emerge from center, combine, expire and fuse into the score normally**; store the active mode with each high score; show a **small red button beside leaderboard names** for Traps-enabled records.
- **Evidence:** [Full Babuni.dev-provided specification](TRAP_MODE.md), supplementing the earlier [six-item historical checklist](HISTORICAL_CHECKLIST_2026-10-25.md).
- **Open details:** replacement probability, moment of passive emission relative to spawn/shatter, potential click/expiry races, and interaction between instant loss and unsettled points.
- **State:** **Historically not started at this point; later expressly authorized and implemented in source.** The user supplied its missing specification for historical preservation, **not an implementation instruction**. Do not label source/API changes as already made or treat the nine-item record as a newly accepted release milestone.

## D-009 — Other exploratory multiplayer options
- **Ideas:** Bluetooth hosting, genuine peer-to-peer network model, optional host score reset.
- **State:** Proposed only. None supersedes the current Wi-Fi Android host or blocks the next signed update.

## D-010 — Replace click-based time extension with earned combination rewards
- **Historical baseline:** `ChatGPT Remake/README.md` describes one point **and one second** per click, and the earlier modern build still contained a button-cycle time increment.
- **Revision:** ordinary taps/button fading no longer add time; the modern 60-second round is extended through **7→2s, 14→3s, 42→5s, 73→4s**. The previously used uniform +3-second bonus and direct awards on 21/37 were superseded.
- **Status:** Implemented in game source; prior behavior is historic, not an open TODO.
- **Evidence:** [root DEVLOG](../DEVLOG.md), October 25 “Session stats, dynamic time awards.”

## D-011 — Rewrite the 21→42 transformation after the initial prototype
- **Earlier implemented attempt:** throw out 21 `1`s, duplicate them into **42 units**, gather and assemble 42.
- **Babuni.dev's later requested choreography:** emit **21 units**, rebound against walls and each change from `1` to `2` while moving, then gather into a large 42. They must remain non-scoring decoration until the one exact 42 pickup.
- **Decision:** The latter replaces the former. This is a specific superseded concept, **not** two independently active modes.
- **Status:** Implemented; simulated runtime checks recorded. On-device visuals unverified.
- **Evidence:** [root DEVLOG](../DEVLOG.md), successive October 25 entries on 21→42.

## D-012 — Make Quick Strike a post-spawn challenge, distinct from Reaction measurement
- **Early model:** Quick Strike was coupled to a reaction-time threshold around the 320 ms spawn animation; first idle page tap could distort Reaction.
- **Revision:** 320 ms is the **spawn-in period**; a separate **73 ms** window immediately afterward enables Quick Strike. A qualifying first tap activates 2× values on all taps for that target, including the shatter. Reaction samples start after spawn-in and exclude page-load idle/early taps.
- **State:** Implemented; simulated boundary tests recorded. Physical input timing not yet certified.
- **Evidence:** [root DEVLOG](../DEVLOG.md), October 25 Quick Strike and Reaction entries.

## D-013 — Favor intact button identity and readable numerical motion over maximal spectacle
- **Rejected / corrected:** the first swollen/glowing pseudo-shatter, a floater hit-radius that ignored digit width, excessive number scaling and unthrottled same-frame chain merges.
- **Result:** recognizable clipped SVG shards, rotated full-text bounding boxes, reduced scale, short merge recovery and score conservation. A later revision delayed fracture onset while shortening breakup.
- **State:** Implemented changes; historic alternatives superseded.
- **Evidence:** [root DEVLOG](../DEVLOG.md), October 24–25 shatter, collisions and merge pacing.

## D-014 — Make each milestone and active hit audibly distinguishable
- **Early approach:** a floater lineage rang a bell just once when reaching seven or more.
- **Revision:** ring on each exact eligible value (7/14/21/37/42/73), then assign the special 42 and 73 *reveal* to `4273.ogg` rather than stacking a second ordinary bell. During active Quick Strike, the **activating** press and later presses select one of two custom impact sounds; ordinary hits use existing impacts.
- **State:** Routing implemented; historic APKs included supplied audio; reproducible asset packaging and physical listening remain separate open work.
- **Evidence:** [root DEVLOG](../DEVLOG.md), October 25 bell/sound entries.

## D-015 — Keep a live ranking peripheral rather than obstructive
- **Babuni.dev request:** Show the leading host high scores **underneath** the game with roughly **50%** opacity and a descending fade; do not replace the full Game Over leaderboard.
- **AI interpretation:** `#live-leaderboard` sits below the framed playfield, has no pointer events, holds up to five names/point totals, and hides during Game Over when the full ranking takes over.
- **State:** Implemented in web/Android HTML/JS; device visual check open.
- **Evidence:** [root DEVLOG](../DEVLOG.md), October 25 live score ambience entry.

## D-016 — Trap Mode history recovery: from inaccessible archive to detailed Babuni.dev specification

- **Earlier evidence gap:** The archived chat could not be read; the first recovered seven-category checklist held six high-level Trap Mode tasks.
- **Further recovery:** Babuni.dev provided a standalone **nine-item “Red Trap Button” checklist** with explicit normal-lifecycle parity, untouched expiry/shatter, center-emitted passive points, and the red icon's location beside leaderboard names. See [TRAP_MODE.md](TRAP_MODE.md).
- **Still unknown:** The full archived conversation, precise random replacement distribution, rare event-order behavior, and reasoning not represented in the two recovered lists.
- **Status:** **Historically concept-only at this time; later explicitly authorized.** Retain previous historical uncertainty records as records of what had been known at each step.


## D-017 — Completed physical QA is completed; keep Button Game simple
- **Babuni.dev's direct report (2026-10-26):** Target/Quick Strike, physics/combos, timer/HUD, sound volume and actual UI all tested and work. Two-device Wi-Fi hosting, live players, guest → host high scores, automatic three-second leaderboard refresh, saved four statistics and persistence across hosting restarts are all reported working.
- **Babuni.dev's decision:** Do not keep re-adding these QA items as unfinished. Do not invent a score-submission retry feature because one old submission failed, and do not promote speculative startup/port-conflict handling or other elaborate hardening to mandatory work. No startup/port conflicts have been observed. The game can remain simple.
- **Babuni.dev's classification:** Bluetooth hosting and peer-to-peer are **future ideas, not milestones or roadmap tasks**. The already-defined Red Trap Button remains a separate unimplemented feature.
- **Implementation of this decision:** Active roadmap and QA ledger corrected; canonical `sfx/` audio mirrored into web/Android and build verification enabled. Normal app ID preserved. See [ROADMAP.md](../ROADMAP.md) and [QA.md](QA.md).
- **Verification boundary:** User report refers to already-tested installed game; the newly compiled `1.0.1-beta` APK still needs its CI result and original-certificate signing to be called delivered.

## D-018 — AI organized Babuni.dev's first Button Game ideas; it did not originate the concept
- **Recovered primary evidence (26 October 2026):** The privately supplied development-chat export begins with Babuni.dev describing an old game they **had remade locally**, saying they wanted to collect new ideas. Babuni.dev then independently described Quick Strike flash/spin, button-specific double points, visible bonus-time transfer, golden numbers, the 21→42 spectacle, 37→73, a jacket button and shattering. Only afterward did the assistant organize these creative requests into the first to-do lists.
- **Attribution decision:** Credit **Babuni.dev** with the game's prior existence, expressed direction, requirements, critique and acceptance. Credit AI for structuring notes, generating prototypes, implementation, debugging and documentation.
- **Source:** [Recovered creative origins](CREATIVE_ORIGINS.md). Original text export retained privately, not published.

## D-019 — Green extra-time concept evolved into a golden mirrored collector
- **Earliest user idea:** Place a **green** extra-seconds number by Time; make it count down as the actual timer increases. It was meant to make incoming rewards traceable, analogous to later green score points.
- **Later direction:** Gold became the established visual identity for time-eligible numerical milestones. Babuni.dev then expressly requested **a golden shared bonus-time balance to the left of Time**, mirroring the green score collector to the right of Points. The bottom Reaction/APM elements also became a unified center panel.
- **Status:** The first green-time proposal was **superseded**, not forgotten, and must not be reinstated as an active to-do. The final golden layout is implemented and creator-tested.
- **Source:** [Creative origins](CREATIVE_ORIGINS.md), [visual design](DESIGN.md).

## D-020 — Set Red Trap Button frequency and settle earned score after instant loss
- **Date and provenance:** 2026-10-26, direct Babuni.dev choice following a proposed red-button implementation plan.
- **Decision 1 — frequency:** When Traps mode is enabled, a red button replaces **10% of ordinary spawns**. Earlier 15% and 20% suggestions were alternatives presented by AI and **not selected**. Disabling Traps means no red-button replacements.
- **Decision 2 — immediate loss with conservation:** Clicking a red button causes **Game Over immediately**, but **already-earned pending points finish collecting** through the existing green score-fusion mechanism. This was explicitly chosen over the alternative of discarding pending floating points. Final host score submission must use the settled total; no new points are earned by that losing tap.
- **Design purpose:** Preserve the original reward-for-restraint mechanic without erasing points the player already earned before the mistake.
- **Implementation status:** **Approved as design parameters at this point; implementation was subsequently authorized and committed.** These decisions refine [TRAP_MODE.md](TRAP_MODE.md); they do not authorize implementation.
- **Outstanding design boundaries:** Trap spacing/streak control, rare simultaneous tap and expiry ordering, pending time-bonus treatment and option persistence between rounds were not decided.

## Recording a new decision

Use: **ID — date — Babuni.dev request and reasons — AI suggestions and alternatives — accepted/rejected/deferred (with explicit evidence) — implementation file/commit — verification and uncertainty**. If no user approval occurred, record `pending`, not `accepted`.
