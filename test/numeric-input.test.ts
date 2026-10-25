import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {numericEdit,numericPaste,moneyMaskDigits,moneyMaskModel,moneyMaskPaste} from '../wealthos-source/apps/web/src/numeric-input';

const money={decimals:2,allowNegative:false};
test('numeric editor replaces leading zeros while preserving decimal cents and optional negative balances',()=>{
  assert.equal(numericEdit('00123',money),'123');
  assert.equal(numericEdit('00,05',money),'0,05');
  assert.equal(numericEdit(',5',money),'0,5');
  assert.equal(numericEdit('1.25',money),'1,25');
  assert.equal(numericEdit('-00,50',{...money,allowNegative:true}),'-0,50');
  assert.equal(numericEdit('-1',money),null);
  assert.equal(numericEdit('',money),'');
});
test('numeric editor rejects invalid text and excess precision without stripping characters or rounding',()=>{
  for(const value of ['1e3','12abc','12%','+10','1/2','1,2,3','1.2.3','1,234','Infinity','１２'])assert.equal(numericEdit(value,money),null,value);
  assert.equal(numericEdit('0,000001',{decimals:6,allowNegative:false}),'0,000001');
  assert.equal(numericEdit('0,0000001',{decimals:6,allowNegative:false}),null);
  assert.equal(numericEdit('2,1',{decimals:0,allowNegative:false}),null);
});
test('paste accepts explicit BRL grouping and rejects malformed/exponential values as a whole',()=>{
  assert.equal(numericPaste('R$ 1.234,56',money),'1234,56');
  assert.equal(numericPaste(' 1.234.567,89 ',money),'1234567,89');
  assert.equal(numericPaste('1.234',money),'1234');
  assert.equal(numericPaste('0,05',money),'0,05');
  for(const value of ['1e3','12abc','R$ 1,234.56','1.23,45','R$ -2,00','12%','1 000,00'])assert.equal(numericPaste(value,money),null,value);
  assert.equal(numericPaste('R$ -1.234,56',{...money,allowNegative:true}),'-1234,56');
});
test('actual numeric directive handlers keep the ngModel callback and caret consistent',()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  execFileSync(process.execPath,['--import','tsx','test/fixtures/numeric-input.ts'],{
    cwd:root,env:{...process.env,TSX_TSCONFIG_PATH:'wealthos-source/apps/web/tsconfig.json'},timeout:15000,stdio:'pipe',
  });
});
test('money mask treats typed digits as cents and validates pasted BRL',()=>{
  assert.equal(moneyMaskDigits('232323'),'2.323,23');
  assert.equal(moneyMaskDigits('00001'),'0,01');
  assert.equal(moneyMaskDigits('-1234',true),'-12,34');
  assert.equal(moneyMaskDigits('1a'),null);
  assert.equal(moneyMaskDigits('12%',false),null);
  assert.equal(moneyMaskModel('2323,23'),'2.323,23');
  assert.equal(moneyMaskModel('0'),'0,00');
  assert.equal(moneyMaskModel('-12,34',true),'-12,34');
  assert.equal(moneyMaskPaste('232323'),'2.323,23');
  assert.equal(moneyMaskPaste('R$ 1.234,56'),'1.234,56');
  assert.equal(moneyMaskPaste('1e3'),null);
});
