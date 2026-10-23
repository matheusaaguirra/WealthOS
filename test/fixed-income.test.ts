import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFixedIncomeInvestment, fixedIncomeFromDraft, summarizeFixedIncome, type FixedIncomeDraft } from '../wealthos-source/packages/finance/src/fixed-income';
import { validateFinancialState, emptyFinancialState } from '../lib/financial-state';
import { balance } from '../wealthos-source/packages/finance/src/index';
const draft=():FixedIncomeDraft=>({id:'',type:'CDB',name:'Reserva',institution:'Instituição',invested:'1.234,56',currentValue:'',investedOn:'2026-10-23',maturityOn:'2027-10-23',indexer:'CDI',rate:'100',valueUpdatedOn:'2026-10-23'});
const row=()=>fixedIncomeFromDraft(draft(),crypto.randomUUID());
test('fixed income stores cents and stated rate without fabricating a balance or yield',()=>{
 const item=row();assert.equal(item.investedCents,123456);assert.equal(item.rateBasisPoints,10000);assert.equal(item.currentValueCents,null);assert.equal(item.valueUpdatedOn,null);
 assert.deepEqual(summarizeFixedIncome([item]),{investedCents:123456,currentValueCents:null,valuedCount:0,missingCount:1});
 const zero=fixedIncomeFromDraft({...draft(),currentValue:'0,00'},crypto.randomUUID());assert.equal(zero.currentValueCents,0);assert.equal(zero.valueUpdatedOn,'2026-10-23');
 assert.equal(summarizeFixedIncome([item,zero]).currentValueCents,0);
});
test('fixed income rejects malformed values, fictional asset type CDI, unknown data, inconsistent dates and duplicate IDs',()=>{
 const item=row();
 for(const change of [{type:'CDI'},{investedCents:0},{investedCents:1.1},{currentValueCents:-1},{currentValueCents:2,valueUpdatedOn:null},{currentValueCents:null,valueUpdatedOn:'2026-10-23'},{indexer:'SELIC_FUTURA'},{rateBasisPoints:0.1},{rateBasisPoints:100001},{indexer:null,rateBasisPoints:1},{maturityOn:'2026-02-30'},{maturityOn:'2025-01-01'},{valueUpdatedOn:'2025-01-01',currentValueCents:1},{user_id:crypto.randomUUID()}])assert.throws(()=>validateFixedIncomeInvestment({...item,...change}));
 for(const rate of ['1e2','12.5','10%','12,555','1001'])assert.throws(()=>fixedIncomeFromDraft({...draft(),rate},crypto.randomUUID()));
 for(const invested of ['abc','1e3','-10','1,234'])assert.throws(()=>fixedIncomeFromDraft({...draft(),invested},crypto.randomUUID()));
 assert.throws(()=>validateFinancialState({...emptyFinancialState(),investments:[item,item]}));
 assert.throws(()=>validateFinancialState({...emptyFinancialState(),investments:Array.from({length:201},row)}));
});
test('legacy state remains compatible and investments survive JSON persistence without altering account balance',()=>{
 const legacy=emptyFinancialState();assert.deepEqual(validateFinancialState(legacy),legacy);
 const account={id:crypto.randomUUID(),name:'Conta',institution:'Banco',color:'#2862b9',openingBalanceCents:10000};
 const state=validateFinancialState({...legacy,accounts:[account],investments:[row()]});
 const reloaded=validateFinancialState(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(reloaded.investments,state.investments);assert.equal(balance(account.openingBalanceCents,reloaded.transactions),10000);
 assert.equal(reloaded.transactions.length,0);
});
