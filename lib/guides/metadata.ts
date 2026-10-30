import type { Metadata } from 'next';
import { SITE_URL } from '../seo';
import { guideLocales, guides, guidePath, guideRoots, guideUI, equivalentGuides, type GuideLocale, type Guide } from './content';
export function guideAlternates(locale:GuideLocale, guide?:Guide): Record<string,string> {
 const entries = guide ? equivalentGuides(guide.key).map(item=>[item.locale,`${SITE_URL}${item.path}`]) : guideLocales.map(code=>[code,`${SITE_URL}${guideRoots[code]}`]);
 const languages=Object.fromEntries(entries);
 return {...languages,'x-default':languages.en ?? `${SITE_URL}${guidePath(locale,guide)}`};
}
export function guideMetadata(locale:GuideLocale,guide?:Guide): Metadata {
 const c=guideUI[locale]; const url=`${SITE_URL}${guidePath(locale,guide)}`;
 const title=`${guide?.title ?? c.title} | WealthOS`;
 const description=guide?.description ?? c.intro;
 return {title,description,alternates:{canonical:url,languages:guideAlternates(locale,guide)},openGraph:{type:guide?'article':'website',title,description,url,locale:{pt:'pt_BR',en:'en_US',es:'es_ES',fr:'fr_FR',de:'de_DE',it:'it_IT'}[locale],siteName:'WealthOS',images:[{url:'/en/social-card',width:1200,height:630,alt:'WealthOS'}]},twitter:{card:'summary_large_image',title,description,images:['/en/social-card']}};
}
export function guideStructuredData(locale:GuideLocale,guide?:Guide) {
 const c=guideUI[locale]; const url=`${SITE_URL}${guidePath(locale,guide)}`;
 const home=locale==='pt'?`${SITE_URL}/`:locale==='en'||locale==='es'?`${SITE_URL}/${locale}`:`${SITE_URL}/en`;
 const breadcrumbs=[{name:'WealthOS',item:home},{name:c.hub,item:`${SITE_URL}${guideRoots[locale]}`},...(guide?[{name:guide.title,item:url}]:[])];
 return {'@context':'https://schema.org','@graph':[
  {'@type':guide?'Article':'CollectionPage','@id':`${url}#content`,url,inLanguage:locale,...(guide?{headline:guide.title,datePublished:'2026-10-29',dateModified:guide.key==='monthly'?'2026-10-30':'2026-10-29',author:{'@type':'Organization',name:'WealthOS',url:`${SITE_URL}/`}}:{name:c.title,hasPart:guides[locale].map(item=>({'@type':'Article',headline:item.title,url:`${SITE_URL}${guidePath(locale,item)}`}))}),description:guide?.description??c.intro,publisher:{'@type':'Organization',name:'WealthOS',url:`${SITE_URL}/`,logo:{'@type':'ImageObject',url:`${SITE_URL}/icons/app-512.png`}}},
  {'@type':'BreadcrumbList',itemListElement:breadcrumbs.map((item,index)=>({'@type':'ListItem',position:index+1,...item}))},
 ]};
}
