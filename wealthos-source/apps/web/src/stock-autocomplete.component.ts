import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { matchStockSuggestions, StockSuggestion } from './stock-suggestions';

@Component({
  selector:'app-stock-autocomplete',
  standalone:true,
  template:`
    <label class="symbol-label" [for]="inputId">{{label}}</label>
    <div class="symbol-field" [class.expanded]="opened">
      <svg class="symbol-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5" stroke-linecap="round"/></svg>
      <input [id]="inputId" [name]="inputId" type="text" [value]="value" [disabled]="disabled" [required]="required"
        [placeholder]="placeholder" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="100"
        role="combobox" aria-autocomplete="list" aria-haspopup="listbox" [attr.aria-expanded]="opened"
        [attr.aria-controls]="opened?inputId+'-options':null" [attr.aria-activedescendant]="activeOptionId"
        [attr.aria-describedby]="inputId+'-help'" (input)="onInput($event)" (focus)="open()" (blur)="onBlur($event)" (keydown)="onKey($event)">
      @if(opened){
        <div class="symbol-dropdown">
          <div class="symbol-dropdown-heading">Buscar por nome ou código</div>
          <div [id]="inputId+'-options'" role="listbox" [attr.aria-label]="'Sugestões para '+label">
            @for(stock of suggestions;track stock.ticker;let index=$index){
              <button type="button" role="option" tabindex="-1" [id]="inputId+'-option-'+index"
                [attr.aria-selected]="activeIndex===index" [class.active]="activeIndex===index"
                (pointerdown)="$event.preventDefault()" (click)="choose(stock)">
                <span class="symbol-monogram" aria-hidden="true">{{stock.ticker.slice(0,2)}}</span>
                <span class="symbol-option-text"><strong>{{stock.ticker}}</strong><small>{{stock.name}}</small></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            }
          </div>
          @if(!suggestions.length){<p class="symbol-empty" role="status">Nenhuma sugestão. Você também pode informar o ticker completo.</p>}
          <div class="symbol-directory-note">Catálogo de símbolos · cotações consultadas separadamente</div>
        </div>
      }
    </div>
    <span class="symbol-help" [id]="inputId+'-help'">Digite o nome da empresa ou o ticker. Você pode usar um código fora da lista.</span>
  `,
  styles:[`
    :host{display:block;min-width:0;width:100%;text-align:left}
    .symbol-label{display:block;font-size:12px;font-weight:650;margin:0 0 8px;color:var(--text,#18253d)}
    .symbol-field{position:relative;min-width:0}
    .symbol-field input{box-sizing:border-box;width:100%;min-width:0;min-height:48px;margin:0;padding:12px 14px 12px 42px;border:1px solid var(--border,#dce3ee);border-radius:12px;background:var(--surface,#fff);color:var(--text,#18253d);font:inherit;font-size:16px;line-height:1.4;outline:none}
    .symbol-field input:focus{border-color:var(--primary,#4169e1);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary,#4169e1) 14%,transparent)}
    .symbol-field input:disabled{opacity:.6;cursor:wait}
    .symbol-search{position:absolute;left:14px;top:14px;width:20px;height:20px;color:var(--muted,#63708a);pointer-events:none}
    .symbol-dropdown{position:absolute;z-index:45;left:0;right:0;top:calc(100% + 6px);overflow:hidden;border:1px solid var(--border,#dce3ee);border-radius:14px;background:var(--surface,#fff);color:var(--text,#18253d);box-shadow:0 16px 40px #0e193027}
    .symbol-dropdown-heading,.symbol-directory-note{padding:10px 12px;font-size:10px;font-weight:600;line-height:1.5;color:var(--muted,#63708a)}
    .symbol-dropdown-heading{border-bottom:1px solid var(--border,#dce3ee);text-transform:uppercase;letter-spacing:.07em}
    [role=listbox]{max-height:min(280px,38dvh);overflow-y:auto;overscroll-behavior:contain}
    button{display:flex;align-items:center;gap:10px;width:100%;min-height:58px;padding:10px 12px;border:0;border-radius:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
    button:hover,button.active{background:color-mix(in srgb,var(--primary,#4169e1) 9%,var(--surface,#fff))}
    button+button{border-top:1px solid color-mix(in srgb,var(--border,#dce3ee) 65%,transparent)}
    button>svg{flex:none;width:16px;height:16px;color:var(--muted,#63708a)}
    .symbol-monogram{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:10px;background:color-mix(in srgb,var(--primary,#4169e1) 10%,var(--surface,#fff));color:var(--primary,#4169e1);font-size:11px;font-weight:750}
    .symbol-option-text{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.symbol-option-text strong{font-size:13px;font-weight:750}.symbol-option-text small{font-size:11px;color:var(--muted,#63708a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .symbol-empty{margin:0;padding:16px 12px;font-size:12px;line-height:1.6}.symbol-directory-note{border-top:1px solid var(--border,#dce3ee);font-weight:400}
    .symbol-help{display:block;font-size:10px;line-height:1.5;color:var(--muted,#63708a);margin-top:6px}
    @media(max-width:480px){.symbol-dropdown-heading{font-size:9px}.symbol-directory-note{font-size:9px}.symbol-help{font-size:11px}}
  `],
})
export class StockAutocompleteComponent {
  @Input({required:true}) inputId='';
  @Input() label='Ação';
  @Input() placeholder='Ticker ou nome da empresa';
  @Input() value='';
  @Input() disabled=false;
  @Input() required=false;
  @Output() valueChange=new EventEmitter<string>();
  @Output() selected=new EventEmitter<StockSuggestion>();
  opened=false;
  activeIndex=-1;
  constructor(private element:ElementRef<HTMLElement>){}
  get suggestions(){return matchStockSuggestions(this.value);}
  get activeOptionId(){return this.opened&&this.activeIndex>=0?this.inputId+'-option-'+this.activeIndex:null;}
  open(){if(!this.disabled){this.opened=true;this.activeIndex=-1;}}
  onInput(event:Event){this.value=(event.target as HTMLInputElement).value;this.valueChange.emit(this.value);this.open();}
  choose(stock:StockSuggestion){this.value=stock.ticker;this.valueChange.emit(stock.ticker);this.opened=false;this.activeIndex=-1;this.selected.emit(stock);}
  onBlur(event:FocusEvent){if(!event.relatedTarget||!this.element.nativeElement.contains(event.relatedTarget as Node)){this.opened=false;this.activeIndex=-1;}}
  @HostListener('document:pointerdown',['$event']) outside(event:PointerEvent){if(!this.element.nativeElement.contains(event.target as Node)){this.opened=false;this.activeIndex=-1;}}
  onKey(event:KeyboardEvent){
    if(event.isComposing)return;
    const rows=this.suggestions;
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();this.opened=true;
      if(rows.length){this.activeIndex=this.activeIndex<0?(event.key==='ArrowDown'?0:rows.length-1):(this.activeIndex+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length;queueMicrotask(()=>this.element.nativeElement.querySelector<HTMLElement>('[id="'+this.activeOptionId+'"]')?.scrollIntoView({block:'nearest'}));}
    }else if(event.key==='Enter'&&this.opened&&this.activeIndex>=0&&rows[this.activeIndex]){event.preventDefault();this.choose(rows[this.activeIndex]);}
    else if(event.key==='Escape'&&this.opened){event.preventDefault();event.stopPropagation();this.opened=false;this.activeIndex=-1;}
    else if(event.key==='Tab'){this.opened=false;this.activeIndex=-1;}
  }
}
