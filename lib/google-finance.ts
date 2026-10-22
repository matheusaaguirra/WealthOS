import { MarketError } from './market';

export const GOOGLE_RANGES = ['1d', '5d', '1mo'] as const;
export function googleInput(ticker:string|null,range:string|null){
  const symbol=(ticker??'').trim().toUpperCase();const period=range??'1mo';
  if(!/^[A-Z][A-Z0-9]{3}\d{1,2}F?$/.test(symbol))throw new MarketError(400,'Informe o ticker brasileiro, como WEGE3 ou BBAS3.');
  if(!GOOGLE_RANGES.includes(period as typeof GOOGLE_RANGES[number]))throw new MarketError(400,'Escolha o período de 1 dia, 5 dias ou 1 mês.');
  return {symbol,period};
}
export function googleSourceUrl(ticker:string){return 'https://www.google.com/finance/quote/'+encodeURIComponent(ticker)+':BVMF?hl=pt-BR';}
const positive=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>0;
const finite=(n:unknown):number|null=>typeof n==='number'&&Number.isFinite(n)?n:null;
function cents(n:unknown):number|null{if(!positive(n))return null;const v=Math.round(n*100);return Number.isSafeInteger(v)&&v>=1&&v<=1e9?v:null;}
function timestamp(n:unknown){return positive(n)&&n>=946684800&&n<=4133980800?new Date(n*1000).toISOString():null;}

