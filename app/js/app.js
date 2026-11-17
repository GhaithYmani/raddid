/* نقطة البدء */
(function () {
  'use strict';
  const App = window.App, UI = App.ui, S = App.store.state, H = App.hifz;

  // هل نعمل داخل تطبيق الموبايل (Capacitor) أم في المتصفح؟
  App.native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  App.applyTheme = () => {
    const th = S.settings.theme;
    const dark = th === 'dark' || (th === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    const root = document.documentElement;
    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.setProperty('--q-scale', S.settings.quranScale || 1);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#0C1311' : '#F5F1E8';
    // لون أيقونات شريط الحالة في أندرويد يتبع سِمة التطبيق
    if (App.native) {
      try {
        const SB = (window.capacitorExports && window.capacitorExports.SystemBars) || (window.Capacitor.Plugins && window.Capacitor.Plugins.SystemBars);
        const p = SB && SB.setStyle && SB.setStyle({ style: dark ? 'DARK' : 'LIGHT' });
        if (p && p.catch) p.catch(() => {});
      } catch (e) {}
    }
  };

  // أثر تغيير أي إعداد
  App.onSetting = path => {
    if (path.indexOf('settings.') === 0) App.applyTheme();
    if (path.indexOf('plan.') === 0) H.replan();
    if (path.indexOf('reminders.') === 0 || path.indexOf('prayer.') === 0) App.reminders.sync();
    if (path.indexOf('audio.') === 0 && App.sessionAudioChanged) App.sessionAudioChanged(path);
  };

  // زر الرجوع في أندرويد: يغلق النافذة السفلية، ثم يرجع شاشة، ثم يعود للرئيسية، ثم يصغّر التطبيق
  function nativeSetup() {
    const CapApp = window.capacitorApp && window.capacitorApp.App;
    if (!CapApp || !CapApp.addListener) return;
    try {
      CapApp.addListener('backButton', () => {
        const sheet = document.getElementById('sheet-root');
        if (sheet && sheet.classList.contains('open')) { UI.closeSheet(); return; }
        if (UI.canBack()) { history.back(); return; }
        if (/^#\/(home|welcome)$/.test(location.hash || '#/home')) {
          if (CapApp.minimizeApp) CapApp.minimizeApp(); else if (CapApp.exitApp) CapApp.exitApp();
        } else UI.replace('#/home');
      });
    } catch (e) {}
  }

  // تنبيه بوجود إصدار أحدث — للنسخ الموزَّعة خارج المتاجر. يعمل فقط بعد تحديد رابط الصفحة الرسمية في config.js
  const cmpVer = (a, b) => {
    const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; }
    return 0;
  };
  function checkUpdate() {
    const site = String(App.config.site || '').replace(/\/+$/, '');
    if (!site || !App.native || navigator.onLine === false) return;
    fetch(site + '/version.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j || !j.version || cmpVer(j.version, App.config.version) <= 0) return;
        App.update = { version: String(j.version), url: site + '/' };
        if (/^#\/home$/.test(location.hash || '#/home')) UI.refresh();
      })
      .catch(() => {});
  }

  function boot() {
    App.applyTheme();
    if (window.matchMedia) {
      const mq = matchMedia('(prefers-color-scheme: dark)');
      const fn = () => App.applyTheme();
      if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn);
    }
    document.title = App.config.name + ' — تحفيظ القرآن بالتكرار';
    if (App.native) nativeSetup();

    UI.render();

    // تحميل نص المصحف والأحاديث في الخلفية، ثم تحديث الشاشة إن كانت تعرض منهما
    const repaint = re => { if (re.test(location.hash || '#/home')) UI.refresh(); };
    App.quran.load().then(() => { H.today(); repaint(/^#\/(home|hifz|plan)$/); }).catch(() => {});
    App.hadith.load().then(() => repaint(/^#\/(home|dhikr)$/)).catch(() => repaint(/^#\/dhikr$/));

    App.reminders.init();
    App.audio.prune();
    checkUpdate();

    // يوم جديد والتطبيق مفتوح: حدّث الورد
    let day = App.util.dateStr();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      const d = App.util.dateStr();
      if (d !== day) { day = d; if (/^#\/(home|hifz|dhikr|prayer)$/.test(location.hash || '#/home')) UI.refresh(); }
    });

    // عامل الخدمة للعمل بلا إنترنت (في المتصفح فقط، لا داخل تطبيق الموبايل)
    if (!App.native && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
