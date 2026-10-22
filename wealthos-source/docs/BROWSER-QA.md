# Verificação no navegador — 22/10/2026

Execução manual assistida no Chrome remoto, prévia HTTP local gerenciada. Dados exclusivamente fictícios.

Verificações realizadas:

- Organograma renderizou CEO, cinco líderes, 25 subagentes, 31 responsáveis selecionáveis e 14 tarefas planejadas.
- Dashboard Angular exibiu resumo de receitas/despesas/saldo, gráfico, categorias, contas e metas, com identificação do modo demonstração.
- Navegação por dashboard, contas, lançamentos, metas e orçamentos.
- Cadastro de `Conta teste QA` com saldo inicial zero: sucesso e saldo R$ 0,00.
- Cadastro de despesa de R$ 1,01 nessa conta: registro confirmado com valor exato.
- Busca encontrou o registro; estorno alterou estado para Estornado e desabilitou novo estorno.
- Recarregamento da página preservou a conta criada no armazenamento do navegador.
- Cadastro de `Meta QA`, objetivo R$ 100,00 e valor guardado zero: sucesso; contador de metas aumentou de três para quatro.
- Tela de orçamentos exibiu gastos, limites e valores disponíveis a partir dos lançamentos ativos.

Falha encontrada e corrigida: `crypto.randomUUID` não disponível no contexto HTTP da prévia. Gerador usa alternativa criptográfica `getRandomValues` com UUIDv4. Após rebuild, app carregou e os fluxos acima funcionaram. Revisão técnica também corrigiu saldo/progresso zero, chave estável de idempotência por formulário, validação da origem da API, faixa de meses e agrupamento de despesas.

Limites: não houve teste E2E automatizado versionado, teste móvel em viewport reduzido, auditoria completa de WCAG, upload/download JSON pelo navegador ou fluxo de autenticação conectado a PostgreSQL real. Essa evidência não comprova esses itens. Os dados QA existem somente no navegador da execução; não fazem parte dos dados iniciais do código.
