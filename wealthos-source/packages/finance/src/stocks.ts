import { validateAmount } from './index';
export type StockPeriod = 'day' | 'month' | 'year';
export interface StockQuote {
  ticker: string;
  name: string;
  sector: string;
  priceCents: number | null;
  changes: { day: number | null; month: number | null; year: number | null };
}
export interface Holding {
  id: string;
  ticker: string;
  quantity: number;
  averagePriceCents: number | null;
}
export interface StockPosition {
  marketValueCents: number | null;
  costBasisCents: number | null;
  profitCents: number | null;
  profitPercent: number | null;
}
export function validateHolding(holding: Holding): void {
  if (!holding || typeof holding.id !== 'string' || !holding.id.trim() || typeof holding.ticker !== 'string' || !/^[A-Z][A-Z0-9]{3}\d{1,2}F?$/.test(holding.ticker)) throw new RangeError('Informe um identificador e ticker brasileiro válido.');
  if (!Number.isSafeInteger(holding.quantity) || holding.quantity <= 0 || holding.quantity > 1_000_000) throw new RangeError('Quantidade deve ser inteira, entre 1 e 1.000.000.');
  if (holding.averagePriceCents !== null) validateAmount(holding.averagePriceCents);
}
/** Dados ausentes permanecem nulos: não existe rentabilidade sem custo conhecido. */
export function stockPosition(holding: Holding, quote?: StockQuote): StockPosition {
  validateHolding(holding);
  if (quote && quote.ticker !== holding.ticker) throw new RangeError('Cotação não corresponde ao ativo da posição.');
  if (quote?.priceCents !== null && quote?.priceCents !== undefined) validateAmount(quote.priceCents);
  const marketValueCents = quote?.priceCents == null ? null : quote.priceCents * holding.quantity;
  const costBasisCents = holding.averagePriceCents === null ? null : holding.averagePriceCents * holding.quantity;
  if ((marketValueCents !== null && !Number.isSafeInteger(marketValueCents)) || (costBasisCents !== null && !Number.isSafeInteger(costBasisCents))) throw new RangeError('Posição excede a precisão monetária segura.');
  const profitCents = marketValueCents === null || costBasisCents === null ? null : marketValueCents - costBasisCents;
  return { marketValueCents, costBasisCents, profitCents, profitPercent: profitCents === null || costBasisCents === null ? null : profitCents / costBasisCents * 100 };
}
/** Média simples das variações disponíveis na amostra, não um índice oficial ou previsão. */
export function sectorPerformance(quotes: StockQuote[], period: StockPeriod): { sector: string; changePercent: number; count: number }[] {
  if (!['day', 'month', 'year'].includes(period)) throw new RangeError('Período inválido.');
  const seen = new Set<string>();
  const sectors = new Map<string, { total: number; count: number }>();
  for (const quote of quotes) {
    if (seen.has(quote.ticker)) throw new RangeError('Ticker duplicado na amostra de mercado.');
    seen.add(quote.ticker);
    if (!quote.sector?.trim()) throw new RangeError('Informe o setor do ativo.');
    const variation = quote.changes[period];
    if (variation === null) continue;
    if (!Number.isFinite(variation) || variation < -100) throw new RangeError('Variação percentual inválida.');
    const bucket = sectors.get(quote.sector) ?? { total: 0, count: 0 };
    bucket.total += variation;
    if (!Number.isFinite(bucket.total)) throw new RangeError('Variação agregada inválida.');
    bucket.count += 1;
    sectors.set(quote.sector, bucket);
  }
  return [...sectors].map(([sector, value]) => ({ sector, changePercent: value.total / value.count, count: value.count })).sort((a, b) => b.changePercent - a.changePercent || a.sector.localeCompare(b.sector));
}
