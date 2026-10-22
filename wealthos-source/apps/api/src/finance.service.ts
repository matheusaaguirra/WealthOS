import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Transaction } from '@prisma/client';
import { balance, summarize, validateAmount, validateDate } from '@wealthos/finance';
import { PrismaService } from './prisma.service';
import { AccountDto, TransactionDto } from './dto';

function safeAdd(a:number,b:number) {
  const result = a+b;
  if (!Number.isSafeInteger(result)) throw new BadRequestException('Saldo total excede o limite numérico seguro.');
  return result;
}
const serializable = (tx:Transaction) => ({...tx,reversedAt:tx.reversedAt?.toISOString() ?? null});
export function validateMonth(month:string) {
  if (!/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month)) throw new BadRequestException('Mês inválido. Use AAAA-MM entre 2000 e 2100.');
}
function sameTransaction(existing:Transaction, dto:TransactionDto) {
  return existing.accountId === dto.accountId && existing.description === dto.description.trim() && existing.amountCents === dto.amountCents && existing.type === dto.type && existing.category === dto.category.trim() && existing.date === dto.date;
}
@Injectable()
export class FinanceService {
  constructor(private readonly prisma:PrismaService) {}
  async listAccounts(workspaceId:string) {
    const accounts = await this.prisma.account.findMany({where:{workspaceId},include:{transactions:true},orderBy:{createdAt:'asc'}});
    return accounts.map(({transactions,...account})=>({...account,balanceCents:balance(account.openingBalanceCents,transactions.map(serializable))}));
  }
  async createAccount(workspaceId:string,dto:AccountDto) {
    return this.prisma.account.create({data:{...dto,name:dto.name.trim(),institution:dto.institution.trim(),workspaceId}});
  }
  async listTransactions(workspaceId:string,month?:string) {
    if (month) validateMonth(month);
    const transactions = await this.prisma.transaction.findMany({where:{workspaceId,...(month ? {date:{startsWith:month}} : {})},orderBy:[{date:'desc'},{createdAt:'desc'}]});
    return transactions.map(serializable);
  }
  async createTransaction(workspaceId:string,dto:TransactionDto) {
    try { validateAmount(dto.amountCents); validateDate(dto.date); }
    catch { throw new BadRequestException('Valor ou data inválidos.'); }
    const data = {...dto,description:dto.description.trim(),category:dto.category.trim(),workspaceId};
    // Account membership is checked before idempotency replay to prevent cross-tenant references.
    const account = await this.prisma.account.findFirst({where:{id:dto.accountId,workspaceId}});
    if (!account) throw new NotFoundException('Conta não encontrada.');
    const unique = {workspaceId_idempotencyKey:{workspaceId,idempotencyKey:dto.idempotencyKey}};
    const existing = await this.prisma.transaction.findUnique({where:unique});
    if (existing) {
      if (!sameTransaction(existing,dto)) throw new ConflictException('Chave de idempotência já usada em outro lançamento.');
      return serializable(existing);
    }
    try { return serializable(await this.prisma.transaction.create({data})); }
    catch (error) {
      // A concorrência é resolvida pela restrição UNIQUE no banco, não apenas pelo find anterior.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const replay = await this.prisma.transaction.findUnique({where:unique});
        if (replay && sameTransaction(replay,dto)) return serializable(replay);
        throw new ConflictException('Chave de idempotência já usada em outro lançamento.');
      }
      throw error;
    }
  }
  async reverseTransaction(workspaceId:string,id:string) {
    // Atualização condicional atômica: uma chamada repetida não altera a data original de estorno.
    await this.prisma.transaction.updateMany({where:{id,workspaceId,reversedAt:null},data:{reversedAt:new Date()}});
    const transaction = await this.prisma.transaction.findFirst({where:{id,workspaceId}});
    if (!transaction) throw new NotFoundException('Lançamento não encontrado.');
    return serializable(transaction);
  }
  async summary(workspaceId:string,month=new Date().toISOString().slice(0,7)) {
    validateMonth(month);
    // Não usar a paginação do histórico para calcular saldos: todos os registros compõem o saldo.
    return this.prisma.$transaction(async tx => {
      const accounts = await tx.account.findMany({where:{workspaceId},include:{transactions:true}});
      const entries = accounts.flatMap(account=>account.transactions.map(serializable));
      const totals = summarize(entries,month);
      return {...totals,month,totalBalanceCents:accounts.reduce((sum,account)=>safeAdd(sum,balance(account.openingBalanceCents,account.transactions.map(serializable))),0)};
    },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead});
  }
}
