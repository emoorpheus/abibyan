const CACHE = 'abibyan-v71-voice-fix-a59d16363a';
const VOICE_CACHE = 'abibyan-voice-60cb3bec76';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== VOICE_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.url.includes('voice1.txt') || r.url.includes('voice2.txt')) {
    e.respondWith(
      caches.open(VOICE_CACHE).then((vc) => vc.match(r, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(r).then((res) => {
          if (res && res.status === 200) { const copy = res.clone(); vc.put(r, copy); }
          return res;
        });
      })).catch(() => fetch(r.url))
    );
    return;
  }
  const isHtml = r.mode === 'navigate' || r.url.endsWith('index.html') || r.url.endsWith('/') || (r.headers.get('accept') && r.headers.get('accept').includes('text/html'));
  const req = isHtml ? new Request(r.url, { cache: 'no-cache' }) : r;
  e.respondWith(fetch(req).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true })));
});
