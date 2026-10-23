import { Directive, ElementRef, forwardRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { numericEdit, NumericOptions, numericPaste } from './numeric-input';

@Directive({
  selector:'input[appNumeric]',
  standalone:true,
  host:{'type':'text','inputmode':'decimal','autocomplete':'off','spellcheck':'false'},
  providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>NumericInputDirective),multi:true}],
})
export class NumericInputDirective implements ControlValueAccessor {
  @Input() numericDecimals=2;
  @Input() numericAllowNegative=false;
  private accepted='';
  private composing=false;
  private onChange:(value:string)=>void=()=>{};
  private onTouched:()=>void=()=>{};
  constructor(private element:ElementRef<HTMLInputElement>){}
  private get input(){return this.element.nativeElement;}
  private get options():NumericOptions{return {decimals:this.numericDecimals,allowNegative:this.numericAllowNegative};}
  writeValue(value:unknown){
    const raw=value===null||value===undefined?'':String(value);
    this.accepted=numericEdit(raw,this.options)??'';
    this.input.value=this.accepted;
  }
  registerOnChange(fn:(value:string)=>void){this.onChange=fn;}
  registerOnTouched(fn:()=>void){this.onTouched=fn;}
  setDisabledState(disabled:boolean){this.input.disabled=disabled;}
  @HostListener('focus') focus(){if(/^-?0(?:,0*)?$/.test(this.input.value))this.input.select();}
  @HostListener('blur') blur(){
    if(this.accepted==='-')this.commit('');
    else if(this.accepted.endsWith(','))this.commit(this.accepted.slice(0,-1));
    this.onTouched();
  }
  @HostListener('beforeinput',['$event']) beforeInput(event:InputEvent){
    if(this.composing||event.isComposing||!event.inputType.startsWith('insert')||event.data===null)return;
    const candidate=this.replaceSelection(event.data);
    if(numericEdit(candidate,this.options)===null)event.preventDefault();
  }
  @HostListener('input') inputChanged(){
    if(this.composing)return;
    const raw=this.input.value,caret=this.input.selectionStart??raw.length;
    const next=numericEdit(raw,this.options);
    if(next===null){this.input.value=this.accepted;this.input.setSelectionRange(Math.min(caret,this.accepted.length),Math.min(caret,this.accepted.length));return;}
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
    const pasted=numericPaste(raw,this.options);if(pasted===null)return;
    const start=this.input.selectionStart??this.input.value.length;
    const candidate=this.replaceSelection(pasted),next=numericEdit(candidate,this.options);
    if(next===null)return;
    const caret=Math.max(0,start+pasted.length-(candidate.length-next.length));
    this.commit(next);this.input.setSelectionRange(caret,caret);
  }
  private commit(value:string){this.accepted=value;this.input.value=value;this.onChange(value);}
}
