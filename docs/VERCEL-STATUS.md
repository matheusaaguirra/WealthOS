# WealthOS — login e Supabase

## Implementado

Tela de login como entrada da aplicação, bloqueio do painel sem sessão, cadastro/e-mail/senha via Supabase e fluxo Google OAuth/PKCE. Novos usuários começam sem dados de exemplo. Contas, lançamentos, orçamentos, metas e carteira usam persistência por usuário com RLS. Não se importam os antigos dados de demonstração do navegador.

## Validação local

59 testes aprovados, incluindo testes da migração e das políticas RLS em PostgreSQL/PGlite. Build Angular/Next.js aprovado. A validação do banco remoto e do login Google depende da configuração externa.

## Configuração necessária

Conectar um projeto Supabase do WealthOS, aplicar `supabase/migrations/202610220001_wealthos.sql`, configurar SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e APP_URL na Vercel e habilitar Google no Supabase com as credenciais OAuth apropriadas. Nenhuma assinatura paga nem banco remoto foi criado sem conexão/autorização do serviço.
