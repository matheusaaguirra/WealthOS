import type { Metadata } from 'next';
import { internationalCopy, type InternationalLocale } from './international-copy';
export const SITE_URL = 'https://wealthos.com.br';
export const PUBLIC_URL = `${SITE_URL}/sobre`;
export const SITE_TITLE = 'WealthOS — Controle financeiro pessoal e investimentos';
export const SITE_DESCRIPTION = 'Organize receitas, despesas e gastos fixos, separe o saldo das suas contas e acompanhe investimentos. Conheça o controle financeiro pessoal do WealthOS.';
export const languageAlternates = { pt: PUBLIC_URL, en: `${SITE_URL}/en`, es: `${SITE_URL}/es`, 'x-default': `${SITE_URL}/en` };

export function internationalMetadata(locale: InternationalLocale): Metadata {
  const copy = internationalCopy[locale];
  const url = `${SITE_URL}/${locale}`;
  const image = `/${locale}/social-card`;
  return {
    title: copy.title, description: copy.description,
    alternates: { canonical: url, languages: languageAlternates },
    openGraph: { type: 'website', locale: copy.ogLocale, alternateLocale: ['pt_BR', locale === 'en' ? 'es_ES' : 'en_US'], siteName: 'WealthOS', url, title: copy.title, description: copy.description, images: [{ url: image, width: 1200, height: 630, alt: `WealthOS — ${copy.hero.join(' ')}` }] },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: [image] },
  };
}

// Only public product information belongs here. Never include account state.
export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'WealthOS', url: PUBLIC_URL, logo: `${SITE_URL}/icons/app-512.png` },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'WealthOS', url: PUBLIC_URL, inLanguage: ['pt', 'en', 'es'], publisher: { '@id': `${SITE_URL}/#organization` } },
    { '@type': 'WebApplication', '@id': `${PUBLIC_URL}#application`, name: 'WealthOS', url: PUBLIC_URL, description: SITE_DESCRIPTION, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', inLanguage: 'pt-BR', browserRequirements: 'Requer conexão com a internet e navegador atualizado.', featureList: ['Controle de receitas e despesas por categoria', 'Gastos fixos mensais', 'Contas com saldos separados', 'Carteira de investimentos', 'Relatórios em PDF', 'Instalação como PWA'], publisher: { '@id': `${SITE_URL}/#organization` } },
  ],
};

export function internationalStructuredData(locale: InternationalLocale) {
  const copy = internationalCopy[locale];
  const url = `${SITE_URL}/${locale}`;
  return { '@context': 'https://schema.org', '@graph': [
    ...structuredData['@graph'].map(node => node['@type'] === 'WebApplication' ? { ...node, description: copy.description, browserRequirements: locale === 'en' ? 'Requires an internet connection and an up-to-date browser.' : 'Requiere conexión a internet y un navegador actualizado.', featureList: copy.features.flatMap(feature => feature.items ?? []) } : node),
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: copy.title, description: copy.description, inLanguage: locale, isPartOf: { '@id': `${SITE_URL}/#website` } },
  ] };
}
