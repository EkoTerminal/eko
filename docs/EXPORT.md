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

One licensed asset stays private: the Ague Thin font (Zafira Type, all rights reserved) is licensed for the hosted
site only. It is added at deploy time; builds from this repository fall back to Outfit (SIL OFL).

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
| `025d99339a17cc6d1a7f7c3921854a52c4c170bf` | `957d38206c25d361aa04e1f45328947ce19cde07` | 2026-10-04 |
| `04425f9453b4c9bdd89a401b0414d84639ac795f` | `3a00ecf5e626bdf3afd64a9b4d2773026dd9ab0c` | 2026-10-04 |
| `1ee00b6fe903747ac0ba42269da6b5875deb1753` | `0349f4c6c67e8191918a46383e10f8c2568ae62b` | 2026-10-04 |
| `67f660b9e574089d2ce8e751ff322ccfff3482d1` | `a3ffca5561dfe8b8b5662d2b54106144252820e6` | 2026-10-04 |
| `f62f6d3443f3e4e41504bddbcab8015543f3e9f4` | `587f602d0f07accddd808870fe09d75fdd3f8863` | 2026-10-04 |
| `185a75991f24b23407fee2aa33b798e7179ce15d` | the commit titled "Sync public tree with source 185a759" | 2026-10-04 |

## Original export (October 2, 2026)

The first export covered tracked application, package, contract, infrastructure and test source from
`2997466`. It excluded internal documentation, task reports, launch plans, research notes, internal
screenshots and brand collateral; those are included from the October 3 sync onwards.

PolyForm Noncommercial applies to EKO-owned material only. It does not replace any third-party
license, attribution or copyright notice. Upstream bundled sources retain their existing terms.
