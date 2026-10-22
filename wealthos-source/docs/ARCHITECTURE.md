# WealthOS — Arquitetura inicial

## Estrutura

- `apps/web`: aplicação Angular 20.3. Demonstração local e interface de produto. A extensão para o servidor deve conservar a separação explícita entre modos.
- `apps/api`: API NestJS 11, autenticação JWT e acesso a PostgreSQL por Prisma 6.
- `packages/finance`: regras puras em TypeScript para centavos, datas, saldos, resumo e divisão de parcelas.
- `docs`: especificação, backlog, organograma e registros de validação.

O build do pacote financeiro precede os builds da API e da interface. A API aplica autorização e validação mesmo quando a interface já valida os dados. O cliente nunca é a fonte confiável para identidade do workspace ou saldo persistido.

## Fluxo financeiro

1. O cliente envia uma movimentação com chave de idempotência.
2. A API valida token, corpo, limites e titularidade da conta.
3. O banco aplica unicidade de chave por workspace e grava atomicamente.
4. Repetição do mesmo conteúdo retorna o registro existente; conteúdo diferente é rejeitado.
5. Resumos derivam somente de movimentações válidas e não estornadas.

Valores monetários atravessam os contratos em centavos inteiros. A apresentação em reais ocorre na interface. Não usar ponto flutuante para somar valores monetários, nem excluir um lançamento para simular estorno.

## Contratos HTTP da primeira entrega

| Método | Rota | Responsabilidade |
| --- | --- | --- |
| GET | `/api/health` | Estado da API conforme implementação |
| POST | `/api/auth/register` | Criar identidade e workspace |
| POST | `/api/auth/login` | Verificar credenciais e emitir token |
| GET / POST | `/api/accounts` | Listar ou criar contas do workspace |
| GET / POST | `/api/transactions` | Listar ou criar lançamentos do workspace |
| POST | `/api/transactions/:id/reverse` | Marcar estorno com autorização |
| GET | `/api/summary` | Resumo mensal de movimentações válidas |

Campos e detalhes de requisição são definidos em `CONTRACTS.md` e no código da API. Essa tabela não substitui verificação de integração nem promete filtros ainda não implementados.

## Fronteiras de segurança

O workspace deriva de um token verificado. Cada consulta a entidades de usuário inclui o workspace. Senhas recebem hash; segredo de assinatura deve ser fornecido por configuração. Corpos aceitos são explicitamente validados. Não expor Prisma diretamente a requisições arbitrárias do cliente.

Na demonstração, localStorage não oferece isolamento entre usuários do mesmo navegador. Ele é apropriado para dados fictícios e para o quadro de planejamento local. Não equivale a armazenamento autenticado de um SaaS.

A autorização humana limita publicação, acesso a sistemas externos, cobranças e operações irreversíveis. Não há orquestrador de agentes operando no produto: o organograma é uma ferramenta de planejamento.

## Evolução até SaaS

Antes de um piloto real: integrar e testar cliente/API/banco; revisar concorrência e idempotência; implantar recuperação de senha e políticas de sessão; estabelecer proteção contra abuso; operar backup com restauração comprovada; tratar exportação/exclusão de dados; observar erros sem dados financeiros pessoais; publicar apenas após autorização.

Orçamentos, metas, cartões e recorrências devem evoluir como módulos com contratos próprios. Processamento de assinaturas exige webhooks autenticados, idempotentes e testes de ciclo de vida. Open Finance e conciliação exigem projeto e autorização separados.
