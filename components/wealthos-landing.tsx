'use client';

import { useEffect, useRef, useState } from 'react';
import { landingCopy, type LandingLocale } from '../lib/landing-copy';
import styles from './wealthos-landing.module.css';

function Icon({ name = 'arrow', size = 20 }: { name?: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>, diagonal:<path d="M6 18 18 6M6 6h12v12"/>,
    wallet:<><path d="M19 8V5H5a2 2 0 0 0 0 4h15v11H5a2 2 0 0 1-2-2V7"/><path d="M20 12h-5v5h5m-3-2.5h.1"/></>,
    chart:<><path d="M4 4v16h16M7 14l4-5 4 3 5-7"/></>,
    receipt:<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6m-6 4h6"/></>,
    phone:<><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 13h2"/></>,
    check:<path d="m5 12 4 4L19 6"/>, plus:<path d="M12 5v14M5 12h14"/>, down:<path d="M12 4v16m-6-6 6 6 6-6"/>,
    leaf:<><path d="M5 19C-1 8 10 3 20 4c1 10-6 17-15 15ZM5 19l9-9"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.arrow}</svg>;
}
function Brand() { return <span className={styles.brand}><svg viewBox="0 0 40 40" width="35" height="35" fill="none" aria-hidden="true"><path d="M7 10c5-2 9-1 13 2v20c-4-3-8-4-13-2V10Z" fill="currentColor"/><path d="M33 10c-5-2-9-1-13 2v20c4-3 8-4 13-2V10Z" fill="currentColor" opacity=".55"/><path d="m24 24 2-3 2 1 2-3" stroke="#141715" strokeWidth="1.5"/></svg><span>Wealth<span className={styles.brandLight}>OS</span></span></span>; }

function preferredLanguage(): LandingLocale {
  let saved: string | null = null;
  try { saved = localStorage.getItem('wealthos:language'); } catch {}
  if (!saved) saved = document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('wealthos_language='))?.split('=')[1] ?? null;
  if (saved === 'pt' || saved === 'en' || saved === 'es') return saved;
  for (const language of navigator.languages ?? [navigator.language]) {
    const code = language.toLowerCase().split('-')[0];
    if (code === 'pt' || code === 'en' || code === 'es') return code;
  }
  return 'en';
}

