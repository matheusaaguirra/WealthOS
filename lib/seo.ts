export const SITE_URL = 'https://wealthos.com.br';
export const PUBLIC_URL = `${SITE_URL}/sobre`;
export const SITE_TITLE = 'WealthOS — Controle financeiro pessoal e investimentos';
export const SITE_DESCRIPTION = 'Organize receitas, despesas e gastos fixos, separe o saldo das suas contas e acompanhe investimentos. Conheça o controle financeiro pessoal do WealthOS.';

// Only public product information belongs here. Never include account state.
export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'WealthOS', url: PUBLIC_URL, logo: `${SITE_URL}/icons/app-512.png` },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'WealthOS', url: PUBLIC_URL, inLanguage: 'pt-BR', publisher: { '@id': `${SITE_URL}/#organization` } },
    { '@type': 'WebApplication', '@id': `${PUBLIC_URL}#application`, name: 'WealthOS', url: PUBLIC_URL, description: SITE_DESCRIPTION, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', inLanguage: 'pt-BR', browserRequirements: 'Requer conexão com a internet e navegador atualizado.', featureList: ['Controle de receitas e despesas por categoria', 'Gastos fixos mensais', 'Contas com saldos separados', 'Carteira de investimentos', 'Relatórios em PDF', 'Instalação como PWA'], publisher: { '@id': `${SITE_URL}/#organization` } },
  ],
};
