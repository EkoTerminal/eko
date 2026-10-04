import v1 from './v1.json';
import { receiptSamples } from './public-receipts.js';
export const sensesSamples = {
  SenseUnavailable: { status: 'unavailable', reason: 'coin_unavailable' },
  SenseFlowUnavailable: { status: 'unavailable', window: '1h', dependency: '102', beta: true, confidence: 0 },
  SenseCoinCard: { ...v1.CoinCard, flow: { status: 'unavailable', window: '1h', dependency: '102', beta: true, confidence: 0 } },
  SenseVerdictResult: v1.Verdict,
  SenseCardResult: { status: 'unavailable', reason: 'coin_unavailable' },
  SensePlaybookResult: { playbooks: [], history: 'unavailable' },
  SenseCensusResult: { status: 'unavailable', dependency: '102', gated: true, reason: 'labels_in_calibration',
    methodologyUrl: '/methodology', gate: { metric: 'likely_agent_precision', value: null, threshold: 0.9, modelVersion: null, evaluatedAt: null } },
  SenseReceiptResult: receiptSamples.ReceiptLookup,
};
