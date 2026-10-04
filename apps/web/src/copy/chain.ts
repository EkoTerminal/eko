import type { RadarRow } from '@eko/shared';

// Chain and launchpad context: one chain (FACTS §2), named the same way on every surface.
export const CHAIN_NAME = 'Robinhood Chain';
export const CHAIN_TITLE = 'Robinhood Chain · chain ID 4663';

type Launchpad = RadarRow['launchpad'];
// Pairs, the coin view and the stage filter treat every non-launchpad pool as Uniswap.
const LAUNCHPAD_LABELS: Record<Launchpad, string> = { pons: 'Pons', occupy: 'Occupy', flap: 'Flap', klik: 'Klik', other: 'Uniswap' };
/** "Pons", "Pons → pool" once a Pons coin has migrated, or the pool venue for everything else. */
export function launchpadLabel(launchpad: Launchpad, migrated = false) {
  return launchpad === 'pons' && migrated ? 'Pons → pool' : LAUNCHPAD_LABELS[launchpad] ?? 'Uniswap';
}
