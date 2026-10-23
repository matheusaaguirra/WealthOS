import type { ListedAssetType, SymbolCataloguePage, StockSuggestion } from '../wealthos-source/apps/web/src/stock-suggestions';

export const SYMBOL_PAGE_SIZE=40;
const MAX_BODY_BYTES=1_000_000;
const ticker=/^[A-Z][A-Z0-9]{3}\d{1,2}F?$/;
export class SymbolCatalogueError extends Error {constructor(public status:number,message:string){super(message);}}
export function symbolCatalogueInput(params:URLSearchParams){
  const query=(params.get('q')??'').trim();
  const rawPage=params.get('page')??'1';
  if(query.length>80||/[\u0000-\u001f\u007f]/.test(query))throw new SymbolCatalogueError(400,'Use uma busca de até 80 caracteres.');
  if(!/^[1-9]\d{0,3}$/.test(rawPage)||Number(rawPage)>1000)throw new SymbolCatalogueError(400,'Página de ativos inválida.');
  return {query,page:Number(rawPage)};
}
const assetTypes=new Set(['stock','unit','fii','etf','bdr','fund']);
function cleanName(value:unknown):string|null{return typeof value==='string'&&value.trim()&&value.length<=300&&!/[\u0000-\u001f\u007f]/.test(value)?value.trim():null;}
/** Identity data only: never treat catalogue membership as a guaranteed live quotation. */
export function normalizeSymbolCatalogue(payload:unknown,page:number,retrievedAt=new Date().toISOString()):SymbolCataloguePage {
  const data=payload as {results?:unknown[];pagination?:{page?:unknown;limit?:unknown;totalItems?:unknown;hasNextPage?:unknown}}|null;
  const p=data?.pagination;
  if(!Array.isArray(data?.results)||data.results.length>SYMBOL_PAGE_SIZE||p?.page!==page||p.limit!==SYMBOL_PAGE_SIZE||typeof p.totalItems!=='number'||!Number.isSafeInteger(p.totalItems)||p.totalItems<0||p.totalItems>100000||typeof p.hasNextPage!=='boolean')throw new SymbolCatalogueError(502,'O catálogo retornou dados incompatíveis.');
  const symbols:StockSuggestion[]=[];const seen=new Set<string>();
  for(const raw of data.results){
    const row=raw as {symbol?:unknown;longName?:unknown;name?:unknown;subType?:unknown;assetType?:unknown;isActive?:unknown}|null;
    if(!row||typeof row.symbol!=='string'||!ticker.test(row.symbol)||seen.has(row.symbol))throw new SymbolCatalogueError(502,'O catálogo retornou um código de ativo inválido.');
    const name=cleanName(row.longName)||cleanName(row.name)||row.symbol;
    const type=typeof row.subType==='string'&&assetTypes.has(row.subType)?row.subType:typeof row.assetType==='string'&&assetTypes.has(row.assetType)?row.assetType:'other';
    seen.add(row.symbol);symbols.push({ticker:row.symbol,name,assetType:type as ListedAssetType});
  }
  if(p.totalItems<symbols.length||(!symbols.length&&p.hasNextPage))throw new SymbolCatalogueError(502,'A paginação do catálogo está indisponível.');
  return {symbols,page,pageSize:SYMBOL_PAGE_SIZE,total:p.totalItems,hasMore:p.hasNextPage,source:'brapi',retrievedAt};
}
export async function fetchSymbolCatalogue(query:string,page:number,token?:string,fetcher:typeof fetch=fetch):Promise<SymbolCataloguePage>{
  const url=new URL('https://brapi.dev/api/v2/tickers');
  if(query)url.searchParams.set('search',query.normalize('NFD').replace(/[\u0300-\u036f]/g,''));
  url.searchParams.set('page',String(page));url.searchParams.set('limit',String(SYMBOL_PAGE_SIZE));url.searchParams.set('sortBy','symbol');url.searchParams.set('sortOrder','asc');
  const response=await fetcher(url,{headers:{Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{})},redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new SymbolCatalogueError(response.status===429?429:502,response.status===429?'Limite do catálogo atingido. Aguarde para buscar novamente.':'O catálogo de ativos está temporariamente indisponível.');
  if(!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??''))throw new SymbolCatalogueError(502,'O catálogo não retornou dados JSON.');
  const reader=response.body?.getReader();if(!reader)throw new SymbolCatalogueError(502,'O catálogo retornou uma resposta vazia.');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY_BYTES){await reader.cancel();throw new SymbolCatalogueError(502,'A resposta do catálogo excedeu o limite.');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  let payload:unknown;try{payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new SymbolCatalogueError(502,'O catálogo retornou dados inválidos.');}
  return normalizeSymbolCatalogue(payload,page);
}
