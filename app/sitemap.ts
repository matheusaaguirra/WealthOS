import type { MetadataRoute } from 'next';
import { languageAlternates } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the landing and its public language variants belong in the sitemap.
  return ['pt', 'en', 'es'].map(locale => ({ url: languageAlternates[locale as 'pt' | 'en' | 'es'], alternates: { languages: languageAlternates } }));
}
