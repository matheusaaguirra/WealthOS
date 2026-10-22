# WealthOS

Primeira base executável de um SaaS brasileiro de finanças pessoais. Angular + NestJS + Prisma + PostgreSQL. Interface e documentação em português; valores em centavos inteiros.

**Status:** versão inicial para desenvolvimento local. O frontend abre em demonstração, com dados fictícios salvos somente neste navegador. A API utiliza PostgreSQL real e autenticação JWT. A demonstração e os dados da API permanecem separados. Orçamentos e metas funcionam localmente na demonstração; persistência desses módulos no servidor faz parte do roadmap. Sem conexão bancária, cobranças ou publicação em produção.

## Abrir a prévia já compilada

O pacote ZIP inclui o bundle Angular pronto. Com Node instalado, execute na raiz `npm run preview` e abra http://localhost:4200. Não precisa instalar dependências para essa prévia. Para conectar o backend neste modo, informe `http://localhost:3000/api` no diálogo de conexão.

## Início rápido — desenvolvimento da demonstração

Requisitos: Node 22.12+ (recomendado Node 22), npm.

```bash
npm ci
npm run build -w @wealthos/finance
npm run dev:web
```

Abra http://localhost:4200. Navegue pelo dashboard, contas, lançamentos, orçamentos e metas. Cadastre uma conta e um lançamento, estorne, filtre o histórico e acompanhe os saldos. Dados demonstrativos ficam no localStorage, não são compartilhados entre dispositivos. Não use dados financeiros reais nesse modo.

## API e banco de dados

Requisitos adicionais: Docker com Compose, ou PostgreSQL 16 instalado.

1. Copie `.env.example` para `.env` na raiz.
2. Defina a senha local em `POSTGRES_PASSWORD` e `DATABASE_URL` (codifique caracteres especiais na URL).
3. Gere `JWT_SECRET` com o comando abaixo e coloque o resultado somente no `.env`.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run build -w @wealthos/finance
npm run dev:api
```

Em outro terminal rode `npm run dev:web`. O servidor Angular encaminha `/api` para `http://127.0.0.1:3000`; a API aceita conexões locais por padrão. Use a conexão com a API na interface para cadastrar um usuário e começar com contas vazias. Token fica em memória e perde-se ao atualizar a página; faça login novamente. Nenhum dado demo é importado automaticamente.

Opcional: defina `SEED_DEMO_PASSWORD` (mínimo 10 caracteres, máximo 72 bytes) no ambiente ou no `.env` e execute `npm run db:seed`. Cria exclusivamente dados fictícios e usuário `demo@wealthos.local`, nunca em produção. Senha não está incluída no projeto.

## Verificação

```bash
npm run db:generate
npm run build
npm test
```

A suíte unitária testa invariantes financeiras, autenticação e regras de isolamento usando mocks. Não substitui teste de integração com banco real. Veja `docs/CEO-REPORT.md` para evidências desta entrega e limites da execução. A migração inicial acompanha o schema; o pipeline de CI usa PostgreSQL efêmero, mas exige que este repositório seja hospedado e o workflow executado. Pipeline criado não significa pipeline aprovado.

## Estrutura

- `apps/web`: Angular standalone, dashboard e formulários responsivos.
- `apps/api`: NestJS, JWT, validação, idempotência e estorno, Prisma e migração.
- `packages/finance`: cálculo compartilhado e testes de valores, datas, saldos e parcelas.
- `docs/organograma.html`: 31 papéis e Kanban offline; abra diretamente no navegador.
- `docs/PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `backlog.json`: produto, arquitetura e planejamento.
- `docs/SECURITY.md`, `DATABASE.md`, `QA-PLAN.md`: segurança, recuperação e verificações.
- `AGENTS.md`: estrutura de equipes fornecida pelo fundador, preservada.

## API resumida

Todas as rotas abaixo usam prefixo `/api`. Exceto health e auth, exigem `Authorization: Bearer <token>`.

| Método | Rota | Operação |
| --- | --- | --- |
| GET | `/health` | Verifica conexão real com o banco |
| POST | `/auth/register` | Cria usuário e workspace em transação |
| POST | `/auth/login` | Retorna token com validade de uma hora |
| GET / POST | `/accounts` | Lista / cria contas do workspace |
| GET / POST | `/transactions` | Lista / cria lançamentos |
| POST | `/transactions/:id/reverse` | Estorna sem apagar o registro |
| GET | `/summary?month=2026-10` | Resumo mensal e saldo total |

`TransactionDto` aceita `amountCents` inteiro positivo, `type` INCOME/EXPENSE, data `YYYY-MM-DD`, `accountId`, `description`, `category` e `idempotencyKey`. Repetir uma chave com o mesmo conteúdo retorna o lançamento existente; conteúdo diferente retorna conflito. O workspace vem do token e não pode ser escolhido no body.

## Próximo marco

Validar migrações e fluxos HTTP contra PostgreSQL real; ampliar E2E; persistir orçamentos e metas na API; recuperação de senha, sessão renovável e privacidade/exportação; depois homologação e monetização. Deploy e integrações externas ficam para uma atividade explícita do fundador.

Referências técnicas: https://angular.dev/reference/versions, https://docs.nestjs.com/v11/first-steps e https://www.prisma.io/docs/orm/v6/prisma-client/deployment/deploy-database-changes-with-prisma-migrate. As versões exatas estão no package-lock.json. Angular 20 está em LTS: planejar atualização antes de seu fim de suporte.


## Versão hospedada no Sites

Este checkout preserva o código editável e o bundle publicado em `dist/`. Para reconstruir o Site: `npm ci`, `npm run db:generate`, `npm run build`. O comando `npm run build:all` verifica também o backend. A hospedagem atual entrega somente a demonstração Angular: não hospeda NestJS/PostgreSQL, não conecta a B3 e não recebe a carteira local do visitante. Tema e carteira ficam no navegador. Veja `docs/MARKET-DATA.md` para a pesquisa de fontes/custos em22/10/2026.
