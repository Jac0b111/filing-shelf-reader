const glyphs={
 overview:'<path d="M3 20h18M5 16v-5m6 5V5m6 11V8"/>',
 income:'<path d="M5 3h11l3 3v15H5zM8 9h7m-7 4h8m-8 4h5"/>',
 balance:'<path d="M12 3v17m-5 1h10M3 7l17-2M6 7l-3 7h6L6 7zm12-1-3 7h6l-3-7z"/>',
 cash:'<path d="M3 7h16l-4-4m6 14H5l4 4M19 7l-4 4M5 17l4-4"/>',
 book:'<path d="M3 5c3-1 6-.5 9 1.4C15 4.5 18 4 21 5v14c-3-1-6-.5-9 1.4C9 18.5 6 18 3 19z"/><path d="M12 7v13"/>',
 shuffle:'<path d="M3 5h2.8c3.2 0 4.4 3.8 6.4 7.2S15.2 18 18.2 18H21m-3-3 3 3-3 3M3 18h2.8c1.6 0 3-1.3 4.2-3.3m3.5-6.6c1.5-2.3 3-3.1 4.7-3.1H21m-3-3 3 3-3 3"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.3"/><path d="m15.3 15.3 4.7 4.7"/>', arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',next:'<path d="m9 6 6 6-6 6"/>',back:'<path d="m15 5-7 7 7 7"/>',
 filter:'<path d="M3 7h5m5 0h8M3 17h10m5 0h3"/><circle cx="10" cy="7" r="2.4"/><circle cx="15.5" cy="17" r="2.4"/>',bookmark:'<path d="M6 4h12v17l-6-4-6 4z"/>',check:'<path d="m5 12 4 4L19 6"/>',external:'<path d="M10 5H5v14h14v-6M13 4h7v7m0-7-9 9"/>',expand:'<path d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>'};
function icon(name){return '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">'+glyphs[name]+'</svg>'}
const mark='<svg viewBox="0 0 35 31" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="2.5"><path d="M3 4v22h7V4zM14 4v22h5V4zM22 6l5-1 5 20-5 1z"/></g></svg>';
document.querySelector('#brand').innerHTML=mark+'<span>财报书架</span>';
function engraving(canvas){
 const w=340,h=390,ctx=canvas.getContext('2d');canvas.width=w;canvas.height=h;
 ctx.strokeStyle=getComputedStyle(canvas).color;ctx.lineWidth=1.05;
 const large=canvas.parentElement.classList.contains('art');
 if(canvas.closest('.theme-apple')){
   ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--brown').trim();
   ctx.translate(w*.50,h*.52);ctx.rotate(-.48);ctx.lineWidth=1.10;
   for(let i=0;i<46;i++){const a=36+2.5*i,b=14+i*1.7;
    ctx.beginPath();ctx.ellipse(-12+i*.47,18-i*.72,a,b,0,0,2*Math.PI);ctx.stroke();
   }
   return;
 }
 if(canvas.closest('.theme-maotai')){
   ctx.lineWidth=1.4;for(let i=0;i<34;i++){ctx.beginPath();const y=115+i*4;
    ctx.moveTo(-15,y+46);ctx.bezierCurveTo(72,y-6,85,y+67,169,y+2);ctx.bezierCurveTo(238,y-59,268,y+7,355,y-68);ctx.stroke();
   }
   return;
 }
 ctx.translate(w*(large?.55:.60),h*(large?.5:.56));ctx.rotate(large?-.47:-.43);
 for(let i=0;i<54;i++){const r=19+i*2.2;ctx.beginPath();
  for(let j=0;j<=360;j++){const t=j*Math.PI/180, wave=1+.17*Math.sin(t*3+i*.012)+.079*Math.cos(t*5-i*.035),x=r*wave*Math.cos(t)*(large?1.32:1.80),y=r*wave*Math.sin(t)*.70;
   if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y)}ctx.closePath();ctx.stroke()}
}
