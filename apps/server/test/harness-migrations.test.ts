import { seedSanctions, listedWallet } from './sanctions-fixture.js';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS_DIR, openDb, runMigrations } from '../src/db/client.js';
import { accounts, agents, agentKeys, policies, tradingAllowlist, journalConsent, mcpRateLimits, ofacSdn, oauthClients, oauthRequests, oauthRegistrationLimits } from '../src/db/schema.js';

const journalPath = join(MIGRATIONS_DIR, 'meta/_journal.json');
const readJournal = async () => JSON.parse(await readFile(journalPath, 'utf8')) as {
  entries: { idx: number; tag: string; when: number }[];
};

async function exerciseHarness(db: Awaited<ReturnType<typeof openDb>>['db']) {
  const [account] = await db.insert(accounts).values({ kind: 'wallet' }).returning();
  const [agent] = await db.insert(agents).values({ accountId: account!.id, name: 'Sample agent', kind: 'other' }).returning();
  await db.insert(policies).values({ agentId: agent!.id, version: 1,
    policy: { mode: 'balanced', killed: false, version: 1, blockPlaybookLevel: null } });
  await db.insert(agentKeys).values({ agentId: agent!.id, prefix: 'migration-fixture', hash: '0'.repeat(64) });
  expect(await db.select().from(agents)).toHaveLength(1);
  expect(await db.select().from(policies)).toHaveLength(1);
  expect(await db.select().from(agentKeys)).toHaveLength(1);
}

