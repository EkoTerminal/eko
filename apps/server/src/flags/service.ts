import { FLAG_STAGES, FlagNameSchema, FlagsSchema, OpsSwitchSchema, type FlagName, type OpsSwitch } from '@eko/shared';
import type { Db } from '../db/client.js';
import { featureFlags } from '../db/schema.js';

export function parseFlagOverride(value: string): Set<FlagName> {
  const flags = new Set<FlagName>();
  for (const name of value.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (name.toLowerCase() === 'd0') {
      for (const flag of FLAG_STAGES.D0) flags.add(flag);
    } else {
      const result = FlagNameSchema.safeParse(name);
      if (!result.success) throw new Error(`Unknown FLAGS entry: ${name}`);
      flags.add(result.data);
    }
  }
  return flags;
}

export const FLAG_CACHE_MS = 10_000;
const emptyFlags = (): Record<FlagName, boolean> => FlagsSchema.parse(
  Object.fromEntries(Object.values(FLAG_STAGES).flat().map((flag) => [flag, false])),
);

type FlagRow = typeof featureFlags.$inferSelect;

export class FlagService {
  private readonly overrides: Set<FlagName>;
  private snapshot?: { flags: Record<FlagName, boolean>; ops: Record<OpsSwitch, boolean>; at: number };
  private pending?: Promise<void>;

  constructor(
    private readonly read: () => Promise<FlagRow[]>,
    override = '',
    private readonly clock: () => number = Date.now,
  ) {
    this.overrides = parseFlagOverride(override);
  }

  static fromDb(db: Db, override: string): FlagService {
    return new FlagService(() => db.select().from(featureFlags), override);
  }

  private async refresh(): Promise<void> {
    if (this.snapshot && this.clock() - this.snapshot.at < FLAG_CACHE_MS) return;
    if (!this.pending) {
      this.pending = (async () => {
        let rows: FlagRow[];
        try { rows = await this.read(); }
        catch (err) {
          // Keep serving the last known flags through a database blip; with none yet, the caller sees the error.
          if (this.snapshot) { this.snapshot = { ...this.snapshot, ops: { ...this.snapshot.ops, trading_live: false }, at: this.clock() }; return; }
          throw err;
        }
        const flags = emptyFlags();
        const ops: Record<OpsSwitch, boolean> = { trading_live: false, swarm_ranking: false };
        for (const row of rows) {
          // TODO(spec): Audience targeting has no contract yet; only public rows affect global state.
          if (row.audience !== 'public') continue;
          const flag = FlagNameSchema.safeParse(row.key);
          const op = OpsSwitchSchema.safeParse(row.key);
          if (flag.success) flags[flag.data] = row.enabled;
          else if (op.success) ops[op.data] = row.enabled;
        }
        for (const flag of this.overrides) flags[flag] = true;
        this.snapshot = { flags, ops, at: this.clock() };
      })().finally(() => { this.pending = undefined; });
    }
    await this.pending;
  }

  async all(): Promise<Record<FlagName, boolean>> {
    await this.refresh();
    return { ...this.snapshot!.flags };
  }

  async isOn(flag: FlagName): Promise<boolean> {
    return (await this.all())[flag];
  }

  async isOpsOn(op: OpsSwitch): Promise<boolean> {
    if (op === 'trading_live') {
      // Read the durable execution stop without refreshing/extending the product flag cache.
      try {
        const rows = await this.read();
        return rows.find(row => row.key === op && row.audience === 'public')?.enabled ?? false;
      } catch { return false; }
    }
    await this.refresh();
    return this.snapshot!.ops[op];
  }
}
