const CACHE_NAME = 'dayd-v5'; // 버전을 올려서 갱신 유도
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // 즉시 활성화
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    // 네트워크에서 먼저 가져오고, 실패하면 캐시 사용 (Network First)
    fetch(e.request).catch(() => caches.match(e.request))
  );
});