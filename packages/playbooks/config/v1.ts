// BACKEND §7.3, verbatim thresholds. No YAML parser is installed in the lockfile.
export interface PlaybookConfig {
  honeypot: { minLossPct: number; requireDeepSim: boolean };
  tax_trap: { fixedInfoMaxPct: number; fixedMonitorMaxPct: number; mutableMonitorMaxPct: number };
  removable_liquidity: { deployerLpShare: number; thinDepth2PctUsd: number; priorRemovalsDanger: number };
  fee_trap_pool: { feeTrapBps: number };
  stuck_at_bonding: { minAgeH: number; volToProgress: number; topClusters: number; topClusterShare: number; deployerStuckDanger: number };
  wash_to_trend: { roundTripSec: number; maxNetShare: number; monitorPct: number; dangerPct: number; usdPerTrader1h: number; maxTraders: number; minVolumeUsd1h: number; minRoundTripsPerActor: number };
  clone_swarm: { trendingTopN: number; originalMinAgeMin: number; trendWindowMin: number; dominantPairShare: number };
  exempt_insiders: { boughtSupplyMonitor: number; boughtSupplyDanger: number };
  bundle_dump: { minWallets: number; fundingWindowH: number; firstBlocks: number; heldMonitor: number; heldDanger: number };
  migration_dump: { windowMin: number; soldMonitor: number; soldDanger: number; impactDanger: number };
  malicious_hook: { quoteSimGapPct: number; asymmetricFeePp: number };
  agent_bait: { maxScanChars: number };
  serial_deployer: { monitorRuns: number; dangerRuns: number; spamLaunches7d: number; countSelf: false; dangerOutcomes: readonly ('rugged' | 'honeypot' | 'dumped')[] };
}

export const CONFIG_V1: Readonly<{ [K in keyof PlaybookConfig]: Readonly<PlaybookConfig[K]> }> = Object.freeze({
  honeypot: Object.freeze({ minLossPct: 95, requireDeepSim: true }),
  tax_trap: Object.freeze({ fixedInfoMaxPct: 5, fixedMonitorMaxPct: 25, mutableMonitorMaxPct: 10 }),
  removable_liquidity: Object.freeze({ deployerLpShare: 0.5, thinDepth2PctUsd: 500, priorRemovalsDanger: 1 }),
  fee_trap_pool: Object.freeze({ feeTrapBps: 1500 }),
  stuck_at_bonding: Object.freeze({ minAgeH: 6, volToProgress: 5, topClusters: 3, topClusterShare: 0.6, deployerStuckDanger: 3 }),
  wash_to_trend: Object.freeze({ roundTripSec: 300, maxNetShare: 0.1, monitorPct: 50, dangerPct: 80, usdPerTrader1h: 5000, maxTraders: 20, minVolumeUsd1h: 10000, minRoundTripsPerActor: 2 }),
  clone_swarm: Object.freeze({ trendingTopN: 50, originalMinAgeMin: 10, trendWindowMin: 60, dominantPairShare: 0.8 }),
  exempt_insiders: Object.freeze({ boughtSupplyMonitor: 0.20, boughtSupplyDanger: 0.50 }),
  bundle_dump: Object.freeze({ minWallets: 3, fundingWindowH: 24, firstBlocks: 3, heldMonitor: 0.15, heldDanger: 0.30 }),
  migration_dump: Object.freeze({ windowMin: 5, soldMonitor: 0.30, soldDanger: 0.60, impactDanger: 0.30 }),
  malicious_hook: Object.freeze({ quoteSimGapPct: 2, asymmetricFeePp: 5 }),
  agent_bait: Object.freeze({ maxScanChars: 4000 }),
  serial_deployer: Object.freeze({ monitorRuns: 1, dangerRuns: 3, spamLaunches7d: 20, countSelf: false, dangerOutcomes: Object.freeze(['rugged', 'honeypot', 'dumped'] as const) }),
});
