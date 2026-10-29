# WealthOS Growth AI

MVP de agente Growth de planejamento e análise, independente do produto. **Não publica conteúdo nem faz prospecção automaticamente.**

## Execução 100% na nuvem
1. Abrir o repositório GitHub > Settings > Secrets and variables > Actions.
2. Configurar o secret `OPENAI_API_KEY` (não adicionar chaves a arquivos).
3. Abrir Actions > **Growth AI — Relatório sob demanda** > Run workflow.
4. Escolher o tema (SEO, content, acquisition, CRO ou general).
5. Baixar o artefato `growth-report` gerado pela execução.

A workflow só é executada manualmente; gera um arquivo Markdown com ideias e decisões pendentes. Usa API de IA externa, que pode ter custo por uso. Sem chave, registra erro e não produz relatório.

## Instalação opcional de skills
Num ambiente com Node.js e um executor compatível:
```bash
npx skills add coreyhaines31/marketingskills --list
```
A instalação é opcional para este MVP. O comando **não** precisa ser executado no computador pessoal e não é executado automaticamente pelo workflow.

## Próximas integrações (não ativadas)
- Google Search Console: consultas e indexação.
- Analytics próprio ou GA4: funil agregado visita > cadastro > ativação.
- Ferramenta de agendamento de posts: publicação somente após aprovação.
- Painel protegido de experimentos e relatórios.

## Segurança
Não adicionar dados de usuários, leads identificáveis, extratos financeiros ou segredos ao brief. O relatório é apenas planejamento, não evidência de desempenho real.
