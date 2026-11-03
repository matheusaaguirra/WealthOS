import type { Guide } from './content';

// Product walkthroughs checked against the current application, not bank advice.
export const productGuides: Guide[] = [
  {
    key: 'recurring', slug: 'como-organizar-gastos-fixos',
    title: 'Como organizar gastos fixos mensais e acompanhar os vencimentos',
    description: 'Cadastre aluguel, internet e assinaturas no WealthOS. Entenda quando o gasto fixo entra no saldo e como conferir sem lançar duas vezes.',
    summary: 'As contas se repetem, mas você não precisa cadastrá-las do zero todo mês. Veja como registrar o valor, escolher a conta e conferir o desconto no vencimento.',
    published: '2026-11-03',
    action: { title: 'Comece com uma conta que se repete.', body: 'Entre, cadastre sua conta principal e abra Gastos fixos → Novo gasto fixo. Escolha uma despesa que você já conhece e confira o próximo vencimento.', label: 'Cadastrar meu primeiro gasto fixo' },
    sections: [
      { title: 'Quais despesas entram no controle de gastos fixos?', paragraphs: [
        'Aluguel, internet e uma assinatura com o mesmo preço mensal são exemplos de despesas recorrentes. Anote descrição, valor, categoria, conta que paga e dia do vencimento. A categoria explica o gasto; a conta identifica de qual saldo ele sai.',
        'Uma conta de luz que muda todo mês exige conferência do valor real. Uma regra com valor fixo não adivinha a próxima fatura. Se houver mudança, revise a regra e os lançamentos já registrados antes de usá-los no fechamento do mês.',
      ] },
      { title: 'Como cadastrar um gasto fixo no WealthOS', paragraphs: [
        'No primeiro acesso, crie a conta usada no dia a dia e informe seu saldo inicial. O cadastro é um registro no WealthOS: não conecta o banco e não pede senha bancária. Depois, abra Gastos fixos e escolha Novo gasto fixo.',
        'Informe descrição, valor, dia do mês, conta, categoria e mês de início. O mês de término é opcional. Confira a conta selecionada: uma despesa do vale-refeição deve reduzir esse saldo, e não uma conta que não pagou por ela.',
      ], steps: ['Cadastre a conta que realmente paga a despesa.', 'Abra Gastos fixos → Novo gasto fixo.', 'Preencha valor, vencimento, categoria e período.', 'Salve e confira o registro em Lançamentos quando vencer.'] },
      { title: 'Quando o gasto fixo é descontado do saldo?', paragraphs: [
        'Os gastos vencidos do mês atual são registrados ao abrir ou atualizar os dados do app. Com ele aberto, a verificação também ocorre a cada minuto, usando o horário de Brasília. Uma regra criada com vencimento já passado no mês atual pode entrar imediatamente ao salvar. Um vencimento futuro não entra antes da data.',
        'O desconto reduz o saldo da conta vinculada. Se ela faz parte da carteira principal, a visão geral também muda. Se é um saldo separado, como VR ou reserva, o desconto fica nessa conta. Isso atualiza seus registros; não paga boletos nem agenda débitos no banco.',
      ] },
      { title: 'Um exemplo para conferir a conta', paragraphs: [
        'Exemplo fictício: uma conta com saldo de R$ 1.000,00 recebe um gasto fixo de R$ 37,01 já vencido. Sem outras movimentações, o saldo passa a R$ 962,99. A mesma despesa aparece em Lançamentos, com a conta e a categoria escolhidas.',
        'Se o dia escolhido for 31 e o mês acabar antes, o vencimento fica no último dia daquele mês. Uma regra pausada ou fora do período de início e término não deve gerar nova despesa. Confira essas condições quando um desconto não aparecer.',
      ] },
      { title: 'Como evitar duplicidade e revisar meses anteriores', paragraphs: [
        'Cada regra gera no máximo um lançamento por mês. Reabrir o app não repete esse desconto. Se você estornar o lançamento, o saldo é recomposto e a regra não é cobrada novamente naquele mês. Confira o histórico antes de lançar a mesma conta manualmente ou importá-la de um extrato.',
        'A atualização automática cobre o mês atual, não todos os meses em que você ficou sem acessar. Para períodos anteriores, selecione o mês em Gastos fixos, confira as despesas e use Registrar vencidos quando houver itens disponíveis. O app não executa um agendamento de pagamentos enquanto está fechado.',
      ] },
    ],
  },
  {
    key: 'pdf', slug: 'como-importar-extrato-bancario-pdf',
    title: 'Como importar extrato bancário PDF e organizar os gastos',
    description: 'Veja como revisar um extrato PDF no WealthOS: conta, datas, entradas, saídas, categorias e duplicidades antes de salvar os lançamentos.',
    summary: 'Transforme as linhas de um extrato compatível em lançamentos revisados. O arquivo ajuda a começar; a conferência evita que um erro de leitura vire erro no saldo.',
    published: '2026-11-03',
    action: { title: 'Organize o primeiro extrato com conferência.', body: 'Entre, cadastre a conta do extrato e abra Lançamentos. Escolha a conta em Importar extrato e revise a prévia antes de confirmar os registros.', label: 'Começar a organizar meu extrato' },
    sections: [
      { title: 'Qual PDF pode ser importado?', paragraphs: [
        'Use o extrato baixado do seu banco e guarde o original para comparar. Tente selecionar o texto de uma movimentação no leitor de PDF. Um arquivo que contém somente imagens digitalizadas não funciona com um leitor de texto sem OCR.',
        'O importador do WealthOS aceita PDFs de até 10 MB e 20 páginas, com texto selecionável e um formato que o leitor consiga interpretar. Não há garantia de compatibilidade com todos os bancos. Se o arquivo não gerar uma prévia confiável, registre as movimentações manualmente.',
      ] },
      { title: 'Como importar no WealthOS, passo a passo', paragraphs: [
        'Entre na aplicação e cadastre a conta à qual o extrato pertence. Abra Lançamentos e encontre Importar extrato. Selecione primeiro a conta e depois o arquivo PDF. A leitura acontece no navegador; os lançamentos selecionados só são gravados na sua conta quando você confirma.',
        'Na prévia, confira data, descrição, tipo, categoria e valor. Ajuste as descrições e categorias necessárias e desmarque o que não quiser importar. A confirmação mostra a quantidade de lançamentos escolhidos. Não confirme linhas que você não reconhece.',
      ], steps: ['Abra Lançamentos e selecione a conta em Importar extrato.', 'Escolha um PDF com texto selecionável.', 'Confira entradas, saídas, datas, categorias e possíveis duplicidades.', 'Confirme apenas as linhas revisadas e compare com o extrato original.'] },
      { title: 'Confira entradas, saídas e categorias', paragraphs: [
        'Um reembolso, um salário e uma compra podem aparecer com sinais ou abreviações diferentes dependendo do banco. Confira o tipo de cada linha em vez de confiar apenas na descrição. Verifique também o ano do extrato e se as datas foram reconhecidas corretamente.',
        'Exemplo fictício: salário de R$ 3.000,00 é entrada; mercado de R$ 120,00 é saída. Você pode classificar a compra como Alimentação e manter ambos os registros na conta que recebeu ou pagou. Se a alimentação foi paga com VR, ela pertence à conta do benefício.',
      ] },
      { title: 'Evite contar o mesmo gasto duas vezes', paragraphs: [
        'Compare data, descrição, conta e valor com os lançamentos que você já cadastrou. Extratos de períodos sobrepostos, gastos fixos já gerados e registros manuais podem repetir uma despesa. O importador sinaliza possíveis duplicidades, mas a revisão continua necessária.',
        'Transferir dinheiro entre contas próprias não equivale a comprar algo. Se você já registrou cada compra de um cartão, registrar o pagamento da fatura como uma nova compra pode duplicar o total de gastos. Defina o que seu controle representa antes de confirmar a importação.',
      ] },
      { title: 'Depois de importar: confira e exporte o relatório', paragraphs: [
        'Compare os registros salvos com o período do extrato original. Verifique se o saldo inicial mais entradas menos saídas corresponde ao saldo final, quando esses dados estiverem disponíveis. Linhas ambíguas podem ter sido ignoradas: uma prévia sem erros visíveis não prova que o extrato inteiro foi reconhecido.',
        'Em Lançamentos, use Exportar PDF para gerar o relatório do filtro atual ou PDF de todo o histórico para uma visão mais ampla. Confira mês e conta antes de compartilhar. Não publique extratos, números de conta ou outros dados pessoais em campos de feedback.',
      ] },
    ],
  },
];
