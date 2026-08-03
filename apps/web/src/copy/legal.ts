import { ADVISORY, DYOR, ONCHAIN_ADVISORY } from './index';

export interface PolicyDraft {
  slug: string;
  title: string;
  sections: readonly { title: string; paragraphs: readonly string[] }[];
}

// Approval is an external owner decision tied to this exact draft version, never inferred from a build.
export const POLICY_REVIEW = {
  version: '2026-10-02-draft.1',
  draftedAt: '2026-10-02',
  effectiveAt: null,
  ownerApproval: { dueAt: '2026-10-05', approvedAt: null, evidenceRef: null },
} as const;

export const LEGAL_COPY = {
  navigation: 'Launch policies',
  draft: 'Draft · owner approval pending',
  review: 'Owner approval is external and due October 5, 2026. These drafts are not approved or effective terms. Counsel review is planned for the later legal phase.',
  missing: 'Policy not found',
  choose: 'Choose a policy below.',
  version: 'Version',
  drafted: 'Drafted',
  approvalDue: 'Owner approval due',
  approvalDate: 'Owner approval date',
  approvalEvidence: 'Approval evidence',
  pending: 'Pending external record',
  contact: 'Public domain: {{PUBLIC_DOMAIN}} · Policy contact: {{POLICY_CONTACT}}. Details await owner confirmation.',
};

