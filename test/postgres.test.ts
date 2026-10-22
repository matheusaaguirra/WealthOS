import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { PostgresDatabase, type ConnectionPool } from '../lib/postgres';
import { AuthCore, AuthError } from '../lib/auth-core';

const origin='https://wealthos.example';
function request(path:string,body?:unknown,cookie?:string){
  return new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{origin,'content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1',...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
async function fixture(){
  const pg=new PGlite();await pg.exec(await readFile(new URL('../db/postgres/001_initial.sql',import.meta.url),'utf8'));
  const query=async(sql:string,values?:unknown[])=>({rows:(await pg.query(sql,values)).rows as Record<string,unknown>[]});
  const pool:ConnectionPool={query,connect:async()=>({query,release(){}})};
  const database=new PostgresDatabase(pool);return{pg,database,core:new AuthCore({DB:database})};
}
async function register(core:AuthCore,email:string){
  const response=await core.register(request('/api/auth/register',{name:'Teste PostgreSQL',email,password:'SenhaDeTeste123!'}));
  return {cookie:response.headers.get('set-cookie')!.split(';')[0],user:(await response.json()).user};
}
test('PostgreSQL: register, login, isolated portfolio, camelCase price and logout',async()=>{
  const{pg,core}=await fixture();
  try{
    const a=await register(core,'a@example.com');const b=await register(core,'b@example.com');
    const holding={id:crypto.randomUUID(),ticker:'PETR4',quantity:12,averagePriceCents:null};
    await core.putPortfolio(request('/api/portfolio',{holdings:[holding]},a.cookie));
    assert.deepEqual((await(await core.getPortfolio(request('/api/portfolio',undefined,a.cookie))).json()).holdings,[holding]);
    assert.deepEqual((await(await core.getPortfolio(request('/api/portfolio',undefined,b.cookie))).json()).holdings,[]);
    const signedIn=await core.login(request('/api/auth/login',{email:'a@example.com',password:'SenhaDeTeste123!'}));
    const cookie=signedIn.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await core.currentUser(request('/api/auth/me',undefined,cookie)))?.id,a.user.id);
    await core.logout(request('/api/auth/logout',{},cookie));
    assert.equal(await core.currentUser(request('/api/auth/me',undefined,cookie)),null);
  }finally{await pg.close();}
});
test('PostgreSQL: portfolio batch rolls back a deletion when an insert fails',async()=>{
  const{pg,core,database}=await fixture();
  try{
    const a=await register(core,'rollback@example.com');
    const holding={id:crypto.randomUUID(),ticker:'VALE3',quantity:8,averagePriceCents:5500};
    await core.putPortfolio(request('/api/portfolio',{holdings:[holding]},a.cookie));
    await assert.rejects(database.batch([
      database.prepare('DELETE FROM holdings WHERE user_id = ?').bind(a.user.id),
      database.prepare('INSERT INTO holdings(user_id,ticker,id,quantity,updated_at) VALUES (?,?,?,?,?)').bind(a.user.id,'PETR4',crypto.randomUUID(),-1,100),
    ],a.user.id));
    assert.deepEqual((await(await core.getPortfolio(request('/api/portfolio',undefined,a.cookie))).json()).holdings,[holding]);
  }finally{await pg.close();}
});
test('PostgreSQL: persistent rate limit increments atomically and rejects excess requests',async()=>{
  const{pg,core}=await fixture();
  try{
    for(let i=0;i<3;i++)await core.rateLimit(request('/api/auth/login'),'pg-test',3);
    await assert.rejects(core.rateLimit(request('/api/auth/login'),'pg-test',3),error=>error instanceof AuthError&&error.status===429);
  }finally{await pg.close();}
});
