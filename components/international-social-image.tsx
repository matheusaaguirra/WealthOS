import { ImageResponse } from 'next/og';
import { internationalCopy, type InternationalLocale } from '../lib/international-copy';
export function internationalSocialImage(locale: InternationalLocale) {
  const c = internationalCopy[locale];
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '65px 80px', background: '#101411', color: '#f0eee7', fontFamily: 'sans-serif' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30 }}><span style={{ fontWeight: 700 }}>WealthOS</span><span style={{ fontSize: 16, color: '#a2aaa1' }}>{c.eyebrow}</span></div>
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: 88, lineHeight: 1.1, letterSpacing: '-4px' }}><span>{c.hero[0]}</span><span style={{ color: '#d7c29a' }}>{c.hero[1]}{c.hero[2]}</span></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d7c29a40', paddingTop: 24, fontSize: 21 }}><span>{c.socialFeatures}</span><span>wealthos.com.br</span></div>
  </div>, { width: 1200, height: 630 });
}
