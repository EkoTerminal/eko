import type { Address, EvidenceRef, Level, PlaybookId, PlaybookMatch, Verdict } from '@eko/shared';
import type { PlaybookConfig } from '../config/v1.js';

// TODO(spec): §6–7 do not define CardSources/HistoryView wire shapes. These are
// normalized, point-in-time inputs; absent optional sections mean unknown, not zero.
// Times are Unix seconds, fractions are 0..1, tax/gap values are percentage points.
export interface Simulation {
  id: string;
  sizeUsd: 100 | 1000 | 10000;
  block: number;
  buyOk: boolean;
  sellOk: boolean;
  returnedInputShare: number;
  traceDigest: string;
  revert?: string;
  // Classified acquired-position evidence; omitted for heritage/Pons inputs.
  confirmedBlockedExit?: boolean;
  contractRestricted?: boolean;
  deep?: Omit<Simulation, 'deep' | 'sizeUsd'>;
}

export interface PriorLaunch {
  coin: Address;
  createdAtSec: number;
  relation: 'deployer' | 'crew' | 'both';
  matches: { id: PlaybookId; level: Level }[];
  // Availability block is preserved when materializing observed horizon outcomes.
  outcomes: { validFromBlock?: number; horizon: '1h' | '24h' | '7d'; outcome: 'rugged' | 'honeypot' | 'dumped' | 'survived'; evidence: EvidenceRef[] }[];
  evidence: EvidenceRef[];
}
export interface HistoryView { crewId?: string; launches: PriorLaunch[] }

export interface CardSources {
  coin: Address;
  deployer: Address;
  asOfBlock: number;
  asOfSec: number;
  createdAtSec: number;
  createdAtBlock: number;
  launchpad: 'pons' | 'occupy' | 'flap' | 'klik' | 'other';
  name: string;
  symbol: string;
  antiSnipeActive?: boolean;
  simulations?: Simulation[];
  taxes?: {
    buyPct: number | null; sellPct: number | null;
    // Mutable only with reviewed reachable permissions and a state-changing effect (Guard §3.4).
    mutable: boolean | null; setter?: EvidenceRef; owner?: Address;
    changes: { beforePct: number; afterPct: number; evidence: EvidenceRef }[];
  };
  liquidity?: {
    positions: { owner: Address; controlledBy: 'deployer' | 'crew' | 'other'; share: number;
      status: 'burned' | 'locked' | 'pons_locked' | 'removable'; evidence: EvidenceRef[] }[];
    depth2Usd?: number;
    priorRemovals: EvidenceRef[];
  };
  pools?: { id: string; feeBps: number; liquidityShare: number; deepest: boolean; defaultRoute: boolean; evidence: EvidenceRef[] }[];
  curve?: {
    ageH: number; volumeUsd: number; progressUsd: number;
    clusters: { id: string; volumeShare: number; evidence: EvidenceRef[] }[];
    feeClaims: EvidenceRef[];
  };
  wash?: {
    washEstPct?: number; volumeUsd1h: number; traders1h: number;
    // Non-overlapping actor round trips in the same 1h window, supplied by Normalizer.
    roundTrips: { actor: Address; durationSec: number; netShare: number; volumeUsd: number; evidence: EvidenceRef[] }[];
  };
  trending?: { coin: Address; name: string; symbol: string; rank: number; createdAtSec: number; trendStartedAtSec: number; evidence: EvidenceRef[] }[];
  dominantPair?: { buyer: Address; seller: Address; share: number; evidence: EvidenceRef[] };
  pons?: {
    creatorTaxPct?: number; feePct?: number;
    exemptions: { wallet: Address; crewRugRuns: number; log: EvidenceRef }[];
    boughtShare: number; heldShare: number;
  };
  earlyBuyers?: { wallet: Address; funder: Address; fundedAtSec: number; buyAtSec: number; buyBlock: number;
    heldShare: number; sellingIntoNetInflow: boolean; evidence: EvidenceRef[] }[];
  graduation?: { atSec: number; tx: EvidenceRef; insiderSells: {
    atSec: number; soldShare: number; priceImpactShare: number; evidence: EvidenceRef[];
  }[] };
  hook?: {
    address: Address; reviewed: boolean; sourceVerified: boolean;
    permissionBits: number; returnDeltaPermissionBits: number;
    quoteSimGapPct: number; buyFeePct: number; sellFeePct: number; evidence: EvidenceRef[];
  };
  tokenText?: { ref: string; raw: string }[];
}

export interface PlaybookInput extends CardSources { history: HistoryView }
export interface Rule<K extends keyof PlaybookConfig = keyof PlaybookConfig> {
  id: K;
  evaluate(s: CardSources, h: HistoryView, cfg: PlaybookConfig[K]): PlaybookMatch | null;
}
export type VerdictMeta = Pick<Verdict, 'coin' | 'asOfBlock' | 'receipt'>;
