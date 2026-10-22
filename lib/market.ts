export const SANDBOX = ['PETR4', 'VALE3', 'ITUB4', 'MGLU3'] as const;
export const STOCK_RANGES = ['5d', '1mo', '3mo'] as const;
const names:Record<string,string>={PETR4:'Petrobras',VALE3:'Vale',ITUB4:'Itaú Unibanco',MGLU3:'Magazine Luiza'};
const sectors:Record<string,string>={PETR4:'Commodities',VALE3:'Commodities',ITUB4:'Bancos',MGLU3:'Consumo'};
export class MarketError extends Error { constructor(public status:number,message:string){super(message);} }
export function stockInput(ticker:string|null,range:string|null){
  const symbol=(ticker??'PETR4').trim().toUpperCase();const period=range??'1mo';
  if(!/^[A-Z][A-Z0-9]{3}\d{1,2}F?$/.test(symbol))throw new MarketError(400,'Ticker inválido. Exemplo: PETR4.');
  if(!STOCK_RANGES.includes(period as typeof STOCK_RANGES[number]))throw new MarketError(400,'Período não disponível. Use 5d, 1mo ou 3mo.');
  return {symbol,period};
}
function positive(value:unknown):number|null{const n=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;return Number.isFinite(n)&&n>0?n:null;}
function iso(value:unknown):string|null{const date=typeof value==='number'?new Date(value*1000):typeof value==='string'?new Date(value):null;return date&&Number.isFinite(date.getTime())?date.toISOString():null;}
export function normalizeStock(payload:any,ticker:string,range:string,now=new Date().toISOString()){
  const quote=payload?.results?.find((q:any)=>String(q.symbol).toUpperCase()===ticker);
  if(!quote)throw new MarketError(502,'A BRAPI não retornou uma cotação válida para este ativo.');
  const value=positive(quote.regularMarketPrice);const cents=value===null?null:Math.round(value*100);
  if(cents!==null&&(!Number.isSafeInteger(cents)||cents<1||cents>1_000_000_000))throw new MarketError(502,'A cotação recebida não tem precisão monetária válida.');
  if(quote.currency&&quote.currency!=='BRL')throw new MarketError(502,'A fonte retornou uma moeda diferente de BRL.');
  const historyMap=new Map<string,{date:string;close:number}>();
  for(const point of Array.isArray(quote.historicalDataPrice)?quote.historicalDataPrice:[]){const date=iso(point.date);const close=positive(point.close);if(date&&close!==null)historyMap.set(date,{date,close});}
  const history=[...historyMap.values()].sort((a,b)=>a.date.localeCompare(b.date));
  return {source:'brapi',ticker,name:quote.longName||names[ticker]||quote.shortName||ticker,sector:sectors[ticker]??'Não classificado',currency:'BRL',priceCents:cents,changePercent:typeof quote.regularMarketChangePercent==='number'&&Number.isFinite(quote.regularMarketChangePercent)?quote.regularMarketChangePercent:null,asOf:iso(quote.regularMarketTime),history,range,cachedAt:now,supported:true,delayed:true};
}
export async function fetchStock(ticker:string,range:string,token?:string,fetcher:typeof fetch=fetch){
  if(!token&&!SANDBOX.includes(ticker as typeof SANDBOX[number]))throw new MarketError(403,'Sem chave BRAPI, estão disponíveis PETR4, VALE3, ITUB4 e MGLU3. Sua posição pode ser salva; a cotação deste ticker exige uma chave com cobertura no plano.');
  const url=new URL('https://brapi.dev/api/quote/'+ticker);url.searchParams.set('range',range);url.searchParams.set('interval','1d');
  const response=await fetcher(url,{headers:{Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{})},signal:AbortSignal.timeout(12_000)});
  if(!response.ok){if(response.status===401||response.status===403)throw new MarketError(403,'A BRAPI não liberou este ativo ou histórico no acesso atual. Verifique a chave e a cobertura do plano gratuito.');if(response.status===429)throw new MarketError(429,'Limite gratuito da BRAPI atingido. Aguarde antes de consultar novamente.');throw new MarketError(502,'A BRAPI está indisponível neste momento. Tente novamente mais tarde.');}
  return normalizeStock(await response.json(),ticker,range);
}
export const CRYPTO_NAMES:Record<string,string>={BTC:'Bitcoin',ETH:'Ethereum',SOL:'Solana',BNB:'BNB',XRP:'XRP',ADA:'Cardano',DOGE:'Dogecoin',USDT:'Tether'};
export function normalizeCrypto(payload:any,now=new Date().toISOString()){
  const rates=payload?.data?.rates;if(payload?.data?.currency!=='USD'||!rates||typeof rates!=='object')throw new MarketError(502,'A fonte de criptomoedas retornou dados incompatíveis.');
  const coins=Object.entries(CRYPTO_NAMES).map(([symbol,name])=>{const rate=positive(rates[symbol]);const price=rate===null?null:Number((1/rate).toFixed(8));return {symbol,name,price:price!==null&&Number.isFinite(price)?price:null,changePercent:null,asOf:null};});
  return {source:'coinbase',currency:'USD',coins,cachedAt:now,error:coins.every(c=>c.price===null)?'Nenhuma cotação disponível na fonte.':undefined};
}
export async function fetchCrypto(fetcher:typeof fetch=fetch){
  const response=await fetcher('https://api.coinbase.com/v2/exchange-rates?currency=USD',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12_000)});
  if(!response.ok)throw new MarketError(response.status===429?429:502,'A fonte pública de criptomoedas está indisponível. Os gráficos externos continuam disponíveis.');
  return normalizeCrypto(await response.json());
}
