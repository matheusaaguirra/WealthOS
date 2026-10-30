import '../../wealthos-source/node_modules/@angular/compiler/fesm2022/compiler.mjs';
import assert from 'node:assert/strict';
import { AppComponent } from '../../wealthos-source/apps/web/src/app.component';
Object.assign(globalThis,{document:{documentElement:{dataset:{}},activeElement:{isConnected:true,focus(){}},querySelector(){return null;},querySelectorAll(){return [];}},history:{replaceState(){}}});
class TestApp extends AppComponent { override async initializeAuth(){} override async loadPortfolioQuotes(){} override notify(message:string){this.toast=message;} }
const user={id:'test-user',name:'Teste',email:'test@example.invalid',provider:'email'};
const account={id:crypto.randomUUID(),name:'Conta',institution:'Banco',color:'#2862b9',openingBalanceCents:10000};
let stored:any={accounts:[account],transactions:[],budgets:[],goals:[]},revision=0,writes=0,failWrite=false,deferWrite=false,release:(()=>void)|undefined;
globalThis.fetch=async(input,init)=>{
 if(String(input)==='/api/portfolio')return Response.json({holdings:[]});
 assert.ok(['/api/finance','/api/finance/recurring'].includes(String(input)));
 if(init?.method==='PUT'){
  writes++;const payload=JSON.parse(String(init.body));assert.equal(payload.revision,revision);
  if(deferWrite)await new Promise<void>(resolve=>release=resolve);
  if(failWrite)return Response.json({error:'Conflito: recarregue os dados.'},{status:409});
  stored=structuredClone(payload.state);revision++;
 }
 return Response.json({state:structuredClone(stored),revision});
};
const app=new TestApp({} as never);await app.applyUser(user);assert.deepEqual(app.fixedIncomeInvestments,[]);
app.openFixedIncome();Object.assign(app.investmentDraft,{type:'LCA',name:'Safra',institution:'Banco',invested:'12,34',indexer:'CDI',rate:'95'});
failWrite=true;await app.save();assert.equal(app.fixedIncomeInvestments.length,0);assert.equal(app.modal,'fixedIncome');assert.match(app.error,/Conflito/);
failWrite=false;deferWrite=true;const saving=app.save();await app.save();app.closeModal();assert.equal(writes,2);assert.equal(app.busy,true);assert.equal(app.modal,'fixedIncome');deferWrite=false;release!();await saving;
assert.equal(app.modal,null);assert.equal(stored.investments.length,1);assert.equal(stored.investments[0].investedCents,1234);assert.equal(stored.investments[0].currentValueCents,null);assert.equal(app.totalBalance,10000);assert.equal(app.state.transactions.length,0);
await app.applyUser(user);assert.equal(app.fixedIncomeInvestments.length,1);
app.openFixedIncome(app.fixedIncomeInvestments[0]);assert.equal(app.investmentDraft.invested,'12,34');app.investmentDraft.currentValue='0,00';await app.save();assert.equal(stored.investments.length,1);assert.equal(stored.investments[0].currentValueCents,0);assert.equal(app.fixedIncomeSummary.currentValueCents,0);
app.askDeleteInvestment(app.fixedIncomeInvestments[0]);app.closeModal();assert.equal(stored.investments.length,1);
app.askDeleteInvestment(app.fixedIncomeInvestments[0]);failWrite=true;await app.save();assert.equal(app.fixedIncomeInvestments.length,1);assert.equal(app.modal,'deleteFixedIncome');failWrite=false;await app.save();assert.equal(stored.investments.length,0);assert.equal(app.totalBalance,10000);assert.equal(stored.transactions.length,0);
console.log('Fixed-income CRUD, rollback, double-submit, zero value, reload and unchanged account balance passed.');
