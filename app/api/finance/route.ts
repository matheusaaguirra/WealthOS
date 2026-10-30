import { authResponse } from '@/lib/auth-core';
import { requireSupabase, privateHeaders } from '@/lib/supabase/server';
import { readFinancialRequest } from '@/lib/financial-state';
import { financialStore } from '@/lib/supabase/finance';
import { appendCurrentRecurring } from '@/lib/recurring-posting';
export const dynamic='force-dynamic';
export function GET(){return authResponse(async()=>{
 const {client,user}=await requireSupabase();
 return Response.json(await financialStore(client,user.id).read(),{headers:privateHeaders});
});}
export function PUT(request:Request){return authResponse(async()=>{
 const {client,user}=await requireSupabase();const {state,revision}=await readFinancialRequest(request);
 const next=appendCurrentRecurring(state);
 const saved=await financialStore(client,user.id).save(next.state,revision);
 return Response.json({...saved,recurringPosted:next.recurringPosted},{headers:privateHeaders});
});}
