import { afterEach,expect,it,vi } from 'vitest';
import { ChainClients } from '../src/exec/chain.js';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('API-only startup and periodic health do not probe either chain',async()=>{
 vi.useFakeTimers({toFake:['setInterval','clearInterval']});
 const probes=vi.spyOn(ChainClients.prototype,'checkHealth').mockResolvedValue([]);
 const app=await buildApp(loadConfig({APP_ROLE:'api',NODE_ENV:'test',PGLITE_DIR:':memory:',SESSION_SECRET:'role-test-placeholder'.repeat(3),LEGACY_API:'true',RUN_WORKER:'false',LIVE_TRADING_ENABLED:'false',MARKET_DATA_SOURCE:'onchain'}));
 try {
  expect(probes).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(21000);
  const health=(await app.app.inject('/v1/health')).json();expect(probes).not.toHaveBeenCalled();expect(health.rpc.today).toEqual([]);expect(health.rpc.sessionUnits).toBe(0);
 } finally {await app.close();}
},30000);
