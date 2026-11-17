/* مواقيت الصلاة + اتجاه القبلة + اختيار الموقع */
(function () {
  'use strict';
  const App = window.App, U = App.util, UI = App.ui, S = App.store.state, P = App.prayer;
  let seg = 'times', timer = null;
  const $ = id => document.getElementById(id);

  const dec = (x, d) => { const s = x.toFixed(d); return U.latin() ? s : U.num(s).replace('.', '٫'); };

  // ---------- المواقيت ----------
  function times(now) {
    const t = P.today(now), np = P.next(now);
    const rows = P.ORDER.map(k => {
      const cls = np && !np.tomorrow && k === np.key ? ' next' : (t[k] && t[k] < now ? ' past' : '');
      return '<div class="pt' + cls + '"><span>' + P.nameOf(k, now) + '</span><time>' + U.fmtTime(t[k]) + '</time></div>';
    }).join('');
    return (np && np.time
      ? '<div class="hero"><div class="hero-top"><span>الصلاة القادمة</span>' + (np.tomorrow ? '<span>فجر الغد</span>' : '') + '</div>' +
        '<div class="hero-main"><b>' + np.name + '</b><time>' + U.fmtTime(np.time) + '</time></div>' +
        '<div class="hero-bot">بعد <bdi id="ptCount">' + U.clock(np.time - now) + '</bdi></div></div>'
      : '') +
      '<div class="list">' + rows + '</div>';
  }

  // ---------- القبلة (رسم ثابت: الشمال للأعلى) ----------
  function dial(q) {
    let ticks = '';
    for (let d = 0; d < 360; d += 10) {
      const big = d % 90 === 0, mid = d % 30 === 0;
      ticks += '<line class="tk' + (big ? ' big' : '') + '" x1="150" y1="' + (big ? 12 : 16) + '" x2="150" y2="' + (big ? 32 : mid ? 28 : 23) + '" transform="rotate(' + d + ' 150 150)"/>';
    }
    const labs = [['ش', 150, 58], ['ق', 250, 157], ['ج', 150, 256], ['غ', 50, 157]].map((l, i) =>
      '<text class="lb' + (i === 0 ? ' n' : '') + '" x="' + l[1] + '" y="' + l[2] + '" text-anchor="middle">' + l[0] + '</text>').join('');
    return '<svg viewBox="0 0 300 300"><circle class="rim" cx="150" cy="150" r="142"/>' + ticks + labs +
      '<g transform="rotate(' + q.toFixed(2) + ' 150 150)"><line class="ql" x1="150" y1="150" x2="150" y2="92"/>' +
      '<g transform="translate(150 74)"><rect class="kb" x="-15" y="-15" width="30" height="30" rx="5"/><rect class="kg" x="-15" y="-8" width="30" height="5"/></g></g>' +
      '<circle class="hub" cx="150" cy="150" r="6"/></svg>';
  }
  function qibla() {
    const q = P.qiblaHere(), km = P.distanceToKaaba();
    return '<section class="card qibla">' +
      '<div class="compass"><div class="dial">' + dial(q) + '</div></div>' +
      '<h3>القبلة عند ' + dec(q, 1) + '° من الشمال</h3>' +
      '<p class="muted">باتجاه عقارب الساعة · تبعد مكة المكرمة نحو ' + U.num(Math.round(km)) + ' كم</p>' +
      '<p class="muted small">الرسم ثابت والشمال فيه للأعلى، والمربّع الأسود يدلّ على جهة الكعبة. استعمل هذه الزاوية مع بوصلة هاتفك لتحديد الاتجاه.</p>' +
      '</section>';
  }

  // ---------- الموقع ----------
  function cityRows(q) {
    const nq = U.norm(q);
    const list = P.CITIES.map((c, i) => [c, i]).filter(x => !nq || U.norm(x[0].name).indexOf(nq) !== -1);
    return list.length
      ? list.map(x => '<button class="row" data-act="loc-city" data-i="' + x[1] + '"><span class="tx"><b>' + x[0].name + '</b></span>' +
        (S.prayer.loc && S.prayer.loc.name === x[0].name ? UI.icon('check', 18) : '') + '</button>').join('')
      : '<p class="empty">لم نجد المدينة — استعمل «تحديد موقعي تلقائيًا».</p>';
  }
  UI.openLocation = () => {
    UI.sheet('<h3>موقعك</h3>' +
      '<button class="btn primary block" data-act="loc-gps" id="gpsBtn">' + UI.icon('pin', 18) + ' تحديد موقعي تلقائيًا</button>' +
      '<p class="muted small center">موقعك يبقى على جهازك فقط ولا يُرسل لأي جهة — أو اختر أقرب مدينة:</p>' +
      '<div class="search">' + UI.icon('search', 18) + '<input type="search" placeholder="ابحث عن مدينة" data-input="loc-search" autocomplete="off"></div>' +
      '<div class="list sheet-list" id="cityList">' + cityRows('') + '</div>');
  };
  function located() {
    UI.closeSheet();
    App.reminders.sync();
    UI.refresh();
  }
  UI.on('loc-open', UI.openLocation);
  UI.on('loc-search', el => { const l = $('cityList'); if (l) l.innerHTML = cityRows(el.value); });
  UI.on('loc-city', el => { P.setCity(P.CITIES[+el.dataset.i]); located(); });
  UI.on('loc-gps', el => {
    el.disabled = true;
    el.textContent = 'جارٍ تحديد الموقع…';
    P.locate().then(located).catch(() => {
      el.disabled = false;
      el.innerHTML = UI.icon('pin', 18) + ' تحديد موقعي تلقائيًا';
      U.toast('تعذّر تحديد الموقع — اختر مدينتك من القائمة');
    });
  });

  // ---------- الصفحة ----------
  function page() {
    const loc = S.prayer.loc, now = new Date();
    const head = '<header class="ph"><div><h1>الصلاة</h1><p>' + U.esc(U.greg(now)) + ' · ' + U.esc(U.hijri(now)) + '</p></div></header>';
    if (!loc) {
      return '<section class="page">' + head + '<div class="state">' + UI.icon('pin', 44) + '<h3>حدّد موقعك</h3>' +
        '<p>تُحسب مواقيت الصلاة واتجاه القبلة على جهازك بحسب مكان إقامتك، بلا حاجة للإنترنت.</p>' +
        '<button class="btn primary" data-act="loc-open">اختيار الموقع</button></div></section>';
    }
    return '<section class="page">' + head +
      '<button class="loc" data-act="loc-open">' + UI.icon('pin', 18) + '<span>' + U.esc(loc.name) + '</span><em>تغيير</em></button>' +
      '<div class="seg wide">' + [['times', 'المواقيت'], ['qibla', 'القبلة']].map(o => '<button data-act="pr-seg" data-v="' + o[0] + '" class="' + (seg === o[0] ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div>' +
      (seg === 'times' ? times(now) : qibla()) + '</section>';
  }
  function tick() {
    const el = $('ptCount');
    if (!el) return;
    const np = P.next();
    if (!np || !np.time) return;
    const ms = np.time - Date.now();
    el.textContent = U.clock(ms);
    if (ms <= 0) UI.refresh();
  }
  UI.on('pr-seg', el => { seg = el.dataset.v; UI.refresh(); });
  UI.route('/prayer', () => ({
    tab: 'prayer',
    html: page(),
    after() { timer = setInterval(tick, 1000); },
    cleanup() { clearInterval(timer); }
  }));
})();
