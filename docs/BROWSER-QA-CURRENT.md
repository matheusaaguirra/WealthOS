# Verificação desta versão

22/10/2026. Runtime: 28 testes passaram, TypeScript sem erros. Regressão do núcleo financeiro/Nest preservado: 108 testes passaram. Build Angular e build Worker passaram.

Browser gerenciado na prévia interna: layout azul claro/escuro, área de conta, carteiras/tabs, gráfico real Ibovespa e gráfico Bitcoin Coinbase renderizaram. Configuração API confirma D1 habilitado e Google/BRAPI sem chaves. Preview Worker não conseguiu acessar BRAPI/Coinbase externamente: exibiu erro sem simular preços. Consulta direta da BRAPI pública confirmou PETR4/histórico real e consulta direta Coinbase confirmou taxas USD.

SP:SPX e FRED no TradingView não estavam disponíveis durante QA. S&P500 usa agora gráfico diário oficial do FRED incorporado (imagem 1024x623 carregada e conferida visualmente), com fonte e link para interação no FRED.

Os testes SQL usam migração real SQLite e adaptador D1 transacional; não equivalem a execução completa do Worker hospedado. Google OAuth real depende de configuração e não foi executado. Site continua privado ao proprietário.
