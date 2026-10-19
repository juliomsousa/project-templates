#!/usr/bin/env bash
# Sends a short notification (ntfy or Telegram) when a session or subagent stops. Never blocks.
source "$(dirname "$0")/_lib.sh" || true

event="${1:-stop}"
channel="$(config_value '.notify.channel')"
[ -n "$channel" ] || exit 0

project="$(config_value '.project.name')"
branch="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
status_file="$PROJECT_DIR/.squad/status.json"
ticket=""; state=""
if [ -f "$status_file" ]; then
  ticket="$(jq -r '.current_ticket // empty' "$status_file")"
  state="$(jq -r '.state // empty' "$status_file")"
fi
msg="[$project] $event · ${ticket:-no ticket} · ${state:-unknown} · $branch"

case "$channel" in
  ntfy)
    url="$(config_value '.notify.url')"; topic="$(config_value '.notify.topic')"
    curl -fsS -m 10 -H "Title: squad $project" -d "$msg" "${url:-https://ntfy.sh}/$topic" >/dev/null 2>&1 || true ;;
  telegram)
    [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ] || exit 0
    curl -fsS -m 10 "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
      --data-urlencode "chat_id=$TELEGRAM_CHAT_ID" --data-urlencode "text=$msg" >/dev/null 2>&1 || true ;;
esac
exit 0
