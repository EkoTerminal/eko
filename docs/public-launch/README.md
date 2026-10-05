# Public launch preparation · draft

Prepared from task 128 and GO-PLAN §§3.5, 6.2–6.4, 9, 16, OVERVIEW §12 and
BACKEND §14.0. These files authorize no external action. Public repositories,
release tags, deployment and outreach remain owner decisions. There is no bug bounty
(owner decision, 2026-10-05).

## Contents and candidate linkage

[artifact-manifests.json](artifact-manifests.json) inventories the exact source
bytes for three proposed public repositories: `contracts`, `playbooks` and
`receipts-verifier`. Repository URLs remain `{{PUBLIC_REPOSITORY_URL}}`; the
public domain remains `{{PUBLIC_DOMAIN}}`. Roles are release operator, disclosure
coordinator and review coordinator; no personal identity is needed.

From the monorepo root, using only Node built-ins:

```sh
node scripts/public-launch-manifests.mjs --write
node scripts/public-launch-manifests.mjs --check
node --test scripts/test/public-launch-manifests.test.mjs
```

`--write` updates the local inventory only. `--check` verifies both file membership
and bytes; it never writes, builds, publishes or accesses the network. Each file
has a source, destination, byte count and SHA-256. Each repository digest hashes
sorted destination UTF-8 bytes, NUL, exact source bytes, NUL. The source revision
is HEAD plus the recorded worktree bytes, not a signed release or final review hash.
Copy the generated inventory beside each exported repository as a release
attachment; it is intentionally outside its own file list to avoid recursive
hashing. The lead must pin the resulting commit and regenerate the inventory for any
source change before opening the review window.

The allowlist excludes app/server runtime, actual environment values, private
journals, deployment broadcasts, caches, raw review runs and generated compiler
metadata. Shared source and test fixtures plus policy/untrusted dependencies are
included where existing workspace imports require them. Those fixtures are
synthetic evidence, never a public record of trades or deployed roots.

These are source-review exports preserving repository-relative workspace paths,
not tested standalone installable distributions. Existing manifests remain
private, and the selected lockfile/workspace metadata is dependency provenance.
A separately authorized release must prepare a subset workspace root or bundle,
validate its imports and frozen installation, and decide distribution targets.
Do not publish a broken subset workspace as an installable package. No npm
workspace declaration, dependency, version or lockfile was changed here.

## Licences and release coverage

EKO-authored artifacts and prepared documents use the root MIT licence, copied
as `LICENSE` by every manifest. Keep source SPDX headers. Contracts include the
vendored forge-std source with its existing MIT/Apache notices. OpenZeppelin
Contracts 5.6.1 is an installed MIT dependency, not newly authored code; retain
its upstream notices if distributing its source. Locked npm dependencies retain
their own licences; this inventory does not relicense third-party code. Do not
copy dependency directories or omit upstream notices during bundling.

Every export maps [SECURITY.public.md](SECURITY.public.md) to `SECURITY.md` and
[security.txt.template](security.txt.template) to `.well-known/security.txt`.
The security.txt file is a **non-live template**: replace domain/repository
placeholders, confirm role-mailbox forwarding, set a future expiry, and serve
it at HTTPS `/.well-known/security.txt` only after owner release instruction.
The site's own file (ekoterminal.com) is served by the API from
`apps/server/src/http/security-txt.ts`; this template is only for the exports. Private advisories must be enabled and
tested in each repository; a link alone is not evidence of a working channel.

The contracts export additionally includes the implemented privileged-power
inventory, security evidence, findings and the historical review scope/report.
Some inherited evidence links refer to omitted runtime or ignored raw runs;
[the evidence index](EVIDENCE.md) states that limitation explicitly. Reports retain
their original candidates; no old result becomes a new-candidate approval.

Missing planned artifacts stay unresolved: reviewed Roles permission configuration,
three independent contract reviews, Slither/Aderyn output, completed window,
final hash and deployment equality. None is replaced with a fabricated artifact.
Use [CHECKLIST.md](CHECKLIST.md) for the owner handoff and findings table.

// TODO(spec): §3.5 names public repositories without export layout or distribution
// targets. These manifests prepare source-review subsets; finalize standalone
// packaging and approved public URLs in the separately authorized release.
