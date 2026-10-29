<div align="center">
  <a href="https://wealthos.com.br">
    <img src="public/icons/app-192.png" alt="Logo do WealthOS" width="88" height="88" />
  </a>

  <h1>WealthOS</h1>
  <p><strong>Seu dinheiro. Suas escolhas.</strong></p>
  <p>Contas, lançamentos e investimentos em um só lugar.<br />Uma visão clara do que entra, do que sai e do que você está construindo.</p>

  <p>
    <img alt="Angular 20" src="https://img.shields.io/badge/Angular-20-172633?style=flat-square&amp;logo=angular&amp;logoColor=84b9e8" />
    <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-172633?style=flat-square&amp;logo=nextdotjs&amp;logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-172633?style=flat-square&amp;logo=typescript&amp;logoColor=84b9e8" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-172633?style=flat-square&amp;logo=supabase&amp;logoColor=84b9e8" />
    <img alt="Vercel" src="https://img.shields.io/badge/Vercel-172633?style=flat-square&amp;logo=vercel&amp;logoColor=white" />
  </p>

  <p><a href="https://wealthos.com.br"><strong>Conhecer o WealthOS</strong></a> · <a href="https://wealthos.com.br/login">Entrar na aplicação</a> · <a href="#rodando-localmente">Rodar localmente</a></p>
  <p><sub>Personal finance management · Português, English &amp; Español</sub></p>
</div>

---

## Sobre o projeto

O WealthOS é uma aplicação de gestão financeira pessoal para acompanhar a rotina e o patrimônio. Você pode organizar receitas e despesas por categoria, separar o dinheiro de uso diário das reservas e benefícios, planejar gastos fixos e acompanhar sua carteira de investimentos.

A interface foi pensada para celular e desktop, com temas claro e escuro. A aplicação também pode ser instalada como **PWA**, pela opção em **Minha conta**.

A página inicial apresenta o produto; o acesso ao painel e aos dados financeiros exige autenticação. Novos usuários começam com os próprios registros vazios. Os valores da demonstração na landing page são apenas ilustrativos.

## O que você pode fazer

| Área | Recursos |
| --- | --- |
| **Visão geral** | Saldo da carteira principal, entradas, saídas e gráficos por período. |
| **Lançamentos** | Receitas e despesas por conta e categoria, busca, filtros, estornos e relatórios em PDF. |
| **Gastos fixos** | Regras mensais com valor, vencimento e conta; programação dos gastos pendentes e pausa de recorrências. |
| **Minhas contas** | Carteira principal e saldos separados para reservas ou vale-refeição, com movimentações em cada conta. |
| **Metas e sonhos** | Objetivos financeiros e acompanhamento do progresso. |
| **Investimentos** | Carteira, ativos listados, renda fixa, gráfico individual, índices e criptomoedas. |
| **Minha conta** | Preferências, idioma, instalação do aplicativo e relatório financeiro completo em PDF. |

### Detalhes que fazem diferença

- **Saldos separados:** uma conta pode ficar fora do saldo da carteira principal e continuar disponível para registrar gastos.
- **Valores com centavos:** na entrada monetária em português, digitar `232323` exibe `2.323,23`. Os cálculos financeiros trabalham com valores inteiros em centavos.
- **Gastos recorrentes sem duplicidade:** cada regra gera no máximo um lançamento por mês. O registro no saldo acontece ao confirmar **Lançar gastos deste mês**; pausar uma regra preserva o histórico.
- **Extratos PDF com revisão:** leitura local no navegador, com prévia para conferir conta, descrição e categoria antes de salvar.
- **Relatórios para consultar:** PDF dos lançamentos do mês com os filtros aplicados, ou PDF de todo o histórico em **Minha conta**.
- **Três idiomas:** português, inglês e espanhol, com detecção do idioma do navegador e escolha manual. A moeda permanece **real brasileiro — BRL**.

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

O esquema está em [`supabase/migrations`](supabase/migrations). Em um projeto novo, aplique a migração antes de testar persistência. Não reaplique a migração inicial em um banco já configurado. O comando `db:migrate:legacy` pertence ao backend antigo.

