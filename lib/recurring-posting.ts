import { AuthError } from './auth-core';
import { validateFinancialState, type FinancialState, type Transaction } from './financial-state';
import { dueRecurringThroughDate, recurringDate, recurringToday } from '../wealthos-source/packages/finance/src/index';

export interface FinancialSnapshot { state:FinancialState; revision:number; }
export interface FinancialStore {
 read():Promise<FinancialSnapshot>;
 save(state:FinancialState,revision:number):Promise<FinancialSnapshot>;
}

/** Only the current month is automatic; older months require an explicit action. */
export function appendCurrentRecurring(state:FinancialState,today=recurringToday()) {
 const month=today.slice(0,7);
 const due=dueRecurringThroughDate(state.recurringExpenses??[],state.transactions,month,today);
 if(!due.length)return {state,recurringPosted:0};
 const generated:Transaction[]=due.map(rule=>({
  id:crypto.randomUUID(),idempotencyKey:crypto.randomUUID(),accountId:rule.accountId,
  description:rule.description,category:rule.category,amountCents:rule.amountCents,
  type:'EXPENSE',date:recurringDate(rule,month),recurringRuleId:rule.id,recurringMonth:month,
 }));
 return {state:validateFinancialState({...state,transactions:[...state.transactions,...generated]}),recurringPosted:generated.length};
}

/** Retry only generated entries against a fresh snapshot, never a stale user draft. */
export async function postCurrentRecurring(store:FinancialStore,today=recurringToday()) {
 for(let attempt=0;attempt<3;attempt++) {
  const snapshot=await store.read();
  const next=appendCurrentRecurring(snapshot.state,today);
  if(!next.recurringPosted)return {...snapshot,recurringPosted:0};
  try {return {...await store.save(next.state,snapshot.revision),recurringPosted:next.recurringPosted};}
  catch(error) {if(!(error instanceof AuthError)||error.status!==409)throw error;}
 }
 throw new AuthError(409,'Seus dados foram alterados em outra sessão. Recarregue os dados antes de tentar novamente.');
}
