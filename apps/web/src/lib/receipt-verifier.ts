import { concat, encodeAbiParameters, keccak256, stringToHex } from 'viem';
import { createGuardReceiptCodec } from '@eko/shared';

// Pure browser entry point; callers obtain the root from the configured registry
// at the referenced batch/transaction, rather than trusting an API's root.
export const receiptVerifier = createGuardReceiptCodec({concat,encodeAbiParameters,keccak256,stringToHex});
