# Button Game — Visual and Interaction Design

## 2026-11-13 — Public leaderboard feedback

After a run is submitted to the public server, the status line reads "Saved — #N of top 100!" or "Not in the top 100 this time"; the Game Over list shows up to 100 entries. The website module (`website/buttongame-embed.html`) is a turquoise "Play Button Game" link with the QR code below it on the game's dark teal background.

## 2026-10-27 — Status and delivery clarification

The current **Traps** control belongs near the bottom Reaction/APM/replay area, persists through Game Over and cannot be toggled mid-round. The desktop responsive layout places **players left, game center, scores right** when wide, without changing the stacked phone experience. The red button is a **creator-approved, 10%-chance implemented mode**, not a future mockup.

Button Game's tap, bell, Quick Strike and 42/73 reveal sounds are part of the creator's tactile aesthetic. A browser's stored mute preference or audio policy may silence them; source now has media-element fallback. A separately delivered desktop ZIP reportedly adds ten MP3 copies that **are absent from the Git checkout**. The creator's silence report is an observed issue, but the recipient's actual audio behavior is **not confirmed resolved** by a Node mock.

Do not infer new permissions to remove sounds, soften distinctive score physics or change red traps from a documentation/packaging issue.


## Replay selector and wider-screen composition — 26 October 2026

Following Babuni.dev's actual phone test, the former pre-game Traps checkbox moves to a compact **bottom-left** position next to the Reaction/APM plate and Game Over's Play Again control. Its value remains checked for Trap Mode runs, unchecked for normal runs, and can be switched for the next game. The source disables changes during a round and enables them again once the score settles; no percentage slider is included because the author dismissed it.

When the Android host has saved scores, the lightweight leaderboard now appears **beneath the game before play**. It remains subdued on phones and is hidden on narrow Game Over screens while the full ranking is displayed. On wide landscape browsers a CSS grid places **connected players left**, **game center** and **high scores right**, while keeping the original phone stack. This changes layout, not scoring ownership or gameplay.

