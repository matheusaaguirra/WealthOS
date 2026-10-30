import '../../wealthos-source/node_modules/@angular/compiler/fesm2022/compiler.mjs';
import assert from 'node:assert/strict';
import {AppComponent} from '../../wealthos-source/apps/web/src/app.component';
import {validateFinancialState} from '../../lib/financial-state';
import {appendCurrentRecurring} from '../../lib/recurring-posting';
Object.assign(globalThis,{document:{documentElement:{dataset:{}},visibilityState:'visible',activeElement:{isConnected:true,focus(){}},querySelector(){return null;},querySelectorAll(){return [];}},history:{replaceState(){}}});
let today='2026-10-30';
class TestApp extends AppComponent{override async initializeAuth(){}override async loadPortfolioQuotes(){}override recurringToday(){return today;}override notify(message:string){this.toast=message;}}
const account={id:crypto.randomUUID(),name:'Principal',institution:'Banco',color:'#326da0',openingBalanceCents:100000};
const other={...account,id:crypto.randomUUID(),name:'VR',balanceGroup:'SEPARATE',openingBalanceCents:50000};
const rule={id:crypto.randomUUID(),description:'Internet',category:'Moradia',accountId:account.id,amountCents:3701,day:30,startMonth:'2026-10',active:true};
let stored=validateFinancialState({accounts:[account,other],transactions:[],recurringExpenses:[rule,{...rule,id:crypto.randomUUID(),accountId:other.id,day:31}],budgets:[],goals:[]}),revision=1,fail=false,syncs=0;
globalThis.fetch=async(input,init)=>{
 if(String(input)==='/api/portfolio')return Response.json({holdings:[]});
 if(String(input)==='/api/finance/recurring'){
  assert.equal(init?.method,'POST');syncs++;if(fail)return Response.json({error:'Não foi possível atualizar'},{status:503});
  const result=appendCurrentRecurring(stored,today);if(result.recurringPosted){stored=result.state;revision++;}return Response.json({state:structuredClone(stored),revision,recurringPosted:result.recurringPosted});
 }
 assert.equal(String(input),'/api/finance');if(init?.method==='GET')return Response.json({state:structuredClone(stored),revision});assert.equal(init?.method,'PUT');
 const body=JSON.parse(String(init.body));assert.equal(body.revision,revision);
 stored=appendCurrentRecurring(validateFinancialState(body.state),today).state;revision++;
 return Response.json({state:structuredClone(stored),revision});
};
const app=new TestApp({runOutsideAngular:(work:()=>void)=>work(),run:(work:()=>void)=>work()} as never);await app.applyUser({id:'test',name:'Teste',email:'test@example.invalid',provider:'email'});
assert.equal(app.totalBalance,96299);assert.equal(app.separateBalance,50000);assert.equal(app.state.transactions.length,1);
await app.reloadUserPortfolio();assert.equal(app.totalBalance,96299);assert.equal(app.state.transactions.length,1);
app.month='2026-11';assert.equal(app.readyRecurring.length,0);await app.generateRecurring();assert.equal(app.state.transactions.length,1);
app.month='2026-10';today='2026-10-31';fail=true;await app.syncRecurringWhenDue();assert.equal(app.separateBalance,50000);assert.ok(app.recurringSyncError);assert.equal(app.busy,false);
await app.reloadUserPortfolio();assert.equal(app.dataReady,true);assert.ok(app.recurringSyncError);assert.equal(app.separateBalance,50000);
const nativeInterval=globalThis.setInterval,nativeClear=globalThis.clearInterval;let tick:(()=>void)|undefined,cleared=false;
globalThis.setInterval=((callback:()=>void)=>{tick=callback;return 1;}) as unknown as typeof setInterval;
globalThis.clearInterval=(()=>{cleared=true;}) as typeof clearInterval;
app.ngOnInit();assert.ok(tick);
fail=false;tick!();await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(app.totalBalance,96299);assert.equal(app.separateBalance,46299);assert.equal(app.recurringSyncError,'');
const before=syncs;await app.syncRecurringWhenDue();assert.equal(syncs,before);
app.openRecurring();app.recurringDraft={id:'',description:'Nova assinatura',amount:'10,99',accountId:account.id,category:'Outros',day:30,startMonth:'2026-10',endMonth:'',active:true};await app.save();
assert.equal(app.totalBalance,95200);assert.equal(app.state.transactions.length,3);assert.equal(app.error,'');
app.ngOnDestroy();assert.equal(cleared,true);globalThis.setInterval=nativeInterval;globalThis.clearInterval=nativeClear;console.log('Automatic recurring load, retry, separated balances, future dates, duplicate prevention and immediate creation passed.');
