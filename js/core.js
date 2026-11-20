/* HESI EXIT COMMAND CENTER — core: utilities, state, persistence, routing, shell. */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DAY = 86400000;
const todayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const dayStart = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const shuffle = (a, rnd = Math.random) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const pct = (n, d) => d ? Math.round(100 * n / d) : null;
const uniq = a => Array.from(new Set(a));
const slug = s => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const fmtTime = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };

/* ---------- Icons ---------- */
const IC = {
 home:'<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M8 7h7"/>',
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 steth:'<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M11 14v2a5 5 0 0 0 10 0v-2"/><circle cx="21" cy="12" r="2"/>',
 brain:'<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 3 5 3 3 0 0 0 5 1V5a3 3 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-3 5 3 3 0 0 1-5 1"/>',
 flag:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
 pulse:'<path d="M3 12h4l2-5 4 10 2-5h6"/>',
 flask:'<path d="M9 3h6"/><path d="M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-10V3"/><path d="M7 15h10"/>',
 pill:'<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="m9 8 6 9"/>',
 split:'<path d="M12 3v18"/><rect x="3" y="6" width="6" height="12" rx="1.5"/><rect x="15" y="6" width="6" height="12" rx="1.5"/>',
 quiz:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 hand:'<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6"/><path d="M11 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6H10a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.3-2L8 14"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
 moon:'<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
 more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
 check:'<path d="m5 12 5 5 9-10"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
 up:'<path d="m6 15 6-6 6 6"/>', down:'<path d="m6 9 6 6 6-6"/>', left:'<path d="m15 6-6 6 6 6"/>', right:'<path d="m9 6 6 6-6 6"/>',
 play:'<path d="M7 4v16l13-8z"/>'
};
Object.assign(IC, {
 alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17.5v.5"/>',
 hand:'<path d="M7 11V6a1.5 1.5 0 0 1 3 0v5"/><path d="M10 10V4.5a1.5 1.5 0 0 1 3 0V10"/><path d="M13 10V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.5L7 14"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><path d="M12 17.5v.5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'
});
/* ---------- Study-design helpers: labels, memory boxes, strategic bolding ---------- */
const LABS_UI = {
 prio: ["Priority action", "target"], assess: ["Assess first", "steth"], report: ["Report immediately", "alert"],
 hold: ["Hold / clarify medication", "hand"], expected: ["Expected finding", "eye"], unexpected: ["Unexpected finding", "alert"],
 teach: ["Patient teaching", "chat"], trap: ["Common exam trap", "flag"], mem: ["Remember this", "brain"], why: ["Understand why", "info"],
 must: ["Must remember", "bolt"], define: ["What it is", "book"]
};
const labTag = (k, text) => { const [t, ic] = LABS_UI[k] || [k, "info"]; return `<span class="lab ${k}">${icon(ic, 15, 2.2)}${esc(text || t)}</span>`; };
const memBox = (body, title = "Remember this") => `<div class="mem" role="note"><div class="mh">${icon("brain", 18, 2)}${esc(title)}</div><div class="mt">${body}</div></div>`;
const EMPH_UNIT = String.raw`(?:mg\/dL|g\/dL|mEq\/L|mmol\/L|mL\/kg\/hr|mL\/hr|mL\/min|ng\/mL|mcg\/mL|U\/L|\/mm³|mm\s?Hg|mmHg|bpm|breaths\/min|\/min|°F|°C|%|mcg|mg|mL|kg|lb|units?|hours?|hrs?|minutes?|mins?|seconds?|days?|weeks?|cm|L)`;
const EMPH_NUM = String.raw`\d+(?:[.,]\d+)*(?:\s?(?:–|-|to)\s?\d+(?:[.,]\d+)*)?`;
const EMPH_RE = new RegExp([
  String.raw`(?:[<>≤≥]\s?|\b(?:above|below|over|under|less than|greater than|more than|at least|up to|exceeds?)\s)` + EMPH_NUM + String.raw`(?:\s?` + EMPH_UNIT + `)?`,
  EMPH_NUM + String.raw`\s?(?:mg\/dL|g\/dL|mEq\/L|mmol\/L|mL\/kg\/hr|mL\/hr|ng\/mL|mcg\/mL|U\/L|\/mm³|mm\s?Hg|bpm|breaths\/min|\/min|°F|°C)`,
  String.raw`\b(?:[Hh]old|[Nn]ever|[Dd]o not|[Dd]on't|[Aa]void|[Ss]top|[Rr]eport|[Nn]otify|[Ii]mmediately|[Ee]mergency|STAT|[Cc]ontraindicated)\b`
].join("|"), "g");
const STEM_RE = new RegExp([
  String.raw`\b(?:first|priority|highest priority|most important|initial|immediately|immediate|best|most appropriate|most concerning|requires? (?:immediate )?follow-up|report(?:ed)? (?:immediately|first)|NOT|EXCEPT|except|avoid|select all that apply)\b`,
  String.raw`\b(?:HR|BP|RR|SpO₂|SpO2|T|K⁺|K\+|Na⁺|INR|aPTT|pulse|apical pulse|temperature|glucose|platelets?|hemoglobin|Hgb|potassium|sodium|magnesium|pH|PaCO₂|PaCO2|HCO₃|ANC|creatinine|lithium level|digoxin level)\b(?:\s(?:of|is|was|at))?\s?` + EMPH_NUM + String.raw`(?:\/\d+)?(?:\s?` + EMPH_UNIT + `)?`,
  EMPH_NUM + String.raw`\s?(?:mg\/dL|g\/dL|mEq\/L|mmol\/L|mL\/hr|ng\/mL|\/mm³|mm\s?Hg|bpm|\/min|°F|°C)`
].join("|"), "g");
function boldBy(re, s) { s = String(s ?? ""); let out = "", last = 0; s.replace(re, (m, ...a) => { const off = a[a.length - 2]; if (!m.trim()) return m; out += esc(s.slice(last, off)) + "<b>" + esc(m) + "</b>"; last = off + m.length; return m; }); return out + esc(s.slice(last)); }
const emph = s => boldBy(EMPH_RE, s);
const emphStem = s => boldBy(STEM_RE, s);
const icon = (n, s = 18, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;

/* ---------- Content index ---------- */
const DATA = {};
(function buildIndex() {
  const Q = {}, pool = [];
  const add = (q, extra) => { const o = Object.assign({}, q, extra || {}); Q[o.id] = o; return o; };
  (window.BANK.items || []).forEach(q => pool.push(add(q)));
  (window.LEAD_QS || []).forEach(q => pool.push(add(q, { src: q.src, pg: q.pg })));
  (window.SRC_QS || []).forEach(q => pool.push(add(q, { src: q.src, pg: q.pg })));
  const cases = (window.BANK.cases || []).map(c => {
    const items = c.items.map(it => add(it, { subj: c.subj, topic: (it.topic || c.title), caseId: c.case, src: c.src, pg: c.pg }));
    return Object.assign({}, c, { items });
  });
  DATA.Q = Q; DATA.pool = pool; DATA.cases = cases;
  DATA.caseItems = cases.flatMap(c => c.items);
  DATA.sysOf = subj => (window.SYSTEMS.find(s => s.subj.includes(subj)) || { id: "fund" }).id;
  DATA.sysName = id => (window.SYSTEMS.find(s => s.id === id) || {}).name || id;
  DATA.lessonForQ = id => window.LESSONS.find(l => (l.qs || []).includes(id));
  DATA.lesson = id => window.LESSONS.find(l => l.id === id);
  DATA.card = id => window.CARDS.find(c => c.id === id);
  DATA.cmp = id => window.COMPARE.find(c => c.id === id);
  DATA.med = n => window.MEDS.find(m => m.g === n || slug(m.g) === n);
  DATA.lab = n => window.LABS.find(l => l.n === n || slug(l.n) === n);
})();

/* ---------- State ---------- */
const KEY = "hcc.v1";
const DEFAULT = () => ({ v: 1, created: Date.now(), updatedAt: 0,
  settings: { theme: "auto", scale: 1, motion: "auto", minutes: 45, examDate: "2026-12-19" },
  att: [], items: {}, cards: {}, lessons: {}, journal: [], mocks: [], session: null, days: {}, bm: [], sims: {}, tb: {}, mission: { date: "", done: [] }, lastView: "dashboard" });
let S = DEFAULT();
function loadLocal() { try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(DEFAULT(), JSON.parse(raw)); } catch (e) { /* storage unavailable */ } }
let saveT = null, syncT = null;
function save(soft) {
  S.updatedAt = Date.now();
  clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }, 200);
  if (!soft) scheduleSync();
}
const SYNC = { db: null, uid: null, status: "local", busy: false, pending: false };
function setSync(st) { SYNC.status = st; const el = $("#syncState"); if (el) { el.className = "sync " + (st === "ok" ? "ok" : "local"); el.lastChild.textContent = st === "ok" ? " Progress saved to your account" : st === "saving" ? " Saving…" : " Progress saved on this device"; } }
function compactForSync() {
  const c = JSON.parse(JSON.stringify(S));
  let s = JSON.stringify(c);
  while (s.length > 230000 && c.att.length > 200) { c.att = c.att.slice(Math.floor(c.att.length * 0.2)); s = JSON.stringify(c); }
  return c;
}
function scheduleSync() { if (!SYNC.db || !SYNC.uid) return; clearTimeout(syncT); syncT = setTimeout(pushSync, 2500); }
async function pushSync() {
  if (!SYNC.db || !SYNC.uid) return;
  if (SYNC.busy) { SYNC.pending = true; return; }
  SYNC.busy = true; setSync("saving");
  try { await SYNC.db.doc("data/users/" + SYNC.uid + "/progress").set({ json: JSON.stringify(compactForSync()), updatedAt: S.updatedAt }); setSync("ok"); }
  catch (e) { setSync("local"); }
  SYNC.busy = false;
  if (SYNC.pending) { SYNC.pending = false; pushSync(); }
}
async function initSync() {
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!db || !user) return;
    const uid = await user.id(); if (!uid) return;
    SYNC.db = db; SYNC.uid = uid;
    const snap = await Promise.race([db.doc("data/users/" + uid + "/progress").get(), new Promise((_, rej) => setTimeout(() => rej("timeout"), 10000))]);
    if (snap && snap.exists) {
      const d = snap.data();
      if (d && d.updatedAt > (S.updatedAt || 0)) { try { S = Object.assign(DEFAULT(), JSON.parse(d.json)); localStorage.setItem(KEY, JSON.stringify(S)); applySettings(); render(); toast("Loaded your saved progress"); } catch (e) {} }
      setSync("ok");
      if (d && d.updatedAt < S.updatedAt) pushSync();
    } else if (S.updatedAt) { pushSync(); } else setSync("ok");
  } catch (e) { setSync("local"); }
}

