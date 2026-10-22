import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
const empty={accounts:[],transactions:[],budgets:[],goals:[]};
async function fixture(){
 const db=new PGlite();
 await db.exec("create role authenticated; create role anon; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid'; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;");
 await db.query('insert into auth.users(id) values($1),($2)',[alice,bob]);
 await db.exec(await readFile(new URL('../supabase/migrations/202610220001_wealthos.sql',import.meta.url),'utf8'));
 await db.exec('set role authenticated');
 const user=async(id:string)=>{await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
 return{db,user};
}
test('Supabase RLS: users cannot read or change another user finances or portfolio',async()=>{
 const{db,user}=await fixture();try{
  await user(alice);await db.query('select public.wealthos_save_financial_state($1::jsonb,0)',[JSON.stringify(empty)]);
  await db.query('insert into public.wealthos_portfolios(user_id,holdings) values($1,$2::jsonb)',[alice,JSON.stringify([{id:crypto.randomUUID(),ticker:'PETR4',quantity:1,averagePriceCents:null}])]);
  await user(bob);assert.equal((await db.query('select * from public.wealthos_financial_state')).rows.length,0);assert.equal((await db.query('select * from public.wealthos_portfolios')).rows.length,0);
  assert.equal((await db.query('update public.wealthos_portfolios set holdings=\'[]\' where user_id=$1 returning user_id',[alice])).rows.length,0);
  await assert.rejects(db.query('insert into public.wealthos_portfolios(user_id) values($1)',[alice]));
  await user(alice);await assert.rejects(db.query('update public.wealthos_financial_state set user_id=$1 where user_id=$2',[bob,alice]));
 }finally{await db.close();}
});
test('Supabase: stale financial writes fail atomically and preserve the most recent state',async()=>{
 const{db,user}=await fixture();try{
  await user(alice);
  const first=await db.query<{result:{revision:number}}>('select public.wealthos_save_financial_state($1::jsonb,0) as result',[JSON.stringify(empty)]);assert.equal(first.rows[0].result.revision,1);
  const updated={...empty,accounts:[{id:crypto.randomUUID(),name:'Conta real',institution:'Banco',color:'#2862b9',openingBalanceCents:0}]};
  await db.query('select public.wealthos_save_financial_state($1::jsonb,1)',[JSON.stringify(updated)]);
  await assert.rejects(db.query('select public.wealthos_save_financial_state($1::jsonb,1)',[JSON.stringify(empty)]),e=>(e as {code:string}).code==='40001');
  const read=await db.query<{data:typeof updated;revision:number}>('select data,revision from public.wealthos_financial_state');assert.deepEqual(read.rows[0].data,updated);assert.equal(read.rows[0].revision,2);
  await assert.rejects(db.query('select public.wealthos_save_financial_state($1::jsonb,0)',[JSON.stringify(empty)]));
 }finally{await db.close();}
});
test('Supabase: anonymous access and unauthenticated RPC calls are denied',async()=>{
 const{db,user}=await fixture();try{
  await user('');await assert.rejects(db.query('select public.wealthos_save_financial_state($1::jsonb,0)',[JSON.stringify(empty)]));
  await db.exec('set role anon');await assert.rejects(db.query('select * from public.wealthos_financial_state'));await assert.rejects(db.query('select * from public.wealthos_portfolios'));
  await assert.rejects(db.query('select public.wealthos_save_financial_state($1::jsonb,0)',[JSON.stringify(empty)]));
 }finally{await db.close();}
});
test('Supabase: malformed document writes are rejected without replacing previous data',async()=>{
 const{db,user}=await fixture();try{
  await user(alice);await db.query('select public.wealthos_save_financial_state($1::jsonb,0)',[JSON.stringify(empty)]);
  await assert.rejects(db.query('select public.wealthos_save_financial_state($1::jsonb,1)',[JSON.stringify({...empty,transactions:'invalid'})]));
  const result=await db.query<{data:typeof empty;revision:number}>('select data,revision from public.wealthos_financial_state');assert.deepEqual(result.rows[0].data,empty);assert.equal(result.rows[0].revision,1);
 }finally{await db.close();}
});
