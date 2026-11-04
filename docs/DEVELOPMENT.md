# Desenvolvimento do WealthOS

[← Voltar para a apresentação do projeto](../README.md)

## Tecnologia e arquitetura

| Camada | Implementação |
| --- | --- |
| **Interface da aplicação** | Angular 20 e TypeScript. |
| **Landing page e servidor** | Next.js 16 e React 19, com rotas de API no mesmo projeto. |
| **Autenticação e dados** | Supabase Auth e PostgreSQL, com políticas de Row Level Security (RLS). |
| **Núcleo financeiro** | Pacote TypeScript compartilhado em `@wealthos/finance`. |
| **Publicação** | Vercel, com integração ao repositório GitHub. |
| **Testes** | Node.js Test Runner, `tsx` e PGlite para testes locais de banco e RLS. |

O build compila a interface Angular para `public/app` e depois gera a aplicação Next.js. O servidor atende a landing page, a autenticação, as APIs e o acesso protegido ao painel.

O código original de **NestJS e Prisma** permanece em `wealthos-source` como referência histórica. Ele não é o backend usado pela aplicação atual.

## Rodando localmente

### 1. Preparar o ambiente

Você precisa de **Node.js 24**, npm e um projeto Supabase configurado para desenvolvimento.

```bash
git clone https://github.com/matheusaaguirra/WealthOS.git
cd WealthOS
npm ci
npm ci --prefix wealthos-source --ignore-scripts
```

### 2. Configurar as variáveis

Copie `.env.example` para `.env.local` na raiz e preencha os valores do seu ambiente. Para desenvolvimento, ajuste `APP_URL` para a origem local:

```dotenv
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
APP_URL=http://localhost:3000
BRAPI_TOKEN=
```

| Variável | Uso |
| --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável do mesmo projeto; também aceita a chave `anon` legada. |
| `APP_URL` | Origem da aplicação: `http://localhost:3000` localmente ou `https://wealthos.com.br` em produção. |
| `BRAPI_TOKEN` | Token opcional do provedor de cotações, sujeito aos limites do plano contratado. |

O esquema está em [`supabase/migrations`](../supabase/migrations). Em um projeto novo, aplique a migração antes de testar persistência. Não reaplique a migração inicial em um banco já configurado. O comando `db:migrate:legacy` pertence ao backend antigo.

Configure as URLs de retorno do Auth para o ambiente utilizado. O login Google exige um cliente OAuth válido no Google Cloud e o provedor habilitado no Supabase; o segredo OAuth permanece na configuração do provedor. Consulte os guias de [autenticação](AUTH.md) e [Google OAuth](GOOGLE-OAUTH-SETUP.md).

### 3. Compilar a interface e iniciar

```bash
npm run build:web
npm run dev
```

Abra **[localhost:3000](http://localhost:3000)**. Depois de alterar o código Angular, execute `npm run build:web` novamente para atualizar os arquivos servidos. As alterações na landing page Next.js são acompanhadas pelo servidor de desenvolvimento.

### Comandos úteis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor Next.js de desenvolvimento. |
| `npm run build:web` | Compila o núcleo financeiro e a interface Angular. |
| `npm run build` | Gera o build completo: Angular e Next.js. |
| `npm start` | Executa o servidor após o build de produção. |
| `npm test` | Executa a suíte de testes da raiz, com compilação prévia do núcleo financeiro. |
| `npm run typecheck` | Verifica os tipos do projeto Next.js. |

## Organização do repositório

| Caminho | Conteúdo |
| --- | --- |
| [`app`](../app) | Páginas públicas, rotas de API e callbacks de autenticação. |
| [`components`](../components) | Componentes da landing page e suas interações. |
| [`lib`](../lib) | Autenticação, persistência, validação, dados de mercado e conteúdo público. |
| [`wealthos-source/apps/web/src`](../wealthos-source/apps/web/src) | Interface Angular, componentes, estilos e traduções. |
| [`wealthos-source/packages/finance`](../wealthos-source/packages/finance) | Regras e cálculos financeiros compartilhados. |
| [`supabase/migrations`](../supabase/migrations) | Esquema do banco, políticas RLS e controle de concorrência. |
| [`public`](../public) | Ícones, manifests PWA e arquivos compilados da interface. |
| [`test`](../test) | Testes de autenticação, validação, cálculos, persistência e integrações. |
| [`docs`](../docs) | Guias técnicos, revisões e registros de verificação. |

## Dados e segurança

- Dados financeiros vinculados ao usuário autenticado, com políticas RLS no PostgreSQL.
- Cookies de autenticação `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Validação no servidor e controle de versão para rejeitar gravações de abas desatualizadas.
- A aplicação usa a chave publicável e a sessão do usuário; não exige uma chave administrativa `service_role`.
- Registros financeiros são persistidos no servidor. O navegador pode guardar preferências de interface, como idioma.

Os testes locais de RLS usam PostgreSQL em WebAssembly/PGlite e não substituem a validação do banco remoto. Credenciais e arquivos `.env.local` não devem ser publicados no repositório.