export default function WealthOSLanding({ locale = 'pt', automatic = false }: { locale?: LandingLocale; automatic?: boolean }) {
  const [language, setLanguage] = useState<LandingLocale>(locale);
  const [annual, setAnnual] = useState(false);
  const [separate, setSeparate] = useState(false);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const c = landingCopy[language];
  const money = (amount:number) => new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-MX' : 'en-US', {style:'currency',currency:'BRL',maximumFractionDigits:2}).format(amount);
  useEffect(() => {
    const selected = automatic ? preferredLanguage() : locale;
    setLanguage(selected);
    document.documentElement.lang = selected === 'pt' ? 'pt-BR' : selected;
    if (!automatic) {
      try { localStorage.setItem('wealthos:language', selected); } catch {}
      document.cookie = `wealthos_language=${selected}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    }
  }, [automatic, locale]);
  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) { entry.target.setAttribute('data-visible','true'); observer.unobserve(entry.target); } }), {threshold:0.12});
    element.querySelectorAll('[data-reveal]').forEach(target=>observer.observe(target));
    element.dataset.motion = 'ready';
    return ()=>observer.disconnect();
  }, []);
  function chooseLanguage(value:string) {
    if(value!=='pt'&&value!=='en'&&value!=='es') return;
    try { localStorage.setItem('wealthos:language',value); } catch {}
    document.cookie = `wealthos_language=${value}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    window.location.assign(value==='pt'?'/':`/${value}`);
  }
  const months = language==='pt'?['Mai','Jun','Jul','Ago','Set','Out']:language==='es'?['May','Jun','Jul','Ago','Sep','Oct']:['May','Jun','Jul','Aug','Sep','Oct'];
  const bars = annual ? [42,57,49,69,63,86] : [36,62,46,76,58,88];
  return <div ref={root} className={styles.page}>
    <a className={styles.skip} href="#content">{c.skip}</a>
    <header className={styles.header}>
      <a href={language==='pt'?'/':`/${language}`} aria-label="WealthOS"><Brand/></a>
      <nav aria-label={c.nav}><a href="#feedbacks" className={styles.feedbackNav}>{c.feedback}</a><a href="/login" className={styles.login}>{c.login}<Icon name="diagonal" size={16}/></a></nav>
    </header>
    <main id="content">
      <section className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.heroOrbits} aria-hidden="true"><i/><i/><i/></div>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span/>{c.eyebrow}</p>
          <h1 id="landing-title">{c.title}<br/><em>{c.italic}</em></h1>
          <p className={styles.intro}>{c.intro}</p>
          <div className={styles.heroActions}><a className={styles.primary} href="/login">{c.start}<Icon name="diagonal"/></a><a className={styles.explore} href="#explore">{c.explore}<Icon name="down" size={16}/></a></div>
          <p className={styles.helper}>{c.helper}</p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.visualHalo} aria-hidden="true"/>
          <div className={styles.dashboard}>
            <div className={styles.demoTop}><span className={styles.miniMark}><Icon name="leaf" size={16}/>WEALTHOS</span><span className={styles.demoDot}/></div>
            <div className={styles.demoHeading}><span>{c.overview}</span><div className={styles.segment}><button type="button" aria-pressed={!annual} onClick={()=>setAnnual(false)}>{c.month}</button><button type="button" aria-pressed={annual} onClick={()=>setAnnual(true)}>{c.year}</button></div></div>
            <div className={styles.balance}><span>{c.balance}</span><strong key={String(annual)} aria-live="polite">{money(annual?18940:8420)}</strong><span className={styles.balanceRule}/></div>
            <div className={styles.movement}><div><span><i/> {c.income}</span><strong>{money(annual?68400:6800)}</strong></div><div><span><i/> {c.expense}</span><strong>{money(annual?49460:4280)}</strong></div></div>
            <div className={styles.chartHeading}><span>{c.flow}</span><span>BRL</span></div>
            <div className={styles.chart} aria-label={c.period}>
              {bars.map((height,index)=><button key={index} type="button" className={styles.chartColumn} onMouseEnter={()=>setActiveBar(index)} onMouseLeave={()=>setActiveBar(null)} onFocus={()=>setActiveBar(index)} onBlur={()=>setActiveBar(null)} onClick={()=>setActiveBar(activeBar===index?null:index)} aria-label={`${months[index]}: ${c.income} ${money((index+3)*680)}, ${c.expense} ${money((index+2)*510)}`}><span className={styles.barPair}><span style={{height:`${height}%`,animationDelay:`${index*80}ms`}}/><span style={{height:`${height*.66}%`,animationDelay:`${index*80+80}ms`}}/></span><span className={styles.month}>{months[index]}</span>{activeBar===index&&<span className={styles.chartTooltip}><b>{months[index]}</b><span>{c.income}: {money((index+3)*680)}</span><span>{c.expense}: {money((index+2)*510)}</span></span>}</button>)}
            </div>
            <p className={styles.demoCaption}><span/>{c.demo}</p>
          </div>
          <div className={styles.floatingAccount}><span className={styles.accountIcon}><Icon name="wallet"/></span><div><span>{c.meal}</span><strong>{money(640)}</strong></div><span className={styles.separatePill}>{c.separated}</span></div>
        </div>
        <a className={styles.scrollCue} href="#explore"><span>{c.scroll}</span><i/></a>
      </section>
      <div className={styles.principles}>{c.strip.map((text,index)=><span key={text}><small>0{index+1}</small>{text}<Icon name={['wallet','receipt','chart'][index]} size={20}/></span>)}</div>
      <section id="explore" className={`${styles.section} ${styles.accountSection}`}>
        <div data-reveal className={styles.sectionCopy}><p className={styles.eyebrow}>{c.order}</p><h2>{c.orderTitle}<br/><em>{c.orderItalic}</em></h2><p className={styles.body}>{c.orderBody}</p><div className={styles.accountTabs} aria-label={c.toggleLabel}><button type="button" aria-pressed={!separate} onClick={()=>setSeparate(false)}><Icon name="wallet"/><span><strong>{c.wallet}</strong><small>{c.walletBody}</small></span><span className={styles.radio}/></button><button type="button" aria-pressed={separate} onClick={()=>setSeparate(true)}><Icon name="leaf"/><span><strong>{c.savings}</strong><small>{c.savingsBody}</small></span><span className={styles.radio}/></button></div></div>
        <div data-reveal className={styles.accountScene}>
          <div className={styles.bankCard} key={String(separate)}><div className={styles.cardTop}><span>WealthOS</span><Icon name={separate?'leaf':'wallet'} size={24}/></div><div className={styles.cardChip} aria-hidden="true"><i/><i/></div><span className={styles.cardName}>{separate?c.reserve:c.wallet}</span><strong>{money(separate?12500:8420)}</strong><div className={styles.cardBottom}><span><i/>{separate?c.excluded:c.included}</span><span>•••• 0{separate?'2':'1'}</span></div></div>
          <span className={styles.sceneLabel}>{c.demo}</span><div className={styles.sceneLines} aria-hidden="true"/>
        </div>
      </section>
      <section className={`${styles.section} ${styles.investmentSection}`}>
        <div data-reveal className={styles.investmentVisual}><div className={styles.portfolioHeader}><Icon name="chart"/><span>{c.investments}</span><Icon name="diagonal" size={16}/></div><div className={styles.portfolioMain}><div className={styles.donut}><span>WealthOS<small>{c.distribution}</small></span></div><div className={styles.allocation}>{c.assets.map((name,index)=><div key={name}><span><i style={{background:['#cfbb8e','#6c8075','#404b44'][index]}}/>{name}</span><strong>{[45,35,20][index]}%</strong></div>)}</div></div><div className={styles.portfolioFooter}><span>{c.demo}</span><span>BRL</span></div></div>
        <div data-reveal className={styles.sectionCopy}><p className={styles.eyebrow}>{c.future}</p><h2>{c.futureTitle}<br/><em>{c.futureItalic}</em></h2><p className={styles.body}>{c.futureBody}</p><p className={styles.assetTypes}>{c.investmentNote}</p><a className={styles.textLink} href="/login">{c.futureLink}<Icon name="diagonal"/></a></div>
      </section>
      <section className={`${styles.section} ${styles.details}`}><div data-reveal className={styles.detailHeading}><p className={styles.eyebrow}>{c.details}</p><h2>{c.detailTitle} <em>{c.detailItalic}</em></h2></div><div className={styles.detailGrid}>{c.features.map(([title,body],index)=><article data-reveal key={title}><span className={styles.detailIcon}><Icon name={['receipt','chart','phone'][index]} size={28}/></span><span className={styles.detailNumber}>0{index+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section id="feedbacks" className={`${styles.section} ${styles.feedbackSection}`}><div data-reveal><p className={styles.eyebrow}>{c.feedbackEyebrow}</p><h2>{c.feedbackTitle}<br/><em>{c.feedbackItalic}</em></h2><p className={styles.body}>{c.feedbackBody}</p><span className={styles.feedbackSignature}>WealthOS <i>↗</i></span></div><form data-reveal className={styles.feedbackForm} action="https://github.com/matheusaaguirra/WealthOS/issues/new" method="get" target="_blank"><input type="hidden" name="title" value="[Feedback] WealthOS"/><label htmlFor="feedback-message">{c.feedbackLabel}</label><textarea id="feedback-message" name="body" required minLength={10} maxLength={1800} rows={5} placeholder={c.feedbackPlaceholder} aria-describedby="feedback-note"/><button className={styles.primary} type="submit">{c.feedbackSubmit}<Icon name="diagonal"/></button><p id="feedback-note">{c.feedbackNote}</p></form></section>
      <section className={`${styles.section} ${styles.faq}`}><div data-reveal><p className={styles.eyebrow}>{c.faq}</p><h2>{c.faqTitle}</h2></div><div data-reveal>{c.questions.map(([question,answer])=><details key={question}><summary>{question}<Icon name="plus" size={18}/></summary><p>{answer}</p></details>)}</div></section>
      <section className={styles.closing}><div aria-hidden="true" className={styles.closingOrbit}/><div data-reveal><span className={styles.closingMark}><Icon name="leaf" size={30}/></span><h2>{c.end}<br/><em>{c.endItalic}</em></h2><a className={styles.primary} href="/login">{c.start}<Icon name="diagonal"/></a></div></section>
    </main>
    <footer className={styles.footer}><div className={styles.footerTop}><a href={language==='pt'?'/':`/${language}`} aria-label="WealthOS"><Brand/></a><p>{c.footer}</p><select aria-label={c.language} value={language} onChange={event=>chooseLanguage(event.target.value)}><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option></select></div><div className={styles.footerBottom}><p>{c.disclaimer}</p><span>© {new Date().getFullYear()} WealthOS · {c.rights}</span></div></footer>
  </div>;
}
