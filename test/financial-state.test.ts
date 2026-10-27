import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuthError } from '../lib/auth-core';
import { emptyFinancialState, validateFinancialState, readFinancialRequest } from '../lib/financial-state';
import { balance } from '../wealthos-source/packages/finance/src/index';
const account={id:crypto.randomUUID(),name:'Minha conta',institution:'Banco',color:'#2862b9',openingBalanceCents:0};
const transaction={id:crypto.randomUUID(),accountId:account.id,type:'EXPENSE' as const,date:'2026-10-22',description:'Uma despesa',category:'Outros',idempotencyKey:crypto.randomUUID(),amountCents:101};
function state(){return{accounts:[account],transactions:[transaction],budgets:[],goals:[]};}
test('new financial state is empty and independent for every user',()=>{
 const a=emptyFinancialState(),b=emptyFinancialState();a.accounts.push(account);assert.deepEqual(b,{accounts:[],transactions:[],budgets:[],goals:[]});
});
test('zero opening balance and exact cent balances survive validation and reversal',()=>{
 const saved=validateFinancialState(state());assert.equal(saved.accounts[0].openingBalanceCents,0);assert.equal(balance(0,saved.transactions),-101);
 saved.transactions[0].reversedAt=new Date().toISOString();assert.equal(balance(0,validateFinancialState(saved).transactions),0);
});
test('duplicate transactions and duplicate idempotency keys are rejected',()=>{
 const data=state();data.transactions.push({...transaction});assert.throws(()=>validateFinancialState(data));
 data.transactions[1]={...transaction,id:crypto.randomUUID()};assert.throws(()=>validateFinancialState(data));
});
test('transaction money must be a positive integer in cents',()=>{
 for(const amountCents of [0,-1,1.01,NaN,1e9+1])assert.throws(()=>validateFinancialState({...state(),transactions:[{...transaction,amountCents}]}));
});
test('cross-account references, unknown user IDs and invalid dates are rejected',()=>{
 assert.throws(()=>validateFinancialState({...state(),user_id:crypto.randomUUID()}));
 assert.throws(()=>validateFinancialState({...state(),transactions:[{...transaction,accountId:crypto.randomUUID()}]}));
 assert.throws(()=>validateFinancialState({...state(),transactions:[{...transaction,date:'2026-02-30'}]}));
});
test('budgets cannot repeat a category; savings cannot exceed a goal',()=>{
 const budget={id:crypto.randomUUID(),category:'Outros',limitCents:1};
 assert.throws(()=>validateFinancialState({...state(),budgets:[budget,{...budget,id:crypto.randomUUID()}]}));
 assert.throws(()=>validateFinancialState({...state(),goals:[{id:crypto.randomUUID(),name:'Meta',icon:'⚑',targetCents:100,savedCents:101}]}));
});
test('financial writes enforce same origin, bounded payload and an explicit revision',async()=>{
 const request=(body:unknown,origin='https://wealthos.example')=>new Request('https://wealthos.example/api/finance',{method:'PUT',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
 const valid=await readFinancialRequest(request({state:state(),revision:0}));assert.equal(valid.revision,0);
 await assert.rejects(readFinancialRequest(request({state:state(),revision:0},'https://attacker.example')),e=>e instanceof AuthError&&e.status===403);
 await assert.rejects(readFinancialRequest(request({state:state()})));
 await assert.rejects(readFinancialRequest(request({state:state(),revision:0,extra:'x'.repeat(270000)})),e=>e instanceof AuthError&&e.status===413);
});
test('wallet classification survives validation and legacy accounts are preserved',()=>{
 const data=state();const before=JSON.stringify(data);
 const separate={...account,id:crypto.randomUUID(),name:'VR',balanceGroup:'SEPARATE',openingBalanceCents:2449};
 const saved=validateFinancialState({...data,accounts:[account,separate]});
 assert.equal(saved.accounts[1].balanceGroup,'SEPARATE');assert.equal(saved.accounts[1].openingBalanceCents,2449);
 assert.equal(saved.accounts[0].balanceGroup,undefined);assert.equal(JSON.stringify(data),before);
 for(const balanceGroup of ['INVALID',true,null,42])assert.throws(()=>validateFinancialState({...data,accounts:[{...account,balanceGroup}]}));
});
