/* ============================================================
   Xodim Aloqalar Xaritasi — namuna ma'lumotlar (seed)
   Manba: "Xodim_Aloqalar_Xaritasi.docx", 24.10.2026.
   DIQQAT: barcha shaxslar, ismlar, raqamlar va hodisalar to'qima.
   Bitta manba: prototip (prototype/), loyiha sahifasi (index.html)
   va tekshiruv skripti (tools/verify.mjs) shu fayldan o'qiydi.
   ============================================================ */
(function (root) {
  "use strict";

  // ---------- Ma'lumotnomalar (kataloglar) ----------
  var catalog = {
    // §1 da 7 ta tur sanalgan; "Qarindoshlar tekshiruvi" ma'lumotlarda bor -> 8-tur (topilma T-02)
    checkTypes: {
      deklaratsiya: "Daromad deklaratsiyasi",
      bank:         "Bank hisoblari tahlili",
      poligraf:     "Poligraf (yolg'on detektori)",
      telefon:      "Telefon aloqalari tahlili",
      ijtimoiy:     "Ijtimoiy tarmoqlar monitoringi",
      murojaat:     "Fuqarolar murojaati",
      mulk:         "Mol-mulk reyestri",
      qarindosh:    "Qarindoshlar tekshiruvi"
    },
    results: { toza: "Toza", shubhali: "Shubhali", salbiy: "Salbiy" },
    flags: {
      sudlangan:    "Sudlangan",
      qidiruvda:    "Qidiruvda",
      jinoiy_guruh: "Jinoiy guruh a'zosi",
      korrupsiya:   "Korrupsiya ishi",
      tadbirkor:    "Tadbirkor (litsenziyali faoliyat)",
      xorijda:      "Xorijda yashaydi"
    },
    linkTypes: {
      qarindosh: "Qarindosh",
      turmush:   "Turmush o'rtog'i",
      biznes:    "Biznes hamkor",
      dost:      "Do'st",
      telefon:   "Telefon aloqasi",
      bank:      "Bank o'tkazmasi",
      tanish:    "Tanish",
      hamkasb:   "Hamkasb"
    },
    levels: { past: "Past", orta: "O'rta", yuqori: "Yuqori" },
    levelAdvice: {
      past:   "Rejali nazorat",
      orta:   "Qo'shimcha tekshiruv o'tkazish",
      yuqori: "Xizmat tekshiruvi tayinlash, rahbariyatga axborot"
    },
    // Aloqa manbasi: tekshiruv (checkId) yoki quyidagilardan biri. null = manba ko'rsatilmagan (topilma T-04)
    sources: {
      kadr:   "Shaxsiy ish (kadrlar ma'lumoti)",
      tezkor: "Tezkor ma'lumot",
      boshqa: "Boshqa hujjat"
    },
    caseStatuses: {
      yangi:     "Yangi",
      korib:     "Ko'rib chiqilmoqda",
      xizmat:    "Xizmat tekshiruvi",
      yopildi:   "Yopildi"
    },
    caseOutcomes: {
      tasdiqlanmadi: "Faktlar tasdiqlanmadi",
      intizomiy:     "Intizomiy jazo qo'llandi",
      prokuratura:   "Huquqni muhofaza organlariga yuborildi",
      profilaktika:  "Profilaktik suhbat o'tkazildi"
    }
  };

  // ---------- Metodika v1.0 (hujjat §3) ----------
  var methodology = {
    version: "1.0",
    approvedAt: "2026-10-24",
    approvedBy: "Hujjat (24.10.2026)",
    resultPoints: { toza: 0, shubhali: 15, salbiy: 30 },
    flagWeights: { sudlangan: 20, qidiruvda: 30, jinoiy_guruh: 35, korrupsiya: 25, tadbirkor: 8, xorijda: 5 },
    linkCoef: { qarindosh: 1, turmush: 1, biznes: 1.2, dost: 0.8, telefon: 0.7, bank: 1.3, tanish: 0.5, hamkasb: 0.4 },
    sharedMinWeight: 20,   // "og'irligi 20 va undan yuqori" — belgining sof og'irligi (TAXMIN, T-06)
    sharedBonus: 10,       // har bir umumiy shaxs uchun
    cap: 100,
    levels: { orta: 25, yuqori: 56 } // past 0–24, o'rta 25–55, yuqori 56–100
  };

  // ---------- Xodimlar ----------
  var employees = [
    { id: "e1", tabel: "IIV-02218", fio: "Tursunov Jasur Olimovich",     unvon: "Mayor",           lavozim: "Bo'lim boshlig'i",              bolinma: "Shahar YHXB" },
    { id: "e2", tabel: "IIV-04712", fio: "Karimov Sardor Baxtiyorovich", unvon: "Kapitan",         lavozim: "Tergovchi",                     bolinma: "Yunusobod tumani IIB" },
    { id: "e3", tabel: "IIV-01105", fio: "Xolmatov Otabek Ilhomovich",   unvon: "Podpolkovnik",    lavozim: "Bo'lim boshlig'i o'rinbosari",  bolinma: "Shahar IIBB" },
    { id: "e4", tabel: "IIV-06931", fio: "Ergashev Bekzod Rustamovich",  unvon: "Leytenant",       lavozim: "Uchastka inspektori",           bolinma: "Mirzo Ulug'bek tumani IIB" },
    { id: "e5", tabel: "IIV-03847", fio: "Nazarova Malika Shuhratovna",  unvon: "Kapitan",         lavozim: "Katta inspektor",               bolinma: "Migratsiya bo'limi" },
    { id: "e6", tabel: "IIV-05520", fio: "Rahimova Dilnoza Akmalovna",   unvon: "Katta leytenant", lavozim: "Profilaktika inspektori",       bolinma: "Chilonzor tumani IIB" }
  ];

  // ---------- Aloqador shaxslar (14) ----------
  // fio — faqat ism; izoh — rol/qarindoshlik (hujjatda ism ichida yozilgan edi, ajratildi)
  var persons = [
    { id: "p1",  fio: "Tursunova Shahlo",   izoh: "Tursunov J.O. turmush o'rtog'i",  flags: ["tadbirkor"] },
    { id: "p2",  fio: "Qodirov Anvar",      izoh: "\"Avto-Lizing Servis\" MChJ rahbari", tashkilot: "\"Avto-Lizing Servis\" MChJ", flags: ["tadbirkor", "korrupsiya"] },
    { id: "p3",  fio: "Sobirov Ilhom",      laqab: "Ilhom aka", izoh: "", flags: ["jinoiy_guruh", "sudlangan"] },
    { id: "p4",  fio: "Karimov Baxtiyor",   izoh: "Karimov S.B. otasi",              flags: [] },
    { id: "p5",  fio: "Karimova Nigora",    izoh: "Karimov S.B. turmush o'rtog'i",   flags: ["tadbirkor"] },
    { id: "p6",  fio: "Azimov Farrux",      izoh: "",                                flags: ["tadbirkor"] },
    { id: "p7",  fio: "Xolmatova Gulnora",  izoh: "Xolmatov O.I. turmush o'rtog'i",  flags: [] },
    { id: "p8",  fio: "Ergashev Rustam",    izoh: "Ergashev B.R. otasi",             flags: [] },
    { id: "p9",  fio: "Mirzayev Doniyor",   izoh: "",                                flags: ["qidiruvda"] },
    { id: "p10", fio: "Usmonov Timur",      izoh: "",                                flags: ["sudlangan"] },
    { id: "p11", fio: "Nazarov Shuhrat",    izoh: "Nazarova M.Sh. otasi",            flags: ["xorijda"] },
    { id: "p12", fio: "Yo'ldoshev Kamol",   izoh: "",                                flags: ["korrupsiya"] },
    { id: "p13", fio: "Rahimov Akmal",      izoh: "Rahimova D.A. otasi",             flags: [] },
    { id: "p14", fio: "Abdullayev Sherzod", izoh: "",                                flags: [] }
  ];

  // ---------- Tekshiruvlar (14) ----------
  var checks = [
    { id: "c1",  empId: "e1", type: "bank",        date: "2026-05-09", result: "salbiy",   conclusion: "\"Avto-Lizing Servis\" MChJdan muntazam o'tkazmalar (jami ~186 mln so'm).", persons: ["p2"] },
    { id: "c2",  empId: "e1", type: "deklaratsiya", date: "2026-05-15", result: "shubhali", conclusion: "Xarajatlar daromaddan 2,4 baravar yuqori.", persons: ["p1"] },
    { id: "c3",  empId: "e1", type: "murojaat",    date: "2026-08-02", result: "shubhali", conclusion: "Texnik ko'rikdan o'tkazishda pul talab qilingani haqida 2 ta murojaat.", persons: [] },
    { id: "c4",  empId: "e2", type: "deklaratsiya", date: "2026-03-12", result: "toza",     conclusion: "Deklaratsiya ish haqiga mos.", persons: [] },
    { id: "c5",  empId: "e2", type: "telefon",     date: "2026-06-04", result: "shubhali", conclusion: "Jinoiy guruh a'zosi bilan 3 oyda 41 marta qo'ng'iroq.", persons: ["p3"] },
    { id: "c6",  empId: "e2", type: "mulk",        date: "2026-07-20", result: "shubhali", conclusion: "Turmush o'rtog'i nomiga 2 ta tijorat bino rasmiylashtirilgan.", persons: ["p5", "p6"] },
    { id: "c7",  empId: "e3", type: "deklaratsiya", date: "2026-03-28", result: "toza",     conclusion: "", persons: [] },
    { id: "c8",  empId: "e3", type: "mulk",        date: "2026-07-03", result: "shubhali", conclusion: "MChJ ustav fondida bilvosita ulush.", persons: ["p2"] },
    { id: "c9",  empId: "e4", type: "ijtimoiy",    date: "2026-04-30", result: "shubhali", conclusion: "Qidiruvdagi shaxs bilan birga suratlar (2026-yil mart).", persons: ["p9"] },
    { id: "c10", empId: "e4", type: "poligraf",    date: "2026-09-11", result: "toza",     conclusion: "", persons: [] },
    { id: "c11", empId: "e5", type: "qarindosh",   date: "2026-01-14", result: "toza",     conclusion: "Otasi xorijda mehnat migranti.", persons: ["p11"] },
    { id: "c12", empId: "e5", type: "telefon",     date: "2026-06-21", result: "shubhali", conclusion: "Korrupsiya ishi bo'yicha shaxs bilan aloqa.", persons: ["p12"] },
    { id: "c13", empId: "e6", type: "poligraf",    date: "2026-02-18", result: "toza",     conclusion: "Reaksiyalar me'yorda.", persons: [] },
    { id: "c14", empId: "e6", type: "qarindosh",   date: "2026-02-25", result: "toza",     conclusion: "Salbiy ma'lumot yo'q.", persons: ["p13"] }
  ];

  // ---------- Aloqalar ----------
  // source: checkId | "kadr" | "tezkor" | "boshqa" | null (manba yo'q — T-04)
  var empPersonLinks = [
    { id: "l1",  empId: "e1", personId: "p1",  type: "turmush",   source: "c2" },
    { id: "l2",  empId: "e1", personId: "p2",  type: "bank",      source: "c1" },
    { id: "l3",  empId: "e1", personId: "p3",  type: "dost",      source: null },
    { id: "l4",  empId: "e2", personId: "p4",  type: "qarindosh", source: "kadr" },
    { id: "l5",  empId: "e2", personId: "p5",  type: "turmush",   source: "c6" },
    { id: "l6",  empId: "e2", personId: "p3",  type: "telefon",   source: "c5" },
    { id: "l7",  empId: "e2", personId: "p6",  type: "dost",      source: "c6" },
    { id: "l8",  empId: "e3", personId: "p7",  type: "turmush",   source: "kadr" },
    { id: "l9",  empId: "e3", personId: "p2",  type: "biznes",    source: "c8" },
    { id: "l10", empId: "e4", personId: "p8",  type: "qarindosh", source: "kadr" },
    { id: "l11", empId: "e4", personId: "p9",  type: "dost",      source: "c9" },
    { id: "l12", empId: "e4", personId: "p10", type: "tanish",    source: null },
    { id: "l13", empId: "e5", personId: "p11", type: "qarindosh", source: "c11" },
    { id: "l14", empId: "e5", personId: "p12", type: "telefon",   source: "c12" },
    { id: "l15", empId: "e6", personId: "p13", type: "qarindosh", source: "c14" },
    { id: "l16", empId: "e6", personId: "p14", type: "tanish",    source: null }
  ];

  var personLinks = [
    { id: "pl1", a: "p3", b: "p10", type: "tanish" },
    { id: "pl2", a: "p3", b: "p9",  type: "tanish" },
    { id: "pl3", a: "p5", b: "p6",  type: "biznes" },
    { id: "pl4", a: "p2", b: "p1",  type: "biznes" },
    { id: "pl5", a: "p2", b: "p12", type: "bank" }
  ];

  // Hujjatda "Xizmatdagi aloqa" sifatida bor, ma'lumotlar modelida yo'q edi (topilma T-01)
  var empLinks = [
    { id: "el1", a: "e1", b: "e3", type: "hamkasb" }
  ];

  // ---------- Xizmat tekshiruvlari (ishlar) — hujjat §8 tavsiyalari asosida ----------
  var cases = [
    { id: "K-001", empIds: ["e1"], title: "Yuqori xavf: 100 ball", status: "yangi", origin: "tizim", createdAt: "2026-10-24", owner: null, due: null, outcome: null, note: "Hujjat §8: xizmat tekshiruvi tayinlash tavsiya etilgan." },
    { id: "K-002", empIds: ["e2"], title: "Yuqori xavf: 79 ball",  status: "yangi", origin: "tizim", createdAt: "2026-10-24", owner: null, due: null, outcome: null, note: "Hujjat §8: xizmat tekshiruvi tayinlash tavsiya etilgan." },
    { id: "K-003", empIds: ["e1", "e2"], title: "Umumiy shaxs: Sobirov Ilhom (\"Ilhom aka\")", status: "yangi", origin: "tizim", createdAt: "2026-10-24", owner: null, due: null, outcome: null, note: "Hujjat §8: faoliyatini birgalikda tahlil qilish." },
    { id: "K-004", empIds: ["e1", "e3"], title: "Umumiy shaxs: Qodirov Anvar (\"Avto-Lizing Servis\")", status: "yangi", origin: "tizim", createdAt: "2026-10-24", owner: null, due: null, outcome: null, note: "Hujjat §8: faoliyatini birgalikda tahlil qilish." }
  ];

  // ---------- Foydalanuvchilar (namuna, to'qima) ----------
  var users = [
    { id: "u1", fio: "Yusupov Bahrom",       role: "inspektor", scope: ["Yunusobod tumani IIB", "Mirzo Ulug'bek tumani IIB", "Chilonzor tumani IIB"] },
    { id: "u2", fio: "Abdurahmonov Ravshan", role: "rahbar",    scope: "*" },
    { id: "u3", fio: "Qosimova Feruza",      role: "auditor",   scope: "*" },
    { id: "u4", fio: "Tojiboyev Sanjar",     role: "admin",     scope: [] }
  ];

  // Hujjatdagi natijalar — tools/verify.mjs va loyiha sahifasi taqqoslaydi
  var expected = {
    totals: { employees: 6, checks: 14, persons: 14, yuqori: 2, orta: 3, past: 1 },
    scores: { e1: 100, e2: 79, e3: 55, e4: 49, e5: 38, e6: 0 },
    parts: {
      e1: [30, 15, 15, 8, 33, 28, 20],
      e2: [15, 15, 8, 25, 6, 10],
      e3: [15, 30, 10],
      e4: [15, 24, 10],
      e5: [15, 5, 18],
      e6: []
    },
    shared: { p2: ["e1", "e3"], p3: ["e1", "e2"] }
  };

  var SEED = {
    meta: { title: "Xodim Aloqalar Xaritasi", source: "Xodim_Aloqalar_Xaritasi.docx", sourceDate: "2026-10-24", demoToday: "2026-10-26" },
    catalog: catalog,
    methodology: methodology,
    employees: employees,
    persons: persons,
    checks: checks,
    empPersonLinks: empPersonLinks,
    personLinks: personLinks,
    empLinks: empLinks,
    cases: cases,
    users: users,
    expected: expected
  };

  if (typeof module === "object" && module.exports) module.exports = SEED;
  else root.XAX_SEED = SEED;
})(typeof self !== "undefined" ? self : this);
