import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMoneyToCents, validateAmount, balance, summarize,
  splitInstallments, assertNoDuplicate, validateDate,
  type Entry,
} from '../src/index';

const entry = (overrides: Partial<Entry> = {}): Entry => ({
  id: 'entry-1', accountId: 'account-1', amountCents: 1000,
  type: 'INCOME', date: '2026-10-22', ...overrides,
});

describe('conversão monetária sem perda de centavos', () => {
  for (const [input, cents] of [
    ['0,01', 1], ['0,10', 10], ['1', 100], ['1,5', 150],
    ['1,50', 150], ['1234,56', 123456], ['1.234,56', 123456],
    ['10.000.000,00', 1000000000],
  ] as const) {
    it(`converte ${input} em ${cents} centavos`, () => {
      assert.equal(parseMoneyToCents(input), cents);
    });
  }

  for (const value of ['', 'abc', '1,001', '1,999', '-1,00', '1e3', 'Infinity', 'NaN', '10.000.000,01']) {
    it(`rejeita entrada monetária inválida ${JSON.stringify(value)}`, () => {
      assert.throws(() => parseMoneyToCents(value));
    });
  }

  it('não arredonda silenciosamente valores com mais de duas casas', () => {
    assert.throws(() => parseMoneyToCents('0,005'));
    assert.throws(() => parseMoneyToCents('123,456'));
  });
});

describe('invariantes do valor em centavos', () => {
  it('aceita os limites positivos', () => {
    assert.doesNotThrow(() => validateAmount(1));
    assert.doesNotThrow(() => validateAmount(1000000000));
  });
  for (const value of [0, -1, 0.1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, 1000000001]) {
    it(`rejeita centavos inválidos ${String(value)}`, () => {
      assert.throws(() => validateAmount(value));
    });
  }
});

describe('saldo e estorno', () => {
  it('mantém saldo inicial na ausência de lançamentos', () => {
    assert.equal(balance(12345, []), 12345);
    assert.equal(balance(-1000, []), -1000);
  });
  it('adiciona receitas e subtrai despesas, com exatidão em centavos', () => {
    assert.equal(balance(10000, [entry({ amountCents: 1 }), entry({ id: 'e2', type: 'EXPENSE', amountCents: 999 })]), 9002);
  });
  it('permite que as despesas deixem a conta negativa', () => {
    assert.equal(balance(0, [entry({ type: 'EXPENSE', amountCents: 3500 })]), -3500);
  });
  it('exclui receitas e despesas estornadas sem modificar os dados originais', () => {
    const entries = [
      entry({ amountCents: 6000 }),
      entry({ id: 'e2', type: 'EXPENSE', amountCents: 500, reversedAt: null }),
      entry({ id: 'e3', amountCents: 99999, reversedAt: '2026-10-22T12:00:00.000Z' }),
      entry({ id: 'e4', type: 'EXPENSE', amountCents: 88888, reversedAt: '2026-10-22T12:00:00.000Z' }),
    ];
    const before = structuredClone(entries);
    assert.equal(balance(1000, entries), 6500);
    assert.deepEqual(entries, before);
  });
});

describe('resumo mensal', () => {
  it('soma apenas lançamentos ativos no mês escolhido', () => {
    const entries = [
      entry({ amountCents: 750001, date: '2026-10-01' }),
      entry({ id: 'e2', type: 'EXPENSE', amountCents: 280099, date: '2026-10-31' }),
      entry({ id: 'e3', amountCents: 999999, date: '2026-09-30' }),
      entry({ id: 'e4', type: 'EXPENSE', amountCents: 999999, date: '2026-11-01' }),
      entry({ id: 'e5', amountCents: 12345, reversedAt: '2026-10-22T12:00:00.000Z' }),
    ];
    assert.deepEqual(summarize(entries, '2026-10'), {
      incomeCents: 750001, expenseCents: 280099, balanceCents: 469902,
    });
  });
  it('retorna totais zero para um mês vazio', () => {
    assert.deepEqual(summarize([], '2026-10'), { incomeCents: 0, expenseCents: 0, balanceCents: 0 });
  });
  it('separa o mesmo mês de anos distintos', () => {
    assert.deepEqual(summarize([entry({ date: '2025-10-22' })], '2026-10'), {
      incomeCents: 0, expenseCents: 0, balanceCents: 0,
    });
  });
});

describe('parcelamento conserva valor total', () => {
  it('distribui o resto nas primeiras parcelas', () => {
    assert.deepEqual(splitInstallments(10000, 3), [3334, 3333, 3333]);
    assert.deepEqual(splitInstallments(10001, 3), [3334, 3334, 3333]);
  });
  it('mantém uma parcela única sem alterações', () => {
    assert.deepEqual(splitInstallments(12345, 1), [12345]);
  });
  it('produz parcelas inteiras cuja soma é exata em vários cenários', () => {
    for (const total of [1, 7, 99, 100, 12345, 999999, 1000000000]) {
      for (const count of [1, 2, 3, 7, 12].filter(n => n <= total)) {
        const parts = splitInstallments(total, count);
        assert.equal(parts.length, count);
        assert.equal(parts.reduce((sum, value) => sum + value, 0), total);
        assert.ok(parts.every(Number.isSafeInteger));
        assert.ok(Math.max(...parts) - Math.min(...parts) <= 1);
      }
    }
  });
  for (const count of [0, -1, 1.5, NaN, Infinity]) {
    it(`rejeita quantidade de parcelas inválida ${String(count)}`, () => {
      assert.throws(() => splitInstallments(10000, count));
    });
  }
  it('rejeita total negativo, fracionário e acima do limite', () => {
    for (const total of [-1, 1.5, 1000000001]) assert.throws(() => splitInstallments(total, 2));
  });
});

describe('duplicidade de lançamento', () => {
  it('aceita coleção vazia e IDs distintos, mesmo com dados iguais', () => {
    assert.doesNotThrow(() => assertNoDuplicate([]));
    assert.doesNotThrow(() => assertNoDuplicate([entry(), entry({ id: 'entry-2' })]));
  });
  it('rejeita o mesmo ID mesmo que o valor, a conta ou o estorno sejam diferentes', () => {
    assert.throws(() => assertNoDuplicate([entry(), entry({ accountId: 'account-2', amountCents: 1 })]));
    assert.throws(() => assertNoDuplicate([entry(), entry({ reversedAt: '2026-10-22T12:00:00.000Z' })]));
  });
});

describe('datas civis brasileiras sem normalização silenciosa', () => {
  for (const date of ['2000-01-01', '2000-02-29', '2024-02-29', '2026-10-22', '2100-12-31']) {
    it(`aceita data real ${date}`, () => assert.doesNotThrow(() => validateDate(date)));
  }
  for (const date of ['1999-12-31', '2101-01-01', '2026-02-29', '2100-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-10-00', '2026-10-32', '2026-1-1', '22/10/2026', '2026-10-22T00:00:00Z', '']) {
    it(`rejeita data inválida ${JSON.stringify(date)}`, () => assert.throws(() => validateDate(date)));
  }
});
