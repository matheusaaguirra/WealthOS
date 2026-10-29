import { notFound } from 'next/navigation';
import { guideLocales, guideUI, guideRoots, guidePath, guides, languageNames, equivalentGuides, type GuideLocale, type Guide } from '../lib/guides/content';
import { guideMetadata,guideStructuredData } from '../lib/guides/metadata';
import MonthlyPlanner from './monthly-planner';
import styles from './wealthos-guides.module.css';
export type GuideParams = { params: Promise<{ slug?: string[] }> };
function resolveGuide(locale:GuideLocale,slug?:string[]) {
 if(!slug?.length)return undefined;
 if(slug.length!==1)notFound();
 const guide=guides[locale].find(item=>item.slug===slug[0]);
 if(!guide)notFound();
 return guide;
}
export async function metadataForGuide(locale:GuideLocale,{params}:GuideParams) {const {slug}=await params;return guideMetadata(locale,resolveGuide(locale,slug));}
export function paramsForGuides(locale:GuideLocale) {return [{slug:[]},...guides[locale].map(guide=>({slug:[guide.slug]}))];}
export async function pageForGuide(locale:GuideLocale,{params}:GuideParams) {const {slug}=await params;return <WealthOSGuides locale={locale} guide={resolveGuide(locale,slug)}/>;}
function BookLogo(){return <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#193F59"/><path d="M9 11.8c4-1.6 7.5-1.1 11 1.6v16.4c-3.5-2.7-7-3.2-11-1.6V11.8Z" fill="#F4F3E9"/><path d="M31 11.8c-4-1.6-7.5-1.1-11 1.6v16.4c3.5-2.7 7-3.2 11-1.6V11.8Z" fill="#91BDC3"/><path d="m23.5 23.2 2.1-2.8 1.7 1.3 1.5-2.1" stroke="#193F59" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
export default function WealthOSGuides({locale,guide}:{locale:GuideLocale;guide?:Guide}) {
 const c=guideUI[locale];const home=locale==='pt'?'/':locale==='en'||locale==='es'?`/${locale}`:'/en';
 const related=guides[locale].filter(item=>item.key!==guide?.key);
 const languages=guide?equivalentGuides(guide.key).map(item=>({locale:item.locale,path:item.path})):guideLocales.map(code=>({locale:code,path:guideRoots[code]}));
 return <div className={styles.page}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(guideStructuredData(locale,guide)).replace(/</g,'\\u003c')}}/>
  <a className={styles.skip} href="#guide-content">{c.contents}</a>
  <header className={styles.header}><a href={home} className={styles.brand} aria-label="WealthOS"><BookLogo/><span>Wealth<span>OS</span></span></a><nav aria-label={c.hub}><a href={guideRoots[locale]}>{c.hub}</a><a className={styles.login} href="/login">{c.login} ↗</a></nav></header>
  <main id="guide-content" className={styles.main}>
   <nav className={styles.breadcrumb} aria-label={c.home}><a href={home}>{c.home}</a><span>/</span>{guide?<a href={guideRoots[locale]}>{c.hub}</a>:<span>{c.hub}</span>}{guide&&<><span>/</span><span>{guide.title}</span></>}</nav>
   <header className={styles.intro}><p className={styles.eyebrow}>{c.label}</p><h1>{guide?.title??c.title}</h1><p className={styles.lead}>{guide?.summary??c.intro}</p>{guide&&<div className={styles.byline}><span>{c.by}</span><time dateTime="2026-10-29">{c.updated}</time></div>}</header>
   {guide?<div className={styles.readingLayout}>
    <aside className={styles.toc}><p>{c.contents}</p><ol>{guide.sections.map((section,index)=><li key={section.title}><a href={`#section-${index}`}>{section.title}</a></li>)}{guide.key==='monthly'&&<li><a href="#monthly-planner">{c.tool}</a></li>}</ol></aside>
    <article className={styles.article}>{guide.sections.map((section,index)=><section key={section.title} id={`section-${index}`}><span className={styles.number}>0{index+1}</span><h2>{section.title}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}{section.steps&&<ol className={styles.checklist}>{section.steps.map(step=><li key={step}>{step}</li>)}</ol>}</section>)}
     {guide.key==='monthly'&&<MonthlyPlanner locale={locale} copy={c}/>}
     <section className={styles.sources}><h2>{c.sources}</h2><p>{c.sourceNote}</p><a href="https://www.consumerfinance.gov/consumer-tools/educator-tool/your-money-your-goals/toolkit/">CFPB · Your Money, Your Goals ↗</a><p className={styles.small}>{c.education}</p></section>
    </article>
   </div>:<div className={styles.list}>{related.map((item,index)=><a key={item.key} className={styles.guideLink} href={guidePath(locale,item)}><span className={styles.number}>0{index+1}</span><div><h2>{item.title}</h2><p>{item.description}</p><span className={styles.read}>{c.read} ↗</span></div></a>)}</div>}
   {guide&&related.length>0&&<section className={styles.related}><p className={styles.eyebrow}>{c.related}</p>{related.map(item=><a key={item.key} href={guidePath(locale,item)}>{item.title}<span aria-hidden="true">↗</span></a>)}</section>}
   <aside className={styles.cta}><div><h2>{c.cta}</h2><p>{c.ctaBody}</p><a className={styles.primary} href="/login">{c.start} ↗</a></div><p className={styles.notice}>{c.notice}</p></aside>
  </main>
  <footer className={styles.footer}><a className={styles.brand} href={home}><BookLogo/><span>WealthOS</span></a><nav aria-label={c.languages}>{languages.map(item=><a key={item.locale} href={item.path} hrefLang={item.locale} lang={item.locale} aria-current={item.locale===locale?'page':undefined}>{languageNames[item.locale]}</a>)}</nav><p>© 2026 WealthOS</p></footer>
 </div>;
}
