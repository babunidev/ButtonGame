# Button Game on babuni.dev/Buttongame — deployment guide

For Babuni and the babuni.dev website project.

**Goal:** `https://babuni.dev/Buttongame/` serves the live Button Game. Everyone who opens it — by link or by QR code on a phone — plays the same game, sees the same live player list, and can enter **one shared high-score list that keeps only the best 100 runs** (place 101 and below is deleted automatically).

## How it fits the babuni.dev server

It follows the existing setup, documented in the babuni.dev repository (`deploy/README.md`, `scripts/publish-site.sh`) and in Morkahja (`docs/DEPLOYMENT.md`):

- Same Hetzner VPS and nginx site as the website (`/etc/nginx/sites-available/babuni.dev`, serving both `babuni.dev` and `www.babuni.dev` with HTTPS). The game gets its own nginx snippet, included before the website's catch-all `location /`, like `/Morkahja/`.
- The website release folder `/var/www/babuni.dev` is **not** used: `publish-site.sh` replaces it with each website build. The game has its own releases in `/var/www/buttongame/releases/`, with a `current` symlink, uploaded by the `babunideploy` account (no sudo).
- The game server is a systemd service running as its own `buttongame` user on `127.0.0.1:8787` (Morkahja's API uses port 3000; ufw keeps both closed to the outside). High scores are stored in `/var/lib/buttongame/scores.sqlite3`, separate from releases, so a deploy or rollback never touches them.

## Files

| File | Purpose |
| --- | --- |
| `buttongame_server.py` | The game server: game files plus `/api/scores` and `/api/presence`. Python 3 standard library only. |
| `build-web.sh` | Builds the release folder (game files, Ogg + MP3 sounds, server, service, snippet, setup script). |
| `publish.sh` | Routine release from Nobara: builds `origin/main`, runs the tests, uploads as `babunideploy`, switches `current`, checks the live `game.js`, switches back on failure. |
| `install-on-server.sh` | One-time root setup on the server (`prepare`, `enable`, `rollback`). |
| `buttongame.service` | systemd unit. |
| `nginx-buttongame-locations.conf` | nginx locations for `/Buttongame/` (plus redirects from `/Buttongame` and `/buttongame`). |
| `../website/` | "Play Button Game" link + QR-code module and the QR code files. |

## First installation (once)

1. Copy the setup script to the server with the administrator login and prepare (needs your sudo password):
   ```sh
   scp -i ~/.ssh/id_ed25519_babuni_server server/install-on-server.sh babuni@89.167.120.88:
   ssh -i ~/.ssh/id_ed25519_babuni_server babuni@89.167.120.88 'sudo bash install-on-server.sh prepare'
   ```
2. On Nobara, with the Button Game changes pushed to GitHub `main`:
   ```sh
   ssh-add ~/.ssh/id_ed25519_babuni_deploy     # if not already unlocked
   server/publish.sh            # dry run
   server/publish.sh --apply    # uploads the first release
   ```
3. Turn it on (service + nginx route; backs up the site file, runs `nginx -t`, restores it on failure):
   ```sh
   ssh -t -i ~/.ssh/id_ed25519_babuni_server babuni@89.167.120.88 \
     'sudo bash /var/www/buttongame/current/install-on-server.sh enable --allow-deploy-restart'
   ```
   `--allow-deploy-restart` lets `babunideploy` run exactly `systemctl restart buttongame` without a password, so later releases that change the server code finish on their own. Leave it out to restart by hand.
4. Open `https://babuni.dev/Buttongame/` on a phone using mobile data, play a round, submit a name, and check it appears on a second device.

## Updating

`server/publish.sh --apply`. Game-file changes are live at once; a changed server script is restarted automatically (with the sudo rule above) or the script tells you to run `sudo systemctl restart buttongame`. Rollback: the command printed at the end, or for everything `sudo bash /var/www/buttongame/current/install-on-server.sh rollback` (removes the route and stops the service; scores are kept).

## Website module

The babuni.dev site (repository `babunidev/babuni.dev`) adds the block between `MODULE START` and `MODULE END` from `website/buttongame-embed.html` and the file `website/buttongame-qr.svg`. It is a link button "Play Button Game" with the QR code under it; its styles are scoped to `.bg-play`. The QR code opens `https://babuni.dev/Buttongame/`.

## Backups

```sh
sqlite3 /var/lib/buttongame/scores.sqlite3 ".backup '/root/buttongame-scores-$(date +%F).sqlite3'"
```

Restore: stop the service, copy the backup to `/var/lib/buttongame/scores.sqlite3` (owner `buttongame`), start it.

## Removing an abusive score

```sh
sudo -u buttongame python3 /var/www/buttongame/current/buttongame_server.py --db /var/lib/buttongame/scores.sqlite3 list-scores
sudo -u buttongame python3 /var/www/buttongame/current/buttongame_server.py --db /var/lib/buttongame/scores.sqlite3 delete-score 42
```

## Built-in limits

- Best **100** runs kept; equal scores keep the earlier run ahead. After submitting, the game shows "Saved — #N of top 100!" or "Not in the top 100 this time".
- Names: max 16 characters, invisible/control characters removed, shown as plain text.
- Per visitor IP: 20 score submissions and 900 live-status updates per minute; requests are limited to 4 KB.
- Live player list: players disappear 5 s after closing the page; at most 100 shown.
- Scores come from the player's browser, so a determined person can fake one. There are no accounts; use `delete-score` for obvious fakes.
