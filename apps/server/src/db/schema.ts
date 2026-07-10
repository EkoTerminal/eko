import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  check,
  doublePrecision,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const now = () => sql`now()`;

// MCP-owned discovery/authorize state (BACKEND §9.1); consent/grants remain API-owned.
export const oauthClients = pgTable('oauth_clients', {
  id: text('id').primaryKey(),
  clientName: jsonb('client_name').$type<import('@eko/shared').Untrusted>().notNull(),
  redirectUris: jsonb('redirect_uris').$type<string[]>().notNull(),
  metadataDocument: boolean('metadata_document').notNull().default(false),
  createdAt: ts('created_at').notNull().default(now()),
  lastUsedAt: ts('last_used_at').notNull().default(now()),
}, t => [index('oauth_clients_last_used_idx').on(t.lastUsedAt)]);

export const oauthRequests = pgTable('oauth_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: text('client_id').notNull().references(() => oauthClients.id, { onDelete: 'cascade' }),
  redirectUri: text('redirect_uri').notNull(),
  codeChallenge: text('code_challenge').notNull(),
  codeChallengeMethod: text('code_challenge_method').notNull(),
  state: text('state').notNull(),
  scopes: jsonb('scopes').$type<import('@eko/shared').OAuthScope[]>().notNull(),
  resource: text('resource').notNull(),
  createdAt: ts('created_at').notNull().default(now()),
  expiresAt: ts('expires_at').notNull(),
}, t => [index('oauth_requests_expiry_idx').on(t.expiresAt)]);

export const oauthRegistrationLimits = pgTable('oauth_registration_limits', {
  subjectHash: text('subject_hash').primaryKey(),
  attempts: ts('attempts').array().notNull(),
  allowed: boolean('allowed').notNull(),
});

// MCP-owned shared rate counters (BACKEND §9.4); identifiers are HMACs, never bearers/IPs.
export const mcpRateLimits = pgTable('mcp_rate_limits', {
  subjectHash: text('subject_hash').primaryKey(),
  windowStart: ts('window_start').notNull(),
  hits: integer('hits').notNull(),
}, t => [index('mcp_rate_limits_window_idx').on(t.windowStart)]);

// API-owned harness state (BACKEND §§3.2, 9.1, 9.6).
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['robinhood_mcp', 'onchain', 'perp_venue', 'other'] }).notNull(),
  wallet: text('wallet'),
  status: text('status', { enum: ['active', 'soft_killed', 'disconnected'] }).notNull().default('active'),
  lastSeen: ts('last_seen'),
  createdAt: ts('created_at').notNull().default(now()),
}, t => [index('agents_account_idx').on(t.accountId)]);

export const policies = pgTable('policies', {
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  policy: jsonb('policy').$type<import('@eko/shared').Policy>().notNull(),
}, t => [primaryKey({ columns: [t.agentId, t.version] })]);

export const agentKeys = pgTable('agent_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  prefix: text('prefix').notNull().unique(),
  /** HMAC-SHA256 of the secret component; clear bearer keys are never stored. */
  hash: text('hash').notNull(),
  kind: text('kind', { enum: ['api', 'oauth'] }).notNull().default('api'),
  oauthGrantId: uuid('oauth_grant_id'),
  clientName: jsonb('client_name').$type<import('@eko/shared').ApiKeyInfo['clientName']>(),
  scopes: jsonb('scopes').$type<string[]>(),
  createdAt: ts('created_at').notNull().default(now()),
  lastUsedAt: ts('last_used_at'),
  revokedAt: ts('revoked_at'),
}, t => [index('agent_keys_agent_idx').on(t.agentId)]);

