# Agent instructions

Universal rules for every agent working in this repository, whatever the stack. Stack-specific conventions live in `docs/conventions/` and are loaded through `.claude/rules/`.

## Language

- Talk to the human in whatever language they use.
- Every artifact is written in English: documents, tickets, issues, code, identifiers, comments, commit messages, pull requests, test names, evidence reports.

## Comments

- Code must be self-explanatory. Choose names that make comments unnecessary.
- Never write a comment that restates what a well-named function, variable or type already says.
- A comment is allowed only to document a genuinely complex flow, a non-obvious constraint, or a property that cannot be expressed in code (why a workaround exists, a link to a spec or issue).
- Never delete or rewrite comments a human added. Treat them as part of the specification.

## Library and API documentation

1. Query the Context7 MCP (`resolve-library-id`, then `query-docs`) for the exact version the project uses.
2. If that version is not available, read the library's official documentation.
3. Only then fall back to web search.
4. Never rely on memory alone for a library API. Version mismatches are a bug.

## Scope

- Implement exactly the ticket you were given. Nothing more.
- Other open tickets, TODOs you notice, or refactors you would like to do are reported in the pull request, not implemented.
- When the ticket, the conventions and the code disagree, stop and state the conflict. Do not pick silently.

## Quality

- A change is done only when every command in `squad.config.json#quality.commands` passes. Report the output; never claim success without running them.
- Write the tests the ticket's `Verify:` section demands. A ticket without a passing verification is not done.
- Keep changes small and reviewable. One ticket, one branch, one pull request.

## Git

- Never commit directly to `main`. Never force-push. Never rewrite history that has been pushed.
- Conventional Commits, in English, with the ticket id in the scope or body.
- Branch names: `<type>/<ticket-id>-<slug>`.

## Secrets and risk

- Never read, print or commit `.env.*`, keychains, tokens, service-account files or anything under `squad.config.json#secrets.paths`.
- Never ask the human to paste a credential into the conversation. Tell them where to put it (GitHub secret, environment, shell profile) and verify presence with `scripts/squad-doctor.sh`, which never prints values.
- Adding or upgrading a dependency across a major version, touching native folders, CI workflows or release configuration marks the ticket as blocked for human review. Do not work around the guard.
