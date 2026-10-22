# Ações: fontes de dados e custos pesquisados

Consulta: 22/10/2026. A tela publicada nesta versão usa exclusivamente uma amostra simulada, sem integração de cotações, sem recomendação e sem contratação de serviços.

## B3 oficial

Não existe um preço único para uma API que reúna cotações, carteira pessoal e histórico de compras. São produtos e direitos distintos.

A Política Comercial de Market Data B3 2026, versão intermediária1.0, tabela4.1.1, publica as seguintes licenças nacionais de distribuição nos mercados listados, por mês e por dataset:

| Modalidade de distribuição | Tarifa da licença |
| --- | --- |
| Atraso em snapshots | R$ 320,00/mês/dataset |
| Atraso contínuo | R$ 1.920,00/mês/dataset |
| Tempo real | R$ 6.000,00/mês/dataset |

São tarifas de licenciamento; não são orçamento completo nem uma assinatura REST pronta. O custo aplicável depende de finalidade, consumo, conectividade/provedor e demais cobranças. Não confundir taxa de terminal individual com custo do backend de um SaaS.

Fonte oficial vigente consultada: https://www.b3.com.br/data/files/94/95/30/28/F54599100A29E189AC094EA8/Politica%20Comercial%20de%20Market%20Data_2026.pdf

Também há versão1.1 publicada com vigência de01/11/2026 a31/12/2026; os três valores de distribuição acima permanecem na tabela4.1.1. A versão1.1 ainda não está vigente na data desta consulta.
https://www.b3.com.br/data/files/20/35/7A/71/5CCFF91094DCD8F9AC094EA8/Politica%20Comercial%20de%20Market%20Data%20B3%202026%20V1.1.pdf

APIs da Área do Investidor tratam posição/movimentação/negociação e outros extratos, mediante contratação e autorização do investidor. O preço dessa contratação não foi encontrado na página pública consultada; precisa de proposta da B3. Não usar os valores de Market Data como orçamento para importar a carteira pessoal.
https://www.b3.com.br/pt_br/produtos-e-servicos/central-depositaria/canal-com-investidores/integracoes-da-area-do-investidor-apis/

## BRAPI — alternativa de terceiro

É um serviço separado da B3, não a API oficial da bolsa. A página de planos consultada apresenta:

| Plano | Valor mostrado | Limite e observação |
| --- | --- | --- |
| Gratuito | R$0 | 15.000 requisições/mês; cotações básicas e sandbox, cobertura limitada |
| Startup anual | equivalente R$99,99/mês | R$1.199,90 cobrados por ano;150.000 requisições/mês; atualização15min |
| Pro anual | equivalente R$116,66/mês | R$1.399,90 cobrados por ano;500.000 requisições/mês; atualização5min |

Os valores anuais acima são os promocionais exibidos na consulta, não uma mensalidade avulsa confirmada. Não contratar nem armazenar token no frontend. Para uso comercial, confirmar cobertura e direitos de exibição/redistribuição no contrato do fornecedor. A BRAPI informa atualização periódica, não cotação em tempo real.

Sandbox sem token anunciado para PETR4, VALE3, MGLU3 e ITUB4. Serve para testar, não comprova cobertura completa do mercado.
https://brapi.dev/pricing
https://brapi.dev/docs

## Implementação desta prévia

- Mercado: amostra simulada identificada, filtros por setor/período e ranking descritivo da amostra. Crescimento exibido significa variação do preço no período, não previsão de retorno.
- Setor: média simples das variações disponíveis, com igual peso por ticker. Não representa um índice oficial, o setor inteiro ou a rentabilidade da carteira.
- Carteira: começa vazia e fica apenas neste navegador. Ticker e quantidade podem ser informados sem custo médio. Custo desconhecido permanece nulo; retorno não é estimado.
- O valor estimado usa preços simulados apenas quando o ticker pertence à amostra. Ativo fora dela permanece sem cotação. Não é o patrimônio real do usuário.
- Próxima etapa: selecionar fonte e condições comerciais, implementar adaptador no backend com segredo protegido, cache, data/hora da cotação e identificação da origem. Calcular variação com base em série consistente e ajustada conforme produto; importar histórico de compras para custo médio somente com dados e autorização apropriados.
