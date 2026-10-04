#!/bin/bash
# Deploys dscreative.co.il from a clean export of a git ref, with the search index built at deploy time.
# Usage: tools/deploy.sh <git-ref> preview <alias>   |   tools/deploy.sh <git-ref> prod
set -euo pipefail
REF="${1:?git ref}"; MODE="${2:?preview|prod}"; ALIAS="${3:-}"
SITE_ID="257e355a-c8e6-4784-b5a0-3b00dc7a3524"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
EXPORT="$(mktemp -d)/site"; mkdir -p "$EXPORT"
git -C "$REPO" archive "$REF" | tar -x -C "$EXPORT"
python3 "$EXPORT/tools/seo-check.py" "$EXPORT"
( cd "$EXPORT/tools/search" && npm ci --no-audit --no-fund --silent && node build-index.mjs "$EXPORT" )
rm -rf "$EXPORT/tools/search/node_modules"
test -f "$EXPORT/pagefind/pagefind.js"
if [ "$MODE" = "prod" ]; then
  netlify deploy --prod --no-build --dir="$EXPORT" --site "$SITE_ID" --message "production: $REF $(git -C "$REPO" rev-parse --short "$REF")"
else
  netlify deploy --no-build --dir="$EXPORT" --site "$SITE_ID" --alias "${ALIAS:?alias}" --message "preview: $REF $(git -C "$REPO" rev-parse --short "$REF")"
fi
