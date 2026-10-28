import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { resolveLanguage, initializeLanguage, currentLanguage, formatLocale, overviewPath, translate, readLanguagePreference, saveLanguagePreference, displayNumeric, canonicalNumeric } from '../wealthos-source/apps/web/src/i18n/language';
import { translations } from '../wealthos-source/apps/web/src/i18n/translations';
import { parseMoneyToCents } from '../wealthos-source/packages/finance/src/index';
import { createFinancialReportPdf } from '../wealthos-source/apps/web/src/transactions-pdf';

test('browser preferences resolve English, Mexican Spanish, Portuguese and supported secondary languages', () => {
  for (const locale of ['en-GB', 'en-US', 'en-AU']) assert.equal(resolveLanguage([locale]), 'en');
  for (const locale of ['es-MX', 'es-ES', 'es-AR']) assert.equal(resolveLanguage([locale]), 'es');
  assert.equal(resolveLanguage(['pt-PT']), 'pt');
  assert.equal(resolveLanguage(['fr-FR', 'es-MX', 'en-US']), 'es');
  assert.equal(resolveLanguage(['de-DE']), 'en');
  assert.equal(resolveLanguage([]), 'en');
  assert.equal(resolveLanguage(['es-MX'], 'pt'), 'pt');
  assert.equal(resolveLanguage(['es-MX'], 'invalid'), 'es');
});

test('application startup detects language, remembers overrides and restores automatic selection safely', async () => {
  const store = new Map<string, string>();
  const location = { search: '' };
  const document = { cookie: '', title: '', documentElement: { lang: '' } };
  const navigator = { language: 'es-MX', languages: ['es-MX', 'en-US'] };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: navigator });
  Object.assign(globalThis, { window: { location }, document, localStorage: { getItem: (key:string) => store.get(key) ?? null, setItem: (key:string,value:string) => store.set(key,value) } });
  await initializeLanguage();
  assert.equal(currentLanguage(), 'es'); assert.equal(formatLocale(), 'es-MX'); assert.equal(overviewPath(), '/es');
  assert.equal(document.documentElement.lang, 'es-MX'); assert.equal(translate('Senha'), 'Contraseña');
  const untouched = 'Salário  /  Mi cuenta <personal>';
  assert.equal(translate(untouched), untouched);
  assert.equal(translate('Você tem {0} gasto(s) fixo(s) para lançar.', ['<6>']), 'Tienes <6> gasto(s) fijo(s) por registrar.');
  saveLanguagePreference('en'); await initializeLanguage();
  assert.equal(readLanguagePreference(), 'en'); assert.equal(translate('Senha'), 'Password');
  assert.equal(overviewPath(), '/en');
  const records=[{date:'2026-10-28',description:'Compras',category:'Outros',account:'Minha conta',type:'EXPENSE' as const,amountCents:12345}];
  const unchanged=JSON.stringify(records);
  const pdf=new TextDecoder('latin1').decode(createFinancialReportPdf(records));
  assert.ok(pdf.includes('(Financial report)'));
  assert.ok(pdf.includes('(Compras)'),'User-entered descriptions are not translated.');
  assert.ok(pdf.includes('Account: Minha conta'),'User-entered account names are not translated.');
  assert.equal(JSON.stringify(records),unchanged);
  location.search = '?lang=pt'; await initializeLanguage(); assert.equal(currentLanguage(), 'pt'); assert.equal(translate('Senha'), 'Senha');
  location.search = '?lang=auto'; await initializeLanguage(); assert.equal(currentLanguage(), 'es');
  assert.ok(new TextDecoder('latin1').decode(createFinancialReportPdf(records)).includes('(Informe financiero)'));
  location.search = '';
  Object.assign(globalThis, { localStorage: { getItem(){throw Error('blocked');}, setItem(){throw Error('blocked');} } });
  document.cookie = 'other=1; wealthos_language=en'; await initializeLanguage(); assert.equal(currentLanguage(), 'en');
  document.cookie = ''; await initializeLanguage(); assert.equal(currentLanguage(), 'es');
  // The language module never reads or writes financial storage.
  assert.deepEqual([...store.keys()], ['wealthos:language']);
});

test('translated number displays and pastes preserve the original amount in cents', () => {
  for (const locale of ['pt-BR', 'en-US', 'en-GB', 'es-MX', 'es-ES']) {
    for (const canonical of ['0,01', '12,34', '1.234,56', '10.000.000,00']) {
      const shown = displayNumeric(canonical, locale);
      const result = canonicalNumeric(shown, locale);
      assert.notEqual(result, null);
      assert.equal(parseMoneyToCents(result!), parseMoneyToCents(canonical));
    }
    assert.equal(canonicalNumeric('hello 123',locale), null);
    assert.equal(canonicalNumeric('1e3',locale), null);
  }
  assert.equal(displayNumeric('1.234,56','en-US'), '1,234.56');
  assert.equal(canonicalNumeric('R$ 1,234.56','es-MX'), '1234,56');
  assert.equal(canonicalNumeric('12,34','en-US'), null);
  assert.equal(displayNumeric('','en-US'), '');
});

test('English and Spanish catalogue preserve every placeholder and cover owned application copy', () => {
  assert.ok(Object.keys(translations).length > 800);
  for (const [source, targets] of Object.entries(translations)) {
    assert.equal(targets.length, 2);
    for (const target of targets) {
      assert.ok(target.trim());
      assert.deepEqual(target.match(/\{\d+\}/g)?.sort() ?? [], source.match(/\{\d+\}/g)?.sort() ?? [], source);
    }
  }
  for (const source of ['Senha','Novo lançamento','Gastos fixos','Excluir conta','Receitas','Despesas','Valor (R$)','Muitas tentativas. Aguarde alguns instantes.']) {
    assert.ok(translations[source], source);
    assert.notEqual(translations[source][0], source);
  }
});

test('real controls preserve user names, canonical financial values and empty input in English and Spanish', () => {
  execFileSync(process.execPath, ['--import','tsx','test/fixtures/localized-controls.ts'], { env: {...process.env, TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'}, timeout:15000, stdio:'pipe' });
});

test('all application templates have valid localized copy and no untranslated static text', () => {
  execFileSync(process.execPath, ['--import','tsx','test/fixtures/localized-templates.ts'], { env: {...process.env, TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'}, timeout:15000, stdio:'pipe' });
});
