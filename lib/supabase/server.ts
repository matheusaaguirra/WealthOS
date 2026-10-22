import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { AuthError } from '../auth-core';

export function supabaseSettings(){
  const url=process.env.SUPABASE_URL?.trim();
  const key=process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if(!url||!key)return null;
  return {url,key};
}
export async function createSupabase():Promise<SupabaseClient>{
  const config=supabaseSettings();
  if(!config)throw new AuthError(503,'O acesso está temporariamente indisponível. Tente novamente mais tarde.');
  const store=await cookies();
  return createServerClient(config.url,config.key,{
    cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
    cookies:{getAll:()=>store.getAll(),setAll:items=>{for(const {name,value,options} of items)store.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'});}},
  });
}
export async function requireSupabase(){
  const client=await createSupabase();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)throw new AuthError(401,'Entre na sua conta para continuar.');
  return {client,user};
}
export function publicUser(user:User){
  const metadata=user.user_metadata??{};
  const name=typeof metadata.full_name==='string'?metadata.full_name:typeof metadata.name==='string'?metadata.name:user.email?.split('@')[0]??'Minha conta';
  return {id:user.id,email:user.email??'',name:name.slice(0,100),provider:user.app_metadata?.provider==='google'?'google':'email'};
}
export const privateHeaders={'Cache-Control':'private, no-store, max-age=0'};
export function appOrigin(request:Request){
  return process.env.APP_URL?.replace(/\/$/,'')||new URL(request.url).origin;
}
