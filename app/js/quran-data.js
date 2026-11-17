/* نص المصحف: لا يُكتب أي نص قرآني يدويًا في التطبيق — كله يأتي من مصدر موثّق ويُتحقَّق من اكتماله.
   ترتيب التحميل: (١) حزمة مضمّنة مع التطبيق  (٢) نسخة محفوظة على الجهاز  (٣) تنزيل من الشبكة مرة واحدة */
(function () {
  'use strict';
  const App = window.App, U = App.util, M = App.meta;
  const Q = App.quran = { ready: false, error: null, data: null, source: '' };
  let loading = null;
  const waiters = [];

  const BASM = 'بسم الله الرحمن الرحيم';
  const bare = s => s.replace(U.MARKS, '').replace(/[ٱأإآ]/g, 'ا');

  // بعض المصادر تُلحق البسملة بأول آية من كل سورة — نفصلها لتُعرض في سطر مستقل
  function stripBasmala(text) {
    const w = text.split(' ');
    if (w.length > 4 && bare(w.slice(0, 4).join(' ')) === BASM) return w.slice(4).join(' ');
    return text;
  }

  // تحويل استجابة alquran.cloud إلى صيغة مضغوطة مع التحقق من عدد آيات كل سورة
  function fromApi(j) {
    const surahs = j && j.data && j.data.surahs;
    if (!Array.isArray(surahs) || surahs.length !== 114) throw new Error('بنية بيانات المصحف غير متوقعة');
    const out = { v: 1, src: 'alquran.cloud/quran-uthmani', at: Date.now(), s: [] };
    for (let i = 0; i < 114; i++) {
      const n = i + 1, ay = surahs[i].ayahs;
      if (!Array.isArray(ay) || ay.length !== M.count(n)) throw new Error('عدد آيات سورة ' + M.name(n) + ' غير مطابق');
      const t = [], p = [], jz = [], hq = [];
      for (let k = 0; k < ay.length; k++) {
        let tx = String(ay[k].text || '').replace(/﻿/g, '').trim();
        if (k === 0 && n !== 1 && n !== 9) tx = stripBasmala(tx);
        if (!tx) throw new Error('آية فارغة في سورة ' + M.name(n));
        t.push(tx); p.push(ay[k].page | 0); jz.push(ay[k].juz | 0); hq.push(ay[k].hizbQuarter | 0);
      }
      out.s.push({ t, p, j: jz, h: hq });
    }
    return out;
  }
  Q.fromApi = fromApi;

  function valid(d) {
    if (!d || d.v !== 1 || !Array.isArray(d.s) || d.s.length !== 114) return false;
    for (let i = 0; i < 114; i++) if (!d.s[i] || !Array.isArray(d.s[i].t) || d.s[i].t.length !== M.count(i + 1)) return false;
    return true;
  }

  function fromBundle() {
    return valid(window.QURAN_BUNDLE) ? Promise.resolve(window.QURAN_BUNDLE) : Promise.reject(new Error('no bundle'));
  }
  function fromDevice() {
    return App.idb.get('kv', 'quran').then(d => { if (!valid(d)) throw new Error('no cache'); return d; });
  }
  function fromNetwork() {
    return fetch(App.config.quran.url)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(j => { const d = fromApi(j); App.idb.set('kv', 'quran', d); return d; });
  }

  Q.load = () => {
    if (Q.ready) return Promise.resolve(Q.data);
    if (loading) return loading;
    Q.error = null;
    loading = fromBundle().then(d => { Q.source = 'bundle'; return d; })
      .catch(() => fromDevice().then(d => { Q.source = 'device'; return d; }))
      .catch(() => fromNetwork().then(d => { Q.source = 'network'; return d; }))
      .then(d => {
        Q.data = d; Q.ready = true; loading = null;
        waiters.splice(0).forEach(fn => { try { fn(); } catch (e) {} });
        return d;
      })
      .catch(e => {
        Q.error = e; loading = null;
        waiters.splice(0).forEach(fn => { try { fn(); } catch (x) {} });
        throw e;
      });
    return loading;
  };
  // يُستدعى مرة واحدة عند انتهاء التحميل (نجاحًا أو فشلًا)
  Q.whenSettled = fn => { if (Q.ready) fn(); else { waiters.push(fn); Q.load().catch(() => {}); } };

  Q.text = (s, a) => (Q.data ? Q.data.s[s - 1].t[a - 1] : '');
  Q.page = (s, a) => (Q.data ? Q.data.s[s - 1].p[a - 1] : 0);
  Q.juz = (s, a) => (Q.data ? Q.data.s[s - 1].j[a - 1] : M.juzOf(s, a));
  Q.basmala = () => Q.text(1, 1);
  // عدد الأحرف بلا تشكيل ولا مسافات — يُستعمل لموازنة الورد اليومي
  Q.letters = (s, a) => Q.text(s, a).replace(U.MARKS, '').replace(/\s/g, '').length;
})();
