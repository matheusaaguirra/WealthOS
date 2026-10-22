import { runtimeAuth, authResponse } from '@/lib/auth-runtime';
export function POST(request:Request){return authResponse(()=>runtimeAuth().google(request));}
