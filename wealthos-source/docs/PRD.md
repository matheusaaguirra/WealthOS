# WealthOS — Especificação de produto inicial

Versão: 0.1 · 22/10/2026 · Responsável proposto: Bianca.

Este documento descreve o escopo e os critérios de aceite. Um item descrito aqui não está automaticamente implementado: a evidência de execução pertence ao relatório de entrega e aos testes. O backlog JSON inicia como planejamento, sem atribuir conclusões a agentes que não executaram tarefas.

## Problema e proposta

Pessoas que distribuem receitas e despesas entre contas precisam entender quanto possuem, para onde o dinheiro vai e quanto podem reservar. A hipótese do WealthOS é oferecer uma visão financeira integrada, em português e reais, com lançamentos confiáveis, metas e planejamento. O público inicial proposto é o usuário brasileiro que faz seu próprio controle financeiro; entrevistas, tamanho de mercado e disposição a pagar ainda precisam ser validados.

A identidade é “sistema financeiro completo”. A primeira versão deve demonstrar esse caminho sem antecipar integrações bancárias ou maturidade operacional inexistentes.

## Objetivo da primeira entrega

Criar uma base executável local com Angular, NestJS, Prisma e PostgreSQL; um núcleo financeiro verificável; e uma experiência visual que permita avaliar dashboard, lançamentos, contas, orçamentos e metas usando dados fictícios. A API inicial deve suportar autenticação, contas, lançamentos e resumo mensal com isolamento por workspace.

A interface de demonstração e a API constituem modos diferentes. Dados de demonstração não devem ser apresentados como dados reais, nem usados como fallback silencioso quando uma API estiver indisponível. Orçamentos e metas podem começar na demonstração local; persistência autenticada no servidor é uma próxima entrega.

## Escopo e limites

| Área | Contrato da primeira entrega | Próximas entregas |
| --- | --- | --- |
| Dashboard | Resumo mensal de receitas/despesas, saldo, lista recente e visualização coerente com os lançamentos | Tendências e comparativos históricos aprofundados |
| Contas | Cadastro e listagem com saldo inicial em centavos; saldo calculado | Arquivar conta, transferência interna atômica e conciliação |
| Lançamentos | Receita/despesa positiva, data, categoria, conta, chave de idempotência; estorno auditável | Recorrências, anexos, importação CSV e conciliação |
| Identidade | Cadastro/login com token e workspace inferido no servidor | Recuperação de senha, verificação de e-mail e sessões robustas |
| Orçamentos | Experiência local de demonstração | Persistência, ciclos e alertas por categoria |
| Metas | Experiência local de demonstração | Persistência e aportes vinculados a movimentos |
| Cartões e parcelas | Função de divisão exata de centavos no núcleo | Cadastro de cartão, fechamento, vencimento e faturas |
| Operação SaaS | Configuração local e orientações de operação | Piloto autorizado, backup exercitado, monitoramento, privacidade e cobrança |

Fora desta entrega: Open Finance, conexão a bancos, execução de pagamentos, recomendações de investimento, cobrança real, deploy de produção, agentes autônomos movimentando dinheiro e preço contratado. Nenhuma assinatura é ativada por este projeto.

## Jornadas e critérios de aceite

### 1. Explorar a demonstração

Como pessoa avaliando o produto, quero entender meu panorama financeiro sem configurar um servidor.

- O modo demonstração e a natureza fictícia dos dados ficam visíveis.
- A navegação oferece dashboard, lançamentos, contas, orçamentos e metas.
- Um lançamento criado atualiza as visualizações que dependem dele.
- Atualizar o navegador preserva os dados locais quando o armazenamento estiver disponível.
- Estados vazios e erros explicam o próximo passo; nenhum controle sugere sucesso sem executar uma ação.

### 2. Iniciar uso autenticado

Como usuário, quero ter um espaço que outros usuários não consigam acessar.

- Cadastro valida os campos e não registra senha ou token em logs.
- Login incorreto não autentica e retorna erro compreensível.
- Rotas privadas exigem token válido e não aceitam workspace arbitrário no corpo da requisição.
- Acesso a uma conta ou lançamento de outro workspace não revela seus dados.
- Sem PostgreSQL acessível, a API informa indisponibilidade; não simula persistência bem-sucedida.

