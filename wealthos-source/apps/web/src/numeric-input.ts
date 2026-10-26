export interface NumericOptions { decimals:number; allowNegative:boolean; }

/** Monetary fields keep the last two digits as cents while the user types. */
export function moneyMaskDigits(raw:string,allowNegative=false):string|null {
  if(!new RegExp('^'+(allowNegative?'-?':'')+'[0-9.,]*$').test(raw))return null;
  if(raw==='')return '';
  const negative=raw.startsWith('-');
  const digits=raw.replace(/\D/g,'').replace(/^0+(?=\d)/,'')||'0';
  if(digits.length>14)return null;
  const padded=digits.padStart(3,'0');
  const whole=padded.slice(0,-2).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return (negative?'-':'')+whole+','+padded.slice(-2);
}

/** Model writes are whole reais; input events are cent-based. */
export function moneyMaskModel(raw:string,allowNegative=false):string|null {
  if(raw==='')return '';
  const negative=raw.startsWith('-');
  if(negative&&!allowNegative)return null;
  const unsigned=negative?raw.slice(1):raw;
  if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{0,2})?$/.test(unsigned))return null;
  const [whole,fraction='']=unsigned.replace(/\./g,'').split(',');
  return moneyMaskDigits((negative?'-':'')+whole+fraction.padEnd(2,'0'),allowNegative);
}

export function moneyMaskPaste(raw:string,allowNegative=false):string|null {
  let text=raw.trim();if(text.startsWith('R$'))text=text.slice(2).trim();
  if(/^-?\d+$/.test(text))return moneyMaskDigits(text,allowNegative);
  if(/^-?\d{1,3}(?:\.\d{3})+$/.test(text))return moneyMaskModel(text,allowNegative);
  if(/^-?(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(text))return moneyMaskModel(text,allowNegative);
  return null;
}

/** Editing uses a comma decimal separator; invalid text is rejected as a whole. */
export function numericEdit(raw:string,options:NumericOptions):string|null {
  if(raw==='')return '';
  if(raw==='-')return options.allowNegative?'-':null;
  const value=raw.replace('.',',');
  const precision=Math.max(0,Math.min(6,Math.floor(options.decimals)));
  if(!new RegExp('^'+(options.allowNegative?'-?':'')+'\\d*'+(precision?'(?:,\\d{0,'+precision+'})?':'')+'$').test(value))return null;
  const negative=value.startsWith('-'),unsigned=negative?value.slice(1):value;
  if(!unsigned)return null;
  const [integer,fraction]=unsigned.split(',');
  const whole=(integer||'0').replace(/^0+(?=\d)/,'');
  if(whole.length>12)return null;
  return (negative?'-':'')+whole+(fraction!==undefined?','+fraction:'');
}

/** Accept complete BRL amounts such as R$ 1.234,56, never strip arbitrary text. */
export function numericPaste(raw:string,options:NumericOptions):string|null {
  let value=raw.trim();
  if(value.startsWith('R$'))value=value.slice(2).trim();
  if(value.includes('.')&&value.includes(',')){
    if(!/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(value))return null;
    value=value.replace(/\./g,'');
  }else if(/^-?\d{1,3}(?:\.\d{3})+$/.test(value)){
    // A dot followed by exactly three digits is a Brazilian thousands group.
    value=value.replace(/\./g,'');
  }
  return numericEdit(value,options);
}