Configure as URLs de retorno do Auth para o ambiente utilizado. O login Google exige um cliente OAuth válido no Google Cloud e o provedor habilitado no Supabase; o segredo OAuth permanece na configuração do provedor. Consulte os guias de [autenticação](docs/AUTH.md) e [Google OAuth](docs/GOOGLE-OAUTH-SETUP.md).

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
| [`app`](app) | Páginas públicas, rotas de API e callbacks de autenticação. |
| [`components`](components) | Componentes da landing page e suas interações. |
| [`lib`](lib) | Autenticação, persistência, validação, dados de mercado e conteúdo público. |
| [`wealthos-source/apps/web/src`](wealthos-source/apps/web/src) | Interface Angular, componentes, estilos e traduções. |
| [`wealthos-source/packages/finance`](wealthos-source/packages/finance) | Regras e cálculos financeiros compartilhados. |
| [`supabase/migrations`](supabase/migrations) | Esquema do banco, políticas RLS e controle de concorrência. |
| [`public`](public) | Ícones, manifests PWA e arquivos compilados da interface. |
| [`test`](test) | Testes de autenticação, validação, cálculos, persistência e integrações. |
| [`docs`](docs) | Guias técnicos, revisões e registros de verificação. |

## Dados e segurança

- Dados financeiros vinculados ao usuário autenticado, com políticas RLS no PostgreSQL.
- Cookies de autenticação `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Validação no servidor e controle de versão para rejeitar gravações de abas desatualizadas.
- A aplicação usa a chave publicável e a sessão do usuário; não exige uma chave administrativa `service_role`.
- Registros financeiros são persistidos no servidor. O navegador pode guardar preferências de interface, como idioma.

Os testes locais de RLS usam PostgreSQL em WebAssembly/PGlite e não substituem a validação do banco remoto. Credenciais e arquivos `.env.local` não devem ser publicados no repositório.

## Escopo e limitações

- **Bancos e corretoras:** contas, movimentações e posições são cadastradas manualmente ou importadas de extratos compatíveis. Não há sincronização por Open Finance nem execução de compras e vendas.
- **Importação PDF:** arquivos com texto, até **10 MB e 20 páginas**. PDFs digitalizados precisam de OCR externo; linhas ambíguas podem ser ignoradas. Revise a prévia antes de confirmar.
- **Mercado:** cotações dependem da disponibilidade e das restrições dos provedores. Valores ou rentabilidades sem dados suficientes aparecem indisponíveis.
- **PWA:** a instalação depende do suporte do navegador e do sistema. É necessária conexão para acessar os registros financeiros; não há edição financeira offline.
- **Feedback:** o formulário atual prepara uma mensagem no aplicativo de e-mail do visitante. O envio direto pelo servidor está pendente da ativação da integração de e-mail.

## Guias e descoberta internacional

A central de conteúdo público reúne guias em **português, inglês, espanhol, francês, alemão e italiano**, com URLs próprias, páginas estáticas e links entre versões equivalentes. Os temas são controle mensal, separação de saldos e revisão de extratos PDF (este último, inicialmente em inglês).

- [Guias em português](https://wealthos.com.br/guias) · [English](https://wealthos.com.br/en/guides) · [Español](https://wealthos.com.br/es/guias)
- [Français](https://wealthos.com.br/fr/guides) · [Deutsch](https://wealthos.com.br/de/ratgeber) · [Italiano](https://wealthos.com.br/it/guide)

O simulador dos guias faz um cálculo local em BRL, USD ou EUR, sem enviar nem salvar os valores. Ele **não adiciona suporte multimoeda à aplicação**, que continua em BRL e em três idiomas. O Vercel Analytics também está integrado às páginas públicas; é necessário que Web Analytics esteja habilitado no projeto para receber os dados.

## Documentação complementar

- [Autenticação e sessões](docs/AUTH.md)
- [Configuração do Google OAuth](docs/GOOGLE-OAUTH-SETUP.md)
- [Fontes de dados de mercado](docs/MARKET-SOURCES.md)
- [Integração Google Finance](docs/GOOGLE-FINANCE.md)
- [Idiomas e traduções](wealthos-source/apps/web/src/i18n/README.md)

---

<div align="center">
  <strong>WealthOS</strong><br />
  <a href="https://wealthos.com.br">wealthos.com.br</a> · Desenvolvido por <a href="https://github.com/matheusaaguirra">Matheus Aguirra</a>
</div>
