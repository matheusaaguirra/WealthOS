import type { MetadataRoute } from 'next';
import { PUBLIC_URL } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  // The root redirects to login; financial screens must never enter the sitemap.
  return [{ url: PUBLIC_URL }];
}
