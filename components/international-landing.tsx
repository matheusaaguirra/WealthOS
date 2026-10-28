import { internationalCopy, type InternationalLocale } from '../lib/international-copy';
import { internationalStructuredData } from '../lib/seo';
import styles from './public-landing.module.css';

function Arrow() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

export default function InternationalLanding({ locale }: { locale: InternationalLocale }) {
  const c = internationalCopy[locale];
  return <div className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(internationalStructuredData(locale)).replace(/</g, '\\u003c') }} />
    <a className={styles.skip} href="#content">{c.skip}</a>
    <header className={styles.header}>
      <a className={styles.brand} href={`/${locale}`} aria-label="WealthOS"><img src="/favicon.svg" width="36" height="36" alt="" />Wealth<span>OS</span></a>
      <nav aria-label={c.navigation}><a className={styles.navLink} href="#features">{c.featuresLink}</a><a className={styles.navLink} href="#questions">{c.questionsLink}</a><a className={styles.login} href="/login">{c.login} <Arrow /></a></nav>
    </header>
    <div className={styles.languageBar}><nav aria-label={c.languages}><a href="/sobre" hrefLang="pt" lang="pt">Português</a><a href="/en" hrefLang="en" lang="en" aria-current={locale === 'en' ? 'page' : undefined}>English</a><a href="/es" hrefLang="es" lang="es" aria-current={locale === 'es' ? 'page' : undefined}>Español</a></nav></div>
    <main id="content">
      <section className={styles.hero} aria-labelledby="title">
        <div className={styles.heroText}><p className={styles.eyebrow}>{c.eyebrow}</p><h1 id="title">{c.hero[0]}<br />{c.hero[1]}<em>{c.hero[2]}</em></h1><p className={styles.intro}>{c.intro}</p><a className={styles.cta} href="/login">{c.cta} <Arrow /></a><p className={styles.helper}>{c.helper}</p><p className={styles.availability}>{c.availability}</p></div>
        <aside className={styles.notebook} aria-label={c.notebookLabel}>
          <div className={styles.notebookHeader}><span>{c.notebookEyebrow}</span><img src="/favicon.svg" alt="" width="27" height="27" /></div>
          <p className={styles.notebookTitle}>{c.notebookTitle[0]}<br />{c.notebookTitle[1]}</p>
          {c.accounts.map(([name, description, tag], index) => <div className={styles.accountLine} key={name}><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span><div><strong>{name}</strong><span>{description}</span></div><span className={styles.accountTag}>{tag}</span></div>)}
          <p className={styles.notebookNote}>{c.notebookNote}</p>
        </aside>
      </section>
      <section id="features" className={styles.resources} aria-labelledby="features-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>{c.featuresEyebrow}</p><h2 id="features-title">{c.featuresTitle[0]}<br />{c.featuresTitle[1]}</h2></div>
        <div className={styles.resourceRows}>{c.features.map(feature => <article key={feature.index}><span className={styles.rowIndex}>{feature.index}</span><h3>{feature.title}</h3><div><p>{feature.body}</p>{feature.items ? <ul>{feature.items.map(item => <li key={item}>{item}</li>)}</ul> : null}{feature.note ? <p className={styles.finePrint}>{feature.note}</p> : null}</div></article>)}</div>
      </section>
      <section className={styles.steps} aria-labelledby="start-title">
        <div><p className={styles.eyebrow}>{c.stepsEyebrow}</p><h2 id="start-title">{c.stepsTitle[0]}<br />{c.stepsTitle[1]}</h2><a className={styles.textLink} href="/login">{c.stepsLink} <Arrow /></a></div>
        <ol>{c.steps.map(([title, body]) => <li key={title}><strong>{title}</strong><p>{body}</p></li>)}</ol>
      </section>
      <section id="questions" className={styles.faq} aria-labelledby="questions-title"><div><p className={styles.eyebrow}>{c.questionsEyebrow}</p><h2 id="questions-title">{c.questionsTitle}</h2></div><div>{c.questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className={styles.footer}><a className={styles.brand} href={`/${locale}`}><img src="/favicon.svg" width="30" height="30" alt="" />Wealth<span>OS</span></a><p>{c.footer}</p><a className={styles.textLink} href="/login">{c.footerLink} <Arrow /></a></footer>
  </div>;
}
