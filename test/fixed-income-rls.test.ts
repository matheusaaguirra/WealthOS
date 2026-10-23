import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {validateFinancialState} from '../lib/financial-state';

const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
const investment={
 id:'33333333-3333-4333-8333-333333333333',type:'LCA',name:'Reserva LCA',institution:'Instituição teste',
 investedCents:123456,currentValueCents:123999,investedOn:'2026-10-23',maturityOn:'2027-10-23',
 indexer:'CDI',rateBasisPoints:9500,valueUpdatedOn:'2026-10-23',
};
const state={accounts:[],transactions:[],budgets:[],goals:[],investments:[investment]};

test('fixed-income documents survive the real RPC shape, revision conflicts and per-user RLS',async()=>{
 const db=new PGlite();
 try{
  await db.exec("create role authenticated; create role anon; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid'; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;");
  await db.query('insert into auth.users(id) values($1),($2)',[alice,bob]);
  await db.exec(await readFile(new URL('../supabase/migrations/202610220001_wealthos.sql',import.meta.url),'utf8'));
  await db.exec('set role authenticated');
  const user=async(id:string)=>{await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
  await user(alice);
  const first=await db.query<{result:{data:unknown;revision:number}}>('select public.wealthos_save_financial_state($1::jsonb,0) as result',[JSON.stringify(validateFinancialState(state))]);
  assert.equal(first.rows[0].result.revision,1);
  assert.deepEqual(first.rows[0].result.data,state);
  const update={...state,investments:[{...investment,currentValueCents:124001}]};
  await db.query('select public.wealthos_save_financial_state($1::jsonb,1)',[JSON.stringify(validateFinancialState(update))]);
  await assert.rejects(db.query('select public.wealthos_save_financial_state($1::jsonb,1)',[JSON.stringify(state)]),error=>(error as {code:string}).code==='40001');
  const reloaded=await db.query<{data:unknown;revision:number}>('select data,revision from public.wealthos_financial_state');
  assert.equal(reloaded.rows[0].revision,2);
  assert.deepEqual(validateFinancialState(reloaded.rows[0].data),update);
  await user(bob);
  assert.equal((await db.query('select data from public.wealthos_financial_state')).rows.length,0);
  assert.equal((await db.query('update public.wealthos_financial_state set data=$1::jsonb where user_id=$2 returning user_id',[JSON.stringify(state),alice])).rows.length,0);
  await assert.rejects(db.query('insert into public.wealthos_financial_state(user_id,data) values($1,$2::jsonb)',[alice,JSON.stringify(state)]));
  await user(alice);
  assert.deepEqual((await db.query<{data:unknown}>('select data from public.wealthos_financial_state')).rows[0].data,update);
  await db.exec('set role anon');
  await assert.rejects(db.query('select data from public.wealthos_financial_state'));
  await assert.rejects(db.query('select public.wealthos_save_financial_state($1::jsonb,0)',[JSON.stringify(state)]));
 }finally{await db.close();}
});