// ───────────────────────────── Accounts & sessions ─────────────────────────────

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: text('kind', { enum: ['guest', 'wallet'] }).notNull().default('guest'),
    walletAddress: text('wallet_address'),
    displayName: text('display_name'),
    role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
    createdAt: ts('created_at').notNull().default(now()),
    lastSeenAt: ts('last_seen_at').notNull().default(now()),
  },
  (t) => [uniqueIndex('accounts_wallet_uq').on(t.walletAddress)],
);

export const sessions = pgTable(
  'sessions',
  {
    /** sha256 of the opaque session token; the raw token only lives in the cookie. */
    tokenHash: text('token_hash').primaryKey(),
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull().default(now()),
    expiresAt: ts('expires_at').notNull(),
    userAgent: text('user_agent'),
  },
  (t) => [index('sessions_account_idx').on(t.accountId)],
);

export const siweNonces = pgTable('siwe_nonces', {
  nonce: text('nonce').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  createdAt: ts('created_at').notNull().default(now()),
  expiresAt: ts('expires_at').notNull(),
  usedAt: ts('used_at'),
  origin: text('origin'),
  sessionHash: text('session_hash'),
});

export const referralCodes = pgTable('referral_codes', {
  accountId: uuid('account_id').primaryKey().references(() => accounts.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
});

export const referrals = pgTable('referrals', {
  referredAccountId: uuid('referred_account_id').primaryKey().references(() => accounts.id, { onDelete: 'cascade' }),
  referrerAccountId: uuid('referrer_account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  createdAt: ts('created_at').notNull().default(now()),
}, t => [check('referrals_no_self',sql`${t.referrerAccountId} <> ${t.referredAccountId}`)]);

export const pointsLedger = pgTable('points_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  category: text('category').notNull(), sourceId: text('source_id').notNull(),
  points: integer('points').notNull(), occurredAt: ts('occurred_at').notNull(),
  earningDay: date('earning_day').notNull(), createdAt: ts('created_at').notNull().default(now()),
  reversalOf: uuid('reversal_of').references(():AnyPgColumn => pointsLedger.id, {onDelete:'restrict'}),
}, t => [
  uniqueIndex('points_ledger_source').on(t.category,t.sourceId),
  uniqueIndex('points_ledger_reversal').on(t.reversalOf).where(sql`${t.reversalOf} IS NOT NULL`),
  index('points_ledger_daily').on(t.accountId,t.category,t.earningDay),
  check('points_ledger_shape',sql`${t.category} IN ('guarded_volume','shared_journal','opened_scan','ghost_tip') AND length(${t.sourceId}) BETWEEN 1 AND 256 AND ((${t.reversalOf} IS NULL AND ${t.points} > 0) OR (${t.reversalOf} IS NOT NULL AND ${t.points} < 0))`),
]);
export const pointsScanCreators = pgTable('points_scan_creators', {
  scanId: text('scan_id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  createdAt: ts('created_at').notNull().default(now()),
});

export const preferences = pgTable('preferences', {
  accountId: uuid('account_id').primaryKey().references(() => accounts.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  updatedAt: ts('updated_at').notNull().default(now()),
});

export const workspaceLayouts = pgTable(
  'workspace_layouts',
  {
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('default'),
    data: jsonb('data').notNull(),
    updatedAt: ts('updated_at').notNull().default(now()),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.name] })],
);

// ───────────────────────────── Bots ─────────────────────────────

