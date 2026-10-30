import { validateAmount, validateDate, type Entry } from './index';

export interface RecurringExpense {
  id: string;
  accountId: string;
  description: string;
  category: string;
  amountCents: number;
  day: number;
  startMonth: string;
  endMonth?: string;
  active: boolean;
}

export interface RecurringTransaction extends Entry {
  recurringRuleId?: string;
  recurringMonth?: string;
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validateRecurringExpense(input: unknown): RecurringExpense {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new RangeError('Despesa fixa inválida.');
  const row = input as Record<string, unknown>;
  if (Object.keys(row).some(key => !['id','accountId','description','category','amountCents','day','startMonth','endMonth','active'].includes(key))) throw new RangeError('Campo de despesa fixa não permitido.');
  if (typeof row.id !== 'string' || !uuid.test(row.id) || typeof row.accountId !== 'string' || !uuid.test(row.accountId)) throw new RangeError('Identificador de despesa fixa inválido.');
  const label = (value: unknown, max: number) => typeof value === 'string' && !!value.trim() && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value) ? value.trim() : null;
  const description = label(row.description, 120), category = label(row.category, 60);
  if (!description || !category) throw new RangeError('Informe descrição e categoria da despesa fixa.');
  validateAmount(row.amountCents as number);
  if (!Number.isInteger(row.day) || (row.day as number) < 1 || (row.day as number) > 31) throw new RangeError('Dia de vencimento deve ser de 1 a 31.');
  const startMonth = row.startMonth, endMonth = row.endMonth;
  if (typeof startMonth !== 'string' || !monthPattern.test(startMonth)) throw new RangeError('Mês inicial inválido.');
  validateDate(startMonth + '-01');
  if (endMonth !== undefined) {
    if (typeof endMonth !== 'string' || !monthPattern.test(endMonth)) throw new RangeError('Mês final inválido.');
    validateDate(endMonth + '-01');
    if (endMonth < startMonth) throw new RangeError('Mês final anterior ao início.');
  }
  if (typeof row.active !== 'boolean') throw new RangeError('Situação da despesa fixa inválida.');
  return {id:row.id,accountId:row.accountId,description,category,amountCents:row.amountCents as number,day:row.day as number,startMonth,...(endMonth?{endMonth}:{}),active:row.active};
}

export function recurringDate(rule: RecurringExpense, month: string): string {
  if (!monthPattern.test(month)) throw new RangeError('Mês inválido.');
  validateDate(month + '-01');
  const [year, number] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year,number,0)).getUTCDate();
  return month + '-' + String(Math.min(rule.day,lastDay)).padStart(2,'0');
}

export function dueRecurringExpenses<T extends RecurringTransaction>(rules: RecurringExpense[], transactions: T[], month: string): RecurringExpense[] {
  if (!monthPattern.test(month)) throw new RangeError('Mês inválido.');
  validateDate(month + '-01');
  return rules.filter(rule => rule.active && month >= rule.startMonth && (!rule.endMonth || month <= rule.endMonth) && !transactions.some(t => t.recurringRuleId === rule.id && t.recurringMonth === month));
}

/** Recurrences use the same business date on the server and every device. */
export function recurringToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now);
  const part = (type:string) => parts.find(value=>value.type===type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function dueRecurringThroughDate<T extends RecurringTransaction>(rules: RecurringExpense[], transactions: T[], month: string, today: string): RecurringExpense[] {
  validateDate(today);
  return dueRecurringExpenses(rules, transactions, month).filter(rule=>recurringDate(rule,month)<=today);
}
