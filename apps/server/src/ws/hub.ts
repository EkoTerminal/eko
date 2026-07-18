import type { WebSocket } from 'ws';
import type { Agent, ClientMessage, ServerMessage, Timeframe } from '@eko/shared';
import { GuardWsClientSchema, GuardWsEventSchema, type GuardWsEvent, type CoinCardV2, type Address, WsClientSchema, WsChannelSchema, type WsChannel, type WsChannelKind, type WsEventMap } from '@eko/shared';
import { TIMEFRAMES, getMarket } from '@eko/shared';
import { logger } from '../obs/logger.js';

interface Client {
  id: number;
  socket: WebSocket;
  accountId: string;
  markets: Set<string>;
  timeframes: Set<Timeframe>;
}

const MAX_BUFFER = 2 * 1024 * 1024;

/**
 * Fan-out of server events to connected browsers. Market data is filtered by each
 * client's subscription; order/portfolio events only go to the owning account.
 * Slow consumers drop high-frequency market messages rather than growing memory.
 */
export class Hub {
  private clients = new Map<number, Client>();
  private nextId = 1;
  private v1 = new Map<number, { socket: WebSocket; accountId?: string; channels: Set<string>; resync: Set<string> }>();
  private v2 = new Map<number,{socket:WebSocket;channels:Set<string>;resync:Set<string>}>();
  private seqV2 = new Map<string,number>();
  private seq = new Map<string, number>();
  addV1(socket: WebSocket, accountId?: string) {
    const id = this.nextId++;
    const client = { socket, accountId, channels: new Set<string>(), resync: new Set<string>() };
    this.v1.set(id, client);
    socket.send(JSON.stringify({ t:'hello', serverTime:Date.now(), session:accountId ? 'user' : 'anon', delayedSec:0 }));
    socket.on('message', raw => {
      let input: unknown; try { input=JSON.parse(String(raw)); } catch { return; }
      const parsed=WsClientSchema.safeParse(input); if(!parsed.success)return;
      const msg=parsed.data;
      if(msg.op==='ping') {socket.send(JSON.stringify({t:'pong',serverTime:Date.now()}));return;}
      for(const ch of msg.ch.slice(0,64)) {
        const valid=WsChannelSchema.safeParse(ch);
        if(!valid.success || !(valid.data === 'agents' && accountId) && !/^(radar|pairs|feed|coin:0x[0-9a-f]{40}|flow:0x[0-9a-f]{40})$/.test(valid.data)) {
          socket.send(JSON.stringify({t:'err',code:'not_found',message:'Channel is not available',ch}));continue;
        }
        const channel=valid.data;
        if(msg.op==='unsub'){client.channels.delete(channel);continue;}
        if(client.channels.size>=64 && !client.channels.has(channel))continue;
        client.channels.add(channel);
        socket.send(JSON.stringify({t:'ack',ch:channel,seq:this.seq.get(channel === 'agents' ? `agents:${accountId}` : channel) ?? 0}));
      }
    });
    socket.on('close',()=>this.v1.delete(id));
    socket.on('error',()=>this.v1.delete(id));
    return id;
  }
  addV2(socket:WebSocket,card:(coin:Address)=>Promise<CoinCardV2|null>) {
    const id=this.nextId++,client={socket,channels:new Set<string>(),resync:new Set<string>()};
    this.v2.set(id,client);
    socket.send(JSON.stringify({t:'hello',version:2,serverTime:Date.now(),mode:'shadow'}));
    socket.on('message',async raw=>{
      let input:unknown;try {input=JSON.parse(String(raw));}catch {return;}
      const parsed=GuardWsClientSchema.safeParse(input);if(!parsed.success)return;
      const msg=parsed.data;
      if(msg.op==='ping'){socket.send(JSON.stringify({t:'pong',version:2,serverTime:Date.now()}));return;}
      for(const ch of msg.ch) {
        if(msg.op==='unsub'){client.channels.delete(ch);continue;}
        if(client.channels.size>=64 && !client.channels.has(ch))continue;
        client.channels.add(ch);
        socket.send(JSON.stringify({t:'ack',version:2,ch,seq:this.seqV2.get(ch)??0}));
        try {
          const data=await card(ch.slice(5) as Address);
          if(client.channels.has(ch) && socket.readyState===1) {
            socket.send(JSON.stringify(GuardWsEventSchema.parse({t:'ev',version:2,ch,seq:this.seqV2.get(ch)??0,ts:Date.now(),kind:'card',data})));
          }
        }catch {if(socket.readyState===1)socket.send(JSON.stringify({t:'err',version:2,code:'internal_error',message:'Card is unavailable.'}));}
      }
    });
    socket.on('close',()=>this.v2.delete(id));socket.on('error',()=>this.v2.delete(id));
    return id;
  }
  hasV2Subscribers(coin:Address) {return [...this.v2.values()].some(c=>c.channels.has(`coin:${coin}`));}
  publishV2(coin:Address,kind:GuardWsEvent['kind'],data:CoinCardV2|null|import('@eko/shared').GuardAssessmentV2) {
    const ch=`coin:${coin}`,seq=(this.seqV2.get(ch)??0)+1;this.seqV2.set(ch,seq);
    const payload=JSON.stringify(GuardWsEventSchema.parse({t:'ev',version:2,ch,seq,ts:Date.now(),kind,data}));
    for(const c of this.v2.values()) {
      if(!c.channels.has(ch) || c.socket.readyState!==1)continue;
      if(c.socket.bufferedAmount>MAX_BUFFER){if(!c.resync.has(ch)){c.resync.add(ch);c.socket.send(JSON.stringify({t:'resync',version:2,ch}));}continue;}
      if(c.resync.delete(ch)){c.socket.send(JSON.stringify({t:'resync',version:2,ch}));continue;}
      c.socket.send(payload);
    }
  }
  publish<K extends WsChannelKind, E extends keyof WsEventMap[K]>(ch:WsChannel<K>,kind:E,data:WsEventMap[K][E]) {
    // Private agent events must always pass through account-scoped publication.
    if (ch === 'agents') return;
    const seq=(this.seq.get(ch) ?? 0)+1;this.seq.set(ch,seq);
    const payload=JSON.stringify({t:'ev',ch,seq,ts:Date.now(),kind,data});
    for(const c of this.v1.values()) {
      if(!c.channels.has(ch) || c.socket.readyState!==1)continue;
      if(c.socket.bufferedAmount>MAX_BUFFER) {
        if(!c.resync.has(ch)){c.resync.add(ch);c.socket.send(JSON.stringify({t:'resync',ch}));}
        continue;
      }
      if(c.resync.delete(ch)){c.socket.send(JSON.stringify({t:'resync',ch}));continue;}
      c.socket.send(payload);
    }
  }
  publishAgent(accountId: string, agent: Agent) {
    const key = `agents:${accountId}`, seq = (this.seq.get(key) ?? 0) + 1;
    this.seq.set(key, seq);
    const payload = JSON.stringify({ t: 'ev', ch: 'agents', seq, ts: Date.now(), kind: 'agent', data: agent });
    for (const client of this.v1.values()) {
      if (client.accountId !== accountId || !client.channels.has('agents') || client.socket.readyState !== 1) continue;
      if (client.socket.bufferedAmount > MAX_BUFFER) {
        if (!client.resync.has('agents')) { client.resync.add('agents'); client.socket.send(JSON.stringify({ t: 'resync', ch: 'agents' })); }
        continue;
      }
      if (client.resync.delete('agents')) client.socket.send(JSON.stringify({ t: 'resync', ch: 'agents' }));
      client.socket.send(payload);
    }
  }
  onSubscriptionsChanged: (() => void) | null = null;

