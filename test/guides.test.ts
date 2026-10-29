import assert from 'node:assert/strict';
import { test } from 'node:test';
import sitemap from '../app/sitemap';
import { SITE_URL } from '../lib/seo';
import {guideLocales, guides,guidePath,guideUI,equivalentGuides} from '../lib/guides/content';
import {guideMetadata,guideStructuredData} from '../lib/guides/metadata';
import {plannerCents,monthlyRemainder} from '../lib/guides/calculation';

test('guide alternates refer only to existing equivalent content and reciprocate',()=>{
 const pages=new Set(sitemap().map(page=>page.url));
 assert.equal(pages.size,sitemap().length);
 assert.equal(pages.size,22);
 for(const locale of guideLocales){
  for(const guide of [undefined,...guides[locale]]){
   const metadata=guideMetadata(locale,guide);
   const canonical=`${SITE_URL}${guidePath(locale,guide)}`;
   assert.equal(metadata.alternates?.canonical,canonical);
   assert.ok(pages.has(canonical));
   const alternates=metadata.alternates!.languages!;
   for(const [language,url] of Object.entries(alternates)){
    assert.equal(typeof url,'string');assert.ok(pages.has(url as string));
    if(language==='x-default')continue;
    if(guide){
     const equivalent=equivalentGuides(guide.key).find(item=>item.locale===language)!;
     assert.ok(equivalent);
     assert.equal(guideMetadata(equivalent.locale,equivalent.guide).alternates!.languages![locale],canonical);
    }
   }
  }
 }
 const pdf=guides.en.find(guide=>guide.key==='pdf')!;
 assert.deepEqual(Object.keys(guideMetadata('en',pdf).alternates!.languages!).sort(),['en','x-default']);
});

test('article structured data describes visible editorial content without invented endorsements',()=>{
 for(const locale of guideLocales){
  assert.match(guideUI[locale].notice,/BRL/);
  const slugs=new Set<string>();
  for(const guide of guides[locale]){
   assert.ok(!slugs.has(guide.slug));slugs.add(guide.slug);
   const data=guideStructuredData(locale,guide);
   const article=data['@graph'][0];
   assert.equal(article['@type'],'Article');
   assert.equal(article.inLanguage,locale);
   assert.equal(article.url,`${SITE_URL}${guidePath(locale,guide)}`);
   assert.ok(guide.sections.every(section=>section.paragraphs.length>=2));
   assert.doesNotMatch(JSON.stringify(data),/aggregateRating|reviewCount|Person|guaranteed/i);
  }
 }
});

test('local calculator preserves cents and rejects ambiguous or unsafe inputs',()=>{
 assert.equal(plannerCents(''),0);assert.equal(plannerCents(' 0 '),0);
 assert.equal(plannerCents('00012,34'),1234);assert.equal(plannerCents('12.3'),1230);
 for(const invalid of ['1,234','1.234','-1','NaN','Infinity','1e3','1,000.00','R$ 2','9999999999999999'])assert.equal(plannerCents(invalid),null,invalid);
 assert.equal(monthlyRemainder(['3000','1200','700','300']),80000);
 assert.equal(monthlyRemainder(['0,30','0.1','0,20','']),0);
 assert.equal(monthlyRemainder(['10','20','','']),-1000);
 assert.equal(monthlyRemainder(['10','letters','','']),null);
 assert.equal(monthlyRemainder(['10']),null);
});
