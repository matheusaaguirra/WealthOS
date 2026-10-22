# Segurança e privacidade — primeira entrega

Esta é uma base de desenvolvimento local. Não há aprovação para produção, cobrança, Open Finance ou movimentação de dinheiro. A configuração de CI é uma proposta executável; sua presença no repositório não comprova uma execução remota.

## Limites de confiança

- O backend deve validar o JWT e derivar o workspace da identidade autenticada. IDs ou filtros enviados pelo cliente nunca concedem acesso a outro workspace.
- Saldos e lançamentos são calculados no servidor com centavos inteiros; valores do navegador não são uma fonte de autorização.
- A demonstração do navegador usa dados fictícios. localStorage não é cofre e não deve receber dados bancários reais, credenciais ou tokens persistentes.
- Contas e lançamentos da API ficam no PostgreSQL. O banco local é publicado somente em `127.0.0.1` pelo Compose.
- Idempotência deve ser garantida por restrição única no banco, além da validação de payload. Estorno deve ser atômico e repetível sem duplicar seu efeito.

## Configuração local

Copie `.env.example` para `.env`, substitua a senha e gere um segredo JWT aleatório de pelo menos 32 caracteres. O placeholder não é um segredo válido. Configure `DATABASE_URL` com a mesma senha do PostgreSQL e escape caracteres especiais no componente de senha da URL. Não compartilhe `.env` nem registre seu conteúdo em logs.

As credenciais presentes no workflow são públicas e descartáveis, exclusivas do banco efêmero de teste. Não reutilize esses valores fora do CI. O `.gitignore` exclui arquivos de ambiente privados e mantém somente o exemplo.

O limitador de autenticação em memória, quando ativado na API, protege somente um processo: reiniciar o processo limpa a janela e múltiplas instâncias não compartilham o contador. Antes de escalar, adote limitação distribuída e revise a identificação de IP atrás de proxy.

CORS deve permitir apenas a origem configurada. Em desenvolvimento, mantenha API e banco em interfaces locais. Em produção, HTTPS, gestão externa de segredos e configuração de proxy confiável precisam ser revisados.

## Bloqueios de lançamento em produção

Antes de aprovar uma release pública:

1. Executar integração com PostgreSQL real e testes de autorização entre usuários, concorrência de criação/estorno e login inválido.
2. Revisar limites e proteção contra tentativas de senha, cadastro automatizado e consumo excessivo de recursos. Paginar histórico e evitar carregar todos os lançamentos em memória antes de ampliar a base.
3. Definir recuperação de conta, verificação de e-mail, revogação/rotação de sessão e política de expiração.
4. Definir consentimento, base legal, retenção, exportação, exclusão de conta e política de privacidade conforme o tratamento efetivo de dados. O documento não afirma conformidade LGPD pronta.
5. Configurar backups protegidos e comprovar restauração; definir observabilidade com redaction de e-mail, tokens, senhas e conteúdo financeiro.
6. Revisar dependências, configuração HTTP, acessibilidade e plano de resposta a incidentes. Não há relatório de pentest ou auditoria de segurança nesta entrega.

## Reportar vulnerabilidades

Descreva o cenário, impacto e passos de reprodução com dados fictícios ao responsável pelo projeto. Não publique credenciais ou dados pessoais em issues, capturas ou prompts.
