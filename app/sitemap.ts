import type { MetadataRoute } from 'next';
import { languageAlternates, SITE_URL } from '../lib/seo';
import { guideLocales, guides, guidePath } from '../lib/guides/content';
import { guideAlternates } from '../lib/guides/metadata';
export default function sitemap(): MetadataRoute.Sitemap {
 const landing = ['pt', 'en', 'es'].map(locale => ({ url: languageAlternates[locale as 'pt' | 'en' | 'es'], alternates: { languages: languageAlternates } }));
 const resources = guideLocales.flatMap(locale => [
  {url:`${SITE_URL}${guidePath(locale)}`,lastModified:'2026-10-29',alternates:{languages:guideAlternates(locale)}},
  ...guides[locale].map(guide=>({url:`${SITE_URL}${guidePath(locale,guide)}`,lastModified:'2026-10-29',alternates:{languages:guideAlternates(locale,guide)}})),
 ]);
 return [...landing,...resources];
}
