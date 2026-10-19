---
name: fix-vulnerabilities
description: Optional, non-blocking fix of vulnerable dependencies reported by CI (Trivy) or Dependabot. Use only when the user asks to fix or review dependency vulnerabilities.
disable-model-invocation: true
---

# Fix dependency vulnerabilities (optional)

This never blocks the normal flow. CI only **reports** vulnerabilities (PR comment, job summary, weekly issue). Anything you can't fix safely is left as a **warning** in the final report, not a failure.

1. **Collect** findings, most severe first:
   - Trivy: `trivy fs --scanners vuln --severity CRITICAL,HIGH,MEDIUM .` (or the latest PR comment or weekly issue).
   - Dependabot: `gh api repos/{owner}/{repo}/dependabot/alerts --jq '.[] | select(.state=="open")'`.
2. **For each package**, take the smallest safe change, in this order:
   1. `pnpm update <pkg>` within the existing range. Confirm with `pnpm why <pkg>`.
   2. A direct dependency bump, if the fix needs a new range. Read the changelog for breaking changes.
   3. A transitive dependency fix through `overrides` in `pnpm-workspace.yaml` (`'<pkg>@<vulnerable-range>': '^<fixed>'`).
   4. No fix available: leave it, and record it in the report as a ⚠️ warning with the advisory link.
3. Respect `minimumReleaseAge`: never bypass it to install a fix.
4. If a package has an entry in `patches/`, check the patch still applies after the bump.
5. Run `pnpm i && pnpm typecheck && pnpm lint && pnpm test`. Revert any change that breaks them and mark it as a warning.
6. Add a `.trivyignore` entry only when the user approves it, with a comment giving the reason and a review date.
7. **Report** a table: package · advisory · severity · action (updated / overridden / ⚠️ unresolved) · notes. Do not commit.
