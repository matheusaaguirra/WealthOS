import { parseMoneyToCents, validateDate } from './index';

export const FIXED_INCOME_TYPES = [
  { value: 'TESOURO', label: 'Tesouro Direto' },
  { value: 'CDB', label: 'CDB' },
  { value: 'LCI', label: 'LCI' },
  { value: 'LCA', label: 'LCA' },
  { value: 'LC', label: 'Letra de câmbio (LC)' },
  { value: 'DEBENTURE', label: 'Debênture' },
  { value: 'CRI', label: 'CRI' },
  { value: 'CRA', label: 'CRA' },
] as const;
export type FixedIncomeType = typeof FIXED_INCOME_TYPES[number]['value'];
export type InvestmentIndexer = 'CDI' | 'IPCA' | 'PREFIXADO' | 'SELIC';
export interface FixedIncomeInvestment {
  id: string;
  type: FixedIncomeType;
  name: string;
  institution: string;
  investedCents: number;
  currentValueCents: number | null;
  investedOn: string;
  maturityOn: string | null;
  indexer: InvestmentIndexer | null;
  rateBasisPoints: number | null;
  valueUpdatedOn: string | null;
}
export interface FixedIncomeDraft {
  id:string;type:FixedIncomeType;name:string;institution:string;invested:string;currentValue:string;
  investedOn:string;maturityOn:string;indexer:InvestmentIndexer|'';rate:string;valueUpdatedOn:string;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keys = ['id','type','name','institution','investedCents','currentValueCents','investedOn','maturityOn','indexer','rateBasisPoints','valueUpdatedOn'];
function fail(message:string):never { throw new RangeError(message); }
function text(value:unknown,label:string,max=80):string {
  if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f\u007f]/.test(value))fail('Informe '+label+' válido, com até '+max+' caracteres.');
  return value.trim();
}
function cents(value:unknown,label:string,min=0):number {
  if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>1_000_000_000)fail(label+' deve estar em centavos, dentro do limite permitido.');
  return value;
}
export function validateFixedIncomeInvestment(value:unknown):FixedIncomeInvestment {
  if(!value||typeof value!=='object'||Array.isArray(value))fail('Investimento inválido.');
  const r=value as Record<string,unknown>;
  if(Object.keys(r).some(key=>!keys.includes(key)))fail('O investimento contém campos não permitidos.');
  if(typeof r.id!=='string'||!uuid.test(r.id))fail('Identificador do investimento inválido.');
  if(!FIXED_INCOME_TYPES.some(type=>type.value===r.type))fail('Selecione uma modalidade de renda fixa.');
  const investedOn=text(r.investedOn,'a data de aplicação',10);validateDate(investedOn);
  const maturityOn=r.maturityOn===null?null:text(r.maturityOn,'o vencimento',10);
  if(maturityOn){validateDate(maturityOn);if(maturityOn<investedOn)fail('O vencimento deve ser igual ou posterior à aplicação.');}
  const indexer=r.indexer===null?null:r.indexer;
  if(indexer!==null&&!['CDI','IPCA','PREFIXADO','SELIC'].includes(indexer as string))fail('Selecione um indexador válido.');
  const rate=r.rateBasisPoints;
  if(rate!==null&&(typeof rate!=='number'||!Number.isSafeInteger(rate)||rate<0||rate>100_000))fail('Informe uma taxa entre 0 e 1.000%, com até duas casas decimais.');
  if(rate!==null&&indexer===null)fail('Selecione um indexador para a taxa informada.');
  const currentValueCents=r.currentValueCents===null?null:cents(r.currentValueCents,'O saldo atual');
  const valueUpdatedOn=r.valueUpdatedOn===null?null:text(r.valueUpdatedOn,'a data do saldo',10);
  if(currentValueCents!==null&&!valueUpdatedOn)fail('Informe a data de referência do saldo atual.');
  if(currentValueCents===null&&valueUpdatedOn!==null)fail('Informe um saldo atual para sua data de referência.');
  if(valueUpdatedOn){validateDate(valueUpdatedOn);if(valueUpdatedOn<investedOn)fail('A data do saldo não pode ser anterior à aplicação.');}
  return {id:r.id,type:r.type as FixedIncomeType,name:text(r.name,'um nome'),institution:text(r.institution,'uma instituição'),investedCents:cents(r.investedCents,'O valor aplicado',1),currentValueCents,investedOn,maturityOn,indexer:indexer as InvestmentIndexer|null,rateBasisPoints:rate as number|null,valueUpdatedOn};
}
export function fixedIncomeFromDraft(draft:FixedIncomeDraft,id:string):FixedIncomeInvestment {
  const rawRate=draft.rate.trim();
  if(rawRate&&!/^\d+(?:,\d{1,2})?$/.test(rawRate))fail('Use uma taxa como 100 ou 12,50, sem símbolos.');
  const [whole,fraction='']=rawRate.split(',');
  const rateBasisPoints=rawRate?Number(whole)*100+Number(fraction.padEnd(2,'0')):null;
  const current=draft.currentValue.trim();
  return validateFixedIncomeInvestment({id,type:draft.type,name:draft.name,institution:draft.institution,investedCents:parseMoneyToCents(draft.invested),currentValueCents:current?(/^0+(?:,0{1,2})?$/.test(current)?0:parseMoneyToCents(current)):null,investedOn:draft.investedOn,maturityOn:draft.maturityOn||null,indexer:draft.indexer||null,rateBasisPoints,valueUpdatedOn:current?draft.valueUpdatedOn:null});
}
export function summarizeFixedIncome(investments:readonly FixedIncomeInvestment[]) {
  let investedCents=0,currentValueCents=0,valuedCount=0;
  for(const row of investments){investedCents+=row.investedCents;if(row.currentValueCents!==null){currentValueCents+=row.currentValueCents;valuedCount++;}}
  if(!Number.isSafeInteger(investedCents)||!Number.isSafeInteger(currentValueCents))fail('O total excede a precisão monetária permitida.');
  return {investedCents,currentValueCents:valuedCount?currentValueCents:null,valuedCount,missingCount:investments.length-valuedCount};
}
