import type { Metadata } from 'next';
import { PUBLIC_URL, SITE_DESCRIPTION, SITE_TITLE, structuredData } from '../../lib/seo';
import styles from './sobre.module.css';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: PUBLIC_URL },
  openGraph: { type: 'website', locale: 'pt_BR', siteName: 'WealthOS', url: PUBLIC_URL, title: SITE_TITLE, description: SITE_DESCRIPTION, images: [{ url: '/sobre/opengraph-image', width: 1200, height: 630, alt: 'WealthOS — Seu dinheiro, com mais clareza.' }] },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION, images: ['/sobre/opengraph-image'] },
};

const questions = [
  ['O que é o WealthOS?', 'É um sistema de controle financeiro pessoal para registrar entradas e gastos, organizar contas, configurar despesas fixas e acompanhar sua carteira de investimentos em um só lugar.'],
  ['Posso separar meu vale-refeição do saldo principal?', 'Sim. Você escolhe quais contas compõem sua carteira principal e quais têm saldo separado. Assim, pode registrar gastos do VR e manter uma reserva em outra conta sem somar esses valores ao dinheiro do dia a dia.'],
  ['O sistema puxa meus gastos do banco automaticamente?', 'Atualmente, os registros são feitos por você ou pela importação de um extrato em PDF compatível. Confira os dados importados antes de confirmar os lançamentos. Não é necessário informar sua senha bancária.'],
  ['Consigo usar no celular?', 'Sim. O WealthOS funciona no navegador do celular e pode ser instalado como um aplicativo pela opção disponível em Minha conta. O acesso aos seus registros precisa de internet.'],
  ['Como faço para baixar meus lançamentos?', 'Você pode gerar um relatório em PDF com entradas, despesas, categorias e contas. Também há exportação dos lançamentos do período, para consultar seus registros fora do sistema.'],
];

function Arrow() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

export default function About() {
  return <div className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <a className={styles.skip} href="#conteudo">Pular para o conteúdo</a>
    <header className={styles.header}>
      <a className={styles.brand} href="/sobre" aria-label="WealthOS, apresentação"><img src="/favicon.svg" width="36" height="36" alt="" />Wealth<span>OS</span></a>
      <nav aria-label="Navegação principal"><a className={styles.navLink} href="#recursos">O que você pode fazer</a><a className={styles.navLink} href="#duvidas">Dúvidas</a><a className={styles.login} href="/login">Entrar <Arrow /></a></nav>
    </header>
    <main id="conteudo">
      <section className={styles.hero} aria-labelledby="titulo">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>CONTROLE FINANCEIRO PESSOAL</p>
          <h1 id="titulo">Seu dinheiro,<br />com mais <em>clareza.</em></h1>
          <p className={styles.intro}>Entenda o que entrou, o que saiu e o que ficou. Organize contas, gastos fixos e investimentos no WealthOS, do celular ao computador.</p>
          <a className={styles.cta} href="/login">Organizar minhas finanças <Arrow /></a>
          <p className={styles.helper}>Acesse com Google ou crie sua conta com e-mail.</p>
        </div>
        <aside className={styles.notebook} aria-label="Como organizar suas contas no WealthOS">
          <div className={styles.notebookHeader}><span>SEU ESPAÇO FINANCEIRO</span><img src="/favicon.svg" alt="" width="27" height="27" /></div>
          <p className={styles.notebookTitle}>Cada conta.<br />No seu lugar.</p>
          <div className={styles.accountLine}><span className={styles.number}>01</span><div><strong>Carteira principal</strong><span>O dinheiro para o dia a dia</span></div><span className={styles.accountTag}>Disponível</span></div>
          <div className={styles.accountLine}><span className={styles.number}>02</span><div><strong>Vale-refeição</strong><span>Seus gastos com alimentação</span></div><span className={styles.accountTag}>Separado</span></div>
          <div className={styles.accountLine}><span className={styles.number}>03</span><div><strong>Reservas e investimentos</strong><span>O que você está construindo</span></div><span className={styles.accountTag}>Separado</span></div>
          <p className={styles.notebookNote}>Você define o que entra no saldo principal.</p>
        </aside>
      </section>
      <section id="recursos" className={styles.resources} aria-labelledby="recursos-titulo">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>DO REGISTRO À VISÃO DO TODO</p><h2 id="recursos-titulo">Uma rotina financeira<br />que faz sentido para você.</h2></div>
        <div className={styles.resourceRows}>
          <article><span className={styles.rowIndex}>01 / ORGANIZAR</span><h3>Saiba para onde vai o seu dinheiro.</h3><div><p>Registre receitas e despesas por categoria e conta. Consulte o mês, filtre movimentações e acompanhe entradas e saídas para entender seus hábitos.</p><ul><li>Lançamentos com categorias</li><li>Contas com saldos separados</li><li>Gastos fixos mensais</li></ul></div></article>
          <article><span className={styles.rowIndex}>02 / ACOMPANHAR</span><h3>Olhe também para o que vem pela frente.</h3><div><p>Reúna os ativos da sua carteira e acompanhe cotações, variações e gráficos. Consulte ações, fundos imobiliários, renda fixa, índices e criptomoedas.</p><p className={styles.finePrint}>Cotações podem ter atraso. As informações servem para acompanhamento e não são recomendação de investimento.</p></div></article>
          <article><span className={styles.rowIndex}>03 / CONSULTAR</span><h3>Seus registros, ao alcance da mão.</h3><div><p>Use no celular ou no computador. Importe extratos em PDF compatíveis, revise os lançamentos e exporte um relatório organizado com suas entradas e gastos.</p><ul><li>Relatórios financeiros em PDF</li><li>Histórico associado à sua conta</li><li>Instalação como aplicativo (PWA)</li></ul></div></article>
        </div>
      </section>
      <section className={styles.steps} aria-labelledby="comecar-titulo">
        <div><p className={styles.eyebrow}>COMECE PELO ESSENCIAL</p><h2 id="comecar-titulo">Seu primeiro passo<br />não precisa ser grande.</h2><a className={styles.textLink} href="/login">Acessar o WealthOS <Arrow /></a></div>
        <ol><li><strong>Crie sua conta</strong><p>Entre com Google ou faça seu cadastro com e-mail.</p></li><li><strong>Cadastre sua conta principal</strong><p>Informe o saldo inicial e separe benefícios e reservas, se quiser.</p></li><li><strong>Registre sua primeira movimentação</strong><p>Escolha a categoria e a conta. Seu histórico começa aqui.</p></li></ol>
      </section>
      <section id="duvidas" className={styles.faq} aria-labelledby="duvidas-titulo"><div><p className={styles.eyebrow}>ANTES DE COMEÇAR</p><h2 id="duvidas-titulo">Dúvidas frequentes.</h2></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className={styles.footer}><a className={styles.brand} href="/sobre"><img src="/favicon.svg" width="30" height="30" alt="" />Wealth<span>OS</span></a><p>Clareza para cuidar do seu dinheiro.</p><a className={styles.textLink} href="/login">Entrar na minha conta <Arrow /></a></footer>
  </div>;
}
