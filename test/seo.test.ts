import assert from 'node:assert/strict';
import { test } from 'node:test';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import { PUBLIC_URL, SITE_URL, structuredData, internationalMetadata, internationalStructuredData, languageAlternates } from '../lib/seo';
import { internationalCopy } from '../lib/international-copy';

test('the sitemap contains every public language and never account URLs', () => {
  assert.deepEqual(sitemap().map(page => page.url).sort(), [PUBLIC_URL, `${SITE_URL}/en`, `${SITE_URL}/es`].sort());
  for (const page of sitemap()) assert.deepEqual(page.alternates?.languages, languageAlternates);
  for (const { url } of sitemap()) {
    assert.equal(new URL(url).origin, SITE_URL);
    assert.doesNotMatch(url, /login|dashboard|\/app\/|\/api\/|\/auth\//);
  }
});

test('international pages use self canonicals, reciprocal language alternatives and translated metadata', () => {
  assert.deepEqual(Object.keys(languageAlternates).sort(), ['en', 'es', 'pt', 'x-default']);
  assert.equal(languageAlternates['x-default'], `${SITE_URL}/en`);
  for (const locale of ['en', 'es'] as const) {
    const metadata = internationalMetadata(locale);
    assert.equal(metadata.alternates?.canonical, `${SITE_URL}/${locale}`);
    assert.deepEqual(metadata.alternates?.languages, languageAlternates);
    assert.equal(metadata.title, internationalCopy[locale].title);
    assert.match(metadata.description!, locale === 'en' ? /Brazilian Portuguese/ : /portugués de Brasil/);
  }
});

test('translated pages distinguish their language from the actual app language and disclose BRL', () => {
  for (const locale of ['en', 'es'] as const) {
    const graph = internationalStructuredData(locale)['@graph'];
    const page = graph.find(node => node['@type'] === 'WebPage')!;
    const app = graph.find(node => node['@type'] === 'WebApplication')!;
    assert.equal(page.inLanguage, locale);
    assert.equal(page.url, `${SITE_URL}/${locale}`);
    assert.equal(app.inLanguage, 'pt-BR');
    assert.match(internationalCopy[locale].availability, /BRL/);
    assert.equal(internationalCopy[locale].questions.length, 5);
  }
});

test('production crawlers can discover the page and sitemap, while previews stay excluded', () => {
  const previous = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = 'production';
    const policy = robots();
    assert.equal(policy.sitemap, `${SITE_URL}/sitemap.xml`);
    assert.deepEqual(policy.rules, { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/'] });
    process.env.VERCEL_ENV = 'preview';
    assert.deepEqual(robots(), { rules: { userAgent: '*', disallow: '/' } });
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test('structured product data identifies the public application without invented ratings or account data', () => {
  const data = JSON.parse(JSON.stringify(structuredData));
  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(data['@graph'].find((node: { '@type': string }) => node['@type'] === 'WebApplication').url, PUBLIC_URL);
  assert.doesNotMatch(JSON.stringify(data), /aggregateRating|reviewCount|accountId|transactions|email|password/);
});
