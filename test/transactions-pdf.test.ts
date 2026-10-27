import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTransactionsPdf } from '../wealthos-source/apps/web/src/transactions-pdf';

test('PDF paginates transactions and balances only non-reversed entries', () => {
  const rows = Array.from({ length: 31 }, (_, index) => ({
    date: '2026-10-23', description: `Compra ${index} (mercado)`, category: 'Alimentação', account: 'Principal', type: 'EXPENSE' as const, amountCents: 12345,
    reversedAt: index === 0 ? '2026-10-24T00:00:00Z' : null,
  }));
  const bytes = createTransactionsPdf(rows, '2026-10', new Date('2026-10-24T12:00:00Z'));
  const pdf = new TextDecoder().decode(bytes);
  assert.match(pdf, /^%PDF-1\.4/);
  assert.match(pdf, /\/Count 2 /);
  assert.match(pdf, /Saidas: R\$ 3\.703,50/);
  assert.ok(pdf.includes('Compra 0 \\(mercado\\)'));
  assert.match(pdf, /Estornado/);
  assert.match(pdf, /Compra 30/);
  assert.match(pdf, /%%EOF\n$/);
});

test('PDF rejects transactions outside the requested month and invalid money', () => {
  const entry = { date: '2026-09-30', description: 'Conta', category: 'Casa', account: 'Principal', type: 'EXPENSE' as const, amountCents: 100 };
  assert.throws(() => createTransactionsPdf([entry], '2026-10'), /inválido/);
  assert.throws(() => createTransactionsPdf([{ ...entry, date: '2026-10-01', amountCents: Number.NaN }], '2026-10'), /inválido/);
});

import { createFinancialReportPdf } from '../wealthos-source/apps/web/src/transactions-pdf';
const readable = (bytes: Uint8Array) => new TextDecoder().decode(bytes).replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));

test('complete financial PDF includes all months, categories and accounts, excluding reversals from totals', () => {
  const base = {date:'2026-09-03',description:'Mercado do bairro',category:'Alimentação',account:'VR',type:'EXPENSE' as const,amountCents:232323};
  const rows = [base,{...base,date:'2026-10-03',description:'Salário',category:'Trabalho',account:'Principal',type:'INCOME' as const,amountCents:500000}, {...base,amountCents:500,description:'Estorno',reversedAt:'2026-09-04T12:00:00Z'}];
  const before = structuredClone(rows);
  const pdf = readable(createFinancialReportPdf(rows,new Date('2026-10-27T01:00:00Z')));
  assert.match(pdf,/R\$ 5\.000,00/); assert.match(pdf,/R\$ 2\.323,23/); assert.match(pdf,/R\$ 2\.676,77/);
  assert.match(pdf,/03\/09\/2026 a 03\/10\/2026/); assert.match(pdf,/Alimentação/); assert.match(pdf,/Conta: VR/); assert.match(pdf,/Conta: Principal/);
  assert.match(pdf,/100% dos gastos/); assert.match(pdf,/2 lançamento/); assert.match(pdf,/Lançamentos estornados/);
  assert.match(pdf,/26\/10\/2026/); assert.deepEqual(rows,before);
});

test('complete financial PDF wraps long descriptions without truncation and paginates large histories', () => {
  const rows = Array.from({length:70},(_,index)=>({date:'2026-10-01',description:`Compra ${index}: `+'Produto detalhado para escritório '.repeat(4)+'FINAL',category:'Material de escritório',account:'Reserva',type:'EXPENSE' as const,amountCents:101}));
  const pdf = readable(createFinancialReportPdf(rows));
  assert.ok(Number(pdf.match(/\/Count (\d+) /)![1])>4);
  assert.equal((pdf.match(/FINAL/g)||[]).length,70); assert.match(pdf,/Compra 69/);
  assert.match(pdf,/R\$ 70,70/); assert.doesNotMatch(pdf,/\.\.\./);
  assert.match(pdf,/continuação/); assert.match(pdf,/%%EOF\n$/);
});

test('complete financial PDF handles an empty history and validates input', () => {
  const pdf = readable(createFinancialReportPdf([]));
  assert.match(pdf,/Sem lançamentos cadastrados/); assert.match(pdf,/R\$ 0,00/); assert.match(pdf,/\/Count 1 /);
  const row = {date:'2026-10-01',description:'Conta',category:'Casa',account:'Principal',type:'EXPENSE' as const,amountCents:100};
  assert.throws(()=>createFinancialReportPdf([{...row,amountCents:NaN}]),/inválido/);
  assert.throws(()=>createFinancialReportPdf(Array(10001).fill(row)),/10.000/);
});
