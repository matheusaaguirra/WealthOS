// Independent educational calculator. It never persists or sends these amounts.
const MAX_CENTS = 99_999_999_999;
export function plannerCents(value: string): number | null {
 const text = value.trim();
 if (!text) return 0;
 if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) return null;
 const [whole, decimals = ''] = text.replace(',', '.').split('.');
 const cents = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
 return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
}
export function monthlyRemainder(values: readonly string[]): number | null {
 if (values.length !== 4) return null;
 const amounts = values.map(plannerCents);
 if (amounts.some(value => value === null)) return null;
 const [income, fixed, variable, reserved] = amounts as number[];
 return income - fixed - variable - reserved;
}
