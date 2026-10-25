import '../../wealthos-source/node_modules/@angular/compiler/fesm2022/compiler.mjs';
import assert from 'node:assert/strict';
import {NumericInputDirective} from '../../wealthos-source/apps/web/src/numeric-input.directive';

// A native input's selection/editing contract, with the real directive and CVA callbacks.
const input={value:'',selectionStart:0,selectionEnd:0,disabled:false,readOnly:false,
  select(){this.selectionStart=0;this.selectionEnd=this.value.length;},
  setSelectionRange(start:number,end:number){this.selectionStart=start;this.selectionEnd=end;},
};
const directive=new NumericInputDirective({nativeElement:input} as never);
let model='',changes=0,touches=0;
directive.registerOnChange(value=>{model=value;changes++;});
directive.registerOnTouched(()=>touches++);
function type(text:string,inputType='insertText'){
  let prevented=false;
  directive.beforeInput({inputType,data:text,isComposing:false,preventDefault(){prevented=true;}} as InputEvent);
  if(!prevented){
    const start=input.selectionStart,end=input.selectionEnd;
    input.value=input.value.slice(0,start)+text+input.value.slice(end);
    input.setSelectionRange(start+text.length,start+text.length);directive.inputChanged();
  }
  return prevented;
}
function paste(text:string){let prevented=false;directive.paste({clipboardData:{getData(){return text;}},preventDefault(){prevented=true;}} as unknown as ClipboardEvent);assert.equal(prevented,true);}
directive.writeValue('0');assert.equal(changes,0);directive.focus();type('5');
assert.equal(input.value,'5');assert.equal(model,'5');assert.equal(input.selectionStart,1);
directive.writeValue('0,00');directive.focus();type('2');assert.equal(model,'2');
type(',');type('0');type('5');assert.equal(model,'2,05');assert.equal(input.selectionStart,4);
assert.equal(type('8'),true);assert.equal(model,'2,05');
assert.equal(type('e'),true);assert.equal(model,'2,05');
input.select();paste('1e3');assert.equal(input.value,'2,05');assert.equal(model,'2,05');
paste('R$ 1.234,56');assert.equal(model,'1234,56');assert.equal(input.selectionStart,7);
// Mobile/autofill or noncancelable input still cannot put text in the ngModel.
input.value='bad';directive.inputChanged();assert.equal(input.value,'1234,56');assert.equal(model,'1234,56');
directive.writeValue('0005');assert.equal(input.value,'5');input.setSelectionRange(0,0);type('0');assert.equal(input.value,'5');assert.equal(input.selectionStart,0);
directive.writeValue('0');directive.focus();type(',');type('0');type('7');assert.equal(model,'0,07');
directive.writeValue('12');input.setSelectionRange(1,1);type('3');assert.equal(model,'132');assert.equal(input.selectionStart,2);
directive.writeValue('');assert.equal(type('-'),true);
directive.numericAllowNegative=true;type('-');type('5');assert.equal(model,'-5');
directive.writeValue('-');directive.blur();assert.equal(model,'');assert.equal(touches,1);
directive.numericDecimals=6;directive.numericAllowNegative=false;directive.writeValue('0');directive.focus();paste('0,000001');assert.equal(model,'0,000001');
const before=model;input.select();directive.compositionStart();input.value='あ';directive.inputChanged();assert.equal(model,before);directive.compositionEnd();assert.equal(input.value,before);assert.equal(model,before);
directive.setDisabledState(true);input.select();paste('5');assert.equal(model,before);
directive.setDisabledState(false);input.readOnly=true;paste('5');assert.equal(model,before);
input.readOnly=false;directive.numericMoneyMask=true;directive.numericDecimals=2;
directive.writeValue('');
for(const digit of '232323')type(digit);
assert.equal(model,'2.323,23');assert.equal(input.selectionStart,input.value.length);
let deletionPrevented=false;directive.beforeInput({inputType:'deleteContentBackward',data:null,isComposing:false,preventDefault(){deletionPrevented=true;}} as InputEvent);
assert.equal(deletionPrevented,true);assert.equal(model,'232,32');
type('3');assert.equal(model,'2.323,23');
assert.equal(type('a'),true);assert.equal(model,'2.323,23');
input.select();paste('R$ 1.234,56');assert.equal(model,'1.234,56');
input.select();paste('1e3');assert.equal(model,'1.234,56');
directive.writeValue('0');directive.focus();type('5');assert.equal(model,'0,05');
directive.numericAllowNegative=true;directive.writeValue('-12,34');assert.equal(input.value,'-12,34');
console.log('Numeric directive typing, zero, caret, paste, model, composition and disabled checks passed.');