  add(socket: WebSocket, accountId: string, hello: ServerMessage) {
    const c: Client = { id: this.nextId++, socket, accountId, markets: new Set(), timeframes: new Set() };
    this.clients.set(c.id, c);
    this.send(c, hello);
    socket.on('message', (raw) => this.onMessage(c, String(raw)));
    socket.on('close', () => {
      this.clients.delete(c.id);
      this.onSubscriptionsChanged?.();
    });
    socket.on('error', (err) => logger.debug({ err }, 'ws client error'));
    return c.id;
  }

  private onMessage(c: Client, raw: string) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === 'ping') {
      this.send(c, { type: 'pong', t: msg.t, serverTime: Date.now() });
    } else if (msg.type === 'subscribe') {
      const markets = (Array.isArray(msg.markets) ? msg.markets : []).filter((m) => getMarket(m)).slice(0, 12);
      const tfs = (Array.isArray(msg.timeframes) ? msg.timeframes : []).filter((t): t is Timeframe => (TIMEFRAMES as readonly string[]).includes(t)).slice(0, 6);
      c.markets = new Set(markets);
      c.timeframes = new Set(tfs);
      this.onSubscriptionsChanged?.();
    }
  }

  private send(c: Client, msg: ServerMessage, droppable = false) {
    if (c.socket.readyState !== 1) return;
    if (droppable && c.socket.bufferedAmount > MAX_BUFFER) return;
    c.socket.send(JSON.stringify(msg));
  }

  broadcast(msg: ServerMessage, droppable = false) {
    const payload = JSON.stringify(msg);
    for (const c of this.clients.values()) {
      if (c.socket.readyState !== 1) continue;
      if (droppable && c.socket.bufferedAmount > MAX_BUFFER) continue;
      c.socket.send(payload);
    }
  }

  broadcastCandle(msg: Extract<ServerMessage, { type: 'candle' }>) {
    const payload = JSON.stringify(msg);
    for (const c of this.clients.values()) {
      if (!c.markets.has(msg.market) || !c.timeframes.has(msg.timeframe)) continue;
      if (c.socket.readyState !== 1 || (!msg.closed && c.socket.bufferedAmount > MAX_BUFFER)) continue;
      c.socket.send(payload);
    }
  }

  /** Order books go only to clients watching that market. */
  broadcastBook(msg: Extract<ServerMessage, { type: 'book' }>) {
    const payload = JSON.stringify(msg);
    for (const c of this.clients.values()) {
      if (!c.markets.has(msg.book.market) || c.socket.readyState !== 1 || c.socket.bufferedAmount > MAX_BUFFER) continue;
      c.socket.send(payload);
    }
  }

  /** Accounts with a client watching this market and timeframe. */
  accountsWatching(market: string, tf: Timeframe): string[] {
    const out = new Set<string>();
    for (const c of this.clients.values()) if (c.markets.has(market) && c.timeframes.has(tf)) out.add(c.accountId);
    return [...out];
  }

  /** Markets at least one client is watching. */
  watchedMarkets(): Set<string> {
    const s = new Set<string>();
    for (const c of this.clients.values()) for (const m of c.markets) s.add(m);
    return s;
  }

  toAccount(accountId: string, msg: ServerMessage) {
    for (const c of this.clients.values()) if (c.accountId === accountId) this.send(c, msg);
  }

  /** "market|tf" pairs at least one client is watching. */
  subscriptions(): Set<string> {
    const s = new Set<string>();
    for (const c of this.clients.values()) for (const m of c.markets) for (const tf of c.timeframes) s.add(`${m}|${tf}`);
    return s;
  }

  get size() {
    return this.clients.size;
  }

  closeAll() {
    for (const c of this.clients.values()) c.socket.close(1001, 'server shutdown');
    this.clients.clear();
    for(const c of this.v1.values())c.socket.close(1001, 'server shutdown');
    this.v1.clear();
    for(const c of this.v2.values())c.socket.close(1001, 'server shutdown');
    this.v2.clear();
  }
}
