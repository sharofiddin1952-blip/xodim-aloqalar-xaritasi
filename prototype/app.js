/* ============================================================
   Xodim Aloqalar Xaritasi — nazorat paneli (prototip)
   Holat brauzer xotirasida (localStorage) saqlanadi; "Demo ma'lumotlarni
   tiklash" hujjatdagi boshlang'ich holatga qaytaradi.
   ============================================================ */
(function () {
  "use strict";
  var SEED = window.XAX_SEED, EN = window.XAX_ENGINE;
  var CAT = SEED.catalog, TODAY = SEED.meta.demoToday, LS_KEY = "xax-demo-v1";

  // ============================================================ utils
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtDate(iso) { if (!iso) return "—"; var p = iso.slice(0, 10).split("-"); return p[2] + "." + p[1] + "." + p[0]; }
  function fmtTs(ts) { var d = new Date(ts); return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
  function addDays(iso, n) { return new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10); }
  function initials(fio) { var p = fio.split(" "); return (p[0][0] + (p[1] ? p[1][0] : "")).toUpperCase(); }
  function shortName(fio) { var p = fio.split(" "); return p[0] + (p[1] ? " " + p[1] : ""); }
  // O'zbek lotin harflari: Sh, Ch, O', G' — bitta harf (Nazarova M.Sh.)
  function firstLetter(w) { var m = /^(Sh|Ch|O'|G'|O‘|G‘)/.exec(w); return m ? m[1] : w[0]; }
  function shortFio(fio) { var p = fio.split(" "); return p[0] + (p[1] ? " " + firstLetter(p[1]) + "." : "") + (p[2] ? firstLetter(p[2]) + "." : ""); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function norm(s) { return String(s || "").toLowerCase().replace(/[‘’ʻʼ'"`«»]/g, "").replace(/\s+/g, " ").trim(); }
  function nextId(prefix, list, key) {
    var max = 0;
    list.forEach(function (x) { var n = parseInt(String(x[key || "id"]).replace(/\D/g, ""), 10); if (n > max) max = n; });
    return prefix + (max + 1);
  }

  var ICONS = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c2 .7 3.2 2.5 3.6 5.2"/>',
    graph: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6.3l7 .5M7.2 8.3l3.7 7.4M16.9 9.3l-3.7 6.5"/>',
    link: '<path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.4 4.2-6.5 8-6.5s7 2.1 8 6.5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5M8 7h7"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>',
    fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 000-6H9a3 3 0 010-6h6.5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    zin: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M8 11h6M11 8v6"/>',
    zout: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M8 11h6"/>'
  };
  function icon(n) { return '<svg class="i" viewBox="0 0 24 24">' + ICONS[n] + "</svg>"; }

  // ============================================================ state
  function freshState() {
    var s = clone(SEED);
    delete s.expected;
    s.audit = [
      { ts: "2026-10-24T09:00:00", user: "Tizim", role: "tizim", action: "Ma'lumotlar importi", object: "Hujjat 24.10.2026", details: "6 xodim, 14 tekshiruv, 14 shaxs, 22 aloqa", refs: [] },
      { ts: "2026-10-24T09:01:00", user: "Tizim", role: "tizim", action: "Xavf bali hisoblandi", object: "Metodika v1.0", details: "Yuqori 2, o'rta 3, past 1", refs: [] },
      { ts: "2026-10-24T09:01:30", user: "Tizim", role: "tizim", action: "Ish yaratildi", object: "K-001 … K-004", details: "Yuqori xavf va umumiy shaxs signallari (hujjat §8)", refs: ["e1", "e2", "e3"] }
    ];
    s.methodVersions = [{ version: "1.0", at: "2026-10-24T09:00:00", by: "Hujjat (24.10.2026)", note: "Boshlang'ich: hujjat §3", changes: [] }];
    s.methodDraft = null;
    s.currentUser = "u2";
    s.notifications = [];
    return s;
  }
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { var o = JSON.parse(raw); if (o && o.v === 1 && o.state) return o.state; }
    } catch (e) { /* xotira yopiq bo'lishi mumkin */ }
    return freshState();
  }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 1, state: S })); } catch (e) { /* jim */ } }

  var S = load();
  var R = EN.compute(S);
  var VIEWED = {};
  var GRAPH = null;
  var GS = { mode: "xodim", emp: null, depth: 2, checks: true, clean: true, labels: true, from: null, to: null, sel: null };
  var UI = { riskPlan: false };

  var E = function (id) { return S.employees.filter(function (e) { return e.id === id; })[0]; };
  var P = function (id) { return S.persons.filter(function (p) { return p.id === id; })[0]; };
  var C = function (id) { return S.checks.filter(function (c) { return c.id === id; })[0]; };
  var U = function (id) { return S.users.filter(function (u) { return u.id === id; })[0]; };

  // ============================================================ roles
  var ROLES = {
    inspektor: { name: "Inspektor", desc: "Tekshiruv, aloqa va shaxslarni kiritadi. Faqat biriktirilgan bo'linmalar." },
    rahbar: { name: "Rahbar", desc: "Barcha xodimlar. Xizmat tekshiruvi tayinlaydi, metodikani tasdiqlaydi." },
    auditor: { name: "Auditor", desc: "Faqat o'qish. Audit jurnali va eksporti." },
    admin: { name: "Administrator", desc: "Foydalanuvchilar, ma'lumotnomalar, metodika loyihasi. Xodim dosyelarini ko'rmaydi." },
    tizim: { name: "Tizim", desc: "" }
  };
  var MATRIX = [
    ["view_dossier", "Xodim profili, tekshiruvlar, aloqalar, graf", { inspektor: "scope", rahbar: true, auditor: "read", admin: false }],
    ["edit_data", "Tekshiruv, aloqa, shaxs kiritish va belgilarni o'zgartirish", { inspektor: "scope", rahbar: true, auditor: false, admin: false }],
    ["case_manage", "Xizmat tekshiruvini tayinlash va yopish", { inspektor: false, rahbar: true, auditor: false, admin: false }],
    ["report", "Tahliliy hisobot", { inspektor: "scope", rahbar: true, auditor: "read", admin: false }],
    ["export", "Ma'lumotlarni eksport qilish (JSON / CSV)", { inspektor: false, rahbar: true, auditor: false, admin: false }],
    ["method_draft", "Metodika loyihasini tayyorlash", { inspektor: false, rahbar: false, auditor: false, admin: true }],
    ["method_approve", "Metodikani tasdiqlash (four-eyes)", { inspektor: false, rahbar: true, auditor: false, admin: false }],
    ["reference", "Ma'lumotnomalarni yuritish", { inspektor: false, rahbar: false, auditor: false, admin: true }],
    ["users", "Foydalanuvchilar va rollarni boshqarish", { inspektor: false, rahbar: false, auditor: false, admin: true }],
    ["audit", "Audit jurnalini ko'rish", { inspektor: false, rahbar: true, auditor: true, admin: false }],
    ["audit_export", "Audit jurnalini eksport qilish", { inspektor: false, rahbar: false, auditor: true, admin: false }]
  ];
  function me() { return U(S.currentUser) || S.users[0]; }
  function role() { return me().role; }
  function can(perm) {
    var row = MATRIX.filter(function (r) { return r[0] === perm; })[0];
    return !!(row && row[2][role()]);
  }
  function canSeeEmp(e) {
    if (typeof e === "string") e = E(e);
    var u = me();
    if (!e || u.role === "admin") return false;
    return u.scope === "*" || u.scope.indexOf(e.bolinma) >= 0;
  }
  function visibleEmps() { return S.employees.filter(canSeeEmp); }
  function visiblePersonSet() {
    var set = {};
    if (role() === "admin") return set;
    if (me().scope === "*") { S.persons.forEach(function (p) { set[p.id] = true; }); return set; }
    var first = {};
    S.empPersonLinks.forEach(function (l) { if (canSeeEmp(l.empId)) first[l.personId] = true; });
    Object.keys(first).forEach(function (k) { set[k] = true; });
    S.personLinks.forEach(function (pl) { if (first[pl.a]) set[pl.b] = true; if (first[pl.b]) set[pl.a] = true; });
    return set;
  }
  function empName(e) { if (typeof e === "string") e = E(e); return canSeeEmp(e) ? e.fio : "Yopiq xodim"; }
  function scoped() { return me().scope !== "*"; }

  // ============================================================ small renderers
  function levelBadge(l) { return '<span class="badge ' + (l === "yuqori" ? "b-red" : l === "orta" ? "b-amber" : "b-green") + '">' + CAT.levels[l] + " xavf</span>"; }
  function resultBadge(r) { return '<span class="badge ' + (r === "salbiy" ? "b-red" : r === "shubhali" ? "b-amber" : "b-green") + '">' + CAT.results[r] + "</span>"; }
  function scoreBox(id) { var s = R.byEmp[id]; return '<span class="score ' + s.level + '" title="' + (s.raw > s.score ? "Xom ball: " + s.raw : "") + '">' + s.score + "</span>"; }
  function flagChip(f) {
    var w = S.methodology.flagWeights[f] || 0;
    return '<span class="badge ' + (w >= 25 ? "b-red" : w >= 20 ? "b-amber" : "b-green") + '" title="Og\'irlik: ' + w + '">' + esc(CAT.flags[f]) + "</span>";
  }
  function flagChips(p) { return p.flags.length ? '<div class="chips">' + p.flags.map(flagChip).join("") + "</div>" : '<span class="muted">—</span>'; }
  function avatar(e, lg) {
    if (!canSeeEmp(e)) return '<div class="avatar locked' + (lg ? " lg" : "") + '">' + icon("lock") + "</div>";
    return '<div class="avatar ' + R.byEmp[e.id].level + (lg ? " lg" : "") + '">' + initials(e.fio) + "</div>";
  }
  function empCell(e, sub) {
    if (!canSeeEmp(e)) return '<div class="emp-cell">' + avatar(e) + '<div><div class="fio">Yopiq xodim</div><div class="sub2">Sizga biriktirilmagan bo\'linma</div></div></div>';
    return '<div class="emp-cell">' + avatar(e) + '<div><div class="fio">' + esc(e.fio) + '</div><div class="sub2">' + (sub || '<span class="mono">' + esc(e.tabel) + "</span> · " + esc(e.unvon)) + "</div></div></div>";
  }
  function empLink(id) { var e = E(id); return canSeeEmp(e) ? '<a href="#/xodim/' + id + '">' + esc(shortFio(e.fio)) + "</a>" : '<span class="muted">Yopiq xodim</span>'; }
  function personLink(id) { var p = P(id); return '<a href="javascript:void 0" data-act="person" data-id="' + id + '">' + esc(EN.personDisplay(p)) + "</a>"; }
  function sourceHtml(l) {
    if (!l.source) return '<span class="warn-src" title="Topilma T-04">' + icon("alert") + " Manba ko'rsatilmagan</span>";
    var c = C(l.source);
    if (c) return '<span class="dim">Tekshiruv: ' + esc(CAT.checkTypes[c.type]) + " · " + fmtDate(c.date) + "</span>";
    return '<span class="dim">' + esc(CAT.sources[l.source] || l.source) + (l.sourceNote ? ": " + esc(l.sourceNote) : "") + "</span>";
  }
  function miniBar(id) {
    var s = R.byEmp[id], col = s.level === "yuqori" ? "#B3261E" : s.level === "orta" ? "#B5894A" : "#157A4A";
    return '<div class="mini-bar"><i style="width:' + Math.max(2, s.score) + "%;background:" + col + '"></i></div>';
  }
  var SHORT_TYPE = { deklaratsiya: "Deklaratsiya", bank: "Bank", poligraf: "Poligraf", telefon: "Telefon", ijtimoiy: "Ijt. tarmoq", murojaat: "Murojaat", mulk: "Mol-mulk", qarindosh: "Qarindoshlar" };

  // ============================================================ derived
  function lastCheck(empId) {
    var d = null;
    S.checks.forEach(function (c) { if (c.empId === empId && (!d || c.date > d)) d = c.date; });
    return d;
  }
  var PLAN_RISK = { yuqori: 30, orta: 60, past: 90 };
  function planInfo(empId) {
    var interval = UI.riskPlan ? PLAN_RISK[R.byEmp[empId].level] : 90;
    var last = lastCheck(empId);
    if (!last) return { interval: interval, last: null, due: TODAY, left: 0, status: "overdue" };
    var due = addDays(last, interval), left = daysBetween(TODAY, due);
    return { interval: interval, last: last, due: due, left: left, since: daysBetween(last, TODAY), status: left < 0 ? "overdue" : left <= 15 ? "soon" : "ok" };
  }
  function openCasesFor(empId) {
    return S.cases.filter(function (k) { return k.empIds.indexOf(empId) >= 0 && k.status !== "yopildi"; });
  }
  function unsourcedImpact() {
    var out = [];
    visibleEmps().forEach(function (e) {
      R.byEmp[e.id].parts.forEach(function (p) { if (p.kind === "person" && p.unsourced) out.push({ empId: e.id, part: p }); });
    });
    return out;
  }
  function visibleIndirect() {
    return R.indirect.filter(function (x) { return canSeeEmp(x.a) || canSeeEmp(x.b); });
  }
  function indirectPairs(list) {
    var o = {};
    list.forEach(function (x) { o[[x.a, x.b].sort().join("|")] = true; });
    return Object.keys(o).length;
  }
  function alerts() {
    var out = [];
    if (role() === "admin") {
      if (S.methodDraft) out.push({ cls: "warn", text: "Metodika loyihasi v" + S.methodDraft.version + " rahbar tasdig'ini kutmoqda", href: "#/metodika" });
      return out;
    }
    var high = visibleEmps().filter(function (e) {
      return R.byEmp[e.id].level === "yuqori" && !S.cases.some(function (k) { return k.empIds.indexOf(e.id) >= 0 && (k.status === "xizmat" || k.status === "yopildi"); });
    });
    if (high.length) out.push({ cls: "danger", text: high.length + " nafar xodim yuqori xavfda — xizmat tekshiruvi hali tayinlanmagan", href: "#/ishlar" });
    var over = visibleEmps().filter(function (e) { return planInfo(e.id).status === "overdue"; });
    if (over.length) out.push({ cls: "warn", text: over.length + " nafar xodimda rejali tekshiruv muddati o'tgan (" + (UI.riskPlan ? "xavfga asoslangan" : "90 kun") + ")", href: "#/tekshiruvlar?tab=reja" });
    var uns = unsourcedImpact();
    if (uns.length) {
      var sum = uns.reduce(function (s, x) { return s + x.part.pts; }, 0);
      out.push({ cls: "warn", text: uns.length + " ta aloqaning manbasi yo'q, lekin ballga +" + sum + " qo'shmoqda", href: "#/shaxslar?src=yoq" });
    }
    var ind = visibleIndirect();
    if (ind.length) out.push({ cls: "info", text: indirectPairs(ind) + " juft xodim bilvosita (shaxs → shaxs) bog'langan — ballga kirmaydi", href: "#/aloqalar" });
    if (S.methodDraft && can("method_approve")) out.push({ cls: "warn", text: "Metodika loyihasi v" + S.methodDraft.version + " tasdiqlashingizni kutmoqda", href: "#/metodika" });
    return out;
  }

  // ============================================================ commit / audit
  function audit(action, object, details, refs) {
    var u = me();
    S.audit.unshift({ ts: new Date().toISOString(), user: u.fio, role: u.role, action: action, object: object || "", details: details || "", refs: refs || [] });
  }
  function commit(action, object, details, refs) {
    var prev = R;
    audit(action, object, details, refs);
    R = EN.compute(S);
    afterRecompute(prev);
    save();
    render();
  }
  function afterRecompute(prev) {
    S.employees.forEach(function (e) {
      var a = prev.byEmp[e.id], b = R.byEmp[e.id];
      if (!a || !b) return;
      if (a.score !== b.score || a.level !== b.level) {
        var txt = shortFio(e.fio) + ": " + a.score + " → " + b.score + (a.level !== b.level ? " (" + CAT.levels[a.level] + " → " + CAT.levels[b.level] + ")" : "");
        if (canSeeEmp(e)) toast(txt, b.level === "yuqori" && a.level !== "yuqori");
        S.notifications.unshift({ ts: new Date().toISOString(), text: "Ball o'zgardi — " + txt, href: "#/xodim/" + e.id });
      }
      if (b.level === "yuqori" && a.level !== "yuqori") {
        var exists = S.cases.some(function (k) { return k.status !== "yopildi" && k.empIds.length === 1 && k.empIds[0] === e.id; });
        if (!exists) {
          var id = "K-" + String(parseInt(nextId("", S.cases).replace(/\D/g, ""), 10)).padStart(3, "0");
          S.cases.push({ id: id, empIds: [e.id], title: "Yuqori xavf: " + b.score + " ball", status: "yangi", origin: "tizim", createdAt: TODAY, owner: null, due: null, outcome: null, note: "Avtomatik signal: daraja yuqoriga ko'tarildi." });
          S.audit.unshift({ ts: new Date().toISOString(), user: "Tizim", role: "tizim", action: "Ish yaratildi", object: id, details: "Avtomatik signal: " + e.fio + " — yuqori xavf (" + b.score + ")", refs: [e.id] });
        }
      }
    });
  }

  // ============================================================ toast / modal / drawer
  function toast(text, red) {
    var el = document.createElement("div");
    el.className = "toast" + (red ? " red" : "");
    el.innerHTML = icon(red ? "alert" : "info") + "<div>" + esc(text) + "</div>";
    $("#toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, 4800);
  }
  function openModal(title, body, foot, onMount, wide) {
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = body;
    $("#modal-foot").innerHTML = foot;
    $("#modal").style.width = wide ? "760px" : "";
    $("#modal").classList.add("open");
    $("#overlay").classList.add("open");
    if (onMount) onMount($("#modal"));
  }
  function closeModal() {
    $("#modal").classList.remove("open");
    if (!$("#drawer").classList.contains("open")) $("#overlay").classList.remove("open");
  }
  function openDrawer(title, body) {
    $("#drawer-title").textContent = title;
    $("#drawer-body").innerHTML = body;
    $("#drawer").classList.add("open");
    $("#overlay").classList.add("open");
  }
  function closeDrawer() {
    $("#drawer").classList.remove("open");
    if (!$("#modal").classList.contains("open")) $("#overlay").classList.remove("open");
  }
  function confirmModal(title, text, okLabel, onOk, danger) {
    openModal(title, "<p style='margin:0'>" + text + "</p>", '<button class="btn" data-close="modal">Bekor qilish</button><button class="btn ' + (danger ? "danger" : "primary") + '" id="cf-ok">' + okLabel + "</button>", function () {
      $("#cf-ok").onclick = function () { closeModal(); onOk(); };
    });
  }
  function errorsHtml(errs) {
    return errs.length ? '<div class="notice danger" style="margin-top:12px">' + icon("alert") + "<div>" + errs.map(esc).join("<br>") + "</div></div>" : "";
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(rows) {
    return "﻿" + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? "" : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(";"); }).join("\r\n");
  }

  // ============================================================ router
  var NAV = [
    { sec: "Monitoring" },
    { id: "dashboard", label: "Bosh sahifa", icon: "home", perm: "view_dossier" },
    { id: "xodimlar", label: "Xodimlar", icon: "users", perm: "view_dossier", badge: function () { return visibleEmps().length; } },
    { id: "graf", label: "Aloqalar grafi", icon: "graph", perm: "view_dossier" },
    { id: "aloqalar", label: "Umumiy aloqalar", icon: "link", perm: "view_dossier", badge: function () { return R.shared.filter(function (s) { return s.risky; }).length + indirectPairs(visibleIndirect()); }, danger: true },
    { sec: "Ma'lumotlar" },
    { id: "tekshiruvlar", label: "Tekshiruvlar", icon: "clipboard", perm: "view_dossier", badge: function () { return visibleEmps().filter(function (e) { return planInfo(e.id).status === "overdue"; }).length || ""; }, danger: true },
    { id: "shaxslar", label: "Aloqador shaxslar", icon: "person", perm: "view_dossier", badge: function () { return Object.keys(visiblePersonSet()).length; } },
    { sec: "Qarorlar" },
    { id: "ishlar", label: "Xizmat tekshiruvlari", icon: "briefcase", perm: "view_dossier", badge: function () { return visibleCases().filter(function (k) { return k.status === "yangi"; }).length || ""; }, danger: true },
    { id: "hisobot", label: "Tahliliy hisobot", icon: "file", perm: "report" },
    { sec: "Boshqaruv" },
    { id: "metodika", label: "Xavf metodikasi", icon: "sliders", badge: function () { return S.methodDraft ? "loyiha" : ""; }, danger: true },
    { id: "malumotnoma", label: "Ma'lumotnomalar", icon: "book" },
    { id: "foydalanuvchilar", label: "Foydalanuvchilar va rollar", icon: "shield" },
    { id: "audit", label: "Audit jurnali", icon: "list", perm: "audit" }
  ];
  function pagePerm(page) {
    if (page === "xodim") return "view_dossier";
    var n = NAV.filter(function (x) { return x.id === page; })[0];
    return n ? n.perm : null;
  }
  function defaultPage() { return can("view_dossier") ? "dashboard" : "metodika"; }
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, ""), qi = h.indexOf("?");
    var path = qi >= 0 ? h.slice(0, qi) : h, qs = qi >= 0 ? h.slice(qi + 1) : "";
    var q = {};
    qs.split("&").forEach(function (kv) { if (!kv) return; var i = kv.indexOf("="); q[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = decodeURIComponent(i < 0 ? "" : kv.slice(i + 1)); });
    return { parts: path.split("/").filter(Boolean), q: q };
  }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }

  function renderNav(page) {
    var h = "";
    NAV.forEach(function (n) {
      if (n.sec) { h += '<div class="nav-section-label">' + n.sec + "</div>"; return; }
      var allowed = !n.perm || can(n.perm);
      var b = allowed && n.badge ? n.badge() : "";
      var active = page === n.id || (page === "xodim" && n.id === "xodimlar");
      h += '<button class="nav-item' + (active ? " active" : "") + (allowed ? "" : " locked") + '" data-go="#/' + n.id + '" title="' + esc(n.label) + (allowed ? "" : " — ruxsat yo'q") + '">' + icon(allowed ? n.icon : "lock") + '<span class="label">' + n.label + "</span>" + (b !== "" && b != null ? '<span class="badge' + (n.danger ? " danger" : "") + '">' + b + "</span>" : "") + "</button>";
    });
    $("#nav").innerHTML = h;
  }

  function renderTop() {
    var u = me();
    $("#u-av").textContent = initials(u.fio);
    $("#u-nm").textContent = u.fio;
    $("#u-rl").textContent = ROLES[u.role].name + (u.scope === "*" ? "" : u.role === "admin" ? "" : " · " + u.scope.length + " bo'linma");
    $("#demo-date").textContent = "Hisob sanasi: " + fmtDate(TODAY);
    var n = alerts().length;
    $("#bell-dot").textContent = n;
    $("#bell-dot").style.display = n ? "" : "none";
  }

  function render() {
    closeDrawer();
    if (GRAPH) { GRAPH.destroy(); GRAPH = null; }
    var ph = parseHash(), page = ph.parts[0] || defaultPage();
    renderNav(page);
    renderTop();
    var view = $("#view");
    view.className = "content";
    var perm = pagePerm(page);
    if (perm && !can(perm)) { view.innerHTML = vDenied(page); return; }
    var fn = VIEWS[page];
    if (!fn) { view.innerHTML = '<div class="empty">Sahifa topilmadi. <a href="#/' + defaultPage() + '">Bosh sahifa</a></div>'; return; }
    fn(view, ph.parts, ph.q);
    view.scrollTop = 0;
  }

  function vDenied(page) {
    var n = NAV.filter(function (x) { return x.id === page; })[0];
    return '<div class="denied"><div class="ic">' + icon("lock") + "</div><h2 style='margin:0 0 6px'>Ruxsat yo'q</h2><p class='dim'>\"" + esc(n ? n.label : page) + "\" bo'limi <b>" + ROLES[role()].name + "</b> roli uchun yopiq.</p>" +
      (role() === "admin" ? "<p class='dim'>Administrator tizimni boshqaradi, lekin xodimlarning shaxsiy ma'lumotlarini ko'rmaydi (vazifalar ajratilgan).</p>" : "") +
      '<p class="muted" style="font-size:12px">Demo: yuqori o\'ngdagi foydalanuvchi menyusidan rolni almashtiring.</p><a class="btn" href="#/' + defaultPage() + '">Bosh sahifaga</a></div>';
  }

  // ============================================================ VIEW: dashboard
  function vDashboard(view) {
    var emps = visibleEmps(), ids = emps.map(function (e) { return e.id; });
    var cnt = { yuqori: 0, orta: 0, past: 0 };
    ids.forEach(function (id) { cnt[R.byEmp[id].level]++; });
    var checks = S.checks.filter(function (c) { return canSeeEmp(c.empId); });
    var persons = Object.keys(visiblePersonSet());
    var risky = R.shared.filter(function (s) { return s.risky && s.empIds.some(canSeeEmp); });
    var openCases = visibleCases().filter(function (k) { return k.status !== "yopildi"; });
    var ranking = R.ranking.filter(canSeeEmp);
    var h = '<div class="page-head"><div><h1>Bosh sahifa</h1><div class="sub">Tekshiruvlar va aloqador shaxslar bo\'yicha umumiy holat · Metodika v' + esc(S.methodology.version) + " · Hisob sanasi " + fmtDate(TODAY) + "</div></div>" +
      '<div class="actions"><a class="btn" href="#/graf?mode=umumiy">' + icon("graph") + 'Umumiy tarmoq</a><a class="btn primary" href="#/hisobot">' + icon("file") + "Tahliliy hisobot</a></div></div>";
    if (scoped()) h += '<div class="notice info">' + icon("info") + "<div>Siz faqat biriktirilgan bo'linmalarni ko'rasiz: <b>" + esc(me().scope.join(", ")) + "</b>. Boshqa bo'linma xodimlari \"Yopiq xodim\" sifatida ko'rinadi.</div></div>";
    h += '<div class="kpi-strip">' +
      kpi("Xodimlar", emps.length, "", "#/xodimlar") +
      kpi("Tekshiruvlar", checks.length, "", "#/tekshiruvlar") +
      kpi("Aloqador shaxslar", persons.length, "", "#/shaxslar") +
      kpi("Yuqori xavf", cnt.yuqori, "red", "#/xodimlar?lvl=yuqori") +
      kpi("Umumiy xavfli shaxs", risky.length, "amber", "#/aloqalar") +
      kpi("Ochiq ishlar", openCases.length, "", "#/ishlar") + "</div>";

    // reyting + diqqat
    h += '<div class="grid g-main"><div class="card"><div class="card-h"><h3>Xavf reytingi</h3><span class="cnt">' + ranking.length + '</span></div><div class="card-b flush"><table class="t"><thead><tr><th>Xodim</th><th>Ball</th><th class="hide-sm"></th><th>Daraja</th><th class="hide-sm">Ish</th></tr></thead><tbody>';
    ranking.forEach(function (id) {
      var e = E(id), oc = openCasesFor(id);
      h += '<tr class="click" data-go="#/xodim/' + id + '"><td>' + empCell(e, esc(e.unvon) + " · " + esc(e.bolinma)) + "</td><td>" + scoreBox(id) + '</td><td class="hide-sm">' + miniBar(id) + "</td><td>" + levelBadge(R.byEmp[id].level) + '</td><td class="hide-sm">' + (oc.length ? '<span class="badge b-purple">' + oc.length + " ochiq</span>" : '<span class="muted">—</span>') + "</td></tr>";
    });
    h += "</tbody></table></div></div>";
    h += '<div><div class="card"><div class="card-h"><h3>Diqqat talab qiladi</h3></div><div class="card-b">';
    var al = alerts();
    h += al.length ? al.map(function (a) { return '<a class="notice ' + a.cls + '" href="' + a.href + '" style="text-decoration:none">' + icon(a.cls === "info" ? "info" : "alert") + "<div>" + esc(a.text) + "</div></a>"; }).join("") : '<div class="muted">Hozircha signal yo\'q.</div>';
    h += '</div></div><div class="card mt"><div class="card-h"><h3>Xavf taqsimoti</h3></div><div class="card-b">';
    var tot = Math.max(1, ids.length);
    h += '<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;margin-bottom:12px">' +
      ["yuqori", "orta", "past"].map(function (l) { return '<div style="width:' + (cnt[l] / tot * 100) + "%;background:" + (l === "yuqori" ? "#B3261E" : l === "orta" ? "#B5894A" : "#157A4A") + '"></div>'; }).join("") + "</div>";
    ["yuqori", "orta", "past"].forEach(function (l) {
      var m = S.methodology.levels, rng = l === "yuqori" ? m.yuqori + "–" + S.methodology.cap : l === "orta" ? m.orta + "–" + (m.yuqori - 1) : "0–" + (m.orta - 1);
      h += '<a href="#/xodimlar?lvl=' + l + '" style="display:flex;align-items:center;gap:10px;padding:6px 0;color:inherit;text-decoration:none;border-bottom:1px dashed var(--border)">' + levelBadge(l) + '<span class="muted mono">' + rng + '</span><span class="dim" style="flex:1;font-size:12px">' + esc(CAT.levelAdvice[l]) + '</span><b class="mono">' + cnt[l] + "</b></a>";
    });
    h += "</div></div></div></div>";

    // klasterlar + so'nggi tekshiruvlar
    h += '<div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Xavf klasterlari</h3><span class="tag-new">yangi tahlil</span></div><div class="card-b">' + clustersHtml() + "</div></div>";
    var recent = checks.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 6);
    h += '<div class="card"><div class="card-h"><h3>So\'nggi tekshiruvlar</h3><a class="cnt" href="#/tekshiruvlar">hammasi →</a></div><div class="card-b flush"><table class="t"><tbody>';
    recent.forEach(function (c) {
      h += '<tr class="click" data-go="#/xodim/' + c.empId + '/tekshiruvlar"><td class="mono nowrap dim">' + fmtDate(c.date) + "</td><td><div class=\"fio\">" + esc(CAT.checkTypes[c.type]) + '</div><div class="sub2">' + esc(shortFio(E(c.empId).fio)) + "</div></td><td>" + resultBadge(c.result) + "</td></tr>";
    });
    h += "</tbody></table></div></div></div>";

    // bo'linmalar
    var units = {};
    emps.forEach(function (e) { (units[e.bolinma] = units[e.bolinma] || []).push(e.id); });
    h += '<div class="card mt"><div class="card-h"><h3>Bo\'linmalar kesimida</h3></div><div class="card-b flush"><table class="t"><thead><tr><th>Bo\'linma</th><th class="num">Xodim</th><th class="num">O\'rtacha ball</th><th class="num">Eng yuqori</th><th>Rejali tekshiruv</th></tr></thead><tbody>';
    Object.keys(units).sort(function (a, b) { return maxOf(units[b]) - maxOf(units[a]); }).forEach(function (u) {
      var list = units[u], avg = Math.round(list.reduce(function (s, id) { return s + R.byEmp[id].score; }, 0) / list.length);
      var over = list.filter(function (id) { return planInfo(id).status === "overdue"; }).length;
      h += "<tr><td>" + esc(u) + '</td><td class="num mono">' + list.length + '</td><td class="num mono">' + avg + '</td><td class="num">' + scoreBox(list.sort(function (a, b) { return R.byEmp[b].score - R.byEmp[a].score; })[0]) + "</td><td>" + (over ? '<span class="badge b-red">' + over + " muddati o'tgan</span>" : '<span class="badge b-green">Me\'yorda</span>') + "</td></tr>";
    });
    h += "</tbody></table></div></div>";
    view.innerHTML = h;
  }
  function maxOf(ids) { return Math.max.apply(null, ids.map(function (id) { return R.byEmp[id].score; })); }
  function kpi(l, v, cls, href) { return '<div class="kpi" data-go="' + href + '"><div class="l">' + l + '</div><div class="v ' + cls + '">' + v + "</div></div>"; }

  function clustersHtml() {
    var cl = R.clusters.filter(function (c) { return c.direct.some(canSeeEmp) || c.indirect.some(function (x) { return canSeeEmp(x.empId); }); });
    if (!cl.length) return '<div class="muted">Umumiy xavfli shaxs atrofida klaster yo\'q.</div>';
    return cl.map(function (c) {
      var p = P(c.hub);
      return '<div class="shared-card" style="align-items:flex-start"><div class="who"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + personLink(c.hub) + flagChips(p) + "</div>" +
        '<div style="margin-top:8px;font-size:12px"><span class="muted">To\'g\'ridan-to\'g\'ri:</span> ' + c.direct.map(function (id) { return '<span class="badge b-red">' + (canSeeEmp(id) ? esc(shortFio(E(id).fio)) : "Yopiq xodim") + "</span>"; }).join(" ") + "</div>" +
        (c.indirect.length ? '<div style="margin-top:5px;font-size:12px"><span class="muted">Bilvosita:</span> ' + c.indirect.map(function (x) { return '<span class="badge b-outline" title="orqali: ' + esc(x.via.map(function (v) { return P(v).fio; }).join(", ")) + '">' + (canSeeEmp(x.empId) ? esc(shortFio(E(x.empId).fio)) : "Yopiq xodim") + " ← " + esc(x.via.map(function (v) { return P(v).fio.split(" ")[0]; }).join(", ")) + "</span>"; }).join(" ") + "</div>" : "") +
        '</div><a class="btn sm" href="#/graf?mode=umumiy&sel=p:' + c.hub + '">' + icon("graph") + "Grafda</a></div>";
    }).join("");
  }

  // ============================================================ VIEW: xodimlar
  function vEmployees(view, parts, q) {
    var lvl = q.lvl || "all", text = q.q || "", unit = q.unit || "", sort = q.sort || "ball";
    var units = {};
    visibleEmps().forEach(function (e) { units[e.bolinma] = 1; });
    var h = '<div class="page-head"><div><h1>Xodimlar</h1><div class="sub">Xavf bali bo\'yicha saralangan ro\'yxat. Qatorni bosing — profil ochiladi.</div></div><div class="actions">' +
      (can("export") ? '<button class="btn" data-act="export-ranking">' + icon("download") + "CSV</button>" : "") +
      (can("edit_data") ? '<button class="btn primary" data-act="add-check">' + icon("plus") + "Tekshiruv kiritish</button>" : "") + "</div></div>";
    h += '<div class="toolbar"><input class="input" id="f-q" placeholder="F.I.Sh., tabel, bo\'linma yoki unvon..." style="width:300px" value="' + esc(text) + '">' +
      '<div class="chip-filter" id="f-lvl">' + [["all", "Barchasi"], ["yuqori", "Yuqori xavf"], ["orta", "O'rta"], ["past", "Past"]].map(function (x) { return '<button data-v="' + x[0] + '" class="' + (lvl === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      '<select class="select" id="f-unit"><option value="">Barcha bo\'linmalar</option>' + Object.keys(units).sort().map(function (u) { return "<option" + (u === unit ? " selected" : "") + ">" + esc(u) + "</option>"; }).join("") + "</select>" +
      '<select class="select" id="f-sort"><option value="ball"' + (sort === "ball" ? " selected" : "") + '>Saralash: xavf bali ↓</option><option value="fio"' + (sort === "fio" ? " selected" : "") + '>Saralash: F.I.Sh.</option><option value="reja"' + (sort === "reja" ? " selected" : "") + ">Saralash: tekshiruv muddati</option></select>" +
      '<span class="muted mono" id="f-count" style="margin-left:auto"></span></div>';
    h += '<div class="card"><div class="card-b flush" style="overflow-x:auto"><table class="t"><thead><tr><th>#</th><th>Xodim</th><th class="hide-sm">Lavozim / bo\'linma</th><th>Tekshiruvlar</th><th class="num hide-sm">Shaxslar</th><th class="num hide-sm">Umumiy</th><th>Ball</th><th>Daraja</th><th class="hide-sm">Ish</th></tr></thead><tbody id="emp-rows"></tbody></table></div></div>';
    view.innerHTML = h;
    function draw() {
      var t = norm($("#f-q").value), u = $("#f-unit").value, s = $("#f-sort").value;
      var list = R.ranking.filter(canSeeEmp).map(E).filter(function (e) {
        if (lvl !== "all" && R.byEmp[e.id].level !== lvl) return false;
        if (u && e.bolinma !== u) return false;
        if (t && norm([e.fio, e.tabel, e.bolinma, e.unvon, e.lavozim].join(" ")).indexOf(t) < 0) return false;
        return true;
      });
      if (s === "fio") list.sort(function (a, b) { return a.fio.localeCompare(b.fio); });
      if (s === "reja") list.sort(function (a, b) { return planInfo(a.id).left - planInfo(b.id).left; });
      var rows = list.map(function (e, i) {
        var ch = S.checks.filter(function (c) { return c.empId === e.id; }), pi = planInfo(e.id), oc = openCasesFor(e.id);
        var pc = S.empPersonLinks.filter(function (l) { return l.empId === e.id; }).length;
        return '<tr class="click" data-go="#/xodim/' + e.id + '"><td class="muted mono">' + (i + 1) + "</td><td>" + empCell(e) + '</td><td class="hide-sm"><div>' + esc(e.lavozim) + '</div><div class="sub2">' + esc(e.bolinma) + "</div></td>" +
          '<td><div class="mono">' + ch.length + ' <span class="muted">· ' + fmtDate(pi.last) + "</span></div>" + (pi.status === "overdue" ? '<span class="badge b-red">muddati o\'tgan ' + -pi.left + " kun</span>" : pi.status === "soon" ? '<span class="badge b-amber">' + pi.left + " kun qoldi</span>" : "") + "</td>" +
          '<td class="num mono hide-sm">' + pc + '</td><td class="num mono hide-sm">' + (R.byEmp[e.id].sharedPersons.length || '<span class="muted">0</span>') + "</td>" +
          '<td><div style="display:flex;gap:8px;align-items:center">' + scoreBox(e.id) + miniBar(e.id) + "</div></td><td>" + levelBadge(R.byEmp[e.id].level) + '</td><td class="hide-sm">' + (oc.length ? '<span class="badge b-purple">' + esc(CAT.caseStatuses[oc[0].status]) + "</span>" : '<span class="muted">—</span>') + "</td></tr>";
      });
      $("#emp-rows").innerHTML = rows.join("") || '<tr><td colspan="9" class="empty">Mos xodim topilmadi.</td></tr>';
      $("#f-count").textContent = list.length + " / " + visibleEmps().length;
    }
    $("#f-q").oninput = draw; $("#f-unit").onchange = draw; $("#f-sort").onchange = draw;
    $$("#f-lvl button").forEach(function (b) { b.onclick = function () { lvl = b.getAttribute("data-v"); $$("#f-lvl button").forEach(function (x) { x.classList.toggle("on", x === b); }); draw(); }; });
    draw();
  }

  // ============================================================ VIEW: xodim profili
  function vProfile(view, parts) {
    var id = parts[1], tab = parts[2] || "umumiy", e = E(id);
    if (!e) { view.innerHTML = '<div class="empty">Xodim topilmadi.</div>'; return; }
    if (!canSeeEmp(e)) { view.innerHTML = '<div class="denied"><div class="ic">' + icon("lock") + "</div><h2>Ruxsat yo'q</h2><p class='dim'>Bu xodim sizga biriktirilmagan bo'linmada.</p><a class='btn' href='#/xodimlar'>Xodimlar</a></div>"; return; }
    if (!VIEWED[id]) { VIEWED[id] = 1; audit("Profil ko'rildi", e.fio, "Shaxsga doir ma'lumotlarga kirish", [id]); save(); }
    var sc = R.byEmp[id], m = S.methodology;
    var checks = S.checks.filter(function (c) { return c.empId === id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var links = S.empPersonLinks.filter(function (l) { return l.empId === id; });
    var cases = S.cases.filter(function (k) { return k.empIds.indexOf(id) >= 0; });
    var hist = S.audit.filter(function (a) { return (a.refs || []).indexOf(id) >= 0; });
    var ind = R.indirect.filter(function (x) { return x.a === id || x.b === id; });
    var pi = planInfo(id);

    var h = '<div class="crumbs"><a href="#/xodimlar">Xodimlar</a> / ' + esc(shortFio(e.fio)) + "</div>";
    h += '<div class="profile-head"><div class="card"><div class="card-b"><div class="ph-id">' + avatar(e, true) + '<div><div class="mono muted">' + esc(e.tabel) + "</div><h2>" + esc(e.fio) + '</h2><div class="dim">' + esc(e.unvon) + " · " + esc(e.lavozim) + " · " + esc(e.bolinma) + "</div></div></div>" +
      '<hr class="sep"><div class="kv"><div class="k">Tekshiruvlar</div><div><b>' + checks.length + "</b> · oxirgisi " + fmtDate(pi.last) + " " + (pi.status === "overdue" ? '<span class="badge b-red">rejali muddat o\'tgan ' + -pi.left + " kun</span>" : '<span class="badge b-gray">keyingi: ' + fmtDate(pi.due) + "</span>") + "</div>" +
      '<div class="k">Aloqador shaxslar</div><div><b>' + links.length + "</b>" + (links.filter(function (l) { return !l.source; }).length ? ' · <span class="warn-src">' + links.filter(function (l) { return !l.source; }).length + " tasi manbasiz</span>" : "") + "</div>" +
      '<div class="k">Umumiy aloqalar</div><div><b>' + sc.sharedPersons.length + "</b> to'g'ridan · <b>" + indirectPairs(ind) + "</b> bilvosita</div>" +
      '<div class="k">Xizmat tekshiruvlari</div><div>' + (cases.length ? cases.map(function (k) { return '<span class="badge b-purple">' + k.id + " · " + esc(CAT.caseStatuses[k.status]) + "</span>"; }).join(" ") : '<span class="muted">yo\'q</span>') + "</div></div>" +
      '<div class="toolbar no-print" style="margin:14px 0 0">' +
      (can("edit_data") ? '<button class="btn primary sm" data-act="add-check" data-emp="' + id + '">' + icon("plus") + 'Tekshiruv</button><button class="btn sm" data-act="add-link" data-emp="' + id + '">' + icon("link") + "Aloqa</button>" : "") +
      (can("case_manage") ? '<button class="btn sm" data-act="new-case" data-emp="' + id + '">' + icon("briefcase") + "Xizmat tekshiruvi</button>" : "") +
      '<a class="btn sm" href="#/graf?mode=xodim&emp=' + id + '">' + icon("graph") + 'Graf</a><button class="btn ghost sm" data-act="print">' + icon("printer") + "Chop etish</button></div></div></div>";
    h += '<div class="card"><div class="card-h"><h3>Xavf bali</h3><span style="margin-left:auto">' + levelBadge(sc.level) + '</span></div><div class="card-b"><div class="big-score">' + sc.score + "<small>/" + m.cap + "</small></div>" +
      '<div class="lvl-bar" style="margin:14px 0 6px;background:linear-gradient(90deg,#5E8C61 0 ' + m.levels.orta + "%,#B5894A " + m.levels.orta + "% " + m.levels.yuqori + "%,#A8473B " + m.levels.yuqori + '% 100%)"><span class="mk" style="left:' + (sc.score / m.cap * 100) + '%"></span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:11px" class="muted mono"><span>0</span><span>' + m.levels.orta + "</span><span>" + m.levels.yuqori + "</span><span>" + m.cap + "</span></div>" +
      (sc.raw > sc.score ? '<div class="notice warn" style="margin:12px 0 0">' + icon("alert") + "<div>Xom ball <b>" + sc.raw + "</b> — " + m.cap + " bilan cheklangan. Bir nechta xodim " + m.cap + " ga yetganda saralash xom ball bo'yicha (topilma T-08).</div></div>" : "") +
      '<div style="margin-top:12px"><span class="muted">Tavsiya:</span> <b>' + esc(CAT.levelAdvice[sc.level]) + "</b></div>" +
      (sc.parts.length ? '<ul class="reasons">' + sc.parts.map(function (p) { return "<li>" + esc(p.label) + " (+" + p.pts + ")</li>"; }).join("") + "</ul>" : '<p class="dim">Xavf omillari aniqlanmagan.</p>') + "</div></div></div>";

    var tabs = [["umumiy", "Ball tarkibi", null], ["tekshiruvlar", "Tekshiruvlar", checks.length], ["shaxslar", "Aloqador shaxslar", links.length], ["graf", "Xodim tarmog'i", null], ["ishlar", "Xizmat tekshiruvlari", cases.length], ["tarix", "Tarix", hist.length]];
    h += '<div class="tabs no-print">' + tabs.map(function (t) { return '<button class="' + (tab === t[0] ? "on" : "") + '" data-go="#/xodim/' + id + "/" + t[0] + '">' + t[1] + (t[2] != null ? '<span class="n">' + t[2] + "</span>" : "") + "</button>"; }).join("") + "</div>";

    if (tab === "umumiy") {
      h += '<div class="grid g-main"><div class="card"><div class="card-h"><h3>Ball qanday hisoblandi</h3><a class="cnt" href="#/metodika">metodika v' + esc(m.version) + "</a></div><div class=\"card-b flush\"><table class=\"t\"><thead><tr><th>Omil</th><th>Hisob</th><th class=\"num\">Ball</th></tr></thead><tbody>";
      sc.parts.forEach(function (p) {
        var calc = "";
        if (p.kind === "check") { var c = C(p.ref); calc = "Natija \"" + CAT.results[c.result] + "\" · " + fmtDate(c.date); }
        if (p.kind === "person") calc = p.w + " (" + esc(CAT.flags[p.flag]) + ") × " + p.coef + " = " + Math.round(p.w * p.coef * 100) / 100 + (p.unsourced ? '<br><span class="warn-src">' + icon("alert") + " aloqa manbasi yo'q</span>" : "");
        if (p.kind === "shared") calc = p.refs.length + " × " + m.sharedBonus + " (og'irligi ≥ " + m.sharedMinWeight + ")";
        var kind = p.kind === "check" ? "Tekshiruv natijasi" : p.kind === "person" ? "Aloqador shaxs" : "Umumiy aloqa";
        h += '<tr><td><div class="sub2">' + kind + "</div>" + esc(p.label) + '</td><td class="dim" style="font-size:12px">' + calc + '</td><td class="num mono"><b>+' + p.pts + "</b></td></tr>";
      });
      if (!sc.parts.length) h += '<tr><td colspan="3" class="empty">Xavf omillari aniqlanmagan.</td></tr>';
      h += '<tr><td colspan="2"><b>Jami</b>' + (sc.raw > sc.score ? ' <span class="muted">(xom ' + sc.raw + ", chegara " + m.cap + ")</span>" : "") + '</td><td class="num">' + scoreBox(id) + "</td></tr></tbody></table></div></div>";
      h += '<div><div class="card"><div class="card-h"><h3>Boshqa xodimlar bilan umumiy aloqalar</h3><span class="cnt">' + sc.sharedPersons.length + '</span></div><div class="card-b">';
      h += sc.sharedPersons.length ? sc.sharedPersons.map(function (pid) {
        var others = S.empPersonLinks.filter(function (l) { return l.personId === pid && l.empId !== id; }).map(function (l) { return empLink(l.empId); });
        return '<div class="shared-card"><div class="who">' + personLink(pid) + '<div class="sub2">yana: ' + others.join(", ") + "</div></div>" + flagChips(P(pid)) + "</div>";
      }).join("") : '<div class="muted">Yo\'q</div>';
      h += '</div></div><div class="card mt"><div class="card-h"><h3>Bilvosita aloqalar</h3><span class="tag-new">yangi</span><span class="cnt">' + ind.length + '</span></div><div class="card-b">';
      h += ind.length ? ind.map(function (x) {
        var other = x.a === id ? x.b : x.a, via = x.a === id ? x.via : x.via.slice().reverse();
        return '<div class="shared-card"><div class="who"><div>' + personLink(via[0]) + ' <span class="muted">→ ' + esc(CAT.linkTypes[x.linkType].toLowerCase()) + " →</span> " + personLink(via[1]) + '</div><div class="sub2">→ ' + empLink(other) + "</div></div>" +
          '<a class="btn sm" href="#/graf?mode=yol&from=e:' + id + "&to=e:" + other + '">' + icon("route") + "Yo'l</a></div>";
      }).join("") + '<div class="sub2">Metodika v' + esc(m.version) + " bo'yicha ballga kirmaydi (ochiq savol Q-06).</div>" : '<div class="muted">Yo\'q</div>';
      var col = (S.empLinks || []).filter(function (l) { return l.a === id || l.b === id; });
      h += '</div></div><div class="card mt"><div class="card-h"><h3>Xizmatdagi aloqalar</h3><span class="cnt">' + col.length + '</span></div><div class="card-b">' +
        (col.length ? col.map(function (l) { return "<div>" + empLink(l.a === id ? l.b : l.a) + ' <span class="muted">— ' + esc(CAT.linkTypes[l.type].toLowerCase()) + "</span></div>"; }).join("") : '<div class="muted">Yo\'q</div>') + "</div></div></div></div>";
    }
    if (tab === "tekshiruvlar") {
      h += '<div class="timeline">' + (checks.length ? checks.map(checkCard).join("") : '<div class="empty">Tekshiruv yo\'q.</div>') + "</div>";
    }
    if (tab === "shaxslar") {
      h += '<div class="card"><div class="card-b flush" style="overflow-x:auto"><table class="t"><thead><tr><th>Shaxs</th><th>Aloqa turi</th><th>Belgilar</th><th>Manba</th><th class="num">Ball</th></tr></thead><tbody>';
      links.forEach(function (l) {
        var part = sc.parts.filter(function (p) { return p.kind === "person" && p.linkId === l.id; })[0];
        h += "<tr><td>" + personLink(l.personId) + (P(l.personId).izoh ? '<div class="sub2">' + esc(P(l.personId).izoh) + "</div>" : "") + "</td><td>" + esc(CAT.linkTypes[l.type]) + " <span class=\"muted mono\">×" + m.linkCoef[l.type] + "</span></td><td>" + flagChips(P(l.personId)) + "</td><td>" + sourceHtml(l) + '</td><td class="num mono">' + (part ? "+" + part.pts : "0") + "</td></tr>";
      });
      if (!links.length) h += '<tr><td colspan="5" class="empty">Aloqador shaxs yo\'q.</td></tr>';
      h += "</tbody></table></div></div>";
    }
    if (tab === "graf") {
      h += '<div class="card"><div class="card-h"><h3>Xodim tarmog\'i: tekshiruvlar va aloqalar</h3><a class="cnt" href="#/graf?mode=xodim&emp=' + id + '">to\'liq ekranda →</a></div><div class="graph-canvas" id="mini-graph" style="height:520px"><div class="graph-hint">Tugunni bosing · sudrang · g\'ildirak bilan yaqinlashtiring</div>' + legendHtml() + "</div></div>";
    }
    if (tab === "ishlar") {
      h += cases.length ? '<div class="grid g3">' + cases.map(caseCard).join("") + "</div>" : '<div class="empty">Bu xodim bo\'yicha xizmat tekshiruvi yo\'q.' + (can("case_manage") ? ' <a href="javascript:void 0" data-act="new-case" data-emp="' + id + '">Yaratish</a>' : "") + "</div>";
    }
    if (tab === "tarix") {
      h += '<div class="card"><div class="card-b flush">' + auditTable(hist) + "</div></div>";
    }
    view.innerHTML = h;
    if (tab === "graf") {
      GRAPH = XAXGraph.create($("#mini-graph"), { onOpen: function (n) { if (n && n.kind === "emp" && !n.masked) go("#/xodim/" + n.ref + "/graf"); else if (n && n.kind === "person") openPerson(n.ref); } });
      GRAPH.setData(graphData("xodim", { emp: id, depth: 2, checks: true, clean: true }), { center: "e:" + id });
    }
  }
  function checkCard(c) {
    var pts = S.methodology.resultPoints[c.result] || 0;
    return '<div class="tl-item"><div class="top"><span class="d">' + fmtDate(c.date) + '</span><span class="muted mono" style="font-size:11px">' + c.id + "</span>" + (c.basis ? '<span class="badge b-gray">asos: ' + esc(c.basis) + "</span>" : "") + '<span style="margin-left:auto">' + resultBadge(c.result) + "</span>" + (pts ? '<span class="mono" style="font-weight:700">+' + pts + "</span>" : "") + "</div>" +
      '<div class="ty">' + esc(CAT.checkTypes[c.type]) + "</div>" + (c.conclusion ? '<div class="dim">' + esc(c.conclusion) + "</div>" : "") +
      (c.persons.length ? '<div style="margin-top:6px;font-size:12.5px"><span class="muted">Aniqlangan:</span> ' + c.persons.map(personLink).join(", ") + "</div>" : "") +
      (c.createdBy ? '<div class="sub2" style="margin-top:4px">Kiritdi: ' + esc(c.createdBy) + "</div>" : "") + "</div>";
  }
  function legendHtml() {
    return '<div class="graph-legend"><span><svg width="14" height="14"><circle cx="7" cy="7" r="5.5" fill="#fff" stroke="#2B4C8C" stroke-width="2.5"/></svg>Xodim (chegara — xavf darajasi)</span>' +
      '<span><svg width="14" height="14"><path d="M7 1L13 7L7 13L1 7Z" fill="#C9A04A"/></svg>Tekshiruv</span>' +
      '<span><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#A8473B"/></svg>Xavfli shaxs</span>' +
      '<span><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#C29A4E"/></svg>Shubhali</span>' +
      '<span><svg width="14" height="14"><circle cx="7" cy="7" r="5.5" fill="#fff" stroke="#8A93A3" stroke-width="2"/></svg>Toza</span>' +
      '<span><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="#B3261E" stroke-width="3.4"/></svg>Umumiy xavfli aloqa</span>' +
      '<span><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="#9AA4B8" stroke-width="1.6" stroke-dasharray="5 4"/></svg>Shaxs–shaxs / tekshiruvda aniqlangan</span>' +
      '<span><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="#2C4CE0" stroke-width="2" stroke-dasharray="2 4"/></svg>Hamkasb</span></div>';
  }

  // ============================================================ graph data
  function graphData(mode, o) {
    var m = S.methodology, nodes = [], links = [], has = {};
    var sharedSet = {};
    R.shared.forEach(function (s) { if (s.risky) sharedSet[s.personId] = true; });
    var visP = visiblePersonSet();
    function risk(pid) { return EN.personRisk(P(pid), m); }
    function addEmp(id, center) {
      var k = "e:" + id; if (has[k]) return; has[k] = 1;
      var e = E(id), vis = canSeeEmp(e), sc = R.byEmp[id];
      nodes.push({ id: k, kind: "emp", ref: id, label: vis ? shortName(e.fio) : "Yopiq xodim", initials: initials(e.fio), level: sc.level, masked: !vis, center: !!center, title: vis ? e.fio + "\n" + e.unvon + " · " + e.bolinma + "\nBall: " + sc.score : "Sizga biriktirilmagan bo'linma" });
    }
    function addPerson(id) {
      var k = "p:" + id; if (has[k]) return; has[k] = 1;
      var p = P(id);
      nodes.push({ id: k, kind: "person", ref: id, label: p.fio, risk: risk(id), title: EN.personDisplay(p) + (p.flags.length ? "\n" + p.flags.map(function (f) { return CAT.flags[f]; }).join(", ") : "") });
    }
    function addCheck(c) {
      var k = "c:" + c.id; if (has[k]) return; has[k] = 1;
      nodes.push({ id: k, kind: "check", ref: c.id, label: SHORT_TYPE[c.type], result: c.result, title: CAT.checkTypes[c.type] + " · " + fmtDate(c.date) + " · " + CAT.results[c.result] });
    }
    function addL(l) { if (has["L" + l.id]) return; has["L" + l.id] = 1; links.push(l); }
    function ep(l) { return { id: "ep:" + l.id, s: "e:" + l.empId, t: "p:" + l.personId, kind: "ep", label: CAT.linkTypes[l.type], shared: !!sharedSet[l.personId] }; }
    function pp(l) { return { id: "pp:" + l.id, s: "p:" + l.a, t: "p:" + l.b, kind: "pp", label: CAT.linkTypes[l.type] }; }
    function ee(l) { return { id: "ee:" + l.id, s: "e:" + l.a, t: "e:" + l.b, kind: "ee", label: CAT.linkTypes[l.type] }; }
    function addChecksFor(empIds) {
      S.checks.forEach(function (c) {
        if (empIds.indexOf(c.empId) < 0 || !canSeeEmp(c.empId)) return;
        addCheck(c);
        addL({ id: "ec:" + c.id, s: "e:" + c.empId, t: "c:" + c.id, kind: "ec" });
        c.persons.forEach(function (pid) { if (has["p:" + pid]) addL({ id: "cp:" + c.id + ":" + pid, s: "c:" + c.id, t: "p:" + pid, kind: "cp" }); });
      });
    }
    if (mode === "xodim") {
      var X = o.emp;
      addEmp(X, true);
      var mine = S.empPersonLinks.filter(function (l) { return l.empId === X; });
      mine.forEach(function (l) { if (!o.clean && risk(l.personId) === "toza") return; addPerson(l.personId); addL(ep(l)); });
      (S.empLinks || []).forEach(function (l) { if (l.a === X || l.b === X) { addEmp(l.a === X ? l.b : l.a); addL(ee(l)); } });
      var first = mine.map(function (l) { return l.personId; }).filter(function (pid) { return has["p:" + pid]; });
      if (o.depth >= 2) {
        S.personLinks.forEach(function (pl) {
          var ia = first.indexOf(pl.a) >= 0, ib = first.indexOf(pl.b) >= 0;
          if (!ia && !ib) return;
          var other = ia ? pl.b : pl.a;
          if (!o.clean && risk(other) === "toza" && first.indexOf(other) < 0) return;
          addPerson(pl.a); addPerson(pl.b); addL(pp(pl));
        });
      }
      var inP = nodes.filter(function (n) { return n.kind === "person"; }).map(function (n) { return n.ref; });
      S.empPersonLinks.forEach(function (l) { if (l.empId !== X && inP.indexOf(l.personId) >= 0) { addEmp(l.empId); addL(ep(l)); } });
      if (o.checks) addChecksFor([X]);
    } else {
      // umumiy tarmoq / yo'l topish
      visibleEmps().forEach(function (e) { addEmp(e.id); });
      S.empPersonLinks.forEach(function (l) {
        if (!visP[l.personId]) return;
        if (!o.clean && risk(l.personId) === "toza") return;
        addEmp(l.empId); addPerson(l.personId); addL(ep(l));
      });
      S.personLinks.forEach(function (pl) {
        if (!visP[pl.a] || !visP[pl.b]) return;
        if (!o.clean && (risk(pl.a) === "toza" || risk(pl.b) === "toza")) return;
        addPerson(pl.a); addPerson(pl.b); addL(pp(pl));
      });
      (S.empLinks || []).forEach(function (l) { if (canSeeEmp(l.a) || canSeeEmp(l.b)) { addEmp(l.a); addEmp(l.b); addL(ee(l)); } });
      if (o.checks) addChecksFor(S.employees.map(function (e) { return e.id; }));
    }
    return { nodes: nodes, links: links };
  }

  // ============================================================ VIEW: graf
  function vGraph(view, parts, q) {
    view.className = "content full";
    if (q.mode) GS.mode = q.mode;
    if (q.emp) GS.emp = q.emp;
    if (q.from) GS.from = q.from;
    if (q.to) GS.to = q.to;
    GS.sel = q.sel || null;
    var emps = visibleEmps();
    if (!GS.emp || !canSeeEmp(GS.emp)) GS.emp = (R.ranking.filter(canSeeEmp)[0]) || null;
    var visP = visiblePersonSet();
    var opts = emps.map(function (e) { return { k: "e:" + e.id, l: e.fio }; }).concat(S.persons.filter(function (p) { return visP[p.id]; }).map(function (p) { return { k: "p:" + p.id, l: EN.personDisplay(p) + " (shaxs)" }; }));
    if (!GS.from || !opts.some(function (o) { return o.k === GS.from; })) GS.from = canSeeEmp("e4") ? "e:e4" : opts[0] && opts[0].k;
    if (!GS.to || !opts.some(function (o) { return o.k === GS.to; })) GS.to = canSeeEmp("e1") ? "e:e1" : opts[1] && opts[1].k;

    var titles = { xodim: "Xodim tarmog'i: tekshiruvlar va aloqalar", umumiy: "Umumiy tarmoq: barcha xodimlar va shaxslar", yol: "Yo'l topish: ikki tugun orasidagi eng qisqa zanjir" };
    var h = '<div class="graph-wrap"><div class="graph-main"><div class="graph-bar"><h2>' + titles[GS.mode] + "</h2>" +
      '<div class="seg" id="g-mode">' + [["xodim", "Xodim tarmog'i"], ["umumiy", "Umumiy tarmoq"], ["yol", "Yo'l topish"]].map(function (x) { return '<button data-v="' + x[0] + '" class="' + (GS.mode === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>";
    if (GS.mode === "xodim") {
      h += '<select class="select" id="g-emp">' + R.ranking.filter(canSeeEmp).map(function (id) { return '<option value="' + id + '"' + (id === GS.emp ? " selected" : "") + ">" + esc(E(id).fio) + " · " + R.byEmp[id].score + "</option>"; }).join("") + "</select>" +
        '<select class="select" id="g-depth"><option value="1"' + (GS.depth === 1 ? " selected" : "") + '>1-daraja</option><option value="2"' + (GS.depth === 2 ? " selected" : "") + ">2-daraja (shaxs → shaxs)</option></select>";
    }
    if (GS.mode === "yol") {
      var sel = function (idv, val) { return '<select class="select" id="' + idv + '" style="max-width:240px">' + opts.map(function (o) { return '<option value="' + o.k + '"' + (o.k === val ? " selected" : "") + ">" + esc(o.l) + "</option>"; }).join("") + "</select>"; };
      h += sel("g-from", GS.from) + '<span class="muted">→</span>' + sel("g-to", GS.to);
    }
    h += '<label class="nowrap" style="display:inline-flex;gap:5px;align-items:center"><input type="checkbox" id="g-checks"' + (GS.checks ? " checked" : "") + ">Tekshiruvlar</label>" +
      '<label class="nowrap" style="display:inline-flex;gap:5px;align-items:center"><input type="checkbox" id="g-clean"' + (GS.clean ? " checked" : "") + ">Belgisiz shaxslar</label>" +
      '<label class="nowrap" style="display:inline-flex;gap:5px;align-items:center"><input type="checkbox" id="g-labels"' + (GS.labels ? " checked" : "") + ">Aloqa nomlari</label>" +
      '<span style="flex:1"></span><button class="btn sm" id="g-relayout">' + icon("refresh") + "Qayta joylash</button></div>";
    h += '<div id="g-path"></div><div class="graph-canvas" id="gc"><div class="graph-hint">Tugunni bosing · sudrang · g\'ildirak bilan yaqinlashtiring · ikki marta bosish — ochish</div>' +
      '<div class="graph-zoom"><button class="icon-btn" id="g-zin" title="Yaqinlashtirish">' + icon("zin") + '</button><button class="icon-btn" id="g-zout" title="Uzoqlashtirish">' + icon("zout") + '</button><button class="icon-btn" id="g-fit" title="Markazlash">' + icon("fit") + "</button></div>" + legendHtml() + "</div></div>" +
      '<aside class="graph-side" id="gside"></aside></div>';
    view.innerHTML = h;

    GRAPH = XAXGraph.create($("#gc"), {
      onSelect: function (n) { GS.sel = n ? n.id : null; sideHtml(n); },
      onOpen: function (n) {
        if (!n) return;
        if (n.kind === "emp" && !n.masked) { GS.mode = "xodim"; GS.emp = n.ref; render(); }
        else if (n.kind === "person") openPerson(n.ref);
      }
    });
    var data = graphData(GS.mode === "xodim" ? "xodim" : "umumiy", { emp: GS.emp, depth: GS.depth, checks: GS.checks && GS.mode !== "yol", clean: GS.clean });
    GRAPH.setLinkLabels(GS.labels);
    GRAPH.setData(data, { center: GS.mode === "xodim" ? "e:" + GS.emp : null, select: GS.sel });
    var selNode = data.nodes.filter(function (n) { return n.id === GS.sel; })[0];
    sideHtml(selNode || null, data);

    if (GS.mode === "yol") {
      var res = GS.from === GS.to ? null : EN.shortestPath(pathState(), GS.from, GS.to);
      var ph = "";
      if (!res) ph = '<div class="path-chain"><b>Yo\'l topilmadi.</b> Tanlangan tugunlar tarmoqda bog\'lanmagan.</div>';
      else {
        var gl = res.edges.map(function (e) { return e.kind + ":" + e.id; });
        GRAPH.highlightPath(res.nodes, gl);
        ph = '<div class="path-chain"><b>' + (res.nodes.length - 1) + " qadam:</b>" + res.nodes.map(function (k, i) {
          var lbl = nodeLabel(k);
          return (i ? '<span class="ar">— ' + esc(CAT.linkTypes[res.edges[i - 1].type].toLowerCase()) + " →</span>" : "") + '<span class="nd">' + esc(lbl) + "</span>";
        }).join("") + "</div>";
      }
      $("#g-path").innerHTML = ph;
    }

    $$("#g-mode button").forEach(function (b) { b.onclick = function () { GS.mode = b.getAttribute("data-v"); GS.sel = null; history.replaceState(null, "", "#/graf"); render(); }; });
    if ($("#g-emp")) $("#g-emp").onchange = function () { GS.emp = this.value; GS.sel = null; history.replaceState(null, "", "#/graf"); render(); };
    if ($("#g-depth")) $("#g-depth").onchange = function () { GS.depth = +this.value; render(); };
    if ($("#g-from")) $("#g-from").onchange = function () { GS.from = this.value; history.replaceState(null, "", "#/graf"); render(); };
    if ($("#g-to")) $("#g-to").onchange = function () { GS.to = this.value; history.replaceState(null, "", "#/graf"); render(); };
    $("#g-checks").onchange = function () { GS.checks = this.checked; render(); };
    $("#g-clean").onchange = function () { GS.clean = this.checked; render(); };
    $("#g-labels").onchange = function () { GS.labels = this.checked; GRAPH.setLinkLabels(GS.labels); };
    $("#g-relayout").onclick = function () { GRAPH.relayout(); };
    $("#g-zin").onclick = function () { GRAPH.zoomIn(); };
    $("#g-zout").onclick = function () { GRAPH.zoomOut(); };
    $("#g-fit").onclick = function () { GRAPH.fit(); };
  }
  // Bo'linma bilan cheklangan foydalanuvchi uchun yo'l faqat ko'rinadigan shaxslar orqali qidiriladi
  function pathState() {
    if (!scoped()) return S;
    var visP = visiblePersonSet();
    return {
      empPersonLinks: S.empPersonLinks.filter(function (l) { return visP[l.personId]; }),
      personLinks: S.personLinks.filter(function (l) { return visP[l.a] && visP[l.b]; }),
      empLinks: (S.empLinks || []).filter(function (l) { return canSeeEmp(l.a) || canSeeEmp(l.b); })
    };
  }
  function nodeLabel(k) {
    var id = k.slice(2);
    if (k[0] === "e") return canSeeEmp(id) ? shortFio(E(id).fio) : "Yopiq xodim";
    return P(id).fio;
  }
  function sideHtml(n, data) {
    var el = $("#gside"); if (!el) return;
    var h = "";
    if (!n) {
      var d = data || { nodes: [] };
      var k = function (kind) { return d.nodes.filter(function (x) { return x.kind === kind; }).length; };
      h = '<div class="card-h"><h3>Graf haqida</h3></div><div class="card-b">' + (data ? '<div class="kv"><div class="k">Xodimlar</div><div><b>' + k("emp") + '</b></div><div class="k">Shaxslar</div><div><b>' + k("person") + '</b></div><div class="k">Tekshiruvlar</div><div><b>' + k("check") + "</b></div></div><hr class='sep'>" : "") +
        '<p class="dim" style="margin-top:0">Tugunni bosing — tafsilotlar shu yerda chiqadi. Xodimni ikki marta bossangiz — uning tarmog\'i ochiladi.</p>' +
        '<p class="dim"><b style="color:var(--red)">Qizil qalin chiziq</b> — ikki xodimni umumiy xavfli shaxs orqali bog\'lovchi aloqa. Punktir — shaxslar orasidagi yoki tekshiruvda aniqlangan bog\'liqlik.</p>' +
        '<p class="dim">"Yo\'l topish" rejimi bilvosita aloqalarni ko\'rsatadi: masalan, <a href="#/graf?mode=yol&from=e:e5&to=e:e1">Nazarova → Tursunov</a>.</p></div>';
    } else if (n.kind === "emp") {
      if (n.masked) h = '<div class="card-h"><h3>Yopiq xodim</h3></div><div class="card-b"><div class="notice warn">' + icon("lock") + "<div>Bu xodim sizga biriktirilmagan bo'linmada. Umumiy aloqa mavjudligini rahbarga xabar qiling (eskalatsiya).</div></div></div>";
      else {
        var e = E(n.ref), s = R.byEmp[n.ref];
        h = '<div class="card-h"><h3>Xodim</h3></div><div class="card-b"><div class="emp-cell">' + avatar(e) + '<div><div class="fio">' + esc(e.fio) + '</div><div class="sub2">' + esc(e.unvon) + " · " + esc(e.bolinma) + '</div></div></div><div style="display:flex;gap:8px;align-items:center;margin:12px 0">' + scoreBox(e.id) + levelBadge(s.level) + "</div>" +
          (s.parts.length ? '<ul class="reasons" style="margin-top:0">' + s.parts.map(function (p) { return "<li>" + esc(p.label) + " (+" + p.pts + ")</li>"; }).join("") + "</ul>" : '<p class="dim">Xavf omillari aniqlanmagan.</p>') +
          '<div class="toolbar" style="margin:10px 0 0"><a class="btn sm primary" href="#/xodim/' + e.id + '">Profil</a><a class="btn sm" href="#/graf?mode=xodim&emp=' + e.id + '">Tarmog\'i</a></div></div>';
      }
    } else if (n.kind === "person") {
      var p = P(n.ref), pw = EN.personWeight(p, S.methodology);
      h = '<div class="card-h"><h3>Aloqador shaxs</h3></div><div class="card-b"><div class="fio" style="font-size:14px">' + esc(EN.personDisplay(p)) + "</div>" + (p.izoh ? '<div class="sub2">' + esc(p.izoh) + "</div>" : "") + '<div style="margin:10px 0">' + flagChips(p) + "</div>" +
        '<div class="kv"><div class="k">Eng og\'ir belgi</div><div>' + (pw.flag ? esc(CAT.flags[pw.flag]) + " · <b>" + pw.w + "</b>" : "—") + "</div></div><hr class='sep'><div class='sub2' style='margin-bottom:6px'>BOG'LANGAN XODIMLAR</div>" +
        S.empPersonLinks.filter(function (l) { return l.personId === p.id; }).map(function (l) { return "<div style='margin-bottom:4px'>" + empLink(l.empId) + ' <span class="muted">— ' + esc(CAT.linkTypes[l.type].toLowerCase()) + "</span></div>"; }).join("") +
        '<div class="toolbar" style="margin:12px 0 0"><button class="btn sm primary" data-act="person" data-id="' + p.id + '">Kartochka</button><a class="btn sm" href="#/graf?mode=yol&from=p:' + p.id + "&to=" + (GS.to || "e:e1") + '">' + icon("route") + "Yo'l</a></div></div>";
    } else if (n.kind === "check") {
      var c = C(n.ref);
      h = '<div class="card-h"><h3>Tekshiruv</h3></div><div class="card-b">' + checkCard(c) + '<div style="margin-top:10px">' + empLink(c.empId) + "</div></div>";
    }
    el.innerHTML = h;
  }

  // ============================================================ VIEW: umumiy aloqalar
  function vLinks(view) {
    var m = S.methodology;
    var shared = R.shared.filter(function (s) { return s.empIds.some(canSeeEmp); });
    var ind = visibleIndirect();
    var h = '<div class="page-head"><div><h1>Umumiy aloqalar</h1><div class="sub">Bir vaqtning o\'zida bir nechta xodim bilan bog\'langan shaxslar. Bu holatlar xodimlar o\'rtasida norasmiy kelishuv yoki umumiy manfaatga ishora qilishi mumkin va alohida tahlil qilinadi.</div></div></div>';
    h += '<div class="card"><div class="card-h"><h3>Umumiy shaxslar (to\'g\'ridan-to\'g\'ri)</h3><span class="cnt">' + shared.length + '</span></div><div class="card-b flush" style="overflow-x:auto"><table class="t"><thead><tr><th>Umumiy shaxs</th><th>Belgilar</th><th>Bog\'langan xodimlar</th><th>Ballga ta\'sir</th><th></th></tr></thead><tbody>';
    shared.forEach(function (s) {
      h += "<tr><td>" + personLink(s.personId) + "</td><td>" + flagChips(P(s.personId)) + "</td><td>" + S.empPersonLinks.filter(function (l) { return l.personId === s.personId; }).map(function (l) {
        var e = E(l.empId);
        return "<div>" + empLink(l.empId) + ' <span class="muted">— ' + esc(CAT.linkTypes[l.type].toLowerCase()) + (canSeeEmp(e) ? " · " + esc(e.unvon) + ", " + esc(e.bolinma) : "") + "</span></div>";
      }).join("") + "</td><td>" + (s.risky ? '<span class="badge b-red">+' + m.sharedBonus + " har bir xodimga</span>" : '<span class="badge b-gray">og\'irlik ' + s.w + " &lt; " + m.sharedMinWeight + "</span>") + '</td><td><a class="btn sm" href="#/graf?mode=umumiy&sel=p:' + s.personId + '">' + icon("graph") + "</a></td></tr>";
    });
    if (!shared.length) h += '<tr><td colspan="5" class="empty">Umumiy shaxs yo\'q.</td></tr>';
    h += "</tbody></table></div></div>";

    h += '<div class="card mt"><div class="card-h"><h3>Bilvosita aloqalar: xodim → shaxs → shaxs → xodim</h3><span class="tag-new">yangi · T-07</span><span class="cnt">' + indirectPairs(ind) + ' juft</span></div><div class="card-b">' +
      '<div class="notice info">' + icon("info") + "<div>Hujjat §1 2-daraja aloqalarni aniqlashni maqsad qilgan, ammo §3 metodikasi faqat to'g'ridan-to'g'ri umumiy shaxsni hisoblaydi. Quyidagi zanjirlar <b>ballga kirmaydi</b> — tahlilchi uchun signal. Taklif: har bir yangi juftlik uchun +5 ball (ochiq savol Q-06).</div></div>" +
      '<table class="t"><thead><tr><th>Xodim</th><th>Zanjir</th><th>Xodim</th><th class="num">Og\'irlik</th><th></th></tr></thead><tbody>' +
      ind.map(function (x) {
        return "<tr><td>" + empLink(x.a) + "</td><td>" + personLink(x.via[0]) + ' <span class="muted">— ' + esc(CAT.linkTypes[x.linkType].toLowerCase()) + " —</span> " + personLink(x.via[1]) + "</td><td>" + empLink(x.b) + '</td><td class="num mono">' + x.w + '</td><td><a class="btn sm" href="#/graf?mode=yol&from=e:' + x.a + "&to=e:" + x.b + '">' + icon("route") + "Yo'l</a></td></tr>";
      }).join("") + (ind.length ? "" : '<tr><td colspan="5" class="empty">Bilvosita aloqa topilmadi.</td></tr>') + "</tbody></table></div></div>";

    h += '<div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Xavf klasterlari</h3></div><div class="card-b">' + clustersHtml() + "</div></div>";
    var col = (S.empLinks || []).filter(function (l) { return canSeeEmp(l.a) || canSeeEmp(l.b); });
    h += '<div class="card"><div class="card-h"><h3>Xizmatdagi aloqalar (xodim — xodim)</h3><span class="tag-new">T-01</span></div><div class="card-b">' +
      (col.length ? col.map(function (l) { return '<div class="shared-card"><div class="who">' + empLink(l.a) + ' <span class="muted">— ' + esc(CAT.linkTypes[l.type].toLowerCase()) + " —</span> " + empLink(l.b) + "</div></div>"; }).join("") : '<div class="muted">Yo\'q</div>') +
      '<div class="sub2">Hujjatda "Xizmatdagi aloqa" sifatida bor edi, ma\'lumotlar modelida esa yo\'q — "Aloqa (xodim–xodim)" obyekti qo\'shildi. "Hamkasb" koeffitsiyenti (0.4) hozircha ballga ta\'sir qilmaydi, chunki xodimda belgi yo\'q.</div></div></div></div>';
    view.innerHTML = h;
  }

  // ============================================================ VIEW: tekshiruvlar
  function vChecks(view, parts, q) {
    var tab = q.tab || "jurnal";
    var h = '<div class="page-head"><div><h1>Tekshiruvlar</h1><div class="sub">Barcha tekshiruvlar jurnali, rejali tekshiruv muddatlari va tekshiruv turlari bo\'yicha qamrov.</div></div><div class="actions">' + (can("edit_data") ? '<button class="btn primary" data-act="add-check">' + icon("plus") + "Tekshiruv kiritish</button>" : "") + "</div></div>";
    h += '<div class="tabs">' + [["jurnal", "Jurnal"], ["reja", "Reja va muddatlar"], ["qamrov", "Qamrov matritsasi"]].map(function (t) { return '<button class="' + (tab === t[0] ? "on" : "") + '" data-go="#/tekshiruvlar?tab=' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>";
    var emps = R.ranking.filter(canSeeEmp).map(E);
    if (tab === "jurnal") {
      h += '<div class="toolbar"><input class="input" id="c-q" placeholder="Xodim, xulosa yoki shaxs..." style="width:260px"><select class="select" id="c-type"><option value="">Barcha turlar</option>' + Object.keys(CAT.checkTypes).map(function (k) { return '<option value="' + k + '">' + esc(CAT.checkTypes[k]) + "</option>"; }).join("") + '</select><select class="select" id="c-res"><option value="">Barcha natijalar</option>' + Object.keys(CAT.results).map(function (k) { return '<option value="' + k + '">' + CAT.results[k] + "</option>"; }).join("") + '</select><span class="muted mono" id="c-count" style="margin-left:auto"></span></div>';
      h += '<div class="card"><div class="card-b flush" style="overflow-x:auto"><table class="t"><thead><tr><th>Sana</th><th>Xodim</th><th>Turi</th><th>Natija</th><th>Xulosa</th><th>Aniqlangan shaxslar</th><th class="num">Ball</th></tr></thead><tbody id="c-rows"></tbody></table></div></div>';
      view.innerHTML = h;
      var draw = function () {
        var t = norm($("#c-q").value), ty = $("#c-type").value, rs = $("#c-res").value;
        var list = S.checks.filter(function (c) {
          if (!canSeeEmp(c.empId)) return false;
          if (ty && c.type !== ty) return false;
          if (rs && c.result !== rs) return false;
          if (t && norm([E(c.empId).fio, c.conclusion, c.persons.map(function (p) { return P(p).fio; }).join(" ")].join(" ")).indexOf(t) < 0) return false;
          return true;
        }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
        $("#c-rows").innerHTML = list.map(function (c) {
          var pts = S.methodology.resultPoints[c.result] || 0;
          return '<tr><td class="mono nowrap">' + fmtDate(c.date) + "</td><td>" + empLink(c.empId) + "</td><td>" + esc(CAT.checkTypes[c.type]) + "</td><td>" + resultBadge(c.result) + '</td><td class="dim" style="max-width:320px">' + (esc(c.conclusion) || '<span class="muted">—</span>') + "</td><td>" + (c.persons.map(personLink).join(", ") || '<span class="muted">—</span>') + '</td><td class="num mono">' + (pts ? "+" + pts : "0") + "</td></tr>";
        }).join("") || '<tr><td colspan="7" class="empty">Mos tekshiruv topilmadi.</td></tr>';
        $("#c-count").textContent = list.length + " ta";
      };
      $("#c-q").oninput = draw; $("#c-type").onchange = draw; $("#c-res").onchange = draw;
      draw();
      return;
    }
    if (tab === "reja") {
      h += '<div class="notice info">' + icon("info") + '<div>Hujjat §8: tekshiruv natijalarini <b>kamida chorakda bir marta</b> yangilash (90 kun deb olindi — TAXMIN). <label style="margin-left:10px;display:inline-flex;gap:6px;align-items:center;font-weight:600"><input type="checkbox" id="riskplan"' + (UI.riskPlan ? " checked" : "") + '> Xavfga asoslangan davriylik <span class="tag-new">taklif</span></label> — yuqori 30, o\'rta 60, past 90 kun.</div></div>';
      h += '<div class="card"><div class="card-b flush" style="overflow-x:auto"><table class="t"><thead><tr><th>Xodim</th><th>Daraja</th><th>Oxirgi tekshiruv</th><th class="num">O\'tgan kun</th><th class="num">Davriylik</th><th>Keyingi muddat</th><th>Holat</th><th></th></tr></thead><tbody>';
      emps.slice().sort(function (a, b) { return planInfo(a.id).left - planInfo(b.id).left; }).forEach(function (e) {
        var pi = planInfo(e.id);
        h += "<tr><td>" + empCell(e) + "</td><td>" + levelBadge(R.byEmp[e.id].level) + '</td><td class="mono">' + fmtDate(pi.last) + '</td><td class="num mono">' + (pi.since != null ? pi.since : "—") + '</td><td class="num mono">' + pi.interval + '</td><td class="mono">' + fmtDate(pi.due) + "</td><td>" +
          (pi.status === "overdue" ? '<span class="badge b-red">Muddati o\'tgan: ' + -pi.left + " kun</span>" : pi.status === "soon" ? '<span class="badge b-amber">' + pi.left + " kun qoldi</span>" : '<span class="badge b-green">Me\'yorda</span>') + "</td><td>" + (can("edit_data") ? '<button class="btn sm" data-act="add-check" data-emp="' + e.id + '">' + icon("plus") + "</button>" : "") + "</td></tr>";
      });
      h += "</tbody></table></div></div>";
      view.innerHTML = h;
      $("#riskplan").onchange = function () { UI.riskPlan = this.checked; render(); };
      return;
    }
    // qamrov
    var types = Object.keys(CAT.checkTypes);
    h += '<div class="notice info">' + icon("info") + "<div>Har bir xodimda qaysi turdagi tekshiruv o'tkazilgan (oxirgi natija). Bo'sh katak — bu tur hali o'tkazilmagan: rejalashtirishga yordam beradi.</div></div>";
    h += '<div class="card"><div class="card-b flush" style="overflow-x:auto"><table class="t matrix"><thead><tr><th>Xodim</th>' + types.map(function (t) { return '<th class="num" style="text-align:center">' + SHORT_TYPE[t] + "</th>"; }).join("") + '<th class="num">Qamrov</th></tr></thead><tbody>';
    emps.forEach(function (e) {
      var done = 0;
      h += "<tr><td>" + empLink(e.id) + "</td>" + types.map(function (t) {
        var list = S.checks.filter(function (c) { return c.empId === e.id && c.type === t; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
        if (!list.length) return '<td class="cell"><span class="mcell none">—</span></td>';
        done++;
        var c = list[0];
        return '<td class="cell"><span class="mcell ' + c.result + '" title="' + esc(CAT.results[c.result]) + " · " + fmtDate(c.date) + (list.length > 1 ? " · jami " + list.length : "") + '">' + (c.result === "toza" ? "T" : c.result === "shubhali" ? "Sh" : "S") + "</span></td>";
      }).join("") + '<td class="num mono">' + Math.round(done / types.length * 100) + "%</td></tr>";
    });
    h += '</tbody></table></div></div><div class="sub2" style="margin-top:8px">T — toza, Sh — shubhali, S — salbiy.</div>';
    view.innerHTML = h;
  }

  // ============================================================ VIEW: shaxslar
  function vPersons(view, parts, q) {
    var visP = visiblePersonSet();
    var h = '<div class="page-head"><div><h1>Aloqador shaxslar reyestri</h1><div class="sub">Tekshiruvlarda aniqlangan yoki qo\'lda kiritilgan shaxslar, ularning belgilari va bog\'langan xodimlar.</div></div><div class="actions">' + (can("edit_data") ? '<button class="btn primary" data-act="add-person">' + icon("plus") + "Yangi shaxs</button>" : "") + "</div></div>";
    h += '<div class="toolbar"><input class="input" id="p-q" placeholder="F.I.Sh., laqab yoki tashkilot..." style="width:280px"><div class="chip-filter" id="p-risk">' + [["all", "Barchasi"], ["xavfli", "Xavfli"], ["shubhali", "Shubhali"], ["toza", "Belgisiz"], ["yoq", "Manbasiz aloqa"]].map(function (x) { return '<button data-v="' + x[0] + '" class="' + ((q.src === "yoq" ? "yoq" : "all") === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + '</div><span class="muted mono" id="p-count" style="margin-left:auto"></span></div>';
    h += '<div class="card"><div class="card-b flush" style="overflow-x:auto"><table class="t"><thead><tr><th>Shaxs</th><th>Belgilar</th><th class="num">Og\'irlik</th><th>Bog\'langan xodimlar</th><th>Shaxslar bilan aloqa</th><th class="num">Tekshiruv</th></tr></thead><tbody id="p-rows"></tbody></table></div></div>';
    view.innerHTML = h;
    var flt = q.src === "yoq" ? "yoq" : "all";
    function draw() {
      var t = norm($("#p-q").value);
      var list = S.persons.filter(function (p) {
        if (!visP[p.id]) return false;
        var r = EN.personRisk(p, S.methodology);
        if (flt === "yoq") { if (!S.empPersonLinks.some(function (l) { return l.personId === p.id && !l.source; })) return false; }
        else if (flt !== "all" && r !== flt) return false;
        if (t && norm([p.fio, p.laqab, p.tashkilot, p.izoh].join(" ")).indexOf(t) < 0) return false;
        return true;
      }).sort(function (a, b) { return EN.personWeight(b, S.methodology).w - EN.personWeight(a, S.methodology).w || a.fio.localeCompare(b.fio); });
      $("#p-rows").innerHTML = list.map(function (p) {
        var pw = EN.personWeight(p, S.methodology);
        var el = S.empPersonLinks.filter(function (l) { return l.personId === p.id; });
        var pl = S.personLinks.filter(function (l) { return l.a === p.id || l.b === p.id; });
        var nCh = S.checks.filter(function (c) { return c.persons.indexOf(p.id) >= 0; }).length;
        return '<tr class="click" data-act="person" data-id="' + p.id + '"><td><div class="fio">' + esc(EN.personDisplay(p)) + "</div>" + (p.izoh && !p.tashkilot ? '<div class="sub2">' + esc(p.izoh) + "</div>" : "") + "</td><td>" + flagChips(p) + '</td><td class="num mono">' + (pw.w || '<span class="muted">0</span>') + "</td><td>" +
          el.map(function (l) { return "<div>" + (canSeeEmp(l.empId) ? esc(shortFio(E(l.empId).fio)) : '<span class="muted">Yopiq xodim</span>') + ' <span class="muted">— ' + esc(CAT.linkTypes[l.type].toLowerCase()) + "</span>" + (l.source ? "" : ' <span class="warn-src" title="Manba ko\'rsatilmagan">' + icon("alert") + "</span>") + "</div>"; }).join("") + "</td><td>" +
          (pl.map(function (l) { var o = l.a === p.id ? l.b : l.a; return "<div>" + esc(P(o).fio) + ' <span class="muted">(' + esc(CAT.linkTypes[l.type].toLowerCase()) + ")</span></div>"; }).join("") || '<span class="muted">—</span>') + '</td><td class="num mono">' + nCh + "</td></tr>";
      }).join("") || '<tr><td colspan="6" class="empty">Mos shaxs topilmadi.</td></tr>';
      $("#p-count").textContent = list.length + " / " + Object.keys(visP).length;
    }
    $("#p-q").oninput = draw;
    $$("#p-risk button").forEach(function (b) { b.onclick = function () { flt = b.getAttribute("data-v"); $$("#p-risk button").forEach(function (x) { x.classList.toggle("on", x === b); }); draw(); }; });
    draw();
  }

  function openPerson(pid) {
    var p = P(pid);
    if (!p || !visiblePersonSet()[pid]) return;
    var pw = EN.personWeight(p, S.methodology);
    var el = S.empPersonLinks.filter(function (l) { return l.personId === pid; });
    var pl = S.personLinks.filter(function (l) { return l.a === pid || l.b === pid; });
    var ch = S.checks.filter(function (c) { return c.persons.indexOf(pid) >= 0 && canSeeEmp(c.empId); });
    var h = '<div class="fio" style="font-size:16px">' + esc(EN.personDisplay(p)) + "</div>" + (p.izoh ? '<div class="dim">' + esc(p.izoh) + "</div>" : "") +
      '<div class="kv" style="margin-top:12px"><div class="k">JShShIR</div><div class="mono">' + (p.pinfl ? esc(p.pinfl) : '<span class="muted">kiritilmagan (T-11)</span>') + '</div><div class="k">Belgilar</div><div>' + flagChips(p) + '</div><div class="k">Eng og\'ir belgi</div><div>' + (pw.flag ? esc(CAT.flags[pw.flag]) + " — <b>" + pw.w + "</b>" : "—") + '</div><div class="k">Toifa</div><div>' + ({ xavfli: '<span class="badge b-red">Xavfli</span>', shubhali: '<span class="badge b-amber">Shubhali</span>', toza: '<span class="badge b-gray">Salbiy ma\'lumot yo\'q</span>' })[EN.personRisk(p, S.methodology)] + "</div>" +
      (p.flagBasis ? '<div class="k">Belgi asosi</div><div>' + esc(p.flagBasis) + "</div>" : "") + "</div>" +
      '<hr class="sep"><div class="sub2" style="margin-bottom:6px">BOG\'LANGAN XODIMLAR</div><table class="t"><tbody>' + el.map(function (l) {
        var part = R.byEmp[l.empId].parts.filter(function (x) { return x.linkId === l.id; })[0];
        return "<tr><td>" + empLink(l.empId) + '<div class="sub2">' + esc(CAT.linkTypes[l.type]) + " · " + sourceHtml(l) + '</div></td><td class="num mono">' + (part ? "+" + part.pts : "0") + "</td></tr>";
      }).join("") + "</tbody></table>" +
      '<hr class="sep"><div class="sub2" style="margin-bottom:6px">SHAXSLAR BILAN ALOQA</div>' + (pl.map(function (l) { var o = l.a === pid ? l.b : l.a; return "<div>" + personLink(o) + ' <span class="muted">— ' + esc(CAT.linkTypes[l.type].toLowerCase()) + "</span></div>"; }).join("") || '<div class="muted">—</div>') +
      '<hr class="sep"><div class="sub2" style="margin-bottom:6px">ANIQLANGAN TEKSHIRUVLAR</div>' + (ch.map(function (c) { return '<div class="mono" style="font-size:12px">' + fmtDate(c.date) + ' <span style="font-family:var(--sans)">' + esc(CAT.checkTypes[c.type]) + " · " + empLink(c.empId) + "</span></div>"; }).join("") || '<div class="muted">—</div>') +
      '<div class="toolbar" style="margin-top:16px">' + (can("edit_data") ? '<button class="btn primary sm" data-act="edit-flags" data-id="' + pid + '">Belgilarni o\'zgartirish</button>' : "") + '<a class="btn sm" href="#/graf?mode=umumiy&sel=p:' + pid + '">' + icon("graph") + "Grafda</a></div>";
    openDrawer("Shaxs kartochkasi", h);
  }

  // ============================================================ VIEW: ishlar
  function visibleCases() { return S.cases.filter(function (k) { return k.empIds.some(canSeeEmp); }); }
  function caseCard(k) {
    var acts = "";
    if (can("case_manage")) {
      if (k.status === "yangi") acts = '<button class="btn sm primary" data-act="case-take" data-id="' + k.id + '">Ko\'rib chiqishga olish</button>';
      if (k.status === "korib") acts = '<button class="btn sm primary" data-act="case-assign" data-id="' + k.id + '">Xizmat tekshiruvi tayinlash</button><button class="btn sm" data-act="case-close" data-id="' + k.id + '">Yopish</button>';
      if (k.status === "xizmat") acts = '<button class="btn sm primary" data-act="case-close" data-id="' + k.id + '">Yakunlash</button>';
    }
    return '<div class="kcard"><div style="display:flex;gap:6px;align-items:center"><span class="id">' + k.id + "</span>" + (k.origin === "tizim" ? '<span class="badge b-blue">Tizim signali</span>' : '<span class="badge b-gray">Qo\'lda</span>') + "</div>" +
      '<div class="tt">' + esc(k.title) + '</div><div class="chips">' + k.empIds.map(function (id) { return canSeeEmp(id) ? '<a class="badge b-gray" href="#/xodim/' + id + '">' + esc(shortFio(E(id).fio)) + " · " + R.byEmp[id].score + "</a>" : '<span class="badge b-gray">Yopiq xodim</span>'; }).join("") + "</div>" +
      (k.note ? '<div class="meta">' + esc(k.note) + "</div>" : "") +
      '<div class="meta">Yaratildi: ' + fmtDate(k.createdAt) + (k.owner ? " · Mas'ul: " + esc(k.owner) : "") + (k.due ? " · Muddat: " + fmtDate(k.due) : "") + (k.order ? " · Buyruq: " + esc(k.order) : "") + "</div>" +
      (k.outcome ? '<div class="meta"><span class="badge b-green">' + esc(CAT.caseOutcomes[k.outcome]) + "</span> " + esc(k.conclusion || "") + "</div>" : "") +
      (acts ? '<div class="acts">' + acts + "</div>" : "") + "</div>";
  }
  function vCases(view) {
    var list = visibleCases();
    var h = '<div class="page-head"><div><h1>Xizmat tekshiruvlari</h1><div class="sub">Tizim signallari (yuqori xavf, umumiy shaxs) va qo\'lda ochilgan ishlar. Ball — qaror emas, faqat ko\'rib chiqish uchun asos: yakuniy qarorni rahbar qabul qiladi.</div></div><div class="actions">' + (can("case_manage") ? '<button class="btn primary" data-act="new-case">' + icon("plus") + "Yangi ish</button>" : "") + "</div></div>";
    if (!can("case_manage")) h += '<div class="notice info">' + icon("info") + "<div>Ishni ko'rib chiqish, tayinlash va yopish — faqat <b>Rahbar</b> roli.</div></div>";
    h += '<div class="kanban">' + Object.keys(CAT.caseStatuses).map(function (st) {
      var items = list.filter(function (k) { return k.status === st; });
      return '<div class="kcol"><div class="kcol-h">' + CAT.caseStatuses[st] + '<span class="n">' + items.length + "</span></div>" + (items.map(caseCard).join("") || '<div class="muted" style="padding:8px 4px;font-size:12px">Bo\'sh</div>') + "</div>";
    }).join("") + "</div>";
    view.innerHTML = h;
  }

  // ============================================================ VIEW: hisobot
  function vReport(view) {
    var emps = R.ranking.filter(canSeeEmp).map(E), m = S.methodology;
    var cnt = { yuqori: 0, orta: 0, past: 0 };
    emps.forEach(function (e) { cnt[R.byEmp[e.id].level]++; });
    var checks = S.checks.filter(function (c) { return canSeeEmp(c.empId); });
    var shared = R.shared.filter(function (s) { return s.risky && s.empIds.some(canSeeEmp); });
    var ind = visibleIndirect();
    var h = '<div class="page-head no-print"><div><h1>Tahliliy hisobot</h1><div class="sub">Joriy ma\'lumotlardan avtomatik tuziladi. Chop etish yoki PDF sifatida saqlash mumkin.</div></div><div class="actions"><button class="btn" data-act="print">' + icon("printer") + "Chop etish / PDF</button>" + (can("export") ? '<button class="btn" data-act="export-json">' + icon("download") + 'JSON</button><button class="btn" data-act="export-ranking">' + icon("download") + "CSV</button>" : "") + "</div></div>";
    h += '<div class="report"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><div class="muted mono" style="font-size:11px">Sana: ' + fmtDate(TODAY) + " · Metodika v" + esc(m.version) + " · Tuzdi: " + esc(me().fio) + '</div><h1>Xodim aloqalar xaritasi</h1><div class="dim">Tekshiruvlar va aloqador shaxslar bo\'yicha tahliliy hisobot' + (scoped() ? " (bo'linmalar: " + esc(me().scope.join(", ")) + ")" : "") + '</div></div><span class="stamp">XIZMAT FOYDALANISHI UCHUN</span></div>' +
      '<p class="muted" style="font-size:11.5px">Namuna ma\'lumotlar: barcha shaxslar, ismlar va hodisalar to\'qima.</p>';
    h += "<h2>1. Umumiy holat</h2><p>Jami " + emps.length + " nafar xodim, " + checks.length + " ta tekshiruv, " + Object.keys(visiblePersonSet()).length + " nafar aloqador shaxs. Yuqori xavf: " + cnt.yuqori + ", o'rta: " + cnt.orta + ", past: " + cnt.past + ".</p>";
    h += '<table class="t"><thead><tr><th>№</th><th>Xodim</th><th>Unvon / bo\'linma</th><th class="num">Tekshiruv</th><th class="num">Ball</th><th>Daraja</th></tr></thead><tbody>' + emps.map(function (e, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(e.fio) + '<div class="sub2 mono">' + esc(e.tabel) + "</div></td><td>" + esc(e.unvon) + " / " + esc(e.bolinma) + '</td><td class="num">' + S.checks.filter(function (c) { return c.empId === e.id; }).length + '</td><td class="num"><b>' + R.byEmp[e.id].score + "</b>" + (R.byEmp[e.id].raw > R.byEmp[e.id].score ? ' <span class="muted">(' + R.byEmp[e.id].raw + ")</span>" : "") + "</td><td>" + CAT.levels[R.byEmp[e.id].level] + "</td></tr>";
    }).join("") + "</tbody></table>";
    h += "<h2>2. Xodimlar bo'yicha qisqacha</h2>" + emps.map(function (e) {
      var s = R.byEmp[e.id];
      return "<h3>" + esc(e.fio) + " — " + s.score + "/" + m.cap + " (" + CAT.levels[s.level] + " xavf)</h3>" + (s.parts.length ? '<ul class="reasons" style="margin-top:0">' + s.parts.map(function (p) { return "<li>" + esc(p.label) + " (+" + p.pts + ")" + (p.unsourced ? " — <i>aloqa manbasi ko'rsatilmagan</i>" : "") + "</li>"; }).join("") + "</ul>" : '<p class="dim">Xavf omillari aniqlanmagan.</p>');
    }).join("");
    h += "<h2>3. Xodimlar o'rtasidagi umumiy aloqalar</h2>" + (shared.length ? '<table class="t"><thead><tr><th>Umumiy shaxs</th><th>Belgilar</th><th>Bog\'langan xodimlar</th></tr></thead><tbody>' + shared.map(function (s) {
      return "<tr><td>" + esc(EN.personDisplay(P(s.personId))) + "</td><td>" + P(s.personId).flags.map(function (f) { return esc(CAT.flags[f]); }).join(", ") + "</td><td>" + s.empIds.map(function (id) { var e = E(id); return canSeeEmp(e) ? esc(e.fio) + " (" + esc(e.unvon) + ", " + esc(e.bolinma) + ")" : "Yopiq xodim"; }).join("<br>") + "</td></tr>";
    }).join("") + "</tbody></table>" : "<p>Umumiy xavfli shaxs aniqlanmadi.</p>");
    h += "<h2>4. Bilvosita aloqalar (ballga kirmaydi)</h2>" + (ind.length ? "<ul>" + ind.map(function (x) { return "<li>" + esc(empName(x.a)) + " → " + esc(P(x.via[0]).fio) + " → " + esc(P(x.via[1]).fio) + " → " + esc(empName(x.b)) + "</li>"; }).join("") + "</ul>" : "<p>Aniqlanmadi.</p>");
    var rec = [];
    var hi = emps.filter(function (e) { return R.byEmp[e.id].level === "yuqori"; }), mid = emps.filter(function (e) { return R.byEmp[e.id].level === "orta"; });
    if (hi.length) rec.push("Yuqori xavfli xodimlarga nisbatan xizmat tekshiruvi tayinlash: " + hi.map(function (e) { return e.fio + " (" + R.byEmp[e.id].score + " ball)"; }).join("; ") + ".");
    if (mid.length) rec.push("O'rta xavfli xodimlar bo'yicha qo'shimcha tekshiruvlar o'tkazish: " + mid.map(function (e) { return e.fio + " (" + R.byEmp[e.id].score + " ball)"; }).join("; ") + ".");
    R.clusters.forEach(function (c) {
      if (!c.direct.some(canSeeEmp)) return;
      rec.push(EN.personDisplay(P(c.hub)) + " orqali bog'langan xodimlar (" + c.direct.map(function (id) { return empName(id).split(" ")[0]; }).join(", ") + ") faoliyatini birgalikda tahlil qilish" + (c.indirect.length ? "; bilvosita bog'langan " + c.indirect.map(function (x) { return empName(x.empId).split(" ")[0]; }).join(", ") + " ni ham qamrab olish" : "") + ".");
    });
    var uns = unsourcedImpact();
    if (uns.length) rec.push("Manbasi ko'rsatilmagan aloqalarni tasdiqlash yoki chiqarish: " + uns.map(function (x) { return shortFio(E(x.empId).fio) + " — " + P(x.part.ref).fio + " (+" + x.part.pts + ")"; }).join("; ") + ".");
    var over = emps.filter(function (e) { return planInfo(e.id).status === "overdue"; });
    if (over.length) rec.push("Rejali tekshiruv muddati o'tgan xodimlar bo'yicha natijalarni yangilash: " + over.map(function (e) { return shortFio(e.fio); }).join(", ") + ".");
    h += "<h2>5. Xulosa va tavsiyalar</h2><ol>" + rec.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ol>";
    h += '<p class="muted" style="font-size:11.5px;margin-top:24px">Xavf bali — qaror emas, ko\'rib chiqish navbatini belgilash vositasi. Har bir xulosa xizmat tekshiruvi doirasida tasdiqlanishi kerak.</p></div>';
    view.innerHTML = h;
    if (!VIEWED["report"]) { VIEWED["report"] = 1; audit("Hisobot ko'rildi", "Tahliliy hisobot", emps.length + " xodim", []); save(); }
  }

  // ============================================================ VIEW: metodika
  var WORK = null;
  function vMethod(view) {
    var draft = S.methodDraft;
    var editable = can("method_draft") && !draft;
    if (!WORK || WORK._base !== (draft ? "d" + draft.version : "c" + S.methodology.version)) {
      WORK = clone(draft ? draft.m : S.methodology);
      WORK._base = draft ? "d" + draft.version : "c" + S.methodology.version;
    }
    var cur = S.methodology;
    var h = '<div class="page-head"><div><h1>Xavf metodikasi</h1><div class="sub">Xavf bali uch manbadan yig\'iladi: tekshiruv natijalari, aloqador shaxs belgilari (aloqa turi koeffitsiyenti bilan) va umumiy aloqalar. Natija ' + cur.cap + " bilan cheklanadi.</div></div></div>";
    h += '<div class="notice ' + (draft ? "warn" : "info") + '">' + icon(draft ? "alert" : "info") + "<div>Amaldagi versiya: <b>v" + esc(cur.version) + "</b> (" + esc(cur.approvedBy) + ", " + fmtDate(cur.approvedAt) + ")." +
      (draft ? " Loyiha <b>v" + esc(draft.version) + "</b> — muallif " + esc(draft.by) + ", " + fmtTs(draft.at) + ". Tasdiq kutilmoqda (four-eyes: muallif va tasdiqlovchi turli shaxs)." : editable ? " Qiymatlarni o'zgartiring — pastdagi simulyatsiya darhol yangilanadi." : " O'zgartirish: Administrator loyiha tayyorlaydi → Rahbar tasdiqlaydi.") + "</div></div>";
    function inp(path, val, step) {
      return '<input class="input mono" style="width:84px;text-align:right" type="number" min="0" step="' + (step || 1) + '" data-mk="' + path + '" value="' + val + '"' + (editable ? "" : " disabled") + ">";
    }
    function changed(path) { var a = getPath(WORK, path), b = getPath(cur, path); return a !== b ? ' style="background:var(--amber-bg)"' : ""; }
    h += '<div class="grid g2"><div class="card"><div class="card-h"><h3>3.1 Tekshiruv natijalari</h3></div><div class="card-b flush"><table class="t"><thead><tr><th>Natija</th><th class="num">Ball</th></tr></thead><tbody>' +
      Object.keys(CAT.results).map(function (k) { return "<tr" + changed("resultPoints." + k) + "><td>" + CAT.results[k] + '</td><td class="num">' + inp("resultPoints." + k, WORK.resultPoints[k]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    h += '<div class="card"><div class="card-h"><h3>3.3–3.4 Umumiy aloqalar va darajalar</h3></div><div class="card-b flush"><table class="t"><tbody>' +
      "<tr" + changed("sharedMinWeight") + "><td>Umumiy aloqa: shaxsning minimal og'irligi</td><td class=\"num\">" + inp("sharedMinWeight", WORK.sharedMinWeight) + "</td></tr>" +
      "<tr" + changed("sharedBonus") + "><td>Har bir umumiy shaxs uchun qo'shimcha ball</td><td class=\"num\">" + inp("sharedBonus", WORK.sharedBonus) + "</td></tr>" +
      "<tr" + changed("cap") + "><td>Yuqori chegara (cap)</td><td class=\"num\">" + inp("cap", WORK.cap) + "</td></tr>" +
      "<tr" + changed("levels.orta") + "><td>O'rta daraja boshlanishi</td><td class=\"num\">" + inp("levels.orta", WORK.levels.orta) + "</td></tr>" +
      "<tr" + changed("levels.yuqori") + "><td>Yuqori daraja boshlanishi</td><td class=\"num\">" + inp("levels.yuqori", WORK.levels.yuqori) + "</td></tr></tbody></table></div></div></div>";
    h += '<div class="grid g2 mt"><div class="card"><div class="card-h"><h3>3.2 Aloqador shaxs belgilari</h3></div><div class="card-b flush"><table class="t"><thead><tr><th>Belgi</th><th class="num">Og\'irlik</th></tr></thead><tbody>' +
      Object.keys(CAT.flags).map(function (k) { return "<tr" + changed("flagWeights." + k) + "><td>" + esc(CAT.flags[k]) + '</td><td class="num">' + inp("flagWeights." + k, WORK.flagWeights[k]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    h += '<div class="card"><div class="card-h"><h3>Aloqa turi koeffitsiyentlari</h3></div><div class="card-b flush"><table class="t"><thead><tr><th>Aloqa turi</th><th class="num">Koeffitsiyent</th></tr></thead><tbody>' +
      Object.keys(CAT.linkTypes).map(function (k) { return "<tr" + changed("linkCoef." + k) + "><td>" + esc(CAT.linkTypes[k]) + '</td><td class="num">' + inp("linkCoef." + k, WORK.linkCoef[k], 0.1) + "</td></tr>"; }).join("") + "</tbody></table></div></div></div>";
    h += '<div class="card mt"><div class="card-h"><h3>Simulyatsiya: amaldagi → ' + (draft ? "loyiha" : "yangi") + ' qiymatlar</h3></div><div class="card-b flush" id="m-sim"></div></div>';
    h += '<div id="m-err"></div><div class="toolbar" style="margin-top:14px">';
    if (editable) h += '<button class="btn" data-act="m-reset">Asl qiymatlar</button><button class="btn primary" data-act="m-submit">Loyihani tasdiqlashga yuborish</button>';
    if (draft && can("method_approve")) h += '<button class="btn primary" data-act="m-approve">' + icon("check") + "Tasdiqlash (v" + esc(draft.version) + ')</button><button class="btn" data-act="m-reject">Rad etish</button>';
    if (draft && can("method_draft")) h += '<button class="btn" data-act="m-withdraw">Loyihani qaytarib olish</button>';
    h += "</div>";
    h += '<div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Hisoblash qoidalari</h3></div><div class="card-b" style="font-size:12.5px"><ol style="margin:0;padding-left:18px">' +
      "<li>Har bir tekshiruv natijasi ballari qo'shiladi.</li><li>Har bir aloqador shaxs uchun: <b>eng og'ir belgi × aloqa turi koeffitsiyenti</b>. Bitta shaxs bir xodimga bir marta hissa qo'shadi (bir nechta aloqa turi bo'lsa — eng kattasi).</li>" +
      "<li>Yaxlitlash: <b>yarmi yuqoriga</b> (32.5 → 33, 24.5 → 25). Dasturchilar: float xatosi — 35 × 0.7 = 24.4999… (topilma T-05).</li><li>Og'irligi ≥ minimal chegaradan bo'lgan shaxs boshqa xodim bilan ham bog'langan bo'lsa — har biri uchun qo'shimcha ball. Chegara belgining sof og'irligi bilan solishtiriladi (TAXMIN, T-06).</li>" +
      "<li>Jami chegaradan oshsa — chegara; xom ball saqlanadi va saralashda ishlatiladi (T-08).</li></ol></div></div>";
    h += '<div class="card"><div class="card-h"><h3>Versiyalar tarixi</h3></div><div class="card-b flush"><table class="t"><thead><tr><th>Versiya</th><th>Sana</th><th>Kim</th><th>O\'zgarishlar</th></tr></thead><tbody>' +
      S.methodVersions.map(function (v) { return '<tr><td class="mono"><b>v' + esc(v.version) + '</b></td><td class="mono nowrap">' + fmtTs(v.at) + "</td><td>" + esc(v.by) + '</td><td style="font-size:12px">' + (v.changes.length ? v.changes.map(esc).join("<br>") : esc(v.note || "")) + "</td></tr>"; }).join("") + "</tbody></table></div></div></div>";
    view.innerHTML = h;
    $$("[data-mk]", view).forEach(function (el) {
      el.oninput = function () {
        var v = parseFloat(el.value);
        setPath(WORK, el.getAttribute("data-mk"), isNaN(v) ? el.value : v);
        el.closest("tr").style.background = getPath(WORK, el.getAttribute("data-mk")) !== getPath(cur, el.getAttribute("data-mk")) ? "var(--amber-bg)" : "";
        drawSim();
      };
    });
    drawSim();
  }
  function getPath(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split("."), last = ks.pop(); ks.reduce(function (a, k) { return a[k]; }, o)[last] = v; }
  function validateM(m) {
    var errs = [];
    function num(p, max) { var v = getPath(m, p); if (typeof v !== "number" || !isFinite(v) || v < 0) errs.push(p + ": manfiy bo'lmagan son kiriting"); else if (max != null && v > max) errs.push(p + ": " + max + " dan oshmasligi kerak"); }
    Object.keys(m.resultPoints).forEach(function (k) { num("resultPoints." + k, 100); });
    Object.keys(m.flagWeights).forEach(function (k) { num("flagWeights." + k, 100); });
    Object.keys(m.linkCoef).forEach(function (k) { num("linkCoef." + k, 3); });
    num("sharedMinWeight", 100); num("sharedBonus", 100); num("cap", 1000); num("levels.orta"); num("levels.yuqori");
    if (!errs.length) {
      if (!(m.levels.orta > 0 && m.levels.orta < m.levels.yuqori)) errs.push("Darajalar: 0 < o'rta < yuqori bo'lishi kerak");
      if (m.levels.yuqori > m.cap) errs.push("Yuqori daraja chegarasi cap dan katta bo'lmasligi kerak");
      if (m.resultPoints.toza > m.resultPoints.shubhali || m.resultPoints.shubhali > m.resultPoints.salbiy) errs.push("Natija ballari tartibi: toza ≤ shubhali ≤ salbiy");
    }
    return errs;
  }
  function diffM(a, b) {
    var out = [];
    ["resultPoints", "flagWeights", "linkCoef", "levels"].forEach(function (g) {
      Object.keys(a[g]).forEach(function (k) { if (a[g][k] !== b[g][k]) out.push(g + "." + k + ": " + a[g][k] + " → " + b[g][k]); });
    });
    ["sharedMinWeight", "sharedBonus", "cap"].forEach(function (k) { if (a[k] !== b[k]) out.push(k + ": " + a[k] + " → " + b[k]); });
    return out;
  }
  function drawSim() {
    var el = $("#m-sim"); if (!el) return;
    var errs = validateM(WORK);
    $("#m-err").innerHTML = errorsHtml(errs);
    if (errs.length) { el.innerHTML = '<div class="empty">Qiymatlar noto\'g\'ri — simulyatsiya to\'xtatildi.</div>'; return; }
    var Rn = EN.compute(S, WORK);
    if (!can("view_dossier")) {
      var c0 = R.counts, c1 = Rn.counts;
      el.innerHTML = '<table class="t"><thead><tr><th>Daraja</th><th class="num">Amaldagi</th><th class="num">Yangi</th></tr></thead><tbody>' + ["yuqori", "orta", "past"].map(function (l) { return "<tr><td>" + levelBadge(l) + '</td><td class="num mono">' + c0[l] + '</td><td class="num mono"><b>' + c1[l] + "</b></td></tr>"; }).join("") + '</tbody></table><div class="sub2" style="padding:8px 12px">Administrator faqat jamlangan taqsimotni ko\'radi — xodim nomlari yopiq.</div>';
      return;
    }
    el.innerHTML = '<table class="t"><thead><tr><th>Xodim</th><th class="num">Amaldagi</th><th class="num">Yangi</th><th class="num">Farq</th><th>Daraja</th></tr></thead><tbody>' + R.ranking.filter(canSeeEmp).map(function (id) {
      var a = R.byEmp[id], b = Rn.byEmp[id], d = b.score - a.score;
      return "<tr><td>" + esc(E(id).fio) + '</td><td class="num"><span class="score ' + a.level + '">' + a.score + '</span></td><td class="num"><span class="score ' + b.level + '">' + b.score + '</span></td><td class="num mono" style="color:' + (d > 0 ? "var(--red)" : d < 0 ? "var(--green)" : "var(--text-3)") + '">' + (d > 0 ? "+" : "") + d + "</td><td>" + (a.level !== b.level ? CAT.levels[a.level] + " → <b>" + CAT.levels[b.level] + "</b>" : '<span class="muted">o\'zgarmaydi</span>') + "</td></tr>";
    }).join("") + "</tbody></table>";
  }
  function bumpVersion(v) { var p = v.split("."); return p[0] + "." + (parseInt(p[1] || "0", 10) + 1); }

  // ============================================================ VIEW: ma'lumotnomalar
  function vRef(view) {
    var m = S.methodology;
    var units = {};
    S.employees.forEach(function (e) { units[e.bolinma] = (units[e.bolinma] || 0) + 1; });
    function tbl(title, head, rows, note) {
      return '<div class="card"><div class="card-h"><h3>' + title + '</h3><span class="cnt">' + rows.length + '</span></div><div class="card-b flush"><table class="t"><thead><tr>' + head.map(function (x) { return "<th>" + x + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>" + (note ? '<div class="sub2" style="padding:8px 12px">' + note + "</div>" : "") + "</div></div>";
    }
    var h = '<div class="page-head"><div><h1>Ma\'lumotnomalar</h1><div class="sub">Tizimda ishlatiladigan kataloglar. Og\'irlik va koeffitsiyentlar "Xavf metodikasi" bo\'limida versiyalanadi.' + (can("reference") ? "" : " Yuritish — Administrator.") + "</div></div></div>";
    h += '<div class="grid g2">' +
      tbl("Tekshiruv turlari", ["Kod", "Nomi"], Object.keys(CAT.checkTypes).map(function (k) { return ['<span class="mono">' + k + "</span>", esc(CAT.checkTypes[k]) + (k === "qarindosh" ? ' <span class="tag-new">T-02</span>' : "")]; }), "Hujjat §1 da 7 tur sanalgan; \"Qarindoshlar tekshiruvi\" ma'lumotlarda bor edi — 8-tur sifatida qo'shildi.") +
      tbl("Belgilar", ["Kod", "Nomi", "Og'irlik"], Object.keys(CAT.flags).map(function (k) { return ['<span class="mono">' + k + "</span>", flagChip(k), '<span class="mono">' + m.flagWeights[k] + "</span>"]; })) +
      tbl("Aloqa turlari", ["Kod", "Nomi", "Koef."], Object.keys(CAT.linkTypes).map(function (k) { return ['<span class="mono">' + k + "</span>", esc(CAT.linkTypes[k]), '<span class="mono">' + m.linkCoef[k] + "</span>"]; })) +
      tbl("Xavf darajalari", ["Daraja", "Oraliq", "Tavsiya"], ["past", "orta", "yuqori"].map(function (l) { return [levelBadge(l), '<span class="mono">' + (l === "past" ? "0–" + (m.levels.orta - 1) : l === "orta" ? m.levels.orta + "–" + (m.levels.yuqori - 1) : m.levels.yuqori + "–" + m.cap) + "</span>", esc(CAT.levelAdvice[l])]; })) +
      tbl("Aloqa manbalari", ["Kod", "Nomi"], [['<span class="mono">checkId</span>', "Tekshiruv (avtomatik)"]].concat(Object.keys(CAT.sources).map(function (k) { return ['<span class="mono">' + k + "</span>", esc(CAT.sources[k])]; })), "Taklif (T-04): har bir aloqada manba majburiy.") +
      tbl("Ish holatlari va natijalari", ["Kod", "Nomi"], Object.keys(CAT.caseStatuses).map(function (k) { return ['<span class="mono">' + k + "</span>", esc(CAT.caseStatuses[k])]; }).concat(Object.keys(CAT.caseOutcomes).map(function (k) { return ['<span class="mono">' + k + "</span>", "Natija: " + esc(CAT.caseOutcomes[k])]; }))) +
      tbl("Bo'linmalar", ["Nomi", "Xodimlar"], Object.keys(units).sort().map(function (u) { return [esc(u), '<span class="mono">' + units[u] + "</span>"]; })) + "</div>";
    view.innerHTML = h;
  }

  // ============================================================ VIEW: foydalanuvchilar
  function vUsers(view) {
    var h = '<div class="page-head"><div><h1>Foydalanuvchilar va rollar</h1><div class="sub">Rollarga asoslangan kirish (RBAC). Demo: yuqori o\'ngdagi menyudan istalgan foydalanuvchiga o\'ting va farqni ko\'ring.</div></div></div>';
    h += '<div class="card"><div class="card-b flush"><table class="t"><thead><tr><th>Foydalanuvchi</th><th>Rol</th><th>Ko\'rish doirasi</th><th></th></tr></thead><tbody>' + S.users.map(function (u) {
      return "<tr><td><b>" + esc(u.fio) + '</b><div class="sub2">namuna foydalanuvchi</div></td><td><span class="badge b-blue">' + ROLES[u.role].name + '</span><div class="sub2">' + esc(ROLES[u.role].desc) + "</div></td><td>" + (u.scope === "*" ? "Barcha bo'linmalar" : u.role === "admin" ? '<span class="muted">Dosyelarga kirish yo\'q</span>' : esc(u.scope.join(", "))) + "</td><td>" + (u.id === S.currentUser ? '<span class="badge b-green">joriy</span>' : '<button class="btn sm" data-act="switch-user" data-id="' + u.id + '">Kirish (demo)</button>') + "</td></tr>";
    }).join("") + "</tbody></table></div></div>";
    var roles = ["inspektor", "rahbar", "auditor", "admin"];
    h += '<div class="card mt"><div class="card-h"><h3>Huquqlar matritsasi</h3></div><div class="card-b flush" style="overflow-x:auto"><table class="t"><thead><tr><th>Huquq</th>' + roles.map(function (r) { return '<th style="text-align:center">' + ROLES[r].name + "</th>"; }).join("") + "</tr></thead><tbody>" +
      MATRIX.map(function (row) { return "<tr><td>" + esc(row[1]) + "</td>" + roles.map(function (r) { var v = row[2][r]; return '<td style="text-align:center">' + (v === true ? '<span class="badge b-green">✓</span>' : v === "scope" ? '<span class="badge b-amber">bo\'linmasi</span>' : v === "read" ? '<span class="badge b-blue">o\'qish</span>' : '<span class="muted">—</span>') + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></div>";
    h += '<div class="card mt"><div class="card-h"><h3>Tamoyillar</h3></div><div class="card-b"><ul style="margin:0;padding-left:18px;line-height:1.7">' +
      "<li><b>Bilish zarurati (need-to-know):</b> inspektor faqat biriktirilgan bo'linmalarni ko'radi; boshqa bo'linma xodimi \"Yopiq xodim\" bo'lib qoladi, lekin umumiy aloqa fakti yashirilmaydi — eskalatsiya uchun.</li>" +
      "<li><b>Vazifalar ajratilgan:</b> administrator tizimni boshqaradi, lekin dosyelarni ko'rmaydi; metodikani administrator tayyorlaydi, rahbar tasdiqlaydi (four-eyes).</li>" +
      "<li><b>Manfaatlar to'qnashuvi:</b> foydalanuvchi o'zi yoki qarindoshi haqidagi yozuvni ko'ra olmaydi (Faza 1 talabi; JShShIR bo'yicha tekshiriladi).</li>" +
      "<li><b>Har bir kirish qayd etiladi:</b> profil ko'rish, kiritish, o'zgartirish, eksport — audit jurnaliga (o'zgartirib bo'lmaydi).</li>" +
      "<li><b>Kirish:</b> Faza 1 da idoraviy domen (AD/LDAP) + ikki bosqichli autentifikatsiya; ish joyi IP cheklovi.</li></ul></div></div>";
    view.innerHTML = h;
  }

  // ============================================================ VIEW: audit
  function auditTable(list) {
    if (!list.length) return '<div class="empty">Yozuv yo\'q.</div>';
    return '<table class="t"><thead><tr><th>Vaqt</th><th>Foydalanuvchi</th><th>Amal</th><th>Obyekt</th><th>Tafsilot</th></tr></thead><tbody>' + list.map(function (a) {
      return '<tr><td class="mono nowrap" style="font-size:12px">' + fmtTs(a.ts) + "</td><td>" + esc(a.user) + '<div class="sub2">' + esc((ROLES[a.role] || {}).name || a.role) + "</div></td><td><b>" + esc(a.action) + "</b></td><td>" + esc(a.object) + '</td><td class="dim" style="font-size:12px">' + esc(a.details) + "</td></tr>";
    }).join("") + "</tbody></table>";
  }
  function vAudit(view) {
    var actions = {};
    S.audit.forEach(function (a) { actions[a.action] = 1; });
    var h = '<div class="page-head"><div><h1>Audit jurnali</h1><div class="sub">Kim, qachon, nima qildi. Jurnal faqat qo\'shiladi — tahrirlash va o\'chirish imkoni yo\'q.</div></div><div class="actions">' + (can("audit_export") ? '<button class="btn" data-act="export-audit">' + icon("download") + "CSV</button>" : "") + "</div></div>";
    h += '<div class="toolbar"><input class="input" id="a-q" placeholder="Qidiruv..." style="width:240px"><select class="select" id="a-act"><option value="">Barcha amallar</option>' + Object.keys(actions).sort().map(function (k) { return "<option>" + esc(k) + "</option>"; }).join("") + '</select><span class="muted mono" id="a-count" style="margin-left:auto"></span></div><div class="card"><div class="card-b flush" id="a-rows"></div></div>';
    view.innerHTML = h;
    function draw() {
      var t = norm($("#a-q").value), ac = $("#a-act").value;
      var list = S.audit.filter(function (a) { return (!ac || a.action === ac) && (!t || norm([a.user, a.action, a.object, a.details].join(" ")).indexOf(t) >= 0); });
      $("#a-rows").innerHTML = auditTable(list);
      $("#a-count").textContent = list.length + " ta";
    }
    $("#a-q").oninput = draw; $("#a-act").onchange = draw;
    draw();
  }

  var VIEWS = { dashboard: vDashboard, xodimlar: vEmployees, xodim: vProfile, graf: vGraph, aloqalar: vLinks, tekshiruvlar: vChecks, shaxslar: vPersons, ishlar: vCases, hisobot: vReport, metodika: vMethod, malumotnoma: vRef, foydalanuvchilar: vUsers, audit: vAudit };

  // ============================================================ forms
  function flagBoxes(prefix, selected) {
    return '<div class="check-list">' + Object.keys(CAT.flags).map(function (f) { return '<label><input type="checkbox" data-' + prefix + '="' + f + '"' + (selected.indexOf(f) >= 0 ? " checked" : "") + "> " + esc(CAT.flags[f]) + ' <span class="muted mono">' + S.methodology.flagWeights[f] + "</span></label>"; }).join("") + "</div>";
  }
  function similarPersons(fio) {
    var n = norm(fio).split(" ");
    if (n.length < 2) return [];
    return S.persons.filter(function (p) { var q = norm(p.fio).split(" "); return q[0] === n[0] && q[1] === n[1]; });
  }
  function previewText(mutate, empId) {
    try {
      var T = clone(S);
      mutate(T);
      var Rn = EN.compute(T), a = R.byEmp[empId], b = Rn.byEmp[empId];
      if (!a || !b) return "";
      if (a.score === b.score) return '<span class="muted">Ball o\'zgarmaydi: ' + a.score + "</span>";
      return "Ball: <b>" + a.score + " → " + b.score + "</b>" + (a.level !== b.level ? ' · <span class="badge ' + (b.level === "yuqori" ? "b-red" : b.level === "orta" ? "b-amber" : "b-green") + '">' + CAT.levels[a.level] + " → " + CAT.levels[b.level] + "</span>" : "");
    } catch (e) { return ""; }
  }

  function openCheckModal(empId) {
    if (!can("edit_data")) return;
    var emps = visibleEmps();
    if (!emps.length) return;
    var st = { emp: empId || emps[0].id, result: "", rows: [] };
    var visP = visiblePersonSet();
    var personOpts = S.persons.filter(function (p) { return visP[p.id]; }).sort(function (a, b) { return a.fio.localeCompare(b.fio); });
    var body = '<div class="form-grid">' +
      '<div class="field"><label>Xodim <span class="req">*</span></label><select class="select" id="f-emp"' + (empId ? " disabled" : "") + ">" + emps.map(function (e) { return '<option value="' + e.id + '"' + (e.id === st.emp ? " selected" : "") + ">" + esc(e.fio) + " · " + esc(e.tabel) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label>Tekshiruv turi <span class="req">*</span></label><select class="select" id="f-type"><option value="">— tanlang —</option>' + Object.keys(CAT.checkTypes).map(function (k) { return '<option value="' + k + '">' + esc(CAT.checkTypes[k]) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label>Sana <span class="req">*</span></label><input type="date" class="input" id="f-date" max="' + TODAY + '" value="' + TODAY + '"></div>' +
      '<div class="field"><label>Asos (buyruq / topshiriq №) <span class="req">*</span></label><input class="input" id="f-basis" placeholder="masalan: 214-ich/2026"><span class="hint">Taklif: huquqiy asossiz tekshiruv kiritilmaydi</span></div>' +
      '<div class="field full"><label>Natija <span class="req">*</span></label><div class="radio-row" id="f-res">' + Object.keys(CAT.results).map(function (k) { return '<label data-v="' + k + '"><input type="radio" name="res" value="' + k + '" style="display:none">' + CAT.results[k] + ' <span class="muted mono">+' + S.methodology.resultPoints[k] + "</span></label>"; }).join("") + "</div></div>" +
      '<div class="field full"><label>Xulosa <span class="req" id="f-creq"></span></label><textarea class="input" id="f-concl" rows="3" placeholder="Nima aniqlandi, qanday dalil bilan"></textarea></div>' +
      '<div class="field full"><label>Aniqlangan shaxslar</label><div id="f-rows"></div><div><button type="button" class="btn sm" id="f-addrow">' + icon("plus") + 'Shaxs qo\'shish</button></div><span class="hint">Xodim bilan hali bog\'lanmagan shaxs uchun aloqa turi tanlanadi — aloqaning manbasi shu tekshiruv bo\'ladi.</span></div></div><div id="f-err"></div>';
    var foot = '<div class="preview" id="f-prev"></div><button class="btn" data-close="modal">Bekor qilish</button><button class="btn primary" id="f-save">Saqlash</button>';
    openModal("Tekshiruv kiritish", body, foot, function () {
      function linkedType(pid) { var l = S.empPersonLinks.filter(function (x) { return x.empId === st.emp && x.personId === pid; })[0]; return l ? l.type : null; }
      function drawRows() {
        $("#f-rows").innerHTML = st.rows.map(function (r, i) {
          var lt = r.pid && r.pid !== "new" ? linkedType(r.pid) : null;
          return '<div class="idp-row"><select class="select" data-ri="' + i + '" data-k="pid" style="flex:1;min-width:0"><option value="">— shaxsni tanlang —</option><option value="new"' + (r.pid === "new" ? " selected" : "") + ">+ Yangi shaxs</option>" + personOpts.map(function (p) { return '<option value="' + p.id + '"' + (p.id === r.pid ? " selected" : "") + ">" + esc(EN.personDisplay(p)) + "</option>"; }).join("") + "</select>" +
            (lt ? '<span class="badge b-gray">mavjud aloqa: ' + esc(CAT.linkTypes[lt]) + "</span>" : '<select class="select" data-ri="' + i + '" data-k="type"><option value="">aloqa turi *</option>' + Object.keys(CAT.linkTypes).filter(function (k) { return k !== "hamkasb"; }).map(function (k) { return '<option value="' + k + '"' + (r.type === k ? " selected" : "") + ">" + esc(CAT.linkTypes[k]) + "</option>"; }).join("") + "</select>") +
            '<button class="btn ghost sm" data-ri="' + i + '" data-k="del" title="Olib tashlash">✕</button></div>' +
            (r.pid === "new" ? '<div style="padding:8px 0 10px 12px;border-left:3px solid var(--blue-bg)"><input class="input" data-ri="' + i + '" data-k="fio" placeholder="F.I.Sh. *" value="' + esc(r.fio || "") + '" style="width:100%;margin-bottom:8px">' + flagBoxes("nf" + i, r.flags || []) + '<div class="hint" id="f-sim' + i + '"></div></div>' : "");
        }).join("");
        $$("#f-rows [data-ri]").forEach(function (el) {
          var i = +el.getAttribute("data-ri"), k = el.getAttribute("data-k");
          if (k === "del") el.onclick = function () { st.rows.splice(i, 1); drawRows(); upd(); };
          else if (k === "fio") el.oninput = function () { st.rows[i].fio = el.value; var sim = similarPersons(el.value); $("#f-sim" + i).innerHTML = sim.length ? '<span class="warn-src">' + icon("alert") + " Shunga o'xshash shaxs bor: " + sim.map(function (p) { return esc(EN.personDisplay(p)); }).join(", ") + " — dublikat bo'lmasin (T-11)</span>" : ""; upd(); };
          else el.onchange = function () { st.rows[i][k] = el.value; if (k === "pid") drawRows(); upd(); };
        });
        $$("#f-rows [data-nf0],#f-rows input[type=checkbox]").forEach(function (cb) {
          cb.onchange = function () {
            var attr = Array.prototype.filter.call(cb.attributes, function (a) { return /^data-nf\d+$/.test(a.name); })[0];
            if (!attr) return;
            var i = +attr.name.replace("data-nf", ""), f = attr.value;
            var fl = st.rows[i].flags = st.rows[i].flags || [];
            if (cb.checked) { if (fl.indexOf(f) < 0) fl.push(f); } else fl.splice(fl.indexOf(f), 1);
            upd();
          };
        });
      }
      function vals() { return { emp: empId || $("#f-emp").value, type: $("#f-type").value, date: $("#f-date").value, basis: $("#f-basis").value.trim(), result: st.result, concl: $("#f-concl").value.trim(), rows: st.rows }; }
      function mutate(T, v, by) {
        var cid = nextId("c", T.checks), pids = [];
        v.rows.forEach(function (r) {
          var pid = r.pid;
          if (pid === "new") {
            pid = nextId("p", T.persons);
            T.persons.push({ id: pid, fio: r.fio.trim(), izoh: "", flags: (r.flags || []).slice(), flagBasis: (r.flags || []).length ? "Tekshiruv " + cid : "" });
          }
          if (!pid || pids.indexOf(pid) >= 0) return;
          pids.push(pid);
          var exists = T.empPersonLinks.some(function (l) { return l.empId === v.emp && l.personId === pid; });
          if (!exists && r.type) T.empPersonLinks.push({ id: nextId("l", T.empPersonLinks), empId: v.emp, personId: pid, type: r.type, source: cid });
        });
        T.checks.push({ id: cid, empId: v.emp, type: v.type, date: v.date, result: v.result, conclusion: v.concl, persons: pids, basis: v.basis, createdBy: by });
        return cid;
      }
      function validate(v) {
        var errs = [];
        if (!v.type) errs.push("Tekshiruv turini tanlang.");
        if (!v.date) errs.push("Sanani kiriting.");
        else if (v.date > TODAY) errs.push("Sana kelajakda bo'lishi mumkin emas (" + fmtDate(TODAY) + " dan keyin).");
        if (v.basis.length < 3) errs.push("Asos (buyruq / topshiriq raqami) majburiy.");
        if (!v.result) errs.push("Natijani tanlang.");
        if (v.result && v.result !== "toza" && v.concl.length < 10) errs.push("Shubhali yoki salbiy natija uchun xulosa majburiy (kamida 10 belgi).");
        var seen = {};
        v.rows.forEach(function (r, i) {
          var n = i + 1;
          if (!r.pid) errs.push(n + "-shaxs: tanlanmagan.");
          if (r.pid === "new" && (!r.fio || r.fio.trim().split(/\s+/).length < 2)) errs.push(n + "-shaxs: familiya va ismni kiriting.");
          if (r.pid && r.pid !== "new") { if (seen[r.pid]) errs.push(n + "-shaxs: takrorlangan."); seen[r.pid] = 1; }
          var linked = r.pid && r.pid !== "new" && S.empPersonLinks.some(function (l) { return l.empId === v.emp && l.personId === r.pid; });
          if (r.pid && !linked && !r.type) errs.push(n + "-shaxs: aloqa turini tanlang.");
        });
        return errs;
      }
      function upd() {
        var v = vals();
        $("#f-creq").textContent = v.result && v.result !== "toza" ? "*" : "";
        if (!v.type || !v.result) { $("#f-prev").innerHTML = '<span class="muted">Natijani tanlang — ball o\'zgarishi shu yerda</span>'; return; }
        $("#f-prev").innerHTML = previewText(function (T) { mutate(T, v, ""); }, v.emp);
      }
      if (!empId) $("#f-emp").onchange = function () { st.emp = this.value; drawRows(); upd(); };
      $("#f-type").onchange = upd; $("#f-date").oninput = upd; $("#f-concl").oninput = upd;
      $$("#f-res label").forEach(function (lb) { lb.onclick = function () { st.result = lb.getAttribute("data-v"); $$("#f-res label").forEach(function (x) { x.classList.toggle("on", x === lb); }); upd(); }; });
      $("#f-addrow").onclick = function () { st.rows.push({ pid: "", type: "" }); drawRows(); };
      $("#f-save").onclick = function () {
        var v = vals(), errs = validate(v);
        $("#f-err").innerHTML = errorsHtml(errs);
        if (errs.length) return;
        var cid = mutate(S, v, me().fio);
        closeModal();
        commit("Tekshiruv kiritildi", cid + " · " + CAT.checkTypes[v.type], E(v.emp).fio + " · natija: " + CAT.results[v.result] + " · asos: " + v.basis, [v.emp]);
        toast("Tekshiruv saqlandi: " + CAT.checkTypes[v.type]);
      };
      drawRows(); upd();
    }, true);
  }

  function openLinkModal(empId) {
    if (!can("edit_data") || !canSeeEmp(empId)) return;
    var e = E(empId), visP = visiblePersonSet();
    var personOpts = S.persons.filter(function (p) { return visP[p.id]; }).sort(function (a, b) { return a.fio.localeCompare(b.fio); });
    var checks = S.checks.filter(function (c) { return c.empId === empId; });
    var body = '<div class="notice info">' + icon("info") + "<div>Xodim: <b>" + esc(e.fio) + "</b>. Har bir aloqa uchun manba majburiy (taklif T-04): manbasiz aloqa ballga ta'sir qilsa — tekshirib bo'lmaydi.</div></div>" +
      '<div class="form-grid"><div class="field full"><label>Shaxs <span class="req">*</span></label><select class="select" id="l-p"><option value="">— tanlang —</option><option value="new">+ Yangi shaxs</option>' + personOpts.map(function (p) { return '<option value="' + p.id + '">' + esc(EN.personDisplay(p)) + "</option>"; }).join("") + '</select></div><div class="field full" id="l-new" style="display:none"><input class="input" id="l-fio" placeholder="F.I.Sh. *" style="margin-bottom:8px"><input class="input" id="l-izoh" placeholder="Izoh (masalan: otasi, hamkor tashkilot rahbari)" style="margin-bottom:8px">' + flagBoxes("lf", []) + '<div class="hint" id="l-sim"></div></div>' +
      '<div class="field"><label>Aloqa turi <span class="req">*</span></label><select class="select" id="l-type"><option value="">— tanlang —</option>' + Object.keys(CAT.linkTypes).filter(function (k) { return k !== "hamkasb"; }).map(function (k) { return '<option value="' + k + '">' + esc(CAT.linkTypes[k]) + " (×" + S.methodology.linkCoef[k] + ")</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label>Manba <span class="req">*</span></label><select class="select" id="l-src"><option value="">— tanlang —</option>' + checks.map(function (c) { return '<option value="' + c.id + '">Tekshiruv: ' + esc(CAT.checkTypes[c.type]) + " · " + fmtDate(c.date) + "</option>"; }).join("") + Object.keys(CAT.sources).map(function (k) { return '<option value="' + k + '">' + esc(CAT.sources[k]) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field full"><label>Manba tafsiloti <span class="req" id="l-nreq"></span></label><input class="input" id="l-note" placeholder="Hujjat raqami, sanasi"></div></div><div id="l-err"></div>';
    openModal("Aloqa qo'shish", body, '<div class="preview" id="l-prev"></div><button class="btn" data-close="modal">Bekor qilish</button><button class="btn primary" id="l-save">Saqlash</button>', function () {
      function vals() {
        var flags = $$("#l-new input[type=checkbox]").filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-lf"); });
        return { pid: $("#l-p").value, fio: $("#l-fio").value.trim(), izoh: $("#l-izoh").value.trim(), flags: flags, type: $("#l-type").value, src: $("#l-src").value, note: $("#l-note").value.trim() };
      }
      function mutate(T, v) {
        var pid = v.pid;
        if (pid === "new") { pid = nextId("p", T.persons); T.persons.push({ id: pid, fio: v.fio, izoh: v.izoh, flags: v.flags, flagBasis: v.flags.length ? (v.note || CAT.sources[v.src] || v.src) : "" }); }
        T.empPersonLinks.push({ id: nextId("l", T.empPersonLinks), empId: empId, personId: pid, type: v.type, source: v.src || null, sourceNote: v.note });
        return pid;
      }
      function validate(v) {
        var errs = [];
        if (!v.pid) errs.push("Shaxsni tanlang.");
        if (v.pid === "new" && v.fio.split(/\s+/).length < 2) errs.push("Yangi shaxs: familiya va ismni kiriting.");
        if (!v.type) errs.push("Aloqa turini tanlang.");
        if (v.pid && v.pid !== "new" && S.empPersonLinks.some(function (l) { return l.empId === empId && l.personId === v.pid && l.type === v.type; })) errs.push("Bu aloqa allaqachon mavjud.");
        if (!v.src) errs.push("Manbani tanlang.");
        if ((v.src === "tezkor" || v.src === "boshqa") && v.note.length < 3) errs.push("Tezkor ma'lumot yoki boshqa hujjat uchun tafsilot majburiy.");
        return errs;
      }
      function upd() {
        var v = vals();
        $("#l-new").style.display = v.pid === "new" ? "" : "none";
        $("#l-nreq").textContent = v.src === "tezkor" || v.src === "boshqa" ? "*" : "";
        var sim = v.pid === "new" ? similarPersons(v.fio) : [];
        $("#l-sim").innerHTML = sim.length ? '<span class="warn-src">' + icon("alert") + " Shunga o'xshash shaxs bor: " + sim.map(function (p) { return esc(EN.personDisplay(p)); }).join(", ") + "</span>" : "";
        $("#l-prev").innerHTML = v.pid && v.type && (v.pid !== "new" || v.fio) ? previewText(function (T) { mutate(T, v); }, empId) : "";
      }
      $$("#modal-body input,#modal-body select").forEach(function (el) { el.oninput = upd; el.onchange = upd; });
      $("#l-save").onclick = function () {
        var v = vals(), errs = validate(v);
        $("#l-err").innerHTML = errorsHtml(errs);
        if (errs.length) return;
        var pid = mutate(S, v);
        closeModal();
        commit("Aloqa qo'shildi", e.fio + " — " + P(pid).fio, CAT.linkTypes[v.type] + " · manba: " + (C(v.src) ? "tekshiruv " + v.src : CAT.sources[v.src]) + (v.note ? " (" + v.note + ")" : ""), [empId]);
      };
      upd();
    });
  }

  function openPersonModal() {
    if (!can("edit_data")) return;
    var body = '<div class="form-grid"><div class="field full"><label>F.I.Sh. <span class="req">*</span></label><input class="input" id="n-fio"><div class="hint" id="n-sim"></div></div>' +
      '<div class="field"><label>JShShIR</label><input class="input mono" id="n-pinfl" maxlength="14" placeholder="14 raqam"><span class="hint">Dublikatning oldini oladi (T-11)</span></div>' +
      '<div class="field"><label>Izoh</label><input class="input" id="n-izoh" placeholder="masalan: tashkilot rahbari"></div>' +
      '<div class="field full"><label>Belgilar</label>' + flagBoxes("nb", []) + '</div><div class="field full"><label>Belgi asosi <span class="req" id="n-breq"></span></label><input class="input" id="n-basis" placeholder="Reyestr, so\'rov raqami va sanasi"></div></div><div id="n-err"></div>' +
      '<div class="notice info" style="margin-top:12px">' + icon("info") + "<div>Shaxs xodim bilan avtomatik bog'lanmaydi. Bog'lash — xodim profilidagi \"Aloqa\" yoki tekshiruv kiritish orqali.</div></div>";
    openModal("Yangi aloqador shaxs", body, '<button class="btn" data-close="modal">Bekor qilish</button><button class="btn primary" id="n-save">Saqlash</button>', function () {
      function flags() { return $$("#modal-body input[type=checkbox]").filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-nb"); }); }
      $("#n-fio").oninput = function () { var sim = similarPersons(this.value); $("#n-sim").innerHTML = sim.length ? '<span class="warn-src">' + icon("alert") + " Shunga o'xshash shaxs bor: " + sim.map(function (p) { return esc(EN.personDisplay(p)); }).join(", ") + "</span>" : ""; };
      $$("#modal-body input[type=checkbox]").forEach(function (c) { c.onchange = function () { $("#n-breq").textContent = flags().length ? "*" : ""; }; });
      $("#n-save").onclick = function () {
        var fio = $("#n-fio").value.trim(), pinfl = $("#n-pinfl").value.trim(), fl = flags(), basis = $("#n-basis").value.trim(), errs = [];
        if (fio.split(/\s+/).length < 2) errs.push("Familiya va ismni kiriting.");
        if (pinfl && !/^\d{14}$/.test(pinfl)) errs.push("JShShIR 14 ta raqamdan iborat bo'lishi kerak.");
        if (pinfl && S.persons.some(function (p) { return p.pinfl === pinfl; })) errs.push("Bu JShShIR bilan shaxs allaqachon mavjud.");
        if (fl.length && basis.length < 3) errs.push("Belgi kiritilsa — asos majburiy.");
        $("#n-err").innerHTML = errorsHtml(errs);
        if (errs.length) return;
        var pid = nextId("p", S.persons);
        S.persons.push({ id: pid, fio: fio, izoh: $("#n-izoh").value.trim(), pinfl: pinfl || null, flags: fl, flagBasis: basis });
        closeModal();
        commit("Shaxs qo'shildi", fio, fl.map(function (f) { return CAT.flags[f]; }).join(", ") || "belgisiz", []);
      };
    });
  }

  function openFlagsModal(pid) {
    if (!can("edit_data")) return;
    var p = P(pid);
    var linked = S.empPersonLinks.filter(function (l) { return l.personId === pid; }).map(function (l) { return l.empId; });
    var body = '<div class="fio" style="margin-bottom:10px">' + esc(EN.personDisplay(p)) + "</div>" + flagBoxes("ef", p.flags) +
      '<div class="field" style="margin-top:12px"><label>O\'zgartirish asosi <span class="req">*</span></label><input class="input" id="ef-basis" placeholder="Reyestr javobi, sana"></div><div id="ef-err"></div>';
    openModal("Belgilarni o'zgartirish", body, '<div class="preview" id="ef-prev"></div><button class="btn" data-close="modal">Bekor qilish</button><button class="btn primary" id="ef-save">Saqlash</button>', function () {
      function flags() { return $$("#modal-body input[type=checkbox]").filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-ef"); }); }
      function upd() {
        var fl = flags();
        $("#ef-prev").innerHTML = linked.filter(canSeeEmp).map(function (eid) { return shortFio(E(eid).fio) + ": " + previewText(function (T) { T.persons.filter(function (x) { return x.id === pid; })[0].flags = fl; }, eid); }).join("<br>");
      }
      $$("#modal-body input[type=checkbox]").forEach(function (c) { c.onchange = upd; });
      $("#ef-save").onclick = function () {
        var fl = flags(), basis = $("#ef-basis").value.trim();
        if (basis.length < 3) { $("#ef-err").innerHTML = errorsHtml(["O'zgartirish asosi majburiy."]); return; }
        var before = p.flags.map(function (f) { return CAT.flags[f]; }).join(", ") || "—";
        p.flags = fl; p.flagBasis = basis;
        closeModal();
        commit("Belgilar o'zgartirildi", p.fio, before + " → " + (fl.map(function (f) { return CAT.flags[f]; }).join(", ") || "—") + " · asos: " + basis, linked);
        openPerson(pid);
      };
      upd();
    });
  }

  function openNewCase(empId) {
    if (!can("case_manage")) return;
    var emps = visibleEmps();
    var body = '<div class="form-grid"><div class="field full"><label>Xodim(lar) <span class="req">*</span></label><div class="check-list">' + emps.map(function (e) { return '<label><input type="checkbox" data-ce="' + e.id + '"' + (e.id === empId ? " checked" : "") + "> " + esc(shortFio(e.fio)) + " · " + R.byEmp[e.id].score + "</label>"; }).join("") + '</div></div><div class="field full"><label>Mavzu <span class="req">*</span></label><input class="input" id="nc-title" value="' + (empId ? "Xizmat tekshiruvi: " + esc(shortFio(E(empId).fio)) : "") + '"></div><div class="field full"><label>Asos / izoh</label><textarea class="input" id="nc-note" rows="2"></textarea></div></div><div id="nc-err"></div>';
    openModal("Yangi ish", body, '<button class="btn" data-close="modal">Bekor qilish</button><button class="btn primary" id="nc-save">Yaratish</button>', function () {
      $("#nc-save").onclick = function () {
        var ids = $$("#modal-body [data-ce]").filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-ce"); });
        var title = $("#nc-title").value.trim(), errs = [];
        if (!ids.length) errs.push("Kamida bitta xodimni tanlang.");
        if (title.length < 5) errs.push("Mavzuni kiriting.");
        $("#nc-err").innerHTML = errorsHtml(errs);
        if (errs.length) return;
        var id = "K-" + String(parseInt(nextId("", S.cases).replace(/\D/g, ""), 10)).padStart(3, "0");
        S.cases.push({ id: id, empIds: ids, title: title, status: "korib", origin: "qolda", createdAt: TODAY, owner: me().fio, due: null, outcome: null, note: $("#nc-note").value.trim() });
        closeModal();
        commit("Ish yaratildi", id + " · " + title, ids.map(function (x) { return E(x).fio; }).join(", "), ids);
        go("#/ishlar");
      };
    });
  }
  function caseById(id) { return S.cases.filter(function (k) { return k.id === id; })[0]; }
  function caseAssign(id) {
    var k = caseById(id);
    var owners = S.users.filter(function (u) { return u.role === "inspektor" || u.role === "rahbar"; });
    var body = '<div class="form-grid"><div class="field"><label>Mas\'ul <span class="req">*</span></label><select class="select" id="ca-owner">' + owners.map(function (u) { return "<option>" + esc(u.fio) + "</option>"; }).join("") + '</select></div><div class="field"><label>Muddat <span class="req">*</span></label><input type="date" class="input" id="ca-due" min="' + TODAY + '" value="' + addDays(TODAY, 30) + '"><span class="hint">Standart: 30 kun (TAXMIN)</span></div><div class="field full"><label>Buyruq raqami <span class="req">*</span></label><input class="input" id="ca-order" placeholder="masalan: 512-sonli buyruq"></div></div><div id="ca-err"></div>';
    openModal(k.id + " — xizmat tekshiruvi tayinlash", body, '<button class="btn" data-close="modal">Bekor qilish</button><button class="btn primary" id="ca-save">Tayinlash</button>', function () {
      $("#ca-save").onclick = function () {
        var due = $("#ca-due").value, order = $("#ca-order").value.trim(), errs = [];
        if (!due || due < TODAY) errs.push("Muddat bugundan oldin bo'lmasligi kerak.");
        if (order.length < 3) errs.push("Buyruq raqami majburiy.");
        $("#ca-err").innerHTML = errorsHtml(errs);
        if (errs.length) return;
        k.status = "xizmat"; k.owner = $("#ca-owner").value; k.due = due; k.order = order;
        closeModal();
        commit("Xizmat tekshiruvi tayinlandi", k.id, "Mas'ul: " + k.owner + " · muddat " + fmtDate(due) + " · " + order, k.empIds);
      };
    });
  }
  function caseClose(id) {
    var k = caseById(id);
    var outs = k.status === "korib" ? ["tasdiqlanmadi", "profilaktika"] : Object.keys(CAT.caseOutcomes);
    var body = '<div class="field"><label>Natija <span class="req">*</span></label><select class="select" id="cc-out"><option value="">— tanlang —</option>' + outs.map(function (o) { return '<option value="' + o + '">' + esc(CAT.caseOutcomes[o]) + "</option>"; }).join("") + '</select></div><div class="field" style="margin-top:12px"><label>Xulosa <span class="req">*</span></label><textarea class="input" id="cc-txt" rows="3"></textarea></div><div id="cc-err"></div>';
    openModal(k.id + " — yopish", body, '<button class="btn" data-close="modal">Bekor qilish</button><button class="btn primary" id="cc-save">Yopish</button>', function () {
      $("#cc-save").onclick = function () {
        var o = $("#cc-out").value, t = $("#cc-txt").value.trim(), errs = [];
        if (!o) errs.push("Natijani tanlang.");
        if (t.length < 10) errs.push("Xulosa kamida 10 belgi.");
        $("#cc-err").innerHTML = errorsHtml(errs);
        if (errs.length) return;
        k.status = "yopildi"; k.outcome = o; k.conclusion = t; k.closedAt = TODAY;
        if (!k.owner) k.owner = me().fio;
        closeModal();
        commit("Ish yopildi", k.id, CAT.caseOutcomes[o] + " · " + t, k.empIds);
      };
    });
  }

  // ============================================================ global actions
  var ACTIONS = {
    "add-check": function (el) { openCheckModal(el.getAttribute("data-emp")); },
    "add-link": function (el) { openLinkModal(el.getAttribute("data-emp")); },
    "add-person": function () { openPersonModal(); },
    "edit-flags": function (el) { openFlagsModal(el.getAttribute("data-id")); },
    "person": function (el) { openPerson(el.getAttribute("data-id")); },
    "new-case": function (el) { openNewCase(el.getAttribute("data-emp")); },
    "case-take": function (el) { var k = caseById(el.getAttribute("data-id")); k.status = "korib"; k.owner = me().fio; commit("Ish ko'rib chiqishga olindi", k.id, k.title, k.empIds); },
    "case-assign": function (el) { caseAssign(el.getAttribute("data-id")); },
    "case-close": function (el) { caseClose(el.getAttribute("data-id")); },
    "print": function () { window.print(); },
    "switch-user": function (el) { switchUser(el.getAttribute("data-id")); },
    "export-ranking": function () {
      if (!can("export")) return;
      var rows = [["Tabel", "F.I.Sh.", "Unvon", "Bo'linma", "Ball", "Xom ball", "Daraja", "Tekshiruvlar", "Oxirgi tekshiruv"]];
      R.ranking.filter(canSeeEmp).forEach(function (id) { var e = E(id), s = R.byEmp[id]; rows.push([e.tabel, e.fio, e.unvon, e.bolinma, s.score, s.raw, CAT.levels[s.level], S.checks.filter(function (c) { return c.empId === id; }).length, fmtDate(lastCheck(id))]); });
      download("xodimlar-reytingi-" + TODAY + ".csv", csv(rows), "text/csv;charset=utf-8");
      audit("Eksport", "Xodimlar reytingi (CSV)", (rows.length - 1) + " qator", []); save();
    },
    "export-json": function () {
      if (!can("export")) return;
      var out = { generatedAt: new Date().toISOString(), methodology: S.methodology, employees: R.ranking.filter(canSeeEmp).map(function (id) { var e = E(id); return { tabel: e.tabel, fio: e.fio, unvon: e.unvon, bolinma: e.bolinma, score: R.byEmp[id].score, raw: R.byEmp[id].raw, level: R.byEmp[id].level, parts: R.byEmp[id].parts.map(function (p) { return { label: p.label, pts: p.pts }; }) }; }), shared: R.shared, indirect: visibleIndirect() };
      download("tahliliy-hisobot-" + TODAY + ".json", JSON.stringify(out, null, 2), "application/json");
      audit("Eksport", "Tahliliy hisobot (JSON)", out.employees.length + " xodim", []); save();
    },
    "export-audit": function () {
      if (!can("audit_export")) return;
      var rows = [["Vaqt", "Foydalanuvchi", "Rol", "Amal", "Obyekt", "Tafsilot"]].concat(S.audit.map(function (a) { return [fmtTs(a.ts), a.user, (ROLES[a.role] || {}).name || a.role, a.action, a.object, a.details]; }));
      download("audit-" + TODAY + ".csv", csv(rows), "text/csv;charset=utf-8");
      audit("Eksport", "Audit jurnali (CSV)", (rows.length - 1) + " qator", []); save();
    },
    "m-reset": function () { WORK = null; render(); },
    "m-submit": function () {
      var errs = validateM(WORK);
      if (errs.length) { $("#m-err").innerHTML = errorsHtml(errs); return; }
      var m = clone(WORK); delete m._base;
      var ch = diffM(S.methodology, m);
      if (!ch.length) { $("#m-err").innerHTML = errorsHtml(["Hech qanday qiymat o'zgarmagan."]); return; }
      var v = bumpVersion(S.methodology.version);
      m.version = v;
      S.methodDraft = { version: v, m: m, by: me().fio, at: new Date().toISOString(), changes: ch };
      WORK = null;
      commit("Metodika loyihasi yuborildi", "v" + v, ch.join("; "), []);
      toast("Loyiha v" + v + " rahbar tasdig'iga yuborildi");
    },
    "m-approve": function () {
      var d = S.methodDraft; if (!d || !can("method_approve")) return;
      if (d.by === me().fio) { toast("Muallif o'z loyihasini tasdiqlay olmaydi (four-eyes)", true); return; }
      confirmModal("Metodikani tasdiqlash", "v" + esc(d.version) + " amalga kiritiladi va barcha ballar qayta hisoblanadi:<br><br><span class='mono' style='font-size:12px'>" + d.changes.map(esc).join("<br>") + "</span>", "Tasdiqlash", function () {
        var m = clone(d.m); m.approvedAt = TODAY; m.approvedBy = me().fio;
        S.methodology = m;
        S.methodVersions.unshift({ version: d.version, at: new Date().toISOString(), by: d.by + " → " + me().fio, note: "", changes: d.changes });
        S.methodDraft = null; WORK = null;
        commit("Metodika tasdiqlandi", "v" + d.version, d.changes.join("; "), []);
      });
    },
    "m-reject": function () {
      var d = S.methodDraft; if (!d) return;
      S.methodDraft = null; WORK = null;
      commit("Metodika loyihasi rad etildi", "v" + d.version, d.changes.join("; "), []);
    },
    "m-withdraw": function () {
      var d = S.methodDraft; if (!d) return;
      S.methodDraft = null; WORK = null;
      commit("Metodika loyihasi qaytarib olindi", "v" + d.version, "", []);
    },
    "reset-demo": function () {
      confirmModal("Demo ma'lumotlarni tiklash", "Barcha kiritilgan o'zgarishlar o'chiriladi va hujjatdagi (24.10.2026) boshlang'ich holat tiklanadi.", "Tiklash", function () {
        try { localStorage.removeItem(LS_KEY); } catch (e) { /* jim */ }
        S = freshState(); R = EN.compute(S); VIEWED = {}; WORK = null;
        toast("Boshlang'ich holat tiklandi");
        go("#/dashboard");
      }, true);
    }
  };
  function switchUser(uid) {
    S.currentUser = uid; VIEWED = {}; WORK = null;
    save();
    $("#user-dd").classList.remove("open");
    toast("Rol: " + ROLES[me().role].name + " — " + me().fio);
    var ph = parseHash(), perm = pagePerm(ph.parts[0] || "");
    if ((perm && !can(perm)) || (ph.parts[0] === "xodim" && !canSeeEmp(ph.parts[1]))) go("#/" + defaultPage()); else render();
  }

  document.addEventListener("click", function (e) {
    var close = e.target.closest("[data-close]");
    if (close) { if (close.getAttribute("data-close") === "modal") closeModal(); else closeDrawer(); return; }
    var act = e.target.closest("[data-act]");
    if (act && ACTIONS[act.getAttribute("data-act")]) { e.preventDefault(); ACTIONS[act.getAttribute("data-act")](act, e); return; }
    var g = e.target.closest("[data-go]");
    if (g && !e.target.closest("a[href]:not([data-go])")) { $("#sidebar").classList.remove("mobile-open"); go(g.getAttribute("data-go")); }
  });
  $("#overlay").onclick = function () { closeModal(); closeDrawer(); };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeModal(); closeDrawer(); $("#user-dd").classList.remove("open"); $("#bell-dd").classList.remove("open"); } });
  window.addEventListener("hashchange", render);

  // ---------- topbar: user menu, bell, search, sidebar ----------
  $("#user-chip").onclick = function (e) {
    if (e.target.closest("#user-dd")) return;
    var dd = $("#user-dd");
    dd.innerHTML = '<div class="dd-h">Demo: foydalanuvchini almashtirish</div>' + S.users.map(function (u) {
      return '<div class="dd-i' + (u.id === S.currentUser ? " on" : "") + '" data-act="switch-user" data-id="' + u.id + '"><div class="user-chip" style="border:none;padding:0"><div class="av">' + initials(u.fio) + '</div></div><div><div class="t">' + esc(u.fio) + " · " + ROLES[u.role].name + '</div><div class="s">' + esc(ROLES[u.role].desc) + "</div></div></div>";
    }).join("") + '<div style="border-top:1px solid var(--border);margin:6px 0"></div><div class="dd-i" data-act="reset-demo"><div>' + icon("refresh") + '</div><div><div class="t">Demo ma\'lumotlarni tiklash</div><div class="s">Hujjatdagi boshlang\'ich holatga qaytish</div></div></div>';
    $("#bell-dd").classList.remove("open");
    dd.classList.toggle("open");
  };
  $("#btn-bell").onclick = function (e) {
    e.stopPropagation();
    var dd = $("#bell-dd"), al = alerts();
    var notes = S.notifications.slice(0, 5);
    dd.innerHTML = '<div class="dd-h">Signallar</div>' + (al.length ? al.map(function (a) { return '<div class="dd-i" data-go="' + a.href + '"><span class="badge ' + (a.cls === "danger" ? "b-red" : a.cls === "warn" ? "b-amber" : "b-blue") + '">!</span><div class="s" style="color:var(--text-1)">' + esc(a.text) + "</div></div>"; }).join("") : '<div class="dd-i"><div class="s">Signal yo\'q</div></div>') +
      (notes.length ? '<div class="dd-h">So\'nggi o\'zgarishlar</div>' + notes.map(function (n) { return '<div class="dd-i" data-go="' + n.href + '"><div><div class="s" style="color:var(--text-1)">' + esc(n.text) + '</div><div class="s">' + fmtTs(n.ts) + "</div></div></div>"; }).join("") : "");
    $("#user-dd").classList.remove("open");
    dd.classList.toggle("open");
  };
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#user-chip")) $("#user-dd").classList.remove("open");
    if (!e.target.closest("#btn-bell") && !e.target.closest("#bell-dd")) $("#bell-dd").classList.remove("open");
    if (!e.target.closest(".search-box")) $("#gsearch-res").classList.remove("open");
  });
  $("#bell-dd").addEventListener("click", function () { $("#bell-dd").classList.remove("open"); });

  var SR = [];
  $("#gsearch").oninput = function () {
    var t = norm(this.value), box = $("#gsearch-res");
    if (t.length < 2 || !can("view_dossier")) { box.classList.remove("open"); return; }
    var visP = visiblePersonSet();
    SR = visibleEmps().filter(function (e) { return norm([e.fio, e.tabel, e.bolinma, e.unvon].join(" ")).indexOf(t) >= 0; }).map(function (e) { return { k: "Xodim", l: e.fio, s: e.tabel + " · " + e.bolinma, go: "#/xodim/" + e.id }; })
      .concat(S.persons.filter(function (p) { return visP[p.id] && norm([p.fio, p.laqab, p.tashkilot].join(" ")).indexOf(t) >= 0; }).map(function (p) { return { k: "Shaxs", l: EN.personDisplay(p), s: p.flags.map(function (f) { return CAT.flags[f]; }).join(", "), person: p.id }; })).slice(0, 10);
    box.innerHTML = SR.length ? SR.map(function (r, i) { return '<div class="sr' + (i === 0 ? " hl" : "") + '" data-i="' + i + '"><div><div class="fio">' + esc(r.l) + '</div><div class="sub2">' + esc(r.s || "") + '</div></div><span class="k">' + r.k + "</span></div>"; }).join("") : '<div class="sr muted">Topilmadi</div>';
    box.classList.add("open");
    $$(".sr[data-i]", box).forEach(function (el) { el.onclick = function () { pickSR(+el.getAttribute("data-i")); }; });
  };
  $("#gsearch").onkeydown = function (e) { if (e.key === "Enter" && SR.length) pickSR(0); };
  function pickSR(i) {
    var r = SR[i]; if (!r) return;
    $("#gsearch").value = ""; $("#gsearch-res").classList.remove("open");
    if (r.go) go(r.go); else openPerson(r.person);
  }
  $("#btn-collapse").onclick = function () { $("#sidebar").classList.toggle("collapsed"); };
  $("#btn-menu").onclick = function () {
    if (window.innerWidth <= 820) $("#sidebar").classList.toggle("mobile-open");
    else $("#sidebar").classList.toggle("collapsed");
  };

  render();
})();
