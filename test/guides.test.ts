import assert from 'node:assert/strict';
import { test } from 'node:test';
import sitemap from '../app/sitemap';
import { SITE_URL } from '../lib/seo';
import {guidePublished, guideModified, guidePublicationLabel, guideLocales, guides,guidePath,guideUI,equivalentGuides} from '../lib/guides/content';
import {guideMetadata,guideStructuredData} from '../lib/guides/metadata';
import {plannerCents,monthlyRemainder} from '../lib/guides/calculation';

test('guide alternates refer only to existing equivalent content and reciprocate',()=>{
 const pages=new Set(sitemap().map(page=>page.url));
 assert.equal(pages.size,sitemap().length);
 assert.equal(pages.size,24);
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
 assert.deepEqual(Object.keys(guideMetadata('en',pdf).alternates!.languages!).sort(),['en','pt','x-default']);
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


test('product walkthroughs have accurate publication dates, indexable paths and first-use actions',()=>{
 for (const key of ['recurring','pdf']) {
  const guide=guides.pt.find(item=>item.key===key)!;
  assert.ok(guide.action?.body.includes('conta'));
  assert.equal(guidePublished(guide),'2026-11-03');
  assert.equal(guideModified(guide),'2026-11-03');
  assert.match(guidePublicationLabel('pt',guide),/3 de novembro de 2026/);
  const article=guideStructuredData('pt',guide)['@graph'][0];
  assert.equal(article.datePublished,guidePublished(guide));
  assert.equal(article.dateModified,guideModified(guide));
  assert.equal(sitemap().find(page=>page.url===article.url)?.lastModified,guideModified(guide));
 }
 const recurring=guides.pt.find(item=>item.key==='recurring')!;
 assert.deepEqual(Object.keys(guideMetadata('pt',recurring).alternates!.languages!).sort(),['pt','x-default']);
 assert.match(JSON.stringify(recurring.sections),/mês atual/);
 assert.match(JSON.stringify(recurring.sections),/não paga boletos/);
});
