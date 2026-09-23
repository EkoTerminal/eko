import { z } from 'zod';
export const HexSchema = z.string().regex(/^0x[0-9a-fA-F]*$/).transform((value): `0x${string}` => value as `0x${string}`);
export type Hex = z.infer<typeof HexSchema>;
// FACTS §7 and BACKEND §23 (v1.2).
export const AddressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/).transform((value): `0x${string}` => value.toLowerCase() as `0x${string}`);
export type Address = z.infer<typeof AddressSchema>;
export const LevelSchema = z.enum(['clear', 'monitor', 'danger', 'info']);
export type Level = z.infer<typeof LevelSchema>;
export const WalletLabelSchema = z.enum(['declared_agent', 'likely_agent', 'crew', 'human']);
export type WalletLabel = z.infer<typeof WalletLabelSchema>;
export const UntrustedSchema = z.object({
  text: z.string(),
  truncated: z.boolean(),
  flags: z.array(z.enum(['agent_bait', 'link', 'impersonation'])),
});
export type Untrusted = z.infer<typeof UntrustedSchema>;
export const PlaybookIdSchema = z.enum(['honeypot', 'tax_trap', 'removable_liquidity', 'fee_trap_pool', 'stuck_at_bonding', 'wash_to_trend', 'clone_swarm', 'exempt_insiders', 'bundle_dump', 'migration_dump', 'malicious_hook', 'agent_bait', 'serial_deployer']);
export type PlaybookId = z.infer<typeof PlaybookIdSchema>;
export const EvidenceRefSchema = z.object({
  kind: z.enum(['tx', 'log', 'sim', 'address', 'code', 'stat', 'text']),
  ref: z.string(),
  block: z.number().optional(),
  label: z.string(),
  value: z.union([z.number(), z.string()]).optional(),
  text: UntrustedSchema.optional(),
});
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
export const PoolRefSchema = z.object({
  id: z.string(),
  venue: z.enum(['uniswap_v3', 'uniswap_v4', 'pons_curve', 'other']),
  address: AddressSchema.optional(),
  poolId: HexSchema.optional(),
  quote: AddressSchema,
  feeBps: z.number(),
  hooks: AddressSchema.optional(),
  liquidityUsd: z.number(),
  executable: z.boolean(),
});
export type PoolRef = z.infer<typeof PoolRefSchema>;
export const TfSchema = z.enum(['1s', '15s', '1m', '5m', '15m', '1h', '4h', '1d']);
export type Tf = z.infer<typeof TfSchema>;
