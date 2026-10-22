# WealthOS — revisão pontual do leitor Google Finance

Data: 22/10/2026. Responsável: Rafael. Escopo: `lib/google-finance.ts`, rota de mercado correspondente e seus testes. Somente leitura da implementação; nenhum deploy ou chamada ao Google foi feito nesta revisão.

## Evidências

`node --import tsx --test test/google-finance.test.ts`: **14/14 passaram**, zero falhas, duração 0,30 segundo, na repetição final após as correções. Fixtures adicionais foram executadas em Node inline, sem modificar a suíte ou a implementação.

Controles observados: URL fixa `https://www.google.com/finance/quote/...:BVMF`, ticker e período restritos, redirects manuais rejeitados, timeout, limite de quatro milhões de bytes durante leitura e detecção de páginas de desafio/consentimento. O parser extrai arrays por `JSON.parse`; não executa código remoto nem entrega markup ao navegador. O conteúdo normalizado informa fonte, atraso e caráter experimental. Não identifiquei caminho concreto de SSRF ou execução remota no escopo.

Datas inválidas de calendário são rejeitadas e a conversão usa o deslocamento explícito da fonte. Preços atuais, moeda e ticker são conferidos antes de formar a resposta. Os testes normais distinguem ativo relacionado, intradiário e mensal.

## Achados e repetição após correções

| Achado | Reprodução | Impacto / correção sugerida |
| --- | --- | --- |
| Travessia do histórico não interrompe uma identidade estrangeira aninhada | Uma série WEGE3 em `node[3]` com dois pontos próprios e uma série PETR4 aninhada adicionou os preços 900/901 do PETR4 ao resultado WEGE3. | **Corrigido e revalidado.** Subárvores com ticker/exchange discordante ou moeda incompatível são podadas. A condição foi reproduzida com fixture construída; não foi constatada na página real. |
| Preferência por maior amplitude pode selecionar histórico antigo | Duas séries mensais WEGE3, uma de jan/fev de 2025 com amplitude 40 dias e outra de outubro de 2026 com 19 dias, retornaram a de 2025 para `now` em outubro de 2026. | **Corrigido e revalidado.** A recência da última observação agora precede a amplitude na ordenação. Reprodução com fixture construída. Não foi implementada nesta correção uma validação geral de frescor absoluto em relação ao relógio. |

Não classifiquei esses casos como comprometimento de conta ou bypass do provedor. São fragilidades concretas do parser diante de mudança de estrutura ou múltiplos conjuntos históricos. O coordenador adicionou regressões e corrigiu a travessia para identidades ticker/exchange estrangeiras e moedas incompatíveis, além de priorizar a série mais recente antes de sua amplitude. Reexecutei as duas reproduções originais e as variantes AAPL:NASDAQ/USD e WEGE3:BVMF/USD: todas foram corrigidas. Estado final dos achados reproduzidos: **resolvidos e cobertos por regressão**. Isso não afirma que toda futura alteração do formato Google será interpretada corretamente.

## Limites

O cache de sucesso de quinze minutos e o backoff de falha de sessenta segundos reduzem chamadas, mas o backoff é local ao processo e não impede concorrência global entre regiões. A rota depende da audiência privada da hospedagem; não possui autenticação própria da carteira. Antes de abrir a audiência, revisar limite por usuário/IP e orçamento de requisições.

A revisão não valida estabilidade do formato Google, disponibilidade futura, cobertura, licença de dados ou funcionamento hospedado. O leitor deve continuar falhando explicitamente diante de esquema desconhecido, bloqueio ou desafio. A nova interface Angular e a apresentação visual das lacunas de histórico estão fora deste escopo.
