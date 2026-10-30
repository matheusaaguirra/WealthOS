import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {AuthError} from '../lib/auth-core';
import {emptyFinancialState,validateFinancialState,type FinancialState} from '../lib/financial-state';
import {postCurrentRecurring,type FinancialStore} from '../lib/recurring-posting';
import {balance} from '../wealthos-source/packages/finance/src/index';
test('Postgres: concurrent due-date posting persists once, keeps balances scoped, preserves reversals and RLS',async()=>{
 const db=new PGlite();
 try{
  await db.exec("create role authenticated; create role anon; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid'; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;");
  const alice=crypto.randomUUID(),bob=crypto.randomUUID();await db.query('insert into auth.users(id) values($1),($2)',[alice,bob]);
  await db.exec(await readFile(new URL('../supabase/migrations/202610220001_wealthos.sql',import.meta.url),'utf8'));
  await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[alice]);
  const wallet=crypto.randomUUID(),vr=crypto.randomUUID();
  const state=validateFinancialState({accounts:[{id:wallet,name:'Principal',institution:'Banco',color:'#326da0',openingBalanceCents:100000},{id:vr,name:'VR',institution:'Benefício',color:'#326da0',openingBalanceCents:50000,balanceGroup:'SEPARATE'}],transactions:[],recurringExpenses:[{id:crypto.randomUUID(),accountId:wallet,description:'Conta mensal',category:'Outros',amountCents:1001,day:30,startMonth:'2026-10',active:true},{id:crypto.randomUUID(),accountId:vr,description:'Refeição',category:'Alimentação',amountCents:202,day:30,startMonth:'2026-10',active:true}],budgets:[],goals:[]});
  await db.query('select public.wealthos_save_financial_state($1::jsonb,0)',[JSON.stringify(state)]);
  const store:FinancialStore={
   async read(){const r=await db.query<{data:FinancialState;revision:number}>('select data,revision from public.wealthos_financial_state');return r.rows.length?{state:validateFinancialState(r.rows[0].data),revision:r.rows[0].revision}:{state:emptyFinancialState(),revision:0};},
   async save(next,revision){try{const r=await db.query<{result:{data:FinancialState;revision:number}}>('select public.wealthos_save_financial_state($1::jsonb,$2) as result',[JSON.stringify(next),revision]);return {state:validateFinancialState(r.rows[0].result.data),revision:r.rows[0].result.revision};}catch(error){if((error as {code:string}).code==='40001')throw new AuthError(409,'Concurrent update');throw error;}},
  };
  assert.equal((await postCurrentRecurring(store,'2026-10-29')).revision,1);
  const results=await Promise.all([postCurrentRecurring(store,'2026-10-30'),postCurrentRecurring(store,'2026-10-30')]);
  assert.equal(results.reduce((total,result)=>total+result.recurringPosted,0),2);
  const saved=await store.read();assert.equal(saved.revision,2);assert.equal(saved.state.transactions.length,2);
  assert.equal(balance(100000,saved.state.transactions.filter(t=>t.accountId===wallet)),98999);
  assert.equal(balance(50000,saved.state.transactions.filter(t=>t.accountId===vr)),49798);
  saved.state.transactions.find(t=>t.accountId===wallet)!.reversedAt='2026-10-30T18:00:00Z';
  await store.save(saved.state,saved.revision);
  const reversed=await postCurrentRecurring(store,'2026-10-30');assert.equal(reversed.recurringPosted,0);assert.equal(reversed.revision,3);
  assert.equal(balance(100000,reversed.state.transactions.filter(t=>t.accountId===wallet)),100000);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[bob]);
  assert.deepEqual((await postCurrentRecurring(store,'2026-10-30')).state,emptyFinancialState());
  assert.equal((await db.query('select * from public.wealthos_financial_state')).rows.length,0);
 }finally{await db.close();}
});
