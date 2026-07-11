import { randomBytes } from 'node:crypto';
import type { Quote } from '@eko/shared';

interface Stored {
  quote: Quote;
  accountId: string;
  consumed: boolean;
}

/** Short-lived in-memory quote cache. Quotes are single-use and expire on their own clock. */
export class QuoteStore {
  private quotes = new Map<string, Stored>();
  constructor(private now: () => number = Date.now) {
    setInterval(() => this.gc(), 30_000).unref();
  }

  newId() {
    return `q_${this.now().toString(36)}${randomBytes(6).toString('hex')}`;
  }

  put(quote: Quote, accountId: string) {
    this.quotes.set(quote.id, { quote, accountId, consumed: false });
  }

  get(id: string): Stored | undefined {
    return this.quotes.get(id);
  }

  consume(id: string) {
    const q = this.quotes.get(id);
    if (q) q.consumed = true;
  }

  private gc() {
    const cutoff = this.now() - 5 * 60_000;
    for (const [id, q] of this.quotes) if (q.quote.expiresAt < cutoff) this.quotes.delete(id);
  }
}
