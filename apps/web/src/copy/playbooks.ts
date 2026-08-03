import type { PlaybookId } from '@eko/shared';

/** First-party one-line copy; never use token descriptions or free-text event details. */
export const PLAYBOOK_DESCRIPTIONS: Record<PlaybookId, string> = {
  honeypot: 'Buys go through; sells revert or return almost nothing.',
  tax_trap: 'The owner can raise the sell tax after you buy.',
  removable_liquidity: 'The deployer controls the pool and can pull it.',
  fee_trap_pool: 'The default route runs through a pool charging 15% or more.',
  stuck_at_bonding: 'Heavy volume that never moves the curve; a few wallets cycling.',
  wash_to_trend: 'Volume made by wallets trading with themselves.',
  clone_swarm: 'Copies the name of a trending coin launched earlier.',
  exempt_insiders: 'Anti-sniper-exempt wallets bought a large share of supply.',
  bundle_dump: 'Wallets funded by one source bought in the first blocks.',
  migration_dump: 'Insiders sold into graduation.',
  malicious_hook: 'A v4 hook charges sells more than buys.',
  agent_bait: 'Token text carries instructions aimed at AI agents',
  serial_deployer: 'This deployer has launched coins that matched playbooks before.',
};
