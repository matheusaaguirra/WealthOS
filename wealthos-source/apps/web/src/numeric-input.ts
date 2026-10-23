export interface NumericOptions { decimals:number; allowNegative:boolean; }

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
