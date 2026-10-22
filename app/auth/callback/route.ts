import { NextResponse } from 'next/server';
import { createSupabase, appOrigin } from '@/lib/supabase/server';
export async function GET(request:Request){
  const origin=appOrigin(request);const code=new URL(request.url).searchParams.get('code');
  if(code){try{const client=await createSupabase();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(origin+'/dashboard');}catch{}}
  return NextResponse.redirect(origin+'/login?auth_error=callback');
}
