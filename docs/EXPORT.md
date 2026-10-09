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
| `185a75991f24b23407fee2aa33b798e7179ce15d` | `49f2b69273765e843c37beea8d7d91c519e190d7` | 2026-10-04 |
| `30e70d416e166089b4f7534fc699a40c1edc9b5d` | the commit titled "Sync public tree with source 30e70d4" | 2026-10-04 |
| `68bd26f4229ce22c573fc100da44191918f83790` | the commit titled "Sync public tree with source 68bd26f" | 2026-10-04 |
| `d0a5a6b40c4c125e6cbc8ceb2a6349cd369f46f8` | the commit titled "Sync public tree with source d0a5a6b" | 2026-10-04 |
| `4f9fd6a905a5fed65825bc3ef0dd44e735afbc55` | the commit titled "Sync public tree with source 4f9fd6a" | 2026-10-04 |
| `dc55d7f416bc22828ef36161fd1e043ec6a9bb23` | the commit titled "Sync public tree with source dc55d7f" | 2026-10-04 |
| `e349ae2f5602f107a5aa8d425df5fa7647e3a4f6` | the commit titled "Sync public tree with source e349ae2" | 2026-10-04 |
| `197fe3dce62e80e98f1bac29d166845146ee612d` | the commit titled "Sync public tree with source 197fe3d" | 2026-10-05 |
| `bf8040ad96782f043caff35fce9f30bd70aa93b3` | the commit titled "Sync public tree with source bf8040a" | 2026-10-05 |
| `4af91931fede4575db78b20996bbe27922380ad1` | the commit titled "Sync public tree with source 4af9193" | 2026-10-05 |
| `daf2ad87bcbe186feb20691830eaf8139a09808b` | the commit titled "Sync public tree with source daf2ad8" | 2026-10-05 |
| `15212a94681104dc171c008032dbec85123ffbe6` | the commit titled "Sync public tree with source 15212a9" | 2026-10-05 |
| `f223b8a260322bc83f33e9fa6cb03987be2d203a` | the commit titled "Sync public tree with source f223b8a" | 2026-10-05 |
| `2b9af55221ba24f0d6300bafe159f4d3fd50a2c9` | the commit titled "Sync public tree with source 2b9af55" | 2026-10-05 |
| `923b2d18d7b9279c6f71f3628677a74fe55b3000` | the commit titled "Sync public tree with source 923b2d1" | 2026-10-05 |
| `ebd7017e617156d1972722d4ab8ad8cc23181281` | the commit titled "Sync public tree with source ebd7017" | 2026-10-05 |
| `5d28d95e7cafb77548a7a5a2e3f3be8aa126bfea` | the commit titled "Sync public tree with source 5d28d95" | 2026-10-05 |
| `c31e029f705f19cf9106a8fb650866486a047946` | the commit titled "Sync public tree with source c31e029" | 2026-10-05 |
| `98fc2f03a15ec222dcaac0370e35aebe440c7e8a` | the commit titled "Sync public tree with source 98fc2f0" | 2026-10-05 |
| `36699ee74131551304c487538692878debeb363a` | the commit titled "Sync public tree with source 36699ee" | 2026-10-06 |
| `f650d732daeb81109c6872000e2e44eb325846d0` | the commit titled "Sync public tree with source f650d73" | 2026-10-06 |
| `c1baea6238d8a9b8ed57ae80730e7270d0cb6691` | the commit titled "Sync public tree with source c1baea6" | 2026-10-06 |
| `f2625a71594464fcff73afa1396105cb7ec526ec` | the commit titled "Sync public tree with source f2625a7" | 2026-10-07 |
| `0e91390aa3e42bb588a82edc13873f67c11d8a4c` | the commit titled "Sync public tree with source 0e91390" | 2026-10-07 |
| `7fc7dc89d362335a6d80798ab8c778d9f8d13aca` | the commit titled "Sync public tree with source 7fc7dc8" | 2026-10-07 |
| `701d89d54d06b96cff9bc5174ed77be5a2821a7f` | the commit titled "Sync public tree with source 701d89d" | 2026-10-08 |
| `a06c02d18349aeacdb9227008c269b198e32c176` | the commit titled "Sync public tree with source a06c02d" | 2026-10-08 |
| `f0238c86853c936b2f7a1844b00459c974d8c109` | the commit titled "Sync public tree with source f0238c8" | 2026-10-08 |
| `a90f6ea3f424d8db99b06076a9d62ebccbf39d59` | the commit titled "Sync public tree with source a90f6ea" | 2026-10-08 |
| `1bf092d6b545f146e595465f0bd3206a46aad71d` | the commit titled "Sync public tree with source 1bf092d" | 2026-10-09 |
| `90a188d1b82816a731d800cc7995311abe176457` | the commit titled "Sync public tree with source 90a188d" | 2026-10-09 |
| `ac4553e3bdecba392ec863ac2a17e210947e9912` | the commit titled "Sync public tree with source ac4553e" | 2026-10-09 |
| `07ef0a67fc66836f8e9e6e9cc88ece085c01ef3a` | the commit titled "Sync public tree with source 07ef0a6" | 2026-10-09 |
| `0a710193da3aa610215cb482cb55641a22a53832` | the commit titled "Sync public tree with source 0a71019" | 2026-10-09 |
| `cf8e5a72c5bd55fa7a8127ac8c7f2e5525282d55` | the commit titled "Sync public tree with source cf8e5a7" | 2026-10-09 |
| `c05738386f4568eae524628d34beeaef348888c0` | the commit titled "Sync public tree with source c057383" | 2026-10-09 |
| `186959009e2f5db99946f26174ea372b16e9bddf` | the commit titled "Sync public tree with source 1869590" | 2026-10-09 |
| `290506a24ac0505aa9ea42a404d07136cd14cdd2` | the commit titled "Sync public tree with source 290506a" | 2026-10-09 |
| `07266d48a397acc1a51ac100df93f5b13f819e1d` | the commit titled "Sync public tree with source 07266d4" | 2026-10-09 |

## Original export (October 2, 2026)

The first export covered tracked application, package, contract, infrastructure and test source from
`2997466`. It excluded internal documentation, task reports, launch plans, research notes, internal
screenshots and brand collateral; those are included from the October 3 sync onwards.

PolyForm Noncommercial applies to EKO-owned material only. It does not replace any third-party
license, attribution or copyright notice. Upstream bundled sources retain their existing terms.
