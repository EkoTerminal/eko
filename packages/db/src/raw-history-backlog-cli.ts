import pg from 'pg';
import { ChainDb } from './client.js';
import { BacklogError, parseBacklogOptions, runRawHistoryBacklog } from './raw-history-backlog.js';

export async function backlogCli(inputs:Parameters<typeof runRawHistoryBacklog>[3]={}) {
  const options=parseBacklogOptions(process.argv.slice(2));
  if(!process.env.DATABASE_URL)throw new BacklogError('DATABASE_URL is required');
  const client=new pg.Client({connectionString:process.env.DATABASE_URL,application_name:'eko-raw-history-backlog'});
  let stopped=false;
  const stop=()=>{stopped=true;};
  process.on('SIGINT',stop);process.on('SIGTERM',stop);
  try {
    await client.connect();
    console.log(JSON.stringify({event:'started',pid:process.pid,...options}));
    const db=new ChainDb(client,async work=>{
      await client.query('BEGIN');
      try {const result=await work(client);await client.query('COMMIT');return result;}
      catch(error) {await client.query('ROLLBACK');throw error;}
    });
    await runRawHistoryBacklog(db,options,{stopped:()=>stopped,report:event=>console.log(JSON.stringify(event))},inputs);
  } finally {
    await client.end();
    process.off('SIGINT',stop);process.off('SIGTERM',stop);
  }
}