# Google OAuth — WealthOS

Estado verificado em 23/10/2026: `/api/auth/config` em produção retorna `googleEnabled: false`. Na última inspeção autenticada do Supabase, o provedor estava desativado e os campos Client IDs e Client Secret estavam vazios. A tentativa atual de acessar `https://console.cloud.google.com/auth/clients` retornou “Site Unavailable” no navegador disponibilizado ao agente, inclusive após uma recarga. Isso é uma limitação desse acesso; não comprova indisponibilidade geral do Google.

## Configuração que falta

No Google Auth Platform, obtenha um cliente OAuth do tipo **Web application** para o projeto WealthOS. Configure:

| Campo | Valor |
| --- | --- |
| Authorized JavaScript origins | `https://wealthos-two-pi.vercel.app` |
| Authorized redirect URIs | `https://bfqudsuwzqqygysauyqm.supabase.co/auth/v1/callback` |
| Dados básicos | `openid`, e-mail e perfil |

Em Supabase → Authentication → Sign In / Providers → Google, preencha **Client IDs** e **Client Secret (for OAuth)**, habilite **Enable Sign in with Google** e salve. O segredo deve ser preenchido diretamente no painel, sem colocá-lo em chat, GitHub ou código público. A seção **OAuth Server** é uma funcionalidade diferente, desnecessária para este fluxo.

O Site URL do Supabase é `https://wealthos-two-pi.vercel.app`. O retorno à aplicação permitido é `https://wealthos-two-pi.vercel.app/auth/callback` (e `/auth/confirm` para o fluxo de confirmação quando usado).

## Critério de conclusão

Após configurar o provedor, confirmar `googleEnabled: true`, iniciar pelo botão do WealthOS, concluir a escolha/consentimento Google e verificar retorno autenticado ao dashboard. Recarregar deve manter a sessão e o logout deve encerrar o acesso. O estado “habilitado” sozinho não comprova esse percurso. Se o app Google estiver em modo de teste, a conta utilizada precisa estar na audiência autorizada.

Referência: [documentação oficial Supabase — Sign in with Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).
