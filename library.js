'use strict';
(async()=>{
 const input=document.querySelector('#file'), status=document.querySelector('#message'), open=document.querySelector('#open');
 try {
  const meta=await (await fetch('library-meta.json')).json();
  if(!('serviceWorker' in navigator && 'DecompressionStream' in window))throw Error('请用近期版本的 Safari 或 Chrome 打开。');
  await navigator.serviceWorker.register('./sw.js');
  await navigator.serviceWorker.ready;
  if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  const cache=await caches.open('filing-personal-'+meta.sha256);
  const marker=new URL('./personal/ready',location.href).href;
  open.hidden=!(await cache.match(marker));
  status.textContent=open.hidden?'可导入 '+meta.asof+' 的五年快照。':'这台设备已保存完整资料库。';
  input.disabled=false;
  input.onchange=async()=>{
   const file=input.files[0];if(!file)return;
   input.disabled=true;
   try {
    if(file.size!==meta.size)throw Error('文件大小不匹配，请选择该版完整的 .shelf 文件。');
    status.textContent='正在核对文件…';
    const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
    const hex=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    if(hex!==meta.sha256)throw Error('文件与本版资料库不一致，请重新传输。');
    const length=new DataView(await file.slice(0,4).arrayBuffer()).getUint32(0,true);
    const index=Object.entries(JSON.parse(await file.slice(4,4+length).text()));
    const types={js:'text/javascript',css:'text/css',html:'text/html',png:'image/png'};
    let i=0;
    for(const [name,[offset,bytes]] of index){
     const at=4+length+offset;
     const stream=file.slice(at,at+bytes).stream().pipeThrough(new DecompressionStream('gzip'));
     const data=new Response(stream,{headers:{'Content-Type':types[name.split('.').pop()]||'application/octet-stream'}});
     await cache.put(new URL('./personal/'+name,location.href),data);
     status.textContent='正在保存资料库 '+Math.round(++i/index.length*100)+'%';
    }
    await cache.put(marker,new Response(meta.asof));open.hidden=false;status.textContent='完整资料库已保存在这台设备上。';
   } catch(error){status.textContent=error.name==='QuotaExceededError'?'设备存储空间不足，请腾出空间后重新导入。':error.message;}
   finally{input.disabled=false;input.value='';}
  };
 }catch(error){status.textContent=error.message;}
})();
