import { authResponse } from './auth-core';
import { SupabaseAuth } from './supabase/auth';
import { supabaseSettings, privateHeaders } from './supabase/server';
export function runtimeAuth(){return new SupabaseAuth();}
export {authResponse};
export async function authConfiguration(){
  const config=supabaseSettings();let googleEnabled=false;
  if(config){try{const response=await fetch(config.url+'/auth/v1/settings',{headers:{apikey:config.key},cache:'no-store',signal:AbortSignal.timeout(5000)});if(response.ok){const settings=await response.json();googleEnabled=settings.external?.google===true;}}catch{}}
  return Response.json({provider:'supabase',supabaseConfigured:!!config,emailPasswordEnabled:!!config,googleEnabled,brapiConfigured:!!process.env.BRAPI_TOKEN?.trim()},{headers:privateHeaders});
}