export const bots = pgTable(
  'bots',
  {
    id: text('id').primaryKey(),
    creatorAccountId: uuid('creator_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    creatorName: text('creator_name').notNull(),
    official: boolean('official').notNull().default(false),
    name: text('name').notNull(),
    tagline: text('tagline').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    /** { glyph, hue } — rendered by the client, never arbitrary markup. */
    identity: jsonb('identity').notNull(),
    status: text('status', { enum: ['draft', 'pending_review', 'published', 'rejected', 'archived'] }).notNull(),
    /** private bots (personal forks) are only visible to and evaluated for their creator. */
    visibility: text('visibility', { enum: ['public', 'private'] }).notNull().default('public'),
    forkedFrom: text('forked_from'),
    latestVersion: text('latest_version'),
    installs: integer('installs').notNull().default(0),
    createdAt: ts('created_at').notNull().default(now()),
    updatedAt: ts('updated_at').notNull().default(now()),
  },
  (t) => [index('bots_status_idx').on(t.status)],
);

export const botVersions = pgTable(
  'bot_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    botId: text('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    /** rules | llm | ensemble */
    kind: text('kind', { enum: ['rules', 'llm', 'ensemble'] }).notNull(),
    strategyId: text('strategy_id').notNull(),
    strategyVersion: text('strategy_version').notNull(),
    params: jsonb('params').notNull(),
    /** For llm bots: provider id + model id. */
    provider: text('provider'),
    model: text('model'),
    /** For llm bots: the vetted analyst style (enum), never a free-form system prompt. */
    promptStyle: text('prompt_style'),
    /** For ensembles: member bot ids + quorum. */
    ensemble: jsonb('ensemble'),
    markets: jsonb('markets').notNull(),
    timeframes: jsonb('timeframes').notNull(),
    dataInputs: jsonb('data_inputs').notNull(),
    evaluation: jsonb('evaluation').notNull(),
    changelog: text('changelog').notNull().default(''),
    status: text('status', { enum: ['draft', 'pending_review', 'published', 'rejected'] }).notNull(),
    reviewNotes: text('review_notes'),
    validation: jsonb('validation'),
    createdAt: ts('created_at').notNull().default(now()),
    publishedAt: ts('published_at'),
  },
  (t) => [uniqueIndex('bot_versions_uq').on(t.botId, t.version)],
);

export const botInstalls = pgTable(
  'bot_installs',
  {
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    botId: text('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    /** User overrides within the bot's allowed parameter bounds. */
    config: jsonb('config').notNull().default({}),
    enabledOnChart: boolean('enabled_on_chart').notNull().default(true),
    createdAt: ts('created_at').notNull().default(now()),
    updatedAt: ts('updated_at').notNull().default(now()),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.botId] })],
);

// ───────────────────────────── Signals ─────────────────────────────

export const signals = pgTable(
  'signals',
  {
    id: text('id').primaryKey(),
    botId: text('bot_id').notNull(),
    botVersion: text('bot_version').notNull(),
    botName: text('bot_name').notNull(),
    strategyId: text('strategy_id').notNull(),
    strategyVersion: text('strategy_version').notNull(),
    market: text('market').notNull(),
    network: text('network').notNull(),
    venue: text('venue').notNull(),
    timeframe: text('timeframe').notNull(),
    action: text('action', { enum: ['buy', 'sell', 'hold'] }).notNull(),
    status: text('status', { enum: ['provisional', 'active', 'expired', 'withdrawn', 'invalidated'] }).notNull(),
    generatedAt: bigint('generated_at', { mode: 'number' }).notNull(),
    sourceDataAt: bigint('source_data_at', { mode: 'number' }).notNull(),
    barTime: bigint('bar_time', { mode: 'number' }).notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
    referencePrice: doublePrecision('reference_price').notNull(),
    metrics: jsonb('metrics').notNull(),
    rationale: text('rationale').notNull(),
    invalidation: jsonb('invalidation').notNull(),
    conviction: doublePrecision('conviction'),
    provider: text('provider').notNull(),
    model: text('model'),
    inferenceMs: integer('inference_ms'),
    revision: integer('revision').notNull().default(0),
    dataSource: text('data_source').notNull(),
    simulatedData: boolean('simulated_data').notNull(),
    inputHash: text('input_hash'),
    createdAt: ts('created_at').notNull().default(now()),
    updatedAt: ts('updated_at').notNull().default(now()),
  },
  (t) => [
    index('signals_market_idx').on(t.market, t.generatedAt),
    index('signals_bot_idx').on(t.botId, t.generatedAt),
    index('signals_status_idx').on(t.status),
    uniqueIndex('signals_bot_bar_uq').on(t.botId, t.market, t.timeframe, t.barTime, t.action),
  ],
);

