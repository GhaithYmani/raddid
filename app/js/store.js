/* التخزين المحلي: حالة التطبيق في localStorage، والبيانات الكبيرة (نص المصحف، الصوت) في IndexedDB */
(function () {
  'use strict';
  const App = window.App;
  const KEY = App.config.storageKey;

  function defaults() {
    return {
      v: 1,
      onboarded: false,
      settings: { theme: 'auto', digits: 'arabic', quranScale: 1, time24: false, hijriOffset: 0 },
      // gap: مهلة الترديد بعد كل استماع كنسبة من طول المقطع (0 = بدون)
      audio: { reciter: 'husary', rate: 1, gap: 1, autoNext: true },
      // order: asc بترتيب المصحف، desc من قصار السور صعودًا
      plan: { order: 'desc', perDay: 3, repeats: 10, balance: true },
      hifz: {
        pointer: { s: 114, a: 1 },
        portions: [],
        today: null,
        streak: { count: 0, best: 0, last: null },
        farCursor: 0,
        log: {}
      },
      quran: { last: null, bookmarks: [] },
      adhkar: { day: null, progress: {}, done: {}, tasbih: { count: 0, target: 33, phrase: 0, total: 0 } },
      prayer: {
        loc: null,
        method: 'MWL',
        asr: 1,
        adjust: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
      },
      reminders: {
        enabled: false,
        morning: { on: true, time: '06:30' },
        evening: { on: true, time: '17:00' },
        hifz: { on: true, time: '20:00' },
        prayers: { on: false }
      }
    };
  }

  const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
  // دمج عميق: المحفوظ يغلب، مع الإبقاء على أي مفاتيح جديدة في الافتراضي
  function merge(base, saved) {
    if (!isObj(saved)) return base;
    Object.keys(saved).forEach(k => {
      base[k] = isObj(base[k]) && isObj(saved[k]) ? merge(base[k], saved[k]) : saved[k];
    });
    return base;
  }

  let state;
  try { state = merge(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { state = defaults(); }

  let t = null;
  let dead = false;   // بعد الحذف أو الاسترجاع: لا تكتب الحالة القديمة فوق الجديدة عند إغلاق الصفحة
  function flush() {
    clearTimeout(t);
    if (dead) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  App.store = {
    state,
    save() { clearTimeout(t); t = setTimeout(flush, 120); },
    flush,
    exportJson() { flush(); return JSON.stringify({ app: 'hifz-app', exportedAt: new Date().toISOString(), data: state }, null, 2); },
    importJson(text) {
      const j = JSON.parse(text);
      const data = j && j.data ? j.data : j;
      if (!isObj(data) || !isObj(data.hifz) || !Array.isArray(data.hifz.portions)) throw new Error('ملف غير صالح');
      clearTimeout(t);
      localStorage.setItem(KEY, JSON.stringify(merge(defaults(), data)));
      dead = true;
    },
    wipe() { dead = true; clearTimeout(t); try { localStorage.removeItem(KEY); } catch (e) {} }
  };

  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

  // ---------- IndexedDB (مفتاح/قيمة) ----------
  let dbp = null;
  function db() {
    if (!dbp) {
      dbp = new Promise((res, rej) => {
        if (!window.indexedDB) { rej(new Error('IndexedDB غير متاح')); return; }
        const rq = indexedDB.open('hifzapp', 1);
        rq.onupgradeneeded = () => {
          const d = rq.result;
          ['kv', 'audio'].forEach(n => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n); });
        };
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
    }
    return dbp;
  }
  const req = (store, mode, fn) => db().then(d => new Promise((res, rej) => {
    const tx = d.transaction(store, mode);
    const r = fn(tx.objectStore(store));
    tx.oncomplete = () => res(r && r.result);
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  }));

  App.idb = {
    get: (store, key) => req(store, 'readonly', os => os.get(key)).catch(() => undefined),
    set: (store, key, val) => req(store, 'readwrite', os => os.put(val, key)).catch(() => undefined),
    del: (store, key) => req(store, 'readwrite', os => os.delete(key)).catch(() => undefined),
    // حذف السجلات التي يعيد لها الاختبار true
    prune: (store, test) => db().then(d => new Promise(res => {
      const tx = d.transaction(store, 'readwrite');
      const cur = tx.objectStore(store).openCursor();
      cur.onsuccess = () => {
        const c = cur.result;
        if (!c) return;
        try { if (test(c.value, c.key)) c.delete(); } catch (e) {}
        c.continue();
      };
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    })).catch(() => undefined)
  };
})();
