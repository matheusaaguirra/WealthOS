# Autenticação e carteira do WealthOS hospedado

Esta aplicação usa autenticação própria de usuários sobre PostgreSQL. A hospedagem Vercel pode ser acessada sem a conta ChatGPT; a carteira continua exigindo sessão própria.

## Endpoints

| Endpoint | Método | Corpo | Resposta |
| --- | --- | --- | --- |
| `/api/auth/config` | GET | — | `{googleClientId, brapiConfigured, emailPasswordEnabled}` |
| `/api/auth/me` | GET | — | `{user: {id,name,email,provider} \| null}` |
| `/api/auth/register` | POST | `{name,email,password}` | `{user}` e cookie de sessão |
| `/api/auth/login` | POST | `{email,password}` | `{user}` e cookie de sessão |
| `/api/auth/google` | POST | `{credential}` | `{user}` e cookie de sessão |
| `/api/auth/logout` | POST | `{}` | `{user:null}` e cookie removido |
| `/api/portfolio` | GET | — | `{holdings:[]}` do usuário autenticado |
| `/api/portfolio` | PUT | `{holdings:[]}` | `{holdings:[]}` persistido para o usuário autenticado |

Todas as mutações exigem `Content-Type: application/json` e `Origin` exatamente igual à origem da URL de destino. O navegador envia `Origin` automaticamente. Clientes HTTP de teste precisam enviá-lo explicitamente. Corpos têm limite real de 16 KiB, mesmo sem `Content-Length`. Campos extras são rejeitados. Respostas de autenticação e carteira usam `Cache-Control: no-store`. Erros usam `{error:string}` e códigos 400/401/403/409/413/415/429/503, sem expor SQL, credenciais ou detalhes internos.

## E-mail e senha

Nome: 2 a 100 caracteres após remover espaços externos, sem caracteres de controle. E-mail é normalizado para minúsculas. Senha exige pelo menos 12 caracteres Unicode e no máximo 72 bytes UTF-8, preservando os espaços e o conteúdo digitado. O banco armazena somente hash bcrypt com custo 12. Não há senha padrão, senha de demonstração ou fallback de autenticação.

## Sessão

O cookie `wealthos_session` contém 256 bits aleatórios codificados em Base64URL. Somente SHA-256 do token é persistido no banco, vinculado a um usuário. A sessão dura sete dias. O cookie usa `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` quando o acesso é HTTPS; HTTP local permanece testável. Login gira a sessão e remove a sessão anterior apresentada pelo cliente. Logout remove a sessão no banco e limpa o cookie. Sessão inválida ou expirada retorna usuário nulo no endpoint `/me` e bloqueia carteira com 401.

Os identificadores de usuário vêm exclusivamente da sessão. Não são aceitos em cadastro de posições ou parâmetros de carteira. O banco também vincula sessões e posições aos usuários por chave estrangeira.

## Login Google

Configure a variável de ambiente `GOOGLE_CLIENT_ID` com o Client ID de um cliente OAuth de aplicação web. No Google Cloud, configure como origem JavaScript autorizada a origem HTTPS exata do Site e, somente para desenvolvimento, a origem local que estiver em uso. A interface deve carregar Google Identity Services e enviar o campo `credential` recebido ao endpoint Google. Nenhum client secret é necessário para validar este ID token.

O backend valida assinatura RS256 com as chaves públicas remotas do Google, emissor `accounts.google.com` ou `https://accounts.google.com`, audiência igual ao Client ID configurado e validade temporal. Os campos `exp`, `iat`, `sub` e `email` são obrigatórios; o token deve ter sido emitido há no máximo uma hora, com tolerância de relógio de cinco segundos. Exige `email_verified === true`. A identidade é vinculada pelo `sub` verificado do Google. O endpoint não aceita e-mail ou nome enviado separadamente pelo navegador como prova de identidade.

Sem `GOOGLE_CLIENT_ID`, a configuração informa `googleClientId:null` e a tentativa de login retorna 503, explicando que deve ser usado e-mail/senha. Não existe autenticação Google simulada. Uma conta Google não é vinculada automaticamente a uma conta de senha com o mesmo e-mail; o usuário deve entrar pelo método original. Vinculação explícita de provedores é uma entrega futura.

Os testes injetam um verificador de identidade para exercitar a persistência e o conflito de contas; isso não constitui evidência de login contra o Google real. Uma credencial e um Client ID reais são necessários para validar esse caminho externamente.

## Rate limit e dados

O limite é persistido no PostgreSQL e usa incremento atômico por IP, operação e janela, com SHA-256 da chave. Não persiste IP em texto aberto. O IP vem de `x-vercel-forwarded-for` definido pela infraestrutura; em execução local, clientes sem esse cabeçalho compartilham a chave local. Não configurar um proxy que repasse um cabeçalho controlável pelo visitante.

- Cadastro: 5 tentativas/minuto por IP.
- Login e Google: 10 tentativas/minuto por IP e operação.
- Logout e gravação de carteira: 30/minuto por IP e operação.
- Leitura da carteira: 120/minuto por IP.

As janelas são fixas; o cliente recebe 429 com `Retry-After: 60` ao exceder. Limpeza limitada remove linhas expiradas durante requisições. As sessões expiradas são limpas em pequenos lotes quando uma nova sessão é criada.

## Carteira

Cada posição contém `id` UUID, `ticker` brasileiro com quatro letras, um ou dois dígitos e sufixo `F` opcional, `quantity` inteira de 1 a 1 milhão e `averagePriceCents` nulo ou inteiro de 1 a 1 bilhão. Os tickers são normalizados para maiúsculas. IDs e tickers repetidos são rejeitados. Cada usuário pode persistir até 100 posições.

A chave primária é `(user_id,ticker)` e o ID da posição é exclusivo dentro do mesmo usuário. O PUT substitui a carteira em um lote transacional PostgreSQL: a exclusão e todas as inserções têm sucesso em conjunto ou são revertidas. Um array vazio apaga somente as posições do usuário autenticado. Duas gravações simultâneas seguem a semântica de substituição pela última gravação; controle de versão para detectar edições concorrentes é uma evolução futura. Criptoativos não têm quantidade ou preço médio persistidos nesta versão.

## Migrações, verificação e limites

As tabelas `users`, `sessions`, `auth_rate_limits` e `holdings` são criadas por `npm run db:migrate`, com `DATABASE_URL` configurada. A migração PostgreSQL versionada está em `db/postgres/`. As rotas nunca criam ou recriam tabelas durante requisições. Sem conexão ou tabelas, a API retorna indisponibilidade.

Os testes de `test/auth-core.test.ts` usam a migração SQL real em SQLite e um adaptador da interface D1, cobrindo senha/hash/sessão, CSRF, limites, expiração, logout, rate limit persistente, identidade Google injetada, isolamento da carteira e validação. A verificação HTTP e o ambiente D1 real são etapas separadas.

Pendências para operação comercial: verificação e recuperação de e-mail, redefinição de senha, gerenciamento de sessões/dispositivos, vínculo explícito de provedores, exclusão/exportação de conta, auditoria e processo operacional de backup/recuperação. Não há transações bancárias, pagamento ou cobrança real nestas rotas.

A migração para Vercel adicionou testes sobre PostgreSQL em WebAssembly (PGlite), incluindo rollback e isolamento. Isso valida SQL e fluxos da aplicação; a conexão de rede com o banco de produção deve ser validada após configurar DATABASE_URL. Os dados do D1 anterior não foram exportados nem importados.
