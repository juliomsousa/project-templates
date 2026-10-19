---
name: create-test
description: Write unit tests for a component, hook, store or utility following the project's testing conventions. Use when asked to add, write or create tests for a file.
---

# Create tests

Input: the file to test. Read `docs/conventions/06-testing.md` first.

1. Read the file and its dependencies, and list the behaviours to cover: render states, interactions, success and error paths, edge cases.
2. Create the test next to the source: `X.tsx` gets `X.test.tsx`, `useX.ts` gets `useX.test.ts`.
3. Rules:
   - Import `render` / `renderHook` from `@app/utils/testUtils`, never directly from Testing Library.
   - **Prefer snapshot tests** for rendered output. Add explicit assertions for behaviour: presses, callbacks, state changes.
   - Name tests Given / When / Then, in plain, non-technical language. Don't add explanatory comments.
   - Query by role or text first. Use `getByTestId` with constants from `constants/locators.ts`.
   - Mock at the boundary: `jest.spyOn(fetchModule, 'fetchX')`, axios-mock-adapter, or `__mocks__/` for native modules.
   - Build date fixtures relative to today with date-fns (`subDays(new Date(), 3)`), never a literal date.
   - Use typed fixtures from `__fixtures__/`. Use `as unknown as T` for partial mocks, never `any`.
4. Run `pnpm test <file> --coverage --collectCoverageFrom=<source>` and close coverage gaps to at least 90%.
5. Show the new snapshots and the coverage numbers. Do not change production code. If the code is hard to test, explain why instead.
