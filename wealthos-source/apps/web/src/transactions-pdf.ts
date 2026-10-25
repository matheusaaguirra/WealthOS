/** Client-side, dependency-free PDF export. Only the selected rows are rendered. */
export interface PdfTransaction {
  date: string;
  description: string;
  category: string;
  account: string;
  type: 'INCOME' | 'EXPENSE';
  amountCents: number;
  reversedAt?: string | null;
}

const amount = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const date = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : 'Data inválida';
const ascii = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[^\x20-\x7e]/g, '?');
const literal = (text: string) => `(${ascii(text).replace(/[\\()]/g, '\\$&')})`;
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
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Mês inválido para exportação.');
  if (rows.length > 10_000) throw new Error('Exportação limitada a 10.000 lançamentos.');
  for (const row of rows) {
    if (!Number.isSafeInteger(row.amountCents) || row.amountCents <= 0 || row.amountCents > 1_000_000_000 || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !row.date.startsWith(month)) throw new Error('Lançamento inválido para o mês selecionado.');
  }
  const income = rows.filter(r => !r.reversedAt && r.type === 'INCOME').reduce((n, r) => n + r.amountCents, 0);
  const expense = rows.filter(r => !r.reversedAt && r.type === 'EXPENSE').reduce((n, r) => n + r.amountCents, 0);
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-02T12:00:00Z`));
  const pages: Page[] = [];
  const chunkSize = 29;
  const pageCount = Math.max(1, Math.ceil(rows.length / chunkSize));
  for (let index = 0; index < pageCount; index++) {
    const page: Page = [];
    pages.push(page);
    rectangle(page, 0, 742, 595, 100, '0.13 0.16 0.30');
    write(page, 42, 799, 'WEALTHOS', 17, 'F2', '1 1 1');
    write(page, 42, 773, `Lancamentos - ${monthName}`, 13, 'F2', '1 1 1');
    write(page, 42, 752, `Emitido em ${generatedAt.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`, 9, 'F1', '0.83 0.86 0.95');
    if (index === 0) {
      rectangle(page, 42, 681, 511, 48, '0.95 0.96 0.99');
      write(page, 53, 710, `Entradas: ${amount(income)}`, 10, 'F2');
      write(page, 275, 710, `Saidas: ${amount(expense)}`, 10, 'F2');
      write(page, 53, 691, `Resultado: ${amount(income - expense)}`, 10, 'F2');
      write(page, 275, 691, `${rows.length} lancamento(s)`, 10);
    }
    rectangle(page, 42, 650, 511, 25, '0.90 0.92 0.97');
    write(page, 49, 658, 'DATA', 9, 'F2');
    write(page, 111, 658, 'LANCAMENTO / CATEGORIA', 9, 'F2');
    write(page, 392, 658, 'VALOR', 9, 'F2');
    const slice = rows.slice(index * chunkSize, (index + 1) * chunkSize);
    slice.forEach((row, i) => {
      const y = 628 - i * 20;
      if (i % 2 === 1) rectangle(page, 42, y - 7, 511, 20, '0.975 0.980 0.992');
      write(page, 49, y, date(row.date), 8);
      write(page, 111, y, clipped(row.description, 39), 8.5, 'F2');
      write(page, 111, y - 9, clipped(`${row.category} | ${row.account}${row.reversedAt ? ' | Estornado' : ''}`, 62), 6.5, 'F1', '0.40 0.45 0.55');
      write(page, 392, y, `${row.type === 'INCOME' ? '+' : '-'} ${amount(row.amountCents)}`, 9, 'F2', row.reversedAt ? '0.48 0.51 0.58' : row.type === 'INCOME' ? '0.10 0.46 0.32' : '0.73 0.29 0.21');
    });
    if (!rows.length) write(page, 49, 620, 'Nenhum lancamento neste mes.', 11);
    rectangle(page, 42, 41, 511, 1, '0.88 0.89 0.92');
    write(page, 42, 28, 'Relatorio gerado com os lancamentos selecionados no WealthOS.', 8, 'F1', '0.42 0.47 0.56');
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
  const regular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const references: number[] = [];
  for (const page of pages) {
    const stream = page.join('\n') + '\n';
    const contents = add(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`);
    references.push(add(`<< /Type /Page /Parent ${root} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${contents} 0 R >>`));
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${root} 0 R >>`;
  objects[root - 1] = `<< /Type /Pages /Kids [${references.map(n => `${n} 0 R`).join(' ')}] /Count ${references.length} >>`;
  let output = '%PDF-1.4\n';
  const positions = [0];
  for (let i = 0; i < objects.length; i++) {
    positions.push(encoder.encode(output).length);
    output += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const start = encoder.encode(output).length;
  // PDF cross-reference entries are exactly 20 bytes, including the final space and LF.
  const xrefEol = String.fromCharCode(32, 10);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f` + xrefEol;
  output += positions.slice(1).map(p => `${String(p).padStart(10, '0')} 00000 n` + xrefEol).join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return encoder.encode(output);
}

export function downloadTransactionsPdf(rows: readonly PdfTransaction[], month: string): void {
  const bytes = createTransactionsPdf(rows, month);
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `wealthos-lancamentos-${month}.pdf`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
