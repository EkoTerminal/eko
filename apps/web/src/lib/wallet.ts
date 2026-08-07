import { createConfig, http } from 'wagmi';
import { robinhood, robinhoodTestnet } from 'viem/chains';
import { injected } from 'wagmi/connectors';
import { NETWORKS } from '@eko/shared';
import { getPublicClient } from 'wagmi/actions';
import { API_BASE } from './api';

/**
 * Wallet configuration. Injected wallets are discovered via EIP-6963 (wagmi default).
 * Mainnet reads and receipt verification share the keyless API endpoint.
 */
export const chains = [robinhood, ...(import.meta.env.DEV ? [robinhoodTestnet] : [])] as const;
export const READ_RPC_URL = `${API_BASE}/rpc`;
export const readRpcTransport = () => http(READ_RPC_URL, {
  batch: false, retryCount: 0, fetchOptions: { credentials: 'omit' },
});

export const wagmiConfig = createConfig({
  chains,
  batch: { multicall: false },
  connectors: [injected()],
  transports: {
    [robinhood.id]: readRpcTransport(),
    [robinhoodTestnet.id]: http(NETWORKS['robinhood-testnet'].publicRpcUrl, { fetchOptions: { credentials: 'omit' } }),
  },
});

// Packet 113's verifier uses this client for latest registry calls and transaction receipts.
export const receiptReadClient = getPublicClient(wagmiConfig, { chainId: robinhood.id })!;

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}

export type SupportedChainId = (typeof chains)[number]['id'];
