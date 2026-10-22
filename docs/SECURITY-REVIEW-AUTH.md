> Registro histórico da versão Sites/D1. Para a versão Vercel/PostgreSQL, consulte README.md e AUTH.md. Não constitui validação da hospedagem Vercel.

# WealthOS — revisão limitada de autenticação e carteira

Data: 22/10/2026. Responsável: Rafael, plataforma e segurança.

Escopo: leitura de `lib/auth-core.ts`, `lib/auth-runtime.ts`, rotas `/api/auth/*` e `/api/portfolio`, schema/migração D1 e rotas/helpers de mercado. Esta revisão não equivale a auditoria completa, pentest ou aprovação de lançamento público. Não alterei implementação, configuração, audiência ou publicação.

## Resultado

Não identifiquei um caminho concreto de acesso à carteira de outro usuário, injeção SQL ou falsificação de sessão no escopo inspecionado. Isto não prova ausência de vulnerabilidades. O coordenador informou que a hospedagem permanece privada ao proprietário; a revisão não revalidou o controle de acesso do gateway. A autenticação própria da aplicação permanece adicional à autenticação da plataforma.

## Controles conferidos

| Área | Evidência observada |
| --- | --- |
| Sessão | Token aleatório de 256 bits; apenas SHA-256 persistido; expiração no servidor em sete dias; rotação invalida o cookie anterior; logout remove a sessão. |
| Cookie | `HttpOnly`, `SameSite=Lax`, `Path=/`, duração limitada; `Secure` quando a URL da requisição é HTTPS. Confirmar o esquema percebido no deploy. |
| CSRF e entrada | Todas as mutações exigem `Origin` idêntico à origem da URL e `application/json`; ausência de Origin é rejeitada. Corpo limitado a 16 KiB durante leitura, inclusive sem Content-Length. Campos desconhecidos são rejeitados. |
| Senhas | bcrypt custo 12; mínimo de 12 caracteres no cadastro e máximo de 72 bytes UTF-8; login inválido usa resposta genérica e custo de hash no caso de usuário inexistente. |
| Isolamento | `user_id` vem exclusivamente da sessão; SELECT/DELETE de posições filtram esse usuário; payload não aceita `userId`. SQL usa parâmetros vinculados. |
| Banco | PK por usuário/ticker, unicidade de posição por usuário, FKs e checks financeiros. Substituição da carteira usa `DB.batch`; teste reproduz falha intermediária e rollback. |
| Limites | Rate limit persistido em D1, compartilhado entre instâncias; janelas e limites separados por operação. Chaves contêm hashes de IP/janela/operação, não IP literal. São dados pseudonimizados, sem afirmação de anonimização irreversível. |
| Google | JWKS remoto de domínio fixo; RS256, issuer e audience fixos; `email_verified === true`; usuário identificado pelo `sub`; não vincula automaticamente uma conta com mesmo e-mail. Ausência de client ID retorna 503 e não simula autenticação. |
| Mercado | URLs dos provedores fixas; ticker/período validados; token BRAPI apenas no header da chamada servidor-servidor. Cache não recebe conteúdo de carteira nem cookie de usuário. Falhas não são substituídas por cotações inventadas. |

## Achado corrigido durante a revisão

A verificação inicial do Google validava `exp` apenas se o claim estivesse presente. `jose` não exige automaticamente sua presença. Enviei o achado à engenharia, que adicionou `requiredClaims: ['exp','iat','sub','email']` e `maxTokenAge: '1h'` em `googleVerificationOptions`, usada pelo caminho de produção.

O novo teste assina JWTs com uma chave RSA local e confere rejeição de claims ausentes, audiência incorreta e emissão antiga. Isso verifica o contrato criptográfico local; não comprova login Google real, consentimento, client ID, domínio autorizado ou acesso ao JWKS em produção.

Referências consultadas: [verificação de ID token do Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) e [opções de validação do jose](https://github.com/panva/jose/blob/main/docs/jwt/verify/interfaces/JWTVerifyOptions.md).

## Evidência de testes

Executei `node --import tsx --test test/auth-core.test.ts test/market.test.ts` com dados fictícios. O adaptador de teste usa SQLite real, aplica a migração SQL Drizzle e implementa o batch como transação. Não usa o serviço D1 remoto.

A primeira execução passou 27/27 testes. Após a correção de claims, a suíte foi repetida: **28/28 passaram, zero falhas, duração 8,63 segundos**. Os casos cobrem origem/corpo, hashing, sessão expirada/revogada, rate limit entre instâncias, isolamento, rollback e mercado/cache. Não foram executados por esta revisão testes de navegador, tráfego hospedado, carga ou Google real.

## Limites e próximos controles

- Verificar cadastro, login, cookie `Secure`, carteira e logout no Worker hospedado. bcrypt 12 levou aproximadamente meio segundo por hash no ambiente de teste; CPU e latência reais dependem do limite efetivo do Worker. Não reduzir o custo sem decisão técnica baseada em medição.
- O login Google continua bloqueado sem `GOOGLE_CLIENT_ID`. Configuração real e fluxo completo permanecem pendentes. Nonce vinculado à tentativa de login é uma melhoria adicional contra replay de credencial.
- Cadastro por senha não verifica posse do e-mail. Antes de uso público, definir confirmação de e-mail, recuperação de conta e política de revogação de todas as sessões. O conflito de cadastro revela existência de conta; a resposta é deliberadamente distinta de login e requer decisão de produto para um serviço público.
- Requisições de mercado não exigem sessão própria da aplicação e dependem do acesso privado da hospedagem. Reavaliar autenticação, rate limit e proteção da cota BRAPI antes de mudar a audiência.
- Cache e fila BRAPI locais não garantem um limite global de requisições entre todos os Workers/regiões. São redução de chamadas, não garantia contratual de cota.
- PUT da carteira substitui o conjunto completo e usa semântica de última gravação. Controle de versão/ETag é necessário se edição concorrente em múltiplas abas/dispositivos precisar preservar alterações.
- Não revisei a nova interface Angular, scripts externos ou política CSP, ainda em integração por outra equipe. Também não validei backup/restauração remoto, observabilidade, recuperação de incidentes ou requisitos jurídicos de privacidade.
