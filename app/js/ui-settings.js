/* الإعدادات + شاشة الترحيب عند أول تشغيل */
(function () {
  'use strict';
  const App = window.App, U = App.util, UI = App.ui, S = App.store.state, H = App.hifz, R = App.reminders;
  let step = 0;

  // ---------- الإعدادات ----------
  function remRow(key, title) {
    return '<div class="set"><span>' + title + '</span><input type="time" value="' + S.reminders[key].time + '" data-change="set-input" data-path="reminders.' + key + '.time">' + UI.toggle('reminders.' + key + '.on') + '</div>';
  }
  function reminders() {
    const mode = R.mode(), on = S.reminders.enabled;
    const note = mode === 'native' ? ''
      : mode === 'web' ? '<div class="note">' + UI.icon('info', 18) + '<p>في المتصفح تصل التنبيهات ما دام التطبيق مفتوحًا فقط. في نسخة الموبايل (أندرويد/آيفون) تعمل والتطبيق مغلق.</p></div>'
      : '<div class="note">' + UI.icon('info', 18) + '<p>هذا المتصفح لا يدعم التنبيهات.</p></div>';
    return '<div class="group-t">التذكيرات اليومية</div><div class="list">' +
      '<label class="set"><span>تفعيل التذكيرات<small>أذكار الصباح والمساء ووِرد الحفظ</small></span><input type="checkbox" class="sw" data-change="rem-master"' + (on ? ' checked' : '') + '></label>' +
      (on ? remRow('morning', 'أذكار الصباح') + remRow('evening', 'أذكار المساء') + remRow('hifz', 'وِرد الحفظ') +
        '<label class="set"><span>تنبيه عند كل صلاة<small>' + (S.prayer.loc ? 'بحسب مواقيت ' + U.esc(S.prayer.loc.name) : 'يتطلّب تحديد الموقع أولًا') + '</small></span>' + UI.toggle('reminders.prayers.on') + '</label>' : '') +
      '</div>' + note;
  }
  function adjustRows() {
    return App.prayer.ORDER.filter(k => k !== 'sunrise').map(k =>
      '<div class="set"><span>' + App.prayer.NAMES[k] + '<small>دقائق تُضاف أو تُطرح</small></span>' + UI.stepper('prayer.adjust.' + k, -30, 30) + '</div>').join('');
  }
  function settings() {
    const methods = Object.keys(App.prayer.METHODS).map(k => [k, App.prayer.METHODS[k].name]);
    return '<section class="page sub">' + UI.topbar('الإعدادات') +
      '<div class="group-t">الحفظ</div><div class="list">' +
      '<a class="set" href="#/plan"><span>خطة الحفظ<small>' + U.count(S.plan.perDay, U.W.ayah) + ' يوميًا · تكرار ' + U.num(S.plan.repeats) + '</small></span>' + UI.icon('left', 18) + '</a></div>' +
      '<div class="group-t">التلاوة</div><div class="card form">' + UI.audioFields() + '</div>' +
      reminders() +
      '<div class="group-t">المظهر</div><div class="list">' +
      '<div class="set col"><span>السِّمة</span>' + UI.seg('settings.theme', [['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']]) + '</div>' +
      '<div class="set col"><span>حجم خط المصحف</span>' + UI.seg('settings.quranScale', [[0.9, 'صغير'], [1, 'متوسط'], [1.2, 'كبير'], [1.4, 'أكبر']], 'num') + '</div>' +
      '<div class="set col"><span>الأرقام</span>' + UI.seg('settings.digits', [['arabic', '١٢٣'], ['latin', '123']], 'str', 'data-refresh') + '</div>' +
      '<label class="set"><span>نظام ٢٤ ساعة</span>' + UI.toggle('settings.time24') + '</label>' +
      '</div>' +
      '<div class="group-t">مواقيت الصلاة</div><div class="list">' +
      '<button class="set" data-act="loc-open"><span>الموقع<small>' + (S.prayer.loc ? U.esc(S.prayer.loc.name) : 'غير محدَّد') + '</small></span>' + UI.icon('left', 18) + '</button>' +
      '<div class="set col"><span>طريقة الحساب<small>اختر الجهة المعتمدة في بلدك</small></span>' + UI.select('prayer.method', methods) + '</div>' +
      adjustRows() +
      '<div class="set"><span>تعديل التاريخ الهجري<small>بالأيام</small></span>' + UI.stepper('settings.hijriOffset', -2, 2) + '</div>' +
      '</div>' +
      '<div class="group-t">بياناتي</div><div class="list">' +
      '<button class="set" data-act="data-export"><span>حفظ نسخة احتياطية<small>ملف يحوي تقدّمك وإعداداتك</small></span>' + UI.icon('left', 18) + '</button>' +
      '<label class="set"><span>استرجاع نسخة احتياطية</span><input type="file" accept="application/json,.json" data-change="data-import" class="file"></label>' +
      '<button class="set danger" data-act="data-reset-hifz"><span>تصفير تقدّم الحفظ</span></button>' +
      '<button class="set danger" data-act="data-reset-all"><span>حذف كل البيانات والبدء من جديد</span></button>' +
      '</div>' +
      '<div class="group-t">عن التطبيق</div><div class="card about"><div class="brand">' + UI.logo(40) + '<div><b>' + App.config.name + '</b><span>الإصدار ' + U.num(App.config.version) + '</span></div></div>' +
      '<p>' + U.esc(App.legal.copyright()) + '</p>' +
      '<p>تطبيق مجاني: شاركه كما هو، ولا يجوز بيعه أو تعديله أو نشره باسم آخر.</p></div>' +
      '<div class="list">' +
      '<a class="set" href="#/about"><span>الحقوق والتراخيص<small>حقوق التطبيق ومصادر المحتوى</small></span>' + UI.icon('left', 18) + '</a>' +
      '<a class="set" href="#/privacy"><span>سياسة الخصوصية<small>بياناتك كلها على جهازك فقط</small></span>' + UI.icon('left', 18) + '</a>' +
      '</div>' +
      '</section>';
  }
  UI.route('/settings', () => ({ tab: null, html: settings() }));
  UI.route('/about', () => ({
    tab: null,
    html: '<section class="page sub">' + UI.topbar('الحقوق والتراخيص', App.config.name + ' · الإصدار ' + U.num(App.config.version)) +
      '<article class="card legal">' + App.legal.rights() + '</article>' +
      '<article class="card legal">' + App.legal.sources() + '</article></section>'
  }));
  UI.route('/privacy', () => ({
    tab: null,
    html: '<section class="page sub">' + UI.topbar('سياسة الخصوصية') + '<article class="card legal">' + App.legal.privacy() + '</article></section>'
  }));

  UI.on('rem-master', el => {
    if (!el.checked) { S.reminders.enabled = false; App.store.save(); R.sync(); UI.refresh(); return; }
    R.request().then(ok => {
      S.reminders.enabled = true;
      App.store.save();
      R.sync();
      if (!ok) U.toast(R.mode() === 'none' ? 'هذا المتصفح لا يدعم التنبيهات' : 'لم يُسمح بالإشعارات — ستظهر التذكيرات داخل التطبيق فقط', 4500);
      UI.refresh();
    });
  });

  UI.on('data-export', () => {
    try {
      const blob = new Blob([App.store.exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'hifz-backup-' + U.dateStr() + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      U.toast('حُفظت النسخة الاحتياطية');
    } catch (e) { U.toast('تعذّر إنشاء النسخة الاحتياطية'); }
  });
  UI.on('data-import', el => {
    const f = el.files && el.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try { App.store.importJson(String(rd.result)); location.reload(); }
      catch (e) { U.toast('الملف غير صالح'); }
    };
    rd.readAsText(f);
  });
  UI.on('data-reset-hifz', () => UI.confirm('تصفير تقدّم الحفظ؟', 'سيُحذف سجلّ محفوظاتك وسلسلة أيامك. لا يمكن التراجع.', 'نعم، صفِّر', () => { H.resetProgress(); U.toast('تم تصفير التقدّم'); UI.refresh(); }, true));
  UI.on('data-reset-all', () => UI.confirm('حذف كل البيانات؟', 'ستُحذف الإعدادات والتقدّم والعلامات كلها ويعود التطبيق كأول مرة. لا يمكن التراجع.', 'نعم، احذف الكل', () => {
    App.store.wipe();
    location.replace('#/welcome');
    location.reload();
  }, true));

  // ---------- الترحيب ----------
  function welcome() {
    const dots = '<div class="ob-dots">' + [0, 1, 2].map(i => '<i class="' + (i === step ? 'on' : '') + '"></i>').join('') + '</div>';
    let body, next;
    if (step === 0) {
      body = '<div class="ob-hero">' + UI.logo(104) + '<h1>' + App.config.name + '</h1><p class="tag">' + App.config.tagline + '</p></div>' +
        '<ul class="ob-points">' +
        '<li>' + UI.icon('repeat', 22) + '<div><b>احفظ بالتكرار</b><span>آيات قليلة كل يوم، تسمعها وتردّدها حتى تثبت.</span></div></li>' +
        '<li>' + UI.icon('check', 22) + '<div><b>لا تنسَ ما حفظت</b><span>مراجعة يومية منظَّمة لما سبق.</span></div></li>' +
        '<li>' + UI.icon('mosque', 22) + '<div><b>رفيق يومك</b><span>المصحف كاملًا، الأذكار، مواقيت الصلاة والقبلة.</span></div></li>' +
        '</ul>';
      next = 'ابدأ';
    } else if (step === 1) {
      body = '<h2>خطة حفظك</h2><p class="muted">اختر بداية مناسبة — يمكنك تغيير كل شيء لاحقًا.</p>' +
        App.views.presets() +
        '<div class="list">' +
        '<div class="set"><span>عدد الآيات كل يوم</span>' + UI.stepper('plan.perDay', 1, 20) + '</div>' +
        '<div class="set"><span>مرات تكرار كل آية</span>' + UI.stepper('plan.repeats', 3, 40) + '</div>' +
        '<div class="set col"><span>القارئ</span>' + UI.select('audio.reciter', App.config.reciters.map(r => [r.id, r.name + ' — ' + r.style])) + '</div>' +
        '</div>';
      next = 'التالي';
    } else {
      const loc = S.prayer.loc;
      body = '<h2>موقعك وتذكيراتك</h2><p class="muted">لحساب مواقيت الصلاة والقبلة، وتذكيرك بأذكارك ووِردك.</p>' +
        '<div class="list">' +
        '<button class="set" data-act="loc-open"><span>الموقع<small>' + (loc ? U.esc(loc.name) : 'اضغط لتحديد موقعك أو اختيار مدينتك') + '</small></span>' + (loc ? UI.icon('check', 18) : UI.icon('left', 18)) + '</button>' +
        '<label class="set"><span>تذكيرات يومية<small>أذكار الصباح والمساء ووِرد الحفظ</small></span><input type="checkbox" class="sw" data-change="rem-master"' + (S.reminders.enabled ? ' checked' : '') + '></label>' +
        '</div>' +
        '<p class="muted small center">يمكنك تخطّي هذه الخطوة وضبطها لاحقًا من الإعدادات.</p>';
      next = 'ابدأ الحفظ';
    }
    return '<section class="ob"><div class="ob-body">' + body + '</div><footer class="ob-foot">' + dots +
      '<div class="ob-btns">' + (step > 0 ? '<button class="btn line" data-act="ob-prev">السابق</button>' : '') +
      '<button class="btn primary grow" data-act="ob-next">' + next + '</button></div></footer></section>';
  }
  UI.route('/welcome', () => ({ tab: null, tabs: false, html: welcome() }));
  UI.on('ob-prev', () => { step = Math.max(0, step - 1); UI.render(); });
  UI.on('ob-next', () => {
    if (step < 2) { step++; UI.render(); return; }
    S.onboarded = true;
    H.replan();
    App.store.save();
    step = 0;
    UI.replace('#/home');
  });
})();
