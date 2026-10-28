export type Language = 'pt' | 'en' | 'es';
export type LanguagePreference = Language | 'auto';
const STORAGE_KEY = 'wealthos:language';
let activeLanguage: Language = 'pt';
let activeLocale = 'pt-BR';
let messages: Record<string, readonly [string, string]> = {};
const supported = (value: unknown): value is Language => value === 'pt' || value === 'en' || value === 'es';
export function resolveLanguage(languages: readonly string[], preference: unknown = 'auto'): Language {
  if (supported(preference)) return preference;
  for (const language of languages) { const code = language.toLowerCase().split(/[-_]/)[0]; if (supported(code)) return code; }
  return 'en';
}
export function readLanguagePreference(): LanguagePreference {
  if (typeof window === 'undefined') return 'auto';
  const query = new URLSearchParams(window.location.search).get('lang');
  if (supported(query) || query === 'auto') return query;
  try { const saved = localStorage.getItem(STORAGE_KEY); if (supported(saved) || saved === 'auto') return saved; } catch {}
  const cookie = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('wealthos_language='))?.split('=')[1];
  return supported(cookie) ? cookie : 'auto';
}
export function saveLanguagePreference(preference: LanguagePreference): void {
  if (!supported(preference) && preference !== 'auto') return;
  try { localStorage.setItem(STORAGE_KEY, preference); } catch {}
  try { document.cookie = `wealthos_language=${preference}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`; } catch {}
}
export async function initializeLanguage(): Promise<Language> {
  const preference = readLanguagePreference();
  const languages = typeof navigator === 'undefined' ? [] : [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  activeLanguage = resolveLanguage(languages, preference);
  const regional = languages.find(value => value.toLowerCase().split('-')[0] === activeLanguage);
  activeLocale = regional ?? ({ pt: 'pt-BR', en: 'en-US', es: 'es-MX' } as const)[activeLanguage];
  if (activeLanguage !== 'pt') {
    try { messages = (await import('./translations')).translations; }
    catch { activeLanguage = 'pt'; activeLocale = 'pt-BR'; }
  }
  if (typeof document !== 'undefined') { document.documentElement.lang = activeLocale; document.title = translate('WealthOS — Sua vida financeira, em equilíbrio'); document.querySelector?.('link[rel="manifest"]')?.setAttribute('href', activeLanguage === 'pt' ? '/manifest.webmanifest' : '/manifest.'+activeLanguage+'.webmanifest'); }
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('lang')) saveLanguagePreference(preference);
  return activeLanguage;
}
export function currentLanguage(): Language { return activeLanguage; }
export function formatLocale(): string { return activeLocale; }
export function overviewPath(): string { return activeLanguage === 'pt' ? '/sobre' : `/${activeLanguage}`; }
export function translate(value: unknown, parameters: readonly unknown[] = []): string {
  if (value === null || value === undefined) return '';
  const original = String(value);
  const key = original.replace(/\s+/g, ' ').trim();
  const localized = activeLanguage === 'pt' ? undefined : messages[key]?.[activeLanguage === 'en' ? 0 : 1];
  if (localized === undefined) return original.replace(/\{(\d+)\}/g, (match, index: string) => Number(index) < parameters.length ? String(parameters[Number(index)] ?? '') : match);
  const message = localized;
  const output = message.replace(/\{(\d+)\}/g, (match, index: string) => Number(index) < parameters.length ? String(parameters[Number(index)] ?? '') : match);
  return (original.match(/^\s+/)?.[0] ?? '') + output + (original.match(/\s+$/)?.[0] ?? '');
}

// Display conventions change; the model stays in the existing comma-decimal format.
export function numberSeparators(locale = activeLocale) {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.56);
  return { group: parts.find(part => part.type === 'group')?.value ?? '.', decimal: parts.find(part => part.type === 'decimal')?.value ?? ',' };
}
export function displayNumeric(canonical: string, locale = activeLocale): string {
  const { group, decimal } = numberSeparators(locale);
  return canonical.replace(/[.,]/g, separator => separator === '.' ? group : decimal);
}
export function canonicalNumeric(input: string, locale = activeLocale): string | null {
  const { group, decimal } = numberSeparators(locale);
  const text = input.trim().replace(/^(?:R\$|BRL)\s*/, '');
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('^-?(?:\\d+|\\d{1,3}(?:'+escape(group)+'\\d{3})+)(?:'+escape(decimal)+'\\d*)?$');
  if (!pattern.test(text)) return null;
  // Existing parsers accept the original Brazilian grouping and decimal conventions.
  if (group === '.' && decimal === ',') return text;
  return text.split(group).join('').split(decimal).join(',');
}
