import 'reflect-metadata';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpException } from '@nestjs/common';
import { getCorsOrigin, getJwtSecret } from '../src/config';
import { RateLimitGuard } from '../src/rate-limit.guard';

function withEnv(values: Record<string, string | undefined>, run: () => void) {
  const before = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) value === undefined ? delete process.env[key] : process.env[key] = value;
    run();
  } finally {
    for (const [key, value] of Object.entries(before)) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
}

describe('configuração de segurança', () => {
  it('recusa segredo ausente, curto e placeholders do exemplo', () => {
    for (const secret of [undefined, 'curto', 'REPLACE_WITH_A_RANDOM_SECRET_1234567890', 'CHANGE_THIS_SECRET_BEFORE_RUNNING_12345']) {
      withEnv({ JWT_SECRET: secret }, () => assert.throws(getJwtSecret));
    }
  });
  it('aceita um segredo de teste com pelo menos 32 bytes', () => {
    const secret = '62c421d9a35f48e1807cb2f06a84d925';
    withEnv({ JWT_SECRET: secret }, () => assert.equal(getJwtSecret(), secret));
  });
  it('exige CORS explícito em produção', () => {
    withEnv({ NODE_ENV: 'production', CORS_ORIGIN: undefined }, () => assert.throws(getCorsOrigin));
  });
  it('rejeita wildcard, caminho e esquema sem HTTP em CORS', () => {
    for (const origin of ['*', 'https://app.example.test/path', 'file:///tmp/index.html']) {
      withEnv({ CORS_ORIGIN: origin }, () => assert.throws(getCorsOrigin));
    }
  });
  it('aceita uma origem HTTPS exata', () => {
    withEnv({ CORS_ORIGIN: 'https://app.example.test' }, () => assert.equal(getCorsOrigin(), 'https://app.example.test'));
  });
});

function context(ip: string, path: string) {
  const headers: Record<string, unknown> = {};
  return {
    headers,
    context: { switchToHttp: () => ({ getRequest: () => ({ ip, path }), getResponse: () => ({ setHeader: (name: string, value: unknown) => { headers[name] = value; } }) }) } as any,
  };
}

describe('rate limit local', () => {
  it('limita autenticação, compartilha limite login/cadastro e informa nova tentativa', () => {
    const guard = new RateLimitGuard();
    const login = context('127.0.0.10', '/api/auth/login');
    for (let attempt = 0; attempt < 10; attempt++) assert.equal(guard.canActivate(login.context), true);
    const register = context('127.0.0.10', '/api/auth/register');
    assert.throws(() => guard.canActivate(register.context), (error: any) => error instanceof HttpException && error.getStatus() === 429);
    assert.ok(Number(register.headers['Retry-After']) >= 1);
    assert.equal(guard.canActivate(context('127.0.0.11', '/api/auth/login').context), true);
    assert.equal(guard.canActivate(context('127.0.0.10', '/api/accounts').context), true);
  });
  it('renova limite depois de um minuto', t => {
    let now = 100000;
    t.mock.method(Date, 'now', () => now);
    const guard = new RateLimitGuard();
    const request = context('127.0.0.20', '/api/auth/login');
    for (let attempt = 0; attempt < 10; attempt++) guard.canActivate(request.context);
    assert.throws(() => guard.canActivate(request.context));
    now += 60001;
    assert.equal(guard.canActivate(request.context), true);
  });
});
