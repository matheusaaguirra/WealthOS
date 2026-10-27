import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
test('account deletion is explicit, atomic, scoped and repeat-safe; daily change is independent of purchase cost',()=>{
 execFileSync(process.execPath,['--import','tsx','test/fixtures/account-actions.ts'],{env:{...process.env,TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'},timeout:15000,stdio:'pipe'});
});
