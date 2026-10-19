---
name: implement-spec
description: Implement an approved spec from docs/specs/ exactly as written. Use when the user asks to implement, build or execute a spec.
disable-model-invocation: true
---

# Implement a spec

Input: a spec path, e.g. `docs/specs/07_profile_screen.md`. If none is given, ask which spec to implement.

1. Read the spec in full, then read the convention docs it references (see `CLAUDE.md` › Read before you work).
2. Check the spec's **Status** is `Approved`. If it is `Draft`, stop and ask.
3. If anything in the spec is ambiguous, missing, or conflicts with the code or the conventions, **ask before deciding**. List the open points together, not one at a time.
4. Implement in the order of the spec's **Implementation steps**. Create exactly the files listed in **File structure**. If you need a file that isn't listed, say so and why.
5. Write the tests described in **Tests**. Prefer snapshot tests, use Given/When/Then names, and keep coverage at or above 90%.
6. Run `pnpm typecheck && pnpm lint && pnpm test`. Fix failures and rerun until they pass.
7. Update the spec: set **Status** to `Implemented` and record any deviation under **Decisions log**, with the reason.
8. Report what changed, test and coverage results, and any open questions. Do not commit.