/* ---------- Learning records ---------- */
const BOX_DAYS = [0, 1, 3, 7, 14, 28];
function dayRec() { const k = todayKey(); S.days[k] = S.days[k] || { q: 0, ok: 0, acts: 0, ms: 0 }; return S.days[k]; }
function recordAttempt(qid, score, mode, ms, conf, resp) {
  const now = Date.now(), ok = score >= 0.999;
  S.att.push([qid, Math.round(score * 100) / 100, now, mode, ms || 0, conf == null ? null : conf]);
  if (S.att.length > 6000) S.att = S.att.slice(-5000);
  const it = S.items[qid] || (S.items[qid] = { n: 0, c: 0, first: now, last: 0, box: 0, due: 0, streak: 0 });
  it.n++; if (ok) it.c++;
  const daysSince = it.last ? (now - it.last) / DAY : 0;
  if (ok) { if (conf !== 0) it.box = Math.min(5, it.box + 1); it.streak++; if (daysSince >= 1) it.spaced = (it.spaced || 0) + 1; }
  else { it.box = 1; it.streak = 0; }
  it.last = now; it.due = dayStart() + BOX_DAYS[it.box] * DAY;
  const d = dayRec(); d.q++; if (ok) d.ok++; d.ms += ms || 0;
  if (!ok && mode !== "e") addJournal(qid, resp);
  save();
}
function addJournal(qid, resp) {
  const ex = S.journal.find(j => j.qid === qid && !j.resolved);
  const due = dayStart() + DAY;
  if (ex) { ex.ts = Date.now(); ex.due = due; ex.n = (ex.n || 1) + 1; ex.resp = resp; }
  else S.journal.unshift({ qid, ts: Date.now(), due, reason: null, resolved: false, n: 1, resp });
}
function resolveJournalIfCorrect(qid) { const j = S.journal.find(x => x.qid === qid && !x.resolved); if (j) { j.resolved = true; j.resolvedAt = Date.now(); } }
function itemStats(filterFn) {
  let n = 0, c = 0, sum = 0; const ids = new Set();
  for (const a of S.att) { const q = DATA.Q[a[0]]; if (!q || (filterFn && !filterFn(q, a))) continue; n++; sum += a[1]; if (a[1] >= 0.999) c++; ids.add(a[0]); }
  return { n, c, acc: n ? Math.round(100 * sum / n) : null, distinct: ids.size };
}
function masteryFor(filterFn) {
  const st = itemStats(filterFn);
  if (!st.n) return { label: "Not started", cls: "", st };
  const recent = S.att.filter(a => { const q = DATA.Q[a[0]]; return q && (!filterFn || filterFn(q, a)); }).slice(-12);
  const racc = Math.round(100 * recent.reduce((s, a) => s + a[1], 0) / recent.length);
  const dueOverdue = Object.entries(S.items).some(([id, it]) => { const q = DATA.Q[id]; return q && (!filterFn || filterFn(q)) && it.due && it.due < dayStart() && it.box <= 2; });
  const asks = new Set(S.att.filter(a => { const q = DATA.Q[a[0]]; return q && (!filterFn || filterFn(q)) && a[1] >= .999; }).map(a => DATA.Q[a[0]].ask || DATA.Q[a[0]].fmt));
  const spaced = Object.entries(S.items).filter(([id, it]) => { const q = DATA.Q[id]; return q && (!filterFn || filterFn(q)) && (it.spaced || 0) >= 1; }).length;
  if (st.n >= 5 && racc < 60) return { label: "Needs review", cls: "bad", st, racc };
  if (st.distinct >= 10 && racc >= 80 && asks.size >= 2 && spaced >= 3) return { label: "Demonstrated mastery", cls: "ok", st, racc };
  if (dueOverdue) return { label: "Needs review", cls: "warn", st, racc };
  if (st.n < 5) return { label: "Learning", cls: "teal", st, racc };
  return { label: "Improving", cls: "teal", st, racc };
}
const dueItems = () => Object.entries(S.items).filter(([id, it]) => DATA.Q[id] && it.due && it.due <= dayStart() + DAY - 1 && it.box < 5).map(([id]) => id);
const dueCards = () => window.CARDS.filter(c => { const r = S.cards[c.id]; return r && r.due <= Date.now(); });
function streak() {
  let s = 0, d = new Date();
  if (!S.days[todayKey(d)] || !(S.days[todayKey(d)].q || S.days[todayKey(d)].acts)) d = new Date(Date.now() - DAY);
  while (true) { const r = S.days[todayKey(d)]; if (r && (r.q || r.acts)) { s++; d = new Date(d.getTime() - DAY); } else break; }
  return s;
}
function logActivity() { const d = dayRec(); d.acts++; save(); }
function examDate() { const [y, m, dd] = (S.settings.examDate || "2026-12-19").split("-").map(Number); return new Date(y, m - 1, dd, 8, 0, 0); }
function daysLeft() { return Math.max(0, Math.ceil((dayStart(examDate()) - dayStart()) / DAY)); }
const isBm = k => S.bm.includes(k);
function toggleBm(k) { if (isBm(k)) S.bm = S.bm.filter(x => x !== k); else S.bm.push(k); save(); toast(isBm(k) ? "Saved for later" : "Removed from saved"); }
const bmBtn = (k) => `<button class="btn sm ghost" data-a="bm" data-x="${esc(k)}" aria-pressed="${isBm(k)}">${icon("star", 16)} ${isBm(k) ? "Saved" : "Save"}</button>`;