**Update — 26 October 2026:** Babuni.dev subsequently authorized full Red Trap Button implementation at **10%** replacement probability, with immediate Game Over and conservation of already-earned pending points. The feature is **implemented in GitHub source**, and the native Android compilation and new trap regression passed in [Actions run 40365295833](https://github.com/babunidev/ButtonGame/actions/runs/40365295833). Any earlier language below saying this mode is not started or not authorized records the **historical status at that time** and is superseded. An Android APK signed with the original release certificate and physical Trap Mode verification remain **pending**. See [the current Red Trap Button specification](TRAP_MODE.md).

Status: **as implemented in current HTML/CSS/JS**. Babuni.dev reports having tested gameplay, sound volume, UI layout and multiplayer on actual phones on 26 October 2026; installation of the next newly built/signed APK remains separate. This document describes existing presentation and intentional behavior; changes to the visual grammar require Babuni.dev review.

## Stage, button and gesture

- Logical stage: 450 × 450 coordinates. Earlier Flash and remake assets remain as historical reference rather than a specification for every current mechanic.
- Main target: turquoise four-hole jacket button with white rings, backed by `assets/button.svg`. Nominal art diameter is roughly 62 pixels; the interaction footprint persists during destruction.
- Spawn: randomized in-stage coordinates and rotation limited to roughly ±45°; obstacles near HUD are avoided.
- Player can tap repeatedly during the fade and shatter. Active Quick Strike is entered only via a qualifying first tap in the narrow window after the spawn-in finishes.
- Quick Strike animation enlarges and spins the button, changes its central point emitter to green and doubles every qualifying target tap, including continued taps during its remaining life.

## Look and motion

- Predominantly black stage with cyan, white, green, and gold accents.
- HUD: Points on top-left, Time on top-right; combined Reaction/APM plate near the bottom center. Green unsettled-score balance and gold unsettled-time balance are separate from the final displayed totals.
- Button destruction is a sequence of visible cracks, separation, shatter, then fade using recognizable fragments of the SVG. Babuni.dev rejected arbitrary full-screen glowing fragments and destruction-driven enlargement.
- Floating values use directional gravity, bouncing and whole-label collision extents so digits stay inside the playfield. Gradual merges create distinct numerical milestones, rather than collapsing every cluster instantly.
- Green score pickups and gold time pickups cross the foreground layer, deposit into collector balances and visibly decrement as totals rise.

## Number-based moments

| Event | Visible behavior | Current gameplay result |
| --- | --- | --- |
| Ordinary tap | Target pulse/flash; floating number | Pending +1, or +2 on active Quick Strike |
| Merged 7 | Golden eligible floater / cue | +2 s bonus transfer |
| Merged 14 | Golden eligible floater / cue | +3 s bonus transfer |
| Merged 21 | Scatter, duplicate and reassemble into a large golden 42 | 42-point result and +5 s at the 42 |
| Merged 37 | Move and flip to reveal large 73 | 73-point result and +4 s at the 73 |
| Natural 42/73 | Jackpot emphasis and credit flow | Corresponding 42/73 time bonus |

Detailed credit conservation differs between transformations and ordinary merged floaters; consult `game.js` before changing arithmetic.

## Leaderboard and game flow

- Timer starts on first button tap; Game Over waits for already-earned pending scores/time bonuses to settle.
- During active play, a subtle host high-score glimpse sits **beneath** the playfield at approximately 50% opacity with a downward fading gradient and no touch interception.
- At Game Over, the full host leaderboard scrolls vertically without an exposed scrollbar; Play Again resets gameplay.
- Scores shown are host records, not guest-side fabricated or cached rankings. The screen receives new guest data by polling the host at Game Over.

## Responsiveness and accessibility checkpoints

- Phone scaling is controlled by `fitToPhone()`; check that the scaled playfield, collector flight paths, buttons and scrolling score view are aligned.
- Target has keyboard interaction via Enter/Space in the browser. Focus visibility, language, small-screen legibility, reduced-motion accommodation, color contrast, and screen-reader clarity **have not been comprehensively audited**.
- The four statistics must remain legible and separate; no overlay should block replay or intercept active target taps.
- Babuni.dev-reported actual phone testing is complete; publication-quality screenshots/video can be captured for the portfolio when desired. See [QA.md](QA.md).

## Recovered visual iteration: from Flash precision to readable physical spectacle

**Original/reference phase.** `Game.html` embeds a 450 × 450 Flash 9-era `Game.swf` on black; the earlier `ChatGPT Remake/README.md` describes a cyan target, original German text, fading/rotation and no sound. The legacy design served a direct click/point/second loop. The later current-game typography and HUD should not be retroactively described as original Flash art.

**The rejected shatter.** The first AI proof of concept enlarged or flashed the entire target and released arbitrary glowing shapes. Babuni.dev objected because the recognizable four-hole jacket button itself should crack. The revised clipped-SVG fragments retain the real turquoise surface, white rings and dark holes, with the interaction area active during breakup. The earlier 580 ms staged sequence was subsequently rebalanced: keep the target intact and tappable for an additional 160 ms, then complete the fracture/shatter in approximately 420 ms. The visual choice came before the revised timings.

**Shape and legibility correction.** The original floater wall collision used a value-derived circular radius, so multiple digits could cross the frame despite the center colliding. This was replaced with rotated **whole-label** bounds, HUD collision handling and final clamping. Aggressive visual growth (formerly up to about 2.4× for merged numbers) and instantaneous chain-merges were reduced: larger values remain dramatic but readable, and values recover briefly between merges. Record this as a legibility and pace correction, not as a new game mode.

**The 21 choreography changed after the first implementation.** The initial scatter/duplicate/gather version created 21 `1`s, doubled their count to 42, then formed `42`. The subsequent requested version keeps the **particle count at 21**, throws the singles outward with reflected wall collisions, morphs each from `1` into `2` in motion, and only then gathers them at the top-center `Smash it!` location. The older version should remain visible in project history as an experiment that was superseded.

**HUD composition developed through corrections.** The score-bank's green `+N` was initially a flying/parked pickup, then became an aggregated number *inside* the Points panel, later moved to a flex sibling outside its clipped plate so the green readout and foreground flights remained visible. The top Points/Time plates narrowed and moved closer to opposite frame edges, gold time was mirrored to the inner side of the right plate, and Reaction/APM became a single bottom-center plate separated by a cyan line. Its z-index once hid Play Again; raising the replay overlay repaired it. See dated entries in [root DEVLOG](../DEVLOG.md).

**Audio as visual feedback.** The 42 and 73 reveals take a dedicated `4273.ogg` cue rather than doubling a generic bell. Ordinary milestone bells occur for **each** reached 7/14/21/37/42/73 value, not once per floater lineage. Quick Strike uses its two random custom impacts from the *activating* press onward, while ordinary presses keep their impact set. The supplied new recordings were comparatively louder and had playback gain reduced without modifying the recording bytes.

## Red Trap Button interface — source implemented, phone test pending

**Intended experience:** an optional mode rewarding patience and punishing careless tapping. Before a round, a **Traps checkbox with red-button icon** enables red traps. During the round some normal button spawns are **randomly replaced with red buttons**. A trap uses the ordinary button's **position, lifespan, rotation and destruction** behavior. Tapping it ends the game **immediately**; leaving it alone means it **expires, shatters and allows the next spawn**.

While a trap is active, it generates **3 passive points every ⅓ second (9 points/sec)**. Those points appear **from the center**, pass through the **same number physics, merges, expiry and score fusion** as ordinary point effects. Scores earned with this mode active display a **small red button next to the player's name** in the leaderboard, and the mode-enabled flag is recorded with the host score.

These requirements come from Babuni.dev's [nine-item specification](TRAP_MODE.md). They are **now implemented in source**, after Babuni.dev's approval. **Updated status:** red-spawn probability is defined in source as 10% and pending-score settlement is implemented. Device-specific event ordering and screen-reader behavior still merit tests; do not treat this historical description as the current feature status.
