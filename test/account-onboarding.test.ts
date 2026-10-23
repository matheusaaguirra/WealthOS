import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('first-account onboarding and financial actions preserve persistence and keyboard contracts',()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  execFileSync(process.execPath,['--import','tsx','test/fixtures/account-onboarding.ts'],{
    cwd:root,
    env:{...process.env,TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'},
    timeout:15000,
    stdio:'pipe',
  });
});
