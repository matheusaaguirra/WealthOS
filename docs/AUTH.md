# Autenticação e persistência atuais

A autenticação usa Supabase Auth com `@supabase/ssr`, no servidor. O navegador fala com a API da própria aplicação. Tokens são mantidos em cookies HttpOnly/Secure em produção; dados financeiros e carteira não são persistidos no localStorage. Somente a preferência de tema fica no navegador.

## Entrada

- `/` redireciona para `/login`.
- Visitantes veem uma tela de login sem o painel ao fundo e sem dados de exemplo.
- `/dashboard` e `/app/index.html` verificam o usuário no servidor e redirecionam visitantes para `/login`.
- Assets públicos não contêm dados de usuários.
- As APIs financeiras verificam `auth.getUser()` e não aceitam identidade de usuário no corpo.
- Após login, carregamento dos dados precisa completar antes de mostrar o painel. Erros não são confundidos com uma carteira vazia.

## E-mail e Google

Cadastro usa `signUp`; login usa `signInWithPassword`. Em 23/10/2026, a opção `Confirm email` foi verificada desativada no projeto de produção. A senha não é armazenada pela aplicação. Quando Supabase exige confirmação de e-mail, o cadastro mostra a orientação e não entra sem sessão.

Google inicia em `/auth/google`, com OAuth/PKCE. O callback fixo `/auth/callback` troca o código pela sessão. Não há parâmetro livre de redirecionamento. `APP_URL` define a origem de produção. `/auth/confirm` aceita confirmação de e-mail por token hash quando configurada no template Supabase.

A configuração pública informa se o Supabase foi configurado e se o provedor Google está habilitado. Nenhuma chave administrativa ou segredo OAuth é enviado ao navegador. Configure o Client Secret Google diretamente no Supabase.

## Dados

| Rota | Uso |
| --- | --- |
| `GET /api/finance` | Estado financeiro do usuário, ou arrays vazios para uma conta nova |
| `PUT /api/finance` | Valida e grava contas, lançamentos, orçamentos, metas e registros opcionais de renda fixa atomicamente, com revisão esperada |
| `GET /api/portfolio` | Posições da carteira do usuário |
| `PUT /api/portfolio` | Substitui as posições desse usuário em uma gravação atômica |

As mutações exigem Origin da própria aplicação e Content-Type JSON. O estado financeiro aceita no máximo 256 KiB; a carteira e o cadastro têm limite de 16 KiB. Campos desconhecidos, valores fracionários em centavos, IDs duplicados, chaves de idempotência repetidas e referências a contas inexistentes são rejeitados.

`wealthos_financial_state` e `wealthos_portfolios` usam RLS para SELECT/INSERT/UPDATE/DELETE. O ID do usuário vem da sessão Supabase e precisa coincidir com `auth.uid()`. Não se usa service role na aplicação.

A função de gravação financeira roda como SECURITY INVOKER. Duas abas com a mesma revisão não podem sobrescrever silenciosamente uma à outra: a segunda recebe conflito. Uma falha no servidor faz a interface restaurar o estado anterior e mostrar o erro, sem confirmar um salvamento inexistente.

## Verificação

`test/financial-state.test.ts` cobre estado vazio, saldo zero, centavos, estorno, duplicidade, referências e validação de solicitações. `test/supabase-rls.test.ts` aplica a migração em PGlite e cobre isolamento entre dois usuários, negação a visitantes, tentativa de troca de proprietário e conflitos de gravação.

Aplicação da migração no Supabase remoto, cadastro real, persistência entre dispositivos e OAuth Google precisam de validação após conectar o projeto e configurar suas variáveis. Os testes locais não comprovam essas etapas externas.
