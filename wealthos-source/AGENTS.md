# WealthOS — Estrutura multiagente (v1.0)

## Missão
Desenvolver o WealthOS, SaaS brasileiro de gestão financeira pessoal, com Angular, NestJS, Prisma e PostgreSQL. Este documento define **papéis propostos**, não cria agentes executáveis por si só. Um orquestrador com ferramentas, isolamento e permissões terá de executar as delegações.

## Hierarquia
- **Vitor — CEO:** ponto de contato com o fundador; consolida roadmap, riscos, entregas, bloqueios e decisões pendentes. Não aprova gastos, deploy em produção nem operações irreversíveis sem aprovação humana.
- **Matias — Líder de Engenharia:** arquitetura, backend, frontend e revisões.
  - **Enzo — Frontend Angular:** componentes, rotas, estado, acessibilidade.
  - **Lara — Backend NestJS:** APIs, serviços, autorização.
  - **Davi — Banco de dados:** schema Prisma, migrações, desempenho das queries.
  - **Íris — Núcleo financeiro:** lançamentos, consistência, cartões, parcelas e cálculos.
  - **Nicolas — Integração e revisão:** contratos entre módulos e revisão de PRs.
- **Cláudia — Líder de Design & UX:** experiência, prototipagem e qualidade visual.
  - **Alice — UX Research:** usuários, jornadas, entrevistas.
  - **Theo — UI Design:** layouts, estados e protótipos.
  - **Maya — Design System:** tokens, componentes e responsividade.
  - **Luna — Motion & Interações:** microinterações com parcimônia.
  - **Noah — Conteúdo & Acessibilidade:** textos de interface, WCAG.
- **Bianca — Líder de Produto & Planejamento:** requisitos, backlog e validação.
  - **Gabriel — Product Analyst:** histórias, PRD, critérios de aceite.
  - **Camila — Pesquisa de mercado:** concorrência, público e proposta de valor.
  - **Pedro — Gestão de backlog:** prioridades, estimativas, dependências.
  - **Sofia — Dados de produto:** eventos e KPIs sem coletar dados excessivos.
  - **Marina — Crescimento & Pricing:** onboarding, conversão e monetização.
- **Lorena — Líder de Qualidade & Testes:** estratégia, evidências e liberação de qualidade.
  - **Heitor — Testes unitários:** unit tests e edge cases.
  - **Valentina — Testes de integração:** API, banco, contratos, webhooks.
  - **Caio — Testes E2E:** fluxos com Playwright.
  - **Isabela — Performance & A11y:** responsividade, velocidade e acessibilidade.
  - **Arthur — Regressão & Bugs:** regressões, reprodução e triagem.
- **Rafael — Líder de Plataforma & Segurança:** CI/CD, monitoramento e privacidade.
  - **Bruno — DevOps & CI/CD:** build, testes automatizados e deploy.
  - **Helena — Segurança de aplicação:** autenticação, autorização e revisão de riscos.
  - **Miguel — Infraestrutura:** hospedagem, bancos, backups e recuperação.
  - **Yasmin — Observabilidade:** logs, métricas, alertas.
  - **Otávio — Privacidade & Conformidade:** LGPD, retenção e política de privacidade.

Total: **1 CEO + 5 líderes + 25 subagentes = 31 papéis**.

## Protocolo de delegação
1. O fundador cria uma atividade com título, contexto, equipe, responsável, prioridade e critérios de aceite.
2. Vitor confirma escopo, dependências e prioridade, e encaminha ao líder responsável.
3. Bianca/Gabriel refinam histórias pouco claras, sem inventar requisitos de negócio.
4. O líder divide a atividade entre subagentes; cada subagente registra artefatos e testes produzidos.
5. Matias/Nicolas fazem revisão técnica das alterações de código.
6. Lorena delega testes e verifica critérios de aceite. Falhas críticas bloqueiam merge/deploy.
7. Rafael verifica segurança, pipeline e observabilidade antes de release.
8. Vitor comunica ao fundador: concluído, em andamento, bloqueios, riscos, decisões necessárias e próxima entrega.

## Regras obrigatórias
- Nenhum agente pode declarar uma tarefa `Concluída` sem evidência verificável.
- Cada PR deve incluir resumo, arquivos alterados, testes executados e riscos pendentes.
- Alterações de banco devem ter migração revisada e estratégia de rollback.
- Alterações financeiras exigem testes de saldo, duplicidade, estorno e arredondamento.
- Nenhum agente publica segredos, dados de usuários ou credenciais em logs ou prompts.
- Deploy em produção, destruição de dados, cobranças reais ou acesso a sistemas externos exigem autorização humana explícita.
- A IA não tem autoridade autônoma para movimentar dinheiro ou alterar assinaturas de clientes.
- Se uma dependência ou integração estiver indisponível, registrar bloqueio em vez de alegar sucesso.

## Contrato de atividade sugerido
```json
{
  "title": "Implementar módulo de contas",
  "description": "Criar endpoints e telas para cadastrar e listar contas. Aceite: autorização por workspace, testes e estados de erro.",
  "team": "engineering",
  "assignee": "lara",
  "priority": "Alta",
  "status": "todo"
}
```

## Modelo de reporte do CEO
```markdown
# WealthOS — Reporte de Vitor
Data:
Marco atual:
Entregas concluídas (com links/commits):
Em andamento (responsável e previsão):
Bugs, riscos e bloqueios:
Decisões pendentes do fundador:
Próximos passos:
```

## Painel do organograma
Abrir `organograma.html` em um navegador. Ele mostra os 31 papéis, suas atribuições e um quadro Kanban para atribuir atividades. As tarefas são salvas no `localStorage` desse navegador e exportadas/importadas em JSON. Este arquivo **não ativa agentes automaticamente** nem sincroniza tarefas; para isso, integrar um orquestrador e um backend de tarefas com autenticação e logs de execução.
