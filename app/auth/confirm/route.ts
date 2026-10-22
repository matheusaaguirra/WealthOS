import { NextResponse } from 'next/server';
import { createSupabase, appOrigin } from '@/lib/supabase/server';
export async function GET(request:Request){
  const origin=appOrigin(request);const params=new URL(request.url).searchParams;const token=params.get('token_hash');
  if(token&&params.get('type')==='email'){try{const client=await createSupabase();const {error}=await client.auth.verifyOtp({token_hash:token,type:'email'});if(!error)return NextResponse.redirect(origin+'/dashboard');}catch{}}
  return NextResponse.redirect(origin+'/login?auth_error=confirmation');
}
