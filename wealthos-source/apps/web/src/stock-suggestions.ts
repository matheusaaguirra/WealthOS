/** A small symbol directory, never a source of prices or investment recommendations. */
export type ListedAssetType='stock'|'unit'|'fii'|'etf'|'bdr'|'fund'|'other';
export interface StockSuggestion { ticker:string; name:string; assetType?:ListedAssetType; aliases?:readonly string[]; }
export interface SymbolCataloguePage {symbols:StockSuggestion[];page:number;pageSize:number;total:number;hasMore:boolean;source:'brapi';retrievedAt:string;omittedCount?:number;}
export function listedAssetLabel(type:ListedAssetType|undefined):string {return ({stock:'Ação',unit:'Unit',fii:'FII',etf:'ETF',bdr:'BDR',fund:'Fundo',other:'Ativo listado'} as const)[type??'stock'];}

export const STOCK_SUGGESTIONS:readonly StockSuggestion[] = [
  {ticker:'PETR4',name:'Petrobras · preferencial',aliases:['petróleo','petroleo brasileiro']},
  {ticker:'VALE3',name:'Vale'},
  {ticker:'ITUB4',name:'Itaú Unibanco · preferencial',aliases:['itau','banco itau']},
  {ticker:'BBAS3',name:'Banco do Brasil',aliases:['bb']},
  {ticker:'WEGE3',name:'WEG'},
  {ticker:'MGLU3',name:'Magazine Luiza',aliases:['magalu']},
  {ticker:'PETR3',name:'Petrobras · ordinária',aliases:['petróleo','petroleo brasileiro']},
  {ticker:'ITUB3',name:'Itaú Unibanco · ordinária',aliases:['itau','banco itau']},
  {ticker:'BBDC4',name:'Bradesco · preferencial',aliases:['banco bradesco']},
  {ticker:'BBDC3',name:'Bradesco · ordinária',aliases:['banco bradesco']},
  {ticker:'ITSA4',name:'Itaúsa · preferencial',aliases:['itausa']},
  {ticker:'ABEV3',name:'Ambev'},
  {ticker:'B3SA3',name:'B3',aliases:['bolsa']},
  {ticker:'RENT3',name:'Localiza'},
  {ticker:'SUZB3',name:'Suzano'},
  {ticker:'TAEE11',name:'Taesa · units',assetType:'unit'},
  {ticker:'VIVT3',name:'Telefônica Brasil',aliases:['vivo','telefonica']},
  {ticker:'BBSE3',name:'BB Seguridade'},
  {ticker:'EGIE3',name:'Engie Brasil'},
  {ticker:'KLBN11',name:'Klabin · units',assetType:'unit'},
  {ticker:'RADL3',name:'Raia Drogasil',aliases:['rd saude','drogasil']},
  {ticker:'LREN3',name:'Lojas Renner'},
];

function normalized(value:string):string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
}

export function matchStockSuggestions(query:string,limit=6):StockSuggestion[] {
  const term=normalized(query);
  const safeLimit=Math.max(0,Math.min(200,Math.floor(limit)||0));
  if(!term)return STOCK_SUGGESTIONS.slice(0,safeLimit);
  const tokens=term.split(/\s+/);
  return STOCK_SUGGESTIONS.map((stock,index)=>{
    const ticker=normalized(stock.ticker),name=normalized(stock.name);
    const searchable=[ticker,name,...(stock.aliases??[]).map(normalized)].join(' ');
    const score=ticker===term?0:ticker.startsWith(term)?1:name.startsWith(term)?2:tokens.every(token=>searchable.includes(token))?3:Infinity;
    return {stock,index,score};
  }).filter(row=>Number.isFinite(row.score)).sort((a,b)=>a.score-b.score||a.index-b.index).slice(0,safeLimit).map(row=>row.stock);
}
