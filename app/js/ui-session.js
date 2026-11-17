/* جلسة الحفظ والمراجعة: تكرار ← ربط ← تسميع */
(function () {
  'use strict';
  const App = window.App, U = App.util, UI = App.ui, M = App.meta, S = App.store.state, H = App.hifz, Q = App.quran, A = App.audio;

  const TITLES = { new: 'وِرد اليوم', near: 'المراجعة القريبة', far: 'المراجعة البعيدة' };
  const CIRC = 2 * Math.PI * 52;
  let ses = null, gapT = null, wake = null;

  const isRep = st => st.type === 'ayah' || st.type === 'link';
  const $ = id => document.getElementById(id);

  function build(kind) {
    if (kind === 'new') {
      const t = H.today();
      if (!t.portion) return null;
      const steps = H.steps(t.portion);
      return {
        kind, steps, i: Math.min(t.step || 0, steps.length - 1), counts: t.counts,
        sub: 'سورة ' + M.name(t.portion.s) + ' · ' + U.ayahRange(t.portion.from, t.portion.to)
      };
    }
    const steps = H.reviewSteps(kind);
    if (!steps.length) return null;
    const n = steps.reduce((x, st) => x + st.ayahs.length, 0);
    return { kind, steps, i: 0, counts: {}, sub: U.count(n, U.W.ayah) };
  }

  // ---------- الرسم ----------
  function label(st) {
    if (st.type === 'ayah') return '<span class="pill">حفظ</span><b>الآية ' + U.num(st.ayahs[0]) + '</b><small>استمع وردِّد ' + U.count(st.target, U.W.time) + '</small>';
    if (st.type === 'link') return '<span class="pill gold">ربط</span><b>' + U.ayahRange(st.ayahs[0], st.ayahs[st.ayahs.length - 1]) + '</b><small>اقرأها متصلة ' + U.count(st.target, U.W.time) + '</small>';
    if (st.type === 'test') return '<span class="pill">تسميع</span><b>اختبر حفظك</b><small>اقرأ من حفظك، ثم المس الآية لكشفها والتحقق</small>';
    return '<span class="pill">مراجعة</span><b>سورة ' + M.name(st.s) + ' · ' + U.ayahRange(st.ayahs[0], st.ayahs[st.ayahs.length - 1]) + '</b><small>اقرأ من حفظك، ثم المس الآية لكشفها والتحقق</small>';
  }
  function stage(st) {
    const cover = !isRep(st);
    const parts = st.ayahs.map(a => {
      const tx = Q.text(st.s, a);
      if (!cover) return '<span class="ay" data-a="' + a + '">' + U.esc(tx) + '<span class="an">' + U.num(a) + '</span></span>';
      // أول كلمة تبقى ظاهرة كمفتاح للآية
      const w = tx.split(' ');
      const n = w[0].length <= 1 && w.length > 2 ? 2 : 1;
      return '<span class="ay cover' + (ses.revealed[a] ? ' open' : '') + '" data-act="ses-reveal" data-a="' + a + '"><span class="hint">' + U.esc(w.slice(0, n).join(' ')) + '</span> ' +
        '<span class="rest">' + U.esc(w.slice(n).join(' ')) + '</span><span class="an">' + U.num(a) + '</span></span>';
    }).join(' ');
    return '<p class="q' + (ses.hidden && !cover ? ' veil' : '') + '" id="sesText">' + parts + '</p>';
  }
  function repControls(st) {
    const c = ses.counts[ses.i] || 0, done = c >= st.target;
    return '<div class="ses-gap" id="sesGap"><span>دورك الآن… ردِّد</span><i id="sesGapBar"></i></div>' +
      '<div class="ses-ctrl">' +
      '<button class="round" data-act="ses-hide" id="sesHide">' + UI.icon(ses.hidden ? 'eyeoff' : 'eye') + '<span>' + (ses.hidden ? 'إظهار' : 'إخفاء') + '</span></button>' +
      '<button class="ring' + (done ? ' full' : '') + '" id="sesRing" data-act="ses-tap" aria-label="عدّ مرة">' +
      '<svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" id="sesArc" cx="60" cy="60" r="52" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + offset(c, st.target) + '"/></svg>' +
      '<span class="ring-in"><b id="sesCount">' + U.num(c) + '</b><small>من ' + U.num(st.target) + '</small></span></button>' +
      '<button class="round play" data-act="ses-play" id="sesPlay" aria-label="تشغيل التلاوة">' + UI.icon(ses.playing ? 'pause' : 'play', 28) + '</button>' +
      '</div>' +
      '<p class="ses-tip">شغّل التلاوة وردِّد بعدها، أو اقرأ بنفسك واضغط الدائرة مع كل مرة · <button class="link" data-act="ses-reset">تصفير العدّاد</button></p>' +
      '<footer class="ses-foot">' +
      '<button class="btn line" data-act="ses-prev"' + (ses.i === 0 ? ' disabled' : '') + '>السابق</button>' +
      '<button class="btn primary grow' + (done ? ' pulse' : '') + '" data-act="ses-next" id="sesNext">' + (done ? 'التالي' : 'تخطَّ هذه الخطوة') + '</button></footer>';
  }
  function testControls(st) {
    const last = ses.i === ses.steps.length - 1;
    const foot = st.type === 'test'
      ? '<button class="btn line" data-act="ses-again">أحتاج تكرارًا أكثر</button><button class="btn primary grow" data-act="ses-pass">' + UI.icon('check', 18) + ' أتقنتُها</button>'
      : '<button class="btn line" data-act="ses-prev"' + (ses.i === 0 ? ' disabled' : '') + '>السابق</button><button class="btn primary grow" data-act="ses-revnext">' + (last ? UI.icon('check', 18) + ' إنهاء المراجعة' : 'راجعتُها — التالي') + '</button>';
    return '<div class="ses-gap"></div><div class="ses-ctrl">' +
      '<button class="round" data-act="ses-revealall">' + UI.icon('eye') + '<span>كشف الكل</span></button>' +
      '<button class="round play" data-act="ses-play" id="sesPlay" aria-label="استماع للتحقق">' + UI.icon(ses.playing ? 'pause' : 'play', 28) + '</button>' +
      '<button class="round" data-act="ses-coverall">' + UI.icon('eyeoff') + '<span>إخفاء</span></button>' +
      '</div><p class="ses-tip">يمكنك الاستماع للتلاوة للتحقق من حفظك</p>' +
      '<footer class="ses-foot">' + foot + '</footer>';
  }
  function doneHtml() {
    const st = H.stats(), r = H.review();
    const more = ses.kind === 'new'
      ? (r.nearCount && !r.nearDone ? ['#/session/near', 'راجِع ما حفظتَه في الأيام الماضية'] : (r.farCount && !r.farDone ? ['#/session/far', 'ابدأ المراجعة البعيدة'] : null))
      : (ses.kind === 'near' && r.farCount && !r.farDone ? ['#/session/far', 'أكمل بالمراجعة البعيدة'] : null);
    return '<section class="ses done"><div class="done-in">' +
      '<div class="done-badge">' + UI.icon('check', 56) + '</div>' +
      '<h2>' + (ses.kind === 'new' ? 'أتممتَ وِرد اليوم' : 'أتممتَ المراجعة') + '</h2>' +
      '<p class="muted">بارك الله فيك وثبّت حفظك</p>' +
      '<div class="stats two"><div><b>' + U.num(st.streak) + '</b><span>' + (st.streak === 1 ? 'يوم متتالٍ' : 'أيام متتالية') + '</span></div><div><b>' + U.num(st.ayahs) + '</b><span>آية محفوظة</span></div></div>' +
      (more ? '<button class="btn ghost block" data-act="replace" data-href="' + more[0] + '">' + more[1] + '</button>' : '') +
      '<button class="btn primary block" data-act="ses-close">العودة</button>' +
      '</div></section>';
  }
  function html() {
    if (ses.finished) return doneHtml();
    const st = ses.steps[ses.i];
    return '<section class="ses">' +
      '<header class="ses-top"><button class="icon-btn" data-act="ses-close" aria-label="إغلاق">' + UI.icon('close') + '</button>' +
      '<div class="ses-title"><b>' + TITLES[ses.kind] + '</b><span>' + ses.sub + '</span></div>' +
      '<button class="icon-btn" data-act="ses-opts" aria-label="خيارات التلاوة">' + UI.icon('sliders') + '</button></header>' +
      '<div class="ses-steps">' + ses.steps.map((x, k) => '<i class="' + (k < ses.i ? 'done' : k === ses.i ? 'cur' : '') + '"></i>').join('') + '</div>' +
      '<div class="ses-label">' + label(st) + '</div>' +
      '<div class="ses-stage" id="sesStage">' + stage(st) + '</div>' +
      (isRep(st) ? repControls(st) : testControls(st)) + '</section>';
  }
  const offset = (c, target) => (CIRC * (1 - Math.min(1, c / target))).toFixed(1);

  function paint() {
    const v = $('view');
    if (v) v.innerHTML = html();
  }
  function paintCount() {
    const st = ses.steps[ses.i], c = ses.counts[ses.i] || 0, done = c >= st.target;
    if ($('sesCount')) $('sesCount').textContent = U.num(c);
    if ($('sesArc')) $('sesArc').setAttribute('stroke-dashoffset', offset(c, st.target));
    if ($('sesRing')) $('sesRing').classList.toggle('full', done);
    const nx = $('sesNext');
    if (nx) { nx.textContent = done ? 'التالي' : 'تخطَّ هذه الخطوة'; nx.classList.toggle('pulse', done); }
  }
  function paintPlay() {
    const b = $('sesPlay');
    if (b) b.innerHTML = UI.icon(ses.playing ? 'pause' : 'play', 28);
  }
  function mark(a) {
    U.$$('#sesText .ay').forEach(el => {
      const on = a != null && +el.dataset.a === a;
      el.classList.toggle('now', on);
      if (on && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }
  function showGap(ms) {
    const g = $('sesGap'), bar = $('sesGapBar');
    if (!g || !bar) return;
    g.classList.add('on');
    bar.style.transition = 'none';
    bar.style.width = '0%';
    void bar.offsetWidth;
    bar.style.transition = 'width ' + ms + 'ms linear';
    bar.style.width = '100%';
  }
  function hideGap() { const g = $('sesGap'); if (g) g.classList.remove('on'); }

  // ---------- المنطق ----------
  function persist() {
    if (ses.kind !== 'new') return;
    const t = H.today();
    t.step = ses.i; t.counts = ses.counts;
    App.store.save();
  }
  function inc() {
    const st = ses.steps[ses.i];
    const c = (ses.counts[ses.i] || 0) + 1;
    ses.counts[ses.i] = c;
    persist();
    paintCount();
    U.buzz(c === st.target ? 60 : 12);
    return c >= st.target;
  }
  function halt() {
    clearTimeout(gapT);
    A.stop();
    if (ses) ses.playing = false;
    hideGap();
    mark(null);
    paintPlay();
  }
  function play() {
    const st = ses.steps[ses.i];
    clearTimeout(gapT);
    hideGap();
    ses.playing = true;
    paintPlay();
    A.play(st.ayahs.map(a => ({ s: st.s, a })), {
      reciter: S.audio.reciter,
      rate: S.audio.rate,
      onItem: (k, it) => mark(it.a),
      onDone: total => cycleDone(total),
      onError: why => {
        if (!ses) return;
        ses.playing = false;
        paintPlay(); mark(null);
        U.toast(why === 'blocked' ? 'اضغط زر التشغيل لبدء التلاوة'
          : why === 'offline' ? 'لا يوجد اتصال بالإنترنت — يمكنك المتابعة بالقراءة والعدّ اليدوي'
          : 'تعذّر تشغيل التلاوة — تحقّق من الاتصال، أو تابع بالعدّ اليدوي', 4500);
      }
    });
  }
  function cycleDone(total) {
    if (!ses) return;
    mark(null);
    const st = ses.steps[ses.i];
    if (!isRep(st)) { ses.playing = false; paintPlay(); return; }
    const full = inc();
    const gap = S.audio.gap > 0;
    const wait = gap ? Math.min(90000, Math.max(1500, total * 1000 / (S.audio.rate || 1) * S.audio.gap)) : 400;
    if (gap) showGap(wait);
    gapT = setTimeout(() => {
      hideGap();
      if (!ses || !ses.playing) return;
      if (!full) { play(); return; }
      if (S.audio.autoNext && ses.i < ses.steps.length - 1) goto(ses.i + 1, isRep(ses.steps[ses.i + 1]));
      else { ses.playing = false; paintPlay(); }
    }, wait);
  }
  function goto(i, autoplay) {
    halt();
    ses.i = Math.max(0, Math.min(ses.steps.length - 1, i));
    ses.revealed = {};
    persist();
    paint();
    warm();
    if (autoplay) play();
  }
  // تنزيل آيات الخطوة الحالية والتالية مسبقًا
  function warm() {
    const seen = {}, list = [];
    [ses.steps[ses.i], ses.steps[ses.i + 1]].forEach(st => {
      if (!st) return;
      st.ayahs.forEach(a => { const k = st.s + ':' + a; if (!seen[k]) { seen[k] = 1; list.push({ s: st.s, a }); } });
    });
    A.prefetch(S.audio.reciter, list);
  }
  function lock() {
    try {
      if (navigator.wakeLock && !wake) navigator.wakeLock.request('screen').then(w => { wake = w; w.addEventListener('release', () => { wake = null; }); }).catch(() => {});
    } catch (e) {}
  }
  function unlock() { try { if (wake) wake.release(); } catch (e) {} wake = null; }
  const onVis = () => { if (!document.hidden && ses) lock(); };

  // ---------- الأزرار ----------
  UI.on('ses-tap', () => { if (ses && isRep(ses.steps[ses.i])) inc(); });
  UI.on('ses-play', () => { if (!ses) return; if (ses.playing) halt(); else play(); });
  UI.on('ses-reset', () => { halt(); ses.counts[ses.i] = 0; persist(); paintCount(); });
  UI.on('ses-hide', () => {
    ses.hidden = !ses.hidden;
    const tx = $('sesText'), b = $('sesHide');
    if (tx) tx.classList.toggle('veil', ses.hidden);
    if (b) b.innerHTML = UI.icon(ses.hidden ? 'eyeoff' : 'eye') + '<span>' + (ses.hidden ? 'إظهار' : 'إخفاء') + '</span>';
  });
  UI.on('ses-next', () => goto(ses.i + 1, false));
  UI.on('ses-prev', () => goto(ses.i - 1, false));
  UI.on('ses-reveal', el => {
    const a = +el.dataset.a;
    ses.revealed[a] = !ses.revealed[a];
    el.classList.toggle('open', !!ses.revealed[a]);
  });
  UI.on('ses-revealall', () => { ses.steps[ses.i].ayahs.forEach(a => { ses.revealed[a] = true; }); U.$$('#sesText .cover').forEach(el => el.classList.add('open')); });
  UI.on('ses-coverall', () => { ses.revealed = {}; U.$$('#sesText .cover').forEach(el => el.classList.remove('open')); });
  UI.on('ses-again', () => {
    // العودة إلى آخر خطوة تكرار/ربط مع تصفير عدّادها
    let k = ses.i - 1;
    while (k > 0 && !isRep(ses.steps[k])) k--;
    ses.counts[k] = 0;
    goto(k, false);
    U.toast('لا بأس — كرِّر مرة أخرى ثم عُد للتسميع');
  });
  UI.on('ses-pass', () => { halt(); H.completeNew(); ses.finished = true; unlock(); paint(); U.buzz(120); });
  UI.on('ses-revnext', () => {
    if (ses.i < ses.steps.length - 1) { goto(ses.i + 1, false); return; }
    halt(); H.completeReview(ses.kind); ses.finished = true; unlock(); paint(); U.buzz(120);
  });
  UI.on('ses-close', () => UI.back('#/hifz'));
  UI.on('ses-opts', () => {
    UI.sheet('<h3>خيارات التلاوة</h3>' + UI.audioFields() + '<button class="btn primary block" data-act="sheet-close">تم</button>');
  });

  // ---------- المسار ----------
  UI.route('/session/(new|near|far)', kind => {
    if (!Q.ready) return UI.needQuran('hifz', false);
    ses = build(kind);
    if (!ses) {
      const t = H.today();
      const msg = kind === 'new'
        ? (t.doneCount > 0 ? ['أتممتَ وِرد اليوم', 'يعود وِردك الجديد غدًا بإذن الله.'] : ['لا يوجد وِرد حاليًا', 'عدّل خطة الحفظ لاختيار سورة جديدة.'])
        : ['لا توجد مراجعة مستحقة', 'تظهر المراجعة بعد أن تحفظ وِردك الأول بيوم.'];
      return { tab: 'hifz', tabs: false, html: '<div class="state">' + UI.icon('check', 44) + '<h3>' + msg[0] + '</h3><p>' + msg[1] + '</p><button class="btn primary" data-act="ses-close">العودة</button></div>' };
    }
    ses.hidden = false; ses.revealed = {}; ses.playing = false; ses.finished = false;
    return {
      tab: 'hifz', tabs: false, html: html(),
      after() { warm(); lock(); document.addEventListener('visibilitychange', onVis); },
      cleanup() {
        clearTimeout(gapT);
        A.stop();
        unlock();
        document.removeEventListener('visibilitychange', onVis);
        ses = null;
      }
    };
  });

  // تغيير القارئ أو السرعة أثناء الجلسة يُطبَّق من الدورة التالية
  App.sessionAudioChanged = path => {
    if (!ses) return;
    if (path === 'audio.rate') A.setRate(S.audio.rate);
    if (path === 'audio.reciter') { const was = ses.playing; halt(); warm(); if (was) play(); }
  };
})();
