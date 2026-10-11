import { binary, type ChainDb } from '@eko/db';
import { createHash } from 'node:crypto';
import type { Simulation } from '@eko/playbooks';
import type { LoadedSources } from './sources.js';

/** A sell check older than this, by the card's block time, is not this card's honeypot evidence. */
export const SELL_CHECK_CARD_MAX_AGE_SEC = 86_400;
/** The two reference sizes CA-34 requires for the honeypot check. */
const SIZES = [100, 1000] as const;
interface StoredProbe { sizeUsd: number; status: 'sellable' | 'sell_failed' | 'buy_failed' | 'unavailable'; venue: string;
  spentWei: string | null; returnedWei: string | null; exitCostPct: number | null; revert?: string | null }

/**
 * Pons coins have no reference simulation (loadReferenceInputs skips them), so their honeypot check never ran and no
 * coin could be Clear. The live sell check already buys and sells $100 and $1,000 on the coin's own route (the curve,
 * or its pool after graduation) at a pinned block. Its newest run at or below the card's block, on the route the coin
 * trades on at that block and within a day, is the card's honeypot input. Probes are measurements only: a failed sell
 * is Info (contract_restricted, §6.2), never Danger without a deep simulation. Live cards only; replay never reads it.
 */
export async function loadSellCheckReference(db: ChainDb, s: LoadedSources) {
  if (s.launchpad !== 'pons') return;
  const graduated = s.token.graduated_block != null && Number(s.token.graduated_block) <= s.asOfBlock;
  const venues = graduated ? ['uniswap_v3', 'uniswap_v4'] : ['pons_curve'];
  const run = (await db.sql.query<{ id: string; block: string; data: { probes?: StoredProbe[] } }>(
    `SELECT id::text,block::text,data FROM sell_check_runs WHERE coin=$1 AND block<=$2 AND checked_at>=to_timestamp($3::double precision)
     AND data->'route'->>'venue'=ANY($4::text[]) AND status IN ('sellable','refused') ORDER BY block DESC,id DESC LIMIT 1`,
    [binary(s.coin), s.asOfBlock, s.asOfSec - SELL_CHECK_CARD_MAX_AGE_SEC, venues])).rows[0];
  if (!run) return loadObservedReference(db, s, graduated);
  const simulations: Simulation[] = [];
  for (const size of SIZES) {
    const probe = run.data.probes?.find(p => p.sizeUsd === size);
    if (!probe || (probe.status !== 'sellable' && probe.status !== 'sell_failed') || !probe.spentWei || BigInt(probe.spentWei) <= 0n) return loadObservedReference(db, s, graduated);
    const returned = probe.returnedWei ? BigInt(probe.returnedWei) : 0n;
    simulations.push({ id: `sell-check:${run.id}:${size}`, sizeUsd: size, block: Number(run.block), buyOk: true, sellOk: probe.status === 'sellable',
      returnedInputShare: Number(returned * 1_000_000n / BigInt(probe.spentWei)) / 1_000_000,
      traceDigest: `sha256:${createHash('sha256').update(JSON.stringify(probe)).digest('hex')}`,
      ...(probe.revert ? { revert: probe.revert } : {}),
      // A probe alone never confirms a blocked exit; a failed sell is a contract restriction (Info).
      confirmedBlockedExit: false, contractRestricted: probe.status === 'sell_failed' });
  }
  s.simulations = [...(s.simulations ?? []), ...simulations];
  s.sellCheckReference = { runId: run.id, block: Number(run.block) };
  // Measured effective charge (getters never are): both legs pay the same fixed Pons fee plus creator tax (§7.3) and a
  // round trip's price impact cancels on the curve or pool, so each leg is 1 - sqrt(1 - round-trip loss). The larger
  // of the two sizes is used. Only when both sells went through; a failed sell measures no tax.
  if (!s.taxes && simulations.every(p => p.sellOk)) {
    const legPct = Math.max(...simulations.map(p => 100 * (1 - Math.sqrt(Math.min(1, Math.max(0, p.returnedInputShare))))));
    const pct = Math.round(legPct * 100) / 100;
    s.taxes = { buyPct: pct, sellPct: pct, mutable: null, changes: [] };
  }
}

/** Independent sellers within a day before the card that complete a coin's honeypot check without a sell check. */
export const OBSERVED_SELLERS = 3;
/**
 * A coin whose route the sell check cannot probe has no honeypot input: about one Pons launch in ten pairs its curve with
 * USDG, a Robinhood stock token or another Pons coin, and the probe buys with ETH (the curve reverts
 * UnexpectedNativeValue), so 1,290 such coins stayed pending on 2026-10-11. Its own market is the evidence instead:
 * at least OBSERVED_SELLERS distinct wallets, none the deployer or a snipe-tax-exempt wallet, sold on the coin's current
 * route within a day before the card's block (a blocked sell leaves no swap). On the curve, the measured fee and tax
 * of those days' trades (Pons trade events report them in the pair token's units) are its taxes. Live cards only.
 */
async function loadObservedReference(db: ChainDb, s: LoadedSources, graduated: boolean) {
  const insiders = [s.deployer, ...s.exemptionWallets].map(binary);
  const venues = graduated ? ['uniswap_v3', 'uniswap_v4'] : ['pons_curve'];
  const sellers = (await db.sql.query<{ n: string; last: string | null }>(`SELECT count(DISTINCT trader)::text AS n,max(block)::text AS last FROM swaps
    WHERE coin=$1 AND side=-1 AND venue=ANY($2::text[]) AND block<=$3 AND ts>=to_timestamp($4::double precision) AND trader IS NOT NULL AND NOT senders_pending
      AND NOT trader=ANY($5::bytea[])`, [binary(s.coin), venues, s.asOfBlock, s.asOfSec - SELL_CHECK_CARD_MAX_AGE_SEC, insiders])).rows[0];
  if (!sellers || Number(sellers.n) < OBSERVED_SELLERS) return;
  s.observedSellers = { sellers: Number(sellers.n), block: Number(sellers.last) };
  if (graduated || s.taxes) return;
  // Effective charge per leg from executed curve trades: a buy's fee and tax come out of its gross input, a sell's out of
  // its gross payout (quoteOut is net). The median of each side over the same day.
  const legs = (await db.sql.query<{ side: string; pct: number | null }>(`SELECT data->>'side' AS side,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY 100*((data->>'feeEth')::numeric+(data->>'taxEth')::numeric)
        /NULLIF(CASE WHEN (data->>'side')='1' THEN (data->>'amountEth')::numeric ELSE (data->>'amountEth')::numeric+(data->>'feeEth')::numeric+(data->>'taxEth')::numeric END,0)) AS pct
    FROM pons_events WHERE token=$1 AND kind='trade' AND block<=$2 AND (data->>'amountEth') ~ '^[0-9]+$' AND (data->>'feeEth') ~ '^[0-9]+$' AND (data->>'taxEth') ~ '^[0-9]+$'
      AND block>=(SELECT coalesce(max(number),0) FROM engine_block_times WHERE ts<=to_timestamp($3::double precision))
    GROUP BY 1`, [binary(s.coin), s.asOfBlock, s.asOfSec - SELL_CHECK_CARD_MAX_AGE_SEC])).rows;
  const buy = legs.find(l => l.side === '1')?.pct, sell = legs.find(l => l.side === '-1')?.pct;
  if (buy != null && sell != null) s.taxes = { buyPct: Math.round(Number(buy) * 100) / 100, sellPct: Math.round(Number(sell) * 100) / 100, mutable: null, changes: [] };
}
