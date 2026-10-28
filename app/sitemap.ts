import type { MetadataRoute } from 'next';
import { languageAlternates } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  // The root redirects to login; financial screens must never enter the sitemap.
  return ['pt', 'en', 'es'].map(locale => ({ url: languageAlternates[locale as 'pt' | 'en' | 'es'], alternates: { languages: languageAlternates } }));
}
