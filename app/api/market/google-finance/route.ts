import { fetchGoogleFinance, googleInput, googleSourceUrl } from '@/lib/google-finance';
import { marketCache } from '@/lib/market-cache';
import { MarketError } from '@/lib/market';
const failures=new Map<string,{until:number;status:number;error:string}>();
export async function GET(request:Request){
  let ticker='';
  try{
    const url=new URL(request.url);const input=googleInput(url.searchParams.get('ticker'),url.searchParams.get('range'));ticker=input.symbol;
    const key=ticker+':'+input.period;const blocked=failures.get(key);
    if(blocked&&blocked.until>Date.now())throw new MarketError(blocked.status,blocked.error);
    const data=await marketCache('google-finance-v1:'+key,900,async()=>{
      try{return await fetchGoogleFinance(ticker,input.period);}catch(e){const status=e instanceof MarketError?e.status:502;const error=e instanceof MarketError?e.message:'Não foi possível consultar o Google Finanças. Tente novamente mais tarde.';if(failures.size>=200)failures.delete(failures.keys().next().value!);failures.set(key,{until:Date.now()+60000,status,error});throw new MarketError(status,error);}
    });
    return Response.json(data,{headers:{'Cache-Control':'private, max-age=60','X-Market-Source':'google-finance'}});
  }catch(e){const status=e instanceof MarketError?e.status:502;return Response.json({source:'google-finance',ticker,supported:false,priceCents:null,history:[],sourceUrl:ticker?googleSourceUrl(ticker):null,error:e instanceof MarketError?e.message:'Não foi possível consultar o Google Finanças.'},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'60'}:{})}});}
}
