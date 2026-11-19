# Button Game — Human / AI Collaboration Record

Follow [the documentation standard](DOCUMENTATION.md) for first-person author voice throughout project documentation, factual changelogs, and naming the AI tool and verified model for each contribution.

## 2026-11-13 — Reaction and APM in the High scores panel

**My direction:** When the high-score list omitted reaction and APM, I asked whether the live site had lost features from the Android and desktop builds. After checking, I approved showing reaction and APM (not time) in the panel. **Claude (Claude Code, Claude Opus 5.5):** compared every shipped build with the live files, found nothing missing, made the panel change, tested it with mock data and published it.

## 2026-11-13 — Public server

For the public server, I wanted the game at babuni.dev/Buttongame, a link and QR code on the website, and one shared list of the 100 best runs. The website developer handles the embed. **Claude's contribution:** server code, tests, build/deploy files, QR code and website module, the small client changes, and these records. Choices Claude made without a specific instruction (ties, per-IP limits, best 100 runs rather than one per name, the "#N" message wording) are listed in D-026 for my review.

## 2026-10-27 — Sequential portfolio audit #27

For the documentation audit, I asked to preserve original 2009 game authorship, recovered creative ideas, alternative directions, decisions, implementation and verification. For the historical record, I supplied dialogue for a publication-safe [creative origins](CREATIVE_ORIGINS.md) synthesis; that is not permission to publish a private transcript.

**AI work here:** Identify ButtonGame as the next relevant GitHub repository; inspect source, commits, test files and the existing 11 canonical docs; clarify implemented 10% Trap Mode versus earlier “not started” text; clarify separate Android/desktop host score ownership and the **Ogg-only Git tree versus the separately prepared Ogg+MP3 desktop ZIP**. Add targeted, dated evidence without rewriting or claiming ownership of the original concept.

**Limit:** This is editorial/source analysis, not a new score/Trap Mode implementation, physical two-device test, fresh passed CI run, audio confirmation, signed Android update or downloadable ZIP. All runtime sources, media, extra historical journals and private signing data remain unchanged. Preserve the already documented mistaken AI assumptions and my corrective feedback rather than laundering them into creative-approved choices.

## Principle

The original game and its creative direction are mine. AI helped interpret, code, test, draft and reconstruct its history. The record notes my approval where I gave it explicitly.

## Evidence hierarchy

1. Explicit direction or decision preserved in accessible discussion or provided documents.
2. Files, commits, tests and successful/failed CI runs at a specific revision.
3. Dated original `DEVLOG.md` / `CHANGELOG.md` explaining recorded iterations.
4. Retrospective summaries, including my 2026-10-26 "Complete To-Do List".
5. Inference or proposal, always clearly labelled and never turned into a historical fact.

Missing archived messages must remain **unrecovered**, not paraphrased from imagination. For Trap Mode, I first supplied an earlier [seven-category checklist](HISTORICAL_CHECKLIST_2026-10-25.md) with six Trap Mode requirements, then a more detailed standalone [nine-item Red Trap Button specification](TRAP_MODE.md), including the explicit intent to reward patience and punish careless tapping. Neither document is equivalent to accessing the complete original conversation. At the time of that historical checklist, I explicitly said the **entire feature was not started** and requested documentation rather than immediate implementation; I subsequently approved it and it was implemented on October 26, which supersedes that earlier status.

## What each substantial entry records

| Field | Required content |
| --- | --- |
| Date and scope | Precise work session / repository |
| User direction | What I requested, intended or objected to |
| AI contribution | Suggested alternatives, generated implementation or investigation |
| Iteration | Rejected attempts, corrections, technical failures and trade-offs |
| Decision | Accepted, rejected, deferred or pending; explicit attribution |
| Implementation | Exact paths and commit/PR when changed |
| Verification | What actually ran and its result; distinguish CI from device testing |
| Remaining uncertainty | Unverified behavior, missing source or unresolved approval |

## Direct recovery of the original concept dialogue (26 October 2026)

The original chat's **beginning** is now available through a private Markdown export I supplied. This is stronger provenance than the earlier seven-category retrospective checklist, while still not proof that every embedded image, attachment or exchange has been preserved. See [CREATIVE_ORIGINS.md](CREATIVE_ORIGINS.md).

At the opening, I identified an old game I had already remade locally, then delivered creative notes before asking for a to-do list. **AI's first role was organizing existing author instructions.** For the visuals, I chose the turquoise four-hole/white-ring button, rejected inaccurate AI color/detail proposals, controlled the shatter's fidelity, specified the points-as-physical-value interaction, and later reshaped the 21→42 animation after an already implemented first version. Those choices were mine. AI implementations and error corrections are recorded separately.

