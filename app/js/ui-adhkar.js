/* الأذكار + السبحة + الأحاديث */
(function () {
  'use strict';
  const App = window.App, U = App.util, UI = App.ui, M = App.meta, S = App.store.state, Q = App.quran;
  const AD = App.adhkar;
  const $ = id => document.getElementById(id);

  function ensureDay() {
    const d = U.dateStr();
    if (S.adhkar.day !== d) { S.adhkar.day = d; S.adhkar.progress = {}; S.adhkar.done = {}; App.store.save(); }
  }
  const prog = id => S.adhkar.progress[id] || (S.adhkar.progress[id] = {});
  function ratio(c) {
    const p = S.adhkar.progress[c.id] || {};
    let done = 0, all = 0;
    c.items.forEach((it, i) => { all += it.n; done += Math.min(it.n, p[i] || 0); });
    return all ? done / all : 0;
  }

  // ---------- الصفحة الرئيسية للأذكار ----------
  function home() {
    ensureDay();
    const Hd = App.hadith;
    return '<section class="page"><header class="ph"><div><h1>الأذكار</h1><p>أذكار اليوم والليلة · السبحة · أحاديث منتقاة</p></div></header>' +
      '<div class="cats">' + AD.cats.map(c => {
        const r = ratio(c), done = !!S.adhkar.done[c.id];
        return '<a class="cat' + (done ? ' done' : '') + '" href="#/dhikr/' + c.id + '"><span class="cat-ic">' + UI.icon(done ? 'check' : c.icon, 24) + '</span><b>' + c.title + '</b><span>' + (done ? 'تمّت اليوم' : c.sub) + '</span>' +
          (r > 0 && !done ? '<div class="bar"><i style="width:' + Math.round(r * 100) + '%"></i></div>' : '') + '</a>';
      }).join('') +
      '<a class="cat" href="#/tasbih"><span class="cat-ic">' + UI.icon('beads', 24) + '</span><b>السبحة</b><span>عدّاد التسبيح</span></a></div>' +
      '<div class="group-t">أحاديث منتقاة</div>' +
      (Hd.ready ? App.views.hadith() : (Hd.error ? '<p class="empty">تعذّر تحميل الأحاديث — تحتاج إلى الإنترنت في أول مرة فقط. <button class="link" data-act="hadith-retry">إعادة المحاولة</button></p>' : '<p class="empty">جارٍ تحميل الأحاديث…</p>')) +
      '<a class="card cont" href="#/hadith">' + UI.icon('scroll', 22) + '<div><b>الأربعون النووية</b><span>اثنان وأربعون حديثًا جامعًا</span></div>' + UI.icon('left', 18) + '</a>' +
      '</section>';
  }
  UI.route('/dhikr', () => ({ tab: 'dhikr', html: home() }));
  UI.on('hadith-retry', () => { App.hadith.load().then(UI.refresh, UI.refresh); });

  // ---------- قائمة أذكار ----------
  function quranBlock(q) {
    if (!Q.ready) return '<p class="muted small">' + (Q.error ? 'يتعذّر عرض الآيات قبل تحميل نص المصحف.' : 'جارٍ تحميل نص الآيات…') + '</p>';
    const whole = q.from == null;
    const from = whole ? 1 : q.from, to = whole ? M.count(q.s) : q.to;
    let out = '';
    for (let a = from; a <= to; a++) out += U.esc(Q.text(q.s, a)) + '<span class="an">' + U.num(a) + '</span> ';
    return (whole && q.s !== 1 && q.s !== 9 ? '<p class="q basm">' + U.esc(Q.basmala()) + '</p>' : '') + '<p class="q">' + out + '</p>';
  }
  function countHtml(it, done) {
    const left = Math.max(0, it.n - done);
    return (left === 0 ? UI.icon('check', 16) : '') + '<b>' + U.num(left) + '</b><small>من ' + U.num(it.n) + '</small>';
  }
  function item(c, it, i) {
    const done = prog(c.id)[i] || 0, fin = done >= it.n;
    return '<article class="dh' + (fin ? ' fin' : '') + '" id="dh' + i + '" data-act="dh-tap" data-c="' + c.id + '" data-i="' + i + '">' +
      (it.title ? '<h4>' + it.title + '</h4>' : '') +
      (it.q ? quranBlock(it.q) : '<p class="naskh">' + U.esc(it.t) + '</p>') +
      (it.note ? '<p class="dh-note">' + U.esc(it.note) + '</p>' : '') +
      '<footer><span class="dh-src">' + U.esc(it.src || '') + '</span><span class="dh-count">' + countHtml(it, done) + '</span></footer></article>';
  }
  UI.route('/dhikr/(morning|evening|prayer|sleep|wake)', id => {
    ensureDay();
    const c = AD.cat(id);
    if (!Q.ready && !Q.error) { const at = location.hash; Q.whenSettled(() => { if (location.hash === at) UI.refresh(); }); }
    return {
      tab: 'dhikr',
      html: '<section class="page sub">' + UI.topbar(c.title, c.sub, '<button class="icon-btn" data-act="dh-reset" data-c="' + id + '" aria-label="البدء من جديد">' + UI.icon('restart') + '</button>') +
        '<p class="muted small center">المس البطاقة مع كل مرة تقرأ فيها الذكر</p>' +
        '<div class="stack" id="dhList">' + c.items.map((it, i) => item(c, it, i)).join('') + '</div></section>'
    };
  });
  UI.on('dh-tap', el => {
    const c = AD.cat(el.dataset.c), i = +el.dataset.i, it = c.items[i], p = prog(c.id);
    const done = p[i] || 0;
    if (done >= it.n) return;
    p[i] = done + 1;
    const fin = p[i] >= it.n;
    U.buzz(fin ? 50 : 10);
    const cnt = el.querySelector('.dh-count');
    if (cnt) cnt.innerHTML = countHtml(it, p[i]);
    el.classList.toggle('fin', fin);
    if (fin) {
      if (c.items.every((x, k) => (p[k] || 0) >= x.n)) {
        S.adhkar.done[c.id] = true;
        U.toast('أتممتَ ' + c.title + ' — تقبّل الله منك');
      } else {
        let k = i + 1;
        while (k < c.items.length && (p[k] || 0) >= c.items[k].n) k++;
        const nx = $('dh' + k);
        if (nx) setTimeout(() => nx.scrollIntoView({ block: 'start', behavior: 'smooth' }), 180);
      }
    }
    App.store.save();
  });
  UI.on('dh-reset', el => {
    S.adhkar.progress[el.dataset.c] = {};
    delete S.adhkar.done[el.dataset.c];
    App.store.save();
    UI.render();
  });

  // ---------- السبحة ----------
  function tasbih() {
    const t = S.adhkar.tasbih, target = t.target || 0;
    const pct = target ? Math.min(1, t.count / target) : 0, C = 2 * Math.PI * 52;
    return '<section class="page sub">' + UI.topbar('السبحة', 'المجموع: ' + U.num(t.total || 0), '<button class="icon-btn" data-act="tb-reset" aria-label="تصفير">' + UI.icon('restart') + '</button>') +
      '<div class="chips scroll">' + AD.tasbih.map((p, i) => '<button class="chipbtn' + (t.phrase === i ? ' on' : '') + '" data-act="tb-phrase" data-i="' + i + '">' + p + '</button>').join('') + '</div>' +
      '<p class="naskh tb-phrase" id="tbPhrase">' + AD.tasbih[t.phrase || 0] + '</p>' +
      '<button class="ring huge' + (target && t.count >= target ? ' full' : '') + '" id="tbRing" data-act="tb-tap" aria-label="تسبيحة">' +
      '<svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" id="tbArc" cx="60" cy="60" r="52" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(1) + '"/></svg>' +
      '<span class="ring-in"><b id="tbCount">' + U.num(t.count) + '</b><small>' + (target ? 'من ' + U.num(target) : 'بلا حدّ') + '</small></span></button>' +
      '<div class="fld center"><span>العدد المستهدف</span>' + UI.seg('adhkar.tasbih.target', [[33, '٣٣'], [100, '١٠٠'], [1000, '١٠٠٠'], [0, 'مفتوح']], 'num', 'data-refresh') + '</div>' +
      '</section>';
  }
  UI.route('/tasbih', () => ({ tab: 'dhikr', html: tasbih() }));
  UI.on('tb-tap', () => {
    const t = S.adhkar.tasbih, C = 2 * Math.PI * 52;
    if (t.target && t.count >= t.target) t.count = 0;
    t.count++; t.total = (t.total || 0) + 1;
    const hit = t.target && t.count >= t.target;
    U.buzz(hit ? 120 : 12);
    if ($('tbCount')) $('tbCount').textContent = U.num(t.count);
    if ($('tbArc')) $('tbArc').setAttribute('stroke-dashoffset', (C * (1 - (t.target ? Math.min(1, t.count / t.target) : 0))).toFixed(1));
    if ($('tbRing')) $('tbRing').classList.toggle('full', !!hit);
    App.store.save();
  });
  UI.on('tb-phrase', el => { S.adhkar.tasbih.phrase = +el.dataset.i; S.adhkar.tasbih.count = 0; App.store.save(); UI.refresh(); });
  UI.on('tb-reset', () => { S.adhkar.tasbih.count = 0; App.store.save(); UI.refresh(); });

  // ---------- الأحاديث ----------
  function wait(tab) {
    const Hd = App.hadith;
    if (Hd.error) return { tab, html: '<section class="page sub">' + UI.topbar('الأربعون النووية') + '<div class="state">' + UI.icon('wifi', 44) + '<h3>تعذّر تحميل الأحاديث</h3><p>تحتاج إلى الإنترنت في أول مرة فقط.</p><button class="btn primary" data-act="hadith-retry">إعادة المحاولة</button></div></section>' };
    const at = location.hash;
    Hd.load().then(() => { if (location.hash === at) UI.render(); }, () => { if (location.hash === at) UI.render(); });
    return { tab, html: '<section class="page sub">' + UI.topbar('الأربعون النووية') + '<div class="state"><div class="spinner"></div><h3>جارٍ التحميل…</h3></div></section>' };
  }
  UI.route('/hadith', () => {
    const Hd = App.hadith;
    if (!Hd.ready) return wait('dhikr');
    return {
      tab: 'dhikr',
      html: '<section class="page sub">' + UI.topbar('الأربعون النووية', 'للإمام النووي رحمه الله') +
        '<div class="list">' + Hd.list.map(h => '<a class="row" href="#/hadith/' + h.n + '"><span class="no">' + U.num(h.n) + '</span><span class="tx"><span class="naskh one">' + U.esc(h.text.slice(0, 110)) + '…</span></span></a>').join('') + '</div></section>'
    };
  });
  UI.route('/hadith/(\\d+)', n => {
    const Hd = App.hadith;
    if (!Hd.ready) return wait('dhikr');
    const h = Hd.get(+n) || Hd.list[0], i = Hd.list.indexOf(h);
    const prev = Hd.list[i - 1], next = Hd.list[i + 1];
    return {
      tab: 'dhikr',
      html: '<section class="page sub">' + UI.topbar('الحديث ' + U.num(h.n), 'الأربعون النووية', '<button class="icon-btn" data-act="hd-copy" data-n="' + h.n + '" aria-label="نسخ">' + UI.icon('copy') + '</button>') +
        '<article class="card"><p class="naskh hd-text">' + U.esc(h.text) + '</p></article>' +
        '<div class="rd-nav">' + (prev ? '<a class="btn line sm" href="#/hadith/' + prev.n + '">' + UI.icon('right', 16) + ' السابق</a>' : '<span></span>') +
        (next ? '<a class="btn line sm" href="#/hadith/' + next.n + '">التالي ' + UI.icon('left', 16) + '</a>' : '<span></span>') + '</div></section>'
    };
  });
  UI.on('hd-copy', el => {
    const h = App.hadith.get(+el.dataset.n);
    if (h && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(h.text).then(() => U.toast('نُسخ الحديث')).catch(() => U.toast('تعذّر النسخ'));
    else U.toast('النسخ غير متاح في هذا المتصفح');
  });
})();
