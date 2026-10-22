import 'reflect-metadata';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FinanceService } from '../src/finance.service';

const workspaceId = '11111111-1111-4111-8111-111111111111';
const accountId = '22222222-2222-4222-8222-222222222222';
const dto = { accountId, description: 'Mercado', amountCents: 12345, type: 'EXPENSE' as const, category: 'Alimentação', date: '2026-10-22', idempotencyKey: 'purchase_001' };
const saved = (overrides: Record<string, unknown> = {}) => ({ id: 'transaction-1', workspaceId, ...dto, reversedAt: null, createdAt: new Date('2026-10-22T12:00:00Z'), ...overrides });

function setup() {
  const calls: { method: string; args: any }[] = [];
  const prisma = {
    account: {
      findFirst: async (args: any) => { calls.push({ method: 'account.findFirst', args }); return { id: accountId, workspaceId }; },
      findMany: async (args: any) => { calls.push({ method: 'account.findMany', args }); return [] as any[]; },
      create: async (args: any) => { calls.push({ method: 'account.create', args }); return { id: accountId, ...args.data }; },
    },
    transaction: {
      findUnique: async (args: any): Promise<any> => { calls.push({ method: 'transaction.findUnique', args }); return null; },
      create: async (args: any): Promise<any> => { calls.push({ method: 'transaction.create', args }); return saved(args.data); },
      findMany: async (args: any): Promise<any[]> => { calls.push({ method: 'transaction.findMany', args }); return []; },
      updateMany: async (args: any) => { calls.push({ method: 'transaction.updateMany', args }); return { count: 1 }; },
      findFirst: async (args: any): Promise<any> => { calls.push({ method: 'transaction.findFirst', args }); return saved({ reversedAt: new Date('2026-10-22T15:00:00Z') }); },
    },
    $transaction: async (fn: (tx: any) => Promise<any>, options: any) => { calls.push({ method: '$transaction', args: options }); return fn(prisma); },
  };
  return { prisma, calls, service: new FinanceService(prisma as never) };
}

describe('FinanceService — isolamento e saldos', () => {
  it('lista somente contas do workspace e não expõe a relação interna', async () => {
    const { prisma, calls, service } = setup();
    prisma.account.findMany = async (args) => {
      calls.push({ method: 'account.findMany', args });
      return [{ id: accountId, workspaceId, openingBalanceCents: 10000, transactions: [saved({ amountCents: 500 })] }];
    };
    const result = await service.listAccounts(workspaceId);
    assert.equal(calls[0].args.where.workspaceId, workspaceId);
    assert.equal(result[0].balanceCents, 9500);
    assert.equal('transactions' in result[0], false);
  });

  it('cadastra conta no workspace autenticado e normaliza espaços', async () => {
    const { service, calls } = setup();
    await service.createAccount(workspaceId, { name: ' Conta principal ', institution: ' Banco ', color: '#123456', openingBalanceCents: -100 });
    assert.deepEqual(calls[0].args.data, { name: 'Conta principal', institution: 'Banco', color: '#123456', openingBalanceCents: -100, workspaceId });
  });

  it('filtra histórico por workspace e mês', async () => {
    const { service, calls } = setup();
    await service.listTransactions(workspaceId, '2026-10');
    assert.deepEqual(calls[0].args.where, { workspaceId, date: { startsWith: '2026-10' } });
  });

  it('rejeita mês inválido antes de consultar o banco', async () => {
    const { service, calls } = setup();
    await assert.rejects(service.listTransactions(workspaceId, '2026-13'), BadRequestException);
    assert.equal(calls.length, 0);
  });

  it('não cria lançamento para uma conta de outro workspace', async () => {
    const { prisma, service, calls } = setup();
    prisma.account.findFirst = async (args) => { calls.push({ method: 'account.findFirst', args }); return null as never; };
    await assert.rejects(service.createTransaction(workspaceId, dto), NotFoundException);
    assert.deepEqual(calls[0].args.where, { id: accountId, workspaceId });
    assert.equal(calls.some(call => call.method === 'transaction.create'), false);
  });

  it('rejeita data civil inexistente e valor fracionário antes de consultar o banco', async () => {
    const { service, calls } = setup();
    await assert.rejects(service.createTransaction(workspaceId, { ...dto, date: '2026-02-30' }), BadRequestException);
    await assert.rejects(service.createTransaction(workspaceId, { ...dto, amountCents: 1.2 }), BadRequestException);
    assert.equal(calls.length, 0);
  });

  it('inclui o workspace autenticado no lançamento salvo', async () => {
    const { service, calls } = setup();
    const result = await service.createTransaction(workspaceId, dto);
    const create = calls.find(call => call.method === 'transaction.create');
    assert.equal(create?.args.data.workspaceId, workspaceId);
    assert.equal(result.amountCents, dto.amountCents);
  });

  it('calcula resumo com todos os lançamentos e leitura consistente', async () => {
    const { prisma, service, calls } = setup();
    prisma.account.findMany = async (args) => {
      calls.push({ method: 'account.findMany', args });
      return [{ id: accountId, workspaceId, openingBalanceCents: 10000, transactions: [
        saved({ id: 'income', type: 'INCOME', amountCents: 20000 }),
        saved({ id: 'expense', amountCents: 5000 }),
        saved({ id: 'reversed', amountCents: 9000, reversedAt: new Date('2026-10-22T15:00:00Z') }),
        saved({ id: 'older', type: 'INCOME', date: '2026-09-01', amountCents: 3000 }),
      ] }];
    };
    const result = await service.summary(workspaceId, '2026-10');
    assert.deepEqual(result, { month: '2026-10', incomeCents: 20000, expenseCents: 5000, balanceCents: 15000, totalBalanceCents: 28000 });
    assert.equal(calls.find(call => call.method === 'account.findMany')?.args.where.workspaceId, workspaceId);
    assert.equal(calls.find(call => call.method === '$transaction')?.args.isolationLevel, 'RepeatableRead');
  });
});

