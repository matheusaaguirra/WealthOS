import { authResponse,readJson,assertKeys } from '@/lib/auth-core';
import { requireSupabase,privateHeaders } from '@/lib/supabase/server';
import { financialStore } from '@/lib/supabase/finance';
import { postCurrentRecurring } from '@/lib/recurring-posting';
export const dynamic='force-dynamic';
export function POST(request:Request){return authResponse(async()=>{
 const body=await readJson(request);assertKeys(body,[]);
 const {client,user}=await requireSupabase();
 const result=await postCurrentRecurring(financialStore(client,user.id));
 return Response.json(result,{headers:privateHeaders});
});}
