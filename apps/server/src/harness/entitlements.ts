import { EntitlementsSchema, type PublicConfig } from '@eko/shared';
import type { Config } from '../config.js';

type LaunchConfig = Pick<Config, 'TIERS_ACTIVE_FROM' | 'FEE_ACTIVE_FROM' | 'LAUNCH_WEEK_AGENT_LIMIT'>;
export function phaseAt(cfg: LaunchConfig, now: number): PublicConfig['phase'] {
  if (cfg.TIERS_ACTIVE_FROM && now >= Date.parse(cfg.TIERS_ACTIVE_FROM)) return 'tiers';
  if (cfg.FEE_ACTIVE_FROM && now >= Date.parse(cfg.FEE_ACTIVE_FROM)) return 'token_live';
  return 'launch_week';
}

/** Shared account/MCP entitlement projection; no cookies or HTTP route dependencies. */
export class EntitlementsService {
  constructor(private cfg: LaunchConfig) {}
  get(now = Date.now()) {
    const phase = phaseAt(this.cfg, now);
    // TODO(spec): Launch-week agent quotas are unset; expose an explicit configured
    // limit, or 0 (unavailable), never infer unlimited agents. Unshipped runs stay 0.
    // TODO(spec): Token tiers/trials require their own accepted implementation;
    // after TIERS_ACTIVE_FROM expose Listener only, with no trial activation.
    return EntitlementsSchema.parse({ tier: 'listener', feeBps: phase === 'launch_week' ? 0 : 50,
      limits: { agents: phase === 'tiers' ? 1 : this.cfg.LAUNCH_WEEK_AGENT_LIMIT ?? 0,
        deepResearchPerDay: 0, loopBacktestsPerDay: 0, realtime: phase !== 'tiers' } });
  }
}
