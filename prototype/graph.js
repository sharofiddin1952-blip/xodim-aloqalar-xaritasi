/* ============================================================
   XAXGraph — tashqi kutubxonasiz SVG graf (force layout)
   Tugun: {id, kind:'emp'|'person'|'check', label, initials, level, risk, result, masked}
   Aloqa: {id, s, t, kind:'ep'|'pp'|'ee'|'ec'|'cp', label, shared}
   ============================================================ */
(function (root) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var LEVEL_STROKE = { yuqori: "#B3261E", orta: "#B5894A", past: "#157A4A" };
  var RISK_FILL = { xavfli: "#A8473B", shubhali: "#C29A4E", toza: "#FFFFFF" };
  var RESULT_FILL = { toza: "#5E8C61", shubhali: "#C9A04A", salbiy: "#B3261E" };
  var LINK_LEN = { ep: 120, pp: 110, ee: 170, ec: 70, cp: 95 };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function create(container, opts) {
    opts = opts || {};
    var svg = document.createElementNS(NS, "svg");
    container.appendChild(svg);
    var vp = document.createElementNS(NS, "g");
    svg.appendChild(vp);
    var gLinks = document.createElementNS(NS, "g"), gLabels = document.createElementNS(NS, "g"), gNodes = document.createElementNS(NS, "g");
    vp.appendChild(gLinks); vp.appendChild(gLabels); vp.appendChild(gNodes);

    var pos = {};            // id -> {x,y,vx,vy,pinned}
    var nodes = [], links = [], byId = {}, adj = {};
    var tf = { k: 1, x: 0, y: 0 };
    var showLinkLabels = true;
    var selected = null, focusSet = null, pathSet = null;

    function applyTf() { vp.setAttribute("transform", "translate(" + tf.x + "," + tf.y + ") scale(" + tf.k + ")"); }

    function size() { var r = svg.getBoundingClientRect(); return { w: r.width || 800, h: r.height || 500 }; }

    function setData(data, o) {
      o = o || {};
      nodes = data.nodes; links = data.links; byId = {}; adj = {};
      nodes.forEach(function (n) { byId[n.id] = n; adj[n.id] = {}; });
      links = links.filter(function (l) { return byId[l.s] && byId[l.t]; });
      links.forEach(function (l) { adj[l.s][l.t] = l.id; adj[l.t][l.s] = l.id; });
      // boshlang'ich joylar: avval bor bo'lsa — saqlanadi, yangi tugun — qo'shnisi yonida
      var fresh = 0;
      nodes.forEach(function (n, i) {
        if (pos[n.id]) return;
        fresh++;
        var nb = Object.keys(adj[n.id]).filter(function (k) { return pos[k]; })[0];
        var a = (i * 2.399963) % (Math.PI * 2), r = nb ? 60 : 40 + 14 * Math.sqrt(i);
        var cx = nb ? pos[nb].x : 0, cy = nb ? pos[nb].y : 0;
        pos[n.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: 0, vy: 0 };
      });
      if (o.center && pos[o.center]) { pos[o.center].x = 0; pos[o.center].y = 0; }
      simulate(fresh > 0 || o.relayout ? 360 : 60, o.center);
      selected = o.select || null;
      pathSet = null; focusSet = null;
      render();
      if (o.fit !== false) fit();
    }

    function simulate(steps, center) {
      var N = nodes.length;
      for (var s = 0; s < steps; s++) {
        var alpha = 1 - s / steps;
        for (var i = 0; i < N; i++) {
          var a = pos[nodes[i].id];
          for (var j = i + 1; j < N; j++) {
            var b = pos[nodes[j].id];
            var dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
            if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; }
            var d = Math.sqrt(d2), f = 5200 / d2;
            if (d > 600) f *= 0.3;
            a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
          }
        }
        links.forEach(function (l) {
          var a = pos[l.s], b = pos[l.t];
          var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
          var f = (d - (LINK_LEN[l.kind] || 110)) * 0.045;
          a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
        });
        nodes.forEach(function (n) {
          var p = pos[n.id];
          p.vx -= p.x * 0.006; p.vy -= p.y * 0.006;
          if (p.pinned || n.id === center) { p.vx = 0; p.vy = 0; return; }
          p.vx *= 0.82; p.vy *= 0.82;
          var max = 30;
          p.x += Math.max(-max, Math.min(max, p.vx)) * (0.25 + alpha);
          p.y += Math.max(-max, Math.min(max, p.vy)) * (0.25 + alpha);
        });
      }
    }

    function nodeR(n) { return n.kind === "emp" ? (n.center ? 26 : 22) : n.kind === "person" ? 12 : 9; }

    function linkStyle(l) {
      if (l.shared) return { stroke: "#B3261E", w: 3.4, dash: "", op: 0.85 };
      switch (l.kind) {
        case "ep": return { stroke: "#8A93A3", w: 1.6, dash: "", op: 1 };
        case "pp": return { stroke: "#9AA4B8", w: 1.4, dash: "6 4", op: 1 };
        case "ee": return { stroke: "#2C4CE0", w: 2, dash: "2 5", op: 0.8 };
        case "ec": return { stroke: "#C5CCD8", w: 1.2, dash: "", op: 1 };
        case "cp": return { stroke: "#B0B8C6", w: 1.2, dash: "3 3", op: 1 };
      }
      return { stroke: "#999", w: 1, dash: "", op: 1 };
    }

    function nodeShape(n) {
      var r = nodeR(n), h = "";
      if (n.kind === "emp") {
        var st = n.masked ? "#B5BCC8" : (LEVEL_STROKE[n.level] || "#2B4C8C");
        h += "<circle r='" + r + "' fill='#fff' stroke='" + st + "' stroke-width='" + (n.center ? 5 : 4) + "'/>";
        h += "<text class='ini' text-anchor='middle' dy='4'>" + esc(n.masked ? "?" : n.initials) + "</text>";
        h += "<text text-anchor='middle' dy='" + (r + 17) + "' font-weight='700'>" + esc(n.label) + "</text>";
      } else if (n.kind === "person") {
        var fill = RISK_FILL[n.risk] || "#fff";
        var stroke = n.risk === "toza" ? "#8A93A3" : n.risk === "xavfli" ? "#7E2D24" : "#8F6B2A";
        h += "<circle r='" + r + "' fill='" + fill + "' stroke='" + stroke + "' stroke-width='2' stroke-dasharray='" + (n.risk === "toza" ? "" : "3 2") + "'/>";
        h += "<text text-anchor='middle' dy='" + (r + 15) + "'>" + esc(n.label) + "</text>";
      } else {
        h += "<path d='M0,-" + (r + 2) + " L" + (r + 2) + ",0 L0," + (r + 2) + " L-" + (r + 2) + ",0Z' fill='#fff' stroke='" + (RESULT_FILL[n.result] || "#999") + "' stroke-width='2.4'/>";
        h += "<path d='M0,-" + (r - 3) + " L" + (r - 3) + ",0 L0," + (r - 3) + " L-" + (r - 3) + ",0Z' fill='" + (RESULT_FILL[n.result] || "#999") + "'/>";
        h += "<text text-anchor='middle' dy='" + (r + 15) + "' style='font-size:10.5px;fill:#4B5468'>" + esc(n.label) + "</text>";
      }
      if (n.id === selected) h = "<circle r='" + (r + 7) + "' fill='none' stroke='#2C4CE0' stroke-width='2' stroke-dasharray='4 3'/>" + h;
      return h;
    }

    function render() {
      var lh = "", llh = "", nh = "";
      links.forEach(function (l) {
        var st = linkStyle(l);
        if (pathSet && pathSet.links[l.id]) st = { stroke: "#6339B8", w: 4, dash: "", op: 1 };
        lh += "<line data-l='" + esc(l.id) + "' stroke='" + st.stroke + "' stroke-width='" + st.w + "' stroke-opacity='" + st.op + "'" + (st.dash ? " stroke-dasharray='" + st.dash + "'" : "") + "/>";
        if (showLinkLabels && l.label) llh += "<text class='glink-label' data-ll='" + esc(l.id) + "' text-anchor='middle'>" + esc(l.label) + "</text>";
      });
      nodes.forEach(function (n) {
        nh += "<g class='gnode' data-n='" + esc(n.id) + "'><title>" + esc(n.title || n.label) + "</title>" + nodeShape(n) + "</g>";
      });
      gLinks.innerHTML = lh; gLabels.innerHTML = llh; gNodes.innerHTML = nh;
      updatePositions();
      applyDim();
    }

    function updatePositions() {
      gLinks.querySelectorAll("line").forEach(function (el) {
        var l = linkById(el.getAttribute("data-l")); if (!l) return;
        var a = pos[l.s], b = pos[l.t];
        el.setAttribute("x1", a.x); el.setAttribute("y1", a.y); el.setAttribute("x2", b.x); el.setAttribute("y2", b.y);
      });
      gLabels.querySelectorAll("text").forEach(function (el) {
        var l = linkById(el.getAttribute("data-ll")); if (!l) return;
        var a = pos[l.s], b = pos[l.t];
        el.setAttribute("x", (a.x + b.x) / 2); el.setAttribute("y", (a.y + b.y) / 2 - 3);
      });
      gNodes.querySelectorAll("g.gnode").forEach(function (el) {
        var p = pos[el.getAttribute("data-n")];
        el.setAttribute("transform", "translate(" + p.x + "," + p.y + ")");
      });
    }

    var linkIdx = null;
    function linkById(id) {
      if (!linkIdx || linkIdx._n !== links) { linkIdx = { _n: links }; links.forEach(function (l) { linkIdx[l.id] = l; }); }
      return linkIdx[id];
    }

    function applyDim() {
      var set = focusSet || (pathSet ? pathSet.nodes : null);
      gNodes.querySelectorAll("g.gnode").forEach(function (el) {
        el.classList.toggle("dimmed", !!set && !set[el.getAttribute("data-n")]);
      });
      var lset = focusSet ? null : (pathSet ? pathSet.links : null);
      gLinks.querySelectorAll("line").forEach(function (el) {
        var l = linkById(el.getAttribute("data-l"));
        var on = !set || (lset ? lset[l.id] : (set[l.s] && set[l.t]));
        el.classList.toggle("dimmed", !on);
      });
      gLabels.querySelectorAll("text").forEach(function (el) {
        var l = linkById(el.getAttribute("data-ll"));
        var on = !set || (lset ? lset[l.id] : (set[l.s] && set[l.t]));
        el.classList.toggle("dimmed", !on);
      });
    }

    function fit() {
      if (!nodes.length) return;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(function (n) { var p = pos[n.id]; minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
      var sz = size(), pad = 90;
      var k = Math.min((sz.w - pad * 2) / Math.max(maxX - minX, 1), (sz.h - pad * 2 - 40) / Math.max(maxY - minY, 1), 1.5);
      k = Math.max(0.25, k);
      tf.k = k;
      tf.x = sz.w / 2 - (minX + maxX) / 2 * k;
      tf.y = (sz.h - 40) / 2 - (minY + maxY) / 2 * k;
      applyTf();
    }

    function zoomBy(f, cx, cy) {
      var sz = size();
      if (cx == null) { cx = sz.w / 2; cy = sz.h / 2; }
      var k2 = Math.max(0.2, Math.min(4, tf.k * f));
      tf.x = cx - (cx - tf.x) * (k2 / tf.k);
      tf.y = cy - (cy - tf.y) * (k2 / tf.k);
      tf.k = k2;
      applyTf();
    }

    // ---------- Interaktivlik ----------
    function toGraph(evt) {
      var r = svg.getBoundingClientRect();
      return { x: (evt.clientX - r.left - tf.x) / tf.k, y: (evt.clientY - r.top - tf.y) / tf.k };
    }
    var drag = null, pan = null, moved = false;
    svg.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      var g =e.target.closest ? e.target.closest("g.gnode") : null;
      moved = false;
      if (g) {
        var id = g.getAttribute("data-n"), p = toGraph(e);
        drag = { id: id, dx: pos[id].x - p.x, dy: pos[id].y - p.y };
      } else {
        pan = { x: e.clientX, y: e.clientY, tx: tf.x, ty: tf.y };
        svg.classList.add("panning");
      }
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (drag) {
        var p = toGraph(e), q = pos[drag.id];
        if (Math.abs(q.x - (p.x + drag.dx)) + Math.abs(q.y - (p.y + drag.dy)) > 1) moved = true;
        q.x = p.x + drag.dx; q.y = p.y + drag.dy; q.pinned = true;
        updatePositions();
      } else if (pan) {
        if (Math.abs(e.clientX - pan.x) + Math.abs(e.clientY - pan.y) > 2) moved = true;
        tf.x = pan.tx + e.clientX - pan.x; tf.y = pan.ty + e.clientY - pan.y; applyTf();
      } else {
        var g = e.target.closest ? e.target.closest("g.gnode") : null;
        var id = g ? g.getAttribute("data-n") : null;
        if (id !== hoverId) { hoverId = id; hover(id); }
      }
    });
    var hoverId = null;
    function hover(id) {
      if (!id) { focusSet = null; applyDim(); return; }
      focusSet = {}; focusSet[id] = true;
      Object.keys(adj[id] || {}).forEach(function (k) { focusSet[k] = true; });
      applyDim();
    }
    // Pointer capture tufayli dblclick tugunga yetib bormaydi — ikki marta bosish qo'lda aniqlanadi
    var lastTap = { id: null, t: 0 };
    svg.addEventListener("pointerup", function () {
      if (drag && !moved) {
        var id = drag.id, now = Date.now();
        drag = null;
        if (lastTap.id === id && now - lastTap.t < 380) {
          lastTap = { id: null, t: 0 };
          if (opts.onOpen) opts.onOpen(byId[id]);
          return;
        }
        lastTap = { id: id, t: now };
        selected = id; render();
        if (opts.onSelect) opts.onSelect(byId[id]);
      } else if (pan && !moved) {
        selected = null; render();
        if (opts.onSelect) opts.onSelect(null);
      }
      drag = null; pan = null; svg.classList.remove("panning");
    });
    svg.addEventListener("pointerleave", function () { if (!drag && !pan) { hoverId = null; hover(null); } });
    svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      var r = svg.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    return {
      setData: setData,
      fit: fit,
      zoomIn: function () { zoomBy(1.2); },
      zoomOut: function () { zoomBy(1 / 1.2); },
      relayout: function () { Object.keys(pos).forEach(function (k) { delete pos[k]; }); setData({ nodes: nodes, links: links }, { relayout: true, select: selected }); },
      setLinkLabels: function (v) { showLinkLabels = v; render(); },
      highlightPath: function (nodeIds, linkIds) {
        if (!nodeIds) { pathSet = null; render(); return; }
        pathSet = { nodes: {}, links: {} };
        nodeIds.forEach(function (id) { pathSet.nodes[id] = true; });
        linkIds.forEach(function (id) { pathSet.links[id] = true; });
        render();
      },
      select: function (id) { selected = id; render(); },
      destroy: function () { container.removeChild(svg); }
    };
  }

  root.XAXGraph = { create: create };
})(this);
