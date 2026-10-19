#!/usr/bin/env bash
# Blocks shell commands that read secret files listed in squad.config.json#secrets.paths.
source "$(dirname "$0")/_lib.sh"

cmd="$(hook_field '.tool_input.command')"
patterns=(); while IFS= read -r line; do [ -n "$line" ] && patterns+=("$line"); done < <(config_value '.secrets.paths[]?')
[ "${#patterns[@]}" -gt 0 ] || patterns=(".env.*" ".npmrc")

for p in "${patterns[@]}"; do
  needle="${p##*/}"; needle="${needle%%\**}"; needle="${needle#\*}"
  [ -n "$needle" ] || continue
  if [[ "$cmd" == *"$needle"* ]] && [[ "$cmd" =~ (cat|less|more|head|tail|bat|grep|rg|sed|awk|cp|base64|echo|open|code|printf)[[:space:]] ]]; then
    block "Reading or copying secret files ($p) is not allowed."
  fi
done
exit 0
