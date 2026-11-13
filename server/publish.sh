#!/usr/bin/env bash
# Usage: server/publish.sh [--apply]
# Builds committed origin/main in a temporary worktree, runs the tests, and
# uploads it as a new Button Game release with the babuni.dev deploy account,
# then switches /var/www/buttongame/current. Without --apply: dry run.
# Same key, account and release pattern as babuni.dev's scripts/publish-site.sh.
set -euo pipefail
apply="${1:-}"
key="$HOME/.ssh/id_ed25519_babuni_deploy"
server="babunideploy@89.167.120.88"
remote="/var/www/buttongame"
public="https://babuni.dev/Buttongame"
ssh_cmd="ssh -i $key -o IdentitiesOnly=yes -o BatchMode=yes"

cd "$(dirname "$0")/.."
repo="$PWD"
git fetch -q origin main
work="$(mktemp -d /tmp/buttongame-publish-XXXXXX)"
cleanup() { git -C "$repo" worktree remove --force "$work/src" >/dev/null 2>&1 || true; rm -rf "$work"; }
trap cleanup EXIT
ssh-add -l 2>/dev/null | grep -q "babuni.dev deployment" \
  || { echo "SSH_KEY_NOT_LOADED: run  ssh-add $key  first" >&2; exit 3; }

commit="$(git rev-parse --short origin/main)"
git worktree add -q --detach "$work/src" origin/main
(
  cd "$work/src"
  python3 -m unittest discover -s tests -p 'test_*.py' >"$work/test.log" 2>&1
  for t in tests/*.cjs; do node "$t" >>"$work/test.log"; done
  server/build-web.sh "$work/bundle" >>"$work/test.log"
) || { echo "TESTS_OR_BUILD_FAILED" >&2; tail -n 30 "$work/test.log" >&2; exit 4; }
printf '%s\n' "$commit" > "$work/bundle/commit.txt"
echo "Built origin/main $commit: $(find "$work/bundle/www" -type f | wc -l) web files, tests passed"

previous="$($ssh_cmd -n "$server" "readlink $remote/current 2>/dev/null || true")"
echo "Live release: ${previous:-none}"
if [ "$apply" != "--apply" ]; then echo "Dry run. Add --apply to publish."; exit 0; fi

release="$(date +%Y%m%d-%H%M%S)-$commit"
$ssh_cmd -n "$server" "mkdir $remote/releases/$release"
rsync -rt --chmod=F644,D755 -e "$ssh_cmd" "$work/bundle/" "$server:$remote/releases/$release/"
$ssh_cmd -n "$server" "test -s $remote/releases/$release/www/index.html && cd $remote && ln -s releases/$release .current-$release && mv -Tf .current-$release current"
echo "Switched current -> releases/$release"

if [ -z "$previous" ]; then
  echo "First release uploaded. On the server run:  sudo bash $remote/current/install-on-server.sh enable"
  exit 0
fi

# Game files are read per request; a changed server script needs a restart.
if ! $ssh_cmd -n "$server" "cmp -s $remote/$previous/buttongame_server.py $remote/current/buttongame_server.py"; then
  if $ssh_cmd -n "$server" "sudo -n /usr/bin/systemctl restart buttongame" 2>/dev/null; then
    echo "Server code changed: service restarted"; sleep 2
  else
    echo "Server code changed: run  sudo systemctl restart buttongame  on the server." >&2
  fi
fi

want="$(sha256sum "$work/bundle/www/game.js" | cut -d' ' -f1)"
got="$(curl -fsS --max-time 20 "$public/game.js?check=$(date +%s)" | sha256sum | cut -d' ' -f1 || true)"
if [ "$want" != "$got" ] || ! curl -fsS --max-time 20 "$public/api/scores" >/dev/null; then
  $ssh_cmd -n "$server" "cd $remote && ln -s $previous .rb-$release && mv -Tf .rb-$release current"
  echo "VERIFY_FAILED: live game.js or score API did not match; switched back to $previous" >&2
  exit 5
fi
echo "Published and verified: $release ($public/)"
echo "Rollback: $ssh_cmd $server 'cd $remote && ln -s $previous .rb && mv -Tf .rb current'"
