import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { expect, it } from 'vitest';
import { ChainDb, migrate, openDb } from '../src/client.js';
import { migrateEngines } from '../src/engines-migrate.js';

// PGlite has one backend and cannot exercise lock waits/deadlock detection. Use an isolated schema on test Postgres.
const databaseUrl=process.env.EKO_TEST_POSTGRES_URL;
it.skipIf(!databaseUrl)('two concurrent refreshes with overlapping, reversed coin sets serialize without deadlocking',async()=>{
  const admin=await openDb({databaseUrl});
  const schema=`retention_test_${randomUUID().replaceAll('-','')}`;
  const pool=new pg.Pool({connectionString:databaseUrl,max:3});
  const clients=await Promise.all([pool.connect(),pool.connect(),pool.connect()]);
  const [one,two,observer]=clients;
  try {
    await admin.sql.query(`CREATE SCHEMA ${schema}`);
    for(const client of clients)await client.query(`SET search_path TO ${schema},public`);
    const db=new ChainDb(one,async work=>{
      await one.query('BEGIN');
      try {const result=await work(one);await one.query('COMMIT');return result;}
      catch(error) {await one.query('ROLLBACK');throw error;}
    });
    await migrate(db);await migrateEngines(db);
    const coins=[1,2,3].map(n=>Buffer.alloc(20,n));
    await one.query(`INSERT INTO chain_blocks(number,block,hash,parent_hash,ts) VALUES(1,1,$1,$1,now())`,[Buffer.alloc(32)]);
    for(const coin of coins)await one.query('INSERT INTO tokens(address,deployer,first_block,block,curve) VALUES($1,$1,1,1,$1)',[coin]);
    // Force an interleaving at first-created mutex keys. Reversed acquisition would make a real lock cycle.
    await one.query(`CREATE FUNCTION pause_mutex_insert() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN PERFORM pg_sleep(0.05);RETURN NEW;END $$`);
    await one.query('CREATE TRIGGER pause_mutex_insert AFTER INSERT ON read_projection_locks FOR EACH ROW EXECUTE FUNCTION pause_mutex_insert()');
    for(const client of [one,two]) {
      await client.query("SET statement_timeout='5s'");
      await client.query('BEGIN');
    }
    const pids=await Promise.all([one,two].map(async client=>(await client.query<{pid:number}>('SELECT pg_backend_pid() AS pid')).rows[0]!.pid));
    const first=one.query('SELECT refresh_read_models($1::bytea[],0)',[[coins[0],coins[1]]]);
    void first.catch(()=>{});
    const second=two.query('SELECT refresh_read_models($1::bytea[],0)',[[coins[2],coins[1],coins[0]]]);
    void second.catch(()=>{}); // Keep the original rejection for the awaited assertion below.
    // Observe an actual cross-backend wait before letting the first refresh proceed. No timing-only assertion.
    const until=Date.now()+2000;
    let waiting:{one:boolean;two:boolean}|undefined;
    while(Date.now()<until) {
      const state=(await observer.query<{one:boolean;two:boolean}>(
        'SELECT cardinality(pg_blocking_pids($1))>0 AS one,cardinality(pg_blocking_pids($2))>0 AS two',pids)).rows[0]!;
      if(state.one || state.two) {waiting=state;break;}
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    expect(waiting).toBeDefined();
    if(waiting!.one) {
      await second;await two.query('COMMIT');await first;await one.query('COMMIT');
    } else {
      await first;await one.query('COMMIT');await second;await two.query('COMMIT');
    }
    expect((await observer.query('SELECT coin FROM read_coins ORDER BY coin')).rows).toHaveLength(3);
    expect((await observer.query('SELECT id FROM read_feed')).rows).toHaveLength(3);
  } finally {
    for(const client of clients) {await client.query('ROLLBACK');client.release();}
    await pool.end();await admin.sql.query(`DROP SCHEMA ${schema} CASCADE`);await admin.close();
  }
});
