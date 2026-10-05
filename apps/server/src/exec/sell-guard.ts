import type { ChainDb } from '@eko/db';
import { SellChecker, recordSellRefusal, type SellCheckResult } from '@eko/engines';
import type { Address } from '@eko/shared';

/** The subset of the metered mainnet client the quote guard uses. */
export interface SellGuardClient {
  getBlockNumber(): Promise<bigint>;
  request(input: { method: string; params: readonly unknown[] }): Promise<unknown>;
}
/**
 * Quote-time sell check (BACKEND §12 "the sell fails (honeypot)" hard refusal). Every buy quote re-simulates the
 * round trip at the quoted size on the current block, through the API's metered RPC client. Results are reused only
 * for the same coin, size and block, which is the same simulation, never a reading from an earlier state.
 * TODO(spec): §12 re-simulates "with the user's own address"; the probe is a fresh contract address, so an
 * address-specific blacklist of the user's own wallet is not covered until an EOA simulation exists.
 */
export class SellGuard {
  private readonly checker: SellChecker;
  private readonly recent = new Map<string, Promise<SellCheckResult>>();
  /**
   * Wire the chain database (indexed routes, ETH-USD, refusal counts) and the API's metered mainnet client. Host
   * construction only; no request is made until a buy quote is checked.
   */
  constructor(private readonly db: ChainDb, private readonly client: SellGuardClient, private readonly now: () => number = Date.now) {
    this.checker = new SellChecker(db, { request: input => client.request(input) }, { now });
  }
  /**
   * Simulate a buy of `amountUsd` and the sell of everything it bought, on the current block. Public quote path;
   * the caller (TradeService) refuses on any status but `sellable`. Provider and budget errors reject, which the
   * caller also treats as a refusal.
   */
  async check(coin: Address, amountUsd: number): Promise<SellCheckResult> {
    const block = Number(await this.client.getBlockNumber());
    if (!Number.isSafeInteger(block) || block < 0) throw new Error('Invalid block number');
    const key = `${coin.toLowerCase()}:${block}:${amountUsd}`;
    let found = this.recent.get(key);
    if (!found) {
      found = this.checker.check(coin.toLowerCase() as Address, block, [amountUsd]);
      this.recent.set(key, found);
      found.catch(() => this.recent.delete(key));
      if (this.recent.size > 256) this.recent.delete(this.recent.keys().next().value!);
    }
    return found;
  }
  /** Count the refusal for Radar's "Honeypots refused"; the coin, block and size only. */
  refused(result: SellCheckResult, amountUsd: number) { return recordSellRefusal(this.db, result, new Date(this.now()), amountUsd); }
}
