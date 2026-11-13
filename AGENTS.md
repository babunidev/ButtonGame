# Button Game — AI and Contributor Rules

## 2026-10-27 — Evidence and artifact distinctions

- The complete Trap Mode is **implemented** in the current JS source with `TRAP_CHANCE = 0.10`; earlier “not started” quotes were pre-approval snapshots and must be explicitly dated when retained.
- Distinguish source tree from private sharing ZIP: the repository tracks ten **Ogg** clips, while a separately prepared desktop ZIP reportedly contained ten **MP3** copies. The current `playMediaFallback` chooses an MP3 name on clients reporting no Ogg/Vorbis support. Do not claim raw-checkout codec completeness.
- For Wi-Fi scores, `python3 -m http.server` is static-only. Use `scripts/serve-desktop.py` for a desktop-hosted score/presence API. Its ledger and Android-hosted saved scores are intentionally separate.
- CI compilation/debug APKs aren't proof of an update APK. The installed certificate and higher versionCode must match; do not expose or commit a private signing key.
- Do not rewrite or collapse [root DEVLOG](DEVLOG.md), [curated journal](docs/DEVLOG.md), [creative origins](docs/CREATIVE_ORIGINS.md) or rejected approaches. Preserve Babuni's authorship and publication-safe human–AI record.
- This audit performs **source and docs inspection only**, not browser/Android tests or an APK/ZIP release.


## Mandatory APK update signing practice

- **Never label a GitHub CI debug APK an ordinary update**: temporary debug certificates differ across runners. An original-key-signed APK is required to update any existing installation signed with that original certificate.
- The package ID must remain `com.babunigaming.buttongame`; increment versionCode and match the **actual installed certificate**, not just the package name.
- Use `scripts/sign-android-update.sh` or the opted-in encrypted-secret original-key Actions process. The private `Buttongame-signing-keystore.p12` and password must never be committed, pasted in logs, or exposed.
- If a key is missing or does not match the current device, be explicit; **do not claim to have produced an update APK**. Preserve host scores and document the one-time migration boundary if the old debug private key is lost.