/** Parse only JSON arrays embedded in the public HTML. Never execute page JavaScript. */
export function embeddedArrays(html:string):unknown[][]{
  const result:unknown[][]=[];
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)){
    const script=match[1];if(!script.includes('AF_initDataCallback('))continue;
    const data=/\bdata\s*:\s*(\[)/.exec(script);if(!data)continue;
    const start=data.index+data[0].lastIndexOf('[');let depth=0,quoted=false,escaped=false;
    for(let i=start;i<script.length;i++){
      const ch=script[i];
      if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;continue;}
      if(ch==='"'){quoted=true;continue;}if(ch==='[')depth++;
      else if(ch===']'&&--depth===0){try{const parsed=JSON.parse(script.slice(start,i+1));if(Array.isArray(parsed))result.push(parsed);}catch{}break;}
    }
  }
  return result;
}
function visitArrays(root:unknown,visit:(node:any[])=>void,skip?:(node:any[])=>boolean){
  const stack:unknown[]=[root];let count=0;
  while(stack.length){const node=stack.pop();if(!Array.isArray(node)||skip?.(node))continue;if(++count>250000)throw new MarketError(502,'A página retornou uma estrutura de dados maior que a esperada.');visit(node);for(let i=node.length-1;i>=0;i--)if(Array.isArray(node[i]))stack.push(node[i]);}
}
function googleDate(parts:unknown):string|null{
  if(!Array.isArray(parts))return null;const [y,m,d,h=0,min=0,sec=0]=parts;const offset=parts[7]?.[0];
  if(!Number.isInteger(y)||y<2000||y>2100||!Number.isInteger(m)||m<1||m>12||!Number.isInteger(d)||d<1||d>31)return null;
  const hour=h??0,minute=min??0,second=sec??0;
  if(!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59||!Number.isInteger(second)||second<0||second>59||!Number.isInteger(offset)||Math.abs(offset)>14*3600)return null;
  const local=new Date(Date.UTC(y,m-1,d,hour,minute,second));if(local.getUTCFullYear()!==y||local.getUTCMonth()!==m-1||local.getUTCDate()!==d)return null;
  return new Date(local.getTime()-offset*1000).toISOString();
}
export function parseGoogleFinance(html:string,ticker:string,range:string,now=new Date().toISOString()){
  if(html.length>4_000_000)throw new MarketError(502,'A página do Google excedeu o tamanho esperado.');
  if(/<title>\s*Unsupported\s*<\/title>|Your device isn.t supported|Google Finance isn.t supported on this device/i.test(html))throw new MarketError(502,'O Google não disponibilizou os dados para esta consulta. Abra a página original para consultar.');
  if(/<title>[^<]*(?:unusual traffic|Before you continue|consent|captcha)/i.test(html)||/Our systems have detected unusual traffic|g-recaptcha|id="captcha-form"/i.test(html))throw new MarketError(403,'O Google solicitou uma verificação de acesso. A consulta automática foi interrompida; use a página original.');
  let quote:any[]|null=null,metrics:any[]|null=null;
  const candidates:{date:string;close:number}[][]=[];
  const matches=(v:any)=>Array.isArray(v)&&v[0]===ticker&&v[1]==='BVMF';
  for(const data of embeddedArrays(html))visitArrays(data,node=>{
    if(matches(node[1])&&typeof node[0]==='string'&&/^\/(?:m|g)\/[A-Za-z0-9_]+$/.test(node[0])&&typeof node[2]==='string'&&node[4]==='BRL'&&Array.isArray(node[5])&&cents(node[5][0])!==null){if(!quote||(node[11]?.[0]??0)>((quote as any[])[11]?.[0]??0))quote=node;}
    if(matches(node[0]?.[1])&&node[12]==='BRL'&&node[13]===ticker+':BVMF'&&node[14]&&cents(node[6])!==null)metrics=node;
    if(matches(node[0])&&node[2]==='BRL'&&Array.isArray(node[3])){
      const points=new Map<string,{date:string;close:number}>();
      visitArrays(node[3],row=>{const date=googleDate(row[0]);const close=Array.isArray(row[1])?row[1][0]:null;if(date&&positive(close)&&cents(close)!==null)points.set(date,{date,close});},row=>[row[0],row[1]].some(identity=>Array.isArray(identity)&&typeof identity[0]==='string'&&typeof identity[1]==='string'&&(identity[0]!==ticker||identity[1]!=='BVMF'))||(matches(row[0])&&typeof row[2]==='string'&&row[2]!=='BRL'));
      if(points.size>=2&&points.size<=10000)candidates.push([...points.values()].sort((a,b)=>a.date.localeCompare(b.date)));
    }
  });
  if(!quote)throw new MarketError(502,'Não foi possível identificar uma cotação válida deste ticker na página do Google. Nenhum preço foi estimado.');
  const q=quote as any[];const m=metrics as any[]|null;
  const days=(rows:{date:string}[])=>(Date.parse(rows.at(-1)!.date)-Date.parse(rows[0].date))/86400000;
  // Select an actual series of the requested span; never relabel intraday points as a monthly history.
  const eligible=candidates.filter(rows=>{const span=days(rows);return range==='1d'?span<1:range==='5d'?span>=1&&span<=9:span>=10&&span<=45;});
  const newest=(a:{date:string}[],b:{date:string}[])=>b.at(-1)!.date.localeCompare(a.at(-1)!.date)||days(b)-days(a)||b.length-a.length;
  eligible.sort(newest);
  const daily=candidates.filter(rows=>days(rows)>=10&&days(rows)<=45&&rows.length<=45).sort(newest);
  // If the page omits a dedicated 5-day series, use its last five actual daily observations.
  const history=eligible[0]??(range==='5d'?daily[0]?.slice(-5):undefined)??[];
  return {source:'google-finance',ticker,name:q[2].slice(0,150),sector:'Não classificado',currency:'BRL',priceCents:cents(q[5][0]),changePercent:finite(q[5][2]),asOf:timestamp(q[11]?.[0]),history,range,cachedAt:now,supported:true,delayed:true,experimental:true,sourceUrl:googleSourceUrl(ticker),metrics:{previousCloseCents:cents(q[7]),openCents:cents(m?.[2]),highCents:cents(m?.[5]),lowCents:cents(m?.[4]),marketCap:positive(m?.[16])?m![16]:null,volume:positive(m?.[17])?m![17]:null}};
}
async function boundedHtml(response:Response){
  if(Number(response.headers.get('Content-Length'))>4_000_000)throw new MarketError(502,'A resposta do Google é maior que o esperado.');
  const reader=response.body?.getReader();if(!reader)throw new MarketError(502,'A página do Google veio vazia.');
  const decoder=new TextDecoder();let bytes=0,html='';
  try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>4_000_000){await reader.cancel();throw new MarketError(502,'A resposta do Google é maior que o esperado.');}html+=decoder.decode(value,{stream:true});}return html+decoder.decode();}finally{reader.releaseLock();}
}
export async function fetchGoogleFinance(ticker:string,range:string,fetcher:typeof fetch=fetch){
  const input=googleInput(ticker,range);const url=googleSourceUrl(input.symbol);
  const response=await fetcher(url,{redirect:'manual',headers:{Accept:'text/html','Accept-Language':'pt-BR,pt;q=0.9','User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'},signal:AbortSignal.timeout(15000)});
  if(response.status===429)throw new MarketError(429,'O Google limitou as consultas. Aguarde antes de tentar novamente.');
  if(response.status===403||response.status>=300&&response.status<400)throw new MarketError(403,'O Google não liberou esta consulta automática. Abra o ativo na página original.');
  if(!response.ok)throw new MarketError(502,'O Google Finanças está indisponível para esta consulta.');
  if(!(response.headers.get('Content-Type')??'').includes('text/html'))throw new MarketError(502,'O Google retornou uma resposta inesperada.');
  return parseGoogleFinance(await boundedHtml(response),input.symbol,input.period);
}