The raw export is **not safe to publish as-is** because it contains private text and signing-sensitive material. A reviewable edited account is committed instead; do not upload the raw transcript into this public repository.

## Concrete project examples

- **Button shatter:** first AI-produced approximation enlarged the button and used arbitrary glowing shapes; I rejected that appearance. The revised solution fractured the recognizable turquoise jacket button into its actual pieces. This change of direction is part of the artwork.
- **High-score ownership:** My decision to use one host-owned ledger superseded a guest-local score supplementation approach. The latter should remain documented as an abandoned attempt rather than described as current behavior.
- **Android native build:** earlier packaged APKs contained modern web assets but stale Kotlin binaries; later CI compiled the native v2 storage. Successful compilation is not equivalent to an already-installed release.
- **Guest Game Over bug:** user observed missing refresh; assistant traced a client polling condition and implemented a testable change. Physical two-device outcome is still open.

## Recovered collaboration and corrective feedback (2026-10-24–26)

**Faithful shatter.** The request was for the recognizable button to crack apart. A first AI prototype enlarged/faded the button and substituted glowing polygon debris; I rejected it and insisted on the same four-hole turquoise button visibly cracking apart. AI subsequently restructured the fragment animation around the real SVG and updated timed states. That correction came from my review of the first prototype.

**Numeric choreography.** A working AI implementation of the 21→42 transformation duplicated 21 onscreen `1`s into 42 visual singles. The follow-up request I made was more particular: 21 independent singles should move, bounce, each transform to `2` in flight, and finally assemble 42. An implementation that passed tests was **not** automatically an accepted visual concept; the follow-up request superseded it. AI implemented the revised version and recorded conservation and simulated motion checks. Avoid claiming the doubling-to-42-units version is my final design.

**Readability over algorithmic convenience.** My feedback over several rounds led to slower number growth, collision boundaries that respect entire rotated text, a collectible score bank with its own visible arithmetic, refined HUD grouping, and subtle peripheral score preview. Several changes required technical reinterpretation, e.g. moving pickup flights outside a clipped stage stacking context. Distinguish aesthetic criteria I supplied from geometry and DOM solutions designed by AI.

**Misrepresenting release status.** AI repeatedly produced web-only repackaged APKs while referring to saved host statistics that were not yet present in compiled Kotlin. When the build differed from the report, I challenged the discrepancy. Full native GitHub Actions compilation was the required corrective implementation, not proof earlier deliverables were complete. Later, when asked for a normal signed update, AI invented a separate TEST variant to protect disposable scores despite my explicit rejection of that concern; the branch changes were reverted. Record both failures as assistant-origin mistakes, **never** as approved experiments. Repeated unresolvable chat download links reinforced the difference between “file built” and “release received.”

**One ledger and spectator freshness.** For Wi-Fi play, I specified that all Wi-Fi players submit to one Android-host-owned scoreboard. AI's temporary guest-local statistics cache was an incorrect attempt to bridge the old native host and was removed. During testing, I then discovered the stationary Game Over list did not update when another player submitted; AI found a polling condition that excluded Game Over and implemented a targeted 3-second refresh and CI check. Actual two-device verification remains a distinct task.

**Evidence and boundaries — earlier investigation.** The first 2026-10-26 search did not retrieve the archived red/trap discussion. A subsequent **copy I supplied of an older seven-category checklist** recovered concrete Trap Mode requirements and is preserved at [HISTORICAL_CHECKLIST_2026-10-25.md](HISTORICAL_CHECKLIST_2026-10-25.md). **Later in the same day the privately uploaded transcript recovered the actual opening and original trap discussion**, summarized in [CREATIVE_ORIGINS.md](CREATIVE_ORIGINS.md). This still does not establish exact spawn probability, settle every edge case or authorize implementation. A red record button from an unrelated project is not valid evidence for Button Game. Future history entries should distinguish (a) user recollection, (b) historical text I supplied, (c) directly quoted original archived dialogue if obtained, (d) retrospective GitHub logs, and (e) independently tested code.

## Publication rule

Publish an edited account of collaboration, never a raw private transcript. Do not expose credentials, keystore details beyond nonsecret identity checks, personal chat metadata or unrelated information. When a retrospective summary conflicts with the checked-in source, explain and correct it with evidence while retaining the earlier record as history.

## Maintenance links

- Current constraints: [AGENTS.md](../AGENTS.md)
- Chronology: [development journal](DEVLOG.md), [CHANGELOG.md](../CHANGELOG.md)
- Creative decisions: [docs/DECISIONS.md](DECISIONS.md)
- Verification: [docs/QA.md](QA.md)

## 18 November 2026 — Collaboration record review

At my request, Codex (GPT-6) revised this record for first-person voice and checked the attribution against the available repository documentation. Where an earlier AI tool or model is missing from the record, its identity remains unconfirmed.
