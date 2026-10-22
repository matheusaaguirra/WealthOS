import type { AuthDatabase } from '../lib/database-contract';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { compare } from 'bcryptjs';
import { generateKeyPair, jwtVerify, SignJWT } from 'jose';
import { AuthCore, AuthError, SESSION_COOKIE, readJson, normalizeEmail, validatePassword, validateHoldings, googleVerificationOptions, sha256, sessionCookie, authResponse } from '../lib/auth-core';

class Statement {
  values:(string|number|null)[]=[];
  constructor(private db:DatabaseSync,readonly sql:string){}
  bind(...values:(string|number|null)[]){this.values=values;return this;}
  async first<T>(column?:string):Promise<T|null>{const value=this.db.prepare(this.sql).get(...this.values);return (value?(column?value[column]:value):null) as T|null;}
  async all<T>(){return{results:this.db.prepare(this.sql).all(...this.values) as T[],success:true,meta:{}};}
  async run(){const result=this.db.prepare(this.sql).run(...this.values);return{success:true,results:[],meta:{changes:Number(result.changes)}};}
}
class SqlD1 {
  sqlite=new DatabaseSync(':memory:');
  constructor(){
    this.sqlite.exec('PRAGMA foreign_keys=ON');
    const directory=resolve('drizzle');const migrations=readdirSync(directory).filter(name=>name.endsWith('.sql')).sort();
    assert.ok(migrations.length,'Gere a migração Drizzle antes de executar os testes de autenticação.');
    for(const migration of migrations)this.sqlite.exec(readFileSync(resolve(directory,migration),'utf8'));
  }
  prepare(sql:string){return new Statement(this.sqlite,sql);}
  async batch(statements:Statement[]){this.sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());this.sqlite.exec('COMMIT');return results;}catch(error){this.sqlite.exec('ROLLBACK');throw error;}}
  close(){this.sqlite.close();}
}
const origin='https://wealthos.example';
const password='SenhaMuitoForte123!';
function request(path:string,body?:unknown,cookie?:string,extra:HeadersInit={}):Request{return new Request(`${origin}${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});}
function cookieFrom(response:Response){return response.headers.get('set-cookie')!.split(';')[0];}
function fixture(now?:()=>number){const db=new SqlD1();const core=new AuthCore({DB:db as unknown as AuthDatabase},now?{now}:{});return{db,core};}
async function register(core:AuthCore,email='pessoa@example.com'){const response=await core.register(request('/api/auth/register',{name:'Pessoa Teste',email,password}));return{cookie:cookieFrom(response),user:(await response.json()).user,response};}
const holding={id:'bc5f510b-5f50-4dfb-a605-383c4c634081',ticker:'PETR4',quantity:10,averagePriceCents:3500};
async function status(action:Promise<unknown>,expected:number){await assert.rejects(action,(error:unknown)=>error instanceof AuthError&&error.status===expected);}

describe('Validação de autenticação e posições',()=>{
  test('normaliza e-mail e valida senha por caracteres e bytes UTF-8',()=>{
    assert.equal(normalizeEmail('  PESSOA@EXAMPLE.COM '),'pessoa@example.com');
    assert.throws(()=>normalizeEmail('invalido'));assert.throws(()=>validatePassword('curta'));
    assert.throws(()=>validatePassword('é'.repeat(37)));assert.equal(validatePassword('é'.repeat(36)),'é'.repeat(36));
  });
  test('valida limites financeiros, duplicidade, IDs e ticker de lote fracionário',()=>{
    assert.equal(validateHoldings({holdings:[{...holding,ticker:' petr4f '} ]})[0].ticker,'PETR4F');
    assert.equal(validateHoldings({holdings:[{...holding,ticker:'B3SA3'}]})[0].ticker,'B3SA3');
    assert.deepEqual(validateHoldings({holdings:[]}),[]);
    for(const row of [{...holding,quantity:0},{...holding,quantity:1.5},{...holding,quantity:1e6+1},{...holding,averagePriceCents:0},{...holding,averagePriceCents:1e9+1},{...holding,id:'invalido'},{...holding,ticker:'BTC'}])assert.throws(()=>validateHoldings({holdings:[row]}));
    assert.throws(()=>validateHoldings({holdings:[holding,{...holding,id:crypto.randomUUID()}]}));
    assert.throws(()=>validateHoldings({holdings:[holding],userId:'outro-usuario'}));
    assert.throws(()=>validateHoldings({holdings:Array.from({length:101},()=>holding)}));
  });
  test('exige JSON de origem idêntica e limita payload, inclusive sem Content-Length',async()=>{
    await status(readJson(request('/api/auth/login',{},undefined,{Origin:'https://attacker.example'})),403);
    await status(readJson(new Request(`${origin}/api/auth/login`,{method:'POST',body:'{}'})),403);
    await status(readJson(request('/api/auth/login',{},undefined,{'Content-Type':'text/plain'})),415);
    await status(readJson(request('/api/auth/login',{padding:'x'.repeat(17000)})),413);
    assert.deepEqual(await readJson(request('/api/auth/login',{email:'pessoa@example.com'})),{email:'pessoa@example.com'});
  });
  test('verificação Google exige exp/iat/sub/email, audiência e assinatura RS256',async()=>{
    const {privateKey,publicKey}=await generateKeyPair('RS256');const now=Math.floor(Date.now()/1000);
    const claims={iss:'https://accounts.google.com',aud:'google-client',sub:'google-sub',email:'google@example.com',iat:now,exp:now+3600};
    const sign=(payload:Record<string,unknown>)=>new SignJWT(payload).setProtectedHeader({alg:'RS256'}).sign(privateKey);
    await jwtVerify(await sign(claims),publicKey,googleVerificationOptions('google-client'));
    for(const claim of ['exp','iat','sub','email']){const invalid:Record<string,unknown>={...claims};delete invalid[claim];await assert.rejects(jwtVerify(await sign(invalid),publicKey,googleVerificationOptions('google-client')));}
    await assert.rejects(jwtVerify(await sign({...claims,aud:'wrong-client'}),publicKey,googleVerificationOptions('google-client')));
    await assert.rejects(jwtVerify(await sign({...claims,iat:now-7200,exp:now+3600}),publicKey,googleVerificationOptions('google-client')));
  });
  test('cookies são HttpOnly, SameSite Lax e Secure apenas em HTTPS',()=>{
    const secure=sessionCookie(new Request(origin),'token');assert.match(secure,/HttpOnly/);assert.match(secure,/SameSite=Lax/);assert.match(secure,/; Secure$/);
    assert.doesNotMatch(sessionCookie(new Request('http://localhost:3000'),'token'),/Secure/);
    assert.match(sessionCookie(new Request(origin),null),/Max-Age=0/);
  });
});

describe('Contas e sessão persistente sobre SQLite com migração real',()=>{
  test('cadastro salva bcrypt12 e somente hash SHA256 da sessão; cookie restaura usuário',async()=>{
    const{db,core}=fixture();try{
      const {cookie,user,response}=await register(core,' Pessoa@Example.com ');
      assert.equal(user.email,'pessoa@example.com');assert.equal(user.provider,'email');assert.equal(user.passwordHash,undefined);
      const row=db.sqlite.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id)!;
      assert.match(String(row.password_hash),/^\$2[ab]\$12\$/);assert.ok(await compare(password,String(row.password_hash)));
      const raw=cookie.split('=')[1];const stored=db.sqlite.prepare('SELECT token_hash FROM sessions').get()!;
      assert.equal(stored.token_hash,await sha256(raw));assert.notEqual(stored.token_hash,raw);assert.equal(raw.length,43);
      assert.deepEqual(await core.currentUser(request('/api/auth/me',undefined,cookie)),user);
      assert.match(response.headers.get('set-cookie')!,/HttpOnly/);
      assert.equal(await core.currentUser(request('/api/auth/me',undefined,`${SESSION_COOKIE}=${'A'.repeat(43)}`)),null);
    }finally{db.close();}
  });
  test('login valida senha, normaliza e-mail, gira sessão e rejeita senha errada',async()=>{
    const{db,core}=fixture();try{
      const initial=await register(core);
      await status(core.login(request('/api/auth/login',{email:'pessoa@example.com',password:'SenhaErrada123'})),401);
      const response=await core.login(request('/api/auth/login',{email:' PESSOA@EXAMPLE.COM ',password},initial.cookie));
      const cookie=cookieFrom(response);assert.notEqual(cookie,initial.cookie);
      assert.equal(await core.currentUser(request('/api/auth/me',undefined,initial.cookie)),null);
      assert.equal((await core.currentUser(request('/api/auth/me',undefined,cookie)))?.id,initial.user.id);
    }finally{db.close();}
  });
  test('cadastro duplicado retorna conflito e não duplica usuário',async()=>{
    const{db,core}=fixture();try{await register(core);await status(register(core),409);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM users').get()!.n,1);}finally{db.close();}
  });
  test('sessão expira após sete dias e logout remove a sessão persistida',async()=>{
    let clock=Date.UTC(2026,9,22);const{db,core}=fixture(()=>clock);try{
      const first=await register(core);clock+=8*24*60*60*1000;assert.equal(await core.currentUser(request('/api/auth/me',undefined,first.cookie)),null);
      const login=await core.login(request('/api/auth/login',{email:'pessoa@example.com',password}));const cookie=cookieFrom(login);
      const response=await core.logout(request('/api/auth/logout',{},cookie));assert.match(response.headers.get('set-cookie')!,/Max-Age=0/);assert.equal(await core.currentUser(request('/api/auth/me',undefined,cookie)),null);
    }finally{db.close();}
  });
  test('rate limit é persistente entre instâncias e se renova na janela seguinte',async()=>{
    let clock=Date.UTC(2026,9,22);const{db,core}=fixture(()=>clock);try{
      await core.rateLimit(request('/api/auth/login'),'test',2);await core.rateLimit(request('/api/auth/login'),'test',2);
      const second=new AuthCore({DB:db as unknown as AuthDatabase},{now:()=>clock});await status(second.rateLimit(request('/api/auth/login'),'test',2),429);
      clock+=61000;await second.rateLimit(request('/api/auth/login'),'test',2);
    }finally{db.close();}
  });
  test('Google ausente retorna 503; não autentica usando uma credencial fictícia',async()=>{
    for(const env of [{},{GOOGLE_CLIENT_ID:'   '}]){const core=new AuthCore(env);await status(core.google(request('/api/auth/google',{credential:'fake'})),503);}
  });
  test('Google cria conta com identidade verificada injetada e repete o mesmo usuário',async()=>{
    const db=new SqlD1();const core=new AuthCore({DB:db as unknown as AuthDatabase,GOOGLE_CLIENT_ID:'configured-client'},{verifyGoogle:async()=>({sub:'google-sub-123',name:'Pessoa Google',email:'google@example.com'})});try{
      const first=await core.google(request('/api/auth/google',{credential:'verified-by-test-double'}));const user=(await first.json()).user;assert.equal(user.provider,'google');
      const second=await core.google(request('/api/auth/google',{credential:'verified-by-test-double'}));assert.equal((await second.json()).user.id,user.id);
      const stored=db.sqlite.prepare('SELECT password_hash,google_sub FROM users').get()!;assert.equal(stored.password_hash,null);assert.equal(stored.google_sub,'google-sub-123');
    }finally{db.close();}
  });
  test('Google não vincula automaticamente um e-mail já cadastrado com senha',async()=>{
    const{db,core}=fixture();try{
      const first=await register(core);const google=new AuthCore({DB:db as unknown as AuthDatabase,GOOGLE_CLIENT_ID:'configured-client'},{verifyGoogle:async()=>({sub:'sub-other',name:'Pessoa Google',email:'pessoa@example.com'})});
      await status(google.google(request('/api/auth/google',{credential:'verified-by-test-double'})),409);
      assert.equal(db.sqlite.prepare('SELECT provider FROM users WHERE id=?').get(first.user.id)!.provider,'email');
    }finally{db.close();}
  });
});

describe('Carteira isolada por sessão e gravação atômica',()=>{
  test('usuário sem sessão recebe 401; IDs de usuário no body são rejeitados',async()=>{
    const{db,core}=fixture();try{
      await status(core.getPortfolio(request('/api/portfolio')),401);
      const{cookie}=await register(core);await status(core.putPortfolio(request('/api/portfolio',{holdings:[holding],userId:'outro'},cookie)),400);
    }finally{db.close();}
  });
  test('gravação e leitura não misturam usuários e apagar uma carteira não altera outra',async()=>{
    const{db,core}=fixture();try{
      const a=await register(core,'a@example.com');const b=await register(core,'b@example.com');
      await core.putPortfolio(request('/api/portfolio',{holdings:[holding]},a.cookie));
      await core.putPortfolio(request('/api/portfolio',{holdings:[{...holding,quantity:30}]},b.cookie));
      assert.equal((await(await core.getPortfolio(request('/api/portfolio',undefined,a.cookie))).json()).holdings[0].quantity,10);
      assert.equal((await(await core.getPortfolio(request('/api/portfolio',undefined,b.cookie))).json()).holdings[0].quantity,30);
      await core.putPortfolio(request('/api/portfolio',{holdings:[]},a.cookie));
      assert.deepEqual((await(await core.getPortfolio(request('/api/portfolio',undefined,a.cookie))).json()).holdings,[]);
      assert.equal((await(await core.getPortfolio(request('/api/portfolio',undefined,b.cookie))).json()).holdings.length,1);
    }finally{db.close();}
  });
  test('validação falha antes da exclusão da carteira existente',async()=>{
    const{db,core}=fixture();try{
      const{cookie}=await register(core);await core.putPortfolio(request('/api/portfolio',{holdings:[holding]},cookie));
      await status(core.putPortfolio(request('/api/portfolio',{holdings:[{...holding,quantity:-1}]},cookie)),400);
      assert.deepEqual((await(await core.getPortfolio(request('/api/portfolio',undefined,cookie))).json()).holdings,[holding]);
    }finally{db.close();}
  });
  test('uma falha do banco no meio do lote reverte exclusão e inserções',async()=>{
    const{db,core}=fixture();try{
      const{cookie}=await register(core);await core.putPortfolio(request('/api/portfolio',{holdings:[holding]},cookie));
      db.sqlite.exec("CREATE TRIGGER reject_test_holding BEFORE INSERT ON holdings WHEN NEW.ticker = 'VALE3' BEGIN SELECT RAISE(ABORT, 'intentional test failure'); END;");
      await assert.rejects(core.putPortfolio(request('/api/portfolio',{holdings:[{...holding,ticker:'VALE3'}]},cookie)));
      assert.deepEqual((await(await core.getPortfolio(request('/api/portfolio',undefined,cookie))).json()).holdings,[holding]);
    }finally{db.close();}
  });
  test('erros desconhecidos não expõem SQL ou credenciais ao cliente',async()=>{
    const response=await authResponse(async()=>{throw new Error('SQL SECRET_PASSWORD');});assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/SQL|SECRET_PASSWORD/);
  });
});
