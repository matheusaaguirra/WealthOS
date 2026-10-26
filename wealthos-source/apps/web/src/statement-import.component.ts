import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { parseStatementLines, statementFingerprint, type StatementCandidate } from './statement-parser';

export interface ImportedStatementRow extends StatementCandidate { accountId: string; }
export interface StatementAccount { id: string; name: string; }
export interface ExistingStatementRow extends StatementCandidate { accountId: string; reversedAt?: string|null; }
interface ReviewRow extends StatementCandidate { selected: boolean; duplicate: boolean; }

@Component({
  selector: 'app-statement-import', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <section class="statement-import panel" aria-labelledby="statement-title">
      <div class="panel-heading"><div><h2 id="statement-title">Importar extrato</h2><p>Selecione a conta, carregue o PDF e confira cada linha antes de salvar.</p></div></div>
      <div class="statement-controls">
        <label>Conta do extrato
          <select [(ngModel)]="accountId" (ngModelChange)="markDuplicates()" [disabled]="busy">
            <option value="">Selecione uma conta</option>
            @for (account of accounts; track account.id) { <option [value]="account.id">{{account.name}}</option> }
          </select>
        </label>
        <label>Extrato em PDF (até 10 MB e 20 páginas)
          <input type="file" accept="application/pdf,.pdf" (change)="readFile($event)" [disabled]="busy || !accountId">
        </label>
      </div>
      <p class="statement-hint">Leitura no navegador. PDFs digitalizados como imagem e lançamentos ambíguos precisam ser conferidos manualmente.</p>
      @if (busy) { <p role="status">Lendo o extrato…</p> }
      @if (error) { <p role="alert">{{error}}</p> }
      @if (rows.length) {
        <p role="status">{{rows.length}} lançamento(s) encontrados. {{skipped}} linha(s) ignoradas e {{duplicates}} repetição(ões) no arquivo. Revise a prévia.</p>
        <div class="statement-table-wrap"><table class="statement-table">
          <thead><tr><th scope="col">Importar</th><th scope="col">Data</th><th scope="col">Descrição</th><th scope="col">Tipo</th><th scope="col">Categoria</th><th scope="col">Valor</th></tr></thead>
          <tbody>@for (row of rows; track $index) {
            <tr><td><input type="checkbox" [(ngModel)]="row.selected" [disabled]="row.duplicate" [attr.aria-label]="'Importar '+row.description"></td>
              <td>{{row.date}}</td><td><input [(ngModel)]="row.description" (ngModelChange)="markDuplicates()" maxlength="120" [attr.aria-label]="'Descrição da linha '+($index+1)"></td>
              <td>{{row.type === 'INCOME' ? 'Entrada' : 'Saída'}}</td>
              <td><select [(ngModel)]="row.category" [attr.aria-label]="'Categoria da linha '+($index+1)">
                @for (item of categories; track item) { <option [value]="item">{{item}}</option> }
              </select></td>
              <td>{{money(row.amountCents)}} @if (row.duplicate) { <small>Já lançado</small> }</td>
            </tr>
          }</tbody>
        </table></div>
        <button type="button" class="primary-button" (click)="confirm()" [disabled]="busy || !accountId || !selectedCount">Importar {{selectedCount}} lançamento(s)</button>
      }
    </section>
  `,
  styles: [`
    .statement-import{margin-top:20px;padding:23px;border-color:var(--border)}
    .statement-import .panel-heading h2{font-size:17px}.statement-import .panel-heading p{font-size:11px;color:var(--text-secondary);margin-top:4px}
    .statement-controls{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0 13px}.statement-controls label{display:grid;gap:8px;min-width:0;font-size:11px;font-weight:700;color:var(--ink)}
    .statement-controls input,.statement-controls select,.statement-table input,.statement-table select{width:100%;max-width:100%;min-height:44px;border:1px solid var(--border);border-radius:8px;padding:9px 12px;background:var(--surface);color:var(--ink);font-size:12px}
    .statement-controls input[type=file]{padding:7px 8px;color:var(--text-secondary)}.statement-controls input[type=file]::file-selector-button{border:1px solid var(--border);background:var(--surface-subtle);color:var(--ink);border-radius:6px;padding:6px 10px;margin-right:12px;font:inherit;font-weight:650;cursor:pointer}
    .statement-controls input:disabled{opacity:.55;cursor:not-allowed}.statement-hint{font-size:10px;line-height:1.6;color:var(--text-secondary);max-width:740px}
    .statement-import [role=status],.statement-import [role=alert]{font-size:11px;line-height:1.5;margin:14px 0;color:var(--text-secondary)}.statement-import [role=alert]{color:var(--negative)}
    .statement-table-wrap{max-width:100%;overflow-x:auto;margin:16px 0}.statement-table{width:100%;min-width:690px;border-collapse:collapse;text-align:left}
    .statement-table th,.statement-table td{padding:11px;border-bottom:1px solid var(--border);font-size:11px}.statement-table td input[type=text]{width:100%}.statement-table td small{display:block;color:var(--negative)}
    @media(max-width:700px){.statement-import{padding:18px}.statement-controls{grid-template-columns:1fr;gap:12px}.statement-controls input,.statement-controls select{font-size:16px}}
  `]
})
export class StatementImportComponent {
  @Input() accounts: StatementAccount[] = [];
  @Input() existing: ExistingStatementRow[] = [];
  @Output() importRows = new EventEmitter<ImportedStatementRow[]>();
  accountId = ''; rows: ReviewRow[] = []; error = ''; busy = false; skipped = 0; duplicates = 0;
  readonly categories = ['Alimentação','Transporte','Saúde','Moradia','Salário','Lazer','Educação','Compras','Outros'];
  get selectedCount() { return this.rows.filter(r => r.selected && !r.duplicate && !!r.description.trim()).length; }
  money(cents: number) { return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(cents/100); }
  markDuplicates() {
    const seen = new Set(this.existing.filter(row => row.accountId === this.accountId && !row.reversedAt).map(statementFingerprint));
    for (const row of this.rows) {
      const key = statementFingerprint(row); row.duplicate = seen.has(key);
      if (row.duplicate) row.selected = false;
      seen.add(key);
    }
  }
  async readFile(event: Event) {
    const input = event.target as HTMLInputElement, file = input.files?.[0];
    this.rows = []; this.error = ''; this.skipped = 0; this.duplicates = 0;
    if (!file) return;
    if (!this.accountId) { this.error = 'Selecione a conta do extrato primeiro.'; return; }
    if (file.size > 10 * 1024 * 1024 || file.size === 0 || !/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) {
      this.error = 'Escolha um PDF de até 10 MB.'; input.value = ''; return;
    }
    this.busy = true;
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/app/pdf.worker.min.mjs';
      const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const doc = await task.promise;
      try {
        if (doc.numPages > 20) throw new Error('O extrato deve ter até 20 páginas.');
        const lines: string[] = [];
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          const content = await (await doc.getPage(pageNumber)).getTextContent();
          const words = content.items.filter((item): item is typeof item & { str:string; transform:number[]; width:number } => 'str' in item && !!item.str.trim())
            .map(item => ({ text:item.str, x:item.transform[4], y:item.transform[5], width:item.width })).sort((a,b) => b.y-a.y || a.x-b.x);
          let current: typeof words = [];
          const flush = () => { if(current.length) lines.push(current.sort((a,b)=>a.x-b.x).map(word=>word.text).join(' ')); current=[]; };
          for (const word of words) { if (current.length && Math.abs(word.y-current[0].y)>2) flush(); current.push(word); }
          flush();
        }
        if (!lines.length) throw new Error('O PDF não contém texto selecionável. Para extratos digitalizados, é necessário OCR.');
        const parsed = parseStatementLines(lines);
        this.rows = parsed.rows.map(row => ({ ...row, selected:true, duplicate:false })); this.skipped = parsed.skipped; this.duplicates = parsed.duplicates;
        this.markDuplicates();
        if (!this.rows.length) this.error = 'Não encontramos lançamentos com data completa e valor identificado como entrada ou saída. Nenhum dado foi salvo.';
      } finally { await task.destroy(); }
    } catch (error) { this.error = error instanceof Error ? error.message : 'Não foi possível ler este PDF.'; }
    finally { this.busy=false; input.value=''; }
  }
  confirm() {
    if (!this.accountId || !this.selectedCount) return;
    const selected = this.rows.filter(row=>row.selected && !row.duplicate && !!row.description.trim()).map(({ selected: _selected, duplicate: _duplicate, ...row }) => ({ ...row, description:row.description.trim(), accountId:this.accountId }));
    this.importRows.emit(selected);
  }
}
