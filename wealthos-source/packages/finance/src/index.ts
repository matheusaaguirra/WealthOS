/** Valores monetários são inteiros em centavos; nenhuma soma usa ponto flutuante monetário. */
export interface Entry {
  id: string;
  accountId: string;
  amountCents: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  reversedAt?: string | null;
}
export const MAX_AMOUNT_CENTS = 1_000_000_000;
export function validateAmount(cents: number): void {
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) {
    throw new RangeError('Valor deve ser inteiro positivo em centavos, até R$ 10.000.000,00.');
  }
}
function safeAdd(a: number, b: number): number {
  const result = a + b;
  if (!Number.isSafeInteger(result)) throw new RangeError('Saldo excede precisão segura.');
  return result;
}
/** Aceita 1234,56 / 1.234,56 / 1234; rejeita notação científica, sinais e casas extras. */
export function parseMoneyToCents(input: string): number {
  if (typeof input !== 'string') throw new TypeError('Informe um valor em reais.');
  const cleaned = input.trim().replace(/^R\$\s*/, '');
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(cleaned)) {
    throw new RangeError('Use um valor como 1.234,56, com até duas casas decimais.');
  }
  const [whole, fraction = ''] = cleaned.replace(/\./g, '').split(',');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  validateAmount(cents);
  return cents;
}
export function validateDate(date: string): void {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError('Data deve usar AAAA-MM-DD.');
  const parsed = new Date(`${date}T00:00:00.000Z`);
  const year = Number(date.slice(0, 4));
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || year < 2000 || year > 2100) {
    throw new RangeError('Data inválida; use uma data entre 2000 e 2100.');
  }
}
export function assertNoDuplicate(entries: Entry[]): void {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!entry.id || ids.has(entry.id)) throw new Error('Lançamento duplicado ou identificador inválido.');
    ids.add(entry.id);
  }
}
function validateEntries(entries: Entry[]): void {
  assertNoDuplicate(entries);
  for (const entry of entries) {
    validateAmount(entry.amountCents);
    validateDate(entry.date);
    if (entry.type !== 'INCOME' && entry.type !== 'EXPENSE') throw new RangeError('Tipo inválido.');
  }
}
export function balance(openingBalanceCents: number, entries: Entry[]): number {
  if (!Number.isSafeInteger(openingBalanceCents)) throw new RangeError('Saldo inicial deve ser inteiro seguro em centavos.');
  validateEntries(entries);
  return entries.filter(e => !e.reversedAt).reduce((sum, e) => safeAdd(sum, e.type === 'INCOME' ? e.amountCents : -e.amountCents), openingBalanceCents);
}
export function summarize(entries: Entry[], month: string): { incomeCents: number; expenseCents: number; balanceCents: number } {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new RangeError('Mês deve usar AAAA-MM.');
  validateDate(`${month}-01`);
  validateEntries(entries);
  let incomeCents = 0, expenseCents = 0;
  for (const e of entries) {
    if (e.reversedAt || !e.date.startsWith(month + '-')) continue;
    if (e.type === 'INCOME') incomeCents = safeAdd(incomeCents, e.amountCents);
    else expenseCents = safeAdd(expenseCents, e.amountCents);
  }
  return { incomeCents, expenseCents, balanceCents: safeAdd(incomeCents, -expenseCents) };
}
export function splitInstallments(totalCents: number, count: number): number[] {
  validateAmount(totalCents);
  if (!Number.isSafeInteger(count) || count < 1 || count > 120 || count > totalCents) throw new RangeError('Parcelas devem ser de 1 a 120, com ao menos um centavo por parcela.');
  const base = Math.floor(totalCents / count), remainder = totalCents % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}
export { stockPosition, sectorPerformance, validateHolding } from './stocks';
export type { StockQuote, StockPeriod, Holding, StockPosition } from './stocks';

export { FIXED_INCOME_TYPES, validateFixedIncomeInvestment, fixedIncomeFromDraft, summarizeFixedIncome } from './fixed-income';
export type { FixedIncomeInvestment, FixedIncomeDraft, FixedIncomeType, InvestmentIndexer } from './fixed-income';
