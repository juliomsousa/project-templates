---
name: refactor-tests
description: Improve existing tests (naming, structure, mocks, coverage) without changing production code. Use when asked to refactor, clean up or improve tests.
---

# Refactor tests

Input: a test file or folder. **Only test files may change**: `*.test.ts(x)`, `__snapshots__/`, `__fixtures__/`, `__mocks__/`. If production code needs a change to be testable, stop and propose it instead.

1. Read `docs/conventions/06-testing.md` and the code under test.
2. Run the tests first and record the baseline: passing, failing, coverage.
3. Improve, keeping every behaviour that was covered before:
   - Rename to Given / When / Then and remove explanatory comments.
   - Swap direct Testing Library imports for `@app/utils/testUtils`.
   - Replace `any` and broad mocks with typed fixtures and boundary mocks.
   - Replace literal dates with dates relative to today.
   - Convert assertion-heavy render checks to snapshot tests where the output is stable.
   - Remove duplicated setup with `describe` scoping and `beforeEach`.
4. Rerun. Coverage must be equal to or higher than the baseline. Review every snapshot diff before updating.
5. Report a before/after summary (tests, coverage) and any production-code issues you found.
