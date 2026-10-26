# Xodim Aloqalar Xaritasi

Ichki ishlar xodimlari faoliyatini nazorat qilish tizimi: tekshiruvlarni yagona tarmoqda bog'lash va
aloqador shaxslar bilan aloqalarni tahlil qilish. Loyiha tuzilishi (BA), interaktiv nazorat paneli
prototipi va xavf bali dvigateli.

> **Namuna ma'lumotlar.** Barcha shaxslar, ismlar, raqamlar va hodisalar to'qima — manba hujjatdagi
> (`Xodim_Aloqalar_Xaritasi.docx`, 24.10.2026) namuna bilan bir xil.

## Onlayn ko'rish

- **Loyiha tuzilishi:** https://sharofiddin1952-blip.github.io/xodim-aloqalar-xaritasi/
- **Nazorat paneli:** https://sharofiddin1952-blip.github.io/xodim-aloqalar-xaritasi/prototype/admin-panel.html

## Qanday ochish

O'rnatish, internet yoki build kerak emas — fayllarni brauzerda oching:

| Fayl | Nima |
|---|---|
| [`index.html`](index.html) | **Loyiha tuzilishi**: maqsad, skoup, rollar, 13 ekran, ma'lumotlar modeli, metodika, jarayonlar, hujjat tahlili (13 topilma), 16 ochiq savol, takliflar, NFT, arxitektura, yo'l xaritasi |
| [`prototype/admin-panel.html`](prototype/admin-panel.html) | **Nazorat paneli** (Garant panellari uslubida): bosh sahifa, xodimlar, profil, graf (xodim tarmog'i / umumiy / yo'l topish), umumiy aloqalar, tekshiruvlar, shaxslar, xizmat tekshiruvlari, hisobot, metodika, ma'lumotnomalar, rollar, audit |

Yoki lokal server bilan:

```bash
node tools/serve.mjs
```

→ `http://localhost:8090/`

**Demo:** yuqori o'ngdagi foydalanuvchi menyusidan rolni almashtiring — Rahbar (hammasi), Inspektor
(3 ta bo'linma, qolganlar "Yopiq xodim"), Auditor (faqat o'qish + audit), Administrator (dosyelarsiz).
Kiritilgan ma'lumotlar brauzer xotirasida saqlanadi; "Demo ma'lumotlarni tiklash" boshlang'ich holatga qaytaradi.

## Tekshiruv

```bash
node tools/verify.mjs
```

Hujjatdagi jami ko'rsatkichlar (6 xodim / 14 tekshiruv / 14 shaxs), har bir xodimning bali va uning
tarkibi, umumiy aloqalar va yaxlitlash qoidasini dvigatel bilan qayta hisoblab taqqoslaydi. Hozir: **hammasi mos**.

## Tuzilish

```
index.html              Loyiha tuzilishi (BA hujjati, HTML)
prototype/
  admin-panel.html      Nazorat paneli — 13 ekran, dizayn tizimi
  app.js                Ekranlar, rollar (RBAC), formalar, ishlar, metodika, audit
  graph.js              SVG graf: force layout, zoom, sudrash, yo'lni ajratish (kutubxonasiz)
src/engine.js           Xavf bali dvigateli: ball, umumiy/bilvosita aloqa, klaster, yo'l topish
data/seed.js            Namuna ma'lumotlar, kataloglar, metodika v1.0, kutilgan natijalar
tools/verify.mjs        Hujjat bilan avtomatik taqqoslash
tools/serve.mjs         Lokal statik server
```

Bitta manba: prototip, loyiha sahifasi va tekshiruv skripti bir xil `data/seed.js` va `src/engine.js` dan o'qiydi.

## Asosiy topilmalar (batafsil — `index.html` §8)

- **Ballar to'g'ri:** 100 / 79 / 55 / 49 / 38 / 0 — dvigatel bilan tasdiqlandi.
- **Bilvosita aloqalar ballga kirmaydi (T-07):** Ergashev va Nazarova ikki xavf klasteriga shaxs → shaxs orqali ulangan; hujjat tavsiyalarida ular yo'q.
- **Manbasiz aloqalar ballga ta'sir qiladi (T-04):** +28 va +10 ball hech qaysi tekshiruvda aniqlanmagan aloqalardan.
- **Modelda yetishmaydi:** xodim–xodim aloqasi, tashkilot (STIR), shaxs identifikatori (JShShIR), tekshiruv asosi, xizmat tekshiruvi (ish).
- **Yaxlitlash:** yarmi yuqoriga; `35 × 0.7` float xatosi dvigatelda himoyalangan.

Belgilar: `HUJJAT` — manbadan, `TAKLIF` — bizning taklif, `TAXMIN` — javob kelguncha faraz.
