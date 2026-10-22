import { NextResponse } from 'next/server';
import { createSupabase, appOrigin } from '@/lib/supabase/server';
export async function GET(request:Request){
  const origin=appOrigin(request);
  try{const client=await createSupabase();const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:origin+'/auth/callback',skipBrowserRedirect:true}});if(!error&&data.url)return NextResponse.redirect(data.url);}catch{}
  return NextResponse.redirect(origin+'/login?auth_error=google');
}
