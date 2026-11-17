/* الشاشة الرئيسية + لوحة الحفظ + صفحة الخطة */
(function () {
  'use strict';
  const App = window.App, U = App.util, UI = App.ui, M = App.meta, S = App.store.state, H = App.hifz, Q = App.quran;
  const V = App.views = {};
  let timer = null;

  // ---------- بطاقات مشتركة ----------
  V.wird = () => {
    const t = H.today(), p = t.portion;
    if (!p) {
      if (t.doneCount > 0) {
        const lp = t.last;
        return '<section class="card wird done">' +
          '<div class="card-k"><span>وِرد اليوم</span><span class="chip ok">' + UI.icon('check', 14) + ' تمّ</span></div>' +
          '<h3>بارك الله فيك</h3>' +
          '<p class="muted">حفظتَ اليوم ' + (lp ? U.ayahRange(lp.from, lp.to) + ' من سورة ' + M.name(lp.s) : 'وِردك') + '. يعود وِردك الجديد غدًا بإذن الله.</p>' +
          (H.finished() ? '' : '<button class="btn ghost block" data-act="hifz-extra">أريد وِردًا إضافيًا الآن</button>') +
          '</section>';
      }
      return '<section class="card wird"><div class="card-k"><span>وِرد اليوم</span></div><h3>أتممتَ خطتك كاملة</h3>' +
        '<p class="muted">اختر سورة جديدة لتبدأ بها من صفحة الخطة.</p><a class="btn primary block" href="#/plan">تعديل الخطة</a></section>';
    }
    const k = p.to - p.from + 1, steps = H.steps(p), prog = Math.min(1, (t.step || 0) / steps.length);
    const prev = Q.ready ? U.esc(Q.text(p.s, p.from)) : '';
    return '<section class="card wird">' +
      '<div class="card-k"><span>' + (t.doneCount > 0 ? 'وِرد إضافي' : 'وِرد اليوم') + '</span><span class="chip">' + U.count(k, U.W.ayah) + ' × ' + U.num(S.plan.repeats) + '</span></div>' +
      '<h3>سورة ' + M.name(p.s) + ' <small>' + U.ayahRange(p.from, p.to) + '</small></h3>' +
      (prev ? '<p class="q wird-prev">' + prev + '</p>' : '') +
      (p.short ? '<p class="hint-line">آيات اليوم طويلة، لذا وِردك اليوم: ' + U.count(k, U.W.ayah) + '.</p>' : '') +
      (prog > 0 ? '<div class="bar"><i style="width:' + Math.round(prog * 100) + '%"></i></div>' : '') +
      '<a class="btn primary block" href="#/session/new">' + UI.icon('play', 18) + (prog > 0 ? ' أكمل وِردك' : ' ابدأ وِرد اليوم') + '</a>' +
      '</section>';
  };

  V.review = () => {
    const r = H.review();
    if (!r.nearCount && !r.farCount) return '';
    const item = (kind, title, sub, n, done) => (n
      ? '<a class="rev' + (done ? ' done' : '') + '" href="#/session/' + kind + '"><div><b>' + title + '</b><span>' + sub + '</span></div>' +
        '<span class="chip' + (done ? ' ok' : '') + '">' + (done ? UI.icon('check', 14) + ' تمّت' : U.count(n, U.W.ayah)) + '</span></a>'
      : '');
    return '<section class="card"><div class="card-k"><span>مراجعة اليوم</span></div>' +
      item('near', 'المراجعة القريبة', 'ما حفظتَه في آخر ٥ أيام', r.nearCount, r.nearDone) +
      item('far', 'المراجعة البعيدة', 'دورة مستمرة على محفوظك السابق', r.farCount, r.farDone) +
      '</section>';
  };

  V.streak = () => {
    const st = H.stats();
    return '<section class="card strip">' +
      '<div class="streak"><span class="flame">' + UI.icon('flame', 22) + '</span><div><b>' + U.num(st.streak) + '</b><span>' + (st.streak === 1 ? 'يوم متتالٍ' : 'أيام متتالية') + '</span></div></div>' +
      '<div class="week">' + H.week().map(d => '<i class="' + (d.on ? 'on' : '') + (d.today ? ' today' : '') + '"></i>').join('') + '</div>' +
      '<div class="total"><b>' + U.num(st.ayahs) + '</b><span>آية محفوظة</span></div>' +
      '</section>';
  };

  V.hadith = () => {
    const Hd = App.hadith;
    if (!Hd.ready) return '';
    const h = Hd.ofDay();
    return '<a class="card hadith" href="#/hadith/' + h.n + '"><div class="card-k"><span>حديث اليوم</span><span class="chip">الأربعون النووية · ' + U.num(h.n) + '</span></div>' +
      '<p class="naskh clamp">' + U.esc(h.text) + '</p><span class="more">اقرأ الحديث كاملًا</span></a>';
  };

  UI.on('hifz-extra', () => { if (H.extra()) UI.go('#/session/new'); else UI.refresh(); });

  // ---------- الرئيسية ----------
  function header() {
    return '<header class="home-h"><div class="brand">' + UI.logo(46) + '<div><h1>' + App.config.name + '</h1>' +
      '<p>' + U.esc(U.greg()) + '</p><p>' + U.esc(U.hijri()) + '</p></div></div>' +
      '<a class="icon-btn" href="#/settings" aria-label="الإعدادات">' + UI.icon('sliders') + '</a></header>';
  }
  function hero() {
    if (!S.prayer.loc) {
      return '<a class="hero empty" href="#/prayer"><div><b>مواقيت الصلاة</b><span>حدّد موقعك لعرض المواقيت واتجاه القبلة</span></div>' + UI.icon('pin', 28) + '</a>';
    }
    const np = App.prayer.next();
    if (!np || !np.time) return '';
    return '<a class="hero" href="#/prayer">' +
      '<div class="hero-top"><span>الصلاة القادمة</span><span class="hero-loc">' + UI.icon('pin', 14) + U.esc(S.prayer.loc.name) + '</span></div>' +
      '<div class="hero-main"><b>' + np.name + '</b><time>' + U.fmtTime(np.time) + '</time></div>' +
      '<div class="hero-bot">بعد <bdi id="heroCount">' + U.clock(np.time - Date.now()) + '</bdi></div></a>';
  }
  function tiles() {
    const hr = new Date().getHours();
    const which = hr >= 3 && hr < 14 ? 'morning' : 'evening';
    const cat = App.adhkar.cat(which);
    const done = S.adhkar.day === U.dateStr() && S.adhkar.done[which];
    const last = S.quran.last;
    return '<div class="tiles">' +
      '<a class="tile" href="#/dhikr/' + which + '">' + UI.icon(cat.icon, 26) + '<b>' + cat.title + '</b><span>' + (done ? 'تمّت اليوم' : 'لم تُقرأ بعد') + '</span></a>' +
      '<a class="tile" href="' + (last ? '#/quran/' + last.s + '/' + last.a : '#/quran') + '">' + UI.icon('mushaf', 26) + '<b>' + (last ? 'متابعة القراءة' : 'المصحف') + '</b><span>' +
      (last ? 'سورة ' + M.name(last.s) + ' · ' + U.num(last.a) : 'القرآن كاملًا') + '</span></a></div>';
  }
  function tick() {
    const el = document.getElementById('heroCount');
    if (!el) return;
    const np = App.prayer.next();
    if (!np || !np.time) return;
    const ms = np.time - Date.now();
    el.textContent = U.clock(ms);
    if (ms <= 0) UI.refresh();
  }
  function updateCard() {
    const u = App.update;
    if (!u) return '';
    return '<a class="note upd" href="' + U.esc(u.url) + '" target="_blank" rel="noopener">' + UI.icon('info', 18) +
      '<p><b>يتوفر إصدار جديد (' + U.num(u.version) + ')</b> — اضغط لفتح صفحة التنزيل.</p></a>';
  }
  UI.route('/home', () => ({
    tab: 'home',
    html: '<section class="page">' + header() + updateCard() + hero() + V.wird() + V.review() + V.streak() + tiles() + V.hadith() + '</section>',
    after() { timer = setInterval(tick, 1000); },
    cleanup() { clearInterval(timer); }
  }));

  // ---------- لوحة الحفظ ----------
  function planLine() {
    const r = App.reciter(S.audio.reciter);
    return U.count(S.plan.perDay, U.W.ayah) + ' يوميًا · تكرار ' + U.num(S.plan.repeats) + ' · ' + r.name;
  }
  function statsCard() {
    const st = H.stats(), est = H.estimate();
    let cur = '';
    if (est.s) {
      const n = M.count(est.s), d = H.surahDone(est.s);
      cur = '<div class="cur-surah"><div><b>سورة ' + M.name(est.s) + '</b><span>' + U.num(d) + ' من ' + U.num(n) + '</span></div>' +
        '<div class="bar"><i style="width:' + Math.round(d / n * 100) + '%"></i></div>' +
        '<span class="muted small">بقي نحو ' + U.count(est.surah, U.W.day) + ' لإتمامها</span></div>';
    }
    const pct = st.pct * 100;
    return '<section class="card"><div class="card-k"><span>تقدّمك</span></div>' +
      '<div class="stats">' +
      '<div><b>' + U.num(st.ayahs) + '</b><span>آية محفوظة</span></div>' +
      '<div><b>' + U.num(st.streak) + '</b><span>أيام متتالية</span></div>' +
      '<div><b>' + U.num(st.best) + '</b><span>أفضل سلسلة</span></div>' +
      '<div><b>' + U.num(pct < 10 ? pct.toFixed(1) : Math.round(pct)) + '٪</b><span>من المصحف</span></div>' +
      '</div>' + cur + '</section>';
  }
  function memList() {
    const rs = H.memRanges();
    if (!rs.length) return '';
    return '<div class="group-t">محفوظاتي</div><div class="list">' + rs.map(r => {
      const whole = r.from === 1 && r.to === M.count(r.s);
      return '<a class="row" href="#/quran/' + r.s + '/' + r.from + '"><span class="no">' + U.num(r.s) + '</span><span class="tx"><b>سورة ' + M.name(r.s) + '</b><span>' +
        (whole ? 'كاملة' : U.ayahRange(r.from, r.to)) + '</span></span>' + UI.icon('left', 18) + '</a>';
    }).join('') + '</div>';
  }
  const HOW = '<details class="how"><summary>كيف تعمل طريقة الحفظ؟</summary><ol>' +
    '<li><b>تكرار:</b> تستمع لكل آية وتردّدها بالعدد الذي اخترته.</li>' +
    '<li><b>ربط:</b> تُعاد الآيات متصلةً ببعضها ليثبت تسلسلها.</li>' +
    '<li><b>تسميع:</b> يُخفى النص وتقرأ من حفظك، ثم تكشفه لتتحقق.</li>' +
    '<li><b>مراجعة:</b> قريبة كل يوم لما حفظتَه في آخر ٥ أيام، وبعيدة تدور على كل محفوظك حتى لا يتفلّت.</li>' +
    '</ol></details>';

  UI.route('/hifz', () => ({
    tab: 'hifz',
    html: '<section class="page"><header class="ph"><div><h1>الحفظ</h1><p>' + planLine() + '</p></div>' +
      '<a class="btn sm ghost" href="#/plan">' + UI.icon('sliders', 16) + ' الخطة</a></header>' +
      V.wird() + V.review() + statsCard() + HOW + memList() + '</section>'
  }));

  // ---------- صفحة الخطة ----------
  const PRESETS = [
    { t: 'قصار السور', d: 'من الناس صعودًا — الأنسب للمبتدئ', s: 114, o: 'desc' },
    { t: 'جزء عمَّ', d: 'من سورة النبأ بترتيب المصحف', s: 78, o: 'asc' },
    { t: 'من أول المصحف', d: 'الفاتحة ثم البقرة', s: 1, o: 'asc' }
  ];
  V.presets = () => '<div class="presets">' + PRESETS.map((p, i) => {
    const on = S.hifz.pointer.s === p.s && S.plan.order === p.o && S.hifz.pointer.a === 1;
    return '<button class="preset' + (on ? ' on' : '') + '" data-act="plan-preset" data-i="' + i + '"><b>' + p.t + '</b><span>' + p.d + '</span></button>';
  }).join('') + '</div>';

  function years(days) {
    if (days < 60) return U.count(days, U.W.day);
    if (days < 365) return 'نحو ' + U.num(Math.round(days / 30)) + ' شهرًا';
    const y = days / 365;
    return 'نحو ' + U.num(y < 10 ? y.toFixed(1).replace('.0', '') : Math.round(y)) + ' سنة';
  }
  function planPage() {
    const pt = S.hifz.pointer, est = H.estimate();
    const s = Math.min(114, Math.max(1, pt.s));
    const pre = U.range(1, 114).filter(H.isPre).length;
    const link = Math.max(3, Math.round(S.plan.repeats / 2));
    const opts = U.range(1, 114).map(n => '<option value="' + n + '"' + (n === s ? ' selected' : '') + '>' + U.num(n) + '. ' + M.name(n) + '</option>').join('');
    return '<section class="page sub">' + UI.topbar('خطة الحفظ', 'عدّلها متى شئت — محفوظك يبقى كما هو') +
      '<div class="group-t">من أين تحفظ؟</div>' + V.presets() +
      '<div class="list">' +
      '<div class="set"><span>السورة<small>يبدأ وِردك القادم منها</small></span><select data-change="plan-surah">' + opts + '</select></div>' +
      '<div class="set"><span>من الآية</span><input class="narrow" type="number" inputmode="numeric" min="1" max="' + M.count(s) + '" value="' + Math.min(pt.a, M.count(s)) + '" data-change="plan-ayah"></div>' +
      '<div class="set col"><span>بعد إتمام السورة أنتقل إلى</span>' + UI.seg('plan.order', [['desc', 'السورة التي قبلها'], ['asc', 'السورة التي بعدها']], 'str', 'data-refresh') + '</div>' +
      '</div>' +
      '<div class="group-t">مقدار الوِرد اليومي</div><div class="list">' +
      '<div class="set"><span>عدد الآيات كل يوم</span>' + UI.stepper('plan.perDay', 1, 20, 'data-refresh') + '</div>' +
      '<div class="set"><span>مرات تكرار كل آية<small>ثم تُربط الآيات معًا ' + U.count(link, U.W.time) + '</small></span>' + UI.stepper('plan.repeats', 3, 40, 'data-refresh') + '</div>' +
      '<label class="set"><span>موازنة الآيات الطويلة<small>يقلّ العدد تلقائيًا إن كانت الآيات طويلة جدًا</small></span>' + UI.toggle('plan.balance', 'data-refresh') + '</label>' +
      '</div>' +
      '<div class="note">' + UI.icon('info', 18) + '<p>بهذه الخطة ' +
      (est.s ? 'تُتمّ سورة ' + M.name(est.s) + ' خلال ' + years(est.surah) + '، و' : '') +
      'تختم حفظ القرآن كاملًا خلال ' + years(est.all) + ' بإذن الله.</p></div>' +
      '<div class="group-t">محفوظ سابق</div><div class="list">' +
      '<button class="set" data-act="plan-pre"><span>سور أحفظها من قبل<small>' + (pre ? U.num(pre) + ' سورة — ' : '') + 'تُتخطّى في الحفظ الجديد وتدخل المراجعة</small></span>' + UI.icon('left', 18) + '</button>' +
      '</div></section>';
  }
  UI.route('/plan', () => ({ tab: 'hifz', html: planPage() }));

  UI.on('plan-preset', el => { const p = PRESETS[+el.dataset.i]; H.setStart(p.s, 1, p.o); UI.refresh(); });
  UI.on('plan-surah', el => { H.setStart(+el.value, 1); UI.refresh(); });
  UI.on('plan-ayah', el => {
    const s = S.hifz.pointer.s;
    const a = Math.min(M.count(s), Math.max(1, parseInt(el.value, 10) || 1));
    H.setStart(s, a);
    UI.refresh();
  });

  function preSheet() {
    const rows = U.range(1, 114).map(s => '<label class="set"><span>' + U.num(s) + '. ' + M.name(s) + '<small>' + U.count(M.count(s), U.W.ayah) + '</small></span>' +
      '<input type="checkbox" class="sw" data-change="pre-toggle" data-s="' + s + '"' + (H.isPre(s) ? ' checked' : '') + '></label>').join('');
    UI.sheet('<h3>سور أحفظها من قبل</h3><p class="muted small">حدّدها لتدخل دورة المراجعة ولا تُطلب منك في الحفظ الجديد.</p>' +
      '<button class="btn sm ghost" data-act="pre-juz30">تحديد جزء عمَّ كاملًا</button>' +
      '<div class="list sheet-list">' + rows + '</div><button class="btn primary block" data-act="pre-done">تم</button>');
  }
  UI.on('plan-pre', preSheet);
  UI.on('pre-toggle', el => H.setPre(+el.dataset.s, el.checked));
  UI.on('pre-juz30', () => { for (let s = 78; s <= 114; s++) if (!H.isPre(s)) H.setPre(s, true); preSheet(); });
  UI.on('pre-done', () => { UI.closeSheet(); UI.refresh(); });
})();
