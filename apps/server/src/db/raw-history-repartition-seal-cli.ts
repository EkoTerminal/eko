import { loadRegistry } from '@eko/chain';
import { RETENTION_RULE_INPUTS } from '@eko/engines';
import { openDb } from '@eko/db';
import { sealOctober } from '../../../../packages/db/src/raw-repartition.js';

async function main() {
  const asOf=new Date(process.argv[2] ?? '');
  if(!Number.isFinite(+asOf) || !process.env.DATABASE_URL)throw new Error('DATABASE_URL and an explicit UTC timestamp are required');
  const db=await openDb({databaseUrl:process.env.DATABASE_URL,poolOptions:{max:1,application_name:'eko-raw-history-seal'}});
  try {await sealOctober(db,asOf,Number(process.env.RETENTION_SWAP_DAYS ?? 7),Number(process.env.RETENTION_TRANSFER_DAYS ?? 3),{...RETENTION_RULE_INPUTS,poolManager:loadRegistry().addressOf('uniswapV4.poolManager') ?? undefined});}
  finally {await db.close();}
}
main().catch(error=>{console.error(JSON.stringify({event:'seal_failed',code:(error as {code?:string}).code ?? 'maintenance_failed'}));process.exitCode=1;});
