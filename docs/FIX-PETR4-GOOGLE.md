# Correção de leitura do PETR4 no Google Finanças

O erro 502 do PETR4 era causado pelo identificador interno da entidade Google. A página HTML recebida com HTTP 200 contém a cotação válida `57.65`, moeda `BRL` e identidade exata `["PETR4","BVMF"]`, porém usa o identificador `/g/12fh0qdq2`. O leitor aceitava apenas IDs começando por `/m/`, descartava esse registro válido e concluía que não havia encontrado uma cotação.

WEGE3 e BBAS3 usam, nas capturas analisadas, `/m/0ckyv15` e `/m/0ckrjm4`, respectivamente. Por isso funcionavam no mesmo leitor.

## Alteração

Em `lib/google-finance.ts`, a validação do identificador interno passou a aceitar os dois formatos conhecidos: `/m/<id>` e `/g/<id>`, com conteúdo restrito a letras, números e sublinhado. Identificadores vazios, outros prefixos, URLs e caminhos arbitrários continuam rejeitados.

A identificação da cotação continua exigindo simultaneamente ticker solicitado, bolsa `BVMF`, moeda `BRL`, nome textual e preço positivo finito dentro dos limites em centavos. O leitor continua extraindo apenas arrays JSON dos blocos `AF_initDataCallback`, sem executar JavaScript. Nenhuma regra de seleção, identidade, moeda ou datas do histórico foi alterada.

Endpoints, cache e backoff permanecem com os mesmos contratos. Na interface, carregamento, erro de consulta e histórico ausente passaram a ter estados separados; erros não exibem um painel de gráfico vazio. Ticker e período ficam bloqueados durante a consulta para manter o resultado associado ao pedido em andamento.

## Evidências

`node --import tsx --test test/google-finance.test.ts`: 17 testes aprovados. Os três casos adicionados verificam os namespaces `/m/` e `/g/`, a rejeição de ticker/bolsa/moeda/preço incorretos e a leitura dos períodos PETR4 sem absorver históricos de outro ticker ou outra moeda.

As três capturas HTML reais fornecidas foram processadas localmente, sem novas chamadas de rede. Para cada combinação de ativo e período foram verificados ticker exato, BRL, preço esperado, pelo menos dois pontos, preços positivos e datas estritamente crescentes.

| Captura | Namespace | Preço da captura | Pontos em 1 dia | Pontos em 5 dias | Pontos em 1 mês |
| --- | --- | --- | --- | --- | --- |
| PETR4 | `/g/` | R$ 57,65 | 276 | 5 | 22 |
| WEGE3 | `/m/` | R$ 44,68 | 262 | 5 | 22 |
| BBAS3 | `/m/` | R$ 23,72 | 270 | 5 | 22 |

Os valores são evidências das capturas de 22/10/2026, não uma promessa de cotação atual. PETR4 deixou de lançar a exceção nos três períodos. A série mensal PETR4 percorre 22/09 a 22/10; a série de cinco sessões percorre 16/10 a 22/10; a intradiária percorre 13h04 a 17h39 UTC em 22/10. Os pontos e os horários foram preservados como recebidos na fonte.

O Google Finanças continua sendo uma fonte experimental de HTML público. Mudanças futuras no formato, bloqueios, desafios de acesso ou indisponibilidade precisam continuar produzindo erro explícito, sem estimar preços nem substituí-los pelos de outro ativo. A verificação de publicação e a consulta após deploy são etapas separadas, a cargo do responsável pela entrega.

## Verificação da entrega

45 testes do runtime passaram; TypeScript sem erros; build Angular passou. No navegador da prévia interna, o fluxo PETR4 carregou o estado de espera e, quando a rede externa do preview ficou indisponível, exibiu somente a falha de consulta, sem o painel de histórico ausente. A consulta no ambiente publicado é verificada após deploy.
