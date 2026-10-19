#!/usr/bin/env bash
# Shared helpers for squad hooks. Sourced, not executed.

set -eo pipefail

HOOK_INPUT="$(cat)"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CONFIG="$PROJECT_DIR/squad.config.json"

hook_field() { printf '%s' "$HOOK_INPUT" | jq -r "$1 // empty"; }
config_value() { [ -f "$CONFIG" ] && jq -r "$1 // empty" "$CONFIG" || true; }
default_branch() { local b; b="$(config_value '.project.default_branch')"; printf '%s' "${b:-main}"; }

block() { printf '%s\n' "$1" >&2; exit 2; }
