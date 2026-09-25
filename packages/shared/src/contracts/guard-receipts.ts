import { z } from 'zod';
import { canonicalize } from '../canonical.js';
import { GuardAssessmentV2Schema } from './guard-v2.js';
import type { GuardAssessmentV2 } from './guard-v2.js';
import { Bytes32Schema, createReceiptEncoder } from './receipt-encoding.js';
import type { ReceiptHashing, ReceiptItem } from './receipt-encoding.js';
import { GuardVerdictRevisionInputSchema } from './guard-storage.js';
import type { GuardVerdictRevisionInput } from './guard-storage.js';

export const RECEIPT_BATCH_INTERVAL_SEC = 300;
export const TRACE_RETENTION_SEC = 2_592_000;
const { receipt: _receipt, ...decisionFields } = GuardAssessmentV2Schema.shape;
const a = GuardAssessmentV2Schema.shape;
export const GuardReceiptRevisionKeySchema = z.strictObject({
  schemaVersion: a.schemaVersion, canonicalization: z.literal('jcs-rfc8785/v1'), receiptVersion: z.literal('guard-receipt-2'),
  chainId: a.chainId, coin: a.coin, cursor: a.cursor, availability: a.availabilityCut, mode: a.mode,
  rulesVersion: a.rulesVersion, identityVersion: a.identityVersion, measurementVersion: a.measurementVersion, outcomeVersion: a.outcomeVersion,
  codeHash: a.codeHash, parametersHash: a.parametersHash, serviceRegistryHash: a.serviceRegistryHash,
  profileHash: a.profileHash, calibrationManifestHash: a.calibrationManifestHash, snapshotHash: a.snapshotHash,
  manifestId: Bytes32Schema, sourceRevision: Bytes32Schema, context: GuardVerdictRevisionInputSchema.shape.context,
});
export function guardReceiptRevisionKey(a: Omit<GuardAssessmentV2, 'receipt'>, manifestId: string, sourceRevision: string, context: GuardVerdictRevisionInput['context']) {
  return GuardReceiptRevisionKeySchema.parse({ schemaVersion: a.schemaVersion, canonicalization: 'jcs-rfc8785/v1', receiptVersion: 'guard-receipt-2',
    chainId: a.chainId, coin: a.coin, cursor: a.cursor, availability: a.availabilityCut, mode: a.mode,
    rulesVersion: a.rulesVersion, identityVersion: a.identityVersion, measurementVersion: a.measurementVersion, outcomeVersion: a.outcomeVersion,
    codeHash: a.codeHash, parametersHash: a.parametersHash, serviceRegistryHash: a.serviceRegistryHash, profileHash: a.profileHash,
    calibrationManifestHash: a.calibrationManifestHash, manifestId, sourceRevision, context, snapshotHash: a.snapshotHash });
}
// Receipt identity is allocated before JCS. Proof/anchor metadata lives outside
// this immutable object; a new presentation or orphan event cannot rewrite it.
export const GuardReceiptPayloadSchema = z.strictObject({
  schemaVersion: z.literal('guard-receipt-2'), canonicalization: z.literal('jcs-rfc8785/v1'),
  receiptId: z.string().min(1), revisionId: Bytes32Schema, revisionKey: GuardReceiptRevisionKeySchema,
  kind: z.literal('verdict'), recordedAt: z.iso.datetime(), deterministicInput: z.json(),
  decision: z.strictObject(decisionFields),
});
export type GuardReceiptPayload = z.infer<typeof GuardReceiptPayloadSchema>;

/** Decision identity includes the raw snapshot and every assignment/reason, but
 * excludes storage time, supersession and recursive hash/proof metadata. */
export function guardDecisionBody(a: Omit<GuardAssessmentV2, 'receipt'> | GuardAssessmentV2) {
  const { decisionHash: _, evidenceRoot: _root, supersedes: _supersedes, ...rest } = a;
  const { receipt: _ref, ...body } = rest as typeof rest & { receipt?: unknown };
  return body;
}
export function createGuardReceiptCodec(hashing: ReceiptHashing) {
  const encoder = createReceiptEncoder(hashing);
  const hash = (value: unknown) => hashing.keccak256(hashing.stringToHex(canonicalize(value)));
  function verifyPayload(payload: unknown, item: ReceiptItem): boolean {
    try {
      if (hash(payload) !== item.hash) return false;
      if (typeof payload === 'object' && payload !== null && 'schemaVersion' in payload
        && payload.schemaVersion === 'guard-receipt-2') {
        const p = GuardReceiptPayloadSchema.parse(payload);
        GuardAssessmentV2Schema.parse({ ...p.decision, receipt: { status: 'recorded', id: p.receiptId, payloadHash: item.hash } });
        return p.receiptId === item.id && p.kind === item.kind && p.revisionId === hash(p.revisionKey)
          && canonicalize(p.revisionKey) === canonicalize(guardReceiptRevisionKey(p.decision, p.revisionKey.manifestId, p.revisionKey.sourceRevision, p.revisionKey.context))
          && p.decision.snapshotHash === hash(p.deterministicInput)
          && p.decision.decisionHash === hash(guardDecisionBody(p.decision));
      }
      // V1 payloads retain their original canonical bytes and schema/levels.
      return true;
    } catch { return false; }
  }
  return { ...encoder, hash, verifyPayload,
    verifyPublicProof(payload: unknown, item: ReceiptItem, proof: readonly `0x${string}`[], root: `0x${string}`) {
      return verifyPayload(payload, item) && encoder.verifyReceiptProof(item, proof, root);
    } };
}
