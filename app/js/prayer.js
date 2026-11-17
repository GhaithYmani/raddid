/* مواقيت الصلاة واتجاه القبلة — حساب فلكي على الجهاز نفسه (بلا إنترنت) */
(function () {
  'use strict';
  const App = window.App, S = App.store.state;

  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d)), tan = d => Math.tan(rad(d));
  const asin = x => deg(Math.asin(x)), acos = x => deg(Math.acos(x));
  const atan2 = (y, x) => deg(Math.atan2(y, x)), acot = x => deg(Math.atan(1 / x));
  const fix = (a, m) => { a = a % m; return a < 0 ? a + m : a; };

  // طرق الحساب: زاوية الفجر والعشاء (أو دقائق بعد المغرب)
  const METHODS = {
    MWL: { name: 'رابطة العالم الإسلامي', fajr: 18, isha: 17 },
    UMQ: { name: 'أم القرى (السعودية)', fajr: 18.5, ishaMin: 90, ishaRamadan: 120 },
    EGY: { name: 'الهيئة المصرية العامة للمساحة', fajr: 19.5, isha: 17.5 },
    KAR: { name: 'جامعة العلوم الإسلامية بكراتشي', fajr: 18, isha: 18 },
    ISNA: { name: 'الجمعية الإسلامية لأمريكا الشمالية', fajr: 15, isha: 15 },
    KWT: { name: 'الكويت', fajr: 18, isha: 17.5 },
    QTR: { name: 'قطر', fajr: 18, ishaMin: 90 },
    UAE: { name: 'الإمارات (دبي)', fajr: 18.2, isha: 18.2 },
    TUR: { name: 'تركيا (رئاسة الشؤون الدينية)', fajr: 18, isha: 17 },
    JOR: { name: 'الأردن (وزارة الأوقاف)', fajr: 18, isha: 18, maghribMin: 5 }
  };
  const NAMES = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  // [الاسم، خط العرض، خط الطول، طريقة الحساب المقترحة]
  const CITIES = [
    ['مكة المكرمة', 21.4225, 39.8262, 'UMQ'], ['المدينة المنورة', 24.4686, 39.6142, 'UMQ'], ['الرياض', 24.7136, 46.6753, 'UMQ'],
    ['جدة', 21.5433, 39.1728, 'UMQ'], ['الدمام', 26.4207, 50.0888, 'UMQ'],
    ['دمشق', 33.5138, 36.2765], ['حلب', 36.2021, 37.1343], ['حمص', 34.7324, 36.7137], ['حماة', 35.1318, 36.7578],
    ['اللاذقية', 35.5317, 35.7901], ['طرطوس', 34.889, 35.8866], ['دير الزور', 35.3359, 40.1408], ['درعا', 32.6189, 36.1021],
    ['إدلب', 35.9306, 36.6339], ['الرقة', 35.9528, 39.0079], ['الحسكة', 36.5024, 40.7477], ['السويداء', 32.709, 36.5695],
    ['عمّان', 31.9454, 35.9284, 'JOR'], ['إربد', 32.5556, 35.85, 'JOR'], ['الزرقاء', 32.0728, 36.088, 'JOR'],
    ['بيروت', 33.8938, 35.5018], ['طرابلس (لبنان)', 34.4367, 35.8497], ['صيدا', 33.5571, 35.3729],
    ['القدس', 31.7683, 35.2137], ['غزة', 31.5017, 34.4668], ['نابلس', 32.2211, 35.2544], ['الخليل', 31.5326, 35.0998], ['رام الله', 31.9038, 35.2034],
    ['بغداد', 33.3152, 44.3661], ['البصرة', 30.5085, 47.7804], ['الموصل', 36.3489, 43.1577], ['أربيل', 36.1911, 44.0092],
    ['القاهرة', 30.0444, 31.2357, 'EGY'], ['الإسكندرية', 31.2001, 29.9187, 'EGY'], ['الجيزة', 30.0131, 31.2089, 'EGY'],
    ['الكويت', 29.3759, 47.9774, 'KWT'], ['الدوحة', 25.2854, 51.531, 'QTR'], ['دبي', 25.2048, 55.2708, 'UAE'],
    ['أبوظبي', 24.4539, 54.3773, 'UAE'], ['الشارقة', 25.3463, 55.4209, 'UAE'], ['المنامة', 26.2285, 50.586, 'UMQ'], ['مسقط', 23.588, 58.3829],
    ['صنعاء', 15.3694, 44.191], ['عدن', 12.7855, 45.0187], ['الخرطوم', 15.5007, 32.5599, 'EGY'],
    ['طرابلس (ليبيا)', 32.8872, 13.1913, 'EGY'], ['بنغازي', 32.1194, 20.0868, 'EGY'], ['تونس', 36.8065, 10.1815],
    ['الجزائر', 36.7538, 3.0588], ['وهران', 35.6971, -0.6308], ['الرباط', 34.0209, -6.8416], ['الدار البيضاء', 33.5731, -7.5898], ['نواكشوط', 18.0735, -15.9582],
    ['إسطنبول', 41.0082, 28.9784, 'TUR'], ['أنقرة', 39.9334, 32.8597, 'TUR'], ['غازي عنتاب', 37.0662, 37.3833, 'TUR'],
    ['كوالالمبور', 3.139, 101.6869], ['جاكرتا', -6.2088, 106.8456], ['كراتشي', 24.8607, 67.0011, 'KAR'], ['لاهور', 31.5204, 74.3587, 'KAR'],
    ['إسلام آباد', 33.6844, 73.0479, 'KAR'], ['دكا', 23.8103, 90.4125, 'KAR'],
    ['لندن', 51.5074, -0.1278], ['باريس', 48.8566, 2.3522], ['برلين', 52.52, 13.405], ['ستوكهولم', 59.3293, 18.0686],
    ['أمستردام', 52.3676, 4.9041], ['بروكسل', 50.8503, 4.3517], ['فيينا', 48.2082, 16.3738],
    ['نيويورك', 40.7128, -74.006, 'ISNA'], ['تورنتو', 43.6532, -79.3832, 'ISNA'], ['سيدني', -33.8688, 151.2093]
  ].map(c => ({ name: c[0], lat: c[1], lng: c[2], method: c[3] || 'MWL' }));

  // موضع الشمس: الميل ومعادلة الزمن (بالساعات) عند يوم جولياني معيّن
  function sun(jd) {
    const D = jd - 2451545.0;
    const g = fix(357.529 + 0.98560028 * D, 360);
    const q = fix(280.459 + 0.98564736 * D, 360);
    const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360);
    const e = 23.439 - 0.00000036 * D;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)), 360) / 15;
    let eqt = q / 15 - RA;
    eqt -= 24 * Math.round(eqt / 24);
    return { decl: asin(sin(e) * sin(L)), eqt };
  }

  function compute(date, lat, lng, opt) {
    opt = opt || {};
    const m = METHODS[opt.method] || METHODS.MWL;
    const Y = date.getFullYear(), Mo = date.getMonth(), Da = date.getDate();
    // نقطة الأساس: منتصف ليل التوقيت العالمي لليوم الذي يقع زواله أقرب إلى ظهر اليوم المحلي
    let base = Date.UTC(Y, Mo, Da);
    const localNoon = new Date(Y, Mo, Da, 12).getTime();
    base += Math.round((localNoon - (base + (12 - lng / 15) * 36e5)) / 864e5) * 864e5;
    const jd0 = base / 864e5 + 2440587.5;

    const noonAt = h => 12 - lng / 15 - sun(jd0 + h / 24).eqt;
    const dhuhr = noonAt(noonAt(12 - lng / 15));

    // زاوية الساعة لارتفاع معيّن للشمس
    const haAlt = alt => decl => {
      const x = (sin(alt) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
      return x < -1 || x > 1 ? NaN : acos(x) / 15;
    };
    const haAsr = f => decl => haAlt(acot(f + tan(Math.abs(lat - decl))))(decl);
    const solve = (fn, dir, guess) => {
      let t = guess;
      for (let i = 0; i < 3; i++) {
        const sp = sun(jd0 + t / 24), ha = fn(sp.decl);
        if (isNaN(ha)) return NaN;
        t = 12 - lng / 15 - sp.eqt + dir * ha;
      }
      return t;
    };

    const sunrise = solve(haAlt(-0.833), -1, dhuhr - 6);
    const sunset = solve(haAlt(-0.833), 1, dhuhr + 6);
    let fajr = solve(haAlt(-m.fajr), -1, dhuhr - 7.5);
    const asr = solve(haAsr(opt.asr === 2 ? 2 : 1), 1, dhuhr + 3.5);
    const maghrib = sunset + (m.maghribMin || 0) / 60;
    let isha = m.ishaMin
      ? sunset + (opt.ramadan && m.ishaRamadan ? m.ishaRamadan : m.ishaMin) / 60
      : solve(haAlt(-m.isha), 1, dhuhr + 7.5);

    // خطوط العرض العالية: حدّ أقصى للفجر والعشاء كنسبة من الليل
    if (!isNaN(sunrise) && !isNaN(sunset)) {
      const night = 24 - (sunset - sunrise);
      const fp = night * m.fajr / 60;
      if (isNaN(fajr) || sunrise - fajr > fp) fajr = sunrise - fp;
      if (!m.ishaMin) {
        const ip = night * m.isha / 60;
        if (isNaN(isha) || isha - sunset > ip) isha = sunset + ip;
      }
    }

    const adj = opt.adjust || {};
    const mk = (h, k) => (isNaN(h) ? null : new Date(Math.round((base + h * 36e5) / 6e4) * 6e4 + (adj[k] || 0) * 6e4));
    return {
      fajr: mk(fajr, 'fajr'), sunrise: mk(sunrise, 'sunrise'), dhuhr: mk(dhuhr, 'dhuhr'),
      asr: mk(asr, 'asr'), maghrib: mk(maghrib, 'maghrib'), isha: mk(isha, 'isha')
    };
  }

  function isRamadan(date) {
    try { return parseInt(new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric' }).format(date), 10) === 9; }
    catch (e) { return false; }
  }

  const KAABA = { lat: 21.422487, lng: 39.826206 };
  function qibla(lat, lng) {
    const dL = KAABA.lng - lng;
    return fix(atan2(sin(dL), cos(lat) * tan(KAABA.lat) - sin(lat) * cos(dL)), 360);
  }
  function distanceKm(lat1, lng1, lat2, lng2) {
    const a = Math.pow(sin((lat2 - lat1) / 2), 2) + cos(lat1) * cos(lat2) * Math.pow(sin((lng2 - lng1) / 2), 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const P = App.prayer = {
    METHODS, NAMES, ORDER, CITIES, compute, qibla, fix,
    today(date) {
      const p = S.prayer;
      if (!p.loc) return null;
      date = date || new Date();
      // العصر يُحسب دائمًا على قول الجمهور (أُزيل خيار المذهب من الواجهة)
      return compute(date, p.loc.lat, p.loc.lng, { method: p.method, asr: 1, adjust: p.adjust, ramadan: isRamadan(date) });
    },
    // اسم الصلاة (الظهر يوم الجمعة = الجمعة)
    nameOf(k, date) { return k === 'dhuhr' && (date || new Date()).getDay() === 5 ? 'الجمعة' : NAMES[k]; },
    next(now) {
      now = now || new Date();
      const t = P.today(now);
      if (!t) return null;
      const keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (t[k] && t[k] > now) return { key: k, name: P.nameOf(k, now), time: t[k], times: t };
      }
      const tm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
      const t2 = P.today(tm);
      return { key: 'fajr', name: NAMES.fajr, time: t2.fajr, times: t, tomorrow: true };
    },
    qiblaHere() { const l = S.prayer.loc; return l ? qibla(l.lat, l.lng) : null; },
    distanceToKaaba() { const l = S.prayer.loc; return l ? distanceKm(l.lat, l.lng, KAABA.lat, KAABA.lng) : null; },
    nearestCity(lat, lng) {
      let best = null, bd = 1e9;
      CITIES.forEach(c => { const d = distanceKm(lat, lng, c.lat, c.lng); if (d < bd) { bd = d; best = c; } });
      return best && bd <= 60 ? best : null;
    },
    setCity(c) {
      S.prayer.loc = { lat: c.lat, lng: c.lng, name: c.name, src: 'city' };
      S.prayer.method = c.method || S.prayer.method;
      App.store.save();
    },
    // تحديد الموقع (في تطبيق الموبايل يتولّى Capacitor طلب إذن الموقع من النظام)
    locate() {
      return new Promise((res, rej) => {
        const ok = p => {
          const lat = p.coords.latitude, lng = p.coords.longitude, c = P.nearestCity(lat, lng);
          S.prayer.loc = { lat, lng, name: c ? c.name : 'موقعي الحالي', src: 'gps' };
          if (c && c.method) S.prayer.method = c.method;
          App.store.save();
          res(S.prayer.loc);
        };
        if (!navigator.geolocation) { rej(new Error('unsupported')); return; }
        navigator.geolocation.getCurrentPosition(ok, rej, { enableHighAccuracy: false, timeout: 20000, maximumAge: 36e5 });
      });
    }
  };
})();
