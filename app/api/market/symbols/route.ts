import { fetchSymbolCatalogue, symbolCatalogueInput, SymbolCatalogueError } from '../../../../lib/symbol-catalogue';
import { marketCache } from '../../../../lib/market-cache';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  try{
    const {query,page}=symbolCatalogueInput(new URL(request.url).searchParams);
    const token=process.env.BRAPI_TOKEN?.trim();
    const data=await marketCache('symbols-v1-'+(token?'keyed':'public')+'-'+query.toLocaleLowerCase('pt-BR')+'-'+page,900,()=>fetchSymbolCatalogue(query,page,token));
    return Response.json(data,{headers:{'Cache-Control':'public, max-age=300','X-Data-Source':'brapi'}});
  }catch(error){return Response.json({error:error instanceof SymbolCatalogueError?error.message:'Não foi possível consultar o catálogo. Você ainda pode informar o ticker manualmente.'},{status:error instanceof SymbolCatalogueError?error.status:502,headers:{'Cache-Control':'no-store'}});}
}
