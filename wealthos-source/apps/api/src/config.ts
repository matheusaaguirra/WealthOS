export function getJwtSecret():string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret,'utf8') < 32 || /^(REPLACE|CHANGE|YOUR_|EXAMPLE)/i.test(secret)) {
    throw new Error('JWT_SECRET obrigatório: gere um segredo aleatório com no mínimo 32 bytes.');
  }
  return secret;
}
export function getCorsOrigin():string {
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:4200';
  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) throw new Error('Defina CORS_ORIGIN para execução em produção.');
  const parsed = new URL(origin);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) throw new Error('CORS_ORIGIN deve ser uma origem HTTP ou HTTPS exata.');
  return origin;
}
