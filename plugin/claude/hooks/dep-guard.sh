#!/usr/bin/env bash
# Blocks dependency commands that may cross a major version unless allow_major is true.
source "$(dirname "$0")/_lib.sh"

cmd="$(hook_field '.tool_input.command')"
[[ "$cmd" =~ (pnpm|npm|yarn|bun)[[:space:]]+(add|install|i|up|update|upgrade)[[:space:]] ]] || exit 0

allow_major="$(config_value '.dependencies.allow_major')"
[[ "$allow_major" == "true" ]] && exit 0

if [[ "$cmd" =~ @(latest|next|\^?[0-9]+) ]] || [[ "$cmd" =~ (up|update|upgrade)[[:space:]]+(-L|--latest) ]]; then
  block "Dependency change may cross a major version. Mark the ticket blocked with reason 'dependency-major' and ask the human."
fi
if [[ "$cmd" =~ (pnpm|npm|yarn|bun)[[:space:]]+(add|install|i)[[:space:]]+[^-] ]]; then
  block "Adding a dependency requires human approval. Explain why it is needed and its size in the PR, mark the ticket blocked with reason 'dependency-new'."
fi
exit 0
