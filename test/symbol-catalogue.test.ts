import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {fetchSymbolCatalogue,normalizeSymbolCatalogue,symbolCatalogueInput,SymbolCatalogueError} from '../lib/symbol-catalogue';

const payload=(results:unknown[]=[],page=1,totalItems=results.length,hasNextPage=false)=>({results,pagination:{page,limit:40,totalItems,hasNextPage}});
test('listed catalogue preserves provider identity and distinguishes equities, FIIs, ETFs and BDRs without exposing quotes',()=>{
  const rows=[{symbol:'PETR4',longName:'Petrobras',subType:'stock'},{symbol:'HGLG11',longName:'Fundo logístico',subType:'fii'},{symbol:'BOVA11',name:'ETF Ibovespa',subType:'etf'},{symbol:'AAPL34',name:'Apple BDR',subType:'bdr'}];
  const result=normalizeSymbolCatalogue(payload(rows),1,'2026-10-23T12:00:00Z');
  assert.deepEqual(result.symbols.map(s=>s.assetType),['stock','fii','etf','bdr']);
  assert.equal(result.symbols[1].ticker,'HGLG11');assert.equal(result.total,4);
  assert.ok(result.symbols.every(row=>!('quote'in row)&&!('priceCents'in row)));
});
test('catalogue validates bounded search/page and malformed provider pagination',()=>{
  assert.deepEqual(symbolCatalogueInput(new URLSearchParams('q=Ita%C3%BA&page=2')),{query:'Itaú',page:2});
  for(const query of ['q='+('a'.repeat(81)),'q=%00','page=0','page=1001','page=1e3','page=-1'])assert.throws(()=>symbolCatalogueInput(new URLSearchParams(query)),SymbolCatalogueError);
  for(const value of [{results:[],pagination:{page:1,limit:40,totalItems:-1,hasNextPage:false}},payload([],1,9,true)])assert.throws(()=>normalizeSymbolCatalogue(value,1),SymbolCatalogueError);
});
test('real unfiltered provider pages preserve digit-prefixed B3 ETFs and page two identities',()=>{
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/symbol-catalogue-pages.json',import.meta.url),'utf8'));
  const first=normalizeSymbolCatalogue(fixture.pages[0],1);
  const second=normalizeSymbolCatalogue(fixture.pages[1],2);
  assert.equal(first.symbols.length,40);assert.equal(second.symbols.length,40);assert.equal(first.total,2348);assert.equal(first.hasMore,true);
  assert.deepEqual(first.symbols.slice(0,4).map(row=>[row.ticker,row.assetType]),[['03BK11','etf'],['10BK11','etf'],['3PRE11','etf'],['5PRE11','etf']]);
  assert.equal(second.symbols[0].ticker,'A1SN34');assert.ok(second.symbols.some(row=>row.ticker==='AALR3F'));assert.ok(second.symbols.some(row=>row.ticker==='ABCB10'));
  assert.equal(new Set([...first.symbols,...second.symbols].map(row=>row.ticker)).size,80);
  assert.equal(first.omittedCount,0);assert.equal(second.omittedCount,0);
});
test('unsupported or duplicate source records are reported as omissions without discarding valid identities or pagination',()=>{
  const first=normalizeSymbolCatalogue(payload([{symbol:'https://evil.invalid'},{symbol:'PETR4'},{symbol:'PETR4'},{symbol:'03BK11',subType:'etf'}],1,80,true),1);
  assert.deepEqual(first.symbols.map(row=>row.ticker),['PETR4','03BK11']);assert.equal(first.omittedCount,2);assert.equal(first.total,80);assert.equal(first.hasMore,true);
  const emptyPage=normalizeSymbolCatalogue(payload([{symbol:'unsupported'}],1,80,true),1);
  assert.deepEqual(emptyPage.symbols,[]);assert.equal(emptyPage.omittedCount,1);assert.equal(emptyPage.hasMore,true);
});
test('catalogue fetch uses fixed HTTPS identity endpoint, encoded search, bounded pages and authorization only in header',async()=>{
  const fetcher:typeof fetch=async(input,init)=>{
    const url=new URL(String(input));
    assert.equal(url.origin,'https://brapi.dev');assert.equal(url.pathname,'/api/v2/tickers');
    assert.equal(url.searchParams.get('search'),'Itau & https://evil.invalid');assert.equal(url.searchParams.get('page'),'2');assert.equal(url.searchParams.get('limit'),'40');assert.equal(url.searchParams.has('token'),false);
    assert.equal((init?.headers as Record<string,string>).Authorization,'Bearer test-only');assert.equal(init?.redirect,'error');
    return Response.json(payload([{symbol:'ITUB4',longName:'Itaú',subType:'stock'}],2,41,false));
  };
  const result=await fetchSymbolCatalogue('Itaú & https://evil.invalid',2,'test-only',fetcher);
  assert.equal(result.symbols[0].name,'Itaú');assert.equal(result.page,2);
});
test('catalogue refuses invalid JSON, HTML, oversized responses and provider errors instead of inventing symbols',async()=>{
  for(const response of [new Response('nope',{headers:{'content-type':'application/json'}}),new Response('<html>login</html>',{headers:{'content-type':'text/html'}}),new Response('x'.repeat(1_000_001),{headers:{'content-type':'application/json'}}),new Response('',{status:429}),new Response('',{status:403})]){
    await assert.rejects(()=>fetchSymbolCatalogue('',1,undefined,async()=>response),SymbolCatalogueError);
  }
});
test('autocomplete loads catalogue pages, ignores stale responses and preserves manual/fallback behavior',()=>{
  execFileSync(process.execPath,['--import','tsx','test/fixtures/symbol-autocomplete.ts'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'},timeout:15000,stdio:'pipe'});
});
