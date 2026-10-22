# Busca Google Finance — QA

22/10/2026. O campo destacado no módulo Ações aceita pergunta e ticker, incluindo códigos alfanuméricos como B3SA3. No navegador da prévia interna, digitar “como está a WEGE3?” e Enter abriu a ficha WEGE3 e o período mensal corretamente, com fonte e link original. Visual azul escuro conferido por screenshot. Não houve iframe nem markup externo inserido na página.

O preview Worker não teve acesso externo ao Google e mostrou indisponibilidade sem preço/histórico falso. A validação da extração foi feita sobre HTML público recebido HTTP200: WEGE3 (262 pontos intradiários/22 mensais/5 pregões derivados) e BBAS3 (22 mensais) retornaram identidade, preço e timestamp corretos. Nenhum desses HTMLs/snapshots é incluído no bundle.

42 testes do runtime passaram, incluindo14 do leitor Google, autenticação/D1 e BRAPI/Coinbase. TypeScript sem erros. Os9 testes financeiros de ações passaram após aceitar prefixos alfanuméricos. Build Angular passou. A revisão independente de Rafael corrigiu e revalidou identidade de ticker/exchange/moeda e preferência por séries recentes.

Teste do endpoint no ambiente publicado é executado após deploy. A integração pode ficar indisponível por mudança de formato, bloqueio ou limitação do Google; nesses casos a página original continua acessível por link.
