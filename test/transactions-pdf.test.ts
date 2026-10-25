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
