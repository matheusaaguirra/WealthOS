import assert from 'node:assert/strict';
import { test } from 'node:test';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import { PUBLIC_URL, SITE_URL, structuredData } from '../lib/seo';

test('the sitemap contains only the canonical public page, never account URLs', () => {
  assert.deepEqual(sitemap(), [{ url: PUBLIC_URL }]);
  for (const { url } of sitemap()) {
    assert.equal(new URL(url).origin, SITE_URL);
    assert.doesNotMatch(url, /login|dashboard|\/app\/|\/api\/|\/auth\//);
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
