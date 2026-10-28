import '../../wealthos-source/node_modules/@angular/compiler/fesm2022/compiler.mjs';
import assert from 'node:assert/strict';
import { AppComponent } from '../../wealthos-source/apps/web/src/app.component';
import { NumericInputDirective } from '../../wealthos-source/apps/web/src/numeric-input.directive';
import { SelectFieldComponent } from '../../wealthos-source/apps/web/src/select-field.component';
import { initializeLanguage, translate } from '../../wealthos-source/apps/web/src/i18n/language';

const location = { search:'?lang=en' };
Object.defineProperty(globalThis, 'navigator', { configurable:true,value:{languages:['en-US'],language:'en-US'} });
Object.assign(globalThis,{window:{location},document:{cookie:'',title:'',documentElement:{lang:'',dataset:{}},addEventListener(){},removeEventListener(){}},localStorage:{getItem(){return null;},setItem(){}}});
const input={value:'',selectionStart:0,selectionEnd:0,disabled:false,readOnly:false,select(){this.selectionStart=0;this.selectionEnd=this.value.length;},setSelectionRange(start:number,end:number){this.selectionStart=start;this.selectionEnd=end;}};
for(const lang of ['en','es']) {
  location.search='?lang='+lang;await initializeLanguage();
  const field=new NumericInputDirective({nativeElement:input} as never);field.numericMoneyMask=true;
  let model='';field.registerOnChange(value=>model=value);field.writeValue('1234,56');assert.equal(input.value,'1,234.56');
  input.select();field.paste({clipboardData:{getData(){return 'R$ 2,345.67';}},preventDefault(){}} as unknown as ClipboardEvent);
  assert.equal(input.value,'2,345.67');assert.equal(model,'2.345,67');
  input.value='';field.inputChanged();assert.equal(input.value,'');assert.equal(model,'');
  const picker=new SelectFieldComponent();
  assert.equal(picker.optionLabel({value:'account-id',label:'Minha conta',localize:false}),'Minha conta');
  assert.equal(picker.optionLabel({value:'ALL',label:'Todas as contas'}),translate('Todas as contas'));
  picker.ngOnDestroy();
}

class LocalizedApp extends AppComponent {override async initializeAuth(){}}
location.search='?lang=en';await initializeLanguage();
const app=new LocalizedApp({} as never);app.month='2026-10';
app.state={accounts:[{id:'account',name:'Minha conta',institution:'Banco',color:'#123456',openingBalanceCents:0}],transactions:[{id:'tx',idempotencyKey:'tx',accountId:'account',description:'Compras',category:'Alimentação',type:'EXPENSE',date:'2026-10-28',amountCents:12345}],budgets:[],goals:[]};
const previous=JSON.stringify(app.state);app.search='Food';assert.equal(app.filteredTransactions.length,1);assert.equal(JSON.stringify(app.state),previous);
