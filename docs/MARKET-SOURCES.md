# Fontes de mercado e limitações

Verificado em 22/10/2026: BRAPI sem chave retornou PETR4 e histórico real. Acesso público documentado somente para PETR4, VALE3, ITUB4 e MGLU3. Rotas cripto e índices consultadas sem chave retornaram 401. Nenhum mock substitui falhas de provedor.

- Ações: https://brapi.dev/docs/authentication e https://brapi.dev/pricing
- Cripto: https://api.coinbase.com/v2/exchange-rates?currency=USD ; preço USD derivado da taxa real, sem inventar variação ou horário de negociação ausentes na resposta.
- Gráficos externos: https://www.tradingview.com/widget-docs/ ; índices BMFBOVESPA:IBOV no Advanced Chart e SP500 diário em gráfico oficial incorporado do FRED (fredgraph.png?id=SP500).

Cache BRAPI 1800s, cripto300s, sem polling automático. Fila BRAPI por isolate e cache podem não ser globais; plano e limites do provedor prevalecem. Tickers sem acesso continuam cadastráveis, com cotação/rentabilidade indisponíveis.

GOOGLE_CLIENT_ID e BRAPI_TOKEN ausentes do ambiente na entrega. Nenhuma assinatura paga criada.

## Consulta individual Google Finance

A busca de ações e as cotações da carteira passam a usar o leitor de HTML público do Google Finance, com histórico real quando presente. A amostra setorial BRAPI continua separada e identificada. Detalhes, limitações, cache e evidências: `GOOGLE-FINANCE.md`.
