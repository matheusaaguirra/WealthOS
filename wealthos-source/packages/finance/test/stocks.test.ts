import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stockPosition, sectorPerformance, validateHolding, type Holding, type StockQuote } from '../src/index';
const holding: Holding = { id: 'one', ticker: 'PETR4', quantity: 7, averagePriceCents: 1501 };
const quote: StockQuote = { ticker: 'PETR4', name: 'Empresa exemplo', sector: 'Energia', priceCents: 1603, changes: { day: 2, month: -5, year: 10 } };
describe('posições de ações — dinheiro exato e dados desconhecidos', () => {
  it('não estima custo nem lucro quando preço de compra não foi informado', () => {
    assert.deepEqual(stockPosition({ ...holding, averagePriceCents: null }, quote), { marketValueCents: 11221, costBasisCents: null, profitCents: null, profitPercent: null });
  });
  it('não calcula patrimônio nem lucro sem cotação e preserva custo conhecido', () => {
    assert.deepEqual(stockPosition(holding), { marketValueCents: null, costBasisCents: 10507, profitCents: null, profitPercent: null });
    assert.equal(stockPosition(holding, { ...quote, priceCents: null }).profitPercent, null);
  });
  it('calcula centavos e retorno sobre custo, sem confundir variação do pregão', () => {
    const result = stockPosition(holding, quote);
    assert.equal(result.marketValueCents, 11221);
    assert.equal(result.profitCents, 714);
    assert.equal(result.profitPercent, 714 / 10507 * 100);
    assert.notEqual(result.profitPercent, quote.changes.day);
  });
  it('preserva prejuízo, lucro zero real e quantidades inteiras de posições fracionárias', () => {
    assert.equal(stockPosition({ ...holding, quantity: 1 }, { ...quote, priceCents: 1 }).profitCents, -1500);
    assert.equal(stockPosition(holding, { ...quote, priceCents: 1501 }).profitPercent, 0);
    assert.equal(stockPosition({ ...holding, ticker: 'PETR4F', quantity: 1 }, { ...quote, ticker: 'PETR4F' }).marketValueCents, 1603);
    assert.equal(stockPosition({ ...holding, ticker: 'B3SA3', quantity: 1 }, { ...quote, ticker: 'B3SA3' }).marketValueCents, 1603);
  });
  it('rejeita quantidades inválidas e valores sem precisão em centavos', () => {
    for (const quantity of [0, -1, 1.5, NaN, Infinity, 1_000_001]) assert.throws(() => validateHolding({ ...holding, quantity }));
    for (const averagePriceCents of [0, -1, 1.1, NaN, Infinity, 1_000_000_001]) assert.throws(() => stockPosition({ ...holding, averagePriceCents }, quote));
    assert.throws(() => stockPosition(holding, { ...quote, priceCents: 0 }));
  });
  it('rejeita usar cotação de outro ativo e não modifica entradas', () => {
    assert.throws(() => stockPosition(holding, { ...quote, ticker: 'VALE3' }));
    const before = JSON.stringify({ holding, quote }); stockPosition(holding, quote);
    assert.equal(JSON.stringify({ holding, quote }), before);
  });
});
describe('setores — média da amostra por período', () => {
  const sample: StockQuote[] = [quote, { ...quote, ticker: 'PRIO3', changes: { day: -4, month: 9, year: null } }, { ...quote, ticker: 'ITUB4', sector: 'Bancos', changes: { day: 1, month: -1, year: 4 } }];
  it('usa média simples igual ponderação, troca ranking conforme período e conta amostra', () => {
    assert.deepEqual(sectorPerformance(sample, 'day'), [{ sector: 'Bancos', changePercent: 1, count: 1 }, { sector: 'Energia', changePercent: -1, count: 2 }]);
    assert.deepEqual(sectorPerformance(sample, 'month')[0], { sector: 'Energia', changePercent: 2, count: 2 });
  });
  it('exclui variações ausentes da média e não as interpreta como zero', () => {
    assert.deepEqual(sectorPerformance(sample, 'year')[0], { sector: 'Energia', changePercent: 10, count: 1 });
    assert.deepEqual(sectorPerformance([{ ...quote, changes: { day: null, month: null, year: null } }], 'day'), []);
  });
  it('rejeita duplicidade que distorceria média e percentuais inválidos', () => {
    assert.throws(() => sectorPerformance([quote, quote], 'day'));
    for (const day of [NaN, Infinity, -101]) assert.throws(() => sectorPerformance([{ ...quote, changes: { ...quote.changes, day } }], 'day'));
  });
});
