# API WealthOS — base local

NestJS 11, Prisma 6 e PostgreSQL 16. A API conecta apenas em `127.0.0.1`; não foi publicada.

## Execução

Na raiz do monorepo, configure `.env`, suba o PostgreSQL pelo Compose, então:

```bash
npm ci
npm run build -w @wealthos/finance
npm run db:generate
npm run db:migrate
npm run dev:api
```

O runner de desenvolvimento compila TypeScript com os metadados usados pelo Nest, observa mudanças e reinicia o código compilado. A API usa `http://localhost:3000/api`.

`npm run db:seed` é opcional: exige `SEED_DEMO_PASSWORD` com pelo menos 10 caracteres e até 72 bytes, cria somente dados fictícios e recusa `NODE_ENV=production`. Se o usuário `demo@wealthos.local` já existir, não altera dados.

## Contrato HTTP

| Método e rota | Autorização | Resultado |
| --- | --- | --- |
| GET `/health` | Livre | Conectividade real com PostgreSQL; 503 em falha |
| POST `/auth/register` | Livre | `{accessToken,user}`; cria workspace e usuário na mesma transação |
| POST `/auth/login` | Livre | `{accessToken,user}`; credenciais inválidas retornam 401 |
| GET `/accounts` | Bearer JWT | Array de contas do workspace, com saldo calculado |
| POST `/accounts` | Bearer JWT | Conta criada |
| GET `/transactions?month=2026-10` | Bearer JWT | Array completo, mês opcional, inclusive estornos |
| POST `/transactions` | Bearer JWT | Lançamento criado ou replay idempotente |
| POST `/transactions/:id/reverse` | Bearer JWT | Estorno repetível sem novo efeito financeiro |
| GET `/summary?month=2026-10` | Bearer JWT | Receitas, despesas e resultado mensal; saldo de todas as contas |

Autenticação: JWT HS256, emissor `wealthos`, audiência `wealthos-api`, expiração em uma hora. O workspace vem exclusivamente do token. Não há autenticação por um identificador enviado no corpo da requisição. DTOs rejeitam propriedades desconhecidas e conversão implícita de números. Segredo de JWT obrigatório com pelo menos 32 bytes e sem placeholders conhecidos.

Valores usam centavos inteiros entre 1 e 1 bilhão por lançamento; saldo inicial permite negativo. Datas são `AAAA-MM-DD` e precisam existir entre 2000 e 2100. Resumo e saldos ignoram lançamentos estornados. A restrição composta conta/workspace no banco impede referências entre workspaces. Idempotência é única por workspace; reenviar a mesma chave com outro conteúdo retorna 409, inclusive quando chamadas concorrem. O estorno usa uma atualização condicional atômica. Lançamentos são preservados no histórico.

`balanceCents` em `/summary` é o resultado líquido do mês; `totalBalanceCents` é o saldo atual incluindo saldos iniciais e todo o histórico. Não confundir esses campos.

## Limites desta versão

- Histórico completo e cálculos carregam registros em memória. Paginação e agregação no PostgreSQL são necessárias antes de grande volume.
- Rate limit de 10 chamadas de autenticação/minuto e 120 chamadas gerais/minuto por IP funciona por processo. Produção com réplicas exige armazenamento compartilhado e uma política explícita para proxy.
- Não há refresh/revogação de JWT, recuperação e verificação de e-mail, auditoria persistente, monitoramento ou gestão de convite/membros.
- O MVP não implementa transferências entre contas, recorrências, parcelas persistentes, cartões, cobrança ou Open Finance. Orçamentos/metas da demo frontend não são recursos persistidos desta API.
- Saldo atual inclui lançamentos com datas futuras; não existe status de lançamento pendente. A evolução do produto precisa definir essa regra antes de adicionar agendamentos.
- Testes de unidade com mocks não substituem validação de migração, concorrência e autorização contra PostgreSQL. O pipeline inclui serviço PostgreSQL, mas sua execução remota não foi presumida.

Não há operação automática de deploy nem cobrança real nesta entrega. Mudanças destrutivas e migrações em produção precisam de revisão humana, backup e estratégia de recuperação documentada pelo time de Plataforma.
