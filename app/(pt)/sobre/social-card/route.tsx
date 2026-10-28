import { ImageResponse } from 'next/og';

const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '65px 80px', background: '#101411', color: '#f0eee7', fontFamily: 'sans-serif' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30 }}><span style={{ fontWeight: 700 }}>WealthOS</span><span style={{ fontSize: 20, color: '#a2aaa1' }}>CONTROLE FINANCEIRO PESSOAL</span></div>
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: 80, lineHeight: 1.1, letterSpacing: '-4px' }}><span>Seu dinheiro.</span><span style={{ color: '#d7c29a' }}>Suas escolhas.</span></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d7c29a40', paddingTop: 24, fontSize: 23 }}><span>Contas · Gastos fixos · Investimentos</span><span>wealthos.com.br</span></div>
  </div>, size);
}
export const dynamic = 'force-static';
