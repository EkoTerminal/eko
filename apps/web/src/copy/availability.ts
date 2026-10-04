import { PlaybookIdSchema, type CoinCardMeta, type PlaybookId } from '@eko/shared';
export const SCANNING = 'Scanning…';
/** Fast Scan normally lands within seconds; past this age a pending row is waiting, not scanning.
 * TODO(spec): FRONTEND §3.4 defines only "Scanning…"; the 60 s threshold and "Scan delayed" copy need sign-off. */
export const SCAN_DELAYED_AFTER_SEC = 60;
export const SCAN_DELAYED = 'Scan delayed';
export const SCAN_DELAYED_DETAIL = "No verdict yet. This launch is waiting in the scan queue; Trade stays off until the guard's first scan finishes.";
export const NOT_FULLY_CHECKED = 'Not fully checked';
export const NOT_CHECKED = 'not checked yet';
export const PENDING_ORDER = 'Not fully checked. Some required checks have not run; review the missing checks before placing an order.';
export const NOT_INDEXED = 'Not indexed yet';
export const CARD_UNAVAILABLE = 'Coin card unavailable';
export const CARD_WAIT = 'Search the indexed token identity for its current status.';
export const NEAR_GRAD = 'Curve at 75% or more';
const checks:Record<string,string>={simulations:'buy-then-sell simulation',exitCosts:'exit costs',ownerPowerAnalysis:'owner powers',agentPct:'agent labels',crewPct:'crew labels',humanPct:'human labels',depthUsd:'liquidity depth',routing:'routing',completeLpOwnership:'complete LP ownership',antiSnipeTiming:'anti-snipe timing',taxes:'taxes',knownLocksAndVesting:'locks and vesting',bundlesHeldPct:'bundle holdings',freshWalletsPct:'fresh wallet holdings',circulating:'circulating supply',totalSupply:'total supply',dynamicPoolFees:'dynamic pool fees'};
export function missingChecks(evaluated?:PlaybookId[],meta?:CoinCardMeta,missing:string[]=[]) {
  const absent=evaluated ? PlaybookIdSchema.options.filter(id=>!evaluated.includes(id)) : [];
  const names=[...absent.map(id=>id.replaceAll('_',' ')),...missing,...Object.values(meta ?? {}).flatMap(m=>m.missing ?? [])];
  return `Not checked yet: ${[...new Set(names.map(n=>checks[n] ?? n.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ')))].join(', ') || 'buy-then-sell simulation, exit costs, wallet labels and owner powers'}.`;
}

export const CHECK_LEGEND='— not checked yet: exit costs and buyer mix arrive with the trade simulation and wallet labels';
// Plain-language keys for the Guard disclosures; the disclosure labels themselves stay on every row.
export const LEGACY_TITLE='Graded by EKO’s first rule set (rules 1.0.x), shown for reference.';
export const GUARD2_UNAVAILABLE_TITLE='The current buyer-risk check (Guard 2) has no result for this coin yet. Buys stay unavailable until it does.';
export const GUARD_LEGEND='Legacy assessment · rules 1.0.x: the grade from EKO’s first rule set, shown for reference. Guard 2 assessment unavailable: the current buyer-risk check has no result for this coin yet, and buys stay unavailable until it does.';

export const NOT_CHECKED_LABEL='Not checked yet';
export const NOT_TRACKED_LABEL='Not tracked yet';
export const FEED_GAPS_LEGEND='— not tracked yet: trades, Ghost Reports, swarm calls and burns arrive with their data sources.';
export const WALLET_LABELS_LATER='Wallet labels arrive later';
export const FULL_HISTORY='Show full history';
export const SUB_MINUTE_UNAVAILABLE='Sub-minute candle history is incomplete or unavailable';
export function emptyTradeWindow(lastTradeTs:number|null,now=Date.now()/1000) {
 if(lastTradeTs==null)return 'No trades in this window · no indexed trades yet';
 const age=Math.max(0,Math.trunc(now-lastTradeTs));
 const elapsed=age>=3600 ? `${Math.trunc(age/3600)} h` : age>=60 ? `${Math.trunc(age/60)} m` : `${age} s`;
 return `No trades in this window · last trade ${elapsed} ago`;
}
