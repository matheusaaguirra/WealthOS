import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseSettings } from './lib/supabase/server';
export async function proxy(request:NextRequest){
  const config=supabaseSettings();
  if(!config)return NextResponse.redirect(new URL('/login',request.url));
  let response=NextResponse.next({request});
  const client=createServerClient(config.url,config.key,{
    cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
    cookies:{getAll:()=>request.cookies.getAll(),setAll:items=>{for(const {name,value}of items)request.cookies.set(name,value);response=NextResponse.next({request});for(const {name,value,options}of items)response.cookies.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'});}},
  });
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user){const redirect=NextResponse.redirect(new URL('/login',request.url));for(const cookie of response.cookies.getAll())redirect.cookies.set(cookie);return redirect;}
  response.headers.set('Cache-Control','private, no-store, max-age=0');
  return response;
}
export const config={matcher:['/dashboard/:path*','/app/index.html']};
