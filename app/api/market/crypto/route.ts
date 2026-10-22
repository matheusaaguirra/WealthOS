import { fetchCrypto,MarketError } from '../../../../lib/market';
import { marketCache } from '../../../../lib/market-cache';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await marketCache('crypto-usd-v1',300,()=>fetchCrypto()),{headers:{'Cache-Control':'private, max-age=60','X-Data-Source':'coinbase'}});}catch(error){return Response.json({source:'coinbase',currency:'USD',coins:[],error:error instanceof MarketError?error.message:'Não foi possível consultar criptomoedas.'},{status:error instanceof MarketError?error.status:502,headers:{'Cache-Control':'no-store'}});}}
