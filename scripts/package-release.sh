#!/bin/bash
# Build the shipping release zip from dist/.
# Output: release/LocalProjectsManager.zip  (name must match the landing page download)
# JRiSpace | Sylvenson Richard
set -euo pipefail

cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"

VERSION="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

echo "▶ Building v$VERSION ..."
npm run build

echo "▶ Staging release files ..."
cp -R "$ROOT/dist/." "$STAGE/"
install -m 755 "$ROOT/lpm.command" "$STAGE/lpm.command"

cat > "$STAGE/README.txt" <<'TXT'
Local Projects Manager — vAPP_VERSION
JRiSpace | Sylvenson Richard

HOW TO RUN
1. Unzip this folder anywhere (e.g. ~/Applications/LocalProjectsManager).
2. Double-click "lpm.command".
   - macOS may ask: right-click > Open the first time.
3. Your browser opens the app at http://127.0.0.1:8787/
   Keep the Terminal window open while you use the app; close it to stop.

WHAT IS IN HERE
  index.html   the app (built)
  assets/      app code and styles
  icons/       app icons
  manifest.webmanifest   installable-app manifest
  sw.js        offline service worker

PRIVACY
No account, no server, no analytics. Projects and tasks stay in your browser
and in the local database file you connect from Settings > Local Disk Database.

TXT

sed -i '' "s/APP_VERSION/v$VERSION/g" "$STAGE/README.txt"

echo "▶ Zipping ..."
mkdir -p "$ROOT/release"
rm -f "$ROOT/release/LocalProjectsManager.zip"
( cd "$STAGE" && zip -qr "$ROOT/release/LocalProjectsManager.zip" . )

echo "✅ release/LocalProjectsManager.zip ($(du -h "$ROOT/release/LocalProjectsManager.zip" | cut -f1))"
echo "   Upload it as the asset named LocalProjectsManager.zip on a GitHub release."
