import '../../wealthos-source/node_modules/@angular/compiler/fesm2022/compiler.mjs';
import assert from 'node:assert/strict';
import {AppComponent} from '../../wealthos-source/apps/web/src/app.component';
import {validateFinancialState} from '../../lib/financial-state';
Object.assign(globalThis,{document:{documentElement:{dataset:{}},activeElement:{isConnected:true,focus(){}},querySelector(){return null;},querySelectorAll(){return [];}},history:{replaceState(){}}});
class TestApp extends AppComponent{override async initializeAuth(){}override async loadPortfolioQuotes(){}override notify(message:string){this.toast=message;}}
const user={id:'test-user',name:'Teste',email:'test@example.invalid',provider:'email'};
const a={id:crypto.randomUUID(),name:'Principal',institution:'Banco',color:'#2862b9',openingBalanceCents:10000};
const b={...a,id:crypto.randomUUID(),name:'Outra conta',openingBalanceCents:5000};
const rule={id:crypto.randomUUID(),accountId:a.id,description:'Assinatura',category:'Outros',amountCents:101,day:1,startMonth:'2026-10',active:true};
const otherRule={...rule,id:crypto.randomUUID(),accountId:b.id};
const tx=(accountId:string,amountCents:number)=>({id:crypto.randomUUID(),idempotencyKey:crypto.randomUUID(),accountId,type:'EXPENSE' as const,date:'2026-10-01',description:'Compra',category:'Outros',amountCents});
const otherTransaction=tx(b.id,202);
const holding={id:crypto.randomUUID(),ticker:'AMER3',quantity:4,averagePriceCents:null};
let stored=validateFinancialState({accounts:[a,b],transactions:[tx(a.id,101),{...tx(a.id,303),reversedAt:'2026-10-02T12:00:00Z'},otherTransaction],recurringExpenses:[rule,otherRule],budgets:[],goals:[{id:crypto.randomUUID(),name:'Meta',targetCents:10000,savedCents:100,icon:'goals'}]});
let revision=0,writes=0,failWrite=false,deferWrite=false,release:(()=>void)|undefined;
globalThis.fetch=async(input,init)=>{
 if(String(input)==='/api/portfolio')return Response.json({holdings:[holding]});
 assert.ok(['/api/finance','/api/finance/recurring'].includes(String(input)));
 if(init?.method==='PUT'){
  writes++;const data=JSON.parse(String(init.body));assert.equal(data.revision,revision);
  const next=validateFinancialState(data.state);
  if(deferWrite)await new Promise<void>(resolve=>release=resolve);
  if(failWrite)return Response.json({error:'Falha de conexão'},{status:503});
  stored=next;revision++;
 }
 return Response.json({state:structuredClone(stored),revision});
};
const app=new TestApp({} as never);await app.applyUser(user);
// The account export downloads a PDF of all data, regardless of active UI filters.
let exportedBlob:Blob|undefined,downloadName='',downloadClicked=false;
Object.assign(document,{createElement(){return {set download(value:string){downloadName=value;},set href(_value:string){},click(){downloadClicked=true;}};}});
const createUrl=URL.createObjectURL,revokeUrl=URL.revokeObjectURL,timer=globalThis.setTimeout;
URL.createObjectURL=(blob:Blob)=>{exportedBlob=blob;return 'blob:test';};URL.revokeObjectURL=()=>{};
globalThis.setTimeout=((callback:()=>void)=>{callback();return 0;}) as unknown as typeof setTimeout;
app.search='no matching entries';app.filterType='INCOME';app.month='2020-01';
app.exportData();assert.equal(downloadClicked,true);assert.equal(downloadName,'wealthos-relatorio-financeiro.pdf');assert.equal(exportedBlob!.type,'application/pdf');
const exported=await exportedBlob!.text();assert.match(exported,/^%PDF-1.4/);assert.match(exported,/Conta: Principal/);assert.match(exported,/Conta: Outra conta/);assert.equal(writes,0);
URL.createObjectURL=createUrl;URL.revokeObjectURL=revokeUrl;globalThis.setTimeout=timer;
app.search='';app.filterType='ALL';app.month='2026-10';
const original=JSON.stringify(stored);
app.askDeleteAccount(app.state.accounts[0]);assert.equal(app.accountDeleteTransactions,2);assert.equal(app.accountDeleteRecurring,1);
app.closeModal();assert.equal(JSON.stringify(stored),original);assert.equal(writes,0);
app.askDeleteAccount(app.state.accounts[0]);await app.save();assert.equal(writes,0);assert.match(app.error,/Confirme/);
app.accountDeleteConfirmed=true;failWrite=true;await app.save();assert.equal(JSON.stringify(stored),original);assert.equal(app.state.accounts.length,2);assert.equal(app.modal,'deleteAccount');
failWrite=false;deferWrite=true;app.filterAccount=a.id;
const deleting=app.save();await app.save();app.closeModal();assert.equal(app.busy,true);assert.equal(app.modal,'deleteAccount');assert.equal(writes,2);
deferWrite=false;release!();await deleting;
assert.equal(app.modal,null);assert.equal(app.accountDeleteConfirmed,false);assert.equal(app.pendingDeleteAccount,null);assert.equal(app.filterAccount,'ALL');
assert.deepEqual(stored.accounts,[b]);assert.deepEqual(stored.transactions,[otherTransaction]);assert.deepEqual(stored.recurringExpenses,[otherRule]);
assert.equal(app.mainAccount!.id,b.id);assert.equal(app.totalBalance,4798);assert.equal(app.holdings.length,1);assert.equal(stored.goals.length,1);
await app.save();assert.equal(writes,2);
await app.applyUser(user);assert.equal(app.state.accounts.length,1);
app.askDeleteAccount(app.state.accounts[0]);app.accountDeleteConfirmed=true;await app.save();assert.equal(app.totalBalance,0);assert.equal(app.mainAccount,null);assert.equal(app.state.transactions.length,0);assert.equal(app.recurringRules.length,0);
app.openModal('transaction');assert.equal(app.modal,'account');assert.equal(app.accountOnboarding,true);app.closeModal();
// Daily market movement is shown even when the purchase price is unknown.
app.quotes=[{ticker:'AMER3',name:'Ativo',sector:'Outros',priceCents:480,changes:{day:2.75,month:null,year:null}}];
assert.equal(app.positions[0].dayChangePercent,2.75);assert.equal(app.positions[0].profitPercent,null);
app.holdings=[{...holding,averagePriceCents:600}];app.quotes[0].changes.day=-1.25;
assert.equal(app.positions[0].dayChangePercent,-1.25);assert.equal(app.positions[0].profitPercent,-20);
app.quotes[0].changes.day=0;assert.equal(app.positions[0].dayChangePercent,0);
app.quotes[0].changes.day=null;assert.equal(app.positions[0].dayChangePercent,null);
app.quotes[0].changes.day=NaN;assert.equal(app.positions[0].dayChangePercent,null);
app.quotes=[];assert.equal(app.positions[0].dayChangePercent,null);
console.log('Account deletion confirmation, cancel, failure, retry, duplicates, linked rows, last account and independent daily change passed.');
