import { parseMoneyToCents } from '@wealthos/finance';

export interface AccountSetupDraft { name:string;institution:string;color:string;opening:string; }
export interface AccountSetup { id:string;name:string;institution:string;color:string;openingBalanceCents:number; }

/** The first stored account is the default; selection survives a cloud reload. */
export function defaultAccountId(accounts:readonly {id:string}[]):string { return accounts[0]?.id??''; }

export function createAccountFromDraft(draft:AccountSetupDraft,id:string):AccountSetup {
  const name=draft.name.trim(),institution=draft.institution.trim();
  if(!name||!institution)throw new Error('Informe o nome da conta e a instituição.');
  if(name.length>80||institution.length>80)throw new Error('Use até 80 caracteres no nome e na instituição.');
  if(!/^#[0-9a-fA-F]{6}$/.test(draft.color))throw new Error('Escolha uma cor válida para a conta.');
  const raw=draft.opening.trim(),negative=raw.startsWith('-');
  const amount=negative?raw.slice(1):raw;
  const openingBalanceCents=(/^0+(?:[,.]0{1,2})?$/.test(amount)?0:parseMoneyToCents(amount))*(negative?-1:1);
  if(Math.abs(openingBalanceCents)>1000000000)throw new Error('Saldo fora do limite permitido.');
  return {id,name,institution,color:draft.color,openingBalanceCents:openingBalanceCents===0?0:openingBalanceCents};
}
