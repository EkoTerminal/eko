import type { PreflightResult } from '@eko/shared';

export interface StoredPreflight {
  orderHash: `0x${string}`;
  result: PreflightResult;
}

/** Pure resolution only; the caller owns persistence, compare-and-set and journal writes. */
export function resolveRepeat(stored: StoredPreflight, incomingOrderHash: `0x${string}`,
  reevaluate: () => PreflightResult): PreflightResult {
  const result = stored.result;
  if (stored.orderHash !== incomingOrderHash) {
    // TODO(spec): mismatch reuses stored IDs/version; the handler does not replace the row or write a journal entry.
    return { preflightId: result.preflightId, policyVersion: result.policyVersion, journalId: result.journalId,
      ...(result.guardPolicyVersion === undefined ? {} : { guardPolicyVersion: result.guardPolicyVersion }),
      decision: 'deny', reasons: ['order_mismatch: this clientOrderRef was used for a different order'] };
  }
  if (result.decision !== 'needs_approval') return result;
  const next = reevaluate();
  return { ...next, preflightId: result.preflightId, approvalId: result.approvalId };
}
