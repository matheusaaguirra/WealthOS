import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
test('themed selection keeps model, keyboard, focus and viewport behavior consistent',()=>{
 execFileSync(process.execPath,['--import','tsx','test/fixtures/select-field.ts'],{env:{...process.env,TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'},timeout:15000,stdio:'pipe'});
});