export const signalEvents = pgTable(
  'signal_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    signalId: text('signal_id').notNull().references(() => signals.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    at: bigint('at', { mode: 'number' }).notNull(),
    data: jsonb('data').notNull(),
  },
  (t) => [index('signal_events_signal_idx').on(t.signalId, t.id)],
);

/** Model outputs that failed validation — kept for transparency and debugging. */
export const signalRejections = pgTable(
  'signal_rejections',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    botId: text('bot_id').notNull(),
    market: text('market').notNull(),
    timeframe: text('timeframe').notNull(),
    code: text('code').notNull(),
    reason: text('reason').notNull(),
    raw: jsonb('raw'),
    at: bigint('at', { mode: 'number' }).notNull(),
  },
  (t) => [index('signal_rejections_bot_idx').on(t.botId, t.at)],
);

export const inferenceRuns = pgTable(
  'inference_runs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    botId: text('bot_id').notNull(),
    botVersion: text('bot_version').notNull(),
    provider: text('provider').notNull(),
    model: text('model'),
    market: text('market').notNull(),
    timeframe: text('timeframe').notNull(),
    startedAt: bigint('started_at', { mode: 'number' }).notNull(),
    latencyMs: integer('latency_ms'),
    /** ok | abstained | rejected | error | skipped_cache | skipped_budget | skipped_unconfigured */
    outcome: text('outcome').notNull(),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    estCostUsd: doublePrecision('est_cost_usd'),
    error: text('error'),
    inputHash: text('input_hash'),
    signalId: text('signal_id'),
  },
  (t) => [index('inference_runs_bot_idx').on(t.botId, t.startedAt), index('inference_runs_started_idx').on(t.startedAt)],
);

// ───────────────────────────── Market data ─────────────────────────────

export const candles = pgTable(
  'candles',
  {
    source: text('source').notNull(),
    market: text('market').notNull(),
    timeframe: text('timeframe').notNull(),
    time: bigint('time', { mode: 'number' }).notNull(),
    open: doublePrecision('open').notNull(),
    high: doublePrecision('high').notNull(),
    low: doublePrecision('low').notNull(),
    close: doublePrecision('close').notNull(),
    volume: doublePrecision('volume').notNull(),
    ingestedAt: bigint('ingested_at', { mode: 'number' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.source, t.market, t.timeframe, t.time] })],
);

// ───────────────────────────── Trading ─────────────────────────────

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    mode: text('mode', { enum: ['paper', 'testnet', 'live'] }).notNull(),
    market: text('market').notNull(),
    side: text('side', { enum: ['buy', 'sell'] }).notNull(),
    signalId: text('signal_id'),
    botId: text('bot_id'),
    network: text('network').notNull(),
    venue: text('venue').notNull(),
    walletAddress: text('wallet_address'),
    assetIn: text('asset_in').notNull(),
    assetOut: text('asset_out').notNull(),
    amountIn: doublePrecision('amount_in').notNull(),
    expectedOut: doublePrecision('expected_out').notNull(),
    minOut: doublePrecision('min_out').notNull(),
    quotePrice: doublePrecision('quote_price').notNull(),
    referencePrice: doublePrecision('reference_price'),
    slippageBps: integer('slippage_bps').notNull(),
    quote: jsonb('quote').notNull(),
    status: text('status').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    txHash: text('tx_hash'),
    approvalTxHash: text('approval_tx_hash'),
    fillPrice: doublePrecision('fill_price'),
    filledIn: doublePrecision('filled_in'),
    filledOut: doublePrecision('filled_out'),
    feePaid: doublePrecision('fee_paid'),
    feeAsset: text('fee_asset'),
    gasUsed: text('gas_used'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    latency: jsonb('latency').notNull().default({}),
    createdAt: ts('created_at').notNull().default(now()),
    submittedAt: ts('submitted_at'),
    settledAt: ts('settled_at'),
    updatedAt: ts('updated_at').notNull().default(now()),
  },
  (t) => [
    uniqueIndex('orders_idem_uq').on(t.accountId, t.idempotencyKey),
    uniqueIndex('orders_tx_uq').on(t.txHash),
    index('orders_account_idx').on(t.accountId, t.mode, t.createdAt),
    index('orders_status_idx').on(t.status),
  ],
);

