import { translate } from './i18n/language';
import { TranslatePipe } from './i18n/translate.pipe';
import { Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from './icon.component';

export interface SelectOption { value:string; label:string; description?:string; icon?:string; group?:string; localize?:boolean; }
let sequence = 0;

/** Shared themed selection control; uses the same model contract as a native select. */
@Component({
  selector:'app-select-field', standalone:true, imports:[TranslatePipe,IconComponent],
  providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>SelectFieldComponent),multi:true}],
  template:`
    <button #trigger type="button" class="select-trigger" role="combobox" aria-haspopup="listbox"
      [disabled]="disabled" [attr.aria-label]="ariaLabel" [attr.aria-expanded]="opened"
      [attr.aria-controls]="opened?id:null" [attr.aria-activedescendant]="opened?id+'-'+activeIndex:null"
      (click)="toggle()" (keydown)="onKey($event)" (blur)="onTouched()">
      @if(selected?.icon){<span class="trigger-icon"><app-icon [name]="selected!.icon!"/></span>}
      <span class="selected-label">{{ selected ? optionLabel(selected) : (placeholder | tr) }}</span>
      <app-icon name="chevron-down" class="select-chevron" [class.rotated]="opened"/>
    </button>
    @if(opened){
      <div #menu class="select-menu" [id]="id" role="listbox" [attr.aria-label]="ariaLabel"
        [style.left.px]="left" [style.top.px]="top" [style.bottom.px]="bottom" [style.width.px]="width" [style.max-height.px]="maxHeight">
        @for(option of options;track option.value;let i=$index){
          @if(option.group&&option.group!==options[i-1]?.group){<div class="select-group" role="presentation">{{ (option.group) | tr }}</div>}
          <div role="option" class="select-option" [id]="id+'-'+i" [attr.aria-selected]="value===option.value"
            [class.active]="activeIndex===i" (pointerdown)="$event.preventDefault()" (click)="$event.preventDefault();choose(i)">
            @if(option.icon){<span class="option-icon"><app-icon [name]="option.icon"/></span>}
            <span class="option-copy"><strong>{{ optionLabel(option) }}</strong>@if(option.description){<small>{{ option.localize===false ? option.description : (option.description | tr) }}</small>}</span>
            <span class="option-check">@if(value===option.value){<app-icon name="check"/>}</span>
          </div>
        }@empty{<p class="select-empty">{{ 'Nenhuma opção disponível' | tr }}</p>}
      </div>
    }
  `,
  styles:[`
    :host{display:block;min-width:0;max-width:100%;color:var(--ink)}
    .select-trigger{display:flex;align-items:center;gap:9px;width:100%;min-height:46px;padding:10px 12px;border:1px solid var(--border);border-radius:11px;background:var(--surface-subtle);color:var(--ink);font:inherit;font-size:13px;font-weight:600;text-align:left;cursor:pointer;box-shadow:0 1px 2px #14263505}
    .select-trigger:hover:not(:disabled){border-color:var(--accent)}.select-trigger[aria-expanded=true]{border-color:var(--accent);background:var(--surface)}
    .select-trigger:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.select-trigger:disabled{opacity:.5;cursor:not-allowed}
    .selected-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.trigger-icon{flex:none;color:var(--accent);width:19px;height:19px}.trigger-icon app-icon{width:19px;height:19px}
    .select-chevron{flex:none;width:15px;height:15px;color:var(--text-secondary);transition:transform .15s}.rotated{transform:rotate(180deg)}
    .select-menu{position:fixed;z-index:160;overflow:auto;overscroll-behavior:contain;padding:6px;border:1px solid var(--border);border-radius:13px;background:var(--surface);color:var(--ink);box-shadow:0 12px 36px #0717242e,0 2px 6px #07172412;scrollbar-width:thin;scroll-padding:7px}
    .select-group{padding:10px 11px 7px;color:var(--text-secondary);font-size:10px;line-height:1.4;font-weight:750;letter-spacing:.09em;text-transform:uppercase}
    .select-option{display:flex;align-items:center;gap:10px;min-height:45px;padding:9px 11px;border-radius:7px;cursor:pointer;position:relative}
    .select-option+.select-option{margin-top:3px}.select-option+.select-option:before{content:'';position:absolute;top:-2px;left:11px;right:11px;border-top:1px solid var(--border);opacity:.6}
    .select-option:hover,.select-option.active{background:var(--surface-subtle)}.select-option[aria-selected=true]{background:var(--green-soft);color:var(--accent)}
    .option-icon{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:7px;background:var(--surface-subtle);color:var(--accent)}.option-icon app-icon{width:17px;height:17px}
    .option-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.option-copy strong{font-size:13px;line-height:1.35;font-weight:600;overflow-wrap:anywhere}.option-copy small{font-size:11px;line-height:1.35;color:var(--text-secondary);overflow-wrap:anywhere}
    .option-check{width:16px;height:16px;flex:none;color:var(--accent)}.option-check app-icon{width:16px;height:16px}.select-empty{padding:12px;font-size:12px;color:var(--text-secondary)}
    @media(max-width:700px){.select-trigger{min-height:48px;font-size:15px}.select-option{min-height:48px}.option-copy strong{font-size:15px}.option-copy small{font-size:12px}}
    @media(prefers-reduced-motion:reduce){.select-chevron{transition:none}}
  `]
})
export class SelectFieldComponent implements ControlValueAccessor, OnDestroy {
  @Input() options:readonly SelectOption[]=[];
  @Input() ariaLabel=translate('Selecionar opção');
  @Input() placeholder=translate('Selecione');
  @Input() disabled=false;
  @Output() selectionChange=new EventEmitter<string>();
  @ViewChild('trigger') trigger?:ElementRef<HTMLButtonElement>;
  @ViewChild('menu') menu?:ElementRef<HTMLDivElement>;
  readonly id='select-options-'+ ++sequence;
  value='';opened=false;activeIndex=0;left=0;top:number|null=0;bottom:number|null=null;width=0;maxHeight=320;
  private prefix='';private typedAt=0;private frame=0;
  onChange: (value:string)=>void=()=>{};onTouched:()=>void=()=>{};
  get selected(){return this.options.find(option=>option.value===this.value);}
  optionLabel(option:SelectOption){return option.localize===false?option.label:translate(option.label);}
  writeValue(value:unknown){this.value=typeof value==='string'?value:'';}
  registerOnChange(fn:(value:string)=>void){this.onChange=fn;}
  registerOnTouched(fn:()=>void){this.onTouched=fn;}
  setDisabledState(disabled:boolean){this.disabled=disabled;if(disabled)this.close();}
  toggle(){if(this.opened)this.close();else this.open();}
  open(){
    if(this.disabled||!this.options.length)return;
    this.activeIndex=Math.max(0,this.options.findIndex(option=>option.value===this.value));
    this.opened=true;this.position();this.revealActive();
  }
  private position(){
    const rect=this.trigger?.nativeElement.getBoundingClientRect();if(!rect)return;
    const viewport=window.visualViewport;const bottom=(viewport?.height??window.innerHeight)+(viewport?.offsetTop??0);
    const desired=Math.min(360,this.options.length*60+this.options.filter((o,i)=>o.group&&o.group!==this.options[i-1]?.group).length*32+14);
    const below=bottom-rect.bottom-14,above=rect.top-(viewport?.offsetTop??0)-14;
    const up=below<desired&&above>below;
    this.maxHeight=Math.max(40,Math.min(desired,up?above:below));
    this.width=Math.min(Math.max(rect.width,240),window.innerWidth-24);
    this.left=Math.max(12,Math.min(rect.left,window.innerWidth-this.width-12));
    this.top=up?null:rect.bottom+7;this.bottom=up?window.innerHeight-rect.top+7:null;
  }
  choose(index:number){
    if(this.disabled||!this.options[index])return;
    const value=this.options[index].value;
    if(value!==this.value){this.value=value;this.onChange(value);this.selectionChange.emit(value);}
    this.onTouched();this.close();this.trigger?.nativeElement.focus();
  }
  close(){this.opened=false;this.prefix='';if(this.frame)cancelAnimationFrame(this.frame);}
  onKey(event:KeyboardEvent){
    if(this.disabled)return;
    const key=event.key;
    if(key==='Tab'){this.close();return;}
    if(key==='Escape'&&this.opened){event.preventDefault();event.stopPropagation();this.close();return;}
    if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(key)){
      event.preventDefault();event.stopPropagation();
      if(!this.opened){this.open();if(key==='Home')this.activeIndex=0;if(key==='End')this.activeIndex=this.options.length-1;}
      else if(key==='Enter'||key===' ')this.choose(this.activeIndex);
      else if(key==='Home')this.activeIndex=0;
      else if(key==='End')this.activeIndex=this.options.length-1;
      else this.activeIndex=Math.max(0,Math.min(this.options.length-1,this.activeIndex+(key==='ArrowDown'?1:-1)));
      if(this.opened)this.revealActive();return;
    }
    if(key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();if(!this.opened)this.open();
      const now=Date.now();this.prefix=(now-this.typedAt>700?'':this.prefix)+key;this.typedAt=now;
      const clean=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
      const match=this.options.findIndex(o=>clean(this.optionLabel(o)).startsWith(clean(this.prefix)));
      if(match>=0){this.activeIndex=match;this.revealActive();}
    }
  }
  private revealActive(){if(this.frame)cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>{this.frame=0;this.menu?.nativeElement.querySelector<HTMLElement>('#'+this.id+'-'+this.activeIndex)?.scrollIntoView({block:'nearest'});});}
  @HostListener('document:pointerdown',['$event']) outside(event:PointerEvent){if(this.opened&&!this.trigger?.nativeElement.contains(event.target as Node)&&!this.menu?.nativeElement.contains(event.target as Node))this.close();}
  @HostListener('window:resize') resized(){if(this.opened)this.close();}
  // Capture scrolls from the page and modal while retaining scroll inside the options.
  private scroll=(event:Event)=>{if(this.opened&&!this.menu?.nativeElement.contains(event.target as Node))this.close();};
  constructor(){document.addEventListener('scroll',this.scroll,true);}
  ngOnDestroy(){this.close();document.removeEventListener('scroll',this.scroll,true);}
}
