const { config } = require('dotenv');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
config({ path: resolve(__dirname, '../../../.env') });
const cli = require.resolve('prisma/build/index.js');
const result = spawnSync(process.execPath,[cli,...process.argv.slice(2)],{stdio:'inherit',cwd:resolve(__dirname,'..'),env:process.env});
if (result.error) {console.error('Não foi possível iniciar o Prisma CLI.');process.exitCode=1;}
else process.exitCode = result.status ?? 1;
