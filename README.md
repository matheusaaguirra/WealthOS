# WealthOS

Gestão financeira pessoal com interface Angular, API Next.js e **Supabase Auth + PostgreSQL**. A aplicação começa em `/login`; o painel e os dados pessoais exigem sessão válida.

Site: https://wealthos-two-pi.vercel.app

## Funcionalidades

- Login e cadastro por e-mail/senha. O projeto de produção está configurado para cadastro sem confirmação de e-mail. Entrada Google por OAuth/PKCE depende de habilitar o provedor com credenciais válidas.
- Contas, lançamentos, estornos, orçamentos, metas, ativos listados e registros de renda fixa salvos por usuário no Supabase.
- Usuários novos começam com dados vazios. Dados da antiga demonstração não são carregados nem importados.
- Temas azul claro/escuro, catálogo paginado de ativos listados, gráficos, índices e criptomoedas.
- Cadastro manual de Tesouro Direto, CDB, LCI, LCA e LC, com indexadores CDI, IPCA e prefixado. Valores e rendimentos ausentes não são estimados.
- Campos numéricos rejeitam letras e notação científica, normalizam zeros iniciais e preservam centavos.
- Valores monetários em centavos, validação no servidor, RLS e controle de versão para impedir sobrescritas por abas desatualizadas.

## Configuração do Supabase

1. Crie ou selecione um projeto Supabase exclusivo para o WealthOS.
2. Aplique `supabase/migrations/202610220001_wealthos.sql` nesse projeto. A migração cria apenas tabelas novas, políticas RLS e a função de gravação; não remove registros existentes.
3. Configure na Vercel, para o projeto WealthOS:

| Variável | Valor |
| --- | --- |
| `SUPABASE_URL` | URL HTTPS do projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publishable (ou anon legada) desse projeto |
| `APP_URL` | `https://wealthos-two-pi.vercel.app` |
| `BRAPI_TOKEN` | Opcional, limitado pelo plano usado |

A aplicação usa somente a chave publishable e os tokens do usuário com RLS. **Não precisa de service role nem secret key administrativa.** Nenhuma chave real deve ser incluída no GitHub. Os cookies de autenticação são HttpOnly, SameSite=Lax e Secure em produção.

4. Em Supabase Auth → URL Configuration, use o domínio de produção como Site URL e permita `https://wealthos-two-pi.vercel.app/auth/callback` e `/auth/confirm`. Cadastre separadamente as URLs de desenvolvimento que realmente usar.
5. Habilite o provedor de e-mail e desative `Confirm email` em Authentication → Sign In / Providers para permitir cadastro com sessão imediata, conforme a configuração desejada para o WealthOS. A aplicação continua tratando confirmação pendente caso outro ambiente a exija.
6. Para Google, crie um cliente OAuth Web no Google Cloud e habilite o provedor Google no Supabase com seu Client ID e Client Secret. O redirect URI registrado no Google deve ser a URL de callback exibida pelo Supabase, não a URL do painel WealthOS. Mantenha o Client Secret somente na configuração do provedor.
7. Publique novamente e valide cadastro, login, dados persistidos após recarregar, logout e isolamento entre duas contas. O OAuth Google deve ser verificado com uma conta real após ativar o provedor.

Sem Supabase configurado, a tela de login aparece e informa indisponibilidade. Sem Google habilitado no provedor, o botão aparece indisponível. Não há fallback de visitante, armazenamento financeiro no navegador nem autenticação simulada.

## Desenvolvimento

Node.js 24:

```bash
npm ci
npm ci --prefix wealthos-source --ignore-scripts
```

Copie `.env.example` para `.env.local` e preencha as variáveis do projeto correto antes de usar autenticação ou executar migrações. As migrações Supabase são aplicadas pelo painel, CLI vinculada ao projeto ou integração de gerenciamento. O script legado `scripts/migrate.mjs` corresponde ao backend anterior; não é a migração desta versão.

```bash
npm run dev
npm test
npm run build
```

`npm run build` recompila o frontend Angular e depois o servidor Next.js. A Vercel usa a raiz do repositório, com as configurações de `vercel.json`. A conexão GitHub publica a branch `main`.

## Estrutura

- `wealthos-source/apps/web/src`: interface Angular.
- `wealthos-source/packages/finance`: cálculos financeiros compartilhados.
- `app/api/finance` e `app/api/portfolio`: dados privados do usuário.
- `app/api/auth` e `app/auth`: login, cadastro, logout e callbacks.
- `lib/supabase`: cliente SSR e integração de autenticação.
- `proxy.ts`: bloqueio do painel e da entrada HTML antiga sem sessão.
- `supabase/migrations`: esquema, políticas RLS e controle de concorrência.
- `test`: testes de validação, persistência, isolamento e provedores.

O NestJS/Prisma original e os adaptadores anteriores foram preservados como referência; não atendem o login ou os dados da versão atual. Os testes antigos desses módulos são regressões históricas. Os testes atuais de RLS usam PostgreSQL em WebAssembly/PGlite, com papéis `authenticated` e `anon`, e não substituem a verificação do projeto Supabase remoto.

## Limites

O cadastro de contas e posições é manual; não há conexão a banco ou corretora e nenhuma compra ou venda é executada. A consulta Google Finance depende do HTML público e pode ficar indisponível. Não há estimativa de preços em caso de erro. A amostra BRAPI mantém as restrições do plano. A recuperação de senha não foi incluída nesta entrega.

A integração remota só deve ser considerada concluída após aplicar a migração e verificar os fluxos no domínio publicado. Para rollback, restaure o código anterior sem apagar as tabelas de usuário. Qualquer limpeza de dados reais precisa de backup e autorização próprios.

## Verificação desta rodada

Consulte [o relatório de equipes e QA](docs/qa-report-2026-10-23.md) e [a configuração Google OAuth](docs/GOOGLE-OAUTH-SETUP.md) para evidências e pendências externas.
