# Published playbook thresholds

This exact threshold excerpt from BACKEND §7.3 is retained as the independent specification
fixture for the existing config equality test. Internal planning sections are not included.

### 7.3 Thresholds

```yaml
# packages/playbooks/config/v1.yaml — rules_version 1.0.2 (1.0.1, Oct 1: wash_to_trend volume floor and cycling rule; 1.0.2, Oct 2: serial_deployer excludes its own matches and needs bad outcomes or another playbook's danger for danger, after live calibration: 4 prolific deployers produced 166 of 170 dangers through the self-count). Any change bumps the version (it's hashed into receipts).
honeypot:            { minLossPct: 95, requireDeepSim: true }
tax_trap:            { fixedInfoMaxPct: 5, fixedMonitorMaxPct: 25, mutableMonitorMaxPct: 10 }
removable_liquidity: { deployerLpShare: 0.5, thinDepth2PctUsd: 500, priorRemovalsDanger: 1 }
fee_trap_pool:       { feeTrapBps: 1500 }
stuck_at_bonding:    { minAgeH: 6, volToProgress: 5, topClusters: 3, topClusterShare: 0.6, deployerStuckDanger: 3 }
wash_to_trend:       { roundTripSec: 300, maxNetShare: 0.1, monitorPct: 50, dangerPct: 80, usdPerTrader1h: 5000, maxTraders: 20, minVolumeUsd1h: 10000, minRoundTripsPerActor: 2 }
clone_swarm:         { trendingTopN: 50, originalMinAgeMin: 10, trendWindowMin: 60, dominantPairShare: 0.8 }
exempt_insiders:     { boughtSupplyMonitor: 0.20, boughtSupplyDanger: 0.50 }
bundle_dump:         { minWallets: 3, fundingWindowH: 24, firstBlocks: 3, heldMonitor: 0.15, heldDanger: 0.30 }
migration_dump:      { windowMin: 5, soldMonitor: 0.30, soldDanger: 0.60, impactDanger: 0.30 }
malicious_hook:      { quoteSimGapPct: 2, asymmetricFeePp: 5 }
agent_bait:          { maxScanChars: 4000 }
serial_deployer:     { monitorRuns: 1, dangerRuns: 3, spamLaunches7d: 20, countSelf: false, dangerOutcomes: [rugged, honeypot, dumped] }
```

On Pons coins the simulated buy and sell tax includes the Pons 1% standard fee as well as the fixed creator tax (our token: 1% + 1% = 2% total). Both are fixed, so a Pons coin whose creator tax is at most 4% stays Info under `fixedInfoMaxPct`. The card's reason names the creator tax separately from the Pons fee.

### 7.4 End of public excerpt
