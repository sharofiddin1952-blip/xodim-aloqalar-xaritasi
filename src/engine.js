/* ============================================================
   Xodim Aloqalar Xaritasi — tahlil dvigateli
   Xavf bali (hujjat §3), umumiy va bilvosita aloqalar, yo'l topish.
   Brauzerda: window.XAX_ENGINE; Node'da: require('./engine.js').
   Holat (state) shakli — data/seed.js bilan bir xil.
   ============================================================ */
(function (root) {
  "use strict";

  // Yarmi yuqoriga yaxlitlash. Float xatosidan himoya: 35 * 0.7 = 24.499999999999996 -> 25 bo'lishi kerak (T-05)
  function round(v) { return Math.round(v + 1e-9); }

  function indexBy(list) {
    var o = {};
    list.forEach(function (x) { o[x.id] = x; });
    return o;
  }

  function personWeight(person, m) {
    var w = 0, flag = null;
    (person.flags || []).forEach(function (f) {
      var x = m.flagWeights[f] || 0;
      if (x > w) { w = x; flag = f; }
    });
    return { w: w, flag: flag };
  }

  // Shaxs xavf toifasi (graf rangi): xavfli >= sharedMinWeight, shubhali > 0, toza = 0
  function personRisk(person, m) {
    var w = personWeight(person, m).w;
    return w >= m.sharedMinWeight ? "xavfli" : w > 0 ? "shubhali" : "toza";
  }

  function level(score, m) {
    return score >= m.levels.yuqori ? "yuqori" : score >= m.levels.orta ? "orta" : "past";
  }

  function personDisplay(p) {
    var s = p.fio;
    if (p.laqab) s += " (\"" + p.laqab + "\")";
    if (p.tashkilot) s = p.tashkilot + " rahbari " + s;
    return s;
  }

  function empsByPerson(state) {
    var map = {};
    state.empPersonLinks.forEach(function (l) {
      (map[l.personId] = map[l.personId] || []);
      if (map[l.personId].indexOf(l.empId) < 0) map[l.personId].push(l.empId);
    });
    return map;
  }

  function personNeighbors(state) {
    var map = {};
    state.personLinks.forEach(function (l) {
      (map[l.a] = map[l.a] || []).push({ id: l.b, link: l });
      (map[l.b] = map[l.b] || []).push({ id: l.a, link: l });
    });
    return map;
  }

  // ---------- Xavf bali ----------
  function scoreEmployee(state, emp, m, ctx) {
    var cat = state.catalog, P = ctx.P, parts = [];

    // 3.1 Tekshiruv natijalari (sana bo'yicha)
    state.checks
      .filter(function (c) { return c.empId === emp.id; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; })
      .forEach(function (c) {
        var pts = m.resultPoints[c.result] || 0;
        if (pts > 0) parts.push({ kind: "check", ref: c.id, pts: pts, label: cat.checkTypes[c.type] + ": " + cat.results[c.result].toLowerCase() });
      });

    // 3.2 Aloqador shaxs: eng og'ir belgi x aloqa koeffitsiyenti. Bitta shaxs — bitta hissa (eng kattasi)
    var best = {}, order = [];
    state.empPersonLinks
      .filter(function (l) { return l.empId === emp.id; })
      .forEach(function (l) {
        var p = P[l.personId];
        if (!p) return;
        var pw = personWeight(p, m);
        var coef = m.linkCoef[l.type] != null ? m.linkCoef[l.type] : 1;
        var pts = round(pw.w * coef);
        if (!best[p.id]) order.push(p.id);
        if (!best[p.id] || pts > best[p.id].pts) best[p.id] = { p: p, l: l, w: pw.w, flag: pw.flag, coef: coef, pts: pts };
      });
    order.forEach(function (pid) {
      var b = best[pid];
      if (b.pts <= 0) return;
      var flags = b.p.flags.map(function (f) { return cat.flags[f]; }).join(", ");
      parts.push({
        kind: "person", ref: pid, linkId: b.l.id, pts: b.pts, w: b.w, coef: b.coef, flag: b.flag,
        unsourced: b.l.source == null,
        label: cat.linkTypes[b.l.type].toLowerCase() + " — " + personDisplay(b.p) + " [" + flags + "]"
      });
    });

    // 3.3 Umumiy aloqalar: og'irligi >= 20 shaxs boshqa xodim bilan ham bog'langan
    var shared = order.filter(function (pid) {
      return best[pid].w >= m.sharedMinWeight &&
        (ctx.EP[pid] || []).some(function (e) { return e !== emp.id; });
    });
    if (shared.length) {
      parts.push({ kind: "shared", refs: shared, pts: shared.length * m.sharedBonus, label: "Boshqa xodim bilan umumiy shubhali aloqa: " + shared.length + " ta" });
    }

    var raw = parts.reduce(function (s, x) { return s + x.pts; }, 0);
    var score = Math.min(m.cap, raw);
    return { empId: emp.id, raw: raw, score: score, level: level(score, m), parts: parts, sharedPersons: shared };
  }

  // ---------- Umumiy shaxslar (to'g'ridan-to'g'ri) ----------
  function sharedPersons(state, m, ctx) {
    var out = [];
    Object.keys(ctx.EP).forEach(function (pid) {
      var emps = ctx.EP[pid], p = ctx.P[pid];
      if (!p || emps.length < 2) return;
      var w = personWeight(p, m).w;
      out.push({ personId: pid, empIds: emps.slice(), w: w, risky: w >= m.sharedMinWeight });
    });
    return out.sort(function (a, b) { return b.w - a.w; });
  }

  // ---------- Bilvosita aloqalar: xodim — shaxs — shaxs — xodim (T-07) ----------
  function indirectLinks(state, m, ctx) {
    var seen = {}, out = [];
    var direct = {};
    sharedPersons(state, m, ctx).forEach(function (s) {
      s.empIds.forEach(function (a) { s.empIds.forEach(function (b) { if (a !== b) direct[a + "|" + b] = true; }); });
    });
    state.personLinks.forEach(function (pl) {
      [[pl.a, pl.b], [pl.b, pl.a]].forEach(function (pair) {
        var pa = pair[0], pb = pair[1];
        (ctx.EP[pa] || []).forEach(function (ea) {
          (ctx.EP[pb] || []).forEach(function (eb) {
            if (ea === eb) return;
            // agar ea pb bilan ham to'g'ridan bog'langan bo'lsa — bu yo'l yangi narsa bermaydi
            if ((ctx.EP[pb] || []).indexOf(ea) >= 0) return;
            if ((ctx.EP[pa] || []).indexOf(eb) >= 0) return;
            var key = [ea, eb].sort().join("|") + "|" + [pa, pb].sort().join("|");
            if (seen[key]) return;
            seen[key] = true;
            var wa = personWeight(ctx.P[pa], m).w, wb = personWeight(ctx.P[pb], m).w;
            out.push({ a: ea, b: eb, via: [pa, pb], linkType: pl.type, w: Math.max(wa, wb), alsoDirect: !!direct[ea + "|" + eb] });
          });
        });
      });
    });
    return out.sort(function (x, y) { return y.w - x.w; });
  }

  // ---------- Klasterlar: umumiy xavfli shaxs atrofidagi xodimlar ----------
  function clusters(state, m, ctx, shared) {
    var NB = personNeighbors(state);
    return shared.filter(function (s) { return s.risky; }).map(function (s) {
      var indirect = [];
      (NB[s.personId] || []).forEach(function (n) {
        (ctx.EP[n.id] || []).forEach(function (e) {
          if (s.empIds.indexOf(e) >= 0) return;
          var ex = indirect.filter(function (x) { return x.empId === e; })[0];
          if (ex) ex.via.push(n.id); else indirect.push({ empId: e, via: [n.id] });
        });
      });
      return { hub: s.personId, direct: s.empIds.slice(), indirect: indirect, w: s.w };
    });
  }

  function compute(state, mOverride) {
    var m = mOverride || state.methodology;
    var ctx = { P: indexBy(state.persons), E: indexBy(state.employees), EP: empsByPerson(state) };
    var byEmp = {};
    state.employees.forEach(function (e) { byEmp[e.id] = scoreEmployee(state, e, m, ctx); });
    var shared = sharedPersons(state, m, ctx);
    var counts = { past: 0, orta: 0, yuqori: 0 };
    Object.keys(byEmp).forEach(function (k) { counts[byEmp[k].level]++; });
    return {
      methodology: m,
      byEmp: byEmp,
      ranking: state.employees.map(function (e) { return e.id; }).sort(function (a, b) {
        return byEmp[b].raw - byEmp[a].raw || byEmp[b].score - byEmp[a].score;
      }),
      counts: counts,
      shared: shared,
      indirect: indirectLinks(state, m, ctx),
      clusters: clusters(state, m, ctx, shared)
    };
  }

  // ---------- Yo'l topish (BFS): xodim/shaxs tugunlari orasida eng qisqa zanjir ----------
  // Tugun kaliti: "e:e1" yoki "p:p3". Tekshiruv tugunlari hisobga olinmaydi.
  function adjacency(state) {
    var adj = {};
    function add(a, b, edge) {
      (adj[a] = adj[a] || []).push({ to: b, edge: edge });
      (adj[b] = adj[b] || []).push({ to: a, edge: edge });
    }
    state.empPersonLinks.forEach(function (l) { add("e:" + l.empId, "p:" + l.personId, { kind: "ep", type: l.type, id: l.id }); });
    state.personLinks.forEach(function (l) { add("p:" + l.a, "p:" + l.b, { kind: "pp", type: l.type, id: l.id }); });
    (state.empLinks || []).forEach(function (l) { add("e:" + l.a, "e:" + l.b, { kind: "ee", type: l.type, id: l.id }); });
    return adj;
  }

  function shortestPath(state, from, to, opts) {
    opts = opts || {};
    var adj = adjacency(state), prev = {}, q = [from], seen = {};
    seen[from] = true;
    while (q.length) {
      var cur = q.shift();
      if (cur === to) break;
      (adj[cur] || []).forEach(function (n) {
        if (seen[n.to]) return;
        if (opts.skipColleague && n.edge.kind === "ee") return;
        seen[n.to] = true;
        prev[n.to] = { from: cur, edge: n.edge };
        q.push(n.to);
      });
    }
    if (!seen[to]) return null;
    var path = [to], edges = [];
    while (path[0] !== from) {
      var p = prev[path[0]];
      edges.unshift(p.edge);
      path.unshift(p.from);
    }
    return { nodes: path, edges: edges };
  }

  var ENGINE = {
    round: round,
    personWeight: personWeight,
    personRisk: personRisk,
    personDisplay: personDisplay,
    level: level,
    compute: compute,
    shortestPath: shortestPath,
    adjacency: adjacency
  };

  if (typeof module === "object" && module.exports) module.exports = ENGINE;
  else root.XAX_ENGINE = ENGINE;
})(typeof self !== "undefined" ? self : this);