describe('private journal 0005, MCP 0006, sanctions 0007 monitoring 0010, OAuth 0017 and points 0023 migration chain (offline PGlite)', () => {
  it('migrates a fresh database and preserves both feature schemas on rerun', async () => {
    const handle = await openDb({ pgliteDir: ':memory:' });
    try {
      await runMigrations(handle);
      await exerciseHarness(handle.db);
      expect(await handle.db.select().from(tradingAllowlist)).toEqual([]);
      await runMigrations(handle);
      expect(await handle.db.select().from(agents)).toHaveLength(1);
      const journal = await readJournal();
      expect(journal.entries.map(entry => entry.idx)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      for (let i = 1; i < journal.entries.length; i++) expect(journal.entries[i]!.when).toBeGreaterThan(journal.entries[i - 1]!.when);
      expect(journal.entries.map(entry => entry.tag)).toEqual(['0000_init', '0001_feature_flags', '0002_v1_account', '0003_trade_access', '0004_harness', '0005_private_journal', '0006_mcp_rate_limits', '0007_ofac', '0010_launch_monitoring', '0017_oauth_discovery', '0023_points_ledger']);
      const previous = JSON.parse(await readFile(join(MIGRATIONS_DIR, 'meta/0003_snapshot.json'), 'utf8'));
      const next = JSON.parse(await readFile(join(MIGRATIONS_DIR, 'meta/0004_snapshot.json'), 'utf8'));
      expect(next.prevId).toBe(previous.id);
      expect(next.tables['public.trading_allowlist']).toEqual(previous.tables['public.trading_allowlist']);
      for (const table of ['agents', 'agent_keys', 'policies']) expect(next.tables[`public.${table}`]).toBeDefined();
      const privateJournal = JSON.parse(await readFile(join(MIGRATIONS_DIR, 'meta/0005_snapshot.json'), 'utf8'));
      const mcp = JSON.parse(await readFile(join(MIGRATIONS_DIR, 'meta/0006_snapshot.json'), 'utf8'));
      expect(privateJournal.prevId).toBe(next.id);
      expect(mcp.prevId).toBe(privateJournal.id);
      for (const [name, table] of Object.entries(privateJournal.tables)) expect(mcp.tables[name]).toEqual(table);
      expect(Object.keys(mcp.tables).filter(name => !(name in privateJournal.tables))).toEqual(['public.mcp_rate_limits']);
      const sanctions = JSON.parse(await readFile(join(MIGRATIONS_DIR, 'meta/0007_snapshot.json'), 'utf8'));
      expect(sanctions.prevId).toBe(mcp.id);
      for (const [name, table] of Object.entries(mcp.tables)) expect(sanctions.tables[name]).toEqual(table);
      expect(Object.keys(sanctions.tables).filter(name => !(name in mcp.tables)).sort()).toEqual(['public.ofac_refresh', 'public.ofac_sdn']);
      const monitoring = JSON.parse(await readFile(join(MIGRATIONS_DIR, 'meta/0010_snapshot.json'), 'utf8'));
      expect(monitoring.prevId).toBe(sanctions.id);
      for (const [name, table] of Object.entries(sanctions.tables)) expect(monitoring.tables[name]).toEqual(table);
      expect(Object.keys(monitoring.tables).filter(name => !(name in sanctions.tables))).toEqual(['public.launch_measurements']);
      const oauth = JSON.parse(await readFile(join(MIGRATIONS_DIR, 'meta/0017_snapshot.json'), 'utf8'));
      expect(oauth.prevId).toBe(monitoring.id);
      for (const [name, table] of Object.entries(monitoring.tables)) expect(oauth.tables[name]).toEqual(table);
      expect(Object.keys(oauth.tables).filter(name => !(name in monitoring.tables)).sort())
        .toEqual(['public.oauth_clients', 'public.oauth_registration_limits', 'public.oauth_requests']);
      const points = JSON.parse(await readFile(join(MIGRATIONS_DIR, 'meta/0023_snapshot.json'), 'utf8'));
      expect(points.prevId).toBe(oauth.id);
      for (const [name, table] of Object.entries(oauth.tables)) {
        if (name === 'public.referrals') expect(points.tables[name]).toEqual({
          ...(table as object), checkConstraints: { referrals_no_self: {
            name: 'referrals_no_self', value: '"referrals"."referrer_account_id" <> "referrals"."referred_account_id"',
          } },
        });
        else expect(points.tables[name]).toEqual(table);
      }
      expect(Object.keys(points.tables).filter(name => !(name in oauth.tables)).sort())
        .toEqual(['public.points_ledger', 'public.points_scan_creators']);
      expect((await handle.chain.sql.query('SELECT * FROM launch_measurements')).rows).toEqual([]);
      expect(await handle.db.select().from(journalConsent)).toEqual([]);
      await seedSanctions(handle.chain);
      const dataset = await handle.db.select().from(ofacSdn);
      expect(dataset[0]!.addresses).toContain(listedWallet);
      await handle.db.insert(mcpRateLimits).values({ subjectHash: 'a'.repeat(64), windowStart: new Date(), hits: 1 });
      await runMigrations(handle);
      expect(await handle.db.select().from(mcpRateLimits)).toHaveLength(1);
      expect(await handle.db.select().from(ofacSdn)).toEqual(dataset);
    } finally { await handle.close(); }
  });

  it('upgrades a database already on main 0003 without losing its allowlist data', async () => {
    const staging = await mkdtemp(join(tmpdir(), 'eko-091b-main-migrations-'));
    const handle = await openDb({ pgliteDir: ':memory:' });
    try {
      await cp(join(MIGRATIONS_DIR, 'meta'), join(staging, 'meta'), { recursive: true });
      const journal = await readJournal();
      await writeFile(join(staging, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: journal.entries.slice(0, 4) }));
      for (const entry of journal.entries.slice(0, 4)) await cp(join(MIGRATIONS_DIR, `${entry.tag}.sql`), join(staging, `${entry.tag}.sql`));
      await migrate(handle.db as never, { migrationsFolder: staging });
      const [account] = await handle.db.insert(accounts).values({ kind: 'wallet' }).returning();
      const wallet = `0x${'a'.repeat(40)}`;
      await handle.db.insert(tradingAllowlist).values({ wallet, role: 'beta_user', capUsd: 100, addedBy: account!.id });
      const before = await handle.db.select().from(tradingAllowlist);
      await runMigrations(handle);
      expect(await handle.db.select().from(tradingAllowlist)).toEqual(before);
      await exerciseHarness(handle.db);
      await runMigrations(handle);
      expect(await handle.db.select().from(tradingAllowlist)).toEqual(before);
      expect(await handle.db.select().from(agents)).toHaveLength(1);
    } finally { await handle.close(); await rm(staging, { recursive: true, force: true }); }
  });

  it('upgrades all main migrations through private journal 0005 without losing existing data', async () => {
    const staging = await mkdtemp(join(tmpdir(), 'eko-093b-main-migrations-'));
    const handle = await openDb({ pgliteDir: ':memory:' });
    try {
      await cp(join(MIGRATIONS_DIR, 'meta'), join(staging, 'meta'), { recursive: true });
      const journal = await readJournal();
      await writeFile(join(staging, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: journal.entries.slice(0, 6) }));
      for (const entry of journal.entries.slice(0, 6)) await cp(join(MIGRATIONS_DIR, `${entry.tag}.sql`), join(staging, `${entry.tag}.sql`));
      await migrate(handle.db as never, { migrationsFolder: staging });
      await exerciseHarness(handle.db);
      const [account] = await handle.db.select().from(accounts);
      await handle.db.insert(journalConsent).values({ accountId: account!.id, optedIn: true });
      const before = await handle.db.select().from(journalConsent);
      expect((await handle.chain.sql.query("SELECT to_regclass('public.mcp_rate_limits') AS table_name")).rows[0]!.table_name).toBeNull();
      const mainLedger = (await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
      expect(mainLedger).toHaveLength(6);
      await runMigrations(handle);
      expect(await handle.db.select().from(journalConsent)).toEqual(before);
      expect(await handle.db.select().from(agents)).toHaveLength(1);
      expect(await handle.db.select().from(agentKeys)).toHaveLength(1);
      const mergedLedger = (await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
      expect(mergedLedger.slice(0, 6)).toEqual(mainLedger);
      expect(mergedLedger).toHaveLength(11);
      await handle.db.insert(mcpRateLimits).values({ subjectHash: 'b'.repeat(64), windowStart: new Date(), hits: 2 });
      await runMigrations(handle);
      expect(await handle.db.select().from(journalConsent)).toEqual(before);
      expect((await handle.db.select().from(mcpRateLimits))[0]!.hits).toBe(2);
    } finally { await handle.close(); await rm(staging, { recursive: true, force: true }); }
  });

  it('upgrades main through MCP 0006 without changing its journal, allowlist, counters or migration ledger', async () => {
    const staging = await mkdtemp(join(tmpdir(), 'eko-074b-main-migrations-'));
    const handle = await openDb({ pgliteDir: ':memory:' });
    try {
      await cp(join(MIGRATIONS_DIR, 'meta'), join(staging, 'meta'), { recursive: true });
      const journal = await readJournal();
      const mainEntries = journal.entries.slice(0, 7);
      await writeFile(join(staging, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: mainEntries }));
      for (const entry of mainEntries) await cp(join(MIGRATIONS_DIR, `${entry.tag}.sql`), join(staging, `${entry.tag}.sql`));
      await migrate(handle.db as never, { migrationsFolder: staging });
      await exerciseHarness(handle.db);
      const [account] = await handle.db.select().from(accounts);
      await handle.db.insert(journalConsent).values({ accountId: account!.id, optedIn: true });
      await handle.db.insert(tradingAllowlist).values({ wallet: listedWallet, role: 'team', capUsd: 25, addedBy: account!.id });
      await handle.db.insert(mcpRateLimits).values({ subjectHash: 'c'.repeat(64), windowStart: new Date(), hits: 3 });
      const before = { consent: await handle.db.select().from(journalConsent),
        allowlist: await handle.db.select().from(tradingAllowlist), counters: await handle.db.select().from(mcpRateLimits),
        agents: await handle.db.select().from(agents), keys: await handle.db.select().from(agentKeys),
        ledger: (await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows };
      expect(before.ledger).toHaveLength(7);
      expect((await handle.chain.sql.query("SELECT to_regclass('public.ofac_sdn') AS table_name")).rows[0]!.table_name).toBeNull();
      await runMigrations(handle);
      await seedSanctions(handle.chain);
      const dataset = await handle.db.select().from(ofacSdn);
      expect(dataset[0]!.addresses).toContain(listedWallet);
      await runMigrations(handle);
      expect(await handle.db.select().from(journalConsent)).toEqual(before.consent);
      expect(await handle.db.select().from(tradingAllowlist)).toEqual(before.allowlist);
      expect(await handle.db.select().from(mcpRateLimits)).toEqual(before.counters);
      expect(await handle.db.select().from(agents)).toEqual(before.agents);
      expect(await handle.db.select().from(agentKeys)).toEqual(before.keys);
      expect(await handle.db.select().from(ofacSdn)).toEqual(dataset);
      const mergedLedger = (await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
      expect(mergedLedger.slice(0, 7)).toEqual(before.ledger);
      expect(mergedLedger).toHaveLength(11);
      expect(Number(mergedLedger[7]!.created_at)).toBeGreaterThan(Number(mergedLedger[6]!.created_at));
    } finally { await handle.close(); await rm(staging, { recursive: true, force: true }); }
  });
});

// Main 0000–0007 is the precise predecessor chain for reserved migration 0010.
it('upgrades main through sanctions 0007 and preserves its data and ledger on repeat', async () => {
  const staging = await mkdtemp(join(tmpdir(), 'eko-085b-main-migrations-'));
  const handle = await openDb({ pgliteDir: ':memory:' });
  try {
    await cp(join(MIGRATIONS_DIR, 'meta'), join(staging, 'meta'), { recursive: true });
    const journal = await readJournal();
    const mainEntries = journal.entries.slice(0, 8);
    expect(mainEntries.at(-1)!.tag).toBe('0007_ofac');
    await writeFile(join(staging, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: mainEntries }));
    for (const entry of mainEntries) await cp(join(MIGRATIONS_DIR, `${entry.tag}.sql`), join(staging, `${entry.tag}.sql`));
    await migrate(handle.db as never, { migrationsFolder: staging });
    await exerciseHarness(handle.db);
    const [account] = await handle.db.select().from(accounts);
    await handle.db.insert(journalConsent).values({ accountId: account!.id, optedIn: true });
    await handle.db.insert(tradingAllowlist).values({ wallet: listedWallet, role: 'team', capUsd: 25, addedBy: account!.id });
    await handle.db.insert(mcpRateLimits).values({ subjectHash: 'd'.repeat(64), windowStart: new Date(), hits: 4 });
    await seedSanctions(handle.chain);
    const before = {
      consent: await handle.db.select().from(journalConsent), allowlist: await handle.db.select().from(tradingAllowlist),
      counters: await handle.db.select().from(mcpRateLimits), agents: await handle.db.select().from(agents),
      keys: await handle.db.select().from(agentKeys), sanctions: await handle.db.select().from(ofacSdn),
      ledger: (await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows,
    };
    expect(before.ledger).toHaveLength(8);
    expect((await handle.chain.sql.query("SELECT to_regclass('public.launch_measurements') AS table_name")).rows[0]!.table_name).toBeNull();
    await runMigrations(handle);
    await handle.chain.sql.query('INSERT INTO launch_measurements VALUES($1,$2,$3)', ['backup_success', '[{"value":1,"at":1}]', 1]);
    await runMigrations(handle);
    expect(await handle.db.select().from(journalConsent)).toEqual(before.consent);
    expect(await handle.db.select().from(tradingAllowlist)).toEqual(before.allowlist);
    expect(await handle.db.select().from(mcpRateLimits)).toEqual(before.counters);
    expect(await handle.db.select().from(agents)).toEqual(before.agents);
    expect(await handle.db.select().from(agentKeys)).toEqual(before.keys);
    expect(await handle.db.select().from(ofacSdn)).toEqual(before.sanctions);
    expect((await handle.chain.sql.query('SELECT * FROM launch_measurements')).rows).toHaveLength(1);
    const ledger = (await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
    expect(ledger.slice(0, 8)).toEqual(before.ledger); expect(ledger).toHaveLength(11);
    expect(Number(ledger[8]!.created_at)).toBe(journal.entries[8]!.when);
  } finally { await handle.close(); await rm(staging, { recursive: true, force: true }); }
});

it('upgrades main through monitoring 0010 and preserves OAuth state on repeat', async () => {
  const staging = await mkdtemp(join(tmpdir(), 'eko-097-main-migrations-'));
  const handle = await openDb({ pgliteDir: ':memory:' });
  try {
    await cp(join(MIGRATIONS_DIR, 'meta'), join(staging, 'meta'), { recursive: true });
    const journal = await readJournal();
    const mainEntries = journal.entries.slice(0, 9);
    expect(mainEntries.at(-1)!.tag).toBe('0010_launch_monitoring');
    await writeFile(join(staging, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: mainEntries }));
    for (const entry of mainEntries) await cp(join(MIGRATIONS_DIR, `${entry.tag}.sql`), join(staging, `${entry.tag}.sql`));
    await migrate(handle.db as never, { migrationsFolder: staging });
    await exerciseHarness(handle.db);
    await handle.chain.sql.query('INSERT INTO launch_measurements VALUES($1,$2,$3)', ['fixture_counter', '[]', 1]);
    const before = { agents: await handle.db.select().from(agents), keys: await handle.db.select().from(agentKeys),
      monitoring: (await handle.chain.sql.query('SELECT * FROM launch_measurements')).rows,
      ledger: (await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows };
    expect(before.ledger).toHaveLength(9);
    expect((await handle.chain.sql.query("SELECT to_regclass('public.oauth_clients') AS table_name")).rows[0]!.table_name).toBeNull();
    await runMigrations(handle);
    await handle.db.insert(oauthClients).values({ id: 'sample-client', clientName: { text: 'Sample client', flags: [], truncated: false },
      redirectUris: ['https://clients.example/callback'] });
    await handle.db.insert(oauthRequests).values({ clientId: 'sample-client', redirectUri: 'https://clients.example/callback',
      codeChallenge: 'A'.repeat(43), codeChallengeMethod: 'S256', state: 'sample-state', scopes: ['senses:read', 'preflight', 'journal'],
      resource: 'https://mcp.eko.example/mcp', expiresAt: new Date(Date.now() + 600_000) });
    await handle.db.insert(oauthRegistrationLimits).values({ subjectHash: 'e'.repeat(64), attempts: [new Date()], allowed: true });
    const oauth = { clients: await handle.db.select().from(oauthClients), requests: await handle.db.select().from(oauthRequests),
      limits: await handle.db.select().from(oauthRegistrationLimits) };
    await runMigrations(handle);
    expect(await handle.db.select().from(agents)).toEqual(before.agents);
    expect(await handle.db.select().from(agentKeys)).toEqual(before.keys);
    expect((await handle.chain.sql.query('SELECT * FROM launch_measurements')).rows).toEqual(before.monitoring);
    expect(await handle.db.select().from(oauthClients)).toEqual(oauth.clients);
    expect(await handle.db.select().from(oauthRequests)).toEqual(oauth.requests);
    expect(await handle.db.select().from(oauthRegistrationLimits)).toEqual(oauth.limits);
    const ledger = (await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
    expect(ledger.slice(0, 9)).toEqual(before.ledger); expect(ledger).toHaveLength(11);
    expect(Number(ledger[9]!.created_at)).toBe(journal.entries[9]!.when);
  } finally { await handle.close(); await rm(staging, { recursive: true, force: true }); }
});

it('upgrades OAuth 0017 to points 0023 and preserves attribution and append-only history on rerun',async()=>{
  const staging=await mkdtemp(join(tmpdir(),'eko-122-main-migrations-'));
  const handle=await openDb({pgliteDir:':memory:'});
  try {
    await cp(join(MIGRATIONS_DIR,'meta'),join(staging,'meta'),{recursive:true});
    const journal=await readJournal(),mainEntries=journal.entries.slice(0,10);
    expect(mainEntries.at(-1)!.tag).toBe('0017_oauth_discovery');
    await writeFile(join(staging,'meta/_journal.json'),JSON.stringify({...journal,entries:mainEntries}));
    for(const entry of mainEntries)await cp(join(MIGRATIONS_DIR,`${entry.tag}.sql`),join(staging,`${entry.tag}.sql`));
    await migrate(handle.db as never,{migrationsFolder:staging});
    const [a,b]=await handle.db.insert(accounts).values([{kind:'wallet'},{kind:'wallet'}]).returning();
    await handle.chain.sql.query('INSERT INTO referral_codes VALUES($1,$2)',[a!.id,'sample-referral']);
    await handle.chain.sql.query('INSERT INTO referrals(referred_account_id,referrer_account_id) VALUES($1,$2)',[b!.id,a!.id]);
    const before={codes:(await handle.chain.sql.query('SELECT * FROM referral_codes')).rows,
      referrals:(await handle.chain.sql.query('SELECT * FROM referrals')).rows,
      ledger:(await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows};
    expect(before.ledger).toHaveLength(10);
    await runMigrations(handle);
    await handle.chain.sql.query(`INSERT INTO points_ledger(account_id,category,source_id,points,occurred_at,earning_day)
      VALUES($1,'shared_journal','sample-entry',3,'2026-10-14T00:00:00Z','2026-10-14')`,[a!.id]);
    const credit=(await handle.chain.sql.query('SELECT * FROM points_ledger')).rows;
    await runMigrations(handle);
    expect((await handle.chain.sql.query('SELECT * FROM referral_codes')).rows).toEqual(before.codes);
    expect((await handle.chain.sql.query('SELECT * FROM referrals')).rows).toEqual(before.referrals);
    expect((await handle.chain.sql.query('SELECT * FROM points_ledger')).rows).toEqual(credit);
    const ledger=(await handle.chain.sql.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
    expect(ledger.slice(0,10)).toEqual(before.ledger);expect(ledger).toHaveLength(11);
    expect(Number(ledger[10]!.created_at)).toBe(journal.entries[10]!.when);
    await expect(handle.chain.sql.query('DELETE FROM points_ledger')).rejects.toThrow(/append-only/);
  } finally {await handle.close();await rm(staging,{recursive:true,force:true});}
});
