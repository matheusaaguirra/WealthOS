import { runtimeAuth, authResponse } from '@/lib/auth-runtime';
export function GET(request:Request){return authResponse(async()=>Response.json({user:await runtimeAuth().currentUser(request)},{headers:{'Cache-Control':'no-store'}}));}
