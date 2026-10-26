import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'WealthOS — Finanças e investimentos', description: 'Acompanhe suas finanças, ações e mercados.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR"><body style={{margin:0}}>{children}</body></html>; }
