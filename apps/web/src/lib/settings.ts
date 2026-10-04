import { useConnection } from 'wagmi';
import { z } from 'zod';
import { useApp } from '../store/app';
import { fetchParsed } from './api';
import { SETTINGS_COPY as C } from '../copy/settings';

/** Keep private sections hidden while the wallet and SIWE cookie disagree. */
export function useSettingsSession() {
  const { address, chainId } = useConnection();
  const account = useApp(s => s.account);
  const verified = account?.kind === 'wallet' && !!address && account.walletAddress === address.toLowerCase();
  return { address, chainId, owner: verified ? account.id : null, identity: verified || account?.kind === 'guest' ? account?.id : null };
}
export async function deleteHarnessData(confirmation: string) {
  if (confirmation !== C.deleteWord) throw new Error(C.deletePrompt);
  return fetchParsed('/me/data', z.object({ deletedAt: z.string().datetime() }), { method: 'DELETE' });
}

/** Server-provided referral link, constrained to a plain HTTPS landing URL. */
export function referralLink(link: string, code: string): string | null {
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.hash || !code || url.searchParams.get('ref') !== code || [...url.searchParams.keys()].some(key => key !== 'ref')) return null;
    return url.href;
  } catch { return null; }
}
