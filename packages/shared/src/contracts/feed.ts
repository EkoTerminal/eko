import { GuardTotalsSchema } from './guard-card-api.js';
import { GuardAssessmentV2Schema, GuardReasonV2Schema, CoinCardV2Schema } from './guard-v2.js';
import { GuardFactorIdSchema, GuardReasonCodeSchema } from './guard-consumers.js';
import { z } from 'zod';
import { AddressSchema, UntrustedSchema, PlaybookIdSchema, LevelSchema, WalletLabelSchema } from './common.js';
import { CoinCardSchema, VerdictSchema, CoinCardFlowExtraSchema, CoinSignalSchema } from './coin.js';
// FACTS §7 and BACKEND §23 (v1.2).
export const CoinSummarySchema = z.object({
  guardV2: GuardAssessmentV2Schema.nullable().optional(),
  guardRefreshFailed: z.boolean().optional(),
  address: AddressSchema,
  name: UntrustedSchema,
  symbol: UntrustedSchema,
  launchpad: CoinCardSchema.shape.identity.shape.launchpad,
  stage: z.enum(['curve', 'graduated']),
  curvePct: z.number().optional(),
  priceUsd: z.number(),
  priceUnavailable: z.boolean().optional(),
  change1hPct: z.number(),
  liquidityUsd: z.number(),
  verdict: VerdictSchema.shape.level,
  topPlaybook: PlaybookIdSchema.optional(),
  ageSec: z.number(),
  // CA-35: numeric placeholders are never measurements.
  unavailable: z.array(z.enum(['exitCost', 'flow', 'liquidity', 'signal', 'change', 'marketCap', 'buyers', 'volume', 'spark'])).optional(),
  verdictPending: z.boolean().optional(),
  // TODO(spec): Additive row tooltip context avoids waiting for a separate card fetch.
  evaluatedPlaybooks: VerdictSchema.shape.evaluatedPlaybooks,
  missingChecks: z.array(z.string()).optional(),
  // CA-31 (accepted): market cap in USD for the Radar inspector and coin view.
  marketCapUsd: z.number().optional(),
});
export type CoinSummary = z.infer<typeof CoinSummarySchema>;
export const RadarRowSchema = CoinSummarySchema.extend({
  rank: z.number(),
  flow: z.intersection(CoinCardSchema.shape.flow, CoinCardFlowExtraSchema),
  exitCost1kPct: z.number(),
  beta: VerdictSchema.shape.beta.optional(),
  // CA-31 (proposed): the five-agent signal and the last 8 hours of prices (oldest first, at most 48 points).
  signal: CoinSignalSchema.optional(),
  spark8h: z.array(z.number()).max(48).optional(),
  change24hPct: z.number().optional(),
});
export type RadarRow = z.infer<typeof RadarRowSchema>;
// CA-36: totals cover every live coin, independent of the loaded page.
export const RadarTotalsSchema=z.object({coins:z.number().int().nonnegative(),clear:z.number().int().nonnegative(),monitor:z.number().int().nonnegative(),pending:z.number().int().nonnegative(),danger:z.number().int().nonnegative(),evaluatedToday:z.number().int().nonnegative(),
  // Last 24 hours, oldest first: distinct live coins evaluated, and coins given a new Danger verdict, per hour.
  evaluatedByHour:z.array(z.number().int().nonnegative()).length(24).optional(),dangerByHour:z.array(z.number().int().nonnegative()).length(24).optional()});
