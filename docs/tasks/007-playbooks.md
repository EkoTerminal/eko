# Task 007 · packages/playbooks: the 13 scam playbooks as pure rules

Read `AGENTS.md` first. Spec: `docs/eko/04-BACKEND.md` **§7.1** (rule contract), **§7.2** (the 13 playbooks: rule,
level, evidence), **§7.3** (thresholds — `packages/playbooks/config/v1.yaml`, `rules_version 1.0.0`, hashed into
receipts), **§7.4** (verdict assembly: Info never escalates, ≤ 3 templated reasons, `schemaVersion: 'verdict-1'`),
§7.5 (deployer/crew history inputs), §6 (Normalizer: what the simulation inputs look like), §9.5 / task 003 for
playbook 12. Types (`PlaybookMatch`, `PlaybookId`, `EvidenceRef`, `Verdict`, `Level`) come from `@eko/shared`;
`isAgentBait` comes from `@eko/untrusted`.

## Do

1. Create `packages/playbooks` (`@eko/playbooks`), wired like the other packages. No new dependencies (if no YAML
   parser is in the lockfile, ship `config/v1.ts` with the exact §7.3 values and keep a `v1.yaml` copy for humans; a
   test asserts they match).
2. Define a typed **input bundle** per coin (`PlaybookInput`: simulation results, taxes and whether they're mutable,
   LP ownership/locks/removals, pools and fees, curve age/volume/progress and clusters, wash estimates, name/symbol
   and the trending list, Pons exemption logs and bought share, early-block buyers and funders, graduation and
   insider sells, v4 hook permission bits/quote-vs-sim gap/fee asymmetry, token text, deployer/crew history). Derive
   it from §6–§7; mark anything the spec doesn't pin down with `TODO(spec)`.
3. Implement each of the 13 rules exactly as §7.2 states with §7.3 thresholds, each returning a `PlaybookMatch` (or
   nothing) with `confidence` and `evidence` refs. Note the Pons rule: the simulated tax includes the 1% Pons fee and
   both are fixed, so a Pons coin with creator tax ≤ 4% stays Info.
4. Implement `assembleVerdict(matches, meta)` per §7.4.
5. Export `RULES_VERSION = '1.0.0'` and a stable hash of the config (keccak256 of the canonical JSON, reuse
   `canonicalize` from `@eko/policy` if convenient) for receipts.
6. Tests: for every playbook, a fixture at each level boundary (just below / at / above each threshold), including the
   documented real cases: the 53-launch exemption ring (82–86% bought → danger), honeypot requiring the deep-sim
   confirmation, Pons creator tax 4% → info and 5% (+1% fee) handling, mutable tax increase → danger, `clone_swarm`
   with confusables, `agent_bait` monitor vs danger. Verdict assembly: info never escalates; danger wins; max 3
   reasons.

## Don't

- No chain access, no database, no engines wiring (later tasks). Don't edit `docs/eko/`. No new dependencies.

## Report

Files, the `PlaybookInput` shape, every `TODO(spec)`, and typecheck/test results.
