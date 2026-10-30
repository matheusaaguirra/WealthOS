import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
test('automatic recurring entries affect the correct UI balance and persist once',()=>{
 execFileSync(process.execPath,['--import','tsx','test/fixtures/recurring-actions.ts'],{env:{...process.env,TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'},timeout:15000,stdio:'pipe'});
});
