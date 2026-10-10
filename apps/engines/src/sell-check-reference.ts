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
  if (!run) return;
  const simulations: Simulation[] = [];
  for (const size of SIZES) {
    const probe = run.data.probes?.find(p => p.sizeUsd === size);
    if (!probe || (probe.status !== 'sellable' && probe.status !== 'sell_failed') || !probe.spentWei || BigInt(probe.spentWei) <= 0n) return;
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
