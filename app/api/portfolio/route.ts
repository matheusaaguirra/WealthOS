import { runtimeAuth, authResponse } from '@/lib/auth-runtime';
export function GET(request:Request){return authResponse(()=>runtimeAuth().getPortfolio(request));}
export function PUT(request:Request){return authResponse(()=>runtimeAuth().putPortfolio(request));}
