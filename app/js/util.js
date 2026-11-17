/* أدوات مساعدة عامة */
(function () {
  'use strict';
  const App = window.App;
  const U = App.util = {};

  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);

  // ---------- الأرقام ----------
  const AR = '٠١٢٣٤٥٦٧٨٩';
  U.latin = () => !!(App.store && App.store.state.settings.digits === 'latin');
  U.num = n => {
    const s = String(n);
    return U.latin() ? s : s.replace(/\d/g, d => AR[d]);
  };
  U.pad = (n, len) => String(n).padStart(len, '0');

  // صيغة المعدود بالعربية: [مفرد، مثنى، جمع (٣-١٠)، تمييز (١١ فأكثر)]
  U.W = {
    ayah: ['آية واحدة', 'آيتان', 'آيات', 'آية'],
    time: ['مرة واحدة', 'مرتين', 'مرات', 'مرة'],
    day: ['يوم واحد', 'يومان', 'أيام', 'يومًا']
  };
  U.count = (n, w) => {
    if (n === 1) return w[0];
    if (n === 2) return w[1];
    const r = n % 100;
    return U.num(n) + ' ' + (r >= 3 && r <= 10 ? w[2] : w[3]);
  };
  U.range = (from, to) => { const out = []; for (let i = from; i <= to; i++) out.push(i); return out; };
  U.ayahRange = (from, to) => (from === to ? 'الآية ' + U.num(from) : 'الآيات ' + U.num(from) + '–' + U.num(to));

  // ---------- التواريخ ----------
  U.dateStr = d => {
    d = d || new Date();
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1, 2) + '-' + U.pad(d.getDate(), 2);
  };
  U.parseDate = s => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); };
  U.addDays = (s, n) => { const d = U.parseDate(s); d.setDate(d.getDate() + n); return U.dateStr(d); };
  U.daysBetween = (a, b) => Math.round((U.parseDate(b) - U.parseDate(a)) / 864e5);
  U.dayOfYear = d => { d = d || new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); };

  const nu = () => (U.latin() ? 'latn' : 'arab');
  const arLocale = () => {
    const l = (navigator.languages || [navigator.language || 'ar']).find(x => /^ar\b/i.test(x));
    return l || 'ar';
  };
  U.hijri = d => {
    try {
      const st = App.store.state.settings;
      const x = new Date((d || new Date()).getTime() + (st.hijriOffset || 0) * 864e5);
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-' + nu(), { day: 'numeric', month: 'long', year: 'numeric' }).format(x);
    } catch (e) { return ''; }
  };
  U.greg = d => {
    try {
      return new Intl.DateTimeFormat(arLocale() + '-u-ca-gregory-nu-' + nu(), { weekday: 'long', day: 'numeric', month: 'long' }).format(d || new Date());
    } catch (e) { return ''; }
  };

  U.fmtTime = d => {
    if (!d || isNaN(d)) return '—';
    const h = d.getHours(), m = d.getMinutes();
    if (App.store.state.settings.time24) return U.num(U.pad(h, 2) + ':' + U.pad(m, 2));
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return U.num(h12 + ':' + U.pad(m, 2)) + ' ' + (h < 12 ? 'ص' : 'م');
  };
  // عدّ تنازلي: ١:٢٣:٠٥
  U.clock = ms => {
    let s = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    return U.num((h ? h + ':' + U.pad(m, 2) : m) + ':' + U.pad(s, 2));
  };
  U.hm = str => { const p = String(str || '0:0').split(':'); return { h: +p[0] || 0, m: +p[1] || 0 }; };

  // ---------- نصوص ----------
  const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ﻿]/g;
  U.MARKS = MARKS;
  // تطبيع للبحث: بلا تشكيل وبتوحيد الهمزات والتاء المربوطة
  U.norm = s => String(s || '').replace(MARKS, '').replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();

  // ---------- واجهة ----------
  let toastT;
  U.toast = (msg, ms) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), ms || 2800);
  };
  U.buzz = ms => { try { if (navigator.vibrate) navigator.vibrate(ms || 15); } catch (e) {} };
  U.debounce = (fn, ms) => { let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(null, a), ms); }; };

  U.getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  U.setPath = (obj, path, val) => {
    const ks = path.split('.');
    let o = obj;
    for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = val;
  };
})();
