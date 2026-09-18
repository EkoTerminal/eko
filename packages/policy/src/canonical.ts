import { keccak256, stringToHex } from 'viem';
import type { PreflightRequest } from '@eko/shared';

import { canonicalize } from '@eko/shared';
export { canonicalize } from '@eko/shared';

export function orderHash(order: PreflightRequest['order']): `0x${string}` {
  // TODO(spec): omit undefined optional order fields before JCS; they are absent on the JSON wire.
  const jsonOrder = Object.fromEntries(Object.entries(order).filter(([, value]) => value !== undefined));
  return keccak256(stringToHex(canonicalize(jsonOrder)));
}
