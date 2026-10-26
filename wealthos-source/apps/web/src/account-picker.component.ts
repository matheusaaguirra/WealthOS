import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { IconComponent } from './icon.component';

export interface PickerAccount { id:string; name:string; institution:string; color:string; }

@Component({
  selector: 'app-account-picker', standalone: true, imports: [IconComponent],
  template: `
    <div class="account-field">
      <span class="field-label" id="account-label-{{id}}">Conta</span>
      <details #picker [class.open-up]="openUp" (toggle)="positionMenu()" (keydown.escape)="close($event)">
        <summary #trigger [attr.aria-labelledby]="'account-label-'+id">
          @if (selected) {
            <span class="account-symbol" [style.border-color]="selected.color"><app-icon name="accounts"/></span>
            <span class="account-copy"><strong>{{selected.name}}</strong><small>{{selected.institution}}</small></span>
          } @else {
            <span class="account-symbol"><app-icon name="accounts"/></span><span class="account-copy"><strong>Selecione uma conta</strong></span>
          }
          <app-icon name="chevron-down" class="chevron"/>
        </summary>
        <div class="account-options" aria-label="Contas disponíveis">
          <div class="options-label">SUAS CONTAS · {{accounts.length}}</div>
          @for (account of accounts; track account.id) {
            <button type="button" [attr.aria-pressed]="value===account.id" (click)="choose(account.id,trigger)">
              <span class="account-symbol" [style.border-color]="account.color"><app-icon name="accounts"/></span>
              <span class="account-copy"><strong>{{account.name}}</strong><small>{{account.institution}}</small></span>
              @if(value===account.id){<app-icon name="check" class="selected-check"/>}
            </button>
          } @empty { <p class="empty-account">Adicione uma conta para registrar lançamentos.</p> }
        </div>
      </details>
    </div>
  `,
  styles: [`
    :host{display:block;margin-bottom:18px}.account-field{position:relative}.field-label{display:block;margin-bottom:8px;color:var(--ink);font-size:12px;font-weight:650}
    details{position:relative}summary{list-style:none;display:flex;align-items:center;gap:11px;min-height:54px;padding:6px 13px 6px 7px;border:1px solid var(--border);border-radius:10px;background:var(--surface-subtle);color:var(--ink);cursor:pointer}
    summary::-webkit-details-marker{display:none}summary:focus-visible{outline:2px solid #5a91c7;outline-offset:2px}details[open] summary{border-color:var(--accent);background:var(--surface)}
    .account-symbol{flex:none;display:grid;place-items:center;width:36px;height:36px;border:1px solid var(--accent);border-radius:8px;background:var(--green-soft);color:var(--accent)}.account-symbol app-icon{width:18px;height:18px}
    .account-copy{min-width:0;flex:1;display:flex;flex-direction:column;line-height:1.3}.account-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:700}.account-copy small{margin-top:2px;color:var(--text-secondary);font-size:11px;font-weight:500}
    .chevron{width:16px;height:16px;color:var(--text-secondary);transition:transform .15s}details[open] .chevron{transform:rotate(180deg)}
    .account-options{position:absolute;z-index:10;top:calc(100% + 5px);left:0;right:0;max-height:min(310px,45dvh);overflow-y:auto;padding:5px;background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 14px 36px #172d4029}.open-up .account-options{top:auto;bottom:calc(100% + 5px)}
    .options-label{padding:9px 12px;color:var(--text-secondary);font-size:10px;font-weight:750;letter-spacing:.08em}.account-options button{display:flex;align-items:center;gap:11px;width:100%;min-height:58px;padding:7px 10px;border:0;border-bottom:1px solid var(--border);border-radius:0;background:transparent;color:var(--ink);text-align:left}
    .account-options button:last-child{border-bottom:0}.account-options button:hover,.account-options button:focus-visible{background:var(--surface-subtle)}.account-options button[aria-pressed=true]{background:var(--green-soft)}.selected-check{width:16px;height:16px;color:var(--accent)}.empty-account{padding:12px;color:var(--text-secondary);font-size:12px}
    @media(max-width:700px){summary{min-height:54px}.account-copy strong{font-size:15px}.account-options button{min-height:62px}}
  `]
})
export class AccountPickerComponent {
  @Input() accounts: PickerAccount[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('picker') picker?: ElementRef<HTMLDetailsElement>;
  readonly id = Math.random().toString(36).slice(2);
  openUp = false;
  get selected() { return this.accounts.find(account => account.id === this.value); }
  choose(id:string, trigger:HTMLElement) { this.valueChange.emit(id); this.picker!.nativeElement.open = false; trigger.focus(); }
  positionMenu() {
    const picker = this.picker?.nativeElement;
    if (!picker?.open) return;
    const frame = picker.closest('.dialog')?.getBoundingClientRect();
    const field = picker.getBoundingClientRect();
    const height = picker.querySelector('.account-options')?.getBoundingClientRect().height ?? 0;
    this.openUp = !!frame && frame.bottom - field.bottom < height + 8 && field.top - frame.top > frame.bottom - field.bottom;
  }
  close(event:Event) { event.stopPropagation(); if(this.picker?.nativeElement.open){this.picker.nativeElement.open=false;this.picker.nativeElement.querySelector('summary')?.focus();} }
  @HostListener('document:click', ['$event']) outside(event:MouseEvent) { const picker=this.picker?.nativeElement;if(picker?.open&&!picker.contains(event.target as Node))picker.open=false; }
}
