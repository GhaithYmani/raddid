/* إعدادات التطبيق الثابتة — غيّر الاسم من هنا فقط */
(function () {
  'use strict';
  const App = window.App = window.App || {};

  App.config = {
    name: 'ردِّد',
    nameLatin: 'Raddid',
    tagline: 'ردِّد.. حتى تحفظ',
    version: '1.0.1',
    storageKey: 'hifzapp.v1',

    // صاحب الحقوق وبيانات النشر (تظهر في صفحة «الحقوق والتراخيص» وسياسة الخصوصية)
    owner: 'غيث يماني',
    year: 2026,
    contact: '',          // بريد خاص بالتطبيق — اتركه فارغًا إلى أن تنشئه
    site: 'https://ghaithymani.github.io/raddid/',   // رابط صفحة التطبيق الرسمية
    policyDate: '13 نوفمبر 2026',

    // مصدر نص المصحف (يُحمَّل مرة واحدة ثم يُحفظ على الجهاز، أو يُضمَّن مع التطبيق عبر tools/bundle-data.js)
    quran: {
      url: 'https://api.alquran.cloud/v1/quran/quran-uthmani',
      credit: 'نص المصحف بالرسم العثماني من مشروع «تنزيل» (tanzil.net) عبر خدمة alquran.cloud'
    },

    // الأربعون النووية
    hadith: {
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nawawi.min.json',
      credit: 'متن الأربعين النووية من مشروع hadith-api المفتوح'
    },

    // التلاوات: ملف صوتي لكل آية من everyayah.com، مع مصدر احتياطي عند تعذّر الأول
    audio: {
      primary: 'https://everyayah.com/data/',
      fallback: 'https://cdn.islamic.network/quran/audio/128/',
      credit: 'التلاوات الصوتية من موقع everyayah.com'
    },

    reciters: [
      { id: 'husary', name: 'محمود خليل الحصري', style: 'مرتَّل', folder: 'Husary_128kbps', alt: 'ar.husary' },
      { id: 'husary_muallim', name: 'محمود خليل الحصري', style: 'المصحف المعلِّم (للتلقين)', folder: 'Husary_Muallim_128kbps' },
      { id: 'husary_mujawwad', name: 'محمود خليل الحصري', style: 'مجوَّد', folder: 'Husary_128kbps_Mujawwad', alt: 'ar.husarymujawwad' },
      { id: 'minshawi', name: 'محمد صدّيق المنشاوي', style: 'مرتَّل', folder: 'Minshawy_Murattal_128kbps', alt: 'ar.minshawi' },
      { id: 'minshawi_muallim', name: 'محمد صدّيق المنشاوي', style: 'المصحف المعلِّم (للتلقين)', folder: 'Minshawy_Teacher_128kbps' },
      { id: 'minshawi_mujawwad', name: 'محمد صدّيق المنشاوي', style: 'مجوَّد', folder: 'Minshawy_Mujawwad_192kbps' }
    ]
  };

  App.reciter = id => App.config.reciters.find(r => r.id === id) || App.config.reciters[0];
})();
