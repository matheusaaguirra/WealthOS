'use client';
import { useId, useState } from 'react';
import type { guideUI, GuideLocale } from '../lib/guides/content';
import { monthlyRemainder, plannerCents } from '../lib/guides/calculation';
import styles from './wealthos-guides.module.css';
export default function MonthlyPlanner({locale,copy}:{locale:GuideLocale;copy:(typeof guideUI)[GuideLocale]}) {
 const c = copy;
 const id = useId();
 const [values,setValues]=useState(['','','','']);
 const [currency,setCurrency]=useState(locale==='pt'?'BRL':locale==='en'?'USD':'EUR');
 const hasValues=values.some(value=>value.trim());
 const result=monthlyRemainder(values);
 const format=new Intl.NumberFormat(locale==='pt'?'pt-BR':locale,{style:'currency',currency});
 return <section id="monthly-planner" className={styles.calculator} aria-labelledby={`${id}-heading`}>
  <p className={styles.eyebrow}>01 / {c.tool}</p><h2 id={`${id}-heading`}>{c.tool}</h2><p>{c.toolIntro}</p>
  <div className={styles.fields}>
   <label htmlFor={`${id}-currency`}>{c.currency}<select id={`${id}-currency`} value={currency} onChange={event=>setCurrency(event.target.value)}><option value="USD">USD · $</option><option value="EUR">EUR · €</option><option value="BRL">BRL · R$</option></select></label>
   {[c.income,c.fixed,c.variable,c.reserve].map((label,index)=><label key={label} htmlFor={`${id}-${index}`}>{label}<input id={`${id}-${index}`} inputMode="decimal" type="text" autoComplete="off" maxLength={16} value={values[index]} placeholder="0" aria-invalid={plannerCents(values[index])===null} aria-describedby={plannerCents(values[index])===null?`${id}-error`:undefined} onChange={event=>setValues(previous=>previous.map((value,i)=>i===index?event.target.value:value))}/></label>)}
  </div>
  <div className={styles.result} aria-live="polite" aria-atomic="true"><span>{c.result}</span><strong>{hasValues&&result!==null?format.format(result/100):'—'}</strong><p>{result===null?<span id={`${id}-error`}>{c.invalid}</span>:hasValues?result<0?c.negative:c.positive:null}</p></div>
  <p className={styles.small}>{c.toolLimit}</p><button type="button" className={styles.clear} onClick={()=>setValues(['','','',''])}>{c.reset} ↺</button>
 </section>;
}
