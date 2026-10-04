# Pons v2 ABIs · verified on-chain, 2026-10-01 (launch dependency, due Oct 2)

Verified read-only against Robinhood Chain (chain id 4663) through `https://rpc.mainnet.chain.robinhood.com`, by
checking event topic hashes in deployed bytecode and decoding real logs. The block explorer
(robinhoodchain.blockscout.com) sits behind a Cloudflare bot check, so **`pnpm abi:pull` can't scrape it from a
script**; use a Blockscout API key, or these fragments plus the docs (docs.ponsfamily.com/v2), verified as below.

| Item | Result | Evidence |
|---|---|---|
| Factory | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`, 24,177 bytes | `TokenLaunched` topic in bytecode; 38 launches decoded in ~100k recent blocks |
| `event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)` | ✓ | topic `0x8d4aad49…`; sample: token `0xDc69…81F9`, curve `0x9927…1f63`, block 77,317,774 |
| `event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)` | ✓ | in curve bytecode; emitted |
| `event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)` | ✓ | in curve bytecode; emitted |
| `event SnipeTaxExempted(address indexed account)` | ✓ **(not in Pons's docs)** | 4 logs on the sample curve, all in the launch block (+0), 2 topics, no data. A wallet can appear twice (launcher = fee recipient): **dedupe** in the decoder |
| `event FeesSwept(uint256,uint256,uint256)`, `event Initialized(address)` | ✓ (names matched by hash; parameter names unknown) | curve logs |
| `function currentSnipeTaxBps(address) view returns (uint256)` | ✓ readable | 9900 (99%) at the launch block; 0 later |
| `feeBps()`, `creatorTaxBps()`, `launchedAt()`, `graduated()` | ✓ readable | `feeBps` = 100 (the 1% Pons fee); sample `creatorTaxBps` = 233 |
| Meme hook `0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044` | ✓ deployed (15,167 bytes) | `eth_getCode` |
| Graduation: `CurveCompleted`, `PoolGraduated`, `LaunchSwept` | **not yet observed** | none in the scanned window; verify on a graduated coin before the `stuck_at_bonding`/`migration_dump` decoders ship |
| Router `0xe33E9E479dF8802cb0866d5d05258bEc4cF62948` event `0xdcacba5e…` | unidentified | emitted with launches (likely launch-and-buy); identify before decoding router flows |

Other documented addresses (docs.ponsfamily.com/v2, not yet code-checked): Fee Escrow `0xd3AFEB2a…Ac9e`, Buyback Vault
`0x42df2a79…219c`, Launch Locker `0x267444D0…4952`, Launch Deployer `0x3711ceA4…1A42`, Graduation Executor
`0xC7819B64…9046`, Graduation Guard `0xf5695117…6C6C`.

**Status for the Oct 2 gate:** curve, hook and the `SnipeTaxExempted` event are verified, so Pons coins don't need the
quote-only fallback, and `exempt_insiders` can ship. `stuck_at_bonding`'s graduation decoding waits on the graduation
events above.
