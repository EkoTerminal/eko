import { loadRegistry } from './registry.js';
import { verifyChain } from './verify.js';
import { createMeteredClients } from './rpc/clients.js';
import { safeError } from './rpc/safe-error.js';
import { RpcGuardError } from './rpc/metered.js';
let interrupted = false;
const { public: client, meter } = createMeteredClients(process.env, { standalone: true, onSessionBudget: () => stop() });
const stop = () => { interrupted = true; meter.stop(); process.exitCode = 0; };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
try {
  if (process.env.CHAIN_ID && process.env.CHAIN_ID !== '4663') throw new Error('CHAIN_ID must be 4663');
  const report = await verifyChain(loadRegistry(), client);
  console.table(report.rows.map(row => ({ entry: row.entry, check: row.check, result: row.ok ? 'PASS' : 'FAIL', detail: row.detail })));
  console.log(`verify:chain ${report.ok ? 'passed' : 'failed'}${report.block ? ` at block ${report.block}` : ''}`);
  process.exitCode = interrupted || report.ok ? 0 : 1;
} catch (error) {
  console.error(safeError(error)); process.exitCode = error instanceof RpcGuardError && error.code === 'rpc_session_budget_reached' ? 0 : 1;
} finally {
  process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
  await meter.close();
}