**Update — 26 October 2026:** Babuni subsequently authorized full Red Trap Button implementation at **10%** replacement probability, with immediate Game Over and conservation of already-earned pending points. The feature is **implemented in GitHub source**, and the native Android compilation and new trap regression passed in [Actions run 40365295833](https://github.com/babunidev/ButtonGame/actions/runs/40365295833). Any earlier language below saying this mode is not started or not authorized records the **historical status at that time** and is superseded. An Android APK signed with the original release certificate and physical Trap Mode verification remain **pending**. See [the current Red Trap Button specification](docs/TRAP_MODE.md).

This is a Babuni-directed artwork and a software project. Preserve the user's authorship, distinctive mechanics and decision history.

## Authority and scope

1. **Babuni's direction takes precedence.** Do not treat ideas proposed by an assistant as approved features. Never attribute the user's concepts or constraints to AI.
2. **Do not redesign the game without approval.** The existing turquoise jacket-button interaction, physical number mergers, Quick Strike, special 21→42 / 37→73 effects, time/score collectors, and Wi-Fi host model are intentional.
3. Babuni has supplied the [nine-item Red Trap Button specification](docs/TRAP_MODE.md), expanding the earlier [six-item historical checklist](docs/HISTORICAL_CHECKLIST_2026-10-25.md). It defines a pre-game toggle, random red replacements with normal button lifecycle, immediate loss on tapping, untouched expiry/shatter, passive +3 points each ⅓ second from center through standard float/fusion, saved mode flag, and red leaderboard icon. **IMPLEMENTED IN SOURCE AFTER EXPLICIT BABUNI APPROVAL.** The new native build is not yet an originally signed delivered update. Preserve original user wording and do not invent unresolved timing/probability edge cases.
4. **Babuni has already tested and confirmed the working installed game on two phones:** Quick Strike, combos, timers/HUD, sound, player list, guest scores, Game Over live refresh and score persistence. Do not repeatedly re-add these as unfinished QA. Sound packaging is now complete in source; the remaining release gate is to verify the new CI build, then original-certificate sign/install the **same** Android app (not a TEST variant). Beta high scores need not be preserved.
5. **Keep this a simple game.** Do not add an unnecessary score submission retry, complicated startup protection or abstract hardening as milestones without a real user-observed problem or explicit request. Bluetooth and peer-to-peer are exploratory ideas, not roadmap milestones. Never replace or rewrite the archived Flash game or earlier reconstruction while editing the modern game.

## Inspect before editing

- Check GitHub `main` state and open files/commits before describing anything as implemented.
- Distinguish code present, CI-tested, locally verified, device-verified, signed and actually delivered.
- Review [CONCEPT.md](CONCEPT.md), [ROADMAP.md](ROADMAP.md), [docs/DECISIONS.md](docs/DECISIONS.md) and relevant [docs/DEVLOG.md](docs/DEVLOG.md) / legacy [DEVLOG.md](DEVLOG.md).
- Avoid a false "fixed" claim solely because an API route, fallback, or successful APK compile exists.

## Source changes

- Current browser source: `index.html`, `game.js`, `assets/`.
- Android mirror: `android/app/src/main/assets/www/`. Keep mirrored source synchronized and explicitly verify byte equality.
- The three newer custom sounds exist under `sfx/` in current GitHub; current sync script only takes `assets/sfx/`. Fix source-to-bundle handling as a targeted release task and test for missing assets.
- Native Kotlin code is under `android/app/src/main/java/com/babunigaming/buttongame/`. Host remains the only authoritative leaderboard store. Do not add persistent guest score caches.
- Use reviewable, limited changes and test failure conditions as well as success.

## Android and secrets

- Preserve `applicationId = com.babunigaming.buttongame` for normal upgrades.
- Verify signing certificate continuity before distributing an update. Never commit, log, paste, upload or fabricate keystores, private keys, store/key passwords or personal credentials.
- CI's unsigned release and debug APK are **not** substitutes for an installable original-certificate update.
- Do not assert an Android device test, Wi-Fi acceptance test or completed release without direct verification.

## Required project record

For substantive code or design work, update the relevant documents in the same reviewable change:

- `README.md`: overview and current status.
- `CONCEPT.md`: creative purpose and explicitly approved feature boundaries.
- `ROADMAP.md`: active tasks and their evidence-backed statuses.
- `CHANGELOG.md`: changes actually implemented.
- `docs/DEVLOG.md`: narrative of Babuni's intent, AI proposal, iteration, failures and verification; the original `DEVLOG.md` is retained.
- `docs/DECISIONS.md`: accepted/rejected/deferred choices, with provenance.
- `docs/DESIGN.md` and `docs/ARCHITECTURE.md`: observable behavioral/technical changes.
- `docs/CONTENT.md` and `docs/AI_COLLABORATION.md`: publication-safe portfolio and attribution.
- `docs/QA.md`: tested/unverified cases with reproducible evidence.

**Record format:** date; user direction; AI interpretation/contribution; alternatives or corrections; Babuni's actual decision (or pending); files/commit; tests performed; remaining uncertainty.

Never invent recovered chat dialogue, acceptance, test output, commits, releases, or assets. Unavailable archived conversations remain unavailable until supplied. Do not publish raw private conversations or credentials.

## Verification before completion

At minimum for web-only changes: JavaScript parse check, targeted tests, bundle equality and relevant interaction checks. For Android changes: native compile, host API/persistence tests as applicable, package/signature inspection and physical-device tests when claiming device correctness. For release claims: confirm the exact signed APK, package ID, signer identity, version increment, integrity, source equivalence and intended installation behavior.

A documentation-only change does not validate gameplay, sign an APK, or close release tasks.

## Author attribution

Use **Babuni** as the named human creative in metadata and public-facing documentation. Do not describe Babuni with the role label “creator.” Record specific AI contributions separately without shifting ownership of original ideas.

## Repository-local documentation standard

Follow [the documentation standard](docs/DOCUMENTATION.md) for first-person author voice throughout project documentation, factual changelogs, and naming the AI tool and verified model for each contribution. These rules travel with this repository and do not depend on the babuni.dev ChatGPT Project. Preserve all project-specific technical, creative, canon, safety, licensing, and historical rules in this file; follow the linked standard for public first-person narrative, human–AI attribution, concise development journals, decision records, and evidence-based verification. **Babuni** is the human creative; **babuni.dev** is the website/portfolio, not the person. Preserve third-party credits and historical legal notices. References above to a dated “documentation-only audit” describe that past task, not a permanent ban on later authorized implementation.
