# WealthOS — Roadmap por evidência

As etapas abaixo são propostas, não entregas comprovadas nem estimativas contratadas. O relatório de Vitor registra o estado observado nesta sessão. Não há prazo fixado antes de validar dependências e capacidade.

| Etapa | Prioridade e resultado | Responsáveis propostos | Critério para avançar |
| --- | --- | --- | --- |
| 0. Base local | P0 · Núcleo financeiro, estrutura, API inicial e interface de demonstração | Matias, Cláudia, Lorena e Rafael | Build e testes pertinentes executados; limitações identificadas |
| 1. Uso integrado | P0 · Cadastro/login, contas e lançamentos no PostgreSQL pela interface | Matias/Nicolas, Lara, Davi e Valentina | Fluxo completo e isolamento entre workspaces comprovados; migração aplicada em banco de teste |
| 2. Piloto seguro | P0 · Recuperação de acesso, política de dados, backup/restore e observabilidade | Rafael, Helena, Miguel, Yasmin e Otávio | Sem falha crítica; recuperação exercitada; aprovação humana de publicação |
| 3. Planejamento persistente | P1 · Orçamentos, metas, cartões e parcelas | Bianca, Íris, Lara e Cláudia | Critérios financeiros e fluxos de fatura definidos e testados |
| 4. Validação comercial | P1 · Onboarding, feedback de usuários e preço | Camila, Alice e Marina | Evidências de problema e uso; proposta de preço aprovada pelo fundador |
| 5. Monetização | P2 · Assinatura e administração do cliente | Rafael, Matias e Marina | Provedor autorizado; webhooks e cancelamento testados; cobrança real explicitamente autorizada |
| 6. Integrações | P2 · Importação, conciliação e eventual Open Finance | Matias, Rafael e Bianca | Escopo, permissões, custos e tratamento de dados aprovados |

## Ordem de dependência

A demonstração serve à avaliação de UX. A integração real depende do contrato financeiro, autenticação e migrações. O piloto depende da integração comprovada e da operação segura. Cobrança depende de validação comercial e ciclo de assinatura; acesso bancário não é dependência necessária para validar o primeiro produto.

## Reporte ao fundador

Vitor consolida: marco atual; entregas com caminhos/commits e testes; atividades em andamento com responsável; bugs e riscos; decisões que realmente exigem o fundador; próxima entrega verificável. Não apresentar os 31 papéis como 31 execuções simultâneas. O quadro local permite atribuição de atividade, mas não executa a atividade.

## Uso do backlog

`backlog.json` é um ponto de partida de planejamento com dependências e critérios de aceite. Todas as tarefas começam em `todo`; atualizações de status exigem confrontar a entrega real. `agents.json` registra os 31 papéis propostos. `organograma.html` incorpora esses dados para funcionar offline e permite exportar/importar atividades. A exportação do quadro é uma cópia local; não sincroniza o JSON original nem um serviço de tarefas.
