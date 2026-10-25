import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStatementLines, statementFingerprint } from '../wealthos-source/apps/web/src/statement-parser';

test('extrato: valores assinados e indicadores D/C preservam centavos e tipo', () => {
  const result = parseStatementLines([
    '12/10/2026 SUPERMERCADO CENTRAL -2.323,23',
    '13/10/2026 SALARIO EMPRESA 3.000,00 C',
    '14/10/2026 PIX ENVIADO R$ -123,45',
  ]);
  assert.deepEqual(result.rows.map(row=>[row.date,row.amountCents,row.type,row.category]),[
    ['2026-10-12',232323,'EXPENSE','Alimentação'],
    ['2026-10-13',300000,'INCOME','Salário'],
    ['2026-10-14',12345,'EXPENSE','Outros'],
  ]);
  assert.equal(result.skipped,0);
});

test('extrato: dados ambíguos e datas impossíveis não são importados', () => {
  const result=parseStatementLines([
    '31/02/2026 COMPRA -50,00',
    '15/10/2026 COMPRA 50,00',
    '15/10/2026 COMPRA -50,00 1.234,56',
    '15/10/2026 COMPRA -50,00',
    '15/10/2026 COMPRA -50,00',
  ]);
  assert.equal(result.rows.length,1);
  assert.equal(result.skipped,3);
  assert.equal(result.duplicates,1);
  assert.equal(statementFingerprint(result.rows[0]),'2026-10-15|EXPENSE|5000|COMPRA');
});
