import { Directive, ElementRef, forwardRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { moneyMaskDigits, moneyMaskModel, moneyMaskPaste, numericEdit, NumericOptions, numericPaste } from './numeric-input';
import { displayNumeric, canonicalNumeric } from './i18n/language';

@Directive({
  selector:'input[appNumeric]',
  standalone:true,
  host:{'type':'text','inputmode':'decimal','autocomplete':'off','spellcheck':'false'},
  providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>NumericInputDirective),multi:true}],
})
export class NumericInputDirective implements ControlValueAccessor {
  @Input() numericDecimals=2;
  @Input() numericAllowNegative=false;
  private moneyMode=false;
  @Input() set numericMoneyMask(value:boolean){
    if(this.moneyMode===value)return;
    this.moneyMode=value;
    this.accepted=(value?moneyMaskModel(this.accepted,this.numericAllowNegative):numericPaste(this.accepted,this.options))??'';
    this.input.value=displayNumeric(this.accepted);
  }
  get numericMoneyMask(){return this.moneyMode;}
  private accepted='';
  private composing=false;
  private onChange:(value:string)=>void=()=>{};
  private onTouched:()=>void=()=>{};
  constructor(private element:ElementRef<HTMLInputElement>){}
  private get input(){return this.element.nativeElement;}
  private get options():NumericOptions{return {decimals:this.numericDecimals,allowNegative:this.numericAllowNegative};}
  writeValue(value:unknown){
    const raw=value===null||value===undefined?'':String(value);
    this.accepted=(this.numericMoneyMask?moneyMaskModel(raw,this.numericAllowNegative):numericEdit(raw,this.options))??'';
    this.input.value=displayNumeric(this.accepted);
  }
  registerOnChange(fn:(value:string)=>void){this.onChange=fn;}
  registerOnTouched(fn:()=>void){this.onTouched=fn;}
  setDisabledState(disabled:boolean){this.input.disabled=disabled;}
  @HostListener('focus') focus(){if(/^-?0(?:,0*)?$/.test(this.accepted))this.input.select();}
  @HostListener('blur') blur(){
    if(this.numericMoneyMask){this.onTouched();return;}
    if(this.accepted==='-')this.commit('');
    else if(this.accepted.endsWith(','))this.commit(this.accepted.slice(0,-1));
    this.onTouched();
  }
  @HostListener('beforeinput',['$event']) beforeInput(event:InputEvent){
    if(this.numericMoneyMask){
      if(this.composing||event.isComposing)return;
      if(event.inputType.startsWith('insert')&&event.data!==null&&moneyMaskDigits(this.replaceSelection(event.data),this.numericAllowNegative)===null)event.preventDefault();
      if(event.inputType==='deleteContentBackward'||event.inputType==='deleteContentForward'){
        const start=this.input.selectionStart??0,end=this.input.selectionEnd??start;
        if(start===end){
          const digits=this.input.value.replace(/\D/g,'');
          const before=this.input.value.slice(0,start).replace(/\D/g,'').length;
          const index=event.inputType==='deleteContentBackward'?before-1:before;
          if(index>=0&&index<digits.length){
            event.preventDefault();
            const remaining=digits.slice(0,index)+digits.slice(index+1);
            const next=remaining.replace(/0/g,'')===''?'':moneyMaskDigits((this.input.value.startsWith('-')?'-':'')+remaining,this.numericAllowNegative);
            if(next!==null){this.commit(next);this.placeMoneyCaret(Math.min(index,next.replace(/\D/g,'').length));}
          }
        }
      }
      return;
    }
    if(this.composing||event.isComposing||!event.inputType.startsWith('insert')||event.data===null)return;
    const candidate=this.replaceSelection(event.data);
    if(numericEdit(candidate,this.options)===null)event.preventDefault();
  }
  @HostListener('input',['$event']) inputChanged(event?:InputEvent){
    if(this.composing)return;
    const raw=this.input.value,caret=this.input.selectionStart??raw.length;
    if(this.numericMoneyMask){
      const digitsBefore=raw.slice(0,caret).replace(/\D/g,'').length;
      const deleting=event?.inputType.startsWith('delete')&&raw.length<this.accepted.length;
      const next=deleting&&raw.replace(/\D/g,'').replace(/0/g,'')===''?'':moneyMaskDigits(raw,this.numericAllowNegative);
      if(next===null){this.input.value=displayNumeric(this.accepted);this.placeMoneyCaret(Math.min(digitsBefore,this.accepted.replace(/\D/g,'').length));return;}
      this.commit(next);if(caret===raw.length)this.input.setSelectionRange(next.length,next.length);else this.placeMoneyCaret(digitsBefore);return;
    }
    const next=numericEdit(raw,this.options);
    if(next===null){this.input.value=displayNumeric(this.accepted);this.input.setSelectionRange(Math.min(caret,this.accepted.length),Math.min(caret,this.accepted.length));return;}
    const nextCaret=Math.max(0,caret-(raw.length-next.length));
    this.commit(next);this.input.setSelectionRange(nextCaret,nextCaret);
  }
  @HostListener('compositionstart') compositionStart(){this.composing=true;}
  @HostListener('compositionend') compositionEnd(){this.composing=false;this.inputChanged();}
  @HostListener('paste',['$event']) paste(event:ClipboardEvent){
    if(!event.clipboardData)return;
    event.preventDefault();this.insertText(event.clipboardData.getData('text'));
  }
  @HostListener('drop',['$event']) drop(event:DragEvent){
    if(!event.dataTransfer)return;
    event.preventDefault();this.insertText(event.dataTransfer.getData('text'));
  }
  private replaceSelection(text:string){const start=this.input.selectionStart??this.input.value.length,end=this.input.selectionEnd??start;return this.input.value.slice(0,start)+text+this.input.value.slice(end);}
  private insertText(raw:string){
    if(this.input.disabled||this.input.readOnly)return;
    const canonical=canonicalNumeric(raw);if(canonical===null)return;
    if(this.numericMoneyMask){
      const pasted=moneyMaskPaste(canonical,this.numericAllowNegative);if(pasted===null)return;
      const wholeSelection=(this.input.selectionStart??0)===0&&(this.input.selectionEnd??0)===this.input.value.length;
      if(!wholeSelection&&this.input.value){
        const candidate=this.replaceSelection(pasted.replace(/\D/g,''));const next=moneyMaskDigits(candidate,this.numericAllowNegative);
        if(next===null)return;this.commit(next);
      }else this.commit(pasted);
      this.input.setSelectionRange(this.input.value.length,this.input.value.length);return;
    }
    const pasted=numericPaste(canonical,this.options);if(pasted===null)return;
    const start=this.input.selectionStart??this.input.value.length;
    const candidate=this.replaceSelection(pasted),next=numericEdit(candidate,this.options);
    if(next===null)return;
    const caret=Math.max(0,start+pasted.length-(candidate.length-next.length));
    this.commit(next);this.input.setSelectionRange(caret,caret);
  }
  private commit(value:string){this.accepted=value;this.input.value=displayNumeric(value);this.onChange(value);}
  private placeMoneyCaret(digitPosition:number){
    if(digitPosition<=0){this.input.setSelectionRange(0,0);return;}
    let digits=0;for(let i=0;i<this.input.value.length;i++){if(/\d/.test(this.input.value[i]))digits++;if(digits===digitPosition){this.input.setSelectionRange(i+1,i+1);return;}}
    this.input.setSelectionRange(this.input.value.length,this.input.value.length);
  }
}
