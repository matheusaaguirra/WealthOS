import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('fixed-income create, edit and removal keep persistence, retry and account balance contracts',()=>{
 execFileSync(process.execPath,['--import','tsx','test/fixtures/fixed-income-actions.ts'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'},timeout:15000,stdio:'pipe'});
});
