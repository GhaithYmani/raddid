/* أساس الواجهة: الأيقونات، التنقّل بين الشاشات، عناصر الإدخال العامة، النوافذ السفلية */
(function () {
  'use strict';
  const App = window.App, U = App.util, S = App.store.state;
  const UI = App.ui = {};

  // ---------- الأيقونات ----------
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    mushaf: '<path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2z"/><path d="M12 6.5v14"/>',
    beads: '<circle cx="12" cy="4.6" r="1.7"/><circle cx="17.6" cy="7.4" r="1.7"/><circle cx="19" cy="13.4" r="1.7"/><circle cx="15.2" cy="18.4" r="1.7"/><circle cx="8.8" cy="18.4" r="1.7"/><circle cx="5" cy="13.4" r="1.7"/><circle cx="6.4" cy="7.4" r="1.7"/>',
    mosque: '<path d="M4 21V11a8 8 0 0 1 16 0v10"/><path d="M12 3V1.5"/><path d="M9.5 21v-4a2.5 2.5 0 0 1 5 0v4"/><path d="M2.5 21h19"/>',
    sliders: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    play: '<path d="M7.5 4.8v14.4a.6.6 0 0 0 .9.5l11.4-7.2a.6.6 0 0 0 0-1L8.4 4.3a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.5" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
    skipnext: '<path d="M6 5.5v13l9.5-6.5z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
    skipprev: '<path d="M18 5.5v13L8.5 12z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><path d="M4 3.5l16 17"/>',
    restart: '<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.5h4.5"/>',
    bookmark: '<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>',
    flame: '<path d="M12 2.8c.4 3-1 4.7-2.4 6.4C8.2 10.900 6.800 12.600 6.800 15a5.2 5.2 0 0 0 10.400 0c0-1.900-.9-3.500-1.900-4.800-.400 1.200-1.100 2-2.100 2.400.5-3.400-.300-6.900-1.200-9.800z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.800 1.800M17.300 17.300l1.800 1.800M4.900 19.100l1.800-1.800M17.300 6.700l1.800-1.800"/>',
    moon: '<path d="M20 14.500A8.500 8.500 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500z"/>',
    stars: '<path d="M17 13.500A7.500 7.500 0 0 1 9 4.200 8 8 0 1 0 19.800 15a7.400 7.400 0 0 1-2.800-1.500z"/><path d="M16.500 3.500l.8 1.900 1.900.8-1.900.8-.8 1.900-.8-1.900-1.900-.8 1.900-.8z"/>',
    sunrise: '<path d="M3 18.500h18"/><path d="M6.500 15a5.500 5.500 0 0 1 11 0"/><path d="M12 3.500V7M5.200 8.200l1.700 1.700M18.800 8.200l-1.700 1.700M2.500 15h1.500M20 15h1.500"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.500 8.500l-2 5-5 2 2-5z"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.500 2h-15z"/><path d="M10 20.500a2 2 0 0 0 4 0"/>',
    pin: '<path d="M12 21s-6.500-5.600-6.500-11a6.500 6.500 0 0 1 13 0c0 5.400-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.300"/>',
    search: '<circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500"/>',
    copy: '<rect x="8.500" y="8.500" width="11.500" height="11.500" rx="2"/><path d="M15.500 8.500V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.500a2 2 0 0 0 2 2h2.500"/>',
    scroll: '<path d="M6.500 3.500h11a1 1 0 0 1 1 1v16l-3-2-2 2-1.500-2-1.500 2-2-2-3 2v-16a1 1 0 0 1 1-1z"/><path d="M9 8.500h6M9 12.500h6"/>',
    wifi: '<path d="M2.500 9a14 14 0 0 1 19 0M5.500 12.500a9.500 9.500 0 0 1 13 0M8.500 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.500" r=".8" fill="currentColor"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.1"/>'
  };
  UI.icon = (name, size, cls) =>
    '<svg class="ic' + (cls ? ' ' + cls : '') + '" width="' + (size || 22) + '" height="' + (size || 22) +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (P[name] || '') + '</svg>';

  let logoN = 0;
  UI.logo = size => {
    const id = 'lg' + (++logoN);
    return '<svg class="logo" width="' + size + '" height="' + size + '" viewBox="0 0 512 512" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17896F"/><stop offset="1" stop-color="#0A4638"/></linearGradient></defs>' +
      '<rect width="512" height="512" rx="116" fill="url(#' + id + ')"/>' +
      '<path d="M364 127.3A168 168 0 1 1 148 127.3" fill="none" stroke="#E3BC62" stroke-width="26" stroke-linecap="round"/>' +
      '<path d="M131.3 107.4 174 105.4 164.7 147.2z" fill="#E3BC62" stroke="#E3BC62" stroke-width="10" stroke-linejoin="round"/>' +
      '<path d="M256 205c-30-20-66-23-90-15v128c24-8 60-5 90 15 30-20 66-23 90-15V190c-24-8-60-5-90 15z" fill="#fff"/>' +
      '<path d="M256 205v128" stroke="#0E5E4B" stroke-width="8" stroke-linecap="round"/></svg>';
  };

  // ---------- الأحداث (تفويض واحد لكل الأزرار) ----------
  UI.actions = {};
  UI.on = (name, fn) => { UI.actions[name] = fn; };
  const dispatch = attr => e => {
    const el = e.target.closest && e.target.closest('[data-' + attr + ']');
    if (!el) return;
    const fn = UI.actions[el.dataset[attr]];
    if (fn) fn(el, e);
  };
  document.addEventListener('click', dispatch('act'));
  document.addEventListener('change', dispatch('change'));
  document.addEventListener('input', dispatch('input'));

  // ---------- عناصر الإعدادات العامة: تكتب القيمة مباشرة في الحالة ----------
  function applySet(el, val) {
    U.setPath(S, el.dataset.path, val);
    App.store.save();
    if (App.onSetting) App.onSetting(el.dataset.path, val);
    if (el.dataset.refresh != null) UI.refresh();
  }
  UI.on('set', el => {
    const raw = el.dataset.val;
    const val = el.dataset.type === 'num' ? +raw : raw;
    const grp = el.closest('.seg');
    if (grp) U.$$('button', grp).forEach(b => b.classList.toggle('on', b === el));
    applySet(el, val);
  });
  UI.on('set-input', el => {
    let val = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.type === 'num') val = +val;
    applySet(el, val);
  });
  UI.on('step', el => {
    const cur = +U.getPath(S, el.dataset.path) || 0;
    const v = Math.min(+el.dataset.max, Math.max(+el.dataset.min, cur + (+el.dataset.d)));
    const out = el.parentNode.querySelector('output');
    if (out) out.textContent = U.num(v);
    applySet(el, v);
  });

  const same = (path, v) => String(U.getPath(S, path)) === String(v);
  UI.seg = (path, opts, type, extra) => '<div class="seg">' + opts.map(o =>
    '<button type="button" data-act="set" data-path="' + path + '" data-val="' + o[0] + '" data-type="' + (type || 'str') + '" ' + (extra || '') +
    ' class="' + (same(path, o[0]) ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div>';
  UI.stepper = (path, min, max, extra) => {
    const b = d => '<button type="button" data-act="step" data-path="' + path + '" data-d="' + d + '" data-min="' + min + '" data-max="' + max + '" ' + (extra || '') +
      ' aria-label="' + (d > 0 ? 'زيادة' : 'إنقاص') + '">' + (d > 0 ? '+' : '−') + '</button>';
    return '<div class="stepper">' + b(-1) + '<output>' + U.num(U.getPath(S, path)) + '</output>' + b(1) + '</div>';
  };
  UI.toggle = (path, extra) => '<input type="checkbox" class="sw" data-change="set-input" data-path="' + path + '" ' + (U.getPath(S, path) ? 'checked ' : '') + (extra || '') + '>';
  UI.select = (path, opts, extra) => '<select data-change="set-input" data-path="' + path + '" ' + (extra || '') + '>' + opts.map(o =>
    '<option value="' + o[0] + '"' + (same(path, o[0]) ? ' selected' : '') + '>' + U.esc(o[1]) + '</option>').join('') + '</select>';

  UI.topbar = (title, sub, extra) =>
    '<header class="topbar"><button class="icon-btn" data-act="back" aria-label="رجوع">' + UI.icon('right') + '</button>' +
    '<div class="tb-title"><b>' + title + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>' + (extra || '') + '</header>';

  // ---------- التنقّل ----------
  const routes = [];
  let current = null, counter = 0, firstIdx = null;
  UI.route = (pattern, handler) => { routes.push({ re: new RegExp('^' + pattern + '$'), handler }); };

  function stamp() {
    try {
      const st = history.state;
      if (st && typeof st.i === 'number') counter = Math.max(counter, st.i);
      else history.replaceState({ i: ++counter }, '');
      if (firstIdx == null) firstIdx = history.state.i;
    } catch (e) {}
  }
  UI.canBack = () => { try { return !!(history.state && firstIdx != null && history.state.i > firstIdx); } catch (e) { return false; } };
  // استبدال الشاشة الحالية دون إضافة خطوة إلى سجلّ الرجوع (مع الحفاظ على ترتيبها فيه)
  UI.replace = hash => {
    try { history.replaceState(history.state, '', hash); } catch (e) { location.replace(hash); return; }
    UI.render();
  };
  UI.back = fallback => { if (UI.canBack()) history.back(); else UI.replace(fallback || '#/home'); };
  UI.go = hash => { if (location.hash === hash) UI.render(); else location.hash = hash; };
  UI.on('back', el => UI.back(el.dataset.fallback));
  UI.on('go', el => UI.go(el.dataset.href));
  UI.on('replace', el => UI.replace(el.dataset.href));
  // التنقّل بين التبويبات الرئيسية لا يراكم خطوات في سجلّ الرجوع
  UI.isTop = hash => TABS.some(t => t[1] === (hash || '#/home'));
  UI.on('tab', (el, e) => {
    const href = el.getAttribute('href'), cur = location.hash || '#/home';
    if (!UI.isTop(cur)) return;
    e.preventDefault();
    if (cur === href) window.scrollTo(0, 0); else UI.replace(href);
  });

  const TABS = [
    ['home', '#/home', 'الرئيسية', 'home'],
    ['hifz', '#/hifz', 'الحفظ', 'repeat'],
    ['quran', '#/quran', 'المصحف', 'mushaf'],
    ['dhikr', '#/dhikr', 'الأذكار', 'beads'],
    ['prayer', '#/prayer', 'الصلاة', 'mosque']
  ];
  function paintTabs(active, show) {
    const nav = document.getElementById('tabs');
    nav.hidden = !show;
    nav.innerHTML = TABS.map(t =>
      '<a href="' + t[1] + '" data-act="tab" class="tab' + (t[0] === active ? ' on' : '') + '">' + UI.icon(t[3], 24) + '<span>' + t[2] + '</span></a>').join('');
  }

  UI.render = () => {
    stamp();
    if (!S.onboarded && !/^#\/welcome/.test(location.hash)) { UI.replace('#/welcome'); return; }
    const path = (location.hash || '#/home').slice(1);
    if (current && current.cleanup) { try { current.cleanup(); } catch (e) {} }
    current = null;
    for (let i = 0; i < routes.length; i++) {
      const m = path.match(routes[i].re);
      if (!m) continue;
      const res = routes[i].handler.apply(null, m.slice(1)) || {};
      current = res;
      const view = document.getElementById('view');
      view.innerHTML = res.html || '';
      paintTabs(res.tab, res.tabs !== false);
      if (!UI._keepScroll) window.scrollTo(0, 0);
      if (res.after) res.after(view);
      return;
    }
    if (path !== '/home') UI.replace('#/home');
  };
  // إعادة رسم الشاشة الحالية مع الحفاظ على موضع التمرير
  UI.refresh = () => {
    const y = window.scrollY;
    UI._keepScroll = true;
    UI.render();
    UI._keepScroll = false;
    window.scrollTo(0, y);
  };
  window.addEventListener('hashchange', UI.render);

  // شاشة انتظار/خطأ لما يحتاج نص المصحف
  UI.needQuran = (tab, tabs) => {
    const Q = App.quran;
    if (Q.error) {
      return { tab, tabs, html: '<div class="state">' + UI.icon('wifi', 44) + '<h3>تعذّر تحميل نص المصحف</h3>' +
        '<p>يحتاج التطبيق إلى الإنترنت في أول تشغيل فقط لتنزيل نص المصحف، ثم يعمل بدونه.</p>' +
        '<button class="btn primary" data-act="quran-retry">إعادة المحاولة</button></div>' };
    }
    const at = location.hash;
    Q.whenSettled(() => { if (location.hash === at) UI.render(); });
    return { tab, tabs, html: '<div class="state"><div class="spinner"></div><h3>جارٍ تجهيز المصحف…</h3><p>يُنزَّل النص مرة واحدة فقط ويُحفظ على جهازك.</p></div>' };
  };
  UI.on('quran-retry', () => { App.quran.error = null; UI.render(); });

  // ---------- النافذة السفلية ----------
  let sheetT = null;
  UI.sheet = html => {
    const root = document.getElementById('sheet-root');
    clearTimeout(sheetT);
    root.innerHTML = '<div class="sheet-bg" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grip"></div>' + html + '</div>';
    root.classList.remove('open');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
  };
  UI.closeSheet = () => {
    const root = document.getElementById('sheet-root');
    root.classList.remove('open');
    clearTimeout(sheetT);
    sheetT = setTimeout(() => { root.innerHTML = ''; }, 240);
  };
  UI.on('sheet-close', UI.closeSheet);

  let confirmCb = null;
  UI.confirm = (title, text, okLabel, cb, danger) => {
    confirmCb = cb;
    UI.sheet('<h3>' + title + '</h3><p class="muted">' + text + '</p><div class="sheet-btns">' +
      '<button class="btn line" data-act="sheet-close">إلغاء</button>' +
      '<button class="btn ' + (danger ? 'danger' : 'primary') + ' grow" data-act="confirm-ok">' + okLabel + '</button></div>');
  };
  UI.on('confirm-ok', () => { const cb = confirmCb; confirmCb = null; UI.closeSheet(); if (cb) cb(); });

  // خيارات التلاوة (القارئ، السرعة، مهلة الترديد) — تُستعمل في الجلسة والقارئ والإعدادات
  UI.audioFields = () => {
    const recs = App.config.reciters.map(r => [r.id, r.name + ' — ' + r.style]);
    return '<label class="fld"><span>القارئ</span>' + UI.select('audio.reciter', recs) + '</label>' +
      '<div class="fld"><span>سرعة التلاوة</span>' + UI.seg('audio.rate', [[0.75, '٠٫٧٥×'], [1, 'عادية'], [1.25, '١٫٢٥×'], [1.5, '١٫٥×']], 'num') + '</div>' +
      '<div class="fld"><span>مهلة الترديد بعد كل استماع</span>' + UI.seg('audio.gap', [[0, 'بدون'], [0.5, 'قصيرة'], [1, 'بطول المقطع'], [1.5, 'أطول']], 'num') + '</div>' +
      '<label class="fld row"><span>الانتقال التلقائي للخطوة التالية</span>' + UI.toggle('audio.autoNext') + '</label>';
  };
})();
