import { AuthError, readJson, assertKeys, normalizeEmail, validateName, validatePassword, validateHoldings } from '../auth-core';
import { createSupabase, publicUser, requireSupabase, privateHeaders, appOrigin, supabaseSettings } from './server';

export class SupabaseAuth {
  async currentUser(_request:Request){
    if(!supabaseSettings())return null;
    const client=await createSupabase();const {data:{user},error}=await client.auth.getUser();
    if(error||!user)return null;return publicUser(user);
  }
  async login(request:Request){
    const body=await readJson(request);assertKeys(body,['email','password']);
    const email=normalizeEmail(body.email),password=validatePassword(body.password,false);
    const client=await createSupabase();const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error||!data.user)throw new AuthError(error?.status===429?429:401,error?.code==='email_not_confirmed'?'Confirme seu e-mail antes de entrar.':'E-mail ou senha inválidos.');
    return Response.json({user:publicUser(data.user)},{headers:privateHeaders});
  }
  async register(request:Request){
    const body=await readJson(request);assertKeys(body,['email','password','name']);
    const email=normalizeEmail(body.email),password=validatePassword(body.password),name=validateName(body.name);
    const client=await createSupabase();const {data,error}=await client.auth.signUp({email,password,options:{data:{name,full_name:name},emailRedirectTo:appOrigin(request)+'/auth/callback'}});
    if(error)throw new AuthError(error.status===429?429:400,error.status===429?'Muitas tentativas. Aguarde alguns instantes.':'Não foi possível criar a conta. Verifique os dados e tente novamente.');
    if(!data.session||!data.user)return Response.json({user:null,requiresEmailConfirmation:true,message:'Confira seu e-mail para confirmar a conta e entrar.'},{headers:privateHeaders});
    return Response.json({user:publicUser(data.user),requiresEmailConfirmation:false},{headers:privateHeaders});
  }
  async google(_request:Request):Promise<Response>{throw new AuthError(405,'Use o botão Continuar com Google para iniciar o login.');}
  async logout(request:Request){
    const body=await readJson(request);assertKeys(body,[]);const client=await createSupabase();
    const {error}=await client.auth.signOut({scope:'local'});if(error)throw new AuthError(503,'Não foi possível encerrar a sessão. Tente novamente.');
    return Response.json({user:null},{headers:privateHeaders});
  }
  async getPortfolio(_request:Request){
    const {client,user}=await requireSupabase();const {data,error}=await client.from('wealthos_portfolios').select('holdings').eq('user_id',user.id).maybeSingle();
    if(error)throw new AuthError(503,'Não foi possível carregar a carteira. Tente novamente.');
    return Response.json({holdings:validateHoldings({holdings:data?.holdings??[]})},{headers:privateHeaders});
  }
  async putPortfolio(request:Request){
    const {client,user}=await requireSupabase();const body=await readJson(request);const holdings=validateHoldings(body);
    const {error}=await client.from('wealthos_portfolios').upsert({user_id:user.id,holdings,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error)throw new AuthError(503,'Não foi possível salvar a carteira. Nenhuma alteração foi confirmada.');
    return Response.json({holdings},{headers:privateHeaders});
  }
}
