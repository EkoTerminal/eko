import type { RetentionRuleRunner } from './retention-control.js';
import { validateReceiptPublication, type Publication } from './receipt-outbox.js';
import type { ChainDb } from './client.js';
import type { RetentionOptions, RetentionResult } from './retention.js';
import { addReport, reportRows, retentionBatch } from './determination-retention.js';

/** First grade since each rules cut is a permanent public measurement boundary. */
export const GRADE_CUTS = ['2026-10-12T18:30:00Z', '2026-10-13T07:30:00Z'] as const;
export async function preserveGradePrices(db: ChainDb, coin: Uint8Array, before: Date) {
  await db.sql.query(`INSERT INTO retention_grade_prices(coin,since,horizon_sec,graded_at,level,p0,p1,hi)
    SELECT $1,c.since,h.sec,g.ts,g.level,
    (SELECT s.usd/s.amount_coin::double precision FROM swaps s WHERE s.coin=$1 AND s.ts<=g.ts AND s.ts>g.ts-interval '1 hour' AND s.usd>0 AND s.amount_coin>0 ORDER BY s.ts DESC LIMIT 1),
    (SELECT s.usd/s.amount_coin::double precision FROM swaps s WHERE s.coin=$1 AND s.ts<=g.ts+h.sec*interval '1 second' AND s.usd>0 AND s.amount_coin>0 ORDER BY s.ts DESC LIMIT 1),
    (SELECT max(s.usd/s.amount_coin::double precision) FROM swaps s WHERE s.coin=$1 AND s.ts>g.ts AND s.ts<=g.ts+h.sec*interval '1 second' AND s.usd>0 AND s.amount_coin>0)
    FROM unnest($2::timestamptz[]) c(since) CROSS JOIN (VALUES(3600),(86400)) h(sec)
    CROSS JOIN LATERAL (SELECT bt.ts,v.data->>'level' AS level FROM verdicts v JOIN engine_block_times bt ON bt.number=v.valid_from_block LEFT JOIN receipt_publications p ON p.id=v.id
      WHERE v.coin=$1 AND v.valid_from_block>=(SELECT number FROM engine_block_times WHERE ts>=c.since ORDER BY ts,number LIMIT 1) AND bt.ts>=c.since AND v.data->>'level' IN ('clear','monitor','danger') ORDER BY v.valid_from_block,p.publication_sequence ASC NULLS FIRST,v.id LIMIT 1) g
    WHERE g.ts+h.sec*interval '1 second'<$3 ON CONFLICT DO NOTHING`, [coin,GRADE_CUTS,before]);
}
const old = (block: string) => `EXISTS(SELECT 1 FROM engine_block_times b WHERE b.number=${block} AND b.ts<$1)`;
/** Reader/FK exceptions are applied only to bounded candidate windows. Dry-run estimates are skipped. */
export function ratingSelections() {
  const selections = [
    { table:'wallet_fingerprint_dependencies',select:`SELECT x.* FROM wallet_fingerprint_dependencies x JOIN wallet_fingerprint_runs r ON r.id=x.run_id
      WHERE ${old('r.block')} AND NOT EXISTS(SELECT 1 FROM wallet_label_fingerprint_dependencies l WHERE l.run_id=x.run_id)`,remove:`DELETE FROM wallet_fingerprint_dependencies x USING picked p WHERE x.run_id=p.run_id AND x.block=p.block` },
    { table: 'guard_shadow_runs', select: `SELECT x.* FROM guard_shadow_runs x WHERE x.recorded_at<$1 AND EXISTS(SELECT 1 FROM guard_shadow_runs n WHERE n.coin=x.coin AND (n.block,n.recorded_at,n.id)>(x.block,x.recorded_at,x.id))`, remove: `DELETE FROM guard_shadow_runs x USING picked p WHERE x.id=p.id` },
    { table: 'coin_cards', select: `SELECT x.* FROM coin_cards x WHERE ${old('x.valid_from_block')} AND NOT EXISTS(SELECT 1 FROM coin_card_latest l WHERE l.card_id=x.id)
      AND EXISTS(SELECT 1 FROM coin_cards n WHERE n.coin=x.coin AND n.rules_version=x.rules_version AND (n.valid_from_block,n.id)>(x.valid_from_block,x.id))`, remove: `DELETE FROM coin_cards x USING picked p WHERE x.id=p.id` },
    { table: 'playbook_matches', select: `SELECT x.* FROM playbook_matches x WHERE ${old('x.valid_from_block')}
      AND EXISTS(SELECT 1 FROM playbook_matches n WHERE n.coin=x.coin AND n.valid_from_block>x.valid_from_block)`, remove: `DELETE FROM playbook_matches x USING picked p WHERE (x.coin,x.valid_from_block,x.rules_version,x.playbook_id)=(p.coin,p.valid_from_block,p.rules_version,p.playbook_id)` },
    { table: 'verdicts', select: `SELECT x.* FROM verdicts x WHERE ${old('x.valid_from_block')}
      AND EXISTS(SELECT 1 FROM verdicts n WHERE n.coin=x.coin AND n.rules_version=x.rules_version AND (n.valid_from_block,n.id)>(x.valid_from_block,x.id) AND NOT EXISTS(SELECT 1 FROM verdict_events e WHERE e.verdict_id=n.id AND e.kind='orphaned'))
      AND x.id<>(SELECT n.id FROM verdicts n WHERE n.coin=x.coin AND n.rules_version=x.rules_version AND NOT EXISTS(SELECT 1 FROM verdict_events e WHERE e.verdict_id=n.id AND e.kind='orphaned') ORDER BY n.valid_from_block DESC,n.id DESC LIMIT 1)
      AND EXISTS(SELECT 1 FROM verdicts n WHERE n.coin=x.coin AND (n.valid_from_block,n.id)<(x.valid_from_block,x.id))
      AND EXISTS(SELECT 1 FROM receipt_publications p WHERE p.id=x.id AND p.data IS NULL)
      AND NOT EXISTS(SELECT 1 FROM guard_shadow_runs s WHERE s.legacy_verdict_id=x.id)
      AND NOT EXISTS(SELECT 1 FROM verdict_events e WHERE e.verdict_id=x.id AND e.kind IN ('orphaned','corrected'))
      AND NOT EXISTS(SELECT 1 FROM unnest($2::timestamptz[]) c(since) WHERE x.id=(SELECT v.id FROM verdicts v JOIN engine_block_times b ON b.number=v.valid_from_block LEFT JOIN receipt_publications p ON p.id=v.id
        WHERE v.coin=x.coin AND v.valid_from_block>=(SELECT number FROM engine_block_times WHERE ts>=c.since ORDER BY ts,number LIMIT 1) AND b.ts>=c.since AND v.data->>'level' IN ('clear','monitor','danger') ORDER BY v.valid_from_block,p.publication_sequence ASC NULLS FIRST,v.id LIMIT 1))`, remove: `DELETE FROM verdicts x USING picked p WHERE x.id=p.id` },
  ];
  return selections;
}
const receiptSelection = `SELECT p.* FROM receipt_publications p WHERE p.recorded_at<$1 AND p.data IS NOT NULL AND p.kind='verdict'
  AND p.producer='engines' AND p.chain_id=4663
  AND EXISTS(SELECT 1 FROM receipt_publications n WHERE n.producer='engines' AND n.kind='verdict' AND n.chain_id=4663
    AND n.data IS NOT NULL AND n.data->>'coin'=p.data->>'coin' AND n.publication_sequence>p.publication_sequence LIMIT 1)
  AND NOT EXISTS(SELECT 1 FROM coin_card_latest c WHERE c.coin=decode(substring(p.data->>'coin' FROM 3),'hex') AND c.data->'verdict'->'receipt'->>'id'=p.id)`;

