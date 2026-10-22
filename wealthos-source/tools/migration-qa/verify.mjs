import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const proof=[];
try {
 await db.exec(readFileSync(new URL('../../apps/api/prisma/migrations/202610220001_initial/migration.sql', import.meta.url),'utf8'));
 proof.push('Migração inicial SQL aplicada em PostgreSQL WASM PGlite (não substitui Prisma/PostgreSQL nativo).');
 const wa='00000000-0000-4000-8000-000000000001', wb='00000000-0000-4000-8000-000000000002';
 const aa='00000000-0000-4000-8000-000000000003', ab='00000000-0000-4000-8000-000000000004';
 await db.query('INSERT INTO "Workspace" (id,name) VALUES ($1,$2),($3,$4)',[wa,'A',wb,'B']);
 await db.query('INSERT INTO "Account" (id,"workspaceId",name,institution) VALUES ($1,$2,$3,$4),($5,$6,$7,$8)',[aa,wa,'A','Teste',ab,wb,'B','Teste']);
 let n=10;
 const insert=(workspaceId,accountId,amountCents,key)=>db.query('INSERT INTO "Transaction" (id,"workspaceId","accountId",description,"amountCents",type,category,date,"idempotencyKey") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[`00000000-0000-4000-8000-${String(n++).padStart(12,'0')}`,workspaceId,accountId,'Teste',amountCents,'EXPENSE','Outros','2026-10-22',key]);
 await insert(wa,aa,101,'repeat-key');
 await assert.rejects(insert(wa,aa,101,'repeat-key'),error=>error.code==='23505'); proof.push('UNIQUE de idempotência rejeita chave duplicada no mesmo workspace.');
 await insert(wb,ab,101,'repeat-key'); proof.push('A mesma chave pode existir em workspaces diferentes.');
 await assert.rejects(insert(wb,aa,101,'cross-workspace'),error=>error.code==='23503'); proof.push('FK composta rejeita conta de outro workspace.');
 await assert.rejects(insert(wa,aa,0,'zero'),error=>error.code==='23514');
 await assert.rejects(insert(wa,aa,-1,'negative'),error=>error.code==='23514');
 await assert.rejects(insert(wa,aa,1000000001,'limit'),error=>error.code==='23514'); proof.push('CHECK rejeita valores zero, negativos e acima do limite.');
 const res=await db.query('SELECT count(*)::int AS count FROM "Transaction"'); assert.equal(res.rows[0].count,2);
 console.log(proof.join('\n'));
 writeFileSync(new URL('../../docs/MIGRATION-SQL-QA.json', import.meta.url),JSON.stringify({date:'2026-10-22',engine:'PGlite PostgreSQL WASM',nativePrismaIntegration:false,checks:proof},null,2));
} finally { await db.close(); }
