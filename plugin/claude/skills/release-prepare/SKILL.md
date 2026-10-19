---
name: release-prepare
description: Prepare a release: list tickets merged since the last tag, check that every hitl ticket was approved, review the release-please Release PR and the changelog, and stop for human approval. Never creates tags.
argument-hint: [version]
disable-model-invocation: true
---

# Prepare release $ARGUMENTS

1. `git fetch --tags`; find the last tag and list merged PRs since it (`gh pr list --state merged --search "merged:>=<date>"`).
2. For each PR with label `squad`: confirm the linked issue is `done` and, if labelled `needs-human`, that a human approved it (review or comment). Any gap is a blocker.
3. Find the open release-please Release PR (`gh pr list --label "autorelease: pending"`). Compare its changelog with the merged PRs. Report missing or mislabelled entries (wrong Conventional Commit type).
4. Run `quality.commands` on the default branch head.
5. Produce `.squad/release/<version>.md`: summary, PR table, blockers, the exact command the human will run (merging the Release PR). Print it and stop. Tagging, building and submitting happen in the release workflow after the human merges.
