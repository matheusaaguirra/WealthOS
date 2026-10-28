import { type InternationalLocale } from '../lib/international-copy';
import { internationalStructuredData } from '../lib/seo';
import WealthOSLanding from './wealthos-landing';
export default function InternationalLanding({ locale }: { locale: InternationalLocale }) {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(internationalStructuredData(locale)).replace(/</g,'\\u003c')}}/><WealthOSLanding locale={locale}/></>;
}
