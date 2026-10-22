const {cpSync,rmSync,existsSync}=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../apps/web/dist/browser');
const destination=path.resolve(__dirname,'../dist');
if(!existsSync(path.join(source,'index.html')))throw new Error('Execute o build Angular antes de preparar o Site.');
rmSync(destination,{recursive:true,force:true});
cpSync(source,destination,{recursive:true});
console.log('Bundle Angular preparado em dist/.');
