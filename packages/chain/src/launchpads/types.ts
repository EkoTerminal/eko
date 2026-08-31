import type { Address, Hex, Log, Transaction } from 'viem';
import type { PoolRef } from '@eko/shared';
export type LaunchpadId = 'pons' | 'occupy' | 'flap' | 'klik' | 'other';
// TODO(spec): TxLeg has no shared definition yet; use the target/value/data fields from BACKEND §6.2.
export interface TxLeg { target: Address; value: bigint; data: Hex }
export type LaunchpadEvent =
  | { kind: 'launch'; token: Address; deployer: Address; curve: Address; pairToken?: Address; launchConfigId?: bigint; graduationThreshold?: bigint; creatorTaxBps?: number; buybackOn?: boolean; buybackBps?: number }
  | { kind: 'trade'; token: Address; actor: Address; side: 1 | -1; amountToken: bigint; amountEth: bigint; feeEth?: bigint; taxEth?: bigint; buyer?: Address; seller?: Address; recipient?: Address }
  | { kind: 'graduated'; token: Address; pool: PoolRef }
  | { kind: 'exempt'; token: Address; wallet: Address }
  | { kind: 'creator_fee'; token: Address; recipient: Address; amountEth: bigint }
  | { kind: 'buyback'; token: Address; amountEth: bigint; amountToken: bigint; burned?: boolean };
export interface LaunchpadAdapter {
  id: LaunchpadId;
  addresses(): Address[];
  decode(log: Log, tx: Transaction): LaunchpadEvent[];
  curveState?(token: Address, block: bigint): Promise<{ curvePct: number; graduated: boolean; reserveEth: bigint }>;
  antiSnipe?(token: Address, block: bigint): Promise<{ taxPct: number; endsInSec: number } | null>;
  quoteBuy?(token: Address, ethIn: bigint, block: bigint): Promise<bigint>;
  quoteSell?(token: Address, tokensIn: bigint, block: bigint): Promise<bigint>;
  buildBuy?(token: Address, ethIn: bigint, minOut: bigint, recipient: Address): TxLeg;
  buildSell?(token: Address, tokensIn: bigint, minOut: bigint, recipient: Address): TxLeg & { amountOffset: number };
}
