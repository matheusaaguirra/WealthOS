import '../../wealthos-source/node_modules/@angular/compiler/fesm2022/compiler.mjs';
import assert from 'node:assert/strict';
import { AppComponent } from '../../wealthos-source/apps/web/src/app.component';
import { StockAutocompleteComponent } from '../../wealthos-source/apps/web/src/stock-autocomplete.component';

// Run the real component actions with a controlled HTTP boundary, without a real user or database.
Object.assign(globalThis,{
  document:{documentElement:{dataset:{}},activeElement:{isConnected:true,focus(){}},querySelector(){return null;},querySelectorAll(){return [];}},
  history:{replaceState(){}},
});
class TestApp extends AppComponent {
  override async initializeAuth(){}
  override async loadPortfolioQuotes(){}
  override notify(message:string){this.toast=message;}
}
const user={id:'test-user',name:'Teste',email:'test@example.invalid',provider:'email'};
const empty=()=>({accounts:[],transactions:[],budgets:[],goals:[]});
let stored:any=empty(),revision=0,saves=0,failRead=false,failWrite=false,release:(()=>void)|undefined;
let deferWrite=false;
globalThis.fetch=async(input,init)=>{
  const path=String(input);
  if(path==='/api/portfolio')return Response.json({holdings:[]});
  assert.equal(path,'/api/finance');
  if(init?.method==='PUT'){
    saves++;
    const payload=JSON.parse(String(init.body));
    if(deferWrite)await new Promise<void>(resolve=>release=resolve);
    if(failWrite)return Response.json({error:'Falha de conexão'},{status:503});
    assert.equal(payload.revision,revision);
    stored=structuredClone(payload.state);revision++;
  }else if(failRead)return Response.json({error:'Falha ao carregar'},{status:503});
  return Response.json({state:structuredClone(stored),revision});
};
const app=new TestApp({} as never);
await app.applyUser(user);
assert.equal(app.modal,'account');assert.equal(app.accountOnboarding,true);
app.closeModal();
app.openModal('transaction');
assert.equal(app.modal,'account');assert.equal(app.accountOnboarding,true);
app.draft.name='Principal';app.draft.institution='Carteira';app.draft.opening='0,00';
// A failed save leaves the setup open and restores the empty state; retry does not duplicate accounts.
failWrite=true;await app.save();
assert.equal(app.modal,'account');assert.equal(app.state.accounts.length,0);assert.match(app.error,/Falha/);
failWrite=false;deferWrite=true;
const pending=app.save();await app.save();app.closeModal();
assert.equal(saves,2);assert.equal(app.busy,true);assert.equal(app.modal,'account');
deferWrite=false;release!();await pending;
assert.equal(app.state.accounts.length,1);assert.equal(app.state.accounts[0].openingBalanceCents,0);
assert.equal(app.modal,'transaction');assert.equal(app.accountOnboarding,false);
assert.equal(app.draft.accountId,stored.accounts[0].id);
app.draft.description='Gasto';app.draft.amount='12,34';
const transactionSave=app.save();await app.save();await transactionSave;
assert.equal(stored.transactions.length,1);assert.equal(app.totalBalance,-1234);
await app.reverse(app.state.transactions[0]);await app.reverse(app.state.transactions[0]);
assert.equal(stored.transactions.length,1);assert.equal(app.totalBalance,0);
await app.applyUser(user);
assert.equal(app.modal,null);assert.equal(app.state.accounts.length,1);
app.openModal('transaction');assert.equal(app.draft.accountId,stored.accounts[0].id);app.closeModal();
failRead=true;
await assert.rejects(()=>app.applyUser(user),/Falha ao carregar/);
assert.equal(app.dataReady,false);assert.equal(app.modal,null);
app.openModal('transaction');assert.equal(app.modal,null);

const search=new StockAutocompleteComponent({nativeElement:{contains(){return false;},querySelector(){return null;}}} as never);
search.inputId='test-search';search.value='petr';
const key=(name:string)=>({key:name,isComposing:false,preventDefault(){},stopPropagation(){}} as KeyboardEvent);
search.onKey(key('ArrowUp'));assert.equal(search.activeIndex,1);
search.onKey(key('Enter'));assert.equal(search.value,'PETR3');assert.equal(search.opened,false);
search.value='ZZZZ99';search.open();search.onKey(key('Enter'));assert.equal(search.value,'ZZZZ99');
search.onKey(key('Escape'));assert.equal(search.opened,false);
console.log('Onboarding, save failure/retry, duplicate submission, reversal, reload and autocomplete keyboard checks passed.');
