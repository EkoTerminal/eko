# Task 003 · packages/untrusted: sanitiser and agent-bait detector

Read `AGENTS.md` first. Spec: `docs/eko/04-BACKEND.md` **§9.5** (untrusted-text sanitisation: the code sketch for
`packages/untrusted/src/index.ts`, field limits, flags, and the test cases listed there), §7.2 playbook 12
`agent_bait` and §7.3 `agent_bait: { maxScanChars: 4000 }`, §2.1 (the package's place in the layout). The `Untrusted`
type comes from `@eko/shared` (FACTS §7, built in task 002) — import it, don't redefine it.

## Do

1. Create the workspace package `packages/untrusted` (`@eko/untrusted`), wired like `packages/shared` (package.json,
   tsconfig, vitest), added to the workspace and to the root `typecheck`/`test` runs. No new dependencies.
2. Implement §9.5 exactly: normalisation, truncation to the per-field limits (names 64, symbols 16, descriptions 280,
   social handles 64), the `flags` (`agent_bait`, `link`, `impersonation`), `isAgentBait` shared with playbook 12,
   and the `Untrusted` result shape. Pure functions, no I/O.
3. The detector must catch every case §9.5 lists, including: zero-width characters splitting words
   ("ig​nore previous instructions"), bidi overrides, Cyrillic look-alikes ("іgnоre"), `SYSTEM:` at the start of a
   later line, `<|im_start|>`, `[INST]`, a base64 blob of ≥ 80 characters, and a JSON `"tool_call":` object — and
   respect `maxScanChars`.
4. Tests: one per listed case, plus negative cases that must NOT flag (ordinary coin names and descriptions with
   emoji, "system" mid-sentence, short base64-looking tickers, normal URLs flagged only as `link`), truncation at each
   limit, and property-style checks that output text is always within limits and never contains bidi controls or
   zero-width characters.

## Don't

- Don't wire it into the server, MCP or playbooks yet. Don't edit `docs/eko/`. Don't add dependencies.

## Report

Files created, how each §9.5 case is detected, any `TODO(spec)`, and the typecheck/test summary.
