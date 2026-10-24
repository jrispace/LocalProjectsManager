#!/bin/bash
# LocalProjectsManager — double-click launcher (macOS)
# Serves the built app on 127.0.0.1 and opens it in your browser.
# JRiSpace | Sylvenson Richard

cd "$(dirname "$0")" || exit 1

PORT=8787
while lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 8900 ]; then
    echo "No free port found in 8787-8900. Close something and retry."
    read -r -p "Press Return to close..." _
    exit 1
  fi
done

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found."
  echo "Install the Xcode Command Line Tools (xcode-select --install), then run this again."
  read -r -p "Press Return to close..." _
  exit 1
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/lpm-server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT INT TERM

sleep 1
open "http://127.0.0.1:$PORT/"

echo ""
echo "  Local Projects Manager is running at http://127.0.0.1:$PORT/"
echo "  Data lives in your browser + your local database file. Nothing leaves this machine."
echo ""
echo "  Close this window (or press Ctrl+C) to stop the server."
echo ""

wait "$SERVER_PID"
