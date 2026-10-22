# WealthOS — Estratégia de qualidade da primeira entrega

Responsável pela revisão: Lorena. A primeira entrega é um projeto local e uma demonstração com dados fictícios; este plano não certifica o produto para produção.

## Critérios obrigatórios

| Área | Evidência necessária | Responsável previsto |
| --- | --- | --- |
| Núcleo financeiro | Testes de centavos inteiros, saldo, estorno, duplicidade, parcelas e datas | Heitor |
| API e segurança | Testes unitários de isolamento por workspace, autorização, idempotência e estorno | Heitor / Helena |
| PostgreSQL | Migração aplicada em banco descartável; transações, índices únicos, concorrência e isolamento verificados | Valentina / Davi |
| Interface | Fluxos completos, erros recuperáveis, nenhuma ação que pareça salvar sem salvar | Caio / Arthur |
| Acessibilidade | Navegação por teclado, foco do modal, labels, contraste, responsividade | Isabela / Noah |
| Liberação | Build reprodutível, testes aprovados e limitações registradas | Lorena / Rafael |

Os nomes da tabela são atribuições previstas no organograma, não confirmação de execuções simultâneas de 31 agentes.

## Testes automatizados presentes

- `packages/finance/test/finance.test.ts`: valores brasileiros com vírgula e milhares; rejeição de casas extras sem arredondamento silencioso; limites monetários; saldo positivo/negativo; receitas e despesas estornadas; preservação da entrada; resumo mensal; soma exata e distribuição do resto nas parcelas; IDs duplicados; datas civis e anos bissextos.
- `apps/api/test/*.test.ts`: ver os próprios arquivos para os cenários de serviço e guard cobertos com doubles de Prisma/JWT. A suíte inclui também validação de segredo JWT/CORS e janela do rate limit local. Esses testes não substituem integração com PostgreSQL ou requisições HTTP reais.

Execução na raiz: `npm test`. Construção: `npm run build`.

O resultado real e eventuais bloqueios devem constar do reporte do CEO. A existência do arquivo de teste não comprova uma execução aprovada.

## Fluxos manuais de aceite

1. Abrir a demonstração limpa e conferir indicação explícita de dados fictícios.
2. Cadastrar conta com saldo inicial; conferir saldo total e persistência após recarregar.
3. Cadastrar receita de R$ 10,01 e despesa de R$ 0,99; conferir diferença de R$ 9,02 em todas as telas relacionadas.
4. Estornar os lançamentos; conferir que deixam de afetar saldos e resumos e continuam identificáveis no histórico.
5. Filtrar por texto, tipo e mês; verificar estados vazios e valores do período escolhido.
6. Testar entrada vazia, valor negativo, centavos com três casas, data inexistente e valor acima do limite. Nenhuma dessas tentativas deve alterar os dados.
7. Cadastrar/editar orçamento e meta no modo local; recarregar e conferir persistência. Informar claramente a disponibilidade dessas funções na API real.
8. Usar apenas teclado para criar/cancelar um lançamento; conferir foco, fechamento e acesso aos botões.
9. Conferir layout em 360 px, 768 px e desktop sem conteúdo financeiro cortado.
10. Na API real, autenticar duas contas independentes e confirmar que IDs de uma não dão acesso à outra.

## Integração obrigatória antes de produção

Preparar PostgreSQL descartável; aplicar a migração; validar que o schema final coincide com o Prisma; executar o cadastro/login e os endpoints por HTTP. Enviar a mesma chave de idempotência simultaneamente e conferir um único lançamento; repetir com payload diferente e exigir conflito. Estornar duas vezes em paralelo e confirmar saldo único. Tentar ler/criar/estornar dados de outro workspace. Ensaiar falha entre gravações de cadastro e conferir rollback sem workspace órfão.

Unitários com mocks não verificam locks, constraints reais, serialização, conexões, migrations ou concorrência do PostgreSQL. Esses pontos permanecem pendentes enquanto não houver evidência real do banco.

## Riscos de lançamento

- Isolamento entre usuários deve ser confirmado também por HTTP e banco, além dos testes unitários.
- Auth precisa de segredo forte, HTTPS, rate limiting, recuperação de senha e política de sessão antes de uso público.
- Dados locais da demonstração podem ser apagados pelo navegador; não são backup financeiro.
- Ausência de teste no navegador não equivale a aprovação visual, de teclado ou de acessibilidade.
- Backups e recuperação, logs sem dados pessoais, retenção e atendimento LGPD exigem validação operacional.
- Cartões, recorrências, conciliação e integrações bancárias só podem ser declarados concluídos com implementação e evidências específicas.
