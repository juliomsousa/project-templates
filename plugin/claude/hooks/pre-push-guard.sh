#!/usr/bin/env bash
# Blocks pushes to the default branch and any force-push. Exit 2 = block.
source "$(dirname "$0")/_lib.sh"

cmd="$(hook_field '.tool_input.command')"
[[ "$cmd" == *"git push"* ]] || exit 0

main="$(default_branch)"
if [[ "$cmd" =~ (--force|-f[[:space:]]|--force-with-lease) ]]; then
  block "Force-push is not allowed."
fi
if [[ "$cmd" =~ git[[:space:]]+push[[:space:]]+[^[:space:]]+[[:space:]]+(refs/heads/)?$main([[:space:]]|$|:) ]]; then
  block "Pushing to '$main' is not allowed. Push a branch and open a pull request."
fi
current="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ "$current" == "$main" && "$cmd" =~ git[[:space:]]+push([[:space:]]|$) && ! "$cmd" =~ origin[[:space:]]+[^[:space:]]+ ]]; then
  block "You are on '$main'. Create a branch before pushing."
fi
exit 0
