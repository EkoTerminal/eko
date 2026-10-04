# Task 128 implementation report

Candidate: base revision `76b3c0ec02a2aaf6c53bfa131bd845417fb040ae` plus the uncommitted task 128 files below.
Source snapshot SHA-256: `f4b17907786ae64500d4a16bf6670ee5245cf05759494df395a0c6b6495d5551`. Reproduce by sorting changed/new paths listed
in `/tmp/eko-task128-candidate.json`, excluding this report, and hashing each UTF-8
path, NUL, exact file bytes, NUL. No commit, migration, dependency declaration,
lockfile change, deployment, publication, funding or external contact occurred.
External/paid cost: $0.

Followed AGENTS.md including rule 9, packet 128, GO-PLAN §§3.5, 6.2–6.4, 9, 16,
OVERVIEW §12, BACKEND §14.0 and MARKETING §§04–05 claims/disclaimers. Read dependency
packets 019, 081, 113 and 089 and retained security evidence. Specs, Guard design,
prototype, Guard-owned logic/fixtures and historical review records were not edited.
No personal identifiers or secrets were ported; the supplied role mailbox is
recorded with forwarding explicitly unconfirmed.

## Changed files and behavior

- `SECURITY.md`: proposed bounty scope/exclusions, Critical honeypot bypass,
  USDC/ETH payment, launch float and monthly payout record, pending channels,
  T activation, restart/sign-off dates; reconciles fixed historical Medium status
  against the existing ledger without asserting final-candidate acceptance.
- `contracts/review/README.md`: replaces inherited Oct 5–8 window and D0-only
  bounty readiness with Oct 13, 13:00 → Oct 16, 13:00 UTC and Oct 18 sign-off.
  GO-PLAN/task dates take precedence over stale read-only BACKEND dates; keep
  BACKEND's no-open-High/Medium and full 72-hour restart requirements. Uses the
  stricter 48-hour GO-PLAN acknowledgement target within BACKEND's 72 hours.
- `docs/public-launch/README.md`, `SECURITY.public.md`, `security.txt.template`,
  `CHECKLIST.md`, `EVIDENCE.md`, `artifact-manifests.json`: public export/licence
  manifests, per-repository draft disclosure coverage, schedule, unresolved
  findings/dependencies and evidence/surface census. SECURITY template is mapped
  to each export; security.txt is prepared but unserved. Actual publication and
  reporting-channel activation remain owner decisions.
- `scripts/public-launch-manifests.mjs`, `scripts/test/public-launch-manifests.test.mjs`:
  dependency-free allowlist/hash generator and integrity tests. Check verifies
  destinations, membership and bytes; write only updates local JSON. No network,
  repository creation, package publication or approval is performed.
- `apps/web/src/pages/trust/Launch.tsx`, `Launch.test.tsx`: public `/official`
  and `/transparency` pages show no token at T, unresolved role addresses and
  repo URLs, unconfirmed disclosure, planned review dates, historical limitations
  and deployment/review separation. No placeholder wallet, external link or
  action button is enabled. Reuses existing responsive legal-page styles.
- `apps/web/src/routes.ts`, `routes.test.ts`, `copy/shell.ts`,
  `components/shell/Shell.tsx`: exact public T routes, titles and shared desktop/
  mobile footer links. Route inventory assertions expanded from 41 to 43 with
  both new routes explicitly listed; no assertion/test was removed or relaxed.
- `docs/tasks/128-public-launch-prep-report.md`: this handoff.

## Export candidates

| Proposed repository | File entries | Source-review SHA-256 |
| --- | ---: | --- |
| `contracts` | 83 | `0d9a16be87a005436d19cbb4f04895001c859b8beadf23b455d08e8fe058796d` |
| `playbooks` | 143 | `c3161fecd289ec71e45f3474323d8045af227b81dccee99315eb3a48a87630c7` |
| `receipts-verifier` | 100 | `2a9515ed91d9f4fe8818447c02a0323bf72292f09521044cf1cf1492430e991d` |

All public URLs are null, verified deployment list is empty, publication approval
and bounty activation are false, actual opening/closing timestamps are null.
Each export includes MIT `LICENSE`, draft `SECURITY.md` and the discovery template;
contracts retain forge-std notices and review/security evidence. Existing package
private flags remain unchanged. These inventories preserve workspace paths and
shared dependencies; they are prepared source-review subsets, not independently
installed/published packages. Final subset packaging/install verification remains
a release dependency, explicitly documented rather than implied green.

