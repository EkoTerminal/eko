# Public export scope

## Current scope (since October 3, 2026)

The public tree tracks the complete source tree: application, package, contract, infrastructure and test
source, plus the project documentation (`docs/`, including the spec in `docs/eko`, security and operations
docs, task packets and reports), brand assets, the audit-grade record (`.audit-grade/`) and CI workflows.
No private Git objects are imported, and no credentials or environment-secret files exist in the tree.
Two source paths stay out: internal captures (`docs/screenshots/`, which cannot be reviewed for identifiers
as text) and local editor tooling (`.claude/`).

Public-only files sit on top of the source tree: `LICENSE`, this README, `docs/EXPORT.md`,
`docs/PUBLIC_HISTORY.md`, the banner (`docs/media/banner.gif`, `scripts/render-banner.py`), the identity
guard (`scripts/public-guard.py`, `scripts/public-identity.json`, `scripts/test-public-guard.py`) and the
`public-guard` CI job. `AGENTS.md` adds a public-repository section to the source rules.

One source adaptation remains: the web development configuration resolves the optional marketing landing
directory relative to the project instead of a machine-specific path.

Every sync is scanned for configured personal identifiers before commit (the guard runs in the commit
and push hooks and in CI); no identifier occurred in the synced source content.

## Source revisions

Commit hashes in `.audit-grade/` and `docs/operations/` refer to the source repository. Each synced source
revision maps to a public commit:

| Source revision | Public commit | Date |
| --- | --- | --- |
| `2997466a96d4a62ffd5ac6b9e93f8f8ce343e1ed` | end of the reconstructed history | 2026-10-02 |
| `4641564ea803184b5e6d6705bb066c16762c285c` | `c27e406d4053c76c0423e3d69725fad02e5866a4` | 2026-10-03 |
| `d817eece93a75acbb40559e8151fb30b39dcbdd3` | `1755c39d3726f039119c2d14ae749014945037d6` | 2026-10-04 |
| `fe333be47aa94ffb19197386de35190a8cbbfec5` | `8b119d8f5f6ef983ed89145ac613a4da5e3ca862` | 2026-10-04 |
| `025d99339a17cc6d1a7f7c3921854a52c4c170bf` | the commit titled "Sync public tree with source 025d993" | 2026-10-04 |

## Original export (October 2, 2026)

The first export covered tracked application, package, contract, infrastructure and test source from
`2997466`. It excluded internal documentation, task reports, launch plans, research notes, internal
screenshots and brand collateral; those are included from the October 3 sync onwards.

PolyForm Noncommercial applies to EKO-owned material only. It does not replace any third-party
license, attribution or copyright notice. Upstream bundled sources retain their existing terms.
