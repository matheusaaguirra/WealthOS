# Gastos fixos no vencimento — 30/10/2026

## Comportamento

Os gastos fixos ativos do mês atual entram nos lançamentos quando o vencimento chega, usando o horário de Brasília. A sincronização acontece na abertura/recarga da conta, após salvar dados financeiros e, com o aplicativo aberto, a cada minuto ou ao voltar para a janela. Uma regra cadastrada ou reativada após o vencimento também é registrada ao salvar.

Cada despesa reduz o saldo de sua conta vinculada. Contas fora da carteira principal continuam afetando apenas o respectivo saldo separado. O lançamento também entra em despesas, categorias e relatórios. Não há pagamento ou transferência bancária.

O processamento automático cobre apenas o mês atual. Não há tarefa de servidor que rode com o aplicativo fechado; os vencidos do mês são conciliados no próximo acesso. Meses anteriores continuam disponíveis para registro manual. Despesas futuras não são adiantadas pelo botão manual.

## Persistência e concorrência

- `POST /api/finance/recurring` exige origem idêntica, JSON vazio e usuário autenticado. A data e o usuário são definidos no servidor.
- A gravação continua usando `wealthos_save_financial_state`, com revisão esperada e RLS. O banco foi consultado e a função remota mantém `SECURITY INVOKER`.
- Em um conflito, apenas a conciliação automática é recalculada sobre uma leitura nova, com até três tentativas. Gravações de alterações do usuário continuam rejeitando revisões antigas.
- O par `recurringRuleId` + `recurringMonth` impede gerar novamente o mesmo gasto. Um estorno não autoriza outro lançamento automático naquele mês.
- Uma falha mantém o último saldo confirmado e mostra aviso com opção de tentar novamente. Nenhum saldo é apresentado como atualizado sem confirmação do servidor.
- Nenhuma tabela, política RLS ou função do banco foi alterada.

## Validação

- Suíte completa: 126 testes aprovados, incluindo cálculo em centavos, contas separadas, mês bissexto, início/término e pausa de regras, duplicidade, estorno, falha de gravação e conflitos de revisão.
- Teste adicional da nova rota: rejeita origem externa, conteúdo não JSON e tentativas de enviar usuário/data controlados pelo cliente.
- Integração PostgreSQL/PGlite: duas sincronizações concorrentes persistem apenas uma cópia, mantêm o isolamento por usuário e preservam estornos.
- Componente Angular real: abertura, recarga, criação de regra vencida, falha/retry e verificação periódica do vencimento atualizam os saldos corretos.
- Build Angular e Next.js concluídos.
- Revisão no navegador com dados fictícios: saldo inicial de R$ 1.000,00 e gasto fixo de R$ 37,01 resultam em R$ 962,99; gasto no VR permanece separado. Dois gastos aparecem como lançados e nenhum fica pendente.

Os testes de banco usaram dados sintéticos locais. A sessão financeira real do usuário não foi modificada durante os testes.
