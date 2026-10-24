import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateHoldings} from '../lib/auth-core';
import {googleInput,googleSourceUrl,parseGoogleFinance} from '../lib/google-finance';
import {stockInput} from '../lib/market';
import {stockPosition} from '../wealthos-source/packages/finance/src/stocks';

test('digit-prefixed Brazilian ETFs can be saved and queried without accepting arbitrary identifiers',()=>{
  for(const ticker of ['03BK11','10BK11','3PRE11','5PRE11','HGLG11','BOVA11','PETR4','AAPL34']){
    const holding={id:crypto.randomUUID(),ticker,quantity:2,averagePriceCents:1234};
    assert.equal(validateHoldings({holdings:[holding]})[0].ticker,ticker);
    assert.equal(stockPosition(holding).costBasisCents,2468);
    assert.equal(googleInput(ticker,'1mo').symbol,ticker);
    assert.equal(stockInput(ticker,'1mo').symbol,ticker);
    assert.equal(new URL(googleSourceUrl(ticker)).pathname,'/finance/quote/'+ticker+':BVMF');
    const quote=['/m/test',[ticker,'BVMF'],'Ativo de teste',0,'BRL',[12.34,0,0],null,12.34,null,null,null,[1792689842]];
    const html='<script>AF_initDataCallback({data:'+JSON.stringify([quote])+',sideChannel:{}});</script>';
    assert.equal(parseGoogleFinance(html,ticker,'1mo').priceCents,1234);
    assert.throws(()=>parseGoogleFinance(html,'XXXX11','1mo'));
  }
  for(const ticker of ['https://example.invalid','03BK11/../../x','BOVA11:NYSE','03BK11?x=1','PETR4,VALE3']){
    const holding={id:crypto.randomUUID(),ticker,quantity:1,averagePriceCents:null};
    assert.throws(()=>validateHoldings({holdings:[holding]}));
    assert.throws(()=>stockPosition(holding));
    assert.throws(()=>googleInput(ticker,'1mo'));
    assert.throws(()=>stockInput(ticker,'1mo'));
  }
});
