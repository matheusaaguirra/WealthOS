/* Only the public offline page is cached. Account pages and APIs always use the network. */
const CACHE='wealthos-offline-v2';
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/offline.html')).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('wealthos-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||event.request.mode!=='navigate'||url.origin!==self.location.origin||/^\/(api|auth)(\/|$)/.test(url.pathname))return;
  event.respondWith(fetch(event.request).catch(async()=>{
    const cache=await caches.open(CACHE);
    return await cache.match('/offline.html')||Response.error();
  }));
});