/* ---------- Shell: nav, router, modals ---------- */
const NAV = [
 { g: "Today", items: [["dashboard", "Dashboard", "home"]] },
 { g: "Learn", items: [["systems", "Nursing Systems", "book"], ["rapid", "Rapid Review", "bolt"], ["compare", "Disease Comparisons", "split"], ["meds", "Medication Mastery", "pill"], ["labs", "Laboratory Values", "flask"], ["vitals", "Vital Signs", "pulse"], ["skills", "Skills & Procedures", "hand"], ["teaching", "Patient Teaching", "chat"]] },
 { g: "Practice", items: [["sim", "Clinical Judgment Simulator", "brain"], ["priorities", "Nursing Priorities", "flag"], ["assess", "Patient Assessment Lab", "steth"], ["bank", "HESI Question Bank", "quiz"]] },
 { g: "Test and track", items: [["mock", "Mock Exit Exams", "clock"], ["analytics", "Learning Analytics", "chart"]] }
];
const ROUTES = {}; // name -> render fn (registered in views)
const UI = {}; // per-view transient UI state
let route = "dashboard", routeArg = null;
function navTo(r, arg) { const h = arg ? r + "-" + arg : r; if (location.hash.slice(1) !== h) location.hash = h; else { parseHash(); render(); } }
function parseHash() {
  const h = (location.hash || "").slice(1);
  if (!h) { route = "dashboard"; routeArg = null; return; }
  const name = Object.keys(ROUTES).sort((a, b) => b.length - a.length).find(k => h === k || h.startsWith(k + "-"));
  route = name || "dashboard"; routeArg = name && h.length > name.length ? h.slice(name.length + 1) : null;
}
function renderNav() {
  const cur = route;
  $("#rail").innerHTML = `<div class="brand"><div class="brand-mark">${icon("pulse", 22, 2.4).replace('stroke="currentColor"', 'stroke="#fff"')}</div><div><div class="brand-name">HESI Exit<br>Command Center</div><div class="brand-sub">LVN · Exit exam ${esc(examDate().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }))}</div></div></div>` +
    NAV.map(g => `<div class="navgroup"><div class="navlabel">${g.g}</div>${g.items.map(([r, l, i]) => `<button class="navbtn" data-a="nav" data-x="${r}" ${cur === r ? 'aria-current="page"' : ""}>${icon(i)}<span>${l}</span></button>`).join("")}</div>`).join("") +
    `<div class="rail-foot"><div class="sync ${SYNC.status === "ok" ? "ok" : "local"}" id="syncState"><i></i> ${SYNC.status === "ok" ? "Progress saved to your account" : "Progress saved on this device"}</div><div class="tiny" style="color:var(--nav-dim)">Educational tool only — not for real patient care decisions.</div></div>`;
  const mob = [["dashboard", "Home", "home"], ["systems", "Learn", "book"], ["bank", "Practice", "quiz"], ["mock", "Exams", "clock"], ["more", "More", "more"]];
  $("#mnav").innerHTML = mob.map(([r, l, i]) => `<button data-a="${r === "more" ? "more" : "nav"}" data-x="${r}" ${cur === r ? 'aria-current="page"' : ""}>${icon(i, 20)}<span>${l}</span></button>`).join("");
  $("#themeBtn").innerHTML = icon(isDark() ? "sun" : "moon");
  const dl = daysLeft(); $("#topCount").textContent = dl + (dl === 1 ? " day" : " days") + " to exit exam";
}
function render() {
  parseHash();
  renderNav();
  const fn = ROUTES[route] || ROUTES.dashboard;
  const v = $("#view");
  stopTimers();
  v.innerHTML = fn(routeArg) || "";
  if (VIEW_AFTER[route]) VIEW_AFTER[route](routeArg);
  S.lastView = route; save(true);
}
const VIEW_AFTER = {};
function rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }
const TIMERS = [];
function stopTimers() { while (TIMERS.length) clearInterval(TIMERS.pop()); if (window.__raf) cancelAnimationFrame(window.__raf); }
function modal(title, body, opts = {}) {
  const L = $("#layer");
  L.innerHTML = `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="mh"><h3 id="mTitle">${title}</h3><button class="iconbtn" data-a="closeModal" aria-label="Close">${icon("x")}</button></div><div class="mb">${body}</div></div></div>`;
  const f = L.querySelector(opts.focus || "input,button.primary,button"); if (f) f.focus();
}
function closeModal() { $("#layer").innerHTML = ""; }
function confirmBox(title, text, okLabel, onOk, danger) {
  modal(title, `<p>${text}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="closeModal">Cancel</button><button class="btn ${danger ? "danger" : "primary"}" id="cOk">${okLabel}</button></div>`, { focus: "#cOk" });
  $("#cOk").onclick = () => { closeModal(); onOk(); };
}
let toastT;
function toast(msg) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = msg; t.style.display = "block"; clearTimeout(toastT); toastT = setTimeout(() => t.style.display = "none", 2200); }

