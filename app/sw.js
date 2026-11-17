/* عامل الخدمة: يجعل التطبيق يفتح بلا إنترنت (في المتصفح / PWA) */
const SHELL = 'hifzapp-shell-v2';
const FONTS = 'hifzapp-fonts-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/fonts.css',
  'data/quran-bundle.js', 'data/hadith-bundle.js',
  'fonts/f0.woff2', 'fonts/f1.woff2', 'fonts/f2.woff2', 'fonts/f3.woff2', 'fonts/f4.woff2', 'fonts/f5.woff2', 'fonts/f6.woff2', 'fonts/f7.woff2',
  'fonts/f8.woff2', 'fonts/f9.woff2', 'fonts/f10.woff2', 'fonts/f11.woff2', 'fonts/f12.woff2', 'fonts/f13.woff2', 'fonts/f14.woff2', 'fonts/f15.woff2',
  'js/config.js', 'js/legal.js', 'js/util.js', 'js/store.js', 'js/quran-meta.js', 'js/quran-data.js', 'js/audio.js',
  'js/hifz.js', 'js/prayer.js', 'js/adhkar-data.js', 'js/hadith.js', 'js/reminders.js', 'js/ui-core.js',
  'js/ui-home.js', 'js/ui-session.js', 'js/ui-quran.js', 'js/ui-adhkar.js', 'js/ui-prayer.js',
  'js/ui-settings.js', 'js/app.js', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL)
    .then(c => Promise.allSettled(FILES.map(f => c.add(f))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('hifzapp-') && k !== SHELL && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // الشبكة أولًا (لتصل التحديثات فورًا) ثم النسخة المحفوظة عند انقطاع الإنترنت
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});

self.addEventListener('notificationclick', e => {
  const route = e.notification.data && e.notification.data.route;
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    if (list.length) { list[0].focus(); if (route) list[0].postMessage({ type: 'open-route', route }); return null; }
    return self.clients.openWindow('./index.html' + (route || ''));
  }));
});
