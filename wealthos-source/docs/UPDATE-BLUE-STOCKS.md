# Atualização — azul, temas e ações

Data: 22/10/2026. Solicitação do fundador: preservar layouts, adotar azul, permitir modo claro/noturno e organizar ações por setor mesmo sem saber o custo de compra.

Entregue: identidade azul; tema com preferência do sistema inicial e persistência local; Ações com 16 tickers simulados / 6 setores, filtros, período Dia/Mês/Ano, ranking e média simples da amostra; carteira local vazia, cadastro/edição/remoção confirmada/exportação; custo desconhecido preservado como null e rentabilidade indisponível. Ticker fora da amostra não ganha cotação inventada. Totais verificam precisão segura.

Verificação executada:
- Build Angular aprovado:aproximadamente 350 kB iniciais / 87 kB transferência estimada. Aviso de CommonJS compartilhado permanece não bloqueante.
- 108 testes unitários aprovados (73 financeiros, incluindo 9 novos de ações, e 35 de API com mocks). Evidência: TEST-RESULTS-BLUE-STOCKS.txt.
- Chrome remoto:dashboard com tema azul; alternância claro/noturno; layout escuro e carteira clara inspecionados; Ações carregou 16 ativos e 6 setores; mudar Dia para Mês alterou ranking e média setorial; cadastro de 10 PETR4 fictícias sem custo médio mostrou R$ 378,00 de avaliação SIMULADA e rentabilidade indisponível; reload preservou tema escuro e a posição; retorno ao claro conferido também por estilos calculados do DOM.
- Dados de teste do navegador não estão incluídos no bundle ou no estado inicial de outro visitante.

Limites:sem integração B3/BRAPI, sem cotação atual, sem recuperação do histórico pessoal, sem sincronização da carteira no backend e sem contratação. Pesquisa de custos e fontes em MARKET-DATA.md. Os valores da carteira são avaliações simuladas, não patrimônio real. Testes de integração com PostgreSQL nativo e E2E automatizados continuam pendentes conforme entrega inicial.

O Site preserva a identidade existente e o acesso privado do proprietário. Código editável acompanha os assets estáticos no repositório do Site. O monorepo NestJS é preservado como fonte, mas a hospedagem desta prévia entrega apenas a demonstração Angular.