/* ---------- Settings & theme ---------- */
function isDark() { const t = S.settings.theme; return t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
function applySettings() {
  const r = document.documentElement;
  if (S.settings.theme === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", S.settings.theme);
  r.style.setProperty("--scale", S.settings.scale || 1);
  if (S.settings.contrast === "high") r.setAttribute("data-contrast", "high"); else r.removeAttribute("data-contrast");
  document.body.classList.toggle("reduce", S.settings.motion === "reduce");
}
function openSettings() {
  const st = S.settings;
  const ch = (k, v, l) => `<button class="chip" data-a="set" data-k="${k}" data-x="${v}" aria-pressed="${String(st[k]) === String(v)}">${l}</button>`;
  modal("Settings", `
   <div class="stack-s"><b>Appearance</b><div class="chips">${ch("theme", "auto", "Match device")}${ch("theme", "light", "Light")}${ch("theme", "dark", "Dark")}</div></div>
   <div class="stack-s"><b>Text size</b><div class="chips">${ch("scale", "0.9", "Smaller")}${ch("scale", "1", "Standard")}${ch("scale", "1.12", "Larger")}${ch("scale", "1.25", "Largest")}${ch("scale", "1.4", "Extra large")}</div></div>
   <div class="stack-s"><b>Contrast</b><div class="chips">${ch("contrast", "normal", "Standard")}${ch("contrast", "high", "High contrast")}</div></div>
   <div class="stack-s"><b>Motion</b><div class="chips">${ch("motion", "auto", "Match device")}${ch("motion", "reduce", "Reduce motion")}</div></div>
   <div class="stack-s"><b>Daily study commitment</b><div class="chips">${[15, 30, 45, 60, 90, 120].map(m => ch("minutes", m, m + " min")).join("")}</div></div>
   <label class="field">Exit exam date<input type="date" id="setExam" value="${esc(st.examDate)}"></label>
   <p class="small muted">Progress saves automatically in this browser and, when you're signed in, to your account so it follows you across devices.</p>`);
  $("#setExam").onchange = e => { if (e.target.value) { S.settings.examDate = e.target.value; save(); render(); toast("Exam date updated"); } };
}
function openMore() {
  modal("All sections", `<div class="grid g2">${NAV.flatMap(g => g.items).map(([r, l, i]) => `<button class="btn" style="justify-content:flex-start" data-a="nav" data-x="${r}">${icon(i)} ${l}</button>`).join("")}</div>`);
}

/* ---------- Search ---------- */
function searchIndex() {
  if (DATA.sx) return DATA.sx;
  const X = [];
  window.LESSONS.forEach(l => X.push({ t: l.title, k: "Lesson", s: DATA.sysName(l.sys), go: ["systems", "lesson-" + l.id], txt: [l.title, l.simple, (l.findings || []).join(" ")].join(" ") }));
  window.SYSTEMS.forEach(s => X.push({ t: s.name, k: "System", s: s.topics.slice(0, 5).join(", "), go: ["systems", "sys-" + s.id], txt: s.name + " " + s.topics.join(" ") }));
  window.CARDS.forEach(c => X.push({ t: c.topic, k: "Rapid card", s: c.cat, go: ["rapid", "card-" + c.id], txt: [c.topic, c.remember, c.recognize, c.act].join(" ") }));
  window.MEDS.forEach(m => X.push({ t: m.g + (m.b && m.b !== "—" ? " (" + m.b + ")" : ""), k: "Medication", s: m.c, go: ["meds", "med-" + slug(m.g)], txt: [m.g, m.b, m.c, m.ind].join(" ") }));
  window.LABS.forEach(l => X.push({ t: l.n + " (" + l.a + ")", k: "Lab value", s: l.r, go: ["labs", "lab-" + slug(l.n)], txt: [l.n, l.a, l.g, l.hi, l.lo].join(" ") }));
  window.COMPARE.forEach(c => X.push({ t: c.names.join(" vs "), k: "Comparison", s: DATA.sysName(c.sys) || "Pharmacology", go: ["compare", "cmp-" + c.id], txt: c.names.join(" ") + " " + c.hesi }));
  window.PROCEDURES.forEach(p => X.push({ t: p.title, k: "Procedure", s: p.purpose, go: ["skills", "proc-" + p.id], txt: p.title + " " + p.steps.join(" ") }));
  window.TEACHING.forEach(t => X.push({ t: t.title, k: "Teaching", s: t.cat, go: ["teaching", "teach-" + t.id], txt: t.title + " " + t.pts.join(" ") }));
  DATA.pool.forEach(q => X.push({ t: q.topic, k: "Question", s: q.subj, go: ["bank", "q-" + q.id], txt: q.topic + " " + q.stem }));
  return DATA.sx = X;
}
function openSearch() {
  modal("Search the clinical library", `<input class="search-input" type="search" id="sq" placeholder="Try: potassium, digoxin, preeclampsia, SBAR" autocomplete="off"><div id="sres" class="list"></div>`, { focus: "#sq" });
  const run = () => {
    const q = $("#sq").value.trim().toLowerCase(); const out = $("#sres");
    if (!q) { const bms = S.bm.length ? `<p class="small muted" style="padding:8px 4px">Saved for later</p>` + S.bm.map(k => `<button class="item-row" data-a="openKey" data-x="${esc(k)}">${icon("star", 16)} ${esc(keyLabel(k))}</button>`).join("") : `<p class="small muted" style="padding:8px 4px">Type to search lessons, rapid cards, medications, labs, comparisons, procedures, teaching, and questions.</p>`; out.innerHTML = bms; return; }
    const words = q.split(/\s+/);
    const res = searchIndex().map(x => { const hay = (x.t + " " + x.txt).toLowerCase(); let sc = 0; for (const w of words) { if (!hay.includes(w)) return null; sc += x.t.toLowerCase().includes(w) ? 3 : 1; } if (x.k === "Question") sc -= 1; return [sc, x]; }).filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 30);
    out.innerHTML = res.length ? res.map(([, x], i) => `<button class="item-row" data-a="go" data-x="${x.go[0]}" data-y="${esc(x.go[1])}"><span class="pill">${x.k}</span><span><b>${esc(x.t)}</b><br><span class="small muted">${esc((x.s || "").slice(0, 90))}</span></span></button>`).join("") : `<p class="muted" style="padding:10px 4px">No matches for "${esc(q)}". Try a shorter word.</p>`;
  };
  $("#sq").oninput = run; run();
}
function keyLabel(k) {
  const [t, id] = [k.split(":")[0], k.slice(k.indexOf(":") + 1)];
  if (t === "lesson") return "Lesson: " + (DATA.lesson(id) || {}).title;
  if (t === "card") return "Card: " + (DATA.card(id) || {}).topic;
  if (t === "med") return "Medication: " + id;
  if (t === "lab") return "Lab: " + id;
  if (t === "cmp") return "Comparison: " + ((DATA.cmp(id) || {}).names || []).join(" vs ");
  if (t === "q") return "Question: " + ((DATA.Q[id] || {}).topic || id);
  return k;
}
function openKey(k) {
  const [t, id] = [k.split(":")[0], k.slice(k.indexOf(":") + 1)];
  closeModal();
  if (t === "lesson") navTo("systems", "lesson-" + id);
  else if (t === "card") navTo("rapid", "card-" + id);
  else if (t === "med") navTo("meds", "med-" + slug(id));
  else if (t === "lab") navTo("labs", "lab-" + slug(id));
  else if (t === "cmp") navTo("compare", "cmp-" + id);
  else if (t === "q") navTo("bank", "q-" + id);
}

/* ---------- Global event delegation ---------- */
const ACT = {
  nav: (el) => { closeModal(); navTo(el.dataset.x); window.scrollTo(0, 0); },
  go: (el) => { closeModal(); navTo(el.dataset.x, el.dataset.y); window.scrollTo(0, 0); },
  more: () => openMore(),
  closeModal: (el, ev) => { if (el.dataset.self && ev.target !== el) return; closeModal(); },
  bm: (el) => { toggleBm(el.dataset.x); rerender(); },
  set: (el) => { const k = el.dataset.k; let v = el.dataset.x; if (k === "scale" || k === "minutes") v = Number(v); S.settings[k] = v; save(); applySettings(); openSettings(); renderNav(); if (route === "dashboard") rerender(); },
  openKey: (el) => openKey(el.dataset.x)
};
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-a]"); if (!el) return;
  const fn = ACT[el.dataset.a]; if (fn) { if (el.tagName === "A") ev.preventDefault(); fn(el, ev); }
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && $("#layer").innerHTML) closeModal();
  const tag = (ev.target.tagName || "").toLowerCase();
  if ((ev.key === "/" || ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k")) && !["input", "textarea", "select"].includes(tag)) { ev.preventDefault(); openSearch(); }
});
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); $("#view").focus({ preventScroll: true }); });
window.addEventListener("DOMContentLoaded", () => {
  loadLocal(); applySettings();
  $("#searchBtn").onclick = openSearch; $("#settingsBtn").onclick = openSettings;
  $("#themeBtn").onclick = () => { S.settings.theme = isDark() ? "light" : "dark"; save(); applySettings(); renderNav(); if (route === "dashboard") rerender(); };
  if (!location.hash && S.session && S.session.active) { /* resume mock prompt shown on dashboard */ }
  render();
  initSync();
});
