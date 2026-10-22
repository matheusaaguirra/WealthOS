# Consulta de ações via Google Finance

Pedido do proprietário: consultar uma ação no campo do WealthOS e apresentar os dados públicos no design existente.

## Fluxo

A busca entende um ticker brasileiro, uma frase contendo um ticker, ou alguns nomes locais conhecidos. Não é um chatbot de análise de investimento. O resultado abre a ficha própria, com gráfico SVG, métricas e botão para adicionar a posição à carteira. A carteira usa Google Finance como fonte padrão; a amostra BRAPI permanece separada.

Endpoint: `GET /api/market/google-finance?ticker=WEGE3&range=1mo`. Períodos aceitos: `1d`, `5d`, `1mo`. Tickers alfanuméricos como B3SA3 são aceitos. A disponibilidade depende da cobertura do Google.

O servidor consulta somente `https://www.google.com/finance/quote/TICKER:BVMF?hl=pt-BR`. Extrai JSON das estruturas AF_initDataCallback no HTML público, sem executar JavaScript remoto, sem retornar o HTML e sem usar iframe/proxy da página. A página original envia X-Frame-Options SAMEORIGIN. O parser não depende de nomes de classes CSS.

Campos: preço em centavos BRL; variação percentual diária; horário fornecido pelo Google; fechamento anterior, abertura, máxima, mínima, volume e valor de mercado quando identificáveis. Histórico e timestamp da cotação são independentes, como recebidos na página. Os dados podem ter atraso. Ausências permanecem nulas; não há dados fabricados.

O período 5d usa uma série dedicada quando disponível, ou as últimas cinco observações reais da série diária mensal. A interface identifica cinco pregões. Histórico mensal não é fabricado a partir de pontos de um único dia.

## Resiliência e proteção

Cache de resultados normalizados por quinze minutos, coalescência de consultas iguais, backoff de falha por sessenta segundos no processo. Sem polling automático. Timeout de quinze segundos, HTML limitado a quatro milhões de bytes. Identidade ticker/exchange/moeda conferida; subárvores de outros ativos são podadas e séries mais recentes têm preferência. A origem não é controlada pelo cliente.

Redirects, consentimento, verificação de acesso e respostas 403/429 são interrompidos, sem proxies alternativos, evasão ou resolução de desafios. Mudança de schema retorna indisponibilidade e mantém o link público para consulta manual.

A implementação técnica não concede licença de dados nem garantia de estabilidade/cobertura. Antes de disponibilizar comercialmente, verificar as condições de uso do provedor. O Site mantém a audiência privada atual.

## Evidências

Consulta pública em 22/10/2026 retornou WEGE3: HTTP200, nome WEG S.A., cotação/variação/horário e séries reais intradiária/mensal. A extração foi verificada sobre o HTML recebido: 262 pontos intradiários, 22 mensais e 5 pregões derivados. Esses números descrevem somente aquela resposta, não são seed de produção.

14 testes do leitor cobrem formato, ticker, moeda/exchange, datas/fuso, histórico real, falta de preço, identidade aninhada, recência, tamanho e interrupção em bloqueios. Revisão de Rafael em `SECURITY-REVIEW-GOOGLE-FINANCE.md`. Verificação hospedada é feita após a publicação; nenhuma cotação é enviada como mock na entrega.
