export interface StatementCandidate {
  date: string;
  description: string;
  amountCents: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
}

export interface StatementParseResult { rows: StatementCandidate[]; skipped: number; duplicates: number; }

function isoDate(value: string): string | null {
  const match = /^(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 2000 || year > 2100 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

function category(description: string): string {
  const text = description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (/MERCADO|SUPERMERCADO|PADARIA|RESTAURANTE|IFOOD/.test(text)) return 'Alimentação';
  if (/UBER|99 POP|COMBUSTIVEL|POSTO |METRO|ESTACIONAMENTO/.test(text)) return 'Transporte';
  if (/FARMACIA|HOSPITAL|CLINICA/.test(text)) return 'Saúde';
  if (/ALUGUEL|CONDOMINIO|ENERGIA|AGUA |INTERNET/.test(text)) return 'Moradia';
  if (/SALARIO|REMUNERACAO/.test(text)) return 'Salário';
  return 'Outros';
}

export function statementFingerprint(row: Pick<StatementCandidate, 'date'|'description'|'amountCents'|'type'>): string {
  return [row.date, row.type, row.amountCents, row.description.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toUpperCase()].join('|');
}

/** Parse only explicit signed or D/C transaction amounts; never infer whether an unsigned amount is a debit. */
export function parseStatementLines(lines: string[]): StatementParseResult {
  const rows: StatementCandidate[] = [], seen = new Set<string>();
  let skipped = 0, duplicates = 0;
  for (const raw of lines) {
    const line = raw.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
    const head = /^(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})\s+(.+)$/.exec(line);
    if (!head) continue;
    const date = isoDate(head[1]);
    // A trailing balance column makes a line ambiguous, so do not import it silently.
    const match = /^(.*?)\s+(?:R\$\s*)?([+-]\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|[+-]\s*\d+(?:,\d{2})?|\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s*[DC]|\d+(?:,\d{2})?\s*[DC])$/.exec(head[2]);
    if (!date || !match || !match[1].trim()) { skipped++; continue; }
    const token = match[2].replace(/\s/g, '');
    const sign = token.startsWith('-') || /D$/i.test(token) ? 'EXPENSE' : 'INCOME';
    const amount = token.replace(/[+\-DC]/gi, '').replace(/\./g, '');
    const parts = amount.split(',');
    const amountCents = Number(parts[0]) * 100 + Number((parts[1] ?? '00').padEnd(2, '0'));
    const description = match[1].trim().slice(0, 120);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > 1e9) { skipped++; continue; }
    const row: StatementCandidate = { date, description, amountCents, type: sign, category: category(description) };
    const fingerprint = statementFingerprint(row);
    if (seen.has(fingerprint)) { duplicates++; continue; }
    seen.add(fingerprint); rows.push(row);
  }
  return { rows, skipped, duplicates };
}
