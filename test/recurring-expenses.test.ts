import test from 'node:test';
import assert from 'node:assert/strict';
import {dueRecurringExpenses,recurringDate,validateRecurringExpense} from '../wealthos-source/packages/finance/src/index.ts';
import {validateFinancialState} from '../lib/financial-state.ts';

const accountId='10000000-0000-4000-8000-000000000001';
const ruleId='20000000-0000-4000-8000-000000000001';
const rule={id:ruleId,accountId,description:'Aluguel',category:'Moradia',amountCents:123456,day:31,startMonth:'2026-01',active:true};
const account={id:accountId,name:'Conta',institution:'Banco',color:'#8052cb',openingBalanceCents:100000};
const base={accounts:[account],transactions:[],budgets:[],goals:[]};

test('vencimento mensal preserva centavos e limita dia ao último dia inclusive ano bissexto',()=>{
  assert.deepEqual(validateRecurringExpense(rule),rule);
  assert.equal(recurringDate(rule,'2026-02'),'2026-02-28');
  assert.equal(recurringDate(rule,'2028-02'),'2028-02-29');
  assert.equal(recurringDate(rule,'2026-03'),'2026-03-31');
});
test('só oferece despesa ativa e ainda não lançada naquele mês, inclusive se estornada',()=>{
  assert.deepEqual(dueRecurringExpenses([rule],[],'2026-02'),[rule]);
  const tx={id:'30000000-0000-4000-8000-000000000001',accountId,amountCents:123456,type:'EXPENSE' as const,date:'2026-02-28',recurringRuleId:ruleId,recurringMonth:'2026-02',reversedAt:'2026-03-01T00:00:00.000Z'};
  assert.deepEqual(dueRecurringExpenses([rule],[tx],'2026-02'),[]);
  assert.deepEqual(dueRecurringExpenses([rule],[tx],'2026-03'),[rule]);
  assert.deepEqual(dueRecurringExpenses([{...rule,active:false}],[],'2026-02'),[]);
  assert.deepEqual(dueRecurringExpenses([rule],[],'2025-12'),[]);
});
test('estado antigo continua válido; recorrências e lançamentos do mês persistem sem duplicidade',()=>{
  assert.deepEqual(validateFinancialState(base),base);
  const tx={id:'30000000-0000-4000-8000-000000000001',accountId,amountCents:123456,type:'EXPENSE',date:'2026-02-28',description:'Aluguel',category:'Moradia',idempotencyKey:'40000000-0000-4000-8000-000000000001',recurringRuleId:ruleId,recurringMonth:'2026-02'};
  assert.deepEqual(validateFinancialState({...base,recurringExpenses:[rule],transactions:[tx]}).recurringExpenses,[rule]);
  assert.throws(()=>validateFinancialState({...base,recurringExpenses:[rule],transactions:[tx,{...tx,id:'30000000-0000-4000-8000-000000000002',idempotencyKey:'40000000-0000-4000-8000-000000000002'}]}),/duplicad/i);
  assert.throws(()=>validateFinancialState({...base,recurringExpenses:[{...rule,accountId:'50000000-0000-4000-8000-000000000001'}]}),/conta inexistente/);
  assert.throws(()=>validateFinancialState({...base,recurringExpenses:[{...rule,amountCents:0}]}));
});
