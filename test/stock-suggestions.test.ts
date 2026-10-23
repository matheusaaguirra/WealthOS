import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchStockSuggestions, STOCK_SUGGESTIONS } from '../wealthos-source/apps/web/src/stock-suggestions';

test('symbol suggestions match company names, accents and common aliases',()=>{
  assert.equal(matchStockSuggestions('  itáu  ')[0].ticker,'ITUB4');
  assert.equal(matchStockSuggestions('magalu')[0].ticker,'MGLU3');
  assert.equal(matchStockSuggestions('banco brasil')[0].ticker,'BBAS3');
  assert.equal(matchStockSuggestions('vivo')[0].ticker,'VIVT3');
});
test('exact ticker is ranked first and partial ticker includes share classes',()=>{
  assert.equal(matchStockSuggestions('petr3')[0].ticker,'PETR3');
  assert.deepEqual(matchStockSuggestions('petr').map(s=>s.ticker),['PETR4','PETR3']);
});
test('suggestions are bounded and unknown symbols are never invented',()=>{
  assert.equal(matchStockSuggestions('').length,6);
  assert.equal(matchStockSuggestions('',2).length,2);
  assert.deepEqual(matchStockSuggestions('ZZZZ99'),[]);
  assert.deepEqual(matchStockSuggestions('petro',0),[]);
  assert.equal(new Set(STOCK_SUGGESTIONS.map(s=>s.ticker)).size,STOCK_SUGGESTIONS.length);
  assert.ok(STOCK_SUGGESTIONS.every(s=>!('price' in s)&&!('priceCents' in s)));
});
