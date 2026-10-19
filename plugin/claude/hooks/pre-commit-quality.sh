#!/usr/bin/env bash
# Runs squad.config.json#quality.commands before any `git commit`. Exit 2 = block.
source "$(dirname "$0")/_lib.sh"

cmd="$(hook_field '.tool_input.command')"
[[ "$cmd" =~ git[[:space:]]+commit ]] || exit 0
[[ "$cmd" =~ --amend ]] && exit 0

[ -f "$CONFIG" ] || block "squad.config.json not found; cannot run quality gate."
commands=(); while IFS= read -r line; do [ -n "$line" ] && commands+=("$line"); done < <(jq -r '.quality.commands[]?' "$CONFIG")
[ "${#commands[@]}" -gt 0 ] || exit 0

cd "$PROJECT_DIR"
for c in "${commands[@]}"; do
  if ! out="$(bash -lc "$c" 2>&1)"; then
    block "Quality gate failed on '$c'. Fix it before committing.
$(printf '%s' "$out" | tail -n 40)"
  fi
done
exit 0
