/* التذكيرات اليومية (أذكار الصباح والمساء، ورد الحفظ، مواقيت الصلاة).
   - داخل تطبيق الموبايل (Capacitor): إشعارات محلية مجدولة تعمل والتطبيق مغلق.
   - في المتصفح: تنبيهات تعمل ما دام التطبيق مفتوحًا فقط (قيد من المتصفحات). */
(function () {
  'use strict';
  const App = window.App, U = App.util, S = App.store.state;
  const R = App.reminders = {};
  let timers = [];

  function native() {
    const C = window.Capacitor;
    if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
    return (window.capacitorLocalNotifications && window.capacitorLocalNotifications.LocalNotifications)
      || (C.Plugins && C.Plugins.LocalNotifications) || null;
  }
  R.mode = () => (native() ? 'native' : ('Notification' in window ? 'web' : 'none'));

  R.granted = () => {
    const LN = native();
    if (LN) return LN.checkPermissions().then(p => p.display === 'granted').catch(() => false);
    return Promise.resolve('Notification' in window && Notification.permission === 'granted');
  };
  R.request = () => {
    const LN = native();
    if (LN) return LN.requestPermissions().then(p => p.display === 'granted').catch(() => false);
    if (!('Notification' in window)) return Promise.resolve(false);
    try {
      return Promise.resolve(Notification.requestPermission()).then(p => p === 'granted').catch(() => false);
    } catch (e) { return Promise.resolve(false); }
  };

  // التذكيرات الثابتة اليومية
  function daily() {
    const r = S.reminders, out = [];
    const add = (id, cfg, title, body, route) => {
      if (!cfg || !cfg.on) return;
      const t = U.hm(cfg.time);
      out.push({ id, title, body, route, hour: t.h, minute: t.m });
    };
    add(101, r.morning, 'أذكار الصباح', 'ابدأ يومك بذكر الله.', '#/dhikr/morning');
    add(102, r.evening, 'أذكار المساء', 'حان وقت أذكار المساء.', '#/dhikr/evening');
    add(103, r.hifz, 'وِرد اليوم', 'آياتك الجديدة بانتظارك — دقائق قليلة تكفي.', '#/session/new');
    return out;
  }
  // مواقيت الصلاة لعدد من الأيام القادمة
  function prayers(days) {
    const out = [];
    if (!S.reminders.prayers.on || !S.prayer.loc) return out;
    const now = new Date();
    for (let d = 0; d < days; d++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 12);
      const t = App.prayer.today(day);
      ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((k, i) => {
        if (t && t[k] && t[k] > now) {
          out.push({ id: 1000 + d * 10 + i, title: 'حان وقت صلاة ' + App.prayer.nameOf(k, day), body: U.fmtTime(t[k]) + ' — ' + S.prayer.loc.name, route: '#/prayer', at: t[k] });
        }
      });
    }
    return out;
  }

  function showWeb(n) {
    U.toast(n.title + ' — ' + n.body, 6000);
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body: n.body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', dir: 'rtl', lang: 'ar', tag: 'r' + n.id, data: { route: n.route } };
    const plain = () => {
      try {
        const x = new Notification(n.title, opts);
        x.onclick = () => { window.focus(); location.hash = n.route; x.close(); };
      } catch (e) {}
    };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => reg.showNotification(n.title, opts)).catch(plain);
    } else plain();
  }

  function syncWeb() {
    timers.forEach(clearTimeout);
    timers = [];
    if (!S.reminders.enabled) return;
    const now = new Date();
    daily().forEach(n => {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), n.hour, n.minute);
      const ms = at - now;
      if (ms > 0 && ms < 864e5) timers.push(setTimeout(() => showWeb(n), ms));
    });
    prayers(1).forEach(n => {
      const ms = n.at - now;
      if (ms > 0 && ms < 864e5) timers.push(setTimeout(() => showWeb(n), ms));
    });
    // إعادة الجدولة بعد منتصف الليل
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 30);
    timers.push(setTimeout(R.sync, midnight - now));
  }

  function syncNative(LN) {
    // التنبيه الدقيق يُطلب فقط إن كان مسموحًا به أصلًا؛ وإلا فتحت المكتبة شاشة إعدادات النظام عند كل جدولة
    const exactP = LN.checkExactNotificationSetting
      ? LN.checkExactNotificationSetting().then(r => !!r && r.exact_alarm === 'granted').catch(() => false)
      : Promise.resolve(false);
    let exact = false;
    return exactP
      .then(ok => { exact = ok; return LN.getPending(); })
      .then(res => {
        const ids = ((res && res.notifications) || []).map(n => ({ id: n.id }));
        return ids.length ? LN.cancel({ notifications: ids }) : null;
      })
      .then(() => {
        if (!S.reminders.enabled) return null;
        const list = daily().map(n => ({
          id: n.id, title: n.title, body: n.body, extra: { route: n.route }, isExactNotification: exact,
          schedule: { on: { hour: n.hour, minute: n.minute }, allowWhileIdle: true }
        })).concat(prayers(6).map(n => ({
          id: n.id, title: n.title, body: n.body, extra: { route: n.route }, isExactNotification: exact,
          schedule: { at: n.at, allowWhileIdle: true }
        })));
        return list.length ? LN.schedule({ notifications: list }) : null;
      })
      .catch(() => {});
  }

  R.sync = () => {
    const LN = native();
    if (LN) return syncNative(LN);
    syncWeb();
    return Promise.resolve();
  };

  R.init = () => {
    const LN = native();
    if (LN && LN.addListener) {
      try {
        LN.addListener('localNotificationActionPerformed', ev => {
          const route = ev && ev.notification && ev.notification.extra && ev.notification.extra.route;
          if (route) location.hash = route;
        });
      } catch (e) {}
    }
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data && e.data.type === 'open-route' && e.data.route) location.hash = e.data.route;
      });
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) R.sync(); });
    R.sync();
  };
})();
