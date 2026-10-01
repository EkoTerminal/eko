#!/usr/bin/env bash
# Asks for the RPC endpoints without showing them and saves them to .env (git-ignored, readable only by you).
# Nothing is printed back, so the key never appears in a terminal, a log or a chat.
set -euo pipefail
cd "$(dirname "$0")/.."
read -rsp "Paste your dRPC HTTPS endpoint for Robinhood Chain, then press Enter: " http; echo
read -rsp "Paste your dRPC WSS endpoint (or just press Enter to skip): " ws; echo
[ -n "$http" ] || { echo "Nothing pasted; .env unchanged."; exit 1; }
touch .env && chmod 600 .env
grep -v -e '^RPC_HTTP_URL=' -e '^RPC_WS_URL=' .env > .env.tmp || true
mv .env.tmp .env && chmod 600 .env
printf 'RPC_HTTP_URL=%s\n' "$http" >> .env
if [ -n "$ws" ]; then printf 'RPC_WS_URL=%s\n' "$ws" >> .env; fi
echo "Saved to $(pwd)/.env (git-ignored). You can close this tab."
