import { spawnSync } from 'node:child_process';
import { cp, rm } from 'node:fs/promises';
const source=new URL('../wealthos-source/',import.meta.url);
for(const args of [['run','build','-w','@wealthos/finance'],['run','build','-w','@wealthos/web','--','--base-href','/app/']]){
  const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',args,{cwd:source,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
const destination=new URL('../public/app/',import.meta.url);
await rm(destination,{recursive:true,force:true});
await cp(new URL('apps/web/dist/browser/',source),destination,{recursive:true});
await cp(new URL('node_modules/pdfjs-dist/build/pdf.worker.min.mjs',source),new URL('pdf.worker.min.mjs',destination));