export type RadarTotals=z.infer<typeof RadarTotalsSchema>;
export const RadarResponseSchema=z.object({rows:z.array(RadarRowSchema),cursor:z.string().nullable(),delayedSec:z.number(),totals:RadarTotalsSchema.optional(),guardTotals:GuardTotalsSchema.optional()});
export const PairRowSchema = CoinSummarySchema.extend({
  column: z.enum(['new', 'near_grad', 'migrated']),
  buyers: z.number(),
  exitCost100Pct: z.number(),
  flow: z.intersection(CoinCardSchema.shape.flow, CoinCardFlowExtraSchema),
  antiSnipe: CoinCardSchema.shape.tradeability.shape.antiSnipe.optional(),
  verdictPending: z.boolean(),
});
export type PairRow = z.infer<typeof PairRowSchema>;
export const FeedItemSchema = z.object({
  guardV2: GuardAssessmentV2Schema.nullable().optional(),
  guardFactorId: GuardFactorIdSchema.optional(),
  guardReasonCode: GuardReasonCodeSchema.optional(),
  guardReason: GuardReasonV2Schema.optional(),
  id: z.string(),
  ts: z.number(),
  block: z.number(),
  kind: z.enum(['new_pair', 'agent_trade', 'crew_trade', 'verdict', 'playbook', 'swarm', 'clone', 'wash', 'graduation', 'burn']),
  coin: AddressSchema,
  symbol: UntrustedSchema,
  level: LevelSchema.optional(),
  playbookId: PlaybookIdSchema.optional(),
  label: WalletLabelSchema.optional(),
  sizeUsd: z.number().optional(),
  wallet: AddressSchema.optional(),
  crewId: z.string().optional(),
  // CA-32 (lead, additive, all optional): the structured fields the Feed's one-line descriptions are built from
  // (FRONTEND §3.3), so the web never parses free text. Absent field → that part of the line is left out.
  side: z.enum(['buy', 'sell']).optional(),
  beta: z.boolean().optional(),
  confidence: z.number().optional(),
  modelVersion: z.string().optional(),
  /** A declared agent's self-registered name (ERC-8004): untrusted text. */
  agentName: UntrustedSchema.optional(),
  /** EKO's own name for a crew. */
  crewName: z.string().optional(),
  crewWallets: z.number().int().nonnegative().optional(),
  /** Playbook match confidence, 0–100. */
  matchPct: z.number().min(0).max(100).optional(),
  /** For clone items: the symbol being copied (untrusted), and how many clones the same crew launched in 7 days. */
  cloneOf: UntrustedSchema.optional(),
  clones7d: z.number().int().nonnegative().optional(),
  /** For verdict items: time from the pair's first block to its first verdict. */
  firstVerdictMs: z.number().nonnegative().optional(),
  /** For swarm items (beta): personas that pass, out of how many. */
  swarm: z.object({ pass: z.number().int().nonnegative(), of: z.number().int().positive() }).optional(),
});
export type FeedItem = z.infer<typeof FeedItemSchema>;
export const BarSchema = z.object({
  ts: z.number(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  vUsd: z.number(),
});
export type Bar = z.infer<typeof BarSchema>;
export const TickSchema = z.object({
  ts: z.number(),
  price: z.number(),
  volumeUsd: z.number(),
  block: z.number(),
});
export type Tick = z.infer<typeof TickSchema>;
export const ScanResultSchema = z.object({
  id: z.string(),
  status: z.enum(['ready', 'pending', 'not_found', 'ambiguous']),
  card: CoinCardSchema.optional(),
  guardCard: CoinCardV2Schema.nullable().optional(),
  shareUrl: z.string(),
  message: z.string().optional(),
  candidates: z.array(CoinSummarySchema).optional(),
});
export type ScanResult = z.infer<typeof ScanResultSchema>;
export const BagReportSchema = z.object({
  wallet: AddressSchema.optional(),
  asOfBlock: z.number(),
  holdings: z.array(z.object({
    coin: CoinSummarySchema,
    // TODO(spec): CA-6 has no row availability contract; null is unknown, never zero.
    balance: z.string().nullable(),
    balanceStatus: z.enum(['observed', 'unavailable', 'error']).optional(),
    status: z.enum(['ready', 'pending', 'unavailable', 'error']).optional(),
    unavailable: z.array(z.enum(['balance', 'value', 'card', 'exitCost'])).optional(),
    error: z.enum(['balance_unavailable', 'card_unavailable', 'scan_failed', 'scan_queue_full']).optional(),
    valueUsd: z.number().optional(),
    playbooks: z.array(PlaybookIdSchema),
    exitCost1kPct: z.number().nullable(),
  })),
  summary: z.object({
    coins: z.number(),
    flagged: z.number(),
    danger: z.number(),
    valueUsd: z.number().optional(),
  }),
  shareUrl: z.string().optional(),
  // Indexed discovery is not an exhaustive chain balance inventory. Summary is per page.
  coverage: z.literal('indexed_candidates').optional(),
  cursor: AddressSchema.nullable().optional(),
});
export const BagShareRequestSchema = z.object({
  includeValues: z.boolean().default(false), includeWallet: z.boolean().default(false),
}).strict();
export const BagShareResponseSchema = z.object({ id: z.uuid(), shareUrl: z.string() });
// Public coin dollar fields are optional so omission does not masquerade as measured zero.
export const PublicBagReportSchema = BagReportSchema.extend({
  holdings: z.array(BagReportSchema.shape.holdings.element.extend({
    coin: CoinSummarySchema.omit({ guardV2: true }).partial({ priceUsd: true, liquidityUsd: true }),
  })),
});
export type PublicBagReport = z.infer<typeof PublicBagReportSchema>;
export type BagReport = z.infer<typeof BagReportSchema>;
