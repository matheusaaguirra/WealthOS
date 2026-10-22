import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
config({path:resolve(__dirname,'../../../.env')});
const prisma = new PrismaClient();
async function seed() {
  if (process.env.NODE_ENV === 'production') throw new Error('O seed demonstrativo não pode rodar em produção.');
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 10 || Buffer.byteLength(password,'utf8')>72) throw new Error('Defina SEED_DEMO_PASSWORD entre 10 caracteres e 72 bytes para criar o usuário fictício.');
  const email = 'demo@wealthos.local';
  if (await prisma.user.findUnique({where:{email}})) {console.info('Usuário demonstrativo já existe; nenhum dado foi alterado.');return;}
  const passwordHash = await hash(password,12);
  const month = new Date().toISOString().slice(0,7);
  await prisma.$transaction(async tx=>{
    const workspace = await tx.workspace.create({data:{name:'Demonstração WealthOS'}});
    await tx.user.create({data:{email,name:'Pessoa demonstração',passwordHash,workspaceId:workspace.id}});
    const account = await tx.account.create({data:{workspaceId:workspace.id,name:'Conta demonstração',institution:'Banco fictício',color:'#8b5cf6',openingBalanceCents:250000}});
    await tx.transaction.createMany({data:[
      {workspaceId:workspace.id,accountId:account.id,description:'Receita demonstrativa',amountCents:620000,type:'INCOME',category:'Salário',date:`${month}-05`,idempotencyKey:'seed-income-001'},
      {workspaceId:workspace.id,accountId:account.id,description:'Moradia demonstrativa',amountCents:185000,type:'EXPENSE',category:'Moradia',date:`${month}-10`,idempotencyKey:'seed-expense-001'},
      {workspaceId:workspace.id,accountId:account.id,description:'Mercado demonstrativo',amountCents:38690,type:'EXPENSE',category:'Alimentação',date:`${month}-12`,idempotencyKey:'seed-expense-002'}
    ]});
  });
  console.info('Dados fictícios criados. Login: demo@wealthos.local. Use a senha definida em SEED_DEMO_PASSWORD.');
}
seed().catch(error=>{console.error(error instanceof Error ? error.message : 'Falha ao gerar demonstração.');process.exitCode=1;}).finally(()=>prisma.$disconnect());
