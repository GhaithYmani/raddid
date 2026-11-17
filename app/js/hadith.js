/* الأحاديث المنتقاة: الأربعون النووية — تُحمَّل من مصدر مفتوح مرة واحدة ثم تُحفظ على الجهاز */
(function () {
  'use strict';
  const App = window.App;
  const Hd = App.hadith = { ready: false, error: null, list: [] };
  let loading = null;

  const valid = l => Array.isArray(l) && l.length >= 40 && l.every(h => h && typeof h.text === 'string' && h.text.length > 20);
  const clean = j => (j && Array.isArray(j.hadiths) ? j.hadiths : []).map(h => ({
    n: h.hadithnumber,
    text: String(h.text || '').replace(/\s+/g, ' ').replace(/\s+([،.:؛])/g, '$1').trim()
  }));

  Hd.load = () => {
    if (Hd.ready) return Promise.resolve(Hd.list);
    if (loading) return loading;
    Hd.error = null;
    const net = () => fetch(App.config.hadith.url)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(j => { const l = clean(j); if (!valid(l)) throw new Error('بيانات الأحاديث غير صالحة'); App.idb.set('kv', 'hadith', l); return l; });
    const src = valid(window.HADITH_BUNDLE)
      ? Promise.resolve(window.HADITH_BUNDLE)
      : App.idb.get('kv', 'hadith').then(l => { if (!valid(l)) throw new Error('no cache'); return l; }).catch(net);
    loading = src
      .then(l => { Hd.list = l; Hd.ready = true; loading = null; return l; })
      .catch(e => { Hd.error = e; loading = null; throw e; });
    return loading;
  };
  // حديث اليوم: يتغيّر يوميًا ويدور على المجموعة
  Hd.ofDay = () => (Hd.ready ? Hd.list[App.util.dayOfYear() % Hd.list.length] : null);
  Hd.get = n => Hd.list.find(h => h.n === n) || null;
})();
