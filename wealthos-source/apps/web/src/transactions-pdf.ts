import { formatLocale, translate } from './i18n/language';
/** Client-side PDF reports. Financial data never leaves the browser. */
export interface PdfTransaction {
  date: string;
  description: string;
  category: string;
  account: string;
  type: 'INCOME' | 'EXPENSE';
  amountCents: number;
  reversedAt?: string | null;
}

const amount = (cents: number) => new Intl.NumberFormat(formatLocale(), { style: 'currency', currency: 'BRL' }).format(cents / 100);
const date = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Intl.DateTimeFormat(formatLocale(), {year:'numeric',month:'2-digit',day:'2-digit',timeZone:'UTC'}).format(new Date(iso+'T12:00:00Z')) : translate('Data inválida');
const ascii = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[^\x20-\x7e]/g, '?');
// Standard PDF fonts use WinAnsi; octal escapes retain Portuguese accents.
const literal = (text: string) => '(' + Array.from(text.replace(/[\u2013\u2014]/g, '-').replace(/\s/g, ' '), char => {
  const code = char.codePointAt(0)!;
  if (code >= 160 && code <= 255) return '\\' + code.toString(8).padStart(3, '0');
  if (code < 32 || code > 126) return '?';
  return /[\\()]/.test(char) ? '\\' + char : char;
}).join('') + ')';
function clipped(text: string, width: number): string {
  const clean = ascii(text.trim().replace(/\s+/g, ' '));
  return clean.length > width ? `${clean.slice(0, width - 3)}...` : clean;
}

type Page = string[];
function write(page: Page, x: number, y: number, value: string, size = 10, font = 'F1', color = '0.12 0.17 0.29') {
  page.push(`${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm ${literal(value)} Tj ET`);
}
function rectangle(page: Page, x: number, y: number, w: number, h: number, rgb: string) {
  page.push(`${rgb} rg ${x} ${y} ${w} ${h} re f`);
}

/** Returns a complete A4 PDF. Amounts remain integer cents throughout the sums. */
export function createTransactionsPdf(rows: readonly PdfTransaction[], month: string, generatedAt = new Date()): Uint8Array {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error(translate('Mês inválido para exportação.'));
  if (rows.length > 10_000) throw new Error(translate('Exportação limitada a 10.000 lançamentos.'));
  for (const row of rows) {
    if (!Number.isSafeInteger(row.amountCents) || row.amountCents <= 0 || row.amountCents > 1_000_000_000 || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !row.date.startsWith(month)) throw new Error(translate('Lançamento inválido para o mês selecionado.'));
  }
  const income = rows.filter(r => !r.reversedAt && r.type === 'INCOME').reduce((n, r) => n + r.amountCents, 0);
  const expense = rows.filter(r => !r.reversedAt && r.type === 'EXPENSE').reduce((n, r) => n + r.amountCents, 0);
  const monthName = new Intl.DateTimeFormat(formatLocale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-02T12:00:00Z`));
  const pages: Page[] = [];
  const chunkSize = 29;
  const pageCount = Math.max(1, Math.ceil(rows.length / chunkSize));
  for (let index = 0; index < pageCount; index++) {
    const page: Page = [];
    pages.push(page);
    rectangle(page, 0, 742, 595, 100, '0.13 0.16 0.30');
    write(page, 42, 799, 'WEALTHOS', 17, 'F2', '1 1 1');
    write(page, 42, 773, translate('Lancamentos - {0}', [monthName]), 13, 'F2', '1 1 1');
    write(page, 42, 752, translate('Emitido em {0}', [generatedAt.toLocaleDateString(formatLocale(), { timeZone: 'UTC' })]), 9, 'F1', '0.83 0.86 0.95');
    if (index === 0) {
      rectangle(page, 42, 681, 511, 48, '0.95 0.96 0.99');
      write(page, 53, 710, translate('Entradas: {0}', [amount(income)]), 10, 'F2');
      write(page, 275, 710, translate('Saidas: {0}', [amount(expense)]), 10, 'F2');
      write(page, 53, 691, translate('Resultado: {0}', [amount(income-expense)]), 10, 'F2');
      write(page, 275, 691, translate('{0} lancamento(s)', [rows.length]), 10);
    }
    rectangle(page, 42, 650, 511, 25, '0.90 0.92 0.97');
    write(page, 49, 658, translate('DATA'), 9, 'F2');
    write(page, 111, 658, translate('LANCAMENTO / CATEGORIA'), 9, 'F2');
    write(page, 392, 658, translate('VALOR'), 9, 'F2');
    const slice = rows.slice(index * chunkSize, (index + 1) * chunkSize);
    slice.forEach((row, i) => {
      const y = 628 - i * 20;
      if (i % 2 === 1) rectangle(page, 42, y - 7, 511, 20, '0.975 0.980 0.992');
      write(page, 49, y, date(row.date), 8);
      write(page, 111, y, clipped(row.description, 39), 8.5, 'F2');
      write(page, 111, y - 9, clipped(`${translate(row.category)} | ${row.account}${row.reversedAt ? ' '+translate('| Estornado') : ''}`, 62), 6.5, 'F1', '0.40 0.45 0.55');
      write(page, 392, y, `${row.type === 'INCOME' ? '+' : '-'} ${amount(row.amountCents)}`, 9, 'F2', row.reversedAt ? '0.48 0.51 0.58' : row.type === 'INCOME' ? '0.10 0.46 0.32' : '0.73 0.29 0.21');
    });
    if (!rows.length) write(page, 49, 620, translate('Nenhum lancamento neste mes.'), 11);
    rectangle(page, 42, 41, 511, 1, '0.88 0.89 0.92');
    write(page, 42, 28, translate('Relatorio gerado com os lancamentos selecionados no WealthOS.'), 8, 'F1', '0.42 0.47 0.56');
    write(page, 492, 28, `${index + 1} / ${pageCount}`, 8);
  }
  return serialize(pages);
}

function serialize(pages: Page[]): Uint8Array {
  const encoder = new TextEncoder();
  const objects: string[] = [];
  const add = (body: string) => { objects.push(body); return objects.length; };
  const catalog = add('');
  const root = add('');
  const regular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const references: number[] = [];
  for (const page of pages) {
    const stream = page.join('\n') + '\n';
    const contents = add(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`);
    references.push(add(`<< /Type /Page /Parent ${root} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${contents} 0 R >>`));
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${root} 0 R >>`;
  objects[root - 1] = `<< /Type /Pages /Kids [${references.map(n => `${n} 0 R`).join(' ')}] /Count ${references.length} >>`;
  const chunks = ['%PDF-1.4\n'];
  let length = encoder.encode(chunks[0]).length;
  const positions = [0];
  for (let i = 0; i < objects.length; i++) {
    positions.push(length);
    const chunk = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    chunks.push(chunk);
    length += encoder.encode(chunk).length;
  }
  const start = length;
  let output = chunks.join('');
  // PDF cross-reference entries are exactly 20 bytes, including the final space and LF.
  const xrefEol = String.fromCharCode(32, 10);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f` + xrefEol;
  output += positions.slice(1).map(p => `${String(p).padStart(10, '0')} 00000 n` + xrefEol).join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return encoder.encode(output);
}

