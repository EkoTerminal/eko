import { z } from 'zod';
import { ReceiptSchema } from './receipts.js';
export const ReceiptKindSchema = ReceiptSchema.shape.kind;
export type ReceiptKind = z.infer<typeof ReceiptKindSchema>;
export const RECEIPT_KIND_IDS = { verdict: 0, forecast: 1, harness_private: 2 } as const;
export const RECEIPT_LEAF_ENCODING = [{ type: 'uint8' }, { type: 'bytes32' }, { type: 'bytes32' }] as const;
export const Bytes32Schema = z.string().regex(/^0x[0-9a-fA-F]{64}$/)
  .transform((value): `0x${string}` => value.toLowerCase() as `0x${string}`);
export type Bytes32 = z.infer<typeof Bytes32Schema>;
export const ReceiptItemSchema = z.object({ id: z.string(), kind: ReceiptKindSchema, hash: Bytes32Schema });
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
/** viem primitives supplied by the caller; @eko/shared currently depends only on zod.
 * This keeps encoding pure and avoids a dependency/lockfile change. Pass viem's
 * { keccak256, encodeAbiParameters, stringToHex, concat } directly.
 */
export interface ReceiptHashing {
  keccak256(value: `0x${string}`): `0x${string}`;
  encodeAbiParameters(parameters: typeof RECEIPT_LEAF_ENCODING, values: readonly [
    number,
    `0x${string}`,
    `0x${string}`
  ]): `0x${string}`;
  stringToHex(value: string): `0x${string}`;
  concat(values: readonly `0x${string}`[]): `0x${string}`;
}
/** BACKEND §13. Mirrors StandardMerkleTree's default sorted leaves, complete binary
 * tree and sorted node hashes, including non-power-of-two batches.
 * Reference: https://github.com/OpenZeppelin/merkle-tree/tree/master/src
 */
// Cross-checked against StandardMerkleTree in test/receipts-oz.test.ts (devDependency only).
export function createReceiptEncoder(hashing: ReceiptHashing) {
  const { keccak256, encodeAbiParameters, stringToHex, concat } = hashing;
  function receiptItemId(id: string): Bytes32 {
    return keccak256(stringToHex(z.string().parse(id)));
  }
  function encodeReceiptLeaf(input: ReceiptItem): Bytes32 {
    const item = ReceiptItemSchema.parse(input);
    return keccak256(keccak256(encodeAbiParameters(RECEIPT_LEAF_ENCODING, [
      RECEIPT_KIND_IDS[item.kind], receiptItemId(item.id), item.hash,
    ])));
  }
  function hashReceiptPair(left: Bytes32, right: Bytes32): Bytes32 {
    const pair = [Bytes32Schema.parse(left), Bytes32Schema.parse(right)].sort();
    return keccak256(concat(pair));
  }
  function buildReceiptTree(items: readonly ReceiptItem[]) {
    if (items.length === 0)
      throw new Error('A receipt tree needs at least one item');
    const entries = items.map((item, index) => ({ index, leaf: encodeReceiptLeaf(item) }));
    const sorted = [...entries].sort((a, b) => a.leaf < b.leaf ? -1 : a.leaf > b.leaf ? 1 : 0);
    const tree = new Array<Bytes32>(2 * items.length - 1);
    const indices = new Array<number>(items.length);
    sorted.forEach(({ index, leaf }, i) => {
      const treeIndex = tree.length - 1 - i;
      tree[treeIndex] = leaf;
      indices[index] = treeIndex;
    });
    for (let i = items.length - 2; i >= 0; i--)
      tree[i] = hashReceiptPair(tree[2 * i + 1]!, tree[2 * i + 2]!);
    const proofs = indices.map((treeIndex) => {
      const proof: Bytes32[] = [];
      for (let i = treeIndex; i > 0; i = Math.floor((i - 1) / 2))
        proof.push(tree[i % 2 === 0 ? i - 1 : i + 1]!);
      return proof;
    });
    // Leaves and proofs retain input order, independent of the tree's sorted layout.
    return { root: tree[0]!, leaves: entries.map(({ leaf }) => leaf), proofs };
  }
  function verifyReceiptProof(item: ReceiptItem, proof: readonly Bytes32[], root: Bytes32): boolean {
    if (!ReceiptItemSchema.safeParse(item).success || !Bytes32Schema.safeParse(root).success
      || !proof.every((node) => Bytes32Schema.safeParse(node).success))
      return false;
    return proof.reduce(hashReceiptPair, encodeReceiptLeaf(item)) === Bytes32Schema.parse(root);
  }
  return { receiptItemId, encodeReceiptLeaf, hashReceiptPair, buildReceiptTree, verifyReceiptProof };
}
