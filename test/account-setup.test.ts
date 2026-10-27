import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAccountFromDraft, defaultAccountId } from '../wealthos-source/apps/web/src/account-setup';
import { balance } from '../wealthos-source/packages/finance/src/index';
const draft={name:' Conta principal ',institution:' Carteira ',color:'#3267dd',opening:'0,00'};

test('first-account setup accepts zero without adding an invented transaction',()=>{
  const account=createAccountFromDraft(draft,'account-a');
  assert.deepEqual(account,{id:'account-a',name:'Conta principal',institution:'Carteira',color:'#3267dd',openingBalanceCents:0});
  assert.equal(balance(account.openingBalanceCents,[]),0);
  assert.equal(defaultAccountId([account]),account.id);
  assert.equal(defaultAccountId([]),'');
});
test('opening balances preserve cent precision and negative balances',()=>{
  assert.equal(createAccountFromDraft({...draft,opening:'1.234,56'},'a').openingBalanceCents,123456);
  assert.equal(createAccountFromDraft({...draft,opening:'-12,01'},'a').openingBalanceCents,-1201);
  assert.equal(createAccountFromDraft({...draft,opening:'-0'},'a').openingBalanceCents,0);
});
test('incomplete accounts, malformed values and excessive balances are rejected',()=>{
  for(const patch of [{name:''},{institution:' '},{name:'a'.repeat(81)},{color:'red'},{opening:''},{opening:'1,001'},{opening:'10000000,01'}])assert.throws(()=>createAccountFromDraft({...draft,...patch},'a'));
});
test('default account stays the first persisted account after cloud serialization',()=>{
  const first=createAccountFromDraft(draft,'first'),second=createAccountFromDraft({...draft,name:'Reserva'},'second');
  assert.equal(defaultAccountId(JSON.parse(JSON.stringify([first,second]))),'first');
});
test('separate accounts retain exact balances and default selection prefers the wallet',()=>{
 const vr=createAccountFromDraft({...draft,balanceGroup:'SEPARATE',opening:'24,49'},'vr');
 const wallet=createAccountFromDraft({...draft,balanceGroup:'WALLET'},'daily');
 assert.equal(vr.balanceGroup,'SEPARATE');assert.equal(vr.openingBalanceCents,2449);
 assert.equal(defaultAccountId([vr,wallet]),'daily');assert.equal(defaultAccountId([vr]),'vr');
 assert.throws(()=>createAccountFromDraft({...draft,balanceGroup:'INVALID' as never},'bad'));
});
