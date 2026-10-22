# PostgreSQL e migrações

O projeto usa PostgreSQL 16 e Prisma 6. O Compose fornece apenas o banco local; API e frontend executam no host. Um volume nomeado preserva dados entre reinicializações. O healthcheck confirma disponibilidade do servidor, não correção do schema.

## Inicialização local

Na raiz do projeto:

```bash
cp .env.example .env
```

Edite `.env`: substitua `POSTGRES_PASSWORD`, mantenha a mesma senha codificada em `DATABASE_URL` e gere um `JWT_SECRET` aleatório. A API deve ler esse arquivo da raiz; comandos Prisma recebem as variáveis exportadas no processo. Para carregar as variáveis no shell Bash sem imprimir valores:

```bash
set -a
source .env
set +a
docker compose up -d postgres
npm ci
npm run db:generate
npm run db:migrate
```

Leia apenas arquivos `.env` que você controla: `source` executa conteúdo de shell. Caso use outro shell, carregue as variáveis conforme sua ferramenta. `npm run db:seed` é opcional e insere dados fictícios conforme o seed; não execute seeds em produção.

`prisma migrate deploy` aplica somente migrações versionadas. Não use `db push` ou `migrate reset` em bancos com dados que precisam ser preservados. O CI aplica a migração inicial em um banco efêmero e executa build/testes; não é um mecanismo de deploy.

## Revisão e rollback

Toda alteração de schema deve vir acompanhada de migração SQL revisada, análise do impacto em dados e índices, compatibilidade com a versão anterior e plano de recuperação. A migração inicial cria o schema em banco vazio; inspecione seu SQL antes de aplicá-la a um banco existente.

Para futuras mudanças, prefira expandir/adaptar/contrair: adicione campos compatíveis, migre dados em lotes, atualize consumidores e só então remova o formato antigo. Em caso de falha, mantenha o aplicativo compatível ou aplique uma migração corretiva revisada. Prisma Migrate não oferece rollback automático de alterações de dados.

Remover tabelas, apagar o volume do Compose e restaurar um backup sobre dados atuais são ações destrutivas. Exigem aprovação humana explícita e um backup verificado. Nenhum desses procedimentos foi executado nesta entrega.

## Backup e restauração

Para ambientes futuros, use credenciais de menor privilégio, conexão TLS e backups criptografados com retenção definida. `pg_dump` no formato custom e `pg_restore` em um banco isolado são caminhos de teste; a operação deve evitar senha em argumentos ou logs. Documente horário, tamanho, versão do PostgreSQL, resultado de restauração e contagens de integridade.

RPO, RTO, frequência e retenção precisam ser acordados antes da produção. Este documento define a estratégia inicial; não comprova backups ou restaurações executados.
