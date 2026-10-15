import { BacklogError } from '@eko/db';
import { loadRegistry } from '@eko/chain';
import { RETENTION_RULE_INPUTS } from '@eko/engines';
import { backlogCli } from '../../../../packages/db/src/raw-history-backlog-cli.js';

backlogCli({...RETENTION_RULE_INPUTS,poolManager:loadRegistry().addressOf('uniswapV4.poolManager') ?? undefined}).catch(error=>{
  // Never print driver error details, row values or database connection strings.
  console.error(JSON.stringify({event:'failed',code:(error as {code?:string})?.code ?? 'backlog_failed',message:error instanceof BacklogError?error.message:'Database operation failed; inspect database logs'}));
  process.exitCode=1;
});
