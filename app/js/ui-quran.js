/* المصحف: فهرس السور والأجزاء والعلامات + شاشة القراءة مع الاستماع */
(function () {
  'use strict';
  const App = window.App, U = App.util, UI = App.ui, M = App.meta, S = App.store.state, H = App.hifz, Q = App.quran, A = App.audio;
  let seg = 'surah', query = '';
  let rd = null;
  const $ = id => document.getElementById(id);

  // ---------- الفهرس ----------
  function surahRow(s) {
    const n = M.count(s), done = H.surahDone(s);
    return '<a class="row" href="#/quran/' + s + '"><span class="no">' + U.num(s) + '</span><span class="tx"><b>سورة ' + M.name(s) + '</b><span>' +
      (M.madani(s) ? 'مدنية' : 'مكية') + ' · ' + U.count(n, U.W.ayah) + '</span></span>' +
      (done ? '<span class="chip' + (done === n ? ' ok' : '') + '">' + (done === n ? 'محفوظة' : U.num(done) + '/' + U.num(n)) + '</span>' : '') + '</a>';
  }
  function listHtml() {
    if (seg === 'juz') {
      return '<div class="list">' + M.juzStarts.map((j, i) =>
        '<a class="row" href="#/quran/' + j[0] + '/' + j[1] + '"><span class="no">' + U.num(i + 1) + '</span><span class="tx"><b>الجزء ' + U.num(i + 1) + '</b><span>يبدأ من سورة ' + M.name(j[0]) + ' · الآية ' + U.num(j[1]) + '</span></span></a>').join('') + '</div>';
    }
    if (seg === 'marks') {
      const bm = S.quran.bookmarks;
      if (!bm.length) return '<p class="empty">لا توجد علامات بعد. المس أي آية أثناء القراءة ثم اختر «علامة».</p>';
      return '<div class="list">' + bm.map((b, i) =>
        '<div class="row"><a class="tx" href="#/quran/' + b.s + '/' + b.a + '"><b>سورة ' + M.name(b.s) + '</b><span>الآية ' + U.num(b.a) + '</span></a>' +
        '<button class="icon-btn" data-act="q-unmark" data-i="' + i + '" aria-label="حذف العلامة">' + UI.icon('close', 18) + '</button></div>').join('') + '</div>';
    }
    const raw = query.trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    const nq = U.norm(raw);
    const list = U.range(1, 114).filter(s => !nq || U.norm(M.name(s)).indexOf(nq) !== -1 || String(s) === raw);
    return list.length ? '<div class="list">' + list.map(surahRow).join('') + '</div>' : '<p class="empty">لا توجد سورة بهذا الاسم.</p>';
  }
  function index() {
    const last = S.quran.last;
    return '<section class="page"><header class="ph"><div><h1>المصحف</h1><p>القرآن الكريم كاملًا · رواية حفص عن عاصم</p></div></header>' +
      (last ? '<a class="card cont" href="#/quran/' + last.s + '/' + last.a + '">' + UI.icon('bookmark', 22) + '<div><b>متابعة القراءة</b><span>سورة ' + M.name(last.s) + ' · الآية ' + U.num(last.a) + '</span></div>' + UI.icon('left', 18) + '</a>' : '') +
      '<div class="seg wide">' + [['surah', 'السور'], ['juz', 'الأجزاء'], ['marks', 'العلامات']].map(o =>
        '<button data-act="q-seg" data-v="' + o[0] + '" class="' + (seg === o[0] ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div>' +
      (seg === 'surah' ? '<div class="search">' + UI.icon('search', 18) + '<input type="search" placeholder="ابحث باسم السورة أو رقمها" value="' + U.esc(query) + '" data-input="q-search" autocomplete="off"></div>' : '') +
      '<div id="qList">' + listHtml() + '</div></section>';
  }
  UI.route('/quran', () => ({ tab: 'quran', html: index() }));
  UI.on('q-seg', el => { seg = el.dataset.v; UI.refresh(); });
  UI.on('q-search', el => { query = el.value; const l = $('qList'); if (l) l.innerHTML = listHtml(); });
  UI.on('q-unmark', el => { S.quran.bookmarks.splice(+el.dataset.i, 1); App.store.save(); UI.refresh(); });

  // ---------- القراءة ----------
  const marked = (s, a) => S.quran.bookmarks.some(b => b.s === s && b.a === a);

  function reader(s) {
    const n = M.count(s);
    let out = '', lastPage = 0;
    for (let a = 1; a <= n; a++) {
      const pg = Q.page(s, a);
      if (pg && pg !== lastPage) {
        if (a > 1) out += '<span class="pg">صفحة ' + U.num(pg) + '</span>';
        lastPage = pg;
      }
      out += '<span class="ay" data-act="rd-ay" data-a="' + a + '" id="ay' + a + '">' + U.esc(Q.text(s, a)) + '<span class="an">' + U.num(a) + '</span></span> ';
    }
    const nav = '<div class="rd-nav">' +
      (s > 1 ? '<a class="btn line sm" href="#/quran/' + (s - 1) + '">' + UI.icon('right', 16) + ' سورة ' + M.name(s - 1) + '</a>' : '<span></span>') +
      (s < 114 ? '<a class="btn line sm" href="#/quran/' + (s + 1) + '">سورة ' + M.name(s + 1) + ' ' + UI.icon('left', 16) + '</a>' : '<span></span>') + '</div>';
    return '<section class="reader">' +
      UI.topbar('سورة ' + M.name(s), (M.madani(s) ? 'مدنية' : 'مكية') + ' · ' + U.count(n, U.W.ayah) + ' · الجزء ' + U.num(Q.juz(s, 1)),
        '<button class="icon-btn txt" data-act="rd-font" data-d="-1" aria-label="تصغير الخط">أ−</button><button class="icon-btn txt" data-act="rd-font" data-d="1" aria-label="تكبير الخط">أ+</button>') +
      '<div class="rd-body"><div class="surah-head"><span>سورة</span><b>' + M.name(s) + '</b></div>' +
      (s !== 1 && s !== 9 ? '<p class="q basm" id="ay0">' + U.esc(Q.basmala()) + '</p>' : '') +
      '<p class="q text" id="rdText">' + out + '</p>' + nav + '</div>' +
      '<div class="rd-bar" id="rdBar"></div></section>';
  }
  function barHtml() {
    if (rd.cur != null) {
      return '<div class="rd-play"><button class="icon-btn" data-act="rd-stop" aria-label="إيقاف">' + UI.icon('close') + '</button>' +
        '<div class="rd-now"><b>' + (rd.cur ? 'الآية ' + U.num(rd.cur) : 'البسملة') + '</b><span>' + U.esc(App.reciter(S.audio.reciter).name) + '</span></div>' +
        '<div class="rd-keys" dir="ltr"><button class="icon-btn" data-act="rd-prev" aria-label="الآية السابقة">' + UI.icon('skipprev') + '</button>' +
        '<button class="round play sm" data-act="rd-toggle" aria-label="تشغيل أو إيقاف مؤقت">' + UI.icon(rd.playing ? 'pause' : 'play', 24) + '</button>' +
        '<button class="icon-btn" data-act="rd-next" aria-label="الآية التالية">' + UI.icon('skipnext') + '</button></div></div>';
    }
    if (rd.sel) {
      const on = marked(rd.s, rd.sel);
      return '<div class="rd-sel"><b>الآية ' + U.num(rd.sel) + '</b>' +
        '<button data-act="rd-listen">' + UI.icon('play', 18) + '<span>استماع</span></button>' +
        '<button data-act="rd-mark"' + (on ? ' class="on"' : '') + '>' + UI.icon('bookmark', 18) + '<span>' + (on ? 'إزالة' : 'علامة') + '</span></button>' +
        '<button data-act="rd-hifz">' + UI.icon('repeat', 18) + '<span>احفظ من هنا</span></button>' +
        '<button data-act="rd-copy">' + UI.icon('copy', 18) + '<span>نسخ</span></button>' +
        '<button data-act="rd-unsel" aria-label="إغلاق">' + UI.icon('close', 18) + '</button></div>';
    }
    return '<button class="btn primary fab" data-act="rd-listen">' + UI.icon('play', 18) + ' استماع للسورة</button>';
  }
  function paintBar() { const b = $('rdBar'); if (b && rd) b.innerHTML = barHtml(); }
  function hl(cls, a) {
    U.$$('.reader .' + cls).forEach(el => el.classList.remove(cls));
    if (a == null) return null;
    const el = $('ay' + a);
    if (el) el.classList.add(cls);
    return el;
  }
  function saveLast(a) { S.quran.last = { s: rd.s, a: Math.max(1, a) }; App.store.save(); }

  function rdPlay(from) {
    const s = rd.s, list = [];
    if (from <= 1 && s !== 1 && s !== 9) list.push({ s: 1, a: 1, basm: true });
    for (let a = Math.max(1, from); a <= M.count(s); a++) list.push({ s, a });
    rd.sel = null; hl('sel', null);
    rd.cur = list[0].basm ? 0 : list[0].a;
    rd.playing = true;
    A.play(list, {
      reciter: S.audio.reciter, rate: S.audio.rate,
      onItem: (k, it) => {
        if (!rd) return;
        rd.cur = it.basm ? 0 : it.a;
        const el = hl('now', rd.cur);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (!it.basm) saveLast(it.a);
        paintBar();
      },
      onState: p => { if (rd) { rd.playing = p; paintBar(); } },
      onDone: () => { if (rd) { rd.cur = null; rd.playing = false; hl('now', null); paintBar(); } },
      onError: why => {
        if (!rd) return;
        rd.cur = null; rd.playing = false; hl('now', null); paintBar();
        U.toast(why === 'offline' ? 'لا يوجد اتصال بالإنترنت لتشغيل التلاوة' : 'تعذّر تشغيل التلاوة — تحقّق من الاتصال');
      }
    });
    paintBar();
  }
  const onScroll = U.debounce(() => {
    if (!rd || rd.cur != null) return;
    const els = document.querySelectorAll('#rdText .ay');
    for (let i = 0; i < els.length; i++) {
      if (els[i].getBoundingClientRect().bottom > 90) { saveLast(+els[i].dataset.a); break; }
    }
  }, 600);

  UI.on('rd-ay', el => {
    if (!rd) return;
    const a = +el.dataset.a;
    if (rd.cur != null) { rdPlay(a); return; }
    rd.sel = rd.sel === a ? null : a;
    hl('sel', rd.sel);
    if (rd.sel) saveLast(a);
    paintBar();
  });
  UI.on('rd-unsel', () => { rd.sel = null; hl('sel', null); paintBar(); });
  UI.on('rd-listen', () => rdPlay(rd.sel || 1));
  UI.on('rd-stop', () => { A.stop(); rd.cur = null; rd.playing = false; hl('now', null); paintBar(); });
  UI.on('rd-toggle', () => { if (A.paused()) A.resume(); else A.pause(); });
  UI.on('rd-prev', () => rdPlay(Math.max(1, (rd.cur || 1) - 1)));
  UI.on('rd-next', () => { const n = (rd.cur || 0) + 1; if (n <= M.count(rd.s)) rdPlay(n); });
  UI.on('rd-mark', () => {
    const i = S.quran.bookmarks.findIndex(b => b.s === rd.s && b.a === rd.sel);
    if (i >= 0) S.quran.bookmarks.splice(i, 1);
    else S.quran.bookmarks.unshift({ s: rd.s, a: rd.sel, at: Date.now() });
    App.store.save();
    U.toast(i >= 0 ? 'أُزيلت العلامة' : 'أُضيفت علامة على الآية ' + U.num(rd.sel));
    paintBar();
  });
  UI.on('rd-hifz', () => {
    const s = rd.s, a = rd.sel;
    UI.confirm('بدء الحفظ من هنا؟', 'سيبدأ وِردك القادم من سورة ' + M.name(s) + '، الآية ' + U.num(a) + '. محفوظك السابق لا يتأثر.', 'نعم، ابدأ من هنا', () => {
      H.setStart(s, a);
      U.toast('تم تحديث خطة الحفظ');
      UI.go('#/hifz');
    });
  });
  UI.on('rd-copy', () => {
    const text = Q.text(rd.s, rd.sel) + ' ﴿' + M.name(rd.s) + ': ' + rd.sel + '﴾';
    const done = () => U.toast('نُسخت الآية');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => U.toast('تعذّر النسخ'));
    else U.toast('النسخ غير متاح في هذا المتصفح');
  });
  UI.on('rd-font', el => {
    const v = Math.round(Math.min(1.7, Math.max(0.8, S.settings.quranScale + 0.1 * (+el.dataset.d))) * 10) / 10;
    S.settings.quranScale = v;
    App.store.save();
    App.applyTheme();
  });

  UI.route('/quran/(\\d+)(?:/(\\d+))?', (sn, an) => {
    const s = Math.min(114, Math.max(1, +sn));
    if (!Q.ready) return UI.needQuran('quran');
    const a = an ? Math.min(M.count(s), Math.max(1, +an)) : null;
    rd = { s, sel: null, cur: null, playing: false };
    return {
      tab: 'quran', tabs: false, html: reader(s),
      after() {
        paintBar();
        saveLast(a || 1);
        if (a && a > 1) {
          const el = $('ay' + a);
          if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
      },
      cleanup() {
        window.removeEventListener('scroll', onScroll);
        A.stop();
        rd = null;
      }
    };
  });
})();