// Conservative widths keep wrapped descriptions inside their table cell.
const textWidth = (text: string, size: number) => Array.from(text).reduce((n, c) => n + (/\s/.test(c) ? .33 : /[MW@%]/.test(c) ? 1 : /[A-ZÀ-Ý]/.test(c) ? .75 : .6) * size, 0);
function wrap(text: string, width: number, size: number): string[] {
  const result: string[] = [];
  let line = '';
  for (const char of text.trim().replace(/\s+/g, ' ') || translate('Não informado')) {
    if (line && textWidth(line + char, size) > width) {
      const space = line.lastIndexOf(' ');
      if (space > 0) { result.push(line.slice(0, space)); line = line.slice(space + 1); }
      else { result.push(line); line = ''; }
    }
    line += char;
  }
  if (line) result.push(line);
  return result;
}

/** Complete history, independent of the current month, account and search filters. */
export function createFinancialReportPdf(rows: readonly PdfTransaction[], generatedAt = new Date()): Uint8Array {
  if (rows.length > 10_000) throw new Error(translate('Exportação limitada a 10.000 lançamentos.'));
  for (const row of rows) {
    if (!Number.isSafeInteger(row.amountCents) || row.amountCents <= 0 || row.amountCents > 1_000_000_000 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !['INCOME', 'EXPENSE'].includes(row.type)) throw new Error(translate('Lançamento inválido para exportação.'));
  }
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const active = sorted.filter(row => !row.reversedAt);
  const income = active.filter(r => r.type === 'INCOME').reduce((total, row) => total + row.amountCents, 0);
  const expense = active.filter(r => r.type === 'EXPENSE').reduce((total, row) => total + row.amountCents, 0);
  const categories = new Map<string, number>();
  for (const row of active) if (row.type === 'EXPENSE') categories.set(row.category || translate('Sem categoria'), (categories.get(row.category || translate('Sem categoria')) || 0) + row.amountCents);
  const pages: Page[] = [];
  let page: Page = [], y = 0;
  const muted = '0.38 0.44 0.51', blue = '0.16 0.37 0.56';
  const newPage = (section: string) => {
    page = []; pages.push(page);
    rectangle(page, 0, 750, 595, 92, '0.05 0.11 0.16');
    write(page, 42, 804, 'WEALTHOS', 12, 'F2', '0.64 0.79 0.91');
    write(page, 42, 775, translate('Relatório financeiro'), 23, 'F2', '1 1 1');
    write(page, 42, 724, section, 15, 'F2');
    y = 699;
  };
  const right = (value: string, baseline: number, size = 10, color = '0.12 0.17 0.29') => {
    const width = Array.from(value).reduce((total, c) => total + (/\d/.test(c) || c === '$' ? .556 : c === 'R' ? .722 : c === '+' ? .584 : c === '-' ? .333 : .278) * size, 0);
    write(page, 549 - width, baseline, value, size, 'F2', color);
  };
  const section = (title: string) => {
    newPage(title);
    rectangle(page, 42, 674, 511, 23, '0.92 0.95 0.97');
    write(page, 50, 682, translate('DATA'), 8, 'F2'); write(page, 111, 682, translate('DESCRIÇÃO / CATEGORIA / CONTA'), 8, 'F2');
    write(page, 464, 682, translate('VALOR (BRL)'), 8, 'F2'); y = 655;
  };
  newPage(translate('Resumo de todo o histórico'));
  const period = rows.length ? translate('{0} a {1}', [date(sorted[sorted.length-1].date), date(sorted[0].date)]) : translate('Sem lançamentos cadastrados');
  write(page, 42, y, translate('Período: {0}', [period]), 10, 'F1', muted); y -= 31;
  for (const [label, value, color] of [[translate('Entradas'), income, '0.10 0.43 0.31'], [translate('Saídas'), expense, '0.65 0.20 0.18'], [translate('Resultado das movimentações'), income - expense, blue]] as const) {
    rectangle(page, 42, y - 19, 511, 36, '0.95 0.97 0.98');
    write(page, 53, y - 5, label, 11, 'F2'); right(amount(value), y - 5, 12, color); y -= 43;
  }
  y -= 4;
  for (const line of [translate('Todas as contas incluídas: carteira principal e saldos separados.'), translate('O resultado considera entradas menos saídas, sem os saldos iniciais.'), translate('{0} lançamento(s) confirmado(s). Estornos não entram nos totais.', [active.length])]) { write(page, 42, y, line, 9, 'F1', muted); y -= 16; }
  y -= 23; write(page, 42, y, translate('Gastos por categoria'), 15, 'F2'); y -= 28;
  if (!categories.size) write(page, 42, y, translate('Nenhum gasto confirmado no histórico.'), 10, 'F1', muted);
  for (const [category, total] of [...categories].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))) {
    const lines = wrap(translate(category), 280, 10), height = Math.max(35, lines.length * 14 + 15);
    if (y - height < 65) { newPage(translate('Gastos por categoria - continuação')); }
    lines.forEach((line, i) => write(page, 49, y - i * 14, line, 10, 'F2'));
    right(amount(total), y, 10);
    write(page, 397, y - 14, translate('{0}% dos gastos', [(total / expense * 100).toLocaleString(formatLocale(), { maximumFractionDigits: 1 })]), 8, 'F1', muted);
    rectangle(page, 42, y - height + 15, 511, 0.5, '0.85 0.89 0.91'); y -= height;
  }
  const groups = [
    { title: translate('Entradas'), items: active.filter(r => r.type === 'INCOME') },
    { title: translate('Gastos e despesas'), items: active.filter(r => r.type === 'EXPENSE') },
    { title: translate('Lançamentos estornados - fora dos totais'), items: sorted.filter(r => r.reversedAt) },
  ];
  for (const group of groups) {
    if (!group.items.length) continue;
    section(group.title);
    for (const row of group.items) {
      const description = wrap(row.description, 270, 10);
      const details = wrap(translate('{0} | Conta: {1}{2}', [translate(row.category || 'Sem categoria'), row.account, row.reversedAt ? ' '+translate('| Estornado') : '']), 270, 8);
      const height = description.length * 14 + details.length * 12 + 19;
      if (y - height < 62) section(group.title + translate(' - continuação'));
      write(page, 50, y, date(row.date), 8, 'F1', muted);
      description.forEach((line, i) => write(page, 111, y - i * 14, line, 10, 'F2'));
      details.forEach((line, i) => write(page, 111, y - description.length * 14 - i * 12 - 2, line, 8, 'F1', muted));
      right(`${row.type === 'INCOME' ? '+' : '-'} ${amount(row.amountCents)}`, y, 10, row.reversedAt ? muted : row.type === 'INCOME' ? '0.10 0.43 0.31' : '0.65 0.20 0.18');
      rectangle(page, 42, y - height + 16, 511, .5, '0.85 0.89 0.91'); y -= height;
    }
  }
  pages.forEach((page, index) => {
    rectangle(page, 42, 44, 511, .5, '0.85 0.89 0.91');
    write(page, 42, 29, translate('Emitido em {0} | Dados pessoais - WealthOS', [generatedAt.toLocaleDateString(formatLocale(), { timeZone: 'America/Sao_Paulo' })]), 8, 'F1', muted);
    write(page, 487, 29, `${index + 1} / ${pages.length}`, 8, 'F1', muted);
  });
  return serialize(pages);
}

function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadTransactionsPdf(rows: readonly PdfTransaction[], month: string): void {
  downloadPdf(createTransactionsPdf(rows, month), `wealthos-lancamentos-${month}.pdf`);
}

export function downloadFinancialReportPdf(rows: readonly PdfTransaction[]): void {
  downloadPdf(createFinancialReportPdf(rows), 'wealthos-relatorio-financeiro.pdf');
}