## Checks on the final candidate

Environment: Node 26.0.0, pnpm 11.5.1; existing installed dependencies. No install
or network/port-based browser run performed.

| Command | Exit code | Result |
| --- | ---: | --- |
| `node scripts/public-launch-manifests.mjs --write` | 0 | Three local inventories prepared |
| `node scripts/public-launch-manifests.mjs --check` | 0 | Exact membership and hashes match |
| `node --test scripts/test/public-launch-manifests.test.mjs` | 0 | 3 integrity tests passed |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/pages/trust/Launch.test.tsx src/pages/Legal.test.tsx` | 0 | 25 tests passed |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/routes.test.ts` | 0 | 5 tests passed alone |
| `pnpm typecheck` | 0 | All applicable workspaces passed |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | Full scripted gate passed: 223 Vitest files / 3,599 tests, Foundry 38 passed plus 1 pre-existing optional RPC fork skip, web/server builds and built-role fixture checks |
| `pnpm brand:check` | 0 | 213 files checked after final builds |
| `pnpm check:addresses` | 0 | 529 source files checked |
| `git diff --check` | 0 | Passed |

Initial full-test run exited 1 on the two stale route inventory expectations.
After explicitly adding the requested routes/count, all 5 route tests passed
alone before the final full rerun. No timeouts were raised, tests weakened or
new skips introduced. Existing optional RPC fork skips are not live evidence.
Markup tests verify copy, links, pending identifiers and unavailable actions;
no browser visual/mobile acceptance or fresh percentage coverage is claimed.

## TODO(spec) and owner dependencies

Task-owned or changed TODOs:

1. `docs/public-launch/README.md`: GO-PLAN §3.5 does not specify export layout or
   distribution targets; prepare source subsets, finalize standalone packaging
   and approved public URLs during separately authorized release.
2. `docs/public-launch/SECURITY.public.md`: $500 cap has no specified tier amounts,
   conversion/payment schedule; owner finalizes proposed tiers/settlement,
   launch float and working channels before activation.
3. `apps/web/src/pages/trust/Launch.tsx`: accepted repository URLs and project
   deployment records were not supplied; all identifiers stay unresolved.
4. `SECURITY.md`: reconcile GO-PLAN's 48-hour response/T activation with BACKEND's
   72-hour/D0 outer bounds; owner confirms forwarding, channels, funding and terms.

Retained TODOs in changed SECURITY.md: tier maximums still need finalization;
§18 custody/live grants/mounts and KEK re-wrapping/rotation proof remain unresolved.
Other inherited TODOs in inventoried source/reports remain with their owning
packets and are not interpreted as completed by these exports.

Remaining evidence is detailed in `docs/public-launch/CHECKLIST.md`: RR-001/002
Low and RR-003 Info remain open; historical Medium fixes need final-candidate
rechecks; three independent frozen-candidate contract reviews/analyzers and
public-window evidence are absent; reported aggregate coverage 92.04% is below
95%; original fork-pin dependency state is unresolved and server/browser fork
checks need a capable authorized environment. Mutation and supplemental fork
results remain attributed to their original candidates/scopes. Missing timelock
parameters, accepted Roles configuration and daily-burn exports must come from
owning packets, never fabricated. Role custody, verified project addresses,
live runtime equality, explorer source verification and the final hash remain
external acceptance work. Registry deployment does not complete D0 review.

## Process checkpoint and reproduction

Final-candidate checkpoint: `/tmp/eko-task128-checkpoint.json`; source list/digest:
`/tmp/eko-task128-candidate.json`. Logs: `/tmp/eko-task128-typecheck.log`,
`/tmp/eko-task128-test.log`, `/tmp/eko-task128-brand.log`,
`/tmp/eko-task128-addresses.log`. Initial failed run retained at
`/tmp/eko-task128-test-initial.log`. Final typecheck session 75634 completed,
exit 0; final test session 39279 completed, exit 0. Brand and address checks also
completed, exit 0. No check process remains running. Next action belongs to the
lead: review/commit the prepared files; owner supplies release decisions and
acceptance evidence under the checklist. No fresh coverage
measurement or paid job; cost $0. Retained coverage/census measurements have
explicit historical scopes, rather than a claim of new full coverage.

Reproduce the exact focused and required commands above from the monorepo root.
After any source change, regenerate/check manifests and relevant candidate
checks. Live channels, actual 72-hour public window, acceptance and release must
be supplied under separate owner instructions.
