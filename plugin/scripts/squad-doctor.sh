#!/usr/bin/env bash
# Checks tools and credentials needed by the squad. Prints PRESENT / MISSING only.
# Never prints, logs or exports a credential value. Run by the human or by squad-init; agents only read its output.
set -eo pipefail

PROJECT_DIR="${1:-$(pwd)}"
CONFIG="$PROJECT_DIR/squad.config.json"
cfg() { [ -f "$CONFIG" ] && jq -r "$1 // empty" "$CONFIG" || true; }

pass=0; fail=0
ok()   { printf '  ✔ %-44s %s\n' "$1" "${2:-}"; pass=$((pass+1)); }
miss() { printf '  ✘ %-44s %s\n' "$1" "${2:-}"; fail=$((fail+1)); }
have() { command -v "$1" >/dev/null 2>&1; }
env_set() { [ -n "${!1:-}" ]; }

type="$(cfg '.project.type')"
notify="$(cfg '.notify.channel')"
owner_repo="$(cd "$PROJECT_DIR" 2>/dev/null && gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || true)"

echo "Tools"
have claude && ok "claude CLI" "$(claude --version 2>/dev/null | head -1)" || miss "claude CLI" "install Claude Code"
claude auth status >/dev/null 2>&1 && ok "claude login (subscription)" || miss "claude login" "run: claude /login"
have gh && gh auth status >/dev/null 2>&1 && ok "gh authenticated" || miss "gh authenticated" "run: gh auth login"
have jq && ok "jq" || miss "jq" "brew install jq"
have curl && ok "curl" || miss "curl"
have node && ok "node" "$(node -v)" || miss "node" "install Node LTS"
have pnpm && ok "pnpm" "$(pnpm -v)" || miss "pnpm" "run: corepack enable"
have uv && ok "uv (BMAD skills)" "$(uv --version 2>/dev/null)" || miss "uv (BMAD skills)" "https://docs.astral.sh/uv/"
have plannotator && ok "plannotator (optional)" || miss "plannotator (optional)" "curl -fsSL https://plannotator.ai/install.sh | bash"

if [ "$type" = "mobile" ]; then
  echo "Mobile"
  have java && ok "java" "$(java -version 2>&1 | head -1)" || miss "java 17+" "brew install openjdk@17"
  have maestro && ok "maestro CLI" "$(maestro --version 2>/dev/null | head -1)" || miss "maestro CLI" "https://docs.maestro.dev"
  env_set ANDROID_HOME && have adb && ok "Android SDK (ANDROID_HOME, adb)" || miss "Android SDK" "install Android Studio, export ANDROID_HOME"
  have xcodebuild && ok "Xcode" || miss "Xcode (iOS only)" "install from the App Store"
  npx -y agent-device --version >/dev/null 2>&1 && ok "agent-device" || miss "agent-device" "npx -y agent-device --version"
fi

echo "Credentials (presence only; values are never read)"
if [ -n "$owner_repo" ]; then
  gh secret list -R "$owner_repo" 2>/dev/null | grep -q '^SQUAD_GH_TOKEN' && ok "repo secret SQUAD_GH_TOKEN" || miss "repo secret SQUAD_GH_TOKEN" "paste it in GitHub → Settings → Secrets → Actions, or run yourself: gh secret set SQUAD_GH_TOKEN -R $owner_repo"
  gh api "repos/$owner_repo/environments/release" >/dev/null 2>&1 && ok "environment 'release' exists" || miss "environment 'release'" "create it in GitHub → Settings → Environments, add required reviewer and store secrets there"
else
  miss "GitHub repository" "not created yet; secrets are checked after creation"
fi
env_set CONTEXT7_API_KEY && ok "CONTEXT7_API_KEY (optional)" || ok "CONTEXT7_API_KEY (optional, not set)" "higher limits if set in your shell profile"
case "$notify" in
  telegram) env_set TELEGRAM_BOT_TOKEN && env_set TELEGRAM_CHAT_ID && ok "Telegram env vars" || miss "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID" "export them in your shell profile (not in the repo)" ;;
  ntfy) [ -n "$(cfg '.notify.topic')" ] && ok "ntfy topic configured" || miss "ntfy topic" "set notify.topic in squad.config.json" ;;
esac

echo
printf '%d present, %d missing\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
