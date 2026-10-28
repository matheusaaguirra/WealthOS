import type { Metadata } from 'next';
import WealthOSLanding from '../../components/wealthos-landing';
import { PUBLIC_URL, SITE_DESCRIPTION, SITE_TITLE, structuredData, languageAlternates } from '../../lib/seo';
export const metadata: Metadata = {
  title:SITE_TITLE, description:SITE_DESCRIPTION,
  alternates:{canonical:PUBLIC_URL,languages:languageAlternates},
  openGraph:{type:'website',locale:'pt_BR',siteName:'WealthOS',url:PUBLIC_URL,title:SITE_TITLE,description:SITE_DESCRIPTION,images:[{url:'/sobre/social-card',width:1200,height:630,alt:'WealthOS — Mais clareza. Mais possibilidades.'}]},
  twitter:{card:'summary_large_image',title:SITE_TITLE,description:SITE_DESCRIPTION,images:['/sobre/social-card']},
};
export default function Home(){return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/><WealthOSLanding automatic/></>;}