### 3. Registrar conta

Como usuário, quero representar onde meu dinheiro está.

- Nome, instituição e saldo inicial são validados pelo contrato da API.
- Saldo inicial usa centavos inteiros seguros e pode ser negativo.
- A listagem mostra somente contas do workspace autenticado.
- Saldo da conta corresponde ao saldo inicial mais receitas menos despesas não estornadas.

### 4. Registrar receita ou despesa

Como usuário, quero lançar uma movimentação uma única vez mesmo ao repetir o envio.

- Valor em centavos é positivo, inteiro seguro e limitado pelo contrato; descrição, categoria, data e conta são validadas.
- A conta deve pertencer ao workspace do usuário.
- A data respeita calendário real e formato `YYYY-MM-DD`, de 2000 a 2100.
- Uma chave de idempotência repetida com os mesmos dados não cria duplicidade.
- A mesma chave com dados diferentes é rejeitada, inclusive sob concorrência.
- A movimentação é persistida atomicamente e influencia o resumo do mês correto.

### 5. Estornar movimentação

Como usuário, quero corrigir o efeito financeiro de um lançamento preservando seu registro.

- O lançamento é marcado como estornado; seu histórico não desaparece.
- O núcleo financeiro e o resumo excluem seu efeito.
- Estornar duas vezes não altera o saldo uma segunda vez.
- Um usuário não pode estornar lançamento de outro workspace.

### 6. Planejar orçamento e meta

Como usuário da demonstração, quero testar limites por categoria e objetivos.

- Valores são validados e apresentados em BRL.
- Editar orçamento ou progresso de meta persiste no modo local.
- A interface explicita o alcance local dessas funções caso não exista persistência na API.
- Atualizações não criam movimentações bancárias reais.

### 7. Acompanhar a equipe

Como fundador, quero visualizar os 31 papéis e atribuir atividades.

- `organograma.html` mostra Vitor, cinco líderes e os respectivos cinco subagentes por equipe.
- O quadro aceita título, contexto/critérios, responsável, prioridade e status.
- Uma atividade concluída exige evidência textual; isso registra uma referência, sem garantir que o conteúdo foi verificado automaticamente.
- O quadro persiste no navegador e permite exportação/importação JSON validada.
- O painel informa que os papéis e tarefas não ativam runtimes, sincronização ou agentes em segundo plano.

## Requisitos de qualidade

- Cálculos financeiros compartilhados usam centavos e testes de saldo, estorno, duplicidade e arredondamento.
- Alterações de banco acompanham migração e estratégia de reversão/recuperação documentadas.
- Fluxos de erro, loading e vazio não se confundem com sucesso.
- Layout se adapta a tela pequena; formulários têm rótulos, foco de teclado visível e mensagens acessíveis.
- Segredos ficam em configuração local ignorada pelo Git. Logs não devem conter senha, token ou dados pessoais financeiros.
- Publicação e operações externas seguem a autorização humana prevista em `AGENTS.md`.

## Métricas propostas — sem coleta ativa presumida

As primeiras métricas de validação são conclusão do primeiro lançamento, compreensão do saldo e retorno ao controle no período seguinte. Para um piloto, definir eventos mínimos como `onboarding_completed` e `transaction_created` sem valores, descrições ou detalhes bancários. Não habilitar telemetria nem enviar dados a terceiros nesta entrega. Qualquer definição de KPI ainda é hipótese de produto.

## Dependências e decisões do fundador

Antes do piloto: validar o público prioritário e o problema; definir hospedagem compatível com NestJS/PostgreSQL; escolher recuperação de acesso e suporte; revisar privacidade, retenção e exclusão; aprovar autorização de publicação. Antes de cobrança: validar disposição a pagar e um provedor de assinatura; nenhuma tarifa é decidida por este documento.

## Definição de pronto

Uma atividade pode ser concluída quando seus critérios forem atendidos, a alteração estiver revisada, os testes adequados passarem e existir evidência registrada. Build aprovado sozinho não comprova integração com banco, fluxo de navegador, segurança completa ou prontidão de produção. O relatório deve identificar cada uma dessas verificações e suas limitações.
