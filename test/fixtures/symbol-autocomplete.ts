import '../../wealthos-source/node_modules/@angular/compiler/fesm2022/compiler.mjs';
import assert from 'node:assert/strict';
import {StockAutocompleteComponent} from '../../wealthos-source/apps/web/src/stock-autocomplete.component';
import type {StockSuggestion} from '../../wealthos-source/apps/web/src/stock-suggestions';

const wait=(ms=0)=>new Promise(resolve=>setTimeout(resolve,ms));
const pending:{url:string;resolve:(response:Response)=>void}[]=[];
globalThis.fetch=async input=>new Promise<Response>(resolve=>pending.push({url:String(input),resolve}));
const inside={};
const component=new StockAutocompleteComponent({nativeElement:{contains(target:unknown){return target===inside;},querySelector(){return {focus(){component.open();}};}}} as never);
const page=(symbols:StockSuggestion[],number=1,total=symbols.length,hasMore=false)=>Response.json({symbols,page:number,pageSize:40,total,hasMore,source:'brapi',retrievedAt:'2026-10-23T15:00:00Z'});
try{
  component.value='petr';component.open();await wait(240);assert.equal(pending.length,1);
  component.onInput({target:{value:'hglg'}} as unknown as Event);await wait(240);assert.equal(pending.length,2);
  pending[1].resolve(page([{ticker:'HGLG11',name:'Fundo logístico',assetType:'fii'}],1,42,true));await wait();
  assert.equal(component.suggestions[0].ticker,'HGLG11');assert.equal(component.fallback,false);assert.equal(component.assetLabel(component.suggestions[0]),'FII');
  pending[0].resolve(page([{ticker:'PETR4',name:'Petrobras',assetType:'stock'}]));await wait();
  assert.equal(component.suggestions[0].ticker,'HGLG11');assert.match(component.directoryNote,/1 de 42/);
  const more=component.loadMore();assert.equal(pending.length,3);assert.match(pending[2].url,/page=2/);
  pending[2].resolve(new Response('{}',{status:503}));await more;
  assert.equal(component.suggestions.length,1);assert.match(component.directoryNote,/resultados anteriores/);assert.equal(component.hasMore,true);
  const retry=component.loadMore();assert.equal(pending.length,4);
  pending[3].resolve(page([{ticker:'KNRI11',name:'Outro fundo',assetType:'fii'}],2,42,false));await retry;
  assert.deepEqual(component.suggestions.map(s=>s.ticker),['HGLG11','KNRI11']);assert.equal(component.hasMore,false);
  component.onBlur({relatedTarget:inside} as unknown as FocusEvent);assert.equal(component.opened,true);
  component.onMoreKey({key:'Escape',preventDefault(){},stopPropagation(){}} as KeyboardEvent);assert.equal(component.opened,false);assert.equal(component.loading,false);
  component.onInput({target:{value:'ZZZZ99'}} as unknown as Event);await wait(240);assert.equal(pending.length,5);
  pending[4].resolve(new Response('{}',{status:503}));await wait();
  assert.equal(component.fallback,true);assert.deepEqual(component.suggestions,[]);assert.match(component.directoryNote,/parcial/);assert.equal(component.value,'ZZZZ99');
  let emitted='';component.selected.subscribe(stock=>emitted=stock.ticker);
  component.onKey({key:'Enter',isComposing:false,preventDefault(){throw new Error('manual ticker must stay submittable');}} as KeyboardEvent);
  assert.equal(emitted,'');assert.equal(component.value,'ZZZZ99');
  component.onKey({key:'Escape',isComposing:false,preventDefault(){},stopPropagation(){}} as KeyboardEvent);assert.equal(component.opened,false);
}finally{component.ngOnDestroy();}
