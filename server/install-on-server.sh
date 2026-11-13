#!/usr/bin/env bash
# One-time root setup for Button Game on the babuni.dev server. Babuni runs it
# with sudo on the server, in two phases (like the Morkahja deployment):
#
#   sudo bash install-on-server.sh prepare     # service user + release folder for babunideploy
#   (then, on Nobara: server/publish.sh --apply   uploads the first release)
#   sudo bash install-on-server.sh enable [--allow-deploy-restart]
#   sudo bash install-on-server.sh rollback    # removes the nginx route and stops the service; keeps scores
#
# Nothing here touches the website files, the Morkahja app or its database.
set -euo pipefail

APP=/var/www/buttongame
DEPLOY_USER=babunideploy
SITE=/etc/nginx/sites-available/babuni.dev
SNIPPET=/etc/nginx/snippets/buttongame-locations.conf
INCLUDE_LINE="include snippets/buttongame-locations.conf;"
SUDOERS=/etc/sudoers.d/buttongame-deploy

[ "$(id -u)" = 0 ] || { echo "Run with sudo." >&2; exit 1; }
phase="${1:-}"

case "$phase" in
prepare)
  id buttongame >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin buttongame
  install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP" "$APP/releases"
  command -v python3 >/dev/null || { echo "python3 is missing" >&2; exit 1; }
  ls -ld "$APP" "$APP/releases"
  echo "Prepared. Now run server/publish.sh --apply on Nobara, then: sudo bash $0 enable"
  ;;

enable)
  test -f "$APP/current/buttongame_server.py" || { echo "No release yet: run server/publish.sh --apply first." >&2; exit 1; }
  stamp="$(date +%Y%m%d-%H%M%S)"

  # 1. Service on 127.0.0.1:8787.
  install -m 644 "$APP/current/buttongame.service" /etc/systemd/system/buttongame.service
  systemctl daemon-reload
  systemctl enable --now buttongame
  for _ in $(seq 1 20); do
    curl -fsS http://127.0.0.1:8787/Buttongame/healthz >/dev/null 2>&1 && break
    sleep 0.5
  done
  curl -fsS http://127.0.0.1:8787/Buttongame/healthz >/dev/null || { journalctl -u buttongame -n 30 --no-pager; exit 1; }
  echo "Service healthy on 127.0.0.1:8787"

  # 2. Nginx route, included before the website's catch-all location.
  cp -a "$SITE" "$SITE.bak-buttongame-$stamp"
  install -m 644 "$APP/current/nginx-buttongame-locations.conf" "$SNIPPET"
  if ! grep -qF "$INCLUDE_LINE" "$SITE"; then
    count="$(grep -cE '^[[:space:]]*location / \{' "$SITE" || true)"
    if [ "$count" != 1 ]; then
      echo "Expected exactly one 'location / {' in $SITE, found $count. Add this line by hand" >&2
      echo "inside the HTTPS babuni.dev server block, before 'location /': $INCLUDE_LINE" >&2
      exit 1
    fi
    sed -i -E "s|^([[:space:]]*)location / \{|\1$INCLUDE_LINE\n\1location / {|" "$SITE"
  fi
  if ! nginx -t; then
    cp -a "$SITE.bak-buttongame-$stamp" "$SITE"; rm -f "$SNIPPET"
    echo "nginx -t failed: site file restored, nothing reloaded." >&2
    exit 1
  fi
  systemctl reload nginx
  diff -u "$SITE.bak-buttongame-$stamp" "$SITE" || true

  # 3. Optional: let the deploy account restart only this service (for server-code updates).
  if [ "${2:-}" = "--allow-deploy-restart" ]; then
    printf '%s ALL=(root) NOPASSWD: /usr/bin/systemctl restart buttongame\n' "$DEPLOY_USER" > "$SUDOERS.tmp"
    visudo -cf "$SUDOERS.tmp" && install -m 440 "$SUDOERS.tmp" "$SUDOERS"; rm -f "$SUDOERS.tmp"
    echo "Installed $SUDOERS (restart buttongame only)"
  fi

  # 4. Checks.
  ufw status 2>/dev/null | grep -q 8787 && echo "WARNING: ufw mentions port 8787; it should stay closed." >&2
  for url in https://www.babuni.dev/Buttongame/healthz https://babuni.dev/Buttongame/healthz https://www.babuni.dev/; do
    printf '%s -> ' "$url"; curl -sS -o /dev/null -w '%{http_code}\n' "$url"
  done
  echo "Rollback: sudo bash $0 rollback   (nginx backup: $SITE.bak-buttongame-$stamp)"
  ;;

rollback)
  stamp="$(date +%Y%m%d-%H%M%S)"
  cp -a "$SITE" "$SITE.bak-buttongame-rollback-$stamp"
  sed -i "\|$INCLUDE_LINE|d" "$SITE"
  rm -f "$SNIPPET" "$SUDOERS"
  nginx -t && systemctl reload nginx
  systemctl disable --now buttongame || true
  echo "Route removed and service stopped. Scores kept in /var/lib/buttongame, releases in $APP."
  ;;

*)
  sed -n '2,12p' "$0"; exit 1
  ;;
esac
