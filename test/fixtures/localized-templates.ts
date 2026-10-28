import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';
import { parseTemplate, TmplAstRecursiveVisitor, visitAll } from '../../wealthos-source/node_modules/@angular/compiler/fesm2022/compiler.mjs';
import { translations } from '../../wealthos-source/apps/web/src/i18n/translations';

const root = new URL('../../wealthos-source/apps/web/src/',import.meta.url);
const missing = new Set<string>();
function inspect(value:any) {
  if (!value || typeof value !== 'object') return;
  if (value.constructor?.name==='LiteralPrimitive' && typeof value.value==='string' && /[A-Za-zÀ-ÿ]/.test(value.value) && /[\sÀ-ÿ]/.test(value.value)) {
    if (!translations[value.value.trim()]) missing.add(value.value);
  }
  for (const [key,child] of Object.entries(value)) {
    if (['sourceSpan','span','file','nameSpan','valueSpan','location','errors'].includes(key)) continue;
    if (Array.isArray(child)) child.forEach(inspect);
    else if (child && typeof child==='object') inspect(child);
  }
}
class CopyVisitor extends TmplAstRecursiveVisitor {
  override visitText(node:any) {
    if (/[A-Za-zÀ-ÿ]/.test(node.value) && !['Wealth','OS','WealthOS'].includes(node.value.trim())) missing.add('unmarked text: '+node.value);
  }
  override visitBoundText(node:any) { inspect(node.value.ast); }
  override visitElement(node:any) {
    for (const input of node.inputs) if (input.name==='aria-label' && /[À-ÿ]|'(?:Importar|Estornar|Sugestões)/.test(input.value.source) && !input.value.source.includes('| tr')) missing.add('untranslated accessible label: '+input.value.source);
    for (const input of node.inputs) if (['ariaLabel','placeholder','label','title','alt','attr.title','attr.aria-label','attr.data-label'].includes(input.name)) inspect(input.value.ast);
    return super.visitElement(node);
  }
}
for (const file of readdirSync(root)) {
  if (!file.endsWith('.component.ts') && file!=='app.component.html') continue;
  const source=readFileSync(new URL(file,root),'utf8');let template:string|undefined;
  if (file.endsWith('.html')) template=source;
  else {
    const syntax=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
    const walk=(node:ts.Node)=>{if(ts.isPropertyAssignment(node)&&node.name.getText(syntax)==='template'&&(ts.isNoSubstitutionTemplateLiteral(node.initializer)||ts.isStringLiteral(node.initializer)))template=node.initializer.text;ts.forEachChild(node,walk);};walk(syntax);
  }
  if (!template) continue;
  const result=parseTemplate(template,file);
  assert.equal(result.errors?.length??0,0,file);
  visitAll(new CopyVisitor(),result.nodes);
}
assert.deepEqual([...missing],[],'Every owned template message must be marked and included in the catalogue.');
