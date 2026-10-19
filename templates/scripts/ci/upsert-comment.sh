#!/usr/bin/env bash
# Creates or updates a single comment identified by a hidden marker (sticky comment),
# so the report updates in place instead of adding a comment per push.
# Usage: upsert-comment.sh <issue-or-pr-number> <body-file> <marker>
set -euo pipefail

number="$1"
body_file="$2"
marker="$3"

comment_id=$(gh api "repos/${GITHUB_REPOSITORY}/issues/${number}/comments" --paginate \
  --jq ".[] | select(.body | startswith(\"${marker}\")) | .id" | head -n 1)

if [ -n "${comment_id}" ]; then
  gh api -X PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${comment_id}" -F body=@"${body_file}" > /dev/null
else
  gh api -X POST "repos/${GITHUB_REPOSITORY}/issues/${number}/comments" -F body=@"${body_file}" > /dev/null
fi
