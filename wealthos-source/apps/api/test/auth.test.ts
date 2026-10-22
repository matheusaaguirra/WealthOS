import 'reflect-metadata';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { AuthService } from '../src/auth.service';
import { AuthGuard } from '../src/auth.guard';

const workspaceId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const user = { id: userId, workspaceId, name: 'Pessoa Exemplo', email: 'pessoa@example.test' };

function setupAuth() {
  const calls: { method: string; args: any }[] = [];
  const prisma = {
    workspace: { create: async (args: any) => { calls.push({ method: 'workspace.create', args }); return { id: workspaceId }; } },
    user: {
      create: async (args: any) => { calls.push({ method: 'user.create', args }); return { ...user, ...args.data }; },
      findUnique: async (args: any): Promise<any> => { calls.push({ method: 'user.findUnique', args }); return null; },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => { calls.push({ method: '$transaction', args: null }); return fn(prisma); },
  };
  const jwt = { signAsync: async (args: any) => { calls.push({ method: 'jwt.signAsync', args }); return 'test-token'; } };
  return { prisma, calls, service: new AuthService(prisma as never, jwt as never) };
}

describe('AuthService', () => {
  it('cadastra workspace/usuário juntos, salva hash e devolve sessão sem senha', async () => {
    const { service, calls } = setupAuth();
    const password = 'senha-ficticia-123';
    const result = await service.register({ name: ' Pessoa Exemplo ', email: 'Pessoa@Example.Test ', password });
    assert.equal(calls[0].method, '$transaction');
    const create = calls.find(call => call.method === 'user.create')!;
    assert.equal(create.args.data.email, 'pessoa@example.test');
    assert.equal(create.args.data.name, 'Pessoa Exemplo');
    assert.equal(create.args.data.workspaceId, workspaceId);
    assert.notEqual(create.args.data.passwordHash, password);
    assert.equal(await compare(password, create.args.data.passwordHash), true);
    assert.equal(result.accessToken, 'test-token');
    assert.equal('passwordHash' in result.user, false);
    assert.equal('password' in result.user, false);
    assert.deepEqual(calls.find(call => call.method === 'jwt.signAsync')?.args, { sub: userId, workspaceId });
  });
  it('rejeita senha UTF-8 acima de 72 bytes sem truncar silenciosamente', async () => {
    const { service, calls } = setupAuth();
    await assert.rejects(service.register({ name: 'Pessoa', email: 'pessoa@example.test', password: 'á'.repeat(37) }), BadRequestException);
    assert.equal(calls.length, 0);
  });
  it('converte e-mail duplicado em conflito e não emite sessão', async () => {
    const { prisma, service, calls } = setupAuth();
    prisma.user.create = async () => { throw new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6.19.0' }); };
    await assert.rejects(service.register({ name: 'Pessoa', email: 'pessoa@example.test', password: 'senha-ficticia-123' }), ConflictException);
    assert.equal(calls.some(call => call.method === 'jwt.signAsync'), false);
  });
  it('autentica senha correta e usa workspace persistido no token', async () => {
    const { prisma, service, calls } = setupAuth();
    const passwordHash = await hash('senha-ficticia-123', 4);
    prisma.user.findUnique = async (args) => { calls.push({ method: 'user.findUnique', args }); return { ...user, passwordHash }; };
    const result = await service.login({ email: 'PESSOA@example.test', password: 'senha-ficticia-123' });
    assert.equal(result.user.workspaceId, workspaceId);
    assert.deepEqual(calls[0].args.where, { email: 'pessoa@example.test' });
    assert.deepEqual(calls.find(call => call.method === 'jwt.signAsync')?.args, { sub: userId, workspaceId });
    assert.equal('passwordHash' in result.user, false);
  });
  it('senha incorreta não emite token', async () => {
    const { prisma, service, calls } = setupAuth();
    const passwordHash = await hash('senha-ficticia-123', 4);
    prisma.user.findUnique = async () => ({ ...user, passwordHash });
    await assert.rejects(service.login({ email: user.email, password: 'outra-senha-123' }), UnauthorizedException);
    assert.equal(calls.some(call => call.method === 'jwt.signAsync'), false);
  });
  it('usuário inexistente recebe mensagem genérica de credenciais inválidas', async () => {
    const { service, calls } = setupAuth();
    await assert.rejects(service.login({ email: 'missing@example.test', password: 'senha-ficticia-123' }), (error: any) => error instanceof UnauthorizedException && error.message === 'E-mail ou senha inválidos.');
    assert.equal(calls.some(call => call.method === 'jwt.signAsync'), false);
  });
});

function guardContext(authorization?: string) {
  const request: any = { headers: authorization ? { authorization } : {} };
  return { request, context: { switchToHttp: () => ({ getRequest: () => request }) } as any };
}

describe('AuthGuard', () => {
  it('rejeita falta de autenticação antes de verificar JWT', async () => {
    let verified = false;
    const guard = new AuthGuard({ verifyAsync: async () => { verified = true; return {}; } } as never);
    await assert.rejects(guard.canActivate(guardContext().context), UnauthorizedException);
    assert.equal(verified, false);
  });
  it('rejeita esquema diferente de Bearer', async () => {
    const guard = new AuthGuard({ verifyAsync: async () => ({ sub: userId, workspaceId }) } as never);
    await assert.rejects(guard.canActivate(guardContext('Basic abc').context), UnauthorizedException);
  });
  it('valida assinatura e claims e atribui identidade mínima à requisição', async () => {
    let verification: any;
    const guard = new AuthGuard({ verifyAsync: async (...args: any[]) => { verification = args; return { sub: userId, workspaceId, ignored: 'not copied' }; } } as never);
    const { request, context } = guardContext('Bearer test-token');
    assert.equal(await guard.canActivate(context), true);
    assert.deepEqual(verification, ['test-token', { algorithms: ['HS256'], issuer: 'wealthos', audience: 'wealthos-api' }]);
    assert.deepEqual(request.user, { sub: userId, workspaceId });
  });
  it('token expirado ou assinatura inválida não define usuário', async () => {
    const guard = new AuthGuard({ verifyAsync: async () => { throw new Error('invalid signature'); } } as never);
    const { request, context } = guardContext('Bearer invalid');
    await assert.rejects(guard.canActivate(context), UnauthorizedException);
    assert.equal(request.user, undefined);
  });
  it('rejeita claims sem UUIDs válidos para usuário ou workspace', async () => {
    for (const payload of [{ sub: userId }, { workspaceId }, { sub: 123, workspaceId }, { sub: userId, workspaceId: 'foreign-string' }, { sub: 'invalid', workspaceId }]) {
      const guard = new AuthGuard({ verifyAsync: async () => payload } as never);
      const { request, context } = guardContext('Bearer invalid-claims');
      await assert.rejects(guard.canActivate(context), UnauthorizedException);
      assert.equal(request.user, undefined);
    }
  });
});
