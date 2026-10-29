# WealthOS Growth — modo gratuito (sem API)

Este MVP produz checklists e propostas de experimentos de crescimento B2C para o WealthOS, **sem chamar APIs de modelos de IA e sem cobrança por tokens**.

## Executar na nuvem
1. Revisar e integrar o PR da branch `feature/growth-agent`.
2. Abrir **Actions** no repositório GitHub.
3. Escolher **Growth AI — Relatório sob demanda** e clicar em **Run workflow**.
4. Selecionar general, seo, content, acquisition ou cro.
5. Baixar o artefato `growth-report` ao finalizar.

Nenhuma chave `OPENAI_API_KEY` é necessária. O processo é manual, não envia mensagens, não publica e não altera o site. O relatório não é produzido por um modelo de IA; ele usa regras e templates locais versionados.

## Skills de marketing
A documentação de papéis fica em `growth/AGENT.md`. O pacote https://github.com/coreyhaines31/marketingskills contém instruções para agentes compatíveis, mas **não é instalado nem executado neste MVP**. Para usar as skills com IA generativa, seria preciso configurar um executor compatível (local ou em nuvem), com custos e limites próprios.

## Custos
GitHub Actions normalmente oferece uso gratuito em repositórios públicos com runners padrão, sujeito às políticas e limites atuais da plataforma. Não há cobrança de API neste fluxo. Publicidade paga, serviços externos ou futuras integrações podem gerar custos se forem habilitados separadamente.

## Próximos passos
Conectar medições agregadas do Search Console e de analytics, com autorização e revisão de privacidade. Não incluir informações financeiras de usuários, leads identificáveis ou credenciais nos relatórios.
