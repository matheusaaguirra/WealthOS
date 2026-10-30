import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthError } from '../auth-core';
import { emptyFinancialState,validateFinancialState } from '../financial-state';
import type { FinancialStore } from '../recurring-posting';
export function financialStore(client:SupabaseClient,userId:string):FinancialStore {
 return {
  async read(){
   const {data,error}=await client.from('wealthos_financial_state').select('data,revision').eq('user_id',userId).maybeSingle();
   if(error)throw new AuthError(503,'Não foi possível carregar suas finanças. Tente novamente.');
   return {state:data?validateFinancialState(data.data):emptyFinancialState(),revision:data?.revision??0};
  },
  async save(state,revision){
   const {data,error}=await client.rpc('wealthos_save_financial_state',{p_data:state,p_expected_revision:revision});
   if(error?.code==='40001')throw new AuthError(409,'Seus dados foram alterados em outra sessão. Recarregue os dados antes de tentar novamente.');
   if(error||!data)throw new AuthError(503,'Não foi possível salvar suas finanças. Nenhuma alteração foi confirmada.');
   return {state:validateFinancialState(data.data),revision:data.revision};
  },
 };
}
