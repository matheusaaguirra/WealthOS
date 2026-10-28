import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../../lib/seo';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: 'WealthOS',
  robots: { index: process.env.VERCEL_ENV !== 'preview', follow: true },
  manifest:'/manifest.webmanifest',
  icons: { icon: '/favicon.svg',apple:'/icons/apple-touch-icon.png' },
  appleWebApp:{capable:true,title:'WealthOS',statusBarStyle:'default'},
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR"><body style={{margin:0}}>{children}</body></html>; }
