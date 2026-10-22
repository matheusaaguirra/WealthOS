import { authResponse, AuthError } from '@/lib/auth-core';
import { requireSupabase, privateHeaders } from '@/lib/supabase/server';
import { emptyFinancialState, readFinancialRequest, validateFinancialState } from '@/lib/financial-state';
export const dynamic='force-dynamic';
export function GET(){return authResponse(async()=>{
  const {client,user}=await requireSupabase();
  const {data,error}=await client.from('wealthos_financial_state').select('data,revision').eq('user_id',user.id).maybeSingle();
  if(error)throw new AuthError(503,'Não foi possível carregar suas finanças. Tente novamente.');
  return Response.json({state:data?validateFinancialState(data.data):emptyFinancialState(),revision:data?.revision??0},{headers:privateHeaders});
});}
export function PUT(request:Request){return authResponse(async()=>{
  const {client}=await requireSupabase();const {state,revision}=await readFinancialRequest(request);
  const {data,error}=await client.rpc('wealthos_save_financial_state',{p_data:state,p_expected_revision:revision});
  if(error?.code==='40001')throw new AuthError(409,'Seus dados foram alterados em outra sessão. Recarregue os dados antes de tentar novamente.');
  if(error||!data)throw new AuthError(503,'Não foi possível salvar suas finanças. Nenhuma alteração foi confirmada.');
  return Response.json({state:validateFinancialState(data.data),revision:data.revision},{headers:privateHeaders});
});}