// TODO(spec): Confirm the public domain/contact and operational log/backup retention before approval.
// TODO(spec): Set the team blackout duration and exception-review procedure externally; no window is invented here.
export const POLICY_DRAFTS: readonly PolicyDraft[] = [
  { slug: 'terms', title: 'Terms of service', sections: [
    { title: 'Research and your decisions', paragraphs: [
      'EKO publishes chain research and provides software for applying your own rules to your own agent. Public outputs are shared research, not individual investment recommendations. You decide whether to use them and bear the risk of loss.',
      DYOR,
      'Do not use the service for unlawful activity, sanctions evasion, interference with other users or misuse of untrusted token text. EKO does not execute stocks, stock tokens or perpetual futures.',
    ] },
    { title: 'Your wallet signs', paragraphs: [
      'EKO is non-custodial. Your wallet signs each terminal trade and exact-amount approval; the server never holds your user keys or funds. We never receive your Robinhood credentials. Review the asset, amount, route, spender, network and fees before signing. Gas, venue fees, taxes, slippage and failed transactions can cost money.',
      'Guarded execution is unavailable in this draft candidate. Supported routes, current sanctions screening and required checks must be accepted before signing is enabled. An unavailable check is not a passing check; a quote or link out does not establish an executable route.',
      ADVISORY,
      ONCHAIN_ADVISORY,
    ] },
    { title: 'Launch fees and later stages', paragraphs: [
      'Terminal fee: 0% during launch week, until token day. This refers to the EKO terminal fee; network, venue and token charges can still apply. No launch-week terminal fee is sent to a project wallet.',
      'Token-day fees remain staged. The planned Uniswap terminal fee is 0.5%, with later tier discounts, paid directly to the public burn wallet. Pons-curve trades carry no terminal fee at launch. The dev wallet is separate and is not the destination for terminal fees.',
      'Daily manual buy-and-burn activity is planned from token day, subject to release gates, with each transaction published. It is not active in this candidate. Tiers, trials, token payments and later fee routes remain unavailable until their stages and checks are accepted. Nothing is paid to token holders.',
    ] },
    { title: 'Availability and changes', paragraphs: [
      'Data may be missing, stale or wrong. Access or execution may pause for outages, sanctions checks or incomplete release gates. Recheck live status before any decision. Future policy changes require a dated version and owner approval; these drafts do not establish acceptance of final terms.',
    ] },
  ] },
  { slug: 'privacy', title: 'Privacy policy', sections: [
    { title: 'Account and public data', paragraphs: [
      'Wallet sign-in uses Sign-In with Ethereum (SIWE), linking a public wallet address to a session. An address is a public identifier, not an anonymous identity. Chain transactions and published research remain public. We never receive your Robinhood credentials or wallet private keys.',
    ] },
    { title: 'Optional Flight Recorder', paragraphs: [
      'The launch Flight Recorder journal is opt-in. Its required design encrypts private entries per user; only salted commitments enter public receipts. Journal collection must remain unavailable until consent, encryption and deletion are implemented and accepted. This draft candidate does not provide that encrypted harness journal; existing manual web notes are a separate feature and are not evidence of encrypted Flight Recorder storage.',
      'Sharing ground truth requires a separate opt-in. Only de-identified, bucketed outcomes may be shared, never private journal payloads. Shared ground truth is retained indefinitely under the launch design. Public commitments and already shared de-identified data cannot be recalled from public records by deleting a private journal.',
    ] },
    { title: 'Deletion and retention', paragraphs: [
      'The required delete-my-data flow destroys the wrapped per-user encryption key before deleting private harness rows, and revokes agent keys and grants. Private entries in restored backups must remain unreadable after key destruction. Public receipt commitments may remain. Harness records are retained until deletion, or up to 30 days after account deletion under the launch design.',
      'Account-wide deletion is unavailable in this candidate. Do not treat deletion of a manual note as account-wide deletion. Activation depends on verified deletion, retries and backup tombstones. The launch design retains sessions for 90 days, latency samples for 30 days, bot interactions for one year, inference detail for 180 days and audit logs for two years. Operational log and backup retention and the support contact remain pending; these retention controls still require implementation evidence before approval.',
    ] },
    { title: 'Telegram and processors', paragraphs: [
      'Telegram group scanning is planned to extract contract addresses rather than retain full group messages. Caller records may link platform identifiers to a group and coin; account linking and notification delivery require separate user action. Telegram behavior is not accepted in this candidate. The bot must disclose data use in its description and /start before activation.',
      'Infrastructure, RPC and model services may process necessary requests when enabled. Private journal payloads must stay out of logs, telemetry and share images. Processor configuration and operational retention need review before approval. Send privacy requests only to the confirmed policy contact once published.',
    ] },
  ] },
  { slug: 'risk', title: 'Risk disclosure', sections: [
    { title: 'Loss and changing evidence', paragraphs: [
      'You can lose the entire amount of a trade. Liquidity can disappear, taxes or permissions can change, transactions can fail, and a token that was sellable can become unsellable. Simulation and playbook checks describe observed conditions and can miss harmful behavior. Missing or stale evidence remains unknown.',
      'Verdicts are live status and can change. Clear is not a recommendation. Refused and missed honeypot counts must be published from measured outcomes; missing counts are not zero. Forecasts and wallet labels are beta estimates, with confidence and limitations shown where available.',
      DYOR,
    ] },
    { title: 'Agent checks and control', paragraphs: [
      ADVISORY,
      'An agent can skip an advisory check. EKO does not control, monitor or shut down your brokerage account. Enable and review your brokerage trade approvals if you rely on them. In-app brokerage activity is separate from Robinhood Chain activity.',
      ONCHAIN_ADVISORY,
      'Session-key enforcement, approval tools and kill controls remain staged until their release gates pass. No unavailable control should be relied upon. Review wording is AI-assisted and automated review, not a professional audit; completion of any review still requires separate evidence.',
    ] },
  ] },
  { slug: 'ai', title: 'AI disclosure', sections: [
    { title: 'Analysis and forecasts', paragraphs: [
      'EKO combines structured chain fields and deterministic rules with AI-generated analysis where enabled. Models can invent facts, misread context or produce biased outputs. Beta forecasts describe possible behavior; they do not predict prices or direct trades. Verify source evidence and timestamps independently.',
      'AI output does not grant trading permission or replace mandatory checks. Untrusted token text stays marked as untrusted data rather than instructions. Sanitisation and checks can fail. An unavailable model or source must be disclosed instead of inventing an answer.',
      DYOR,
    ] },
    { title: 'Private data and accountability', paragraphs: [
      'Do not send credentials, private keys or private financial information in token text or public requests. Public analysis is research shared across users, not personalised advice. Published receipts and graded history must distinguish measured results, missing evidence and beta forecasts; a receipt proves a commitment, not that its analysis is correct.',
    ] },
  ] },
  { slug: 'team-trading', title: 'Team trading policy', sections: [
    { title: 'Outputs before trades', paragraphs: [
      'No trading ahead of EKO outputs and no using unpublished research to trade. Publication schedules must not be timed to team trading. Team trading in an asset under pending analysis stays paused until a documented blackout window and exception-review procedure are approved. The duration is pending; this draft does not invent a window.',
      'The team is anonymous. Project dev, burn and timelock wallets must be publicly disclosed before relevant activity. Wallet publication and transaction history are external release evidence, not supplied by these drafts. Any launch token purchases by the team must be disclosed and locked on the same public timelock; no claim of zero team holdings is made.',
    ] },
    { title: 'Separate wallet purposes', paragraphs: [
      'The dev wallet pays operating costs from creator fees. Planned terminal fees go to the public burn wallet, never the dev wallet. Manual burn transactions and milestone locks remain staged and require their own published evidence. Trading exceptions, conflicts and breaches require a dated record without identifying team members.',
    ] },
  ] },
  { slug: 'kol', title: 'KOL disclosure policy', sections: [
    { title: 'Paid posts', paragraphs: [
      '#ad must be the first line of every paid post, including crypto-paid and performance-based arrangements. Disclose the creator’s relevant holdings and compensation relationship clearly; a buried hashtag is insufficient. Include the non-affiliation line whenever Robinhood is named, and the analysis disclaimer whenever analysis is shown.',
      'Use only stage-accurate claims and numbers supported by live product evidence. Do not predict prices or present returns as a reason to use EKO. Performance deals are paid in crypto and do not authorise unsupported product claims. No paid campaign or arrangement is established by this draft.',
    ] },
  ] },
  { slug: 'sanctions', title: 'Sanctions screening policy', sections: [
    { title: 'Screening before execution', paragraphs: [
      'Executable terminal quotes require sanctions screening against the OFAC SDN list before execution can be offered. A screening match, unavailable source or stale screening must prevent executable output; there is no permissive fallback. Do not use EKO to evade sanctions or other applicable restrictions.',
      'Sanctions screening is not accepted in this draft candidate. Source selection, freshness and operating evidence remain external dependencies. Research access or an indicative quote is not confirmation that execution is permitted. This policy does not claim to screen brokerage trades controlled by your own Robinhood connection.',
    ] },
  ] },
];

// Exact allowlist lookup: unknown/path-like/prototype property names never become file paths or HTML.
export function findPolicy(slug: string | undefined) {
  return POLICY_DRAFTS.find((policy) => policy.slug === slug);
}
