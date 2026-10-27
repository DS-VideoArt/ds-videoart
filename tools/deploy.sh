#!/bin/bash
# Deploys dscreative.co.il from a clean export of a git ref, using the canonical build (npm run build, see netlify.toml).
# Usage: tools/deploy.sh <git-ref> preview <alias>   |   tools/deploy.sh <git-ref> prod
#   SIMULATE=1          run the checks below and stop: no build, no deploy
#   DS_REPLACE_LIVE=<sha>  production only: replace the live version with one that does not contain it, on purpose.
#                       The value must be the commit that is live right now (a rollback is better done with restoreSiteDeploy).
set -euo pipefail
REF="${1:?git ref}"; MODE="${2:?preview|prod}"; ALIAS="${3:-}"
SITE_ID="257e355a-c8e6-4784-b5a0-3b00dc7a3524"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
NEW="$(git -C "$REPO" rev-parse --verify --quiet "$REF^{commit}")" || { echo "STOP: $REF is not a commit in this repository" >&2; exit 1; }

# Guard: production only moves forward from what is live. Every production deploy is titled "production: <ref> <sha>" (below),
# so the live deploy names the commit it was built from, and the new ref must contain that commit.
# Fails closed: if the live commit cannot be read (wrong Netlify account, no network, an untitled deploy), nothing is deployed.
if [ "$MODE" = "prod" ]; then
  LIVE="$(netlify api getSite --data "{\"site_id\":\"$SITE_ID\"}" 2>/dev/null | node -e '
    let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
      try { const t = (JSON.parse(s).published_deploy || {}).title || ""; const m = t.match(/^production: .* ([0-9a-f]{7,40})$/); process.stdout.write(m ? m[1] : ""); }
      catch { process.stdout.write(""); }
    });' || true)"
  if [ -z "$LIVE" ]; then
    echo "STOP: could not read which commit is live on dscreative.co.il (is the Netlify CLI on the DS account?). Nothing was deployed." >&2; exit 1
  fi
  LIVE_FULL="$(git -C "$REPO" rev-parse --verify --quiet "$LIVE^{commit}")" || {
    echo "STOP: the live commit $LIVE is not in this repository, so it cannot be compared. Nothing was deployed." >&2; exit 1; }
  if git -C "$REPO" merge-base --is-ancestor "$LIVE_FULL" "$NEW"; then
    echo "guard: OK, $REF ($(git -C "$REPO" rev-parse --short "$NEW")) contains the live commit $LIVE"
  elif [ -n "${DS_REPLACE_LIVE:-}" ] && [ "$(git -C "$REPO" rev-parse --verify --quiet "${DS_REPLACE_LIVE}^{commit}" || true)" = "$LIVE_FULL" ]; then
    echo "guard: OVERRIDE, replacing the live commit $LIVE with $REF ($(git -C "$REPO" rev-parse --short "$NEW")) on purpose"
  else
    echo "STOP: $REF ($(git -C "$REPO" rev-parse --short "$NEW")) does not contain the live commit $LIVE, so it would take the site back. Nothing was deployed." >&2; exit 1
  fi
fi
if [ "${SIMULATE:-}" = "1" ]; then echo "SIMULATE: checks passed, stopping before the build and the deploy"; exit 0; fi

EXPORT="$(mktemp -d)/site"; mkdir -p "$EXPORT"
git -C "$REPO" archive "$NEW" | tar -x -C "$EXPORT"
( cd "$EXPORT" && npm ci --no-audit --no-fund --silent && npm run build --silent )
MSG="$REF $(git -C "$REPO" rev-parse --short "$NEW")"
if [ "$MODE" = "prod" ]; then
  netlify deploy --prod --no-build --dir="$EXPORT/dist" --site "$SITE_ID" --message "production: $MSG"
else
  netlify deploy --no-build --dir="$EXPORT/dist" --site "$SITE_ID" --alias "${ALIAS:?alias}" --message "preview: $MSG"
fi
