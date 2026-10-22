# WealthOS — estado da versão para Vercel

## Implementado e verificado

- Interface Angular com temas claro e escuro, ações, gráficos, índices e criptomoedas.
- Rotas Next.js sobre Node.js 24 para autenticação, carteira e mercados.
- Adaptador PostgreSQL com consultas parametrizadas, transações e migração versionada.
- Configuração de build Vercel e workflow CI do GitHub.
- 48 testes aprovados; testes PostgreSQL executados em PGlite.
- Build completo Angular/TypeScript/Next.js aprovado.
- Smoke HTTP local validou interface 200, configuração 200, visitante sem sessão e carteira protegida 401.

## Configurações pendentes

- Publicação na Vercel e teste no domínio final.
- Provisionamento de PostgreSQL, configuração de DATABASE_URL e aplicação da migração.
- Exportação e importação dos usuários/carteiras da hospedagem anterior, se desejada. Nenhum registro foi transferido.
- GOOGLE_CLIENT_ID e origens autorizadas para ativar login Google.
- BRAPI_TOKEN opcional, sujeito aos limites do plano escolhido.

A ausência de banco desativa o cadastro por senha e não simula persistência. Nenhuma assinatura paga foi criada.
