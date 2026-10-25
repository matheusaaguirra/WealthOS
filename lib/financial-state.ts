import { AuthError } from './auth-core';
import { assertNoDuplicate, balance, validateAmount, validateDate, validateFixedIncomeInvestment, validateRecurringExpense, type RecurringExpense, type FixedIncomeInvestment, type Entry } from '../wealthos-source/packages/finance/src/index';

export interface Account {id:string;name:string;institution:string;color:string;openingBalanceCents:number}
export interface Transaction extends Entry {description:string;category:string;idempotencyKey:string;recurringRuleId?:string;recurringMonth?:string}
export interface Budget {id:string;category:string;limitCents:number}
export interface Goal {id:string;name:string;targetCents:number;savedCents:number;icon:string}
export interface FinancialState {accounts:Account[];transactions:Transaction[];budgets:Budget[];goals:Goal[];investments?:FixedIncomeInvestment[];recurringExpenses?:RecurringExpense[]}
export const emptyFinancialState=():FinancialState=>({accounts:[],transactions:[],budgets:[],goals:[]});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function invalid(message='Os dados financeiros são inválidos.'):never{throw new AuthError(400,message);}
function object(value:unknown,keys:string[]):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))invalid();
  const record=value as Record<string,unknown>;
  if(Object.keys(record).some(key=>!keys.includes(key)))invalid('A solicitação contém campos não permitidos.');
  return record;
}
function text(value:unknown,max=100):string{if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f\u007f]/.test(value))invalid();return value.trim();}
function id(value:unknown):string{if(typeof value!=='string'||!uuid.test(value))invalid('Identificador inválido.');return value;}
function integer(value:unknown,min:number,max:number):number{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max)invalid('Use valores inteiros em centavos dentro do limite permitido.');return value;}
function rows(value:unknown,max:number){if(!Array.isArray(value)||value.length>max)invalid('Quantidade de registros acima do limite.');return value as unknown[];}
function unique<T>(values:T[],key:(value:T)=>string){if(new Set(values.map(key)).size!==values.length)invalid('Há registros duplicados.');}
export function validateFinancialState(input:unknown):FinancialState{
  const data=object(input,['accounts','transactions','budgets','goals','investments','recurringExpenses']);
  const accounts=rows(data.accounts,100).map(raw=>{const r=object(raw,['id','name','institution','color','openingBalanceCents']);const color=text(r.color,7);if(!/^#[0-9a-f]{6}$/i.test(color))invalid();return{id:id(r.id),name:text(r.name,80),institution:text(r.institution,80),color,openingBalanceCents:integer(r.openingBalanceCents,-1e9,1e9)};});
  unique(accounts,r=>r.id);
  const transactions:Transaction[]=rows(data.transactions,2000).map(raw=>{
    const r=object(raw,['id','accountId','amountCents','type','date','reversedAt','description','category','idempotencyKey','recurringRuleId','recurringMonth']);
    const accountId=id(r.accountId);if(!accounts.some(a=>a.id===accountId))invalid('Um lançamento está vinculado a uma conta inexistente.');
    const amountCents=integer(r.amountCents,1,1e9);validateAmount(amountCents);
    const date=text(r.date,10);try{validateDate(date);}catch{invalid('Data inválida.');}
    if(r.type!=='INCOME'&&r.type!=='EXPENSE')invalid('Tipo de lançamento inválido.');
    if(r.reversedAt!==undefined&&r.reversedAt!==null&&(typeof r.reversedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(r.reversedAt)||!Number.isFinite(Date.parse(r.reversedAt))))invalid('Estorno inválido.');
    if((r.recurringRuleId===undefined)!==(r.recurringMonth===undefined))invalid('Origem recorrente incompleta.');
    if(r.recurringRuleId!==undefined){if(r.type!=='EXPENSE')invalid('Lançamento recorrente deve ser despesa.');id(r.recurringRuleId);if(typeof r.recurringMonth!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.recurringMonth)||!date.startsWith(r.recurringMonth+'-'))invalid('Mês recorrente inválido.');}
    return{id:id(r.id),accountId,amountCents,type:r.type,date,description:text(r.description,120),category:text(r.category,60),idempotencyKey:id(r.idempotencyKey),...(r.reversedAt?{reversedAt:r.reversedAt as string}:{}),...(r.recurringRuleId?{recurringRuleId:r.recurringRuleId as string,recurringMonth:r.recurringMonth as string}:{})};
  });
  unique(transactions,r=>r.id);unique(transactions,r=>r.idempotencyKey);assertNoDuplicate(transactions);
  unique(transactions.filter(r=>r.recurringRuleId),r=>r.recurringRuleId+':'+r.recurringMonth);
  for(const account of accounts)balance(account.openingBalanceCents,transactions.filter(t=>t.accountId===account.id));
  const budgets=rows(data.budgets,100).map(raw=>{const r=object(raw,['id','category','limitCents']);return{id:id(r.id),category:text(r.category,60),limitCents:integer(r.limitCents,1,1e9)};});
  unique(budgets,r=>r.id);unique(budgets,r=>r.category);
  const goals=rows(data.goals,100).map(raw=>{const r=object(raw,['id','name','targetCents','savedCents','icon']);const targetCents=integer(r.targetCents,1,1e9);return{id:id(r.id),name:text(r.name,80),targetCents,savedCents:integer(r.savedCents,0,targetCents),icon:text(r.icon,8)};});
  unique(goals,r=>r.id);
  let investments:FixedIncomeInvestment[]|undefined;
  if(data.investments!==undefined){try{investments=rows(data.investments,200).map(validateFixedIncomeInvestment);}catch(error){invalid(error instanceof Error?error.message:'Investimentos inválidos.');}unique(investments,r=>r.id);}
  let recurringExpenses:RecurringExpense[]|undefined;
  if(data.recurringExpenses!==undefined){try{recurringExpenses=rows(data.recurringExpenses,100).map(validateRecurringExpense);}catch(error){invalid(error instanceof Error?error.message:'Despesas fixas inválidas.');}unique(recurringExpenses,r=>r.id);for(const rule of recurringExpenses)if(!accounts.some(a=>a.id===rule.accountId))invalid('Uma despesa fixa está vinculada a uma conta inexistente.');}
  return {accounts,transactions,budgets,goals,...(investments===undefined?{}:{investments}),...(recurringExpenses===undefined?{}:{recurringExpenses})};
}
export async function readFinancialRequest(request:Request){
  if(request.headers.get('origin')!==new URL(request.url).origin)throw new AuthError(403,'Origem não autorizada.');
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))throw new AuthError(415,'Envie a solicitação em JSON.');
  const reader=request.body?.getReader();if(!reader)invalid();let size=0;const chunks:Uint8Array[]=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>262144){await reader.cancel();throw new AuthError(413,'Quantidade de dados acima do limite por solicitação.');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  let parsed:unknown;try{parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{invalid();}
  const body=object(parsed,['state','revision']);
  return {state:validateFinancialState(body.state),revision:integer(body.revision,0,Number.MAX_SAFE_INTEGER-1)};
}
