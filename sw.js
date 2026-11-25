const ownScope = self.registration.scope;
const prefix = 'filing-shelf-' + new URL(ownScope).pathname + '-';
const version = prefix + '89dd196dc0f74112';
const personal = 'filing-personal-' + 'ca4f545521f707b841057a90c05b2cb12ab58207013bc9f7789ed405c4ea45c2';
const files = ['./','./index.html','./catalog.js','./art.js','./numbers.js','./reader.js','./reader.css','./ios.css','./statements.js','./install.js','./icon.png','./icon-192.png','./icon-512.png','./manifest.webmanifest','./library.html','./library-meta.json','./library.js','./info.css','./sources.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(version).then(cache=>cache.addAll(files)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==version).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||!request.url.startsWith(ownScope))return;
 const relative=request.url.slice(ownScope.length);
 if(relative.startsWith('personal/')){
  event.respondWith(caches.open(personal).then(async cache=>{
   if(await cache.match(new URL('personal/ready',ownScope))){
    const hit=await cache.match(request,{ignoreSearch:true});if(hit)return hit;
   }
   return request.mode==='navigate'?Response.redirect(new URL('library.html',ownScope)):Response.error();
  }));return;
 }
 event.respondWith(caches.open(version).then(async cache=>{
  const hit=await cache.match(request);if(hit)return hit;
  const response=await fetch(request);
  if(response.ok&&/^data\/\d+\.js(?:\?|$)/.test(relative)){
   try{await cache.put(request,response.clone());}catch{}
  }
  return response;
 }));
});
