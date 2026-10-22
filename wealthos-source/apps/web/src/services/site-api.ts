import type { Holding } from '@wealthos/finance';
export interface SiteUser {id:string;name:string;email:string;provider:string;}
export interface AuthConfig {provider:string;supabaseConfigured:boolean;googleEnabled:boolean;brapiConfigured:boolean;emailPasswordEnabled:boolean;}
export interface StockMetrics {previousCloseCents:number|null;openCents:number|null;highCents:number|null;lowCents:number|null;marketCap:number|string|null;volume:number|string|null;}
export interface StockResponse {source:string;ticker:string;name:string;currency:string;priceCents:number|null;changePercent:number|null;asOf:string|null;history:{date:string;close:number}[];cachedAt:string;supported:boolean;sourceUrl?:string;range?:'1d'|'5d'|'1mo';experimental?:boolean;metrics?:StockMetrics;error?:string;}
export interface CryptoCoin {symbol:string;name:string;price:number|null;changePercent:number|null;asOf:string|null;}
export interface CryptoResponse {source:string;currency:string;coins:CryptoCoin[];cachedAt:string;error?:string;}
export async function siteRequest<T>(path:string,method='GET',body?:unknown):Promise<T>{
  const response=await fetch('/api'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data){const message=data?.error||data?.message;throw new Error(typeof message==='string'?message:Array.isArray(message)?message.join(' '):response.status===429?'Muitas tentativas. Aguarde alguns instantes.':'Serviço indisponível. Tente novamente.');}
  return data as T;
}
export const siteAuth={config:()=>siteRequest<AuthConfig>('/auth/config'),me:()=>siteRequest<{user:SiteUser|null}>('/auth/me'),login:(email:string,password:string)=>siteRequest<{user:SiteUser}>('/auth/login','POST',{email,password}),register:(name:string,email:string,password:string)=>siteRequest<{user:SiteUser|null;requiresEmailConfirmation?:boolean;message?:string}>('/auth/register','POST',{name,email,password}),logout:()=>siteRequest('/auth/logout','POST',{}),finance:<T>()=>siteRequest<{state:T;revision:number}>('/finance'),saveFinance:<T>(state:T,revision:number)=>siteRequest<{state:T;revision:number}>('/finance','PUT',{state,revision}),portfolio:()=>siteRequest<{holdings:Holding[]}>('/portfolio'),savePortfolio:(holdings:Holding[])=>siteRequest<{holdings:Holding[]}>('/portfolio','PUT',{holdings})};
export const marketApi={googleFinance:(ticker:string,range:string)=>siteRequest<StockResponse>('/market/google-finance?ticker='+encodeURIComponent(ticker)+'&range='+encodeURIComponent(range)),stock:(ticker:string,range:string)=>siteRequest<StockResponse>('/market/stock?ticker='+encodeURIComponent(ticker)+'&range='+encodeURIComponent(range)),crypto:()=>siteRequest<CryptoResponse>('/market/crypto')};
