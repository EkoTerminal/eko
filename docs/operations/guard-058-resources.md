# Guard V2 acquisition (task 058): resource approval and pricing

## Approval

On 2026-10-04 the owner approved spending up to **$10 in total** on the task 058 prospective acquisition, paid from
the project's existing paid RPC account (dRPC). The cap applies to the whole run, pilot and follow-up included;
`docs/tasks/058-acquisition-definition.json` records it as `capNanoUsd` 10,000,000,000 with `approvalRef`
`owner-approval-2026-10-04`.

## Pricing

The paid endpoint bills a flat 20 compute units per request, about **$6 per 1,000,000 requests** (measured on the
owner's account on 2026-10-02). That is 6,000 nano-USD per request, the definition's `unitNanoUsd`, so the $10 cap
covers about 1.67 million requests; the definition's 250,000-unit checkpoint stops the run for review at about $1.50.
The definition's `pricingEvidence` is the SHA-256 of this file as committed with that approval.

## Status

Approval and pricing are recorded; no acquisition has run. The run starts with the 048 runner's bounded pilot once the
cohort's first complete day (2026-10-04 UTC) is enumerated, as the task 058 report requires.

## Usage

| Date (UTC) | Run | Requests | Cost | Result |
|---|---|---|---|---|
| 2026-10-05 | Oct 4 launch enumeration (`launch-enumeration-cli.ts --measured --from 2026-10-04 --days 1`) | 64 (49 headers, 16 log pages) | $0.000384 | complete, no gaps: 3,957 Pons launches; other launchpads not enumerable yet (no verified factory) |

Running total: **$0.000384** of the $10 cap. Outputs stay local under `.data/eko-058/` (git-ignored).
