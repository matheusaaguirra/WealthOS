# Aquisição orgânica e primeiro uso

Atualizado em 3 de novembro de 2026. Canal escolhido pelo fundador: somente busca orgânica do Google. Sem anúncios, APIs pagas, envios ou publicações em outras plataformas.

## Hipótese desta entrega

Quem procura como cadastrar gastos fixos ou importar um extrato tem uma tarefa que o produto já atende. Os guias devem resolver a dúvida, explicar os limites e mostrar o primeiro passo dentro da aplicação. Não há estimativa comprovada de volume de busca ou promessa de posições.

Publicados:

- `/guias/como-organizar-gastos-fixos`: cadastro, conta vinculada, vencimento, desconto, estorno e meses anteriores.
- `/guias/como-importar-extrato-bancario-pdf`: texto selecionável, limites, revisão, categorias, duplicidades e exportação.

Ambos usam a estrutura editorial existente, com links no início público, hub e artigos relacionados, canonical próprio, datas reais e inclusão no sitemap. O guia PDF tem equivalente em inglês; gastos fixos tem apenas português. Hreflang não aponta para traduções inexistentes. Os guias internacionais já publicados foram preservados.

## O que medir

1. **Aquisição:** Search Console, por página e consulta: impressões, cliques, CTR e posição; filtrar país e idioma quando houver volume. Vercel complementa com páginas visitadas e referências, mas não substitui o Search Console.
2. **Ativação:** contas que possuem ao menos um lançamento salvo. O total atual do banco é um retrato, não a taxa de uma coorte: visitantes, cadastros e lançamentos não estão unidos por identidade ou origem.
3. **Uso recorrente:** comparar agregados semanais de contas que gravaram dados financeiros. Isso é apenas um indicador parcial: exclui acessos sem gravação e pode incluir sincronização automática. Não chamá-lo de WAU ou retenção D7.

Os agregados podem incluir o fundador e contas de teste. Não há neste momento uma classificação confiável para excluí-los. Não publicar contagens de contas ou dados privados neste repositório público. Não acrescentar valores financeiros, e-mails ou IDs de usuários ao Analytics.

## Próximas verificações, ainda não realizadas

- Confirmar acesso à propriedade `wealthos.com.br` no Google Search Console.
- Conferir indexação da página inicial e dos dois guias; ler o diagnóstico se houver exclusão, antes de pedir nova indexação.
- Submeter `https://wealthos.com.br/sitemap.xml` uma vez após conferir o relatório. Não simular submissão, usar endpoints antigos de ping ou repetir pedidos diariamente.
- Depois de haver dados, comparar as consultas e as páginas por pelo menos duas janelas completas; melhorar o conteúdo que recebe impressões pertinentes, evitando criar páginas semelhantes em massa.
- Investigar o primeiro uso com evidências de fluxo antes de refazer autenticação ou introduzir novas etapas.

Não foi criada automação recorrente. O workflow Growth existente e seu uso de API não foram executados nem alterados por esta entrega.

## Referências

- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Títulos descritivos](https://developers.google.com/search/docs/appearance/title-link)
- [Como a busca funciona](https://developers.google.com/search/docs/fundamentals/how-search-works)

Elegibilidade técnica não garante rastreamento, indexação, posição nem novos usuários. Resultado exige medição após publicação.