export const fills = pgTable(
  'fills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    mode: text('mode', { enum: ['paper', 'testnet', 'live'] }).notNull(),
    market: text('market').notNull(),
    side: text('side', { enum: ['buy', 'sell'] }).notNull(),
    price: doublePrecision('price').notNull(),
    baseQty: doublePrecision('base_qty').notNull(),
    quoteQty: doublePrecision('quote_qty').notNull(),
    fee: doublePrecision('fee').notNull(),
    feeAsset: text('fee_asset').notNull(),
    txHash: text('tx_hash'),
    at: ts('at').notNull().default(now()),
  },
  (t) => [index('fills_account_idx').on(t.accountId, t.mode, t.at)],
);

/** Paper balances only. On-chain balances are always read from the chain. */
export const paperBalances = pgTable(
  'paper_balances',
  {
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    asset: text('asset').notNull(),
    amount: doublePrecision('amount').notNull(),
    updatedAt: ts('updated_at').notNull().default(now()),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.asset] })],
);

export const positions = pgTable(
  'positions',
  {
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    mode: text('mode', { enum: ['paper', 'testnet', 'live'] }).notNull(),
    market: text('market').notNull(),
    quantity: doublePrecision('quantity').notNull(),
    avgCost: doublePrecision('avg_cost').notNull(),
    costBasis: doublePrecision('cost_basis').notNull(),
    realizedPnl: doublePrecision('realized_pnl').notNull(),
    updatedAt: ts('updated_at').notNull().default(now()),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.mode, t.market] })],
);

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    mode: text('mode', { enum: ['paper', 'testnet', 'live'] }).notNull(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    signalId: text('signal_id'),
    market: text('market'),
    body: text('body').notNull(),
    tags: jsonb('tags').notNull().default([]),
    createdAt: ts('created_at').notNull().default(now()),
    updatedAt: ts('updated_at').notNull().default(now()),
  },
  (t) => [index('journal_account_idx').on(t.accountId, t.createdAt)],
);

// ───────────────────────────── Evaluation ─────────────────────────────

export const strategyEvaluations = pgTable(
  'strategy_evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    botId: text('bot_id').notNull(),
    botVersion: text('bot_version').notNull(),
    /** backtest | forward_paper | live */
    kind: text('kind', { enum: ['backtest', 'forward_paper', 'live'] }).notNull(),
    market: text('market').notNull(),
    timeframe: text('timeframe').notNull(),
    periodStart: bigint('period_start', { mode: 'number' }).notNull(),
    periodEnd: bigint('period_end', { mode: 'number' }).notNull(),
    splitTime: bigint('split_time', { mode: 'number' }),
    sampleSize: integer('sample_size').notNull(),
    params: jsonb('params').notNull(),
    assumptions: jsonb('assumptions').notNull(),
    metrics: jsonb('metrics').notNull(),
    equity: jsonb('equity').notNull(),
    dataSource: text('data_source').notNull(),
    simulatedData: boolean('simulated_data').notNull(),
    methodology: text('methodology').notNull(),
    limitations: jsonb('limitations').notNull(),
    createdBy: uuid('created_by'),
    createdAt: ts('created_at').notNull().default(now()),
  },
  (t) => [index('strategy_eval_bot_idx').on(t.botId, t.kind, t.createdAt)],
);

