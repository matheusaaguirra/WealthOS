import type { StockQuote } from '@wealthos/finance';
/** Amostra inteiramente simulada para explorar a interface. Não representa cotações da B3. */
export const STOCK_DEMO:StockQuote[] = [
  {ticker:'ITUB4',name:'Itaú Unibanco',sector:'Bancos',priceCents:3420,changes:{day:1.32,month:4.82,year:12.6}},
  {ticker:'BBDC4',name:'Bradesco',sector:'Bancos',priceCents:1480,changes:{day:-0.54,month:2.16,year:-3.8}},
  {ticker:'BBAS3',name:'Banco do Brasil',sector:'Bancos',priceCents:2530,changes:{day:0.88,month:-1.34,year:8.2}},
  {ticker:'EGIE3',name:'Engie Brasil',sector:'Energia',priceCents:4160,changes:{day:0.72,month:3.45,year:10.4}},
  {ticker:'TAEE11',name:'Taesa',sector:'Energia',priceCents:3540,changes:{day:0.38,month:1.92,year:6.7}},
  {ticker:'CPLE6',name:'Copel',sector:'Energia',priceCents:985,changes:{day:-0.91,month:2.78,year:14.3}},
  {ticker:'PETR4',name:'Petrobras',sector:'Commodities',priceCents:3780,changes:{day:2.14,month:-3.72,year:5.4}},
  {ticker:'VALE3',name:'Vale',sector:'Commodities',priceCents:6140,changes:{day:1.76,month:5.64,year:-8.1}},
  {ticker:'SUZB3',name:'Suzano',sector:'Commodities',priceCents:5480,changes:{day:-1.22,month:-0.86,year:9.2}},
  {ticker:'LREN3',name:'Lojas Renner',sector:'Consumo',priceCents:1620,changes:{day:-0.68,month:6.24,year:-2.5}},
  {ticker:'MGLU3',name:'Magazine Luiza',sector:'Consumo',priceCents:1140,changes:{day:3.42,month:-7.18,year:-18.6}},
  {ticker:'TOTS3',name:'TOTVS',sector:'Tecnologia',priceCents:2940,changes:{day:1.08,month:7.32,year:18.4}},
  {ticker:'LWSA3',name:'LWSA',sector:'Tecnologia',priceCents:485,changes:{day:-1.64,month:-4.28,year:-12.3}},
  {ticker:'POSI3',name:'Positivo Tecnologia',sector:'Tecnologia',priceCents:645,changes:{day:0.46,month:3.16,year:4.7}},
  {ticker:'RDOR3',name:'Rede D’Or',sector:'Saúde',priceCents:2840,changes:{day:0.94,month:4.38,year:16.2}},
  {ticker:'FLRY3',name:'Fleury',sector:'Saúde',priceCents:1530,changes:{day:-0.32,month:1.84,year:7.8}}
];
