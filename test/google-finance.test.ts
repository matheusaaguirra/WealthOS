import { describe,it } from 'node:test';
import assert from 'node:assert/strict';
import {embeddedArrays,fetchGoogleFinance,googleInput,parseGoogleFinance} from '../lib/google-finance';

const quote=(symbol='WEGE3',price:number|null=44.68)=>['/m/company',[symbol,'BVMF'],'WEG "S.A."',0,'BRL',[price,-.53,-1.1723044],null,45.21,null,null,null,[1792689842]];
const point=(day:number,close:number,hour=16)=>[[2026,10,day,hour,30,null,null,[-10800]],[close,0,0],1000];
const series=(points:unknown[],symbol='WEGE3')=>[[symbol,'BVMF'],'/m/company','BRL',[[[1],points]],null,-10800,'WEG',86400];
const script=(data:unknown)=>'<script>AF_initDataCallback({key: \'ds:13\', data:'+JSON.stringify(data)+',sideChannel:{}});</script>';
const page=()=>script([quote(),series([point(1,48),point(2,49),point(5,47),point(6,46),point(7,45),point(20,44.7)]),series([point(22,45,10),point(22,44.68,14)])]);

describe('Google Finance public HTML reader',()=>{
 it('validates the ticker and range and cannot accept an arbitrary URL',()=>{
  assert.deepEqual(googleInput(' wege3 ','1mo'),{symbol:'WEGE3',period:'1mo'});
  assert.equal(googleInput('B3SA3','1mo').symbol,'B3SA3');
  for(const ticker of ['https://evil.test','../PETR4','PETR4:BVMF','PETR4,VALE3','<script>'])assert.throws(()=>googleInput(ticker,'1mo'));
  assert.throws(()=>googleInput('WEGE3','3mo'));
 });
 it('extracts JSON only, handles string brackets and never executes JavaScript',()=>{
  const html=script([quote(), 'text "] bracket"'])+'<script>globalThis.shouldNeverExecute=true</script>';
  assert.equal(embeddedArrays(html).length,1);assert.equal((globalThis as any).shouldNeverExecute,undefined);
  assert.equal(parseGoogleFinance(html,'WEGE3','1mo').name,'WEG "S.A."');
 });
 it('binds the quote to the requested ticker instead of a related stock',()=>{
  assert.throws(()=>parseGoogleFinance(script([quote('PETR4')]),'WEGE3','1mo'));
  const data=parseGoogleFinance(script([quote('PETR4',900),quote()]),'WEGE3','1mo');
  assert.equal(data.priceCents,4468);assert.equal(data.changePercent,-1.1723044);assert.equal(data.asOf,'2026-10-22T17:24:02.000Z');
 });
 it('accepts both Google entity namespaces, including the real PETR4 /g/ identity',()=>{
  for(const id of ['/m/0ckyv15','/g/12fh0qdq2']){
   const data=quote('PETR4',57.65);data[0]=id;data[2]='Petrobras';
   const result=parseGoogleFinance(script([data]),'PETR4','1d');
   assert.equal(result.ticker,'PETR4');assert.equal(result.name,'Petrobras');assert.equal(result.priceCents,5765);assert.equal(result.currency,'BRL');
  }
 });
 it('keeps ticker, exchange, currency, entity shape and positive-price checks for /m/ and /g/',()=>{
  for(const id of ['/m/0ckyv15','/g/12fh0qdq2']){
   for(const mutate of [
    (q:any[])=>{q[1]=['WEGE3','BVMF'];},
    (q:any[])=>{q[1]=['PETR4','NYSE'];},
    (q:any[])=>{q[4]='USD';},
    (q:any[])=>{q[5]=[0];},
    (q:any[])=>{q[5]=[-10];},
    (q:any[])=>{q[5]=[null];},
   ]){
    const q=quote('PETR4',57.65);q[0]=id;mutate(q);
    assert.throws(()=>parseGoogleFinance(script([q]),'PETR4','1mo'));
   }
  }
  for(const id of ['/g/','/m/','/x/12fh0qdq2','/g/../PETR4','https://google.com/g/12fh0qdq2']){
   const q=quote('PETR4',57.65);q[0]=id;assert.throws(()=>parseGoogleFinance(script([q]),'PETR4','1mo'));
  }
 });
 it('reads PETR4 /g/ histories for all ranges without absorbing another ticker or currency',()=>{
  const q=quote('PETR4',57.65);q[0]='/g/12fh0qdq2';q[2]='Petrobras';
  const monthly=series([point(1,55.1),point(2,56.2),point(5,57),point(6,56.8),point(7,57.2),point(20,57.65)],'PETR4');monthly[1]='/g/12fh0qdq2';
  const intraday=series([point(22,57.9,10),point(22,57.65,14)],'PETR4');intraday[1]='/g/12fh0qdq2';
  const foreign=series([point(2,900),point(20,901)],'WEGE3');
  const wrongCurrency=series([point(2,800),point(20,801)],'PETR4');wrongCurrency[2]='USD';
  (monthly[3] as any[][]).push([foreign,wrongCurrency]);
  const html=script([q,monthly,intraday]);
  assert.deepEqual(parseGoogleFinance(html,'PETR4','1d').history.map(p=>p.close),[57.9,57.65]);
  assert.deepEqual(parseGoogleFinance(html,'PETR4','5d').history.map(p=>p.close),[56.2,57,56.8,57.2,57.65]);
  assert.deepEqual(parseGoogleFinance(html,'PETR4','1mo').history.map(p=>p.close),[55.1,56.2,57,56.8,57.2,57.65]);
 });
 it('does not substitute missing, invalid or zero quote values',()=>{
  for(const price of [null,0,-2,Infinity])assert.throws(()=>parseGoogleFinance(script([quote('WEGE3',price)]),'WEGE3','1mo'));
 });
 it('extracts the real requested monthly series and applies the source timezone',()=>{
  const result=parseGoogleFinance(page(),'WEGE3','1mo');assert.equal(result.history.length,6);assert.equal(result.history[0].close,48);assert.equal(result.history[0].date,'2026-10-01T19:30:00.000Z');
  assert.equal(result.metrics.previousCloseCents,4521);assert.equal(result.metrics.volume,null);
 });
 it('separates intraday data and derives 5 sessions from actual daily observations',()=>{
  assert.equal(parseGoogleFinance(page(),'WEGE3','1d').history.length,2);
  const five=parseGoogleFinance(page(),'WEGE3','5d');assert.equal(five.history.length,5);assert.equal(five.history[0].close,49);
 });
 it('does not absorb a different ticker nested inside the target history',()=>{
  const foreign=series([point(2,900),point(20,901)],'PETR4');
  const own=series([point(1,48),point(20,44.7),foreign]);
  const result=parseGoogleFinance(script([quote(),own]),'WEGE3','1mo');
  assert.deepEqual(result.history.map(p=>p.close),[48,44.7]);
 });
 it('also prunes foreign exchanges and incompatible currencies inside history',()=>{
  const foreign=[['AAPL','NASDAQ'],'/m/apple','USD',[[[1],[point(2,900),point(20,901)]]]];
  const wrongCurrency=[['WEGE3','BVMF'],'/m/company','USD',[[[1],[point(2,800),point(20,801)]]]];
  const result=parseGoogleFinance(script([quote(),series([point(1,48),point(20,44.7),foreign,wrongCurrency])]),'WEGE3','1mo');
  assert.deepEqual(result.history.map(p=>p.close),[48,44.7]);
 });
 it('prefers recent history over a longer stale series for the same ticker',()=>{
  const old=series([[[2025,9,1,16,0,null,null,[-10800]],[80]],[[2025,10,11,16,0,null,null,[-10800]],[90]]]);
  const recent=series([point(1,48),point(20,44.7)]);
  const result=parseGoogleFinance(script([quote(),old,recent]),'WEGE3','1mo');assert.deepEqual(result.history.map(p=>p.close),[48,44.7]);
 });
 it('rejects malformed dates and never fabricates a monthly history from one day',()=>{
  const data=script([quote(),series([point(22,45,10),point(22,44,14),[[2026,2,31,12,0,null,null,[-10800]],[46]]])]);
  assert.equal(parseGoogleFinance(data,'WEGE3','1mo').history.length,0);assert.equal(parseGoogleFinance(data,'WEGE3','1d').history.length,2);
 });
 it('treats unsupported devices, challenges and missing schema as unavailable',()=>{
  for(const html of ['<title>Unsupported</title>','<title>Before you continue to Google</title>','<form id="captcha-form"></form>','<h1>Price 44.68</h1>'])assert.throws(()=>parseGoogleFinance(html,'WEGE3','1mo'));
 });
 it('fetches only the fixed public quote URL without executing or returning remote markup',async()=>{
  let requestUrl='',options:any;
  const fetcher=async(url:any,init:any)=>{requestUrl=String(url);options=init;return new Response(page(),{headers:{'Content-Type':'text/html; charset=utf-8'}});};
  const result=await fetchGoogleFinance('WEGE3','1mo',fetcher as typeof fetch);
  assert.equal(requestUrl,'https://www.google.com/finance/quote/WEGE3:BVMF?hl=pt-BR');assert.equal(options.redirect,'manual');
  assert.equal(result.source,'google-finance');assert.equal(JSON.stringify(result).includes('<script>'),false);
 });
 it('does not follow consent redirects or retry rate limits and blocked requests',async()=>{
  for(const status of [302,403,429]){let calls=0;await assert.rejects(fetchGoogleFinance('WEGE3','1mo',(async()=>{calls++;return new Response('',{status,headers:{Location:'https://consent.google.com/'}});}) as typeof fetch));assert.equal(calls,1);}
 });
 it('bounds the response size and rejects non-HTML content',async()=>{
  for(const headers of [{'Content-Type':'application/json'},{'Content-Type':'text/html','Content-Length':'5000000'}])await assert.rejects(fetchGoogleFinance('WEGE3','1mo',(async()=>new Response('{}',{headers})) as typeof fetch));
 });
});
