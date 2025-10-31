const CACHE = 'mentor-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith((async ()=>{
    try{
      const resp = await fetch(e.request);
      if(e.request.url.includes('/api/kb')){
        const clone = resp.clone();
        const data = await clone.json().catch(()=>null);
        if(data) caches.open(CACHE).then(c=>c.put('/api/kb', new Response(JSON.stringify(data), {headers:{'Content-Type':'application/json'}})));
      }
      return resp;
    }catch{
      const cached = await caches.match(e.request);
      if(cached) return cached;
      if(e.request.url.includes('/api/kb')){
        const kbCached = await caches.match('/api/kb');
        if(kbCached) return kbCached;
      }
      throw new Error('offline and not cached');
    }
  })());
});
