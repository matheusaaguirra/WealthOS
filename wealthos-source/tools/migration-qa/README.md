# Verificação opcional do SQL

Execute neste diretório `npm install` e `npm test`. Ferramenta de QA separada das dependências da aplicação. Usa PostgreSQL em WebAssembly via PGlite e banco efêmero em memória; aplica migração e confirma CHECK, FK composta e UNIQUE. Nenhuma conexão externa ou dado real.

Não valida Prisma, conectividade TCP, PostgreSQL nativo, migrações em banco existente ou concorrência. Essas verificações continuam necessárias com PostgreSQL16. Evidência é regravada em docs/MIGRATION-SQL-QA.json.
