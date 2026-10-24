import type { AuthDatabase } from './database-contract';
import { compare, hash } from 'bcryptjs';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyOptions } from 'jose';

export interface AuthEnvironment {DB?:AuthDatabase; GOOGLE_CLIENT_ID?:string; BRAPI_TOKEN?:string}
export interface PublicUser {id:string;name:string;email:string;provider:'email'|'google'}
export interface Holding {id:string;ticker:string;quantity:number;averagePriceCents:number|null}
interface UserRow extends PublicUser {password_hash:string|null;google_sub:string|null}
export interface GoogleIdentity {sub:string;email:string;name:string}
export interface AuthDependencies {now?:()=>number;verifyGoogle?:(credential:string,clientId:string)=>Promise<GoogleIdentity>}
export class AuthError extends Error {constructor(public status:number,message:string){super(message);this.name='AuthError';}}
const SESSION_SECONDS=7*24*60*60;
export const SESSION_COOKIE='wealthos_session';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const utf8=new TextEncoder();
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const publicUser=(row:PublicUser):PublicUser=>({id:row.id,name:row.name,email:row.email,provider:row.provider});
function fail(message:string):never {throw new AuthError(400,message);}
export function normalizeEmail(value:unknown):string {
  if(typeof value!=='string')fail('Informe um e-mail válido.');
  const email=value.trim().toLowerCase();
  if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Informe um e-mail válido.');
  return email;
}
export function validatePassword(value:unknown,registration=true):string {
  if(typeof value!=='string'||Array.from(value).length<(registration?12:1)||utf8.encode(value).length>72)fail(registration?'A senha deve ter pelo menos 12 caracteres e no máximo 72 bytes.':'E-mail ou senha inválidos.');
  return value;
}
export function validateName(value:unknown):string {
  if(typeof value!=='string')fail('Informe seu nome.');
  const name=value.trim();
  if(Array.from(name).length<2||name.length>100||/[\u0000-\u001f\u007f]/.test(name))fail('O nome deve ter entre 2 e 100 caracteres.');
  return name;
}
export function assertKeys(body:Record<string,unknown>,allowed:string[]) {
  if(Object.keys(body).some(key=>!allowed.includes(key)))fail('A solicitação contém campos não permitidos.');
}
export async function readJson(request:Request):Promise<Record<string,unknown>> {
  if(request.headers.get('origin')!==new URL(request.url).origin)throw new AuthError(403,'Origem da solicitação não autorizada.');
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))throw new AuthError(415,'Envie a solicitação em JSON.');
  const declared=Number(request.headers.get('content-length')??0);
  if(declared>16384)throw new AuthError(413,'Solicitação muito grande.');
  const reader=request.body?.getReader();
  if(!reader)fail('JSON inválido.');
  let size=0;const chunks:Uint8Array[]=[];
  try {
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw new AuthError(413,'Solicitação muito grande.');}chunks.push(value);}
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let body:unknown;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('JSON inválido.');}
  if(!body||typeof body!=='object'||Array.isArray(body))fail('JSON inválido.');
  return body as Record<string,unknown>;
}
export async function sha256(value:string):Promise<string>{const digest=await crypto.subtle.digest('SHA-256',utf8.encode(value));return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');}
function randomToken():string{const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function cookieValue(request:Request):string|null {
  const cookie=request.headers.get('cookie')??'';
  const entry=cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${SESSION_COOKIE}=`));
  const token=entry?.slice(SESSION_COOKIE.length+1);
  return token&&/^[A-Za-z0-9_-]{43}$/.test(token)?token:null;
}
export function sessionCookie(request:Request,token:string|null):string {
  return `${SESSION_COOKIE}=${token??''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token?SESSION_SECONDS:0}${new URL(request.url).protocol==='https:'?'; Secure':''}`;
}
export function googleVerificationOptions(clientId:string):JWTVerifyOptions{return{issuer:['accounts.google.com','https://accounts.google.com'],audience:clientId,algorithms:['RS256'],clockTolerance:5,requiredClaims:['exp','iat','sub','email'],maxTokenAge:'1h'};}
export async function verifyGoogleCredential(credential:string,clientId:string):Promise<GoogleIdentity>{
  try{
    const {payload}=await jwtVerify(credential,googleKeys,googleVerificationOptions(clientId));
    if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>255||payload.email_verified!==true)throw new Error('claims');
    const email=normalizeEmail(payload.email);
    const rawName=typeof payload.name==='string'?payload.name:email.split('@')[0];
    const name=validateName(rawName.length>=2?rawName.slice(0,100):'Minha conta');
    return{sub:payload.sub,email,name};
  }catch{throw new AuthError(401,'Não foi possível validar o login do Google. Tente novamente.');}
}
export function validateHoldings(body:Record<string,unknown>):Holding[]{
  assertKeys(body,['holdings']);
  if(!Array.isArray(body.holdings)||body.holdings.length>100)fail('Envie até 100 posições.');
  const tickers=new Set<string>();const ids=new Set<string>();
  return body.holdings.map(raw=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('Posição inválida.');
    const row=raw as Record<string,unknown>;assertKeys(row,['id','ticker','quantity','averagePriceCents']);
    if(typeof row.id!=='string'||!uuid.test(row.id)||ids.has(row.id))fail('Cada posição deve ter um identificador UUID exclusivo.');
    if(typeof row.ticker!=='string')fail('Ticker inválido.');
    const ticker=row.ticker.trim().toUpperCase();
    if(!/^[A-Z0-9]{4}[0-9]{1,2}F?$/.test(ticker)||tickers.has(ticker))fail('Use tickers brasileiros válidos e sem repetição.');
    if(typeof row.quantity!=='number'||!Number.isSafeInteger(row.quantity)||row.quantity<=0||row.quantity>1e6)fail('A quantidade deve ser um inteiro entre 1 e 1 milhão.');
    const price=row.averagePriceCents;
    if(price!==null&&(typeof price!=='number'||!Number.isSafeInteger(price)||price<1||price>1e9))fail('O preço médio deve ser um inteiro entre 1 e 1 bilhão de centavos ou nulo.');
    ids.add(row.id);tickers.add(ticker);return{id:row.id,ticker,quantity:row.quantity,averagePriceCents:price as number|null};
  });
}
export class AuthCore {
  constructor(private readonly env:AuthEnvironment,private readonly deps:AuthDependencies={}){}
  private db():AuthDatabase{if(!this.env.DB)throw new AuthError(503,'O serviço de contas está indisponível. Tente novamente mais tarde.');return this.env.DB;}
  private now(){return Math.floor((this.deps.now?.()??Date.now())/1000);}
  async rateLimit(request:Request,bucket:string,limit:number,seconds=60):Promise<void>{
    const now=this.now();const slot=Math.floor(now/seconds);const ip=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()??'local';
    const key=await sha256(`${ip}:${bucket}:${slot}`);
    const row=await this.db().prepare('INSERT INTO auth_rate_limits (key, requests, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET requests = auth_rate_limits.requests + 1 RETURNING requests').bind(key,(slot+1)*seconds).first<{requests:number}>();
    if(!row)throw new AuthError(503,'Não foi possível verificar o limite de solicitações.');
    if(row.requests>limit)throw new AuthError(429,'Muitas tentativas. Aguarde um minuto e tente novamente.');
    // TTL persistente: limpeza limitada não retém os IPs; a chave contém somente SHA-256.
    await this.db().prepare('DELETE FROM auth_rate_limits WHERE key IN (SELECT key FROM auth_rate_limits WHERE expires_at < ? LIMIT 100)').bind(now).run();
  }
  async currentUser(request:Request):Promise<PublicUser|null>{
    const token=cookieValue(request);if(!token)return null;
    const row=await this.db().prepare('SELECT u.id, u.name, u.email, u.provider FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1').bind(await sha256(token),this.now()).first<PublicUser>();
    return row?publicUser(row):null;
  }
  async requireUser(request:Request):Promise<PublicUser>{const user=await this.currentUser(request);if(!user)throw new AuthError(401,'Entre na sua conta para acessar a carteira.');return user;}
  private async issueSession(request:Request,user:PublicUser):Promise<Response>{
    const token=randomToken();const now=this.now();const previous=cookieValue(request);
    const statements=[this.db().prepare('INSERT INTO sessions (token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)').bind(await sha256(token),user.id,now,now+SESSION_SECONDS),this.db().prepare('DELETE FROM sessions WHERE token_hash IN (SELECT token_hash FROM sessions WHERE expires_at <= ? LIMIT 100)').bind(now)];
    if(previous)statements.push(this.db().prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(previous)));
    await this.db().batch(statements);
    return Response.json({user:publicUser(user)},{headers:{'Set-Cookie':sessionCookie(request,token),'Cache-Control':'no-store'}});
  }
  async register(request:Request):Promise<Response>{
    const body=await readJson(request);assertKeys(body,['name','email','password']);
    await this.rateLimit(request,'register',5);
    const name=validateName(body.name);const email=normalizeEmail(body.email);const password=validatePassword(body.password);
    const existing=await this.db().prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(email).first();
    if(existing)throw new AuthError(409,'Este e-mail já está cadastrado. Entre pelo método usado no cadastro.');
    const user:PublicUser={id:crypto.randomUUID(),name,email,provider:'email'};
    const passwordHash=await hash(password,12);
    try{await this.db().prepare("INSERT INTO users (id,name,email,provider,password_hash,google_sub,created_at) VALUES (?,?,?,'email',?,NULL,?)").bind(user.id,name,email,passwordHash,this.now()).run();}
    catch(error){if((String(error).includes('UNIQUE constraint failed')||(error as {code?:string})?.code==='23505'))throw new AuthError(409,'Este e-mail já está cadastrado. Entre pelo método usado no cadastro.');throw error;}
    return this.issueSession(request,user);
  }
  async login(request:Request):Promise<Response>{
    const body=await readJson(request);assertKeys(body,['email','password']);
    await this.rateLimit(request,'login',10);
    const email=normalizeEmail(body.email);let password:string;try{password=validatePassword(body.password,false);}catch{throw new AuthError(401,'E-mail ou senha inválidos.');}
    const user=await this.db().prepare('SELECT id,name,email,provider,password_hash,google_sub FROM users WHERE email = ? LIMIT 1').bind(email).first<UserRow>();
    const valid=user?.provider==='email'&&user.password_hash?await compare(password,user.password_hash):(await hash(password,12),false);
    if(!user||!valid)throw new AuthError(401,'E-mail ou senha inválidos.');
    return this.issueSession(request,user);
  }
  async google(request:Request):Promise<Response>{
    const body=await readJson(request);assertKeys(body,['credential']);
    const clientId=this.env.GOOGLE_CLIENT_ID?.trim();
    if(!clientId)throw new AuthError(503,'O login com Google ainda não foi configurado. Use e-mail e senha.');
    await this.rateLimit(request,'google',10);
    if(typeof body.credential!=='string'||body.credential.length>12000||!body.credential)fail('Credencial do Google inválida.');
    const identity=await(this.deps.verifyGoogle??verifyGoogleCredential)(body.credential,clientId);
    const existing=await this.db().prepare('SELECT id,name,email,provider,password_hash,google_sub FROM users WHERE google_sub = ? LIMIT 1').bind(identity.sub).first<UserRow>();
    if(existing)return this.issueSession(request,existing);
    if(await this.db().prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(identity.email).first())throw new AuthError(409,'Este e-mail já tem uma conta. Entre pelo método usado no cadastro; vinculação de contas ainda não está disponível.');
    const user:PublicUser={id:crypto.randomUUID(),name:identity.name,email:identity.email,provider:'google'};
    try{await this.db().prepare("INSERT INTO users (id,name,email,provider,password_hash,google_sub,created_at) VALUES (?,?,?,'google',NULL,?,?)").bind(user.id,user.name,user.email,identity.sub,this.now()).run();}
    catch(error){if((String(error).includes('UNIQUE constraint failed')||(error as {code?:string})?.code==='23505'))throw new AuthError(409,'A conta já existe. Tente entrar novamente pelo método usado no cadastro.');throw error;}
    return this.issueSession(request,user);
  }
  async logout(request:Request):Promise<Response>{
    const body=await readJson(request);assertKeys(body,[]);await this.rateLimit(request,'logout',30);
    const token=cookieValue(request);if(token)await this.db().prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return Response.json({user:null},{headers:{'Set-Cookie':sessionCookie(request,null),'Cache-Control':'no-store'}});
  }
  async getPortfolio(request:Request):Promise<Response>{
    const user=await this.requireUser(request);await this.rateLimit(request,'portfolio-read',120);
    const result=await this.db().prepare('SELECT id,ticker,quantity,average_price_cents AS "averagePriceCents" FROM holdings WHERE user_id = ? ORDER BY ticker').bind(user.id).all<Holding>();
    return Response.json({holdings:result.results??[]},{headers:{'Cache-Control':'no-store'}});
  }
  async putPortfolio(request:Request):Promise<Response>{
    const body=await readJson(request);const user=await this.requireUser(request);await this.rateLimit(request,'portfolio-write',30);
    const holdings=validateHoldings(body);const db=this.db();const now=this.now();
    const statements=[db.prepare('DELETE FROM holdings WHERE user_id = ?').bind(user.id),...holdings.map(row=>db.prepare('INSERT INTO holdings (user_id,ticker,id,quantity,average_price_cents,updated_at) VALUES (?,?,?,?,?,?)').bind(user.id,row.ticker,row.id,row.quantity,row.averagePriceCents,now))];
    await db.batch(statements,user.id);
    return Response.json({holdings},{headers:{'Cache-Control':'no-store'}});
  }
}
export async function authResponse(action:()=>Promise<Response>):Promise<Response>{
  try{return await action();}catch(error){
    const known=error instanceof AuthError;const status=known?error.status:503;
    return Response.json({error:known?error.message:'O serviço está temporariamente indisponível. Tente novamente.'},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'60'}:{})}});
  }
}
