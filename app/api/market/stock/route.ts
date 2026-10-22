import { stockInput, fetchStock, MarketError } from '../../../../lib/market';
import { marketCache, serialBrapi } from '../../../../lib/market-cache';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  let ticker='';try{const url=new URL(request.url);const parsed=stockInput(url.searchParams.get('ticker'),url.searchParams.get('range'));ticker=parsed.symbol;const config=process.env;const token=config.BRAPI_TOKEN?.trim();const data=await marketCache('stock-v1-'+(token?'keyed':'sandbox')+'-'+ticker+'-'+parsed.period,1800,()=>serialBrapi(()=>fetchStock(ticker,parsed.period,token)));return Response.json(data,{headers:{'Cache-Control':'private, max-age=60','X-Data-Source':'brapi'}});}catch(error){const message=error instanceof MarketError?error.message:'Não foi possível consultar a BRAPI. Nenhum preço foi estimado.';return Response.json({source:'brapi',ticker,supported:false,priceCents:null,history:[],error:message},{status:error instanceof MarketError?error.status:502,headers:{'Cache-Control':'no-store'}});}
}
