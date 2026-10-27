import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

test('PWA manifest has valid icons and an in-scope login launch URL',async()=>{
 const manifest=JSON.parse(await readFile('public/manifest.webmanifest','utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
 assert.equal(new URL(manifest.start_url,'https://wealthos.example').pathname,'/login');
 for(const icon of manifest.icons){const meta=await sharp('public'+icon.src).metadata();assert.equal(icon.sizes,meta.width+'x'+meta.height);assert.equal(meta.hasAlpha,false);}
 assert.ok(manifest.icons.some(icon=>icon.purpose==='maskable'));
});
test('service worker caches only a public fallback and leaves financial/auth requests on the network',async()=>{
 const handlers=new Map(),cached:string[]=[],deleted:string[]=[];let response:Promise<Response>|undefined;
 const offline=new Response('Reconnect');let online=false;
 const cache={add:async(path:string)=>{cached.push(path);},match:async()=>offline};
 runInNewContext(await readFile('public/sw.js','utf8'),{
  self:{location:{origin:'https://wealthos.example'},addEventListener:(name:string,fn:Function)=>handlers.set(name,fn),skipWaiting:async()=>{},clients:{claim:async()=>{}}},
  caches:{open:async()=>cache,keys:async()=>['wealthos-offline-v0','other-cache'],delete:async(key:string)=>{deleted.push(key);}},
  fetch:async()=>{if(!online)throw new Error('offline');return new Response('private data');},URL,Response,
 });
 let wait:Promise<unknown>;handlers.get('install')({waitUntil:(p:Promise<unknown>)=>wait=p});await wait!;
 assert.deepEqual(cached,['/offline.html']);
 handlers.get('activate')({waitUntil:(p:Promise<unknown>)=>wait=p});await wait!;
 assert.deepEqual(deleted,['wealthos-offline-v0']);
 const request=(path:string,mode='navigate',method='GET')=>{
  response=undefined;handlers.get('fetch')({request:{url:'https://wealthos.example'+path,mode,method},respondWith:(p:Promise<Response>)=>response=p});return response;
 };
 for(const [path,mode,method] of [['/api/finance','cors','GET'],['/api/portfolio','cors','PUT'],['/auth/callback','navigate','GET'],['/app/main.js','cors','GET']])assert.equal(request(path,mode,method),undefined);
 assert.equal(await (await request('/dashboard')!).text(),'Reconnect');
 online=true;assert.equal(await (await request('/dashboard')!).text(),'private data');assert.deepEqual(cached,['/offline.html']);
});
test('install UI consumes a prompt once and confirms installation from the browser event',()=>{
 execFileSync(process.execPath,['--import','tsx','test/fixtures/pwa-install.ts'],{env:{...process.env,TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'},timeout:15000,stdio:'pipe'});
});
