import { AuthCore, authResponse } from './auth-core';
import { database } from './postgres';
export function runtimeAuth(){ return new AuthCore({DB:database(),GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,BRAPI_TOKEN:process.env.BRAPI_TOKEN}); }
export { authResponse };
export function authConfiguration(){
  return Response.json({googleClientId:process.env.GOOGLE_CLIENT_ID?.trim()||null,brapiConfigured:Boolean(process.env.BRAPI_TOKEN?.trim()),emailPasswordEnabled:Boolean(process.env.DATABASE_URL)},{headers:{'Cache-Control':'no-store'}});
}
