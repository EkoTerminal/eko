import { z } from 'zod';
import type { Db } from '../db/client.js';
import { auditLog, featureFlags } from '../db/schema.js';
import { deliverError } from './errors.js';

export const IncidentSchema = z.strictObject({ kind: z.enum(['guard_miss', 'rpc_outage', 'simulation_failure', 'stale_committer']) });
export type IncidentKind = z.infer<typeof IncidentSchema>['kind'];
export type IncidentAlert = { incidentId: number; kind: IncidentKind; severity: '1' | '2'; postMortemWithinHours?: number };
export type AlertSink = (alert: IncidentAlert) => Promise<void>;

export class IncidentService {
  constructor(private db: Db, private sinks: { page?: AlertSink; sentry?: AlertSink } = {}) {}
  async raise(accountId: string, kind: IncidentKind) {
    const alert = await this.db.transaction(async tx => {
      if (kind === 'guard_miss' || kind === 'rpc_outage' || kind === 'simulation_failure') {
        await tx.insert(featureFlags).values({ key: 'trading_live', enabled: false, audience: 'public' })
          .onConflictDoUpdate({ target: featureFlags.key, set: { enabled: false, audience: 'public' } });
      }
      const severity = kind === 'guard_miss' ? '1' : '2';
      const [record] = await tx.insert(auditLog).values({ accountId, action: 'ops.incident', data: {
        kind, severity, delivery: 'prepared', ...(kind === 'guard_miss' ? { scoreboardDraft: 'honeypots_missed', postMortemWithinHours: 24 } : {}),
      } }).returning();
      return { incidentId: record!.id, kind, severity, ...(kind === 'guard_miss' ? { postMortemWithinHours: 24 } : {}) } as IncidentAlert;
    });
    // The stop and audit commit before any sink. Missing or failed delivery never undoes the stop.
    for (const channel of ['page', 'sentry'] as const) {
      const sink = this.sinks[channel];
      let outcome = 'unavailable';
      if (sink) {
        try { await sink(alert); outcome = 'delivered'; }
        catch { outcome = 'failed'; }
      }
      await this.db.insert(auditLog).values({ accountId, action: 'ops.incident_delivery', data: { incidentId: alert.incidentId, channel, outcome } });
    }
    return { ...alert, prepared: true };
  }
}
// Sentry gets only a finite incident code and severity; no caller payload, account, wallet or secret.
export const sentryIncidentSink: AlertSink = async alert => {
  if (!await deliverError(new Error(`launch_incident_${alert.kind}`), { severity: alert.severity })) throw new Error('Incident Sentry delivery unavailable');
};