describe('FinanceService — idempotência', () => {
  it('repetição idêntica retorna o registro existente sem inserir outro', async () => {
    const { prisma, service, calls } = setup();
    prisma.transaction.findUnique = async (args) => { calls.push({ method: 'transaction.findUnique', args }); return saved(); };
    const result = await service.createTransaction(workspaceId, dto);
    assert.equal(result.id, 'transaction-1');
    assert.equal(calls.some(call => call.method === 'transaction.create'), false);
    assert.deepEqual(calls.find(call => call.method === 'transaction.findUnique')?.args.where, { workspaceId_idempotencyKey: { workspaceId, idempotencyKey: dto.idempotencyKey } });
  });

  it('mesma chave com outro valor exige conflito', async () => {
    const { prisma, service, calls } = setup();
    prisma.transaction.findUnique = async () => saved({ amountCents: 1 });
    await assert.rejects(service.createTransaction(workspaceId, dto), ConflictException);
    assert.equal(calls.some(call => call.method === 'transaction.create'), false);
  });

  it('mesma chave com outra conta, categoria, tipo, data ou descrição exige conflito', async () => {
    for (const change of [
      { accountId: 'other-account' }, { category: 'Outra' }, { type: 'INCOME' },
      { date: '2026-10-21' }, { description: 'Outra compra' },
    ]) {
      const { prisma, service } = setup();
      prisma.transaction.findUnique = async () => saved(change);
      await assert.rejects(service.createTransaction(workspaceId, dto), ConflictException);
    }
  });

  it('recupera repetição equivalente após colisão UNIQUE concorrente', async () => {
    const { prisma, service } = setup();
    let reads = 0;
    prisma.transaction.findUnique = async () => (++reads === 1 ? null : saved());
    prisma.transaction.create = async () => { throw new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6.19.0' }); };
    const result = await service.createTransaction(workspaceId, dto);
    assert.equal(reads, 2);
    assert.equal(result.id, 'transaction-1');
  });

  it('colisão UNIQUE com payload diferente exige conflito', async () => {
    const { prisma, service } = setup();
    let reads = 0;
    prisma.transaction.findUnique = async () => (++reads === 1 ? null : saved({ amountCents: 1 }));
    prisma.transaction.create = async () => { throw new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6.19.0' }); };
    await assert.rejects(service.createTransaction(workspaceId, dto), ConflictException);
  });

  it('falha inesperada do banco é propagada sem aparentar sucesso', async () => {
    const { prisma, service } = setup();
    const failure = new Error('database unavailable');
    prisma.transaction.create = async () => { throw failure; };
    await assert.rejects(service.createTransaction(workspaceId, dto), error => error === failure);
  });
});

describe('FinanceService — estorno', () => {
  it('condiciona atualização ao workspace e ao estado ainda não estornado', async () => {
    const { service, calls } = setup();
    const result = await service.reverseTransaction(workspaceId, 'transaction-1');
    assert.deepEqual(calls[0].args.where, { id: 'transaction-1', workspaceId, reversedAt: null });
    assert.ok(calls[0].args.data.reversedAt instanceof Date);
    assert.deepEqual(calls[1].args.where, { id: 'transaction-1', workspaceId });
    assert.equal(result.reversedAt, '2026-10-22T15:00:00.000Z');
  });

  it('repetição de estorno mantém a data anterior', async () => {
    const { prisma, service } = setup();
    prisma.transaction.updateMany = async () => ({ count: 0 });
    const result = await service.reverseTransaction(workspaceId, 'transaction-1');
    assert.equal(result.reversedAt, '2026-10-22T15:00:00.000Z');
  });

  it('ID desconhecido ou de outro workspace não vaza o lançamento', async () => {
    const { prisma, service } = setup();
    prisma.transaction.updateMany = async () => ({ count: 0 });
    prisma.transaction.findFirst = async () => null;
    await assert.rejects(service.reverseTransaction(workspaceId, 'foreign-id'), NotFoundException);
  });
});
