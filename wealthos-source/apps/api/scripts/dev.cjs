const { spawnSync, spawn } = require('node:child_process');
const { resolve } = require('node:path');
const cwd = resolve(__dirname,'..');
const compiler = require.resolve('typescript/bin/tsc');
const build = spawnSync(process.execPath,[compiler,'-p','tsconfig.json'],{stdio:'inherit',cwd});
if (build.status !== 0) process.exit(build.status ?? 1);
const watcher = spawn(process.execPath,[compiler,'-p','tsconfig.json','--watch','--preserveWatchOutput'],{stdio:'inherit',cwd});
const api = spawn(process.execPath,['--watch','dist/main.js'],{stdio:'inherit',cwd});
let stopping = false;
function stop() {if(stopping)return;stopping=true;watcher.kill();api.kill();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
watcher.on('exit',stop);api.on('exit',stop);
