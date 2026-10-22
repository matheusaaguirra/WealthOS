# WealthOS — GitHub + Vercel

Versão portátil da aplicação WealthOS: interface Angular, rotas Next.js para autenticação e dados de mercado e persistência PostgreSQL. Preserva os temas azul claro/escuro, busca de ações, gráficos, índices, criptomoedas e carteira por usuário.

## Estrutura

- `wealthos-source/apps/web`: fonte Angular que produz a interface.
- `wealthos-source/packages/finance`: cálculos financeiros compartilhados.
- `public/app`: distribuição compilada da interface, atualizada por `npm run build:web`.
- `app/api`: rotas da aplicação; `lib/auth-core.ts`: autenticação e autorização.
- `lib/postgres.ts`: adaptador com consultas parametrizadas e transações.
- `db/postgres`: migrações versionadas para o banco da Vercel.
- `wealthos-source/apps/api`: NestJS/Prisma original, preservado como código de referência; não é o servidor desta implantação Vercel.

## Executar

Use Node.js 24 e npm.

```bash
npm ci
npm ci --prefix wealthos-source --ignore-scripts
```

Copie `.env.example` para `.env.local` e configure `DATABASE_URL` com a conexão PostgreSQL. A URL permanece somente no servidor. O provedor deve oferecer conexão apropriada para aplicações serverless, preferencialmente com pool.

A migração usa variáveis do processo. Com Node.js 24, carregue o arquivo local explicitamente:

```bash
node --env-file=.env.local scripts/migrate.mjs
npm run dev
```

Acesse http://localhost:3000. Não há criação automática de schema durante requisições ou build.

## Vercel

1. Use o repositório `matheusaaguirra/WealthOS`, com esta raiz e seus lockfiles. Não envie `.env`, `.vercel`, caches, dados locais ou `node_modules`.
2. Importe esse repositório na Vercel, com raiz `./`. `vercel.json` define Next.js e os comandos de instalação e build. Não selecione a subpasta Angular como raiz.
3. Conecte um PostgreSQL e configure `DATABASE_URL` na Vercel. Opcionalmente configure `BRAPI_TOKEN` e `GOOGLE_CLIENT_ID`. Nenhuma assinatura paga foi criada.
4. Execute a migração para esse banco antes de liberar cadastro e carteira. Com `DATABASE_URL` já definida no processo: `npm run db:migrate`.
5. Publique e valide cadastro, login, gravação/leitura da carteira, logout e uma consulta de mercado pelo domínio publicado.

A integração GitHub da Vercel deve ser autorizada para o repositório escolhido; commits na branch de produção podem então disparar novos deploys.

## Verificação

```bash
npm test
npm run build
```

A suíte cobre autenticação, autorização, sessão, rollback, dados de mercado e extração Google Finance. Os testes adicionais PostgreSQL usam PGlite, um PostgreSQL em WebAssembly. Conexão real, migração e fluxos no domínio Vercel só podem ser confirmados depois do provisionamento.

## Dados existentes e limites

A base PostgreSQL começa vazia. Usuários e carteiras do D1 anterior **não foram migrados**. O site anterior foi mantido; antes de qualquer transferência de dados, exporte e confira os registros de origem e destino. A migração inicial não apaga tabelas nem inclui dados de usuários.

Google OAuth requer um Client ID válido e o domínio Vercel em origens JavaScript autorizadas no Google Cloud; sem isso, o site oferece e-mail/senha. Ainda faltam recuperação de senha e confirmação de e-mail. Os demais módulos financeiros seguem em demonstração local.

Google Finance depende do HTML público e pode falhar se houver alterações ou limitação de acesso. BRAPI mantém as restrições do plano contratado; sem token, há somente os ativos de teste. As cotações não são estimadas em caso de indisponibilidade.

Para reverter código, use o deployment anterior da Vercel. Não apague o banco para reverter uma publicação; a migração inicial é aditiva. Qualquer reversão de schema ou importação de dados exige backup e validação próprios.
