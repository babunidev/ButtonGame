# Button Game — Audio Cues and Asset Status

**State as of 2026-10-26:** All ten original OGG sound files (including three custom recordings) are committed under root `sfx/`, mirrored in `assets/sfx/` and `android/app/src/main/assets/www/assets/sfx/`. GitHub CI now synchronizes and checks the exact bytes inside the debug and unsigned release APKs; the latest [Android build run 40325603457](https://github.com/babunidev/ButtonGame/actions/runs/40325603457) **passed** those checks.

| Audio | Trigger | Current source |
| --- | --- | --- |
| `impact1.ogg`–`impact4.ogg` | Ordinary button hits | `sfx/` and `assets/sfx/`; bundled Android copies exist |
| `Bell1.ogg`–`Bell3.ogg` | Eligible combination milestones such as 7, 14, 21 and 37 | `sfx/` and `assets/sfx/`; bundled Android copies exist |
| `4273.ogg` | Special center-stage 42/73 reveal | Root `sfx/`, browser and Android mirrored paths |
| `QuickStrikepoints.ogg`, `QuickStrikepoints1.ogg` | Randomly chosen successful Quick Strike tap cue | Root `sfx/`, browser and Android mirrored paths |

The custom files are referenced by `game.js` at relative paths inside `assets/sfx/`. Earlier signed, manually packaged APKs included them; the current source now preserves that same content in reproducible web and Android build locations. New signed release delivery still requires the original certificate outside GitHub.

## Implementation notes

- Playback uses the Web Audio API, preloaded buffers, impact pitch variation and softened attacks for frequent input.
- The original special reveal and Quick Strike playback gains were adjusted during development to avoid drowning out ordinary cues. Babuni.dev reports **actual phone volume, gameplay and UI have been tested and work** in the installed version; a new rebuilt/signed APK has not yet been installed for independent confirmation.
- A qualifying combination milestone plays the appropriate standard cue; the two center-stage special reveals choose `4273.ogg` instead of duplicating a standard bell at that exact moment.
- Fallback keeps the game playable if a custom recording fails to load. Fallback is **not** evidence of complete sound packaging.

## Required release checks

1. **Done in source:** Canonical `sfx/` recordings mirror into both browser and Android asset folders.
2. **Done in CI configuration:** Synchronization on each build, `sfx/**` change triggers and byte-for-byte checks inside both APKs.
3. **Babuni.dev-reported done:** Sound output, volume balance, interface and gameplay tested on the phone.
4. **Done:** CI compiled both Android APK variants and passed all exact sound checks. **Still pending:** original-certificate sign/install of the new release update.

Do not remove or transcode Babuni.dev-supplied originals without approval.

See [ROADMAP.md](ROADMAP.md) and [docs/QA.md](QA.md).
