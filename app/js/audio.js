/* مشغّل التلاوة: يشغّل قائمة آيات بالتتابع بصوت القارئ المختار.
   آيات ورد الحفظ تُنزَّل وتُحفظ على الجهاز فيصير التكرار فوريًا ويعمل بلا إنترنت بعد أول مرة. */
(function () {
  'use strict';
  const App = window.App, U = App.util, M = App.meta;
  const A = App.audio = {};

  const el = new Audio();
  el.preload = 'auto';
  const pre = new Audio();          // تسخين الآية التالية فقط (لا يُشغَّل)
  pre.preload = 'auto';
  pre.muted = true;

  const blobs = {};                 // مفتاح الآية -> رابط محلي
  let job = null;                   // المهمة الجارية
  let watch = null;

  const file = (s, a) => U.pad(s, 3) + U.pad(a, 3);
  const keyOf = (r, s, a) => r.folder + '/' + file(s, a);
  const remote = (r, s, a) => App.config.audio.primary + r.folder + '/' + file(s, a) + '.mp3';
  const remoteAlt = (r, s, a) => (r.alt ? App.config.audio.fallback + r.alt + '/' + M.globalIndex(s, a) + '.mp3' : null);

  // تنزيل آية وحفظها على الجهاز (يعيد الرابط المحلي أو null عند التعذّر)
  function cache(r, s, a) {
    const k = keyOf(r, s, a);
    if (blobs[k]) return Promise.resolve(blobs[k]);
    return App.idb.get('audio', k).then(rec => {
      if (rec && rec.blob) return rec.blob;
      return fetch(remote(r, s, a)).then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.blob();
      }).then(blob => { App.idb.set('audio', k, { blob, at: Date.now() }); return blob; });
    }).then(blob => { blobs[k] = URL.createObjectURL(blob); return blobs[k]; }).catch(() => null);
  }
  A.prefetch = (reciterId, list) => {
    const r = App.reciter(reciterId);
    return Promise.all(list.map(it => cache(r, it.s, it.a)));
  };
  // حذف الملفات الصوتية الأقدم من ٣٠ يومًا
  A.prune = () => App.idb.prune('audio', rec => !rec || !rec.at || Date.now() - rec.at > 30 * 864e5);

  function state(playing) { if (job && job.opts.onState) job.opts.onState(playing); }
  function fail(j, why) {
    if (job !== j) return;
    job = null; clearTimeout(watch);
    try { el.pause(); } catch (e) {}
    if (j.opts.onState) j.opts.onState(false);
    if (j.opts.onError) j.opts.onError(why);
  }
  function arm(j) {
    clearTimeout(watch);
    watch = setTimeout(() => { if (job === j && (el.paused || el.readyState < 3)) fail(j, 'slow'); }, 25000);
  }
  function start(j, src) {
    if (el.src !== src || el.error) el.src = src; else { try { el.currentTime = 0; } catch (e) {} }
    el.defaultPlaybackRate = j.opts.rate || 1;
    el.playbackRate = j.opts.rate || 1;
    arm(j);
    const p = el.play();
    if (p && p.catch) p.catch(err => { if (job === j && err && err.name === 'NotAllowedError') fail(j, 'blocked'); });
  }
  function playItem(j) {
    if (job !== j) return;
    const it = j.list[j.i], r = App.reciter(j.opts.reciter);
    j.triedAlt = false;
    j.triedAlt2 = false;
    if (j.opts.onItem) j.opts.onItem(j.i, it);
    start(j, blobs[keyOf(r, it.s, it.a)] || remote(r, it.s, it.a));
    const nx = j.list[j.i + 1];
    if (nx && !blobs[keyOf(r, nx.s, nx.a)]) { try { pre.src = remote(r, nx.s, nx.a); } catch (e) {} }
    media(j, it, r);
  }

  el.addEventListener('playing', () => { clearTimeout(watch); state(true); });
  el.addEventListener('pause', () => { if (job && !el.ended) state(false); });
  el.addEventListener('ended', () => {
    const j = job;
    if (!j) return;
    j.total += isFinite(el.duration) ? el.duration : 0;
    if (j.i + 1 < j.list.length) { j.i++; playItem(j); return; }
    job = null;
    if (j.opts.onState) j.opts.onState(false);
    if (j.opts.onDone) j.opts.onDone(j.total);
  });
  el.addEventListener('error', () => {
    const j = job;
    if (!j) return;
    const it = j.list[j.i], r = App.reciter(j.opts.reciter);
    if (!j.triedAlt) {
      j.triedAlt = true;
      // إن فشل الرابط المحلي نجرّب الأصلي، ثم المصدر الاحتياطي
      const first = remote(r, it.s, it.a), alt = remoteAlt(r, it.s, it.a);
      const next = el.src !== first ? first : alt;
      if (next) { start(j, next); return; }
    } else if (!j.triedAlt2) {
      j.triedAlt2 = true;
      const alt = remoteAlt(r, it.s, it.a);
      if (alt && el.src !== alt) { start(j, alt); return; }
    }
    fail(j, navigator.onLine === false ? 'offline' : 'network');
  });

  function media(j, it, r) {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'سورة ' + M.name(it.s) + ' — الآية ' + it.a,
        artist: r.name,
        album: App.config.name
      });
    } catch (e) {}
  }
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => A.resume());
      navigator.mediaSession.setActionHandler('pause', () => A.pause());
    } catch (e) {}
  }

  /* list: [{s, a}]  —  opts: { reciter, rate, onItem(i, item), onDone(totalSeconds), onError(why), onState(playing) } */
  A.play = (list, opts) => {
    A.stop();
    if (!list || !list.length) return null;
    job = { list, i: 0, opts: opts || {}, total: 0 };
    playItem(job);
    return job;
  };
  A.stop = () => {
    const j = job;
    job = null; clearTimeout(watch);
    try { el.pause(); } catch (e) {}
    if (j && j.opts.onState) j.opts.onState(false);
  };
  A.pause = () => { if (job) { try { el.pause(); } catch (e) {} } };
  A.resume = () => { if (job) { const p = el.play(); if (p && p.catch) p.catch(() => {}); } };
  A.active = () => !!job;
  A.paused = () => !!job && el.paused;
  A.setRate = r => { el.defaultPlaybackRate = r; el.playbackRate = r; if (job) job.opts.rate = r; };
})();
