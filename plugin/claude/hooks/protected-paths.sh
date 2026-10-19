#!/usr/bin/env bash
# Blocks edits to native, CI and release config unless the ticket explicitly allows it (SQUAD_ALLOW_PROTECTED=1).
source "$(dirname "$0")/_lib.sh"

[[ "${SQUAD_ALLOW_PROTECTED:-0}" == "1" ]] && exit 0
file="$(hook_field '.tool_input.file_path')"
[ -n "$file" ] || exit 0
rel="${file#$PROJECT_DIR/}"

case "$rel" in
  ios/*|android/*|.github/*|fastlane/*|eas.json|app.config.*|app.json|pnpm-workspace.yaml|.npmrc|squad.config.json|release-please-config.json|.release-please-manifest.json)
    block "'$rel' is a protected path (native, CI or release config). Mark the ticket blocked with reason 'protected-path' and ask the human." ;;
esac
exit 0
