import { formatLocale, translate } from './i18n/language';
import { TranslatePipe } from './i18n/translate.pipe';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, OnDestroy, NgZone, Optional } from '@angular/core';
import { matchStockSuggestions, StockSuggestion, listedAssetLabel } from './stock-suggestions';
import { marketApi } from './services/site-api';

@Component({
  selector:'app-stock-autocomplete',
  standalone:true, imports:[TranslatePipe],
  template:`
    <label class="symbol-label" [for]="inputId">{{ (label) | tr }}</label>
    <div class="symbol-field" [class.expanded]="opened">
      <svg class="symbol-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5" stroke-linecap="round"/></svg>
      <input [id]="inputId" [name]="inputId" type="text" [value]="value" [disabled]="disabled" [required]="required"
        [placeholder]="(placeholder) | tr" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="80"
        role="combobox" aria-autocomplete="list" aria-haspopup="listbox" [attr.aria-expanded]="opened"
        [attr.aria-controls]="opened?inputId+'-options':null" [attr.aria-activedescendant]="activeOptionId"
        [attr.aria-describedby]="inputId+'-help'" (input)="onInput($event)" (focus)="open()" (blur)="onBlur($event)" (keydown)="onKey($event)">
      @if(opened){
        <div class="symbol-dropdown">
          <div class="symbol-dropdown-heading">{{ 'Ações · FIIs · ETFs · BDRs' | tr }}</div>
          <div [id]="inputId+'-options'" role="listbox" [attr.aria-label]="'Sugestões para {0}' | tr:[label]">
            @for(stock of suggestions;track stock.ticker;let index=$index){
              <button type="button" role="option" tabindex="-1" [id]="inputId+'-option-'+index"
                [attr.aria-selected]="activeIndex===index" [class.active]="activeIndex===index"
                (pointerdown)="$event.preventDefault()" (click)="choose(stock)">
                <span class="symbol-monogram" aria-hidden="true">{{ stock.ticker.slice(0,2) }}</span>
                <span class="symbol-option-text"><strong>{{ stock.ticker }}</strong><small>{{ stock.name }}</small><span class="symbol-type">{{ (assetLabel(stock)) | tr }}</span></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            }
          </div>
          @if(loading){<p class="symbol-empty" role="status">{{ 'Buscando no catálogo…' | tr }}</p>}
          @else if(!suggestions.length){<p class="symbol-empty" role="status">{{ 'Nenhum ativo encontrado. Você também pode informar o ticker completo.' | tr }}</p>}
          @if(hasMore&&!fallback){<button type="button" class="symbol-load-more" [disabled]="loading" (click)="loadMore()" (blur)="onBlur($event)" (keydown)="onMoreKey($event)">{{ '{0} ({1} de {2})' | tr:[((loading?('Carregando…' | tr):('Carregar mais ativos' | tr)) | tr),((suggestions.length) | tr),((total) | tr)] }}</button>}
          <div class="symbol-directory-note" role="status">{{ (directoryNote) | tr }}</div>
        </div>
      }
    </div>
    <span class="symbol-help" [id]="inputId+'-help'">{{ 'Busque pelo nome ou ticker. Lista paginada de ativos cobertos pela fonte; cotação consultada separadamente.' | tr }}</span>
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
    .symbol-type{font-size:10px;line-height:1.2;color:var(--primary,#4169e1);font-weight:650}.symbol-load-more{justify-content:center;min-height:48px;font-size:12px;font-weight:650;border-top:1px solid var(--border,#dce3ee);color:var(--primary,#4169e1)}.symbol-load-more:disabled{opacity:.6;cursor:wait}.symbol-empty{margin:0;padding:16px 12px;font-size:12px;line-height:1.6}.symbol-directory-note{border-top:1px solid var(--border,#dce3ee);font-weight:400}
    .symbol-help{display:block;font-size:10px;line-height:1.5;color:var(--muted,#63708a);margin-top:6px}
    @media(max-width:480px){.symbol-dropdown-heading{font-size:9px}.symbol-directory-note{font-size:9px}.symbol-help{font-size:11px}}
  `],
})
export class StockAutocompleteComponent implements OnDestroy {
  @Input({required:true}) inputId='';
  @Input() label=translate('Ativo listado');
  @Input() placeholder=translate('Ticker ou nome da empresa');
  @Input() value='';
  @Input() disabled=false;
  @Input() required=false;
  @Output() valueChange=new EventEmitter<string>();
  @Output() selected=new EventEmitter<StockSuggestion>();
  opened=false;
  activeIndex=-1;
  loading=false;
  fallback=true;
  hasMore=false;
  total=0;
  error='';
  retrievedAt='';
  omittedCount=0;
  private rows:StockSuggestion[]=[];
  private loadedQuery:string|null=null;
  private loadedPage=0;
  private sequence=0;
  private timer:ReturnType<typeof setTimeout>|undefined;
  private request:AbortController|undefined;
  constructor(private element:ElementRef<HTMLElement>,@Optional() private zone:NgZone|null=null){}
  get suggestions(){return !this.fallback&&this.loadedQuery===this.value.trim()?this.rows:matchStockSuggestions(this.value,200);}
  get activeOptionId(){return this.opened&&this.activeIndex>=0?this.inputId+'-option-'+this.activeIndex:null;}
  get directoryNote(){
    if(this.fallback)return this.error?translate('Catálogo online indisponível. Mostrando uma lista local parcial; digite um ticker se precisar.'):translate('Sugestões locais parciais enquanto consultamos o catálogo BRAPI.');
    if(this.error)return translate('Não foi possível carregar mais ativos. Tente novamente; os resultados anteriores foram mantidos.');
    const time=this.retrievedAt?new Intl.DateTimeFormat(formatLocale(),{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(this.retrievedAt)):'';
    return 'BRAPI · '+translate('{0} de {1} resultados',[this.rows.length,this.total])+(time?' '+translate('· consultado às')+' '+time:'')+translate('. Cobertura conforme a fonte.')+(this.omittedCount?' '+this.omittedCount+' '+translate('registro(s) incompatível(is) ou repetido(s) não exibido(s).'):'');
  }
  assetLabel(stock:StockSuggestion){return listedAssetLabel(stock.assetType);}
  open(){if(!this.disabled){this.opened=true;this.activeIndex=-1;this.scheduleSearch();}}
  onInput(event:Event){this.value=(event.target as HTMLInputElement).value;this.valueChange.emit(this.value);this.open();}
  choose(stock:StockSuggestion){this.value=stock.ticker;this.valueChange.emit(stock.ticker);this.close();this.selected.emit(stock);}
  onBlur(event:FocusEvent){if(!event.relatedTarget||!this.element.nativeElement.contains(event.relatedTarget as Node))this.close();}
  @HostListener('document:pointerdown',['$event']) outside(event:PointerEvent){if(!this.element.nativeElement.contains(event.target as Node))this.close();}
  private update(action:()=>void){if(this.zone)this.zone.run(action);else action();}
  private cancel(){clearTimeout(this.timer);this.timer=undefined;this.request?.abort();this.request=undefined;this.sequence++;}
  private close(){this.opened=false;this.activeIndex=-1;this.cancel();this.loading=false;}
  ngOnDestroy(){this.cancel();}
  private scheduleSearch(){
    this.cancel();
    if(!this.fallback&&this.loadedQuery===this.value.trim()){this.loading=false;return;}
    this.loading=true;this.error='';this.fallback=true;this.hasMore=false;
    const version=this.sequence;
    this.timer=setTimeout(()=>{this.timer=undefined;void this.fetchPage(1,version);},200);
  }
  async loadMore(){if(this.loading||!this.hasMore||this.fallback)return;this.cancel();await this.fetchPage(this.loadedPage+1,this.sequence);}
  private async fetchPage(page:number,version:number){
    const query=this.value.trim();const controller=new AbortController();this.request=controller;this.loading=true;
    try{
      const data=await marketApi.symbols(query,page,controller.signal);
      if(version!==this.sequence||!this.opened||query!==this.value.trim())return;
      this.update(()=>{
        const candidates=page===1?data.symbols:[...this.rows,...data.symbols];
        this.rows=[...new Map(candidates.map(row=>[row.ticker,row])).values()];
        this.loadedQuery=query;this.loadedPage=data.page;this.total=data.total;this.hasMore=data.hasMore;this.retrievedAt=data.retrievedAt;this.omittedCount=(page===1?0:this.omittedCount)+(data.omittedCount??0);this.fallback=false;this.error='';
        if(page===1)this.activeIndex=-1;
      });
    }catch(error){
      if(version!==this.sequence||controller.signal.aborted)return;
      this.update(()=>{this.error=error instanceof Error?error.message:translate('Catálogo indisponível.');if(page===1){this.fallback=true;this.hasMore=false;}else this.hasMore=true;});
    }finally{if(version===this.sequence)this.update(()=>{this.loading=false;this.request=undefined;});}
  }
  onMoreKey(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.element.nativeElement.querySelector<HTMLInputElement>('input')?.focus();this.close();}}
  onKey(event:KeyboardEvent){
    if(event.isComposing)return;
    const rows=this.suggestions;
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();if(!this.opened)this.open();
      if(rows.length){this.activeIndex=this.activeIndex<0?(event.key==='ArrowDown'?0:rows.length-1):(this.activeIndex+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length;queueMicrotask(()=>this.element.nativeElement.querySelector<HTMLElement>('[id="'+this.activeOptionId+'"]')?.scrollIntoView({block:'nearest'}));}
    }else if(event.key==='Enter'&&this.opened&&this.activeIndex>=0&&rows[this.activeIndex]){event.preventDefault();this.choose(rows[this.activeIndex]);}
    else if(event.key==='Escape'&&this.opened){event.preventDefault();event.stopPropagation();this.close();}
  }
}
