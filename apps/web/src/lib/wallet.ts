import { createConfig, http } from 'wagmi';
import { robinhood, robinhoodTestnet } from 'viem/chains';
import { injected } from 'wagmi/connectors';
import { NETWORKS } from '@eko/shared';
import { getPublicClient } from 'wagmi/actions';
import { API_BASE } from './api';

/**
 * Wallet configuration. Injected wallets are discovered via EIP-6963 (wagmi default).
 * Wallet reads use the keyless API endpoint; receipts read the public chain RPC directly.
 */
export const chains = [robinhood, ...(import.meta.env.DEV ? [robinhoodTestnet] : [])] as const;
export const READ_RPC_URL = `${API_BASE}/rpc`;
export const readRpcTransport = () => http(READ_RPC_URL, {
  batch: false, retryCount: 0, fetchOptions: { credentials: 'omit' },
});

export const wagmiConfig = createConfig({
  // The lazy terminal can remount after landing navigation; hydrate in an effect, after render.
  ssr: true,
  chains,
  batch: { multicall: false },
  connectors: [injected()],
  transports: {
    [robinhood.id]: readRpcTransport(),
    [robinhoodTestnet.id]: http(NETWORKS['robinhood-testnet'].publicRpcUrl, { fetchOptions: { credentials: 'omit' } }),
  },
});

// Packet 113: a separate keyless read configuration has no connectors or paid
// endpoint. Registry checks never consume an EKO server's RPC response.
const receiptReadConfig = createConfig({
  chains: [robinhood],
  batch: { multicall: false },
  transports: { [robinhood.id]: http(NETWORKS['robinhood-mainnet'].publicRpcUrl, {
    batch: false, retryCount: 0, fetchOptions: { credentials: 'omit' },
  }) },
});
export const receiptReadClient = getPublicClient(receiptReadConfig, { chainId: robinhood.id })!;

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}

export type SupportedChainId = (typeof chains)[number]['id'];
