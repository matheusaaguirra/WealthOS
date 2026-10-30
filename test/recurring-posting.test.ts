import test from 'node:test';
import assert from 'node:assert/strict';
import {appendCurrentRecurring,postCurrentRecurring,type FinancialStore} from '../lib/recurring-posting';
import {AuthError} from '../lib/auth-core';
import {validateFinancialState,type FinancialState} from '../lib/financial-state';
import {balance,recurringToday,dueRecurringThroughDate} from '../wealthos-source/packages/finance/src/index';
const account={id:crypto.randomUUID(),name:'Principal',institution:'Banco',color:'#326da0',openingBalanceCents:100000,balanceGroup:'WALLET' as const};
const other={...account,id:crypto.randomUUID(),name:'VR',openingBalanceCents:50000,balanceGroup:'SEPARATE' as const};
const rule={id:crypto.randomUUID(),accountId:account.id,description:'Assinatura',category:'Outros',amountCents:3701,day:30,startMonth:'2026-10',active:true};
const base=():FinancialState=>validateFinancialState({accounts:[account,other],transactions:[],recurringExpenses:[rule],budgets:[],goals:[]});

test('automatic posting waits for due date and preserves cent values in the linked account',()=>{
 const before=appendCurrentRecurring(base(),'2026-10-29');assert.equal(before.recurringPosted,0);
 const posted=appendCurrentRecurring(base(),'2026-10-30');assert.equal(posted.recurringPosted,1);
 assert.equal(posted.state.transactions[0].date,'2026-10-30');
 assert.equal(balance(account.openingBalanceCents,posted.state.transactions),96299);
 assert.equal(base().transactions.length,0);
 const separate=base();separate.recurringExpenses![0]={...rule,accountId:other.id};
 const result=appendCurrentRecurring(separate,'2026-10-30').state;
 assert.equal(balance(account.openingBalanceCents,result.transactions.filter(t=>t.accountId===account.id)),100000);
 assert.equal(balance(other.openingBalanceCents,result.transactions.filter(t=>t.accountId===other.id)),46299);
});
test('current-month rules respect pause, start/end months and month-end including leap years',()=>{
 const state=base();state.recurringExpenses=[{...rule,active:false},{...rule,id:crypto.randomUUID(),startMonth:'2026-11'},{...rule,id:crypto.randomUUID(),endMonth:'2026-09',startMonth:'2026-01'}];
 assert.equal(appendCurrentRecurring(state,'2026-10-30').recurringPosted,0);
 const january=base();january.recurringExpenses![0]={...rule,startMonth:'2026-01',day:31};
 assert.equal(appendCurrentRecurring(january,'2026-02-27').recurringPosted,0);
 assert.equal(appendCurrentRecurring(january,'2026-02-28').state.transactions[0].date,'2026-02-28');
 assert.equal(appendCurrentRecurring(january,'2028-02-28').recurringPosted,0);
 assert.equal(appendCurrentRecurring(january,'2028-02-29').state.transactions[0].date,'2028-02-29');
 assert.equal(appendCurrentRecurring(january,'2026-10-30').recurringPosted,0);
 assert.equal(appendCurrentRecurring(january,'2026-10-31').state.transactions.length,1); // No historical backfill.
});
test('manual postings and reversals are never charged again; next month gets one new entry',()=>{
 const posted=appendCurrentRecurring(base(),'2026-10-30');
 assert.equal(appendCurrentRecurring(posted.state,'2026-10-31').recurringPosted,0);
 const reversed=structuredClone(posted.state);reversed.transactions[0].reversedAt='2026-10-30T18:00:00Z';
 const result=appendCurrentRecurring(reversed,'2026-10-30');assert.equal(result.recurringPosted,0);
 assert.equal(balance(account.openingBalanceCents,result.state.transactions),100000);
 const next=appendCurrentRecurring(result.state,'2026-11-30');assert.equal(next.recurringPosted,1);
 assert.equal(balance(account.openingBalanceCents,next.state.transactions),96299);
 assert.equal(appendCurrentRecurring(next.state,'2026-11-30').recurringPosted,0);
});
test('business dates agree across UTC midnight and historic selection cannot post future entries',()=>{
 assert.equal(recurringToday(new Date('2026-10-30T02:59:59Z')),'2026-10-29');
 assert.equal(recurringToday(new Date('2026-10-30T03:00:00Z')),'2026-10-30');
 assert.equal(dueRecurringThroughDate([rule],[],'2026-11','2026-10-30').length,0);
 assert.equal(dueRecurringThroughDate([rule],[],'2026-10','2026-11-01').length,1);
});
test('concurrent automatic updates re-read instead of overwriting another financial edit',async()=>{
 let state=base(),revision=1,attempts=0;
 const store:FinancialStore={read:async()=>({state:structuredClone(state),revision}),save:async(next,expected)=>{
  attempts++;
  if(attempts===1){state={...state,goals:[{id:crypto.randomUUID(),name:'Meta criada em outra aba',targetCents:50000,savedCents:0,icon:'goals'}]};revision++;throw new AuthError(409,'Conflict');}
  assert.equal(expected,revision);state=next;revision++;return {state,revision};
 }};
 const result=await postCurrentRecurring(store,'2026-10-30');assert.equal(attempts,2);assert.equal(result.recurringPosted,1);assert.equal(result.state.goals.length,1);
 assert.equal((await postCurrentRecurring(store,'2026-10-30')).recurringPosted,0);assert.equal(attempts,2);
});
test('save failures do not publish a deduction and conflict retries are bounded',async()=>{
 const original=base();let attempts=0;
 await assert.rejects(postCurrentRecurring({read:async()=>({state:original,revision:1}),save:async()=>{throw new AuthError(503,'Unavailable');}},'2026-10-30'),(e:unknown)=>e instanceof AuthError&&e.status===503);
 assert.equal(original.transactions.length,0);
 await assert.rejects(postCurrentRecurring({read:async()=>({state:original,revision:1}),save:async()=>{attempts++;throw new AuthError(409,'Conflict');}},'2026-10-30'));
 assert.equal(attempts,3);
});