/** Fetch a bounded key window before testing eligibility, even if none of its rows can be removed. */
export async function ratingWindow(db: ChainDb, table: string, columns: string[], types: string[], after: unknown[] | undefined, limit: number) {
  const keys = columns.join(',');
  return (await db.sql.query<Record<string, unknown>>(`SELECT ${keys} FROM ${table}
    ${after ? `WHERE (${keys})>(${types.map((t,i)=>`$${i+1}::${t}`).join(',')})` : ''}
    ORDER BY ${keys} LIMIT ${limit}`, after)).rows;
}
function windowJoin(rows: Record<string, unknown>[], columns: string[], types: string[], values: unknown[]) {
  const keys = rows.map(row => '('+columns.map((c,i)=>{ values.push(row[c]); return `$${values.length}::${types[i]}`; }).join(',')+')').join(',');
  return `JOIN (VALUES ${keys}) candidate(${columns.join(',')}) ON ${columns.map(c=>`x.${c}=candidate.${c}`).join(' AND ')}`;
}
export async function ratingRetention(db: ChainDb, options: RetentionOptions, result: RetentionResult, nowMs: number,
  runRule: RetentionRuleRunner, cursors: Map<string, unknown[]>) {
  const cutoff = new Date(nowMs-(options.ratingDays ?? 7)*86400000), limit=Math.min(options.batchRows ?? 1000,5000);
  result.ratingRows = Object.fromEntries(['receipt_publications','receipt_items',...ratingSelections().map(r=>r.table)].map(t=>[t,0]));
  await runRule('receipt_publications', timeLeft => receiptRetention(db,options,result,cutoff,limit,timeLeft,cursors));
  for (const rule of ratingSelections()) await runRule(rule.table, async timeLeft => {
    if (options.dryRun) {
      addReport(result,await reportRows(db,rule.table,'',[]));
      if(rule.table==='verdicts')addReport(result,await reportRows(db,'verdict_events','',[]));
      return;
    }
    const columns=rule.table==='playbook_matches' ? ['coin','valid_from_block','rules_version','playbook_id'] : rule.table==='wallet_fingerprint_dependencies' ? ['run_id','block'] : ['id'];
    const types=rule.table==='playbook_matches' ? ['bytea','bigint','text','text'] : rule.table==='wallet_fingerprint_dependencies' ? ['text','bigint'] : ['text'];
    while(timeLeft()) {
      const batch=await retentionBatch(db,async tx=>{
        const window=await ratingWindow(tx,rule.table,columns,types,cursors.get(rule.table),limit);
        if(!window.length)return {moved:0,after:undefined};
        const params:unknown[]=rule.table==='verdicts' ? [cutoff,GRADE_CUTS] : [cutoff];
        const join=windowJoin(window,columns,types,params);
        const bounded=rule.select.replace(`FROM ${rule.table} x`,`FROM ${rule.table} x ${join}`);
        const rows=(await tx.sql.query<Record<string,unknown>>(`${bounded} FOR UPDATE OF x SKIP LOCKED`,params)).rows;
        const after=columns.map(c=>window.at(-1)![c]);
        if(!rows.length)return {moved:0,after};
        const values:unknown[]=[];
        const picked=`SELECT x.* FROM ${rule.table} x ${windowJoin(rows,columns,types,values)}`;
        if(rule.table==='coin_cards' || rule.table==='verdicts')await tx.sql.query(`WITH picked AS (${picked})
          INSERT INTO read_blue_chip_danger(coin) SELECT DISTINCT coin FROM picked
          WHERE ${rule.table==='coin_cards' ? "data->'verdict'->>'level'" : "data->>'level'"}='danger' ON CONFLICT DO NOTHING`,values);
        if(rule.table==='playbook_matches')await tx.sql.query(`WITH picked AS (${picked})
          INSERT INTO coin_match_lifetime SELECT coin,rules_version,playbook_id,data->>'level',min(valid_from_block) FROM picked GROUP BY coin,rules_version,playbook_id,data->>'level'
          ON CONFLICT(coin,rules_version,playbook_id,level) DO UPDATE SET first_block=least(coin_match_lifetime.first_block,excluded.first_block)`,values);
        if(rule.table==='verdicts')await tx.sql.query(`WITH picked AS (${picked}) DELETE FROM verdict_events e USING picked p WHERE e.verdict_id=p.id`,values);
        const moved=Number((await tx.sql.query<{n:string}>(`WITH picked AS (${picked}),gone AS (${rule.remove} RETURNING 1) SELECT count(*)::text AS n FROM gone`,values)).rows[0]?.n ?? 0);
        return {moved,after};
      },options.pauseMs);
      addReport(result,{table:rule.table,rows:batch.moved,estimatedBytes:0});
      result.ratingRows![rule.table]!+=batch.moved;
      if(!batch.after) {cursors.delete(rule.table);break;}
      cursors.set(rule.table,batch.after);
    }
  });
}
async function receiptRetention(db:ChainDb,options:RetentionOptions,result:RetentionResult,cutoff:Date,limit:number,timeLeft:()=>boolean,cursors:Map<string,unknown[]>) {
  if(options.dryRun) {
    for(const table of ['receipt_publications','receipt_items'])addReport(result,await reportRows(db,table,'',[]));
    return;
  }
  while(timeLeft()) {
    const n=await retentionBatch(db,async tx=>{
      const after=cursors.get('receipt_publications');
      const window=(await tx.sql.query<{id:string;recorded_at:Date}>(`SELECT id,recorded_at FROM receipt_publications
        WHERE recorded_at<$1 AND data IS NOT NULL AND kind='verdict' AND producer='engines' AND chain_id=4663
        ${after ? 'AND (recorded_at,id)>($2::timestamptz,$3::text)' : ''}
        ORDER BY recorded_at,id LIMIT ${limit}`,[cutoff,...(after ?? [])])).rows;
      if(!window.length)return {publications:0,items:0,after:undefined};
      const next=[window.at(-1)!.recorded_at,window.at(-1)!.id];
      const rows=(await tx.sql.query<Publication>(`${receiptSelection} AND p.id=ANY($2::text[]) FOR UPDATE OF p SKIP LOCKED`,[cutoff,window.map(r=>r.id)])).rows;
      if(!rows.length)return {publications:0,items:0,after:next};
      for(const row of rows)validateReceiptPublication(row);
      const ids=rows.map(r=>r.id);
      await tx.sql.query(`UPDATE receipt_publications SET summary=jsonb_build_object('coin',data->'coin','supersedes',data->'supersedes','reorgOf',data->'reorgOf',
        'recordedAt',data->'recordedAt','rulesVersion',data->'rulesVersion','revisionId',data->'revisionId','receiptId',data->'receiptId','window',data->'window',
        'level',data->'decision'->'level'),data=NULL,canonical_payload=NULL WHERE id=ANY($1::text[])`,[ids]);
      const items=Number((await tx.sql.query<{n:string}>(`WITH moved AS (UPDATE receipt_items SET data=NULL,canonical_payload=NULL WHERE id=ANY($1::text[]) AND data IS NOT NULL RETURNING 1) SELECT count(*)::text AS n FROM moved`,[ids])).rows[0]?.n ?? 0);
      return {publications:rows.length,items,after:next};
    },options.pauseMs);
    addReport(result,{table:'receipt_publications',rows:n.publications,estimatedBytes:0});
    addReport(result,{table:'receipt_items',rows:n.items,estimatedBytes:0});
    result.ratingRows!.receipt_publications!+=n.publications;result.ratingRows!.receipt_items!+=n.items;
    if(!n.after) {cursors.delete('receipt_publications');break;}
    cursors.set('receipt_publications',n.after);
  }
}
