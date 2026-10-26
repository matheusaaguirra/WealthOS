import { Component, ElementRef, HostListener, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-category-picker',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="category-field">
      <span class="category-label" id="category-label-{{id}}">Categoria</span>
      <details #picker class="category-picker" (keydown.escape)="close($event)">
        <summary #trigger [attr.aria-labelledby]="'category-label-'+id" aria-haspopup="listbox">
          <span class="chosen-icon"><app-icon [name]="icon(value)"/></span>
          <span class="chosen-name">{{value}}</span>
          <app-icon name="chevron-down" class="chevron"/>
        </summary>
        <div class="category-options" role="listbox" [attr.aria-label]="'Categoria'">
          <div class="group-label">Despesas</div>
          @for (item of expense; track item) {
            <button type="button" role="option" [attr.aria-selected]="value===item" (click)="choose(item,trigger)">
              <span class="option-icon"><app-icon [name]="icon(item)"/></span><span>{{item}}</span>
              @if (value===item) { <app-icon name="check" class="option-check"/> }
            </button>
          }
          <div class="group-label income-label">Receitas</div>
          @for (item of income; track item) {
            <button type="button" role="option" [attr.aria-selected]="value===item" (click)="choose(item,trigger)">
              <span class="option-icon"><app-icon [name]="icon(item)"/></span><span>{{item}}</span>
              @if (value===item) { <app-icon name="check" class="option-check"/> }
            </button>
          }
        </div>
      </details>
    </div>
  `,
  styles: [`
    :host{display:block;margin-bottom:18px}.category-field{position:relative}.category-label{display:block;margin-bottom:8px;font-size:12px;font-weight:650;color:var(--ink)}
    .category-picker{position:relative}.category-picker summary{list-style:none;display:flex;align-items:center;gap:11px;min-height:48px;padding:6px 13px 6px 7px;border:1px solid var(--border);border-radius:10px;background:var(--surface-subtle);color:var(--ink);cursor:pointer;font-size:14px;font-weight:650}
    .category-picker summary::-webkit-details-marker{display:none}.category-picker summary:focus-visible{outline:2px solid #5a91c7;outline-offset:2px}.category-picker[open] summary{border-color:var(--accent);background:var(--surface)}
    .chosen-icon,.option-icon{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:8px;background:var(--green-soft);color:var(--accent)}
    .chosen-icon app-icon,.option-icon app-icon{width:17px;height:17px}.chosen-name{flex:1}.chevron{width:16px;height:16px;color:var(--text-secondary);transition:transform .15s}.category-picker[open] .chevron{transform:rotate(180deg)}
    .category-options{position:absolute;z-index:10;top:calc(100% + 5px);left:0;right:0;max-height:min(340px,50dvh);overflow-y:auto;padding:5px;background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 14px 36px #172d4029}
    .group-label{padding:10px 12px 6px;color:var(--text-secondary);font-size:10px;font-weight:750;letter-spacing:.09em;text-transform:uppercase}.income-label{margin-top:5px;border-top:1px solid var(--border)}
    .category-options button{display:flex;align-items:center;gap:11px;width:100%;min-height:46px;padding:6px 9px;text-align:left;border:0;border-bottom:1px solid var(--border);border-radius:0;background:transparent;color:var(--ink);font-size:13px;font-weight:600}
    .category-options button:last-child{border-bottom:0}.category-options button:hover,.category-options button:focus-visible{background:var(--surface-subtle)}.category-options button[aria-selected=true]{color:var(--accent);background:var(--green-soft)}
    .option-icon{width:30px;height:30px;background:var(--surface-subtle)}.option-check{width:16px;height:16px;margin-left:auto}
    @media(max-width:700px){.category-picker summary{min-height:50px;font-size:16px}.category-options{max-height:min(310px,42dvh)}.category-options button{min-height:48px;font-size:15px}}
  `]
})
export class CategoryPickerComponent {
  @Input() value = 'Alimentação';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('picker') picker?: ElementRef<HTMLDetailsElement>;
  readonly id = Math.random().toString(36).slice(2);
  readonly expense = ['Alimentação','Moradia','Transporte','Compras','Saúde','Lazer','Educação','Outros'];
  readonly income = ['Salário','Freelance'];
  icon(item: string) { return ({'Alimentação':'food','Moradia':'home','Transporte':'car','Compras':'bag','Saúde':'heart','Lazer':'sparkles','Educação':'book','Salário':'income','Freelance':'briefcase'} as Record<string,string>)[item] || 'circle'; }
  choose(item: string, trigger: HTMLElement) { this.valueChange.emit(item); this.picker!.nativeElement.open = false; trigger.focus(); }
  close(event: Event) { event.stopPropagation(); if (this.picker?.nativeElement.open) { this.picker.nativeElement.open = false; this.picker.nativeElement.querySelector('summary')?.focus(); } }
  @HostListener('document:click', ['$event']) outside(event: MouseEvent) { const picker = this.picker?.nativeElement; if (picker?.open && !picker.contains(event.target as Node)) picker.open = false; }
}
