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
| `fc09f5e5f70dca77975af5ffe802e7f3ef949a6e` | the commit titled "Sync public tree with source fc09f5e" | 2026-10-09 |
| `879f189b7c95159fd9cde7eecc5fbb27f4f7aca3` | the commit titled "Sync public tree with source 879f189" | 2026-10-09 |
| `efd3e831dc0b91bc8ae8fe4183666cba20a5a56a` | the commit titled "Sync public tree with source efd3e83" | 2026-10-10 |
| `8d678a4d3821244d4dc778014d593c41cbc1a036` | the commit titled "Sync public tree with source 8d678a4" | 2026-10-10 |
| `7426b590a755323f5d52c461fe8a757544c66663` | the commit titled "Sync public tree with source 7426b59" | 2026-10-10 |
| `c3613dfa6c7a79cde7a92fe2baba8dd8927b509c` | the commit titled "Sync public tree with source c3613df" | 2026-10-10 |
| `8e7512655fe8fe69508e6fda1f6af523faa9860f` | the commit titled "Sync public tree with source 8e75126" | 2026-10-11 |
| `900f269e9f1ceceeacaf9e20df1652f15d6089b4` | the commit titled "Sync public tree with source 900f269" | 2026-10-11 |
| `9962f702adfc197844774528be8eefbfd93e6880` | the commit titled "Sync public tree with source 9962f70" | 2026-10-11 |
| `06dc4b77d99b0711e7a921e89cfbc71e9688f769` | the commit titled "Sync public tree with source 06dc4b7" | 2026-10-11 |
| `0712c1627072a6f104c73ca10e94c41176ab5569` | the commit titled "Sync public tree with source 0712c16" | 2026-10-11 |
| `9d02c45102f474da027eaac509dae7c76567bf60` | the commit titled "Sync public tree with source 9d02c45" | 2026-10-11 |
| `670b60a6d522c56ca4edbbef84b120783f5f3bbb` | the commit titled "Sync public tree with source 670b60a" | 2026-10-11 |
| `25894a1206e8c6ccb5343350bb95b5ea692bd641` | the commit titled "Sync public tree with source 25894a1" | 2026-10-11 |
| `9ef6f48d9cf0873ddfc3665c3bbf8ef6eec9d0aa` | the commit titled "Sync public tree with source 9ef6f48" | 2026-10-11 |
| `f4c4bc386cc0f74ce7503f32e3655461dcdd38a9` | the commit titled "Sync public tree with source f4c4bc3" | 2026-10-11 |
| `0835064014b7b72ae4c85a231d94a0e78b27b448` | the commit titled "Sync public tree with source 0835064" | 2026-10-11 |
| `233b9575da62eea47f495ed6d0e79ef2bded7546` | the commit titled "Sync public tree with source 233b957" | 2026-10-11 |
| `58ac14632bb408396f86b929b5a30d382e5e215f` | the commit titled "Sync public tree with source 58ac146" | 2026-10-11 |
| `1523bc95513412630bc49414cdf9ff541c4e4865` | the commit titled "Sync public tree with source 1523bc9" | 2026-10-11 |
| `7600f28d2cc71f8d5f9741de0fb2cfb0ae6cbedc` | the commit titled "Sync public tree with source 7600f28" | 2026-10-12 |
| `9c5dcd301b41f1a12f30b0a4612844d8b3ef1311` | the commit titled "Sync public tree with source 9c5dcd3" | 2026-10-12 |
| `e51d1e7dca12b5e948eef80e716efcb8f0b74c0c` | the commit titled "Sync public tree with source e51d1e7" | 2026-10-12 |
| `ea4d9fe8b0e44095acbd0cd9ae1f7abacaf9cfad` | the commit titled "Sync public tree with source ea4d9fe" | 2026-10-12 |
| `26f2195f11cd7fb83c500cd3ef27ef7429a8443c` | the commit titled "Sync public tree with source 26f2195" | 2026-10-12 |
| `e1e314be30fb9645378037b9ef0899eb34891a51` | the commit titled "Sync public tree with source e1e314b" | 2026-10-12 |
| `fbfb96a801cfa8293dc2c02880f3edcd2ce7eedc` | the commit titled "Sync public tree with source fbfb96a" | 2026-10-12 |
| `c0d2388eec9dfe25a468e5a6201eabed653f6f44` | the commit titled "Sync public tree with source c0d2388" | 2026-10-12 |
| `48c1f9a59a946a4e5998ce1549c564f3a2c29712` | the commit titled "Sync public tree with source 48c1f9a" | 2026-10-12 |
| `0a4a20323d4b6bc41e8e0a7a6d51100303a26740` | the commit titled "Sync public tree with source 0a4a203" | 2026-10-12 |
| `083387c4b0bc75bd91f9df940a604366acf69f43` | the commit titled "Sync public tree with source 083387c" | 2026-10-12 |
| `1b37acac25f2b3aecb5dab9a4ba590e29d4dde0e` | the commit titled "Sync public tree with source 1b37aca" | 2026-10-12 |
| `0ce92d50a0f151a0e05317b6e16774de576be2d6` | the commit titled "Sync public tree with source 0ce92d5" | 2026-10-12 |
| `db23aa0f6f1214ab842497f85851bd80b627cfc2` | the commit titled "Sync public tree with source db23aa0" | 2026-10-12 |
| `a4831d6394f19e54f26ba618485884ea4d00afc6` | the commit titled "Sync public tree with source a4831d6" | 2026-10-12 |
| `a197ba4d7ef23eb36d8c0c875a5c4f09ac912be9` | the commit titled "Sync public tree with source a197ba4" | 2026-10-12 |
| `90b8d75a240c2fab2edf89ca9679dfc94477dc25` | the commit titled "Sync public tree with source 90b8d75" | 2026-10-12 |
| `b516fdd527349e3907d185fd59af179964135e75` | the commit titled "Sync public tree with source b516fdd" | 2026-10-12 |
| `ca585abfe9889e48f29151680820f9139d3b517c` | the commit titled "Sync public tree with source ca585ab" | 2026-10-12 |
| `f2bf832cd5180062dc3125329087f233cc13573c` | the commit titled "Sync public tree with source f2bf832" | 2026-10-12 |
| `49eb2e0c9a15cefcc6a8a46e76d979883345a0e7` | the commit titled "Sync public tree with source 49eb2e0" | 2026-10-12 |
| `2d3b088bfdb26427631cb57f750b5ca8c316034b` | the commit titled "Sync public tree with source 2d3b088" | 2026-10-12 |
| `9e3b3b0cd46c835a26e41ba117b333dbf8832f23` | the commit titled "Sync public tree with source 9e3b3b0" | 2026-10-12 |
| `456d24b6dbeb77c67c859c1aa5175ac3742a6f8b` | the commit titled "Sync public tree with source 456d24b" | 2026-10-12 |
| `81f5947872477706e9ff8dd18ee4af70f9a7f1ac` | the commit titled "Sync public tree with source 81f5947" | 2026-10-13 |
| `38d34bec47e6f67043805d4aec8188fea45f4e08` | the commit titled "Sync public tree with source 38d34be" | 2026-10-13 |
| `a1f483be97a69661cdec084faaa2e03f40b94ae1` | the commit titled "Sync public tree with source a1f483b" | 2026-10-13 |
| `a7f328fe6a72bcb9586b3f16f8c5382b6c14e475` | the commit titled "Sync public tree with source a7f328f" | 2026-10-13 |
| `32564bcabe966a15d2a262f81e11aa22d8db3fec` | the commit titled "Sync public tree with source 32564bc" | 2026-10-13 |
| `d7082d43af81bdeb9069b0a81a21387989ffac94` | the commit titled "Sync public tree with source d7082d4" | 2026-10-13 |
| `adf963d716dede2dfd06de4ae71492aeafa62655` | the commit titled "Sync public tree with source adf963d" | 2026-10-13 |
| `af626ca0da58f50775e838d56f7c6e5876062f12` | the commit titled "Sync public tree with source af626ca" | 2026-10-13 |
| `d483f002e2dbc896946324ce523a492c78b4152b` | the commit titled "Sync public tree with source d483f00" | 2026-10-13 |
| `7cfaa84ccda43157b8e5d5e037c1d34f820b0a07` | the commit titled "Sync public tree with source 7cfaa84" | 2026-10-13 |
| `798bd689e4c9196d66657c9613517712684e6aa0` | the commit titled "Sync public tree with source 798bd68" | 2026-10-13 |
| `eb9f80f6fafc796e1fbc2e3feac0982bbe5be7d3` | the commit titled "Sync public tree with source eb9f80f" | 2026-10-13 |
| `0b0365075f01c87d3cdc84aeeb7a7066b7285f92` | the commit titled "Sync public tree with source 0b03650" | 2026-10-13 |
| `046b849f8a50b6a03f69aec8b2d8b27579e276f6` | the commit titled "Sync public tree with source 046b849" | 2026-10-13 |
| `b4afbb2af6ffd6df4e45a6b6c159524b3fb94747` | the commit titled "Sync public tree with source b4afbb2" | 2026-10-13 |
| `aa7366404462140f1b2d6e6345c1e5d24bac5251` | the commit titled "Sync public tree with source aa73664" | 2026-10-13 |
| `a2c3341a30ca1c8361070ee5d999e26c594d2232` | the commit titled "Sync public tree with source a2c3341" | 2026-10-13 |
| `7cc2d57a82cb1a7a5c98cab4a19b17d0df230933` | the commit titled "Sync public tree with source 7cc2d57" | 2026-10-13 |
| `0dd96d80fe440646baa87160547925acb3a28de1` | the commit titled "Sync public tree with source 0dd96d8" | 2026-10-10 |
| `bb36aff4330e11e4343151575ba575bf0937d3eb` | the commit titled "Sync public tree with source bb36aff" | 2026-10-13 |
| `ed92c4136109d247fc6184c2224a918034c7b75a` | the commit titled "Sync public tree with source ed92c41" | 2026-10-13 |
| `7992b1f43067dee8e64dffbabab9f8d9fb3def2e` | the commit titled "Sync public tree with source 7992b1f" | 2026-10-13 |
| `33ba04a68cf72e5c8c06965c5125fa80f2535dc5` | the commit titled "Sync public tree with source 33ba04a" | 2026-10-13 |
| `a495be1a2209de2dbc03a4eb08571202195d5b97` | the commit titled "Sync public tree with source a495be1" | 2026-10-13 |
| `faca5ec6471a232267a7b793a6321f3e1959dea4` | the commit titled "Sync public tree with source faca5ec" | 2026-10-14 |
| `1ebae9c542eb0c4baf631af7b1426998a0661f29` | the commit titled "Sync public tree with source 1ebae9c" | 2026-10-14 |
| `5dae538971bfaf2a063165b02494b6461b149c90` | the commit titled "Sync public tree with source 5dae538" | 2026-10-14 |
| `12954ff10c1d7c3e424797dfba5b7e9ec13829cc` | the commit titled "Sync public tree with source 12954ff" | 2026-10-15 |
| `d765a3f62d502d79df6b27b60ae12ccc5285cb92` | the commit titled "Sync public tree with source d765a3f" | 2026-10-15 |
| `d1e4dd58d27e506d443ee588aa7bb706962ca475` | the commit titled "Sync public tree with source d1e4dd5" | 2026-10-15 |
| `1bf7b5e0f671727c85821695bb8d454e19404c88` | the commit titled "Sync public tree with source 1bf7b5e" | 2026-10-15 |
| `0c50969a2ced6df0862b8064f0159e759eac1a9e` | the commit titled "Sync public tree with source 0c50969" | 2026-10-15 |
| `a2bc70fa61ccb6b1b3147e7a9edc41d07f52d491` | the commit titled "Sync public tree with source a2bc70f" | 2026-10-15 |
| `9de198e6b7930d281015cb00cd0a165aca6fb5e8` | the commit titled "Sync public tree with source 9de198e" | 2026-10-16 |
| `eae3feff10462d4ba6065b79620ea1f0c2b4246c` | the commit titled "Sync public tree with source eae3fef" | 2026-10-17 |
| `adacafca7e95b1e41d1f20e77273add5c58b9306` | the commit titled "Sync public tree with source adacafc" | 2026-10-17 |
| `c11ff87fca56b588e7fb47ed7098aeade5de47f8` | the commit titled "Sync public tree with source c11ff87" | 2026-10-17 |
| `4c0d7c8b8ed645aecd2b2fa7797f1de80d99bbd2` | the commit titled "Sync public tree with source 4c0d7c8" | 2026-10-17 |
| `2e6490594c34fdd26fbc0995303997e3572a0fc4` | the commit titled "Sync public tree with source 2e64905" | 2026-10-17 |
| `ab7078e9880569c4ffea0884082acccc03ea26c1` | the commit titled "Sync public tree with source ab7078e" | 2026-10-17 |
| `bfd366e2ce3b4b5abc405067f65a3cff928d2874` | the commit titled "Sync public tree with source bfd366e" | 2026-10-17 |
| `d4a39fcabe0d8b8f12a1f1a03086e8a34631a9a3` | the commit titled "Sync public tree with source d4a39fc" | 2026-10-17 |
| `358c3ce47089551aeba8b69b78629d375812e875` | the commit titled "Sync public tree with source 358c3ce" | 2026-10-17 |
| `cfa7b1dc19990e0a946b2f1dfed2e85c3fe890bb` | the commit titled "Sync public tree with source cfa7b1d" | 2026-10-17 |
| `1e221452b3839bef5ac49b02568c54424fedb7c3` | the commit titled "Sync public tree with source 1e22145" | 2026-10-17 |

## Original export (October 2, 2026)

The first export covered tracked application, package, contract, infrastructure and test source from
`2997466`. It excluded internal documentation, task reports, launch plans, research notes, internal
screenshots and brand collateral; those are included from the October 3 sync onwards.

PolyForm Noncommercial applies to EKO-owned material only. It does not replace any third-party
license, attribution or copyright notice. Upstream bundled sources retain their existing terms.
