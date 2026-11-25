import {getDocument,GlobalWorkerOptions} from './pdfjs/pdf.min.mjs';
GlobalWorkerOptions.workerSrc=new URL('./pdfjs/pdf.worker.min.mjs',import.meta.url).href;
let current;
const targets={
 balance:/^(?:[\d一二三四五六七八九、.（）()]+)?合并资产负债表$/,
 cash:/^(?:[\d一二三四五六七八九、.（）()]+)?合并(?:年初[到至]报告期末)?现金流量表$/,
 income:/^(?:[\d一二三四五六七八九、.（）()]+)?合并(?:年初[到至]报告期末)?利润表$/,
 overview:/^(?:[\d一二三四五六七八九、.（）()]+)?主要(?:会计数据和财务指标|财务数据|会计数据及财务指标)$/
};
export async function readIssuer(box,url,kind,knownPage){
 const message=box.querySelector('output'), controls=box.querySelector('.pdf-controls'),canvas=box.querySelector('canvas');
 const active=()=>box.isConnected&&box.dataset.url===url;
 if(current?.url!==url){
  current?.task.destroy().catch(()=>{});
  const task=getDocument({url,isEvalSupported:false,cMapUrl:new URL('./pdfjs/cmaps/',import.meta.url).href,cMapPacked:true});
  current={url,task,pages:new Map()};
 }
 const file=current,doc=await file.task.promise;
 if(!active())return;
 let pageNumber=knownPage||file.pages.get(kind);
 if(!pageNumber){
  for(let n=1;n<=doc.numPages&&active();n++){
   message.textContent='正在原文中定位报表，第 '+n+' 页';
   const page=await doc.getPage(n),text=await page.getTextContent();
   let line='',found=false;
   for(const item of text.items){
    line+=(item.str||'').replace(/\s+/g,'');
    if(targets[kind].test(line)&&item.hasEOL){found=true;break;}
    if(item.hasEOL)line='';
   }
   if(found||targets[kind].test(line)){pageNumber=n;file.pages.set(kind,n);break;}
  }
 }
 if(!active())return;
 const located=Boolean(pageNumber);pageNumber||=1;
 async function draw(n){
  if(!active())return;
  controls.querySelectorAll('button').forEach(b=>b.disabled=true);
  const page=await doc.getPage(n);if(!active())return;
  const viewport=page.getViewport({scale:Math.min(2.4,(box.clientWidth||360)*2/page.getViewport({scale:1}).width)});
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  if(!active())return;
  canvas.hidden=false;controls.hidden=false;pageNumber=n;
  message.textContent=(located?'':'未定位到该表，可翻页。')+'原文第 '+n+' / '+doc.numPages+' 页';
  controls.children[0].disabled=n===1;controls.children[1].disabled=n===doc.numPages;
 }
 await draw(pageNumber);
 controls.children[0].onclick=()=>draw(pageNumber-1);
 controls.children[1].onclick=()=>draw(pageNumber+1);
}