// ───────────────────────────── Ops ─────────────────────────────

export const auditLog = pgTable(
  'audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    accountId: uuid('account_id'),
    action: text('action').notNull(),
    data: jsonb('data').notNull(),
    at: ts('at').notNull().default(now()),
  },
  (t) => [index('audit_account_idx').on(t.accountId, t.at)],
);

export const latencySamples = pgTable(
  'latency_samples',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    metric: text('metric').notNull(),
    valueMs: doublePrecision('value_ms').notNull(),
    labels: jsonb('labels').notNull().default({}),
    at: bigint('at', { mode: 'number' }).notNull(),
  },
  (t) => [index('latency_metric_idx').on(t.metric, t.at)],
);

export const launchMeasurements = pgTable('launch_measurements', {
  metric: text('metric').primaryKey(),
  samples: jsonb('samples').$type<{ value: number; at: number }[]>().notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

// BACKEND §21.4: product flags and separately typed operational switches share storage.
export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  audience: text('audience').notNull().default('public'),
});

export const tradingAllowlist = pgTable('trading_allowlist', {
  wallet: text('wallet').primaryKey(),
  role: text('role', { enum: ['team', 'beta_user'] }).notNull(),
  capUsd: doublePrecision('cap_usd').notNull(),
  addedBy: uuid('added_by').notNull(),
  addedAt: ts('added_at').notNull().default(now()),
  note: text('note').notNull().default(''),
});

// Worker-owned append-only complete sanctions snapshots (BACKEND §12.4).
export const ofacSdn = pgTable('ofac_sdn', {
  version: bigserial('version', { mode: 'number' }).primaryKey(),
  digest: text('digest').notNull(),
  refreshedAt: ts('refreshed_at').notNull(),
  publishedAt: ts('published_at').notNull(),
  recordCount: integer('record_count').notNull(),
  addresses: text('addresses').array().notNull(),
});
export const ofacRefresh = pgTable('ofac_refresh', {
  id: integer('id').primaryKey(),
  attemptedAt: ts('attempted_at').notNull(),
  failed: boolean('failed').notNull(),
});

// Private journal envelope state (BACKEND §§3.5–3.6). Never stores clear payloads.
const journalBinary = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => 'bytea',
  toDriver: value => value, fromDriver: value => Buffer.from(value) });
export const journalConsent = pgTable('journal_consent', {
  accountId: uuid('account_id').primaryKey().references(() => accounts.id, { onDelete: 'cascade' }),
  optedIn: boolean('opted_in').notNull().default(false), updatedAt: ts('updated_at').notNull().default(now()),
});
export const userKeys = pgTable('user_keys', {
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(), kekId: text('kek_id').notNull(), wrappedDek: journalBinary('wrapped_dek'),
  createdAt: ts('created_at').notNull().default(now()), destroyedAt: ts('destroyed_at'),
}, t => [primaryKey({ columns: [t.accountId, t.version] })]);
export const harnessJournal = pgTable('harness_journal', {
  id: uuid('id').primaryKey(), accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }), ts: ts('ts').notNull().default(now()),
  kind: text('kind', { enum: ['session_start', 'decision', 'order', 'outcome', 'note'] }).notNull(), preflightId: uuid('preflight_id'),
  keyVersion: integer('key_version').notNull(), iv: journalBinary('iv').notNull(), ciphertext: journalBinary('ciphertext').notNull(),
  saltCt: journalBinary('salt_ct').notNull(), commitment: text('commitment').notNull(), share: boolean('share').notNull().default(false),
  receiptItemId: text('receipt_item_id').notNull(),
}, t => [index('journal_agent_ts').on(t.agentId, t.ts, t.id)]);
export const groundTruthShared = pgTable('ground_truth_shared', {
  id: uuid('id').primaryKey().defaultRandom(), data: jsonb('data').notNull(),
});
