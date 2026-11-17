/* محرّك الحفظ:
   الورد اليومي = عدد آيات جديدة، تُحفظ على مراحل:  تكرار كل آية ← ربطها بما قبلها ← تسميع من الحفظ.
   المراجعة = قريبة (ما حُفظ في آخر ٥ أيام، يوميًا) + بعيدة (كل ما سبق، دورة مستمرة بمقدار ثابت يوميًا). */
(function () {
  'use strict';
  const App = window.App, U = App.util, M = App.meta, S = App.store.state;
  const H = App.hifz = {};
  const NEAR_DAYS = 5;

  let mem = null;
  const key = (s, a) => s * 1000 + a;
  function memSet() {
    if (!mem) {
      mem = new Set();
      S.hifz.portions.forEach(p => { for (let a = p.from; a <= p.to; a++) mem.add(key(p.s, a)); });
    }
    return mem;
  }
  H.isMem = (s, a) => memSet().has(key(s, a));

  const stepSurah = s => (S.plan.order === 'desc' ? s - 1 : s + 1);

  // أول آية غير محفوظة ابتداءً من الموضع المعطى، وفق ترتيب الخطة (null = اكتملت الخطة)
  function seek(pt) {
    let s = pt.s, a = pt.a;
    for (let g = 0; g < 7000; g++) {
      if (s < 1 || s > 114) return null;
      if (a > M.count(s)) { s = stepSurah(s); a = 1; continue; }
      if (!H.isMem(s, a)) return { s, a };
      a++;
    }
    return null;
  }

  // ورد اليوم: حتى perDay آيات متتالية من سورة واحدة، مع تقليل العدد إن كانت الآيات طويلة جدًا
  H.computePortion = pt => {
    pt = seek(pt);
    if (!pt) return null;
    const n = S.plan.perDay, max = M.count(pt.s), bal = S.plan.balance && App.quran.ready;
    const cap = Math.max(300, n * 150);
    const from = pt.a;
    let to = from, letters = bal ? App.quran.letters(pt.s, from) : 0;
    while (to - from + 1 < n && to + 1 <= max && !H.isMem(pt.s, to + 1)) {
      if (bal) {
        const L = App.quran.letters(pt.s, to + 1);
        if (letters + L > cap) break;
        letters += L;
      }
      to++;
    }
    const full = to - from + 1 === n;
    // لا نترك آية وحيدة في آخر السورة ليوم مستقل
    if (full && n >= 2 && to + 1 === max && !H.isMem(pt.s, max)) {
      if (!bal || letters + App.quran.letters(pt.s, max) <= cap * 1.35) to = max;
    }
    return { s: pt.s, from, to, short: bal && !full && to < max };
  };

  const freshDay = d => ({ date: d, portion: null, balanced: false, step: 0, counts: {}, doneCount: 0, last: null, near: false, far: false, farPick: null });

  H.today = () => {
    const d = U.dateStr();
    let t = S.hifz.today, dirty = false;
    if (!t || t.date !== d) { t = S.hifz.today = freshDay(d); dirty = true; }
    if (typeof t.doneCount !== 'number') t.doneCount = 0;
    if (!t.counts) t.counts = {};
    const started = t.step > 0 || Object.keys(t.counts || {}).length > 0;
    if (t.doneCount === 0 && (!t.portion || (!t.balanced && App.quran.ready && !started))) {
      t.portion = H.computePortion(S.hifz.pointer);
      t.balanced = App.quran.ready;
      dirty = true;
    }
    if (dirty) App.store.save();
    return t;
  };
  // تغيّرت الخطة: أعد حساب ورد اليوم إن لم يكتمل
  H.replan = () => {
    mem = null;
    const t = H.today();
    if (t.doneCount === 0 || t.portion) {
      t.portion = H.computePortion(S.hifz.pointer);
      t.balanced = App.quran.ready;
      t.step = 0; t.counts = {};
    }
    App.store.save();
  };
  H.finished = () => !seek(S.hifz.pointer);

  const linkTarget = () => Math.max(3, Math.round(S.plan.repeats / 2));

  // مراحل جلسة الحفظ
  H.steps = p => {
    const steps = [], k = p.to - p.from + 1, N = S.plan.repeats, L = linkTarget();
    for (let i = 0; i < k; i++) {
      const a = p.from + i;
      steps.push({ type: 'ayah', s: p.s, ayahs: [a], target: N });
      if (i >= 1) {
        // ربط تراكمي من أول الورد، وإن طال الورد فنافذة من آخر ٣ آيات
        const start = i < 5 ? p.from : a - 2;
        steps.push({ type: 'link', s: p.s, ayahs: U.range(start, a), target: L });
      }
    }
    if (k > 5) steps.push({ type: 'link', s: p.s, ayahs: U.range(p.from, p.to), target: Math.max(2, Math.round(L / 2)) });
    steps.push({ type: 'test', s: p.s, ayahs: U.range(p.from, p.to), target: 1 });
    return steps;
  };

  function bump() {
    const st = S.hifz.streak, d = U.dateStr();
    if (st.last === d) return;
    st.count = st.last && U.daysBetween(st.last, d) === 1 ? st.count + 1 : 1;
    st.last = d;
    if (st.count > st.best) st.best = st.count;
  }
  function log(kind, n) {
    const d = U.dateStr(), L = S.hifz.log;
    const e = L[d] || (L[d] = { n: 0, r: 0 });
    if (kind === 'new') e.n += n; else e.r += n;
    const ks = Object.keys(L).sort();
    while (ks.length > 400) delete L[ks.shift()];
  }

  H.completeNew = () => {
    const t = H.today(), p = t.portion;
    if (!p) return;
    S.hifz.portions.push({ s: p.s, from: p.from, to: p.to, date: t.date });
    mem = null;
    S.hifz.pointer = seek({ s: p.s, a: p.to + 1 }) || { s: p.s, a: p.to + 1 };
    t.doneCount++; t.last = p; t.portion = null; t.step = 0; t.counts = {};
    bump(); log('new', p.to - p.from + 1);
    App.store.save();
  };
  // ورد إضافي في اليوم نفسه
  H.extra = () => {
    const t = H.today();
    t.portion = H.computePortion(S.hifz.pointer);
    t.balanced = App.quran.ready; t.step = 0; t.counts = {};
    App.store.save();
    return t.portion;
  };

  // ---------- المراجعة ----------
  function merge(ps) {
    const arr = ps.map(p => ({ s: p.s, from: p.from, to: p.to })).sort((x, y) => x.s - y.s || x.from - y.from);
    const out = [];
    arr.forEach(p => {
      const l = out[out.length - 1];
      if (l && l.s === p.s && p.from <= l.to + 1) l.to = Math.max(l.to, p.to); else out.push(p);
    });
    return out;
  }
  const size = rs => rs.reduce((n, r) => n + r.to - r.from + 1, 0);
  const age = p => U.daysBetween(p.date, U.dateStr());

  H.nearRanges = () => merge(S.hifz.portions.filter(p => { const g = age(p); return g >= 1 && g <= NEAR_DAYS; }));

  function oldList() {
    const out = [], seen = new Set();
    S.hifz.portions.forEach(p => {
      if (age(p) <= NEAR_DAYS) return;
      for (let a = p.from; a <= p.to; a++) {
        const k = key(p.s, a);
        if (!seen.has(k)) { seen.add(k); out.push({ s: p.s, a }); }
      }
    });
    return out;
  }
  H.farAmount = () => Math.max(10, S.plan.perDay * 5);
  H.farRanges = () => {
    const old = oldList();
    if (!old.length) return [];
    const t = H.today();
    if (!t.farPick) {
      t.farPick = { start: S.hifz.farCursor % old.length, len: Math.min(old.length, H.farAmount()) };
      App.store.save();
    }
    const out = [];
    for (let k = 0; k < Math.min(t.farPick.len, old.length); k++) {
      const it = old[(t.farPick.start + k) % old.length], l = out[out.length - 1];
      if (l && l.s === it.s && it.a === l.to + 1) l.to = it.a; else out.push({ s: it.s, from: it.a, to: it.a });
    }
    return out;
  };
  H.review = () => {
    const t = H.today(), near = H.nearRanges(), far = H.farRanges();
    return { near, far, nearCount: size(near), farCount: size(far), nearDone: !!t.near, farDone: !!t.far };
  };
  H.reviewSteps = kind => {
    const out = [];
    (kind === 'near' ? H.nearRanges() : H.farRanges()).forEach(r => {
      for (let a = r.from; a <= r.to; a += 10) out.push({ type: 'review', s: r.s, ayahs: U.range(a, Math.min(r.to, a + 9)), target: 1 });
    });
    return out;
  };
  H.completeReview = kind => {
    const t = H.today();
    if (kind === 'near') t.near = true;
    else {
      t.far = true;
      const n = oldList().length;
      if (t.farPick && n) S.hifz.farCursor = (t.farPick.start + t.farPick.len) % n;
    }
    bump(); log('review', 1);
    App.store.save();
  };

  // ---------- الخطة ----------
  H.setStart = (s, a, order) => {
    if (order) S.plan.order = order;
    S.hifz.pointer = { s, a: a || 1 };
    H.replan();
  };
  // سور محفوظة مسبقًا: تُتخطّى في الحفظ الجديد وتدخل دورة المراجعة البعيدة
  H.isPre = s => S.hifz.portions.some(p => p.pre && p.s === s);
  H.setPre = (s, on) => {
    S.hifz.portions = S.hifz.portions.filter(p => !(p.pre && p.s === s));
    if (on) S.hifz.portions.unshift({ s, from: 1, to: M.count(s), date: U.addDays(U.dateStr(), -30), pre: true });
    H.replan();
  };
  H.resetProgress = () => {
    S.hifz.portions = []; S.hifz.today = null; S.hifz.farCursor = 0; S.hifz.log = {};
    S.hifz.streak = { count: 0, best: 0, last: null };
    mem = null;
    H.today();
    App.store.save();
  };

  // ---------- إحصاءات ----------
  H.streak = () => {
    const st = S.hifz.streak;
    return st.last && U.daysBetween(st.last, U.dateStr()) <= 1 ? st.count : 0;
  };
  H.surahDone = s => { let n = 0; for (let a = 1; a <= M.count(s); a++) if (H.isMem(s, a)) n++; return n; };
  H.stats = () => {
    const ayahs = memSet().size;
    return { ayahs, pct: ayahs / M.total, streak: H.streak(), best: S.hifz.streak.best, days: Object.keys(S.hifz.log).length };
  };
  H.memRanges = () => merge(S.hifz.portions);
  H.week = () => {
    const out = [], d = U.dateStr();
    for (let i = 6; i >= 0; i--) {
      const k = U.addDays(d, -i), e = S.hifz.log[k];
      out.push({ date: k, on: !!e, today: i === 0 });
    }
    return out;
  };
  // تقدير المدة المتبقية بالأيام
  H.estimate = () => {
    const per = Math.max(1, S.plan.perDay), pt = seek(S.hifz.pointer);
    const all = Math.ceil((M.total - memSet().size) / per);
    if (!pt) return { surah: 0, all, s: null };
    let left = 0;
    for (let a = 1; a <= M.count(pt.s); a++) if (!H.isMem(pt.s, a)) left++;
    return { surah: Math.ceil(left / per), all, s: pt.s };
  };
})();
