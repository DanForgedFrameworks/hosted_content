/* Rise to Moodle publishing checklist: rendering, filters, step-by-step carousel, screenshot viewer.
   Content lives in data.js (SHOTS and SECTIONS). */
(function () {
  "use strict";

  const PALETTE = [["#691EDA", "Primary purple"], ["#370C75", "Dark purple"], ["#F08858", "Orange"]];
  const WHO = { lead: '<span class="chip lead">Lead</span>', pub: '<span class="chip pub">Publisher</span>' };
  const R = { always: '<span class="chip always">Always</span>', sample: '<span class="chip sample">Sample</span>' };
  const SERIAL = '<span class="chip serial">Serial release</span>';
  const TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = s => document.querySelector(s);
  const modEl = $("#mod"), routeEl = $("#route"), relEl = $("#rel");
  let store = {};
  const state = { view: "table", idx: {}, current: "overview" };

  /* ---------- storage ---------- */
  function key() { return "rise-moodle-checklist::" + (modEl.value.trim().toLowerCase() || "untitled"); }
  function load() { try { store = JSON.parse(localStorage.getItem(key()) || "{}"); } catch (e) { store = {}; } }
  function save() {
    try {
      localStorage.setItem(key(), JSON.stringify(store));
      localStorage.setItem("rise-moodle-checklist::last", JSON.stringify({ mod: modEl.value, route: routeEl.value, rel: relEl.value, view: state.view }));
    } catch (e) {}
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c])); }

  /* ---------- data helpers ---------- */
  SECTIONS.forEach(s => {
    if (s.kind !== "list") return;
    s.flat = [];
    s.groups.forEach((g, gi) => {
      if (!g.items) return;
      g.items.forEach((it, ii) => { it.id = s.id + "-" + gi + "-" + ii; it.group = g.title; it.section = s; s.flat.push(it); });
    });
  });
  function visible(it) {
    if (it.rel === "serial" && relEl.value !== "serial") return false;
    if (it.section.id === "audit" && routeEl.value === "re" && !it.r) return false;
    return true;
  }
  function visibleItems(s) { return s.flat.filter(visible); }

  /* ---------- pieces ---------- */
  function cropStyle(s, f, w, h) {
    const bw = w * f[2] / 100, bh = bw * s.ratio;
    const x = Math.min(0, Math.max(w - bw, w / 2 - f[0] * bw)), y = Math.min(0, Math.max(h - bh, h / 2 - f[1] * bh));
    return "background-image:url('" + s.src + "');background-size:" + bw.toFixed(0) + "px " + bh.toFixed(0) + "px;background-position:" + x.toFixed(0) + "px " + y.toFixed(0) + "px";
  }
  function shotCell(it) {
    if (it.shots && it.shots.length) return it.shots.map(k => {
      const s = SHOTS[k];
      const pic = it.focus ? '<i class="crop" style="' + cropStyle(s, it.focus, 138, 84) + '"></i>' : '<img src="' + s.src + '" alt="" loading="lazy">';
      return '<button type="button" class="thumb" data-shot="' + k + '" aria-label="Open screenshot: ' + esc(s.cap) + '">' + pic + "<span>" + esc(s.cap.split(":")[0]) + "</span></button>";
    }).join("");
    if (it.tbc && /screenshot/i.test(it.tbc)) return '<div class="noshot">Screenshot to follow</div>';
    return "";
  }
  function tickbox(id, extra) {
    return '<span class="tickbox"><input type="checkbox" data-key="' + id + '" ' + (extra || "") + '><span class="box">' + TICK + "</span></span>";
  }
  function palette() {
    return '<div class="swatches">' + PALETTE.map(p => '<span class="sw"><i style="background:' + p[0] + '"></i>' + p[1] + " " + p[0] + "</span>").join("") + '<span class="sw"><i style="background:#fff"></i>Supporting whites and greys</span></div>';
  }
  function detail(it) {
    return (it.note ? '<div class="note">' + esc(it.note) + "</div>" : "") +
      (it.tbc ? '<div class="note"><span class="chip tbc">To confirm</span>' + esc(it.tbc) + "</div>" : "") +
      (it.palette ? palette() : "");
  }
  function tags(it, showWho) { return (it.rel === "serial" ? SERIAL : "") + (showWho ? (WHO[it.who] || "") : "") + (R[it.r] || ""); }
  function rowHTML(it, num, showWho) {
    return '<tr data-id="' + it.id + '">' +
      '<td class="tick">' + tickbox(it.id, 'id="cb-' + it.id + '" aria-labelledby="' + it.id + '-t"') + "</td>" +
      (num ? '<td class="num">' + num + "</td>" : "") +
      '<td><div class="t" id="' + it.id + '-t">' + esc(it.t) + "</div>" + detail(it) + "</td>" +
      (showWho ? '<td class="tags">' + tags(it, true) + "</td>" : (it.rel ? '<td class="tags">' + tags(it, false) + "</td>" : '<td class="tags"></td>')) +
      '<td class="shot">' + shotCell(it) + "</td></tr>";
  }
  function plainTable(tb) {
    return '<div class="tablewrap"><table><thead><tr>' + tb.head.map(h => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
      tb.rows.map(r => "<tr>" + r.map((c, i) => "<td>" + (c === "To confirm" ? '<span class="chip tbc">To confirm</span>' : (i === 0 ? "<strong>" + esc(c) + "</strong>" : esc(c))) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
  }

  function overviewHTML() {
    return '<div class="routes">' +
      '<div class="route"><h3>New module (approved)</h3><p>Most of the audit is done by the programme lead (FE and Lab Manager) or the curriculum lead (HE) before approval. The publisher confirms those checks, sets the Rise course settings, and runs the technical checks.</p><div class="key">' + WHO.lead + "at approval " + WHO.pub + "publisher</div></div>" +
      '<div class="route re"><h3>Re-release</h3><p>No approval needed. Always set the Rise course settings, then sample through buttons, session views and quizzes, and give it a general sense check.</p><div class="key">' + R.always + "every release " + R.sample + "sampled</div></div>" +
      '<div class="route se"><h3>Serial (partial) release</h3><p>Not all sessions are ready. The last released session is a Next steps session with the release schedule and what learners do next. Later sessions are added by republishing the same Connected package.</p><div class="key">' + SERIAL + "extra checks</div></div></div>" +
      '<p class="callout"><strong>Lessons and sessions are the same thing.</strong> Rise calls them lessons; Tiro calls them sessions. This checklist uses sessions.</p>' +
      '<h2>Order of work</h2><div class="tablewrap"><table><thead><tr><th>#</th><th>Stage</th><th>What happens</th><th><span class="visually-hidden">Open</span></th></tr></thead><tbody>' +
      [["Pre-publish audit", "Check the module in Rise and set the course settings", "audit"], ["Publish from Rise", "Review 360, SCORM 2004 Connected package, Delivery folder", "publish"], ["Upload to Moodle", "Course space, SCORM activity settings, learner test", "moodle"], ["Release and follow-up", "Release emails and asset archive", "release"]]
        .map((r, i) => "<tr><td><strong>" + (i + 1) + "</strong></td><td><strong>" + r[0] + "</strong></td><td>" + r[1] + '</td><td><button type="button" class="btn ghost" data-goto="' + r[2] + '">Open <span class="arrow r" aria-hidden="true">&#8594;</span></button></td></tr>').join("") + "</tbody></table></div>" +
      '<h2>Key settings at a glance</h2><div class="tablewrap"><table><tbody>' +
      [["Rise access", "Nathalie: Manager. Dan Boyland: Editor"],
       ["Theme", "Apex · Tiro. Fonts Aptos Display (headings) and Aptos (body). Navigation Compact; learners cannot mark lessons complete"],
       ["SCORM export", "SCORM 2004 4th Edition, Connected package. Course completion 100%, reported as Passed/Incomplete"],
       ["Versions", "v0 at build, v1 once reviewed, duplicate for v2 and on. Publish to Review 360 every time and never rename a course already in Review 360"],
       ["Republishing", "Notify learners always On. Reset progress On if any quiz or knowledge check changed, after telling the leads and Student Services"],
       ["Package name and storage", "As exported by Rise (it lands in Downloads), then uploaded to Documents - Delivery › TIRO: HE › module resources, or the FE vertical"],
       ["Moodle display", "New window, width 100, height 800, scrolling on, preview off, drop-down structure"],
       ["Moodle activity name", "Digital Learning"],
       ["Release timing", "Release calendar. HE at least two weeks before module start"]]
        .map(r => '<tr><th scope="row">' + r[0] + "</th><td>" + r[1] + "</td></tr>").join("") + "</tbody></table></div>";
  }

  /* ---------- build ---------- */
  function build() {
    const tabs = $("#tabs"), panels = $("#panels");
    SECTIONS.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "tab"); b.id = "tab-" + s.id;
      b.setAttribute("aria-controls", "panel-" + s.id); b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.tabIndex = i === 0 ? 0 : -1;
      b.innerHTML = esc(s.tab) + (s.kind === "list" ? '<span class="count" data-count="' + s.id + '"></span>' : "");
      tabs.appendChild(b);
      const p = document.createElement("section");
      p.className = "panel"; p.id = "panel-" + s.id; p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", b.id); p.tabIndex = -1;
      if (i !== 0) p.hidden = true;
      let h = s.intro ? '<p class="intro">' + esc(s.intro) + "</p>" : "";
      if (s.kind === "info") h += overviewHTML();
      if (s.kind === "table") h += plainTable(s.table);
      if (s.kind === "list") {
        const showWho = s.id === "audit";
        let tv = "", fixed = "";
        s.groups.forEach((g, gi) => {
          if (g.table) { fixed += '<div class="group"><h2>' + esc(g.title) + "</h2>" + plainTable(g.table) + "</div>"; return; }
          tv += '<div class="group" data-g="' + gi + '"><h2>' + esc(g.title) + "</h2>" +
            '<div class="tablewrap"><table class="list"><thead><tr><th><span class="visually-hidden">Done</span></th>' + (s.steps ? "<th>#</th>" : "") +
            "<th>" + (s.steps ? "Step" : "Check") + "</th><th>" + (showWho ? "Who · route" : "") + "</th><th>Screenshot</th></tr></thead><tbody>" +
            g.items.map((it, ii) => rowHTML(it, s.steps ? (s.restartNumbers ? ii + 1 : s.flat.indexOf(it) + 1) : 0, showWho)).join("") + "</tbody></table></div></div>";
        });
        h += fixed + '<div class="tableview">' + tv + '</div><div class="stepview" aria-live="polite"><div class="carousel" id="car-' + s.id + '"></div></div>';
        state.idx[s.id] = 0;
      }
      p.innerHTML = h;
      panels.appendChild(p);
    });

    tabs.addEventListener("click", e => { const b = e.target.closest("[role=tab]"); if (b) select(b, true); });
    tabs.addEventListener("keydown", e => {
      const all = [...tabs.querySelectorAll("[role=tab]")], i = all.indexOf(document.activeElement);
      if (i < 0 || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      e.preventDefault(); e.stopPropagation();
      const n = all[(i + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length]; select(n, true); n.focus();
    });
    panels.addEventListener("change", e => {
      const k = e.target.dataset && e.target.dataset.key;
      if (!k) return;
      store[k] = e.target.checked; save();
      paint(k);
    });
    document.addEventListener("click", e => {
      const t = e.target.closest("[data-shot]"); if (t) { openViewer(t.dataset.shot); return; }
      const g = e.target.closest("[data-goto]"); if (g) { const tb = document.getElementById("tab-" + g.dataset.goto); select(tb, true); tb.focus(); return; }
      const nav = e.target.closest("[data-nav]"); if (nav) { navigate(nav.dataset.nav); return; }
      const seg = e.target.closest("[data-jump]"); if (seg) { jump(+seg.dataset.jump); return; }
    });
  }

  /* ---------- tabs ---------- */
  function moveInk() {
    const sel = document.querySelector('[role=tab][aria-selected="true"]'), ink = $(".tab-ink");
    if (!sel || !ink) return;
    ink.style.width = sel.offsetWidth + "px";
    ink.style.transform = "translateX(" + sel.offsetLeft + "px)";
  }
  function select(b, animate) {
    document.querySelectorAll("[role=tab]").forEach(t => {
      const on = t === b; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
      const p = document.getElementById(t.getAttribute("aria-controls"));
      p.hidden = !on;
      if (on && animate && !reduceMotion) { p.classList.remove("enter"); void p.offsetWidth; p.classList.add("enter"); }
    });
    state.current = b.id.replace("tab-", "");
    moveInk();
    b.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    if (state.view === "steps") renderCard(state.current, 0);
  }

  /* ---------- view toggle ---------- */
  function movePill() {
    const on = document.querySelector(".seg button[aria-pressed=true]"), pill = $(".seg .pill");
    pill.style.width = on.offsetWidth + "px";
    pill.style.transform = "translateX(" + (on.offsetLeft - 3) + "px)";
  }
  function setView(v) {
    state.view = v;
    document.body.classList.toggle("view-steps", v === "steps");
    document.querySelectorAll(".seg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === v));
    movePill(); save();
    if (v === "steps") SECTIONS.forEach(s => { if (s.kind === "list") renderCard(s.id, 0); });
  }
  document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));

  /* ---------- carousel ---------- */
  function renderCard(sid, dir) {
    const s = SECTIONS.find(x => x.id === sid); if (!s || s.kind !== "list") return;
    const car = document.getElementById("car-" + sid); if (!car) return;
    const items = visibleItems(s);
    if (!items.length) { car.innerHTML = '<div class="empty">Nothing to check here for this route.</div>'; return; }
    let i = Math.min(Math.max(state.idx[sid] || 0, 0), items.length);
    state.idx[sid] = i;
    const segs = '<div class="segbar" aria-label="Steps">' + items.map((it, n) => '<button type="button" data-jump="' + n + '" class="' + (store[it.id] ? "done" : "") + (n === i ? " cur" : "") + '" aria-label="Step ' + (n + 1) + ": " + esc(it.t) + (store[it.id] ? " (done)" : "") + '"' + (n === i ? ' aria-current="step"' : "") + "></button>").join("") + "</div>";
    const anim = reduceMotion || !dir ? "" : (dir > 0 ? " in-r" : " in-l");
    if (i === items.length) {
      const left = items.filter(it => !store[it.id]).length;
      const nextTab = nextSectionAfter(sid);
      car.innerHTML = '<div class="card' + anim + '"><div class="finish">' +
        (left ? '<div class="big" style="color:var(--accent-ink)">' + left + " of " + items.length + " still to tick</div><p>Use the bar below to jump back to anything you skipped.</p>" : '<div class="big">All ' + items.length + " ticked</div><p>This stage is complete.</p>") +
        '<div class="actions" style="justify-content:center"><button type="button" class="btn ghost" data-nav="prev"><span class="arrow l" aria-hidden="true">&#8592;</span> Back</button>' +
        (nextTab ? '<button type="button" class="btn" data-goto="' + nextTab.id + '">Go to ' + esc(nextTab.tab) + ' <span class="arrow r" aria-hidden="true">&#8594;</span></button>' : "") + "</div></div></div>" + segs;
      return;
    }
    const it = items[i], shot = it.shots && it.shots[0] ? SHOTS[it.shots[0]] : null;
    car.innerHTML = '<div class="card' + anim + '">' +
      '<div class="card-meta"><span><strong>' + (s.steps ? "Step " : "Check ") + (i + 1) + " of " + items.length + "</strong> · " + esc(it.group.replace(/^\d+\.\s*/, "")) + "</span><span>" + tags(it, sid === "audit") + "</span></div>" +
      '<div class="card-body' + (shot ? "" : " noimg") + '"><div>' + '<div class="card-num" aria-hidden="true">' + String(i + 1).padStart(2, "0") + "</div>" +
      "<h3>" + esc(it.t) + "</h3>" + detail(it) + "</div>" +
      (shot ? '<figure class="card-shot"><button type="button" data-shot="' + it.shots[0] + '" aria-label="Open screenshot full size: ' + esc(shot.cap) + '"><img src="' + shot.src + '" alt="' + esc(shot.cap) + '"></button><figcaption>' + esc(shot.cap) + ' <span class="zoomhint">Select to zoom</span></figcaption></figure>' : "") +
      "</div>" +
      '<div class="card-foot"><label class="done-label">' + tickbox(it.id, 'id="cc-' + it.id + '"') + "Done</label><span class=\"spacer\"></span>" +
      '<div class="navbtns actions"><button type="button" class="btn ghost" data-nav="prev"' + (i === 0 ? " disabled" : "") + '><span class="arrow l" aria-hidden="true">&#8592;</span> Back</button>' +
      '<button type="button" class="btn" data-nav="next">' + (store[it.id] ? "Next" : "Tick and next") + ' <span class="arrow r" aria-hidden="true">&#8594;</span></button></div></div></div>' + segs;
    const cb = car.querySelector('input[data-key]'); cb.checked = !!store[it.id];
    attachSwipe(car.querySelector(".card"));
  }
  function nextSectionAfter(sid) {
    const order = SECTIONS.filter(s => s.kind === "list"); const i = order.findIndex(s => s.id === sid);
    return order[i + 1] || null;
  }
  function navigate(d) {
    const sid = state.current, s = SECTIONS.find(x => x.id === sid); if (!s || s.kind !== "list") return;
    const items = visibleItems(s), i = state.idx[sid] || 0;
    if (d === "next") {
      if (i < items.length && !store[items[i].id]) { store[items[i].id] = true; save(); paint(items[i].id, true); }
      state.idx[sid] = Math.min(i + 1, items.length); renderCard(sid, 1);
    } else { state.idx[sid] = Math.max(i - 1, 0); renderCard(sid, -1); }
    focusCard();
  }
  function jump(n) { const sid = state.current, dir = n >= (state.idx[sid] || 0) ? 1 : -1; state.idx[sid] = n; renderCard(sid, dir); focusCard(); }
  function focusCard() { const h = document.querySelector("#car-" + state.current + " h3, #car-" + state.current + " .big"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  function attachSwipe(card) {
    if (!card) return; let x0 = null;
    card.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") x0 = e.clientX; });
    card.addEventListener("pointerup", e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) navigate(dx < 0 ? "next" : "prev"); });
  }
  document.addEventListener("keydown", e => {
    if (state.view !== "steps" || !$("#viewer").hidden) return;
    const t = e.target; if (t.closest && (t.closest("[role=tab]") || t.matches("input[type=text], select, textarea"))) return;
    if (e.key === "ArrowRight") { e.preventDefault(); navigate("next"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); navigate("prev"); }
  });

  /* ---------- paint ---------- */
  let lastDone = -1;
  function paint(changedKey, fromNav) {
    let total = 0, done = 0;
    SECTIONS.forEach(s => {
      if (s.kind !== "list") return;
      let st = 0, sd = 0;
      s.flat.forEach(it => {
        const tr = document.querySelector('tr[data-id="' + it.id + '"]'), on = !!store[it.id], show = visible(it);
        if (tr) {
          tr.querySelector("input").checked = on; tr.classList.toggle("done", on); tr.hidden = !show;
          
        }
        if (show) { st++; total++; if (on) { sd++; done++; } }
      });
      document.querySelectorAll("#panel-" + s.id + " .tableview .group").forEach(g => { g.hidden = ![...g.querySelectorAll("tr[data-id]")].some(tr => !tr.hidden); });
      const c = document.querySelector('[data-count="' + s.id + '"]');
      if (c) { c.textContent = sd + "/" + st; c.classList.toggle("full", st > 0 && sd === st); }
    });
    const pt = $("#progtext"); pt.textContent = done + " of " + total + " ticked";
    if (lastDone >= 0 && done !== lastDone && !reduceMotion) { pt.classList.remove("bump"); void pt.offsetWidth; pt.classList.add("bump"); }
    lastDone = done;
    $("#meter").style.width = total ? (done / total * 100) + "%" : "0";
    if (state.view === "steps" && !fromNav) {
      const car = document.getElementById("car-" + state.current);
      if (car) {
        const s = SECTIONS.find(x => x.id === state.current), items = visibleItems(s);
        car.querySelectorAll(".segbar button").forEach((b, n) => b.classList.toggle("done", !!(items[n] && store[items[n].id])));
        const nb = car.querySelector('[data-nav="next"]'), it = items[state.idx[state.current]];
        if (nb && it) nb.firstChild.textContent = store[it.id] ? "Next " : "Tick and next ";
      }
    }
  }
  function refilter() { SECTIONS.forEach(s => { if (s.kind === "list") state.idx[s.id] = 0; }); paint(); if (state.view === "steps") SECTIONS.forEach(s => { if (s.kind === "list") renderCard(s.id, 0); }); save(); }

  function toast(m) { const t = $("#toast"); t.classList.remove("has-action"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800); }
  function toastAction(m, label, fn) {
    const t = $("#toast"); clearTimeout(toast.t);
    t.innerHTML = "<span></span>"; t.firstChild.textContent = m;
    const a = document.createElement("button"); a.type = "button"; a.className = "btn"; a.textContent = label;
    const x = document.createElement("button"); x.type = "button"; x.className = "btn"; x.textContent = "Dismiss";
    const close = () => { t.classList.remove("show", "has-action"); };
    a.onclick = () => { fn(); close(); }; x.onclick = close;
    t.append(a, x); t.classList.add("show", "has-action"); a.focus();
  }

  $("#copy").addEventListener("click", () => {
    const lines = ["Outstanding items: " + (modEl.value.trim() || "untitled module") + " (" + routeEl.options[routeEl.selectedIndex].text + ", " + relEl.options[relEl.selectedIndex].text + ")"];
    SECTIONS.forEach(s => { if (s.kind !== "list") return; const open = visibleItems(s).filter(it => !store[it.id]); if (open.length) { lines.push("", s.tab); open.forEach(it => lines.push("- " + it.t)); } });
    let box = document.getElementById("outbox");
    if (!box) {
      box = document.createElement("div"); box.className = "outbox"; box.id = "outbox";
      box.innerHTML = '<label for="outtext" class="field">Outstanding items (copy into an email or tracker)</label><textarea id="outtext" readonly></textarea><div class="actions" style="margin-top:8px"><button type="button" class="btn" id="cp">Copy</button><button type="button" class="btn ghost" id="cl">Close</button></div>';
      document.querySelector(".bar .wrap").appendChild(box);
      document.getElementById("cl").onclick = () => box.remove();
      document.getElementById("cp").onclick = () => {
        const v = document.getElementById("outtext").value;
        (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast("Copied"), () => { document.getElementById("outtext").select(); toast("Select the text and copy it"); });
      };
    }
    document.getElementById("outtext").value = lines.join("\n");
  });
  $("#reset").addEventListener("click", () => {
    const prev = store, n = Object.values(prev).filter(Boolean).length; if (!n) { toast("Nothing to clear"); return; }
    store = {}; save(); paint(); if (state.view === "steps") renderCard(state.current, 0);
    toastAction(n + " ticks cleared for this module.", "Undo", () => { store = prev; save(); paint(); if (state.view === "steps") renderCard(state.current, 0); toast("Ticks restored"); });
  });
  const modSel = $("#modsel"), OTHER = "__other";
  (typeof MODULES !== "undefined" ? MODULES : []).forEach(m => { const o = document.createElement("option"); o.value = m; o.textContent = m; modSel.appendChild(o); });
  { const o = document.createElement("option"); o.value = OTHER; o.textContent = "Other (type it in)"; modSel.appendChild(o); }
  function syncModSel() {
    const v = modEl.value.trim();
    if (!v) { modSel.value = ""; modEl.hidden = true; }
    else if ([...modSel.options].some(o => o.value === v)) { modSel.value = v; modEl.hidden = true; }
    else { modSel.value = OTHER; modEl.hidden = false; }
  }
  modSel.addEventListener("change", () => {
    if (modSel.value === OTHER) { modEl.hidden = false; modEl.value = ""; modEl.focus(); }
    else { modEl.hidden = true; modEl.value = modSel.value; }
    load(); refilter();
  });
  modEl.addEventListener("change", () => { load(); refilter(); });
  routeEl.addEventListener("change", refilter);
  relEl.addEventListener("change", refilter);
  function setBarH() { const b = $(".bar"); document.documentElement.style.setProperty("--bar-h", getComputedStyle(b).position === "sticky" ? b.offsetHeight + "px" : "0px"); }
  window.addEventListener("resize", () => { moveInk(); movePill(); setBarH(); if (!$("#viewer").hidden) fit(); });

  /* ---------- screenshot viewer ---------- */
  const viewer = $("#viewer"), stage = $("#stage"), vimg = $("#vimg");
  const order = Object.keys(SHOTS);
  let cur = 0, scale = 1, tx = 0, ty = 0, fitScale = 1, lastFocus = null;
  function apply(smooth) {
    vimg.classList.toggle("smooth", !!smooth && !reduceMotion);
    vimg.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
    $("#vlvl").textContent = Math.round(scale * 100) + "%";
  }
  function fit(smooth) {
    const sw = stage.clientWidth, sh = stage.clientHeight, iw = vimg.naturalWidth || 1, ih = vimg.naturalHeight || 1;
    fitScale = Math.min((sw - 32) / iw, (sh - 32) / ih, 1); scale = fitScale;
    tx = (sw - iw * scale) / 2; ty = Math.max(16, (sh - ih * scale) / 2); apply(smooth);
  }
  function zoomAt(f, cx, cy, smooth) {
    const ns = Math.min(Math.max(scale * f, fitScale * 0.5, 0.1), 6);
    if (cx === undefined) { cx = stage.clientWidth / 2; cy = stage.clientHeight / 2; }
    tx = cx - (cx - tx) * (ns / scale); ty = cy - (cy - ty) * (ns / scale); scale = ns; apply(smooth);
  }
  function show(k) {
    cur = order.indexOf(k); const s = SHOTS[k];
    $("#vcap").textContent = s.cap + "  (" + (cur + 1) + " of " + order.length + ")";
    vimg.alt = s.cap; vimg.onload = () => fit(); vimg.src = s.src; if (vimg.complete && vimg.naturalWidth) fit();
    $("#vprev").disabled = $("#vnext").disabled = order.length < 2;
  }
  function openViewer(k) { lastFocus = document.activeElement; viewer.hidden = false; viewer.classList.remove("open"); void viewer.offsetWidth; viewer.classList.add("open"); document.body.style.overflow = "hidden"; show(k); $("#vclose").focus(); }
  function closeViewer() { viewer.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  function step(d) { show(order[(cur + d + order.length) % order.length]); }
  $("#vclose").onclick = closeViewer;
  $("#vin").onclick = () => zoomAt(1.25, undefined, undefined, true);
  $("#vout").onclick = () => zoomAt(0.8, undefined, undefined, true);
  $("#vfit").onclick = () => fit(true);
  $("#v100").onclick = () => zoomAt(1 / scale, undefined, undefined, true);
  $("#vprev").onclick = () => step(-1); $("#vnext").onclick = () => step(1);
  stage.addEventListener("wheel", e => { e.preventDefault(); const r = stage.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  const pts = new Map(); let pinch0 = 0, drag = null;
  stage.addEventListener("pointerdown", e => {
    stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { drag = { x: e.clientX - tx, y: e.clientY - ty }; stage.classList.add("dragging"); }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  stage.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = stage.getBoundingClientRect(); if (pinch0) zoomAt(d / pinch0, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); pinch0 = d; return; }
    if (drag) { tx = e.clientX - drag.x; ty = e.clientY - drag.y; apply(); }
  });
  function endPt(e) { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (!pts.size) { drag = null; stage.classList.remove("dragging"); } else { const p = [...pts.values()][0]; drag = { x: p.x - tx, y: p.y - ty }; } }
  stage.addEventListener("pointerup", endPt); stage.addEventListener("pointercancel", endPt);
  stage.addEventListener("dblclick", e => { const r = stage.getBoundingClientRect(); if (scale > fitScale * 1.05) fit(true); else zoomAt(2, e.clientX - r.left, e.clientY - r.top, true); });
  document.addEventListener("keydown", e => {
    if (viewer.hidden) return;
    if (e.key === "Escape") closeViewer();
    else if (e.key === "+" || e.key === "=") zoomAt(1.25, undefined, undefined, true);
    else if (e.key === "-") zoomAt(0.8, undefined, undefined, true);
    else if (e.key === "0") fit(true);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Tab") {
      const f = [...viewer.querySelectorAll("button:not([disabled])")], i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- start ---------- */
  let last = null;
  try { last = JSON.parse(localStorage.getItem("rise-moodle-checklist::last") || "null"); } catch (e) {}
  if (last) { modEl.value = last.mod || ""; routeEl.value = last.route || "new"; relEl.value = last.rel || "full"; }
  syncModSel();
  build(); load(); paint(); setBarH();
  const startView = last && last.view === "steps" ? "steps" : "table";
  requestAnimationFrame(() => { moveInk(); setView(startView); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { moveInk(); movePill(); });
})();
