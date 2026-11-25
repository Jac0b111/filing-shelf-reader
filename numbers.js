'use strict';
const fourDigits=new Intl.NumberFormat('zh-CN',{maximumSignificantDigits:4,useGrouping:false});
const baseCurrency={CNY:'元',RMB:'元','人民币':'元',USD:'美元',HKD:'港元'};

function reportNumber(value,kind,currency){
  if(value==null||value===''||!Number.isFinite(Number(value)))return '—';
  // Round before picking a scale so 9,999.5 displays as 1万.
  const rounded=Number(fourDigits.format(value))+0;
  const base=baseCurrency[currency]||(currency==='原表口径'?'':currency||'');
  if(kind==='percent')return fourDigits.format(rounded)+'%';
  if(kind==='ratio'||kind==='天'||kind==='次')return fourDigits.format(rounded)+(kind==='ratio'?'':kind);
  if(kind==='perShare')return fourDigits.format(rounded)+base;
  const magnitude=Math.abs(rounded);
  const [scale,unit]=magnitude>=1e12?[1e12,'万亿']:magnitude>=1e8?[1e8,'亿']:magnitude>=1e4?[1e4,'万']:[1,''];
  const suffix=kind==='shares'?'股':unit?'':base;
  return fourDigits.format(rounded/scale)+unit+suffix;
}
