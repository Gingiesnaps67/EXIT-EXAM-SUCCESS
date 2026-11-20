/* Views part 1: Dashboard, Nursing Systems, Rapid Review, Comparisons, Medications, Labs. */
"use strict";
const head = (title, lede, right = "", crumb = "") => `<div class="page-head"><div>${crumb}<h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}</div>${right ? `<div class="row">${right}</div>` : ""}</div>`;
const tabs = (key, list, cur) => `<div class="tabs" role="tablist">${list.map(([id, l]) => `<button class="tab" role="tab" aria-selected="${cur === id}" data-a="tab" data-k="${key}" data-x="${id}">${l}</button>`).join("")}</div>`;
ACT.tab = el => { UI[el.dataset.k] = el.dataset.x; rerender(); };
const crumbBack = (label, r, arg) => `<div class="crumb"><button data-a="go" data-x="${r}" data-y="${arg || ""}">${icon("left", 14)} ${esc(label)}</button></div>`;
const li = arr => `<ul class="clean">${(arr || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
const liE = arr => `<ul class="clean">${(arr || []).map(x => `<li>${emph(x)}</li>`).join("")}</ul>`;
const firstSentences = (t, max = 230) => { const ss = String(t || "").split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/); let out = ""; for (const x of ss) { if (out && (out + " " + x).length > max) break; out = out ? out + " " + x : x; } return out; };
const hookHTMLOf = h => h ? memBox(String(h).split("\n").map(emph).join("<br>"), "Remember this: Memory hook") : "";
function glanceHTML(l, card) {
  const remember = card ? card.remember : String(l.hook || "").split("\n")[0];
  const item = (cls, ic, q, html) => html ? `<div class="gq ${cls}"><h3>${icon(ic, 18, 2.2)}${q}</h3><div class="gt">${html}</div></div>` : "";
  return `<section class="glance" aria-label="At a glance"><div class="glance-h"><h2>At a glance</h2><span class="small">Scan this first. The full lesson follows.</span></div><div class="glance-g">`
   + item("what", "help", "What is it?", esc(firstSentences(l.simple, 170)))
   + item("how", "info", "How does it work?", esc(firstSentences(l.patho, 170)))
   + item("assess", "steth", "What should I assess?", liE((l.assess || []).slice(0, 3)))
   + item("danger", "alert", "What is dangerous?", liE((l.red || []).slice(0, 3)))
   + item("first", "target", "What should the nurse do first?", liE((l.prio || []).slice(0, 2)))
   + item("remember", "brain", "What do I need to remember for the exam?", remember ? emph(remember) : "")
   + `</div></section>`;
}
const sysQs = sid => DATA.pool.filter(q => DATA.sysOf(q.subj) === sid).map(q => q.id);

/* =================== DASHBOARD =================== */
const PHASES = [
 { n: 1, name: "Core foundations", from: 36, focus: ["fund", "lead"], note: "Assessment, safety, infection control, priorities, vital signs, labs, and medication principles." },
 { n: 2, name: "Adult med-surg", from: 29, focus: ["cv", "resp", "neuro", "endo", "gi", "renal", "msk", "heme", "integ", "pain"], note: "Body systems, one or two per day." },
 { n: 3, name: "Maternal, peds, mental health", from: 22, focus: ["mat", "peds", "psych", "repro"], note: "Prenatal through newborn, pediatric development, psychiatric safety." },
 { n: 4, name: "Integration", from: 15, focus: ["cv", "resp", "mat", "peds", "psych", "endo", "renal", "neuro"], note: "Complex cases, multi-patient priorities, comparisons, medication simulations." },
 { n: 5, name: "Practice and remediation", from: 4, focus: null, note: "Full-length practice and your weakest areas, based only on your results here." },
 { n: 6, name: "Final consolidation", from: 1, focus: null, note: "High-yield rapid review, meds, labs, priorities — and rest." }
];
function curPhase(dl) { return PHASES.find(p => dl >= p.from) || PHASES[5]; }
function weakestSystem() {
  let worst = null;
  window.SYSTEMS.forEach(s => { const st = itemStats(q => DATA.sysOf(q.subj) === s.id); if (st.n >= 5 && (!worst || st.acc < worst.acc)) worst = { id: s.id, acc: st.acc }; });
  return worst;
}
function focusSystem(ph) {
  const weak = weakestSystem();
  if (ph.focus) { const idx = Math.floor(dayStart() / DAY) % ph.focus.length; const f = ph.focus[idx]; return weak && weak.acc < 65 && ph.n >= 2 ? weak.id : f; }
  return weak ? weak.id : "cv";
}
function missionPlan() {
  const dl = daysLeft(), M = S.settings.minutes || 45, ph = curPhase(dl), fs = focusSystem(ph), fsn = (window.SYSTEMS.find(s => s.id === fs) || {}).short;
  if (dl === 0) return { ph, fs, blocks: [{ k: "rapid", min: 10, t: "Exam-morning rapid review", d: "Light review only. Eat, hydrate, arrive early." }] };
  if (dl === 1) return { ph, fs, blocks: [{ k: "rapid", min: 15, t: "Exam-eve rapid review", d: "Top priorities and antidotes, then stop." }, { k: "labsdrill", min: 10, t: "Critical labs drill", d: "One quick pass." }, { k: "rest", min: 0, t: "Rest", d: "Sleep matters more than one more chapter tonight." }] };
  const T = {
   1: [["lesson", 3, `${fsn} review`], ["rapid", 2, "Rapid Review"], ["vitals", 1, "Vital signs and labs"], ["questions", 3, `${fsn} practice questions`], ["priorities", 1, "Who do you see first?"]],
   2: [["lesson", 3, `${fsn} lesson`], ["questions", 3, `${fsn} practice questions`], ["sim", 2, "Clinical judgment case"], ["meds", 1, "Medication safety"], ["rapid", 1, "Rapid Review"]],
   3: [["lesson", 3, `${fsn} lesson`], ["questions", 3, `${fsn} practice questions`], ["sim", 2, "Clinical judgment case"], ["compare", 1, "Disease comparison"], ["rapid", 1, "Rapid Review"]],
   4: [["sim", 3, "Unfolding case or First Five Minutes"], ["priorities", 2, "Multi-patient priorities"], ["questions", 3, "Mixed questions"], ["compare", 1, "Disease comparison"], ["meds", 1, "Medication safety"]],
   5: [["mock", 5, "Mock exam block"], ["review", 3, "Review missed concepts"], ["rapid", 1, "Rapid Review"], ["meds", 1, "Medication safety"]],
   6: [["rapid", 3, "High-yield rapid review"], ["labsdrill", 2, "Critical labs drill"], ["priorities", 2, "Priorities drill"], ["review", 2, "My missed concepts"]]
  }[ph.n];
  const due = dueItems().length + S.journal.filter(j => !j.resolved && j.due <= Date.now()).length;
  let tmpl = T.slice(); if (due >= 5 && !tmpl.find(x => x[0] === "review")) tmpl.push(["review", 2, "Spaced review due today"]);
  const maxBlocks = M <= 15 ? 2 : M <= 30 ? 3 : M <= 60 ? 4 : 6;
  tmpl = tmpl.slice().sort((a, b) => b[1] - a[1]).slice(0, maxBlocks);
  const W = tmpl.reduce((a, x) => a + x[1], 0);
  let blocks = tmpl.map(([k, w, t]) => ({ k, t, min: Math.max(5, Math.round(M * w / W / 5) * 5) }));
  let tot = blocks.reduce((a, b) => a + b.min, 0); while (tot > M && blocks.some(b => b.min > 5)) { const b = blocks.slice().sort((a, b) => b.min - a.min)[0]; b.min -= 5; tot -= 5; }
  const desc = { lesson: "Read the beginner explanation, then the detailed lesson.", rapid: "Due cards first, then new ones.", vitals: "Age-specific ranges and one monitor case.", questions: "Tutor mode with full rationales.", priorities: "Rank four patients and read why.", sim: "Work each clinical judgment step.", meds: "Decide: give, assess, hold, or escalate.", compare: "Hide one column and recall it.", mock: "Timed, no feedback until you submit.", review: "Questions you missed and items due today.", labsdrill: "Reference ranges and what to do." };
  blocks.forEach(b => b.d = desc[b.k]);
  return { ph, fs, blocks };
}
function startBlock(k, min, fs) {
  const pl = missionPlan();
  if (k === "lesson") { const l = window.LESSONS.find(x => x.sys === fs); navTo("systems", l ? "lesson-" + l.id : "sys-" + fs); }
  else if (k === "questions") { const ph = pl.ph; let ids = ph.n === 4 ? DATA.pool.map(q => q.id) : sysQs(fs); ids = shuffle(ids).sort((a, b) => (S.items[a] ? 1 : 0) - (S.items[b] ? 1 : 0)).slice(0, Math.max(5, Math.round(min * 0.8))); startPractice(ids, "Today's practice: " + (ph.n === 4 ? "mixed subjects" : DATA.sysName(fs)), "dashboard"); }
  else if (k === "rapid") { UI.rapidMode = min >= 10 ? "m10" : "m5"; UI.rapidIdx = 0; UI.rapidDeck = null; navTo("rapid"); }
  else if (k === "labsdrill") { UI.rapidMode = "labs"; UI.rapidDeck = null; navTo("rapid"); }
  else if (k === "vitals") navTo("vitals");
  else if (k === "priorities") navTo("priorities");
  else if (k === "sim") navTo("sim");
  else if (k === "meds") { UI.medTab = "safety"; navTo("meds"); }
  else if (k === "compare") navTo("compare");
  else if (k === "mock") { UI.mockN = Math.min(150, Math.max(10, Math.round(min * 0.75 / 5) * 5)); navTo("mock"); }
  else if (k === "review") { const ids = uniq(dueItems().concat(S.journal.filter(j => !j.resolved).map(j => j.qid))).slice(0, Math.max(5, min)); if (ids.length) startPractice(ids, "Spaced review and missed concepts", "dashboard"); else { toast("Nothing due yet. Answer some questions first."); } }
  logActivity();
}
ACT.mStart = el => { const pl = missionPlan(); startBlock(el.dataset.x, +el.dataset.m, pl.fs); };
ACT.mDone = el => { const k = todayKey(); if (S.mission.date !== k) S.mission = { date: k, done: [] }; const i = el.dataset.x; S.mission.done = S.mission.done.includes(i) ? S.mission.done.filter(x => x !== i) : S.mission.done.concat(i); save(); rerender(); };
ACT.mMin = el => { S.settings.minutes = +el.dataset.x; save(); rerender(); };
ROUTES.dashboard = () => {
  const dl = daysLeft(), pl = missionPlan(), ph = pl.ph;
  const k = todayKey(); if (S.mission.date !== k) S.mission = { date: k, done: [] };
  const d = S.days[k] || { q: 0, ok: 0 };
  const wk = itemStats((q, a) => a && a[2] > Date.now() - 7 * DAY);
  const all = itemStats();
  const dueN = dueItems().length + dueCards().length;
  const totalMin = pl.blocks.reduce((a, b) => a + b.min, 0);
  const qBlock = pl.blocks.filter(b => b.k === "questions").reduce((a, b) => a + Math.round(b.min * .8), 0);
  const autoQ = qBlock && d.q >= qBlock;
  const resume = S.session && S.session.active ? `<div class="callout warn spread"><div><h4>You have a mock exam in progress</h4><span class="small">${S.session.ids.filter(i => answered(DATA.Q[i], S.session.resp[i])).length} of ${S.session.ids.length} answered. Your answers were saved.</span></div><div class="row"><button class="btn primary" data-a="nav" data-x="exam">Resume exam</button><button class="btn sm danger" data-a="exQuit">Discard</button></div></div>` : "";
  const weak = window.SYSTEMS.map(s => ({ s, m: masteryFor(q => DATA.sysOf(q.subj) === s.id) })).filter(x => x.m.st.n >= 3 && (x.m.cls === "bad" || x.m.cls === "warn" || (x.m.racc != null && x.m.racc < 70))).slice(0, 4);
  const up = [0, 1, 2, 3, 4, 5, 6].map(i => { const a = dayStart() + i * DAY, b = a + DAY; return Object.values(S.items).filter(it => it.due >= (i ? a : 0) && it.due < b && it.box < 5).length + Object.values(S.cards).filter(c => c.due >= (i ? a : 0) && c.due < b).length; });
  return `${resume}
  <section class="monitor" aria-label="Exam countdown and today's numbers">
    <div><div class="mon-top"><span>Exit exam countdown</span><span class="mon-clock" id="monClock"></span></div>
      <canvas class="mon-trace" id="ecg" aria-hidden="true"></canvas>
      <div class="mon-big"><div class="mon-days" id="monDays">${dl}</div><div class="mon-dlabel">${dl === 1 ? "day" : "days"} until<br>${esc(examDate().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}</div></div>
      <p style="margin-top:12px;color:#B6CADB;max-width:52ch">Phase ${ph.n} of 6 · <b style="color:#fff">${ph.name}.</b> ${esc(ph.note)}</p></div>
    <div class="mon-grid">
      <div class="mon-cell"><div class="k">Questions today</div><div class="v c-cyan num">${d.q || 0}</div><div class="s">${d.q ? Math.round(100 * d.ok / d.q) + "% fully correct" : "None yet today"}</div></div>
      <div class="mon-cell"><div class="k">Accuracy, last 7 days</div><div class="v c-green num">${wk.acc == null ? "—" : wk.acc + "%"}</div><div class="s">${wk.n ? wk.n + " answers" : "Answer questions to see this"}</div></div>
      <div class="mon-cell"><div class="k">Study streak</div><div class="v c-amber num">${streak()}</div><div class="s">consecutive days</div></div>
      <div class="mon-cell"><div class="k">Reviews due</div><div class="v c-violet num">${dueN}</div><div class="s">questions and cards</div></div>
    </div>
  </section>
  <div class="grid g-main">
   <section class="panel raised">
    <div class="spread"><div><h2>Today's nursing mission</h2><p class="small muted">${totalMin ? totalMin + " minutes planned" : "Rest day"} · focus: ${esc(DATA.sysName(pl.fs))}${weakestSystem() && ph.n >= 2 ? " (chosen from your results)" : ""}</p></div>
     <div class="chips" aria-label="Daily study time">${[15, 30, 45, 60, 90, 120].map(m => `<button class="chip" data-a="mMin" data-x="${m}" aria-pressed="${S.settings.minutes === m}">${m}</button>`).join("")}</div></div>
    <div class="list" style="margin-top:8px">${pl.blocks.map((b, i) => { const id = b.k + i; const done = S.mission.done.includes(id) || (b.k === "questions" && autoQ);
      return `<div class="mission-step ${done ? "done" : ""}"><div class="mins">${b.min ? b.min + "<small>min</small>" : icon("moon", 22)}</div><div><b class="t">${esc(b.t)}</b><div class="small muted">${esc(b.d)}</div></div><div class="row">${b.k === "rest" ? "" : `<button class="btn sm primary" data-a="mStart" data-x="${b.k}" data-m="${b.min}">Start</button>`}<button class="iconbtn" style="width:34px;height:34px" data-a="mDone" data-x="${id}" aria-label="${done ? "Mark not done" : "Mark done"}" aria-pressed="${done}">${icon(done ? "check" : "check", 16, done ? 3 : 1.5)}</button></div></div>`; }).join("")}</div>
   </section>
   <section class="stack">
    <div class="panel"><h3>Quick start</h3><div class="grid g2" style="margin-top:12px">
      <button class="btn" data-a="nav" data-x="rapid">${icon("bolt")} Rapid Review</button><button class="btn" data-a="nav" data-x="bank">${icon("quiz")} Practice questions</button>
      <button class="btn" data-a="nav" data-x="priorities">${icon("flag")} Who first?</button><button class="btn" data-a="nav" data-x="mock">${icon("clock")} Mock exam</button></div></div>
    <div class="panel"><h3>Needs attention</h3>${weak.length ? `<div class="list" style="margin-top:6px">${weak.map(x => `<button class="item-row" data-a="go" data-x="systems" data-y="sys-${x.s.id}"><span class="pill ${x.m.cls || "warn"}">${x.m.label}</span><span>${esc(x.s.name)}<br><span class="small muted">${x.m.racc}% on recent questions</span></span></button>`).join("")}</div>` : `<p class="small muted" style="margin-top:6px">${all.n ? "No weak areas flagged yet. Keep mixing subjects." : "Your weak areas will appear here after you answer questions. Until then, coverage stays balanced across all subjects."}</p>`}</div>
    <div class="panel"><h3>Upcoming reviews</h3>${up.some(x => x) ? `<div class="row" style="align-items:flex-end;gap:6px;height:70px;margin-top:10px">${up.map((n, i) => { const mx = Math.max(...up, 1); return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px"><span class="tiny num">${n || ""}</span><div style="width:100%;height:${Math.max(3, 46 * n / mx)}px;background:${i ? "var(--rx)" : "var(--teal)"};border-radius:5px"></div><span class="tiny muted">${i ? new Date(Date.now() + i * DAY).toLocaleDateString(undefined, { weekday: "narrow" }) : "Today"}</span></div>`; }).join("")}</div>` : `<p class="small muted" style="margin-top:6px">Spaced reviews get scheduled as you answer questions and rate rapid-review cards.</p>`}</div>
   </section>
  </div>
  <section class="panel"><div class="spread"><h3>Study plan to ${esc(examDate().toLocaleDateString(undefined, { month: "short", day: "numeric" }))}</h3><span class="small muted">Adjusts automatically as the date gets closer</span></div>
   <div class="phase-track" style="margin-top:12px">${PHASES.map(p => `<div class="phase ${p === ph ? "now" : p.n < ph.n ? "past" : ""}"><b>${p.n}. ${p.name}</b><span class="muted">${["36+ days out", "29–35 days out", "22–28 days out", "15–21 days out", "4–14 days out", "Final 3 days"][p.n - 1]}</span></div>`).join("")}</div></section>
  ${S.mocks.length ? `<section class="panel"><div class="spread"><h3>Recent mock exams</h3><button class="btn sm" data-a="nav" data-x="mock">All results</button></div><div class="list" style="margin-top:6px">${S.mocks.slice(0, 3).map(m => `<button class="item-row" data-a="mockOpen" data-x="${m.id}"><span class="pill ${m.score >= 80 ? "ok" : m.score >= 65 ? "warn" : "bad"} num">${m.score}%</span><span>${m.n} questions · ${fmtDate(m.ts)}<br><span class="small muted">${m.full} fully correct</span></span></button>`).join("")}</div></section>` : ""}
  ${S.bm.length ? `<section class="panel"><h3>Saved for later</h3><div class="chips" style="margin-top:10px">${S.bm.slice(0, 12).map(k => `<button class="chip" data-a="openKey" data-x="${esc(k)}">${esc(keyLabel(k))}</button>`).join("")}</div></section>` : ""}`;
};
VIEW_AFTER.dashboard = () => {
  const cv = $("#ecg"); if (!cv) return;
  const ctx = cv.getContext("2d"); const dpr = window.devicePixelRatio || 1;
  const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; }; fit();
  const beat = t => { const g = (m, s, a) => a * Math.exp(-((t - m) ** 2) / (2 * s * s)); return g(.12, .025, .12) + g(.235, .008, -.12) + g(.26, .011, 1) + g(.285, .009, -.28) + g(.47, .045, .28); };
  let x = 0; const W = () => cv.width, H = () => cv.height; const pts = [];
  const reduce = S.settings.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const yAt = px => { const sec = px / (W() / 4.2); return beat((sec % .85) / .85 * .85 > .85 ? 0 : sec % .85); };
  const draw = () => {
    ctx.clearRect(0, 0, W(), H()); ctx.lineWidth = 2.2 * dpr; ctx.strokeStyle = "#3DE38B"; ctx.shadowColor = "rgba(61,227,139,.55)"; ctx.shadowBlur = 8 * dpr; ctx.beginPath();
    const lim = reduce ? W() : x;
    for (let px = 0; px <= lim; px += 2) { const y = H() * .72 - yAt(px) * H() * .58; px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); }
    ctx.stroke(); if (!reduce) { ctx.fillStyle = "#3DE38B"; ctx.beginPath(); ctx.arc(x, H() * .72 - yAt(x) * H() * .58, 3.5 * dpr, 0, 7); ctx.fill(); x += 3.2 * dpr; if (x > W()) x = 0; window.__raf = requestAnimationFrame(draw); }
  };
  draw();
  const clk = () => { const el = $("#monClock"); if (!el) return; const ms = examDate() - Date.now(); if (ms <= 0) { el.textContent = "Exam day"; return; } const dd = Math.floor(ms / DAY), h = Math.floor(ms % DAY / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000); el.textContent = `${dd}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`; };
  clk(); TIMERS.push(setInterval(clk, 1000));
};

/* =================== NURSING SYSTEMS =================== */
const LESSON_MODES = [["beginner", "Beginner"], ["detailed", "Detailed lesson"], ["apply", "Clinical application"], ["rapid", "Rapid review"], ["quiz", "Quiz me"]];
ROUTES.systems = (arg) => {
  if (arg && arg.startsWith("lesson-")) return lessonView(arg.slice(7));
  if (arg && arg.startsWith("sys-")) return systemView(arg.slice(4));
  const t = UI.sysTab || "lib";
  let body = "";
  if (t === "lib") body = `<div class="grid auto">${window.SYSTEMS.map(s => { const m = masteryFor(q => DATA.sysOf(q.subj) === s.id); const nl = window.LESSONS.filter(l => l.sys === s.id).length, nq = sysQs(s.id).length;
    return `<button class="card-link" data-a="go" data-x="systems" data-y="sys-${s.id}"><div class="spread"><span class="pill ${m.cls}">${m.label}</span><span class="tiny muted num">${m.st.n ? m.racc + "% recent" : ""}</span></div><h3>${esc(s.name)}</h3><span class="small muted">${nl} lesson${nl === 1 ? "" : "s"} · ${nq} questions</span><span class="small">${esc(s.topics.slice(0, 4).join(" · "))}</span></button>`; }).join("")}</div>`;
  else if (t === "cx") body = connectionsHTML();
  else body = teachBackHTML();
  return head("Nursing Systems", "Every lesson follows the same 12 parts, from a plain-language explanation to the nurse's first action and what to teach.") + tabs("sysTab", [["lib", "Subject library"], ["cx", "Clinical connections"], ["tb", "Teach it back"]], t) + body;
};
function systemView(id) {
  const s = window.SYSTEMS.find(x => x.id === id); if (!s) return `<div class="empty">System not found.</div>`;
  const ls0 = window.LESSONS.filter(l => l.sys === id); const qs = sysQs(id); const m = masteryFor(q => DATA.sysOf(q.subj) === id);
  const path = ls0.filter(l => l.seq).sort((a, b) => a.seq - b.seq), ls = path.concat(ls0.filter(l => !l.seq));
  const covered = t => ls.find(l => (l.topics || []).includes(t)) || ls.filter(l => !l.topics).find(l => l.title.toLowerCase().split(/[ ,]+/).some(w => w.length > 4 && t.toLowerCase().includes(w)));
  const unseen = qs.filter(x => !S.items[x]).length;
  return head(esc(s.name), `${ls.length} full lessons and ${qs.length} practice questions.`, `<span class="pill ${m.cls}">${m.label}</span><button class="btn primary" data-a="sysPractice" data-x="${id}">${icon("play", 16)} Practice ${Math.min(10, qs.length)} questions</button>`, crumbBack("All systems", "systems"))
   + (path.length ? `<div class="panel flat"><h3>Linear path</h3><p class="small muted" style="margin-top:4px">Study steps 1–${path.length} in order: normal function first, then assessment, disorders, treatment, medications, nursing care, and exam-style judgment. The other lessons after the path are shorter summaries of the same system.</p></div>` : "")
   + `<div class="grid auto">${ls.map(l => `<button class="card-link" data-a="go" data-x="systems" data-y="lesson-${l.id}"><span class="pill teal">${l.seq ? "Step " + l.seq + " of " + path.length : "Lesson"}</span><h3>${esc(l.title)}</h3><span class="small muted">${esc(l.simple.slice(0, 120))}…</span>${S.lessons[l.id] ? `<span class="tiny muted">Opened ${fmtDate(S.lessons[l.id].seen)}</span>` : ""}</button>`).join("") || `<div class="empty">No full lesson in this system yet — practice questions below come from your course files.</div>`}</div>
   <div class="panel"><h3>Topic coverage</h3><p class="small muted" style="margin:4px 0 10px">Topics without a full lesson yet are still covered by questions, rapid cards, comparisons, or reference sections where those exist.</p><div class="chips">${s.topics.map(t => { const l = covered(t); return l ? `<button class="chip" data-a="go" data-x="systems" data-y="lesson-${l.id}" aria-pressed="true">${esc(t)}</button>` : `<span class="chip" style="cursor:default">${esc(t)}</span>`; }).join("")}</div></div>
   <div class="panel"><div class="spread"><h3>Questions in this system</h3><span class="small muted">${unseen} not yet attempted</span></div><div class="list" style="margin-top:8px">${qs.slice(0, 60).map(x => { const q = DATA.Q[x], it = S.items[x]; return `<button class="item-row" data-a="tryRelated" data-x="${x}"><span class="pill ${it ? (it.c / it.n >= .8 ? "ok" : "warn") : ""}">${it ? Math.round(100 * it.c / it.n) + "%" : "New"}</span><span>${esc(q.topic)}<br><span class="tiny muted">${FMT_NAME[q.fmt]} · ${DIFF_NAME[q.diff] || ""}</span></span></button>`; }).join("")}</div></div>`;
}
ACT.sysPractice = el => { const ids = sysQs(el.dataset.x); const un = shuffle(ids.filter(x => !S.items[x])), seen = shuffle(ids.filter(x => S.items[x])); startPractice(un.concat(seen).slice(0, 10), DATA.sysName(el.dataset.x) + " practice", "systems"); };
function lessonView(id) {
  const l = DATA.lesson(id); if (!l) return `<div class="empty">Lesson not found.</div>`;
  if (!S.lessons[id]) { S.lessons[id] = { seen: Date.now() }; logActivity(); }
  const mode = UI.lessonMode || "detailed";
  const sec = (n, title, html, cls = "", lab = "") => `<div class="lesson-sec ${cls}"><div class="sec-n">${n}</div><div class="stack-s"><div class="sec-h"><h3>${title}</h3>${lab}</div>${html}</div></div>`;
  const srcs = uniq((l.src || []).map(s => s.doc + ", " + s.pg).concat((l.qs || []).map(q => DATA.Q[q]).filter(Boolean).map(q => q.src + (q.pg ? ", " + q.pg : ""))));
  const fx = l.first; UI.fx = UI.fx || {};
  const fxState = UI.fx[id];
  const fxSeed = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7); let fxS = fxSeed || 1; const fxRnd = () => ((fxS = (fxS * 1103515245 + 12345) >>> 0) % 10000) / 10000;
  const fxIdx = Math.max(0, window.LESSONS.findIndex(x => x.id === id)); const fxOrd = shuffle([...fx.opts.keys()].filter(i => i !== fx.key), fxRnd); fxOrd.splice(fxIdx % fx.opts.length, 0, fx.key);
  const fxHTML = `<div class="callout teal"><h4>What would the nurse do first?</h4><p style="margin:6px 0 10px">${esc(fx.stem)}</p><div class="opts">${fxOrd.map((i, pos) => { const o = fx.opts[i]; const cls = fxState == null ? "" : i === fx.key ? " right" : i === fxState ? " wrong" : ""; return `<button class="opt${cls}" data-a="fxPick" data-x="${id}" data-i="${i}" ${fxState != null ? "disabled" : ""}><span class="mk">${L(pos)}</span><span>${esc(o)}</span></button>`; }).join("")}</div>${fxState != null ? `<p class="small" style="margin-top:10px"><b>${fxState === fx.key ? "Correct." : "Not first."}</b> ${esc(fx.why)}</p>` : ""}</div>`;
  const card = DATA.card(l.card), cmp = l.cmp ? DATA.cmp(l.cmp) : null;
  const hookHTML = hookHTMLOf(l.hook);
  const notesHTML = (l.notes || []).length ? `<div class="callout warn"><div class="sec-h" style="margin-bottom:6px"><h4>Where your sources differ</h4>${labTag("trap", "Exam tip")}</div>${liE(l.notes)}</div>` : "";
  const glance = (mode === "beginner" || mode === "detailed") ? glanceHTML(l, card) : "";
  let body = "";
  if (mode === "beginner") body = `<div class="panel raised stack"><div class="prose" style="font-size:1.12rem">${esc(l.simple)}</div>${hookHTML}<div class="callout"><h4>What's happening inside the body</h4>${esc(l.patho)}</div><div class="grid g2"><div class="callout bad"><div class="sec-h" style="margin-bottom:6px"><h4>Red flags to report</h4>${labTag("report")}</div>${liE(l.red)}</div><div class="callout ok"><div class="sec-h" style="margin-bottom:6px"><h4>What the nurse does</h4>${labTag("prio")}</div>${liE(l.prio)}</div></div>${fxHTML}</div>`;
  else if (mode === "detailed") body = `<div class="panel raised">${[
    sec(1, "Simple explanation", `<p class="prose">${esc(l.simple)}</p>${hookHTML}`),
    sec(2, "Pathophysiology", `<p class="prose">${esc(l.patho)}</p>`, "", labTag("why")),
    sec(3, "Risk factors and causes", liE(l.risk)),
    sec(4, "Expected findings", liE(l.findings), "", labTag("expected")),
    sec(5, "Red flags", liE(l.red), "sec-red", labTag("report")),
    sec(6, "Focused nursing assessment", liE(l.assess), "", labTag("assess")),
    sec(7, "Nursing priorities", liE(l.prio), "", labTag("prio")),
    sec(8, "Nursing interventions", `<div class="grid g3"><div><h4 class="small">Independent nursing actions</h4>${liE(l.interv.nurse)}</div><div><h4 class="small">Require an order</h4>${liE(l.interv.orders.length ? l.interv.orders : ["—"])}</div><div><h4 class="small" style="color:var(--bad)">Escalate when</h4>${liE(l.interv.escalate.length ? l.interv.escalate : ["—"])}</div></div>`),
    sec(9, "Medications and treatments", l.meds.length ? `<div>${l.meds.map(([n, t]) => `<div class="med-line"><span class="mn">${esc(n)}</span> — <span>${emph(t)}</span></div>`).join("")}</div>` : `<p class="muted">No specific medications for this topic.</p>`, "sec-rx"),
    sec(10, "Patient teaching", liE(l.teach), "", labTag("teach")),
    sec(11, "Evaluation", `<div class="grid g2"><div class="callout ok"><div class="sec-h" style="margin-bottom:6px"><h4>Improving</h4>${labTag("expected", "Expected response")}</div>${liE(l.eval.better)}</div><div class="callout warn"><div class="sec-h" style="margin-bottom:6px"><h4>Not working or worsening</h4>${labTag("unexpected")}</div>${liE(l.eval.worse)}</div></div>`),
    sec(12, "Clinical application", fxHTML)].join("")}${notesHTML ? `<div style="margin-top:14px">${notesHTML}</div>` : ""}</div>`;
  else if (mode === "apply") { const qs = (l.qs || []).filter(x => DATA.Q[x]); body = `<div class="stack"><div class="panel"><h3>Patient scenario</h3><p class="prose" style="margin-top:6px">${esc(l.scenario)}</p><p class="small muted" style="margin-top:8px">Ask yourself: What do I see? What does it mean? What matters most? What should I do? What must I watch for?</p></div>${fxHTML}
     <div class="panel"><div class="spread"><h3>HESI-style questions on this topic</h3>${qs.length ? `<button class="btn primary sm" data-a="lessonQuiz" data-x="${id}">Practice ${qs.length}</button>` : ""}</div>${qs.length ? `<div class="list" style="margin-top:8px">${qs.map(x => `<button class="item-row" data-a="tryRelated" data-x="${x}">${esc(DATA.Q[x].topic)}<span class="pill" style="margin-left:auto">${FMT_NAME[DATA.Q[x].fmt]}</span></button>`).join("")}</div>` : `<p class="muted small">No linked questions yet.</p>`}</div>
     ${cmp ? `<button class="card-link" data-a="go" data-x="compare" data-y="cmp-${cmp.id}"><span class="pill teal">Related comparison</span><h3>${esc(cmp.names.join(" vs "))}</h3><span class="small">${esc(cmp.hesi)}</span></button>` : ""}</div>`; }
  else if (mode === "rapid") body = card ? rapidCardHTML(card, true) : `<div class="empty">No rapid card for this lesson.</div>`;
  else if (mode === "quiz") { const qs = (l.qs || []).filter(x => DATA.Q[x]); body = `<div class="panel stack"><p>Quiz yourself on <b>${esc(l.title)}</b> with ${qs.length} questions from your course materials, then the "what first" check.</p><div class="row"><button class="btn primary big" data-a="lessonQuiz" data-x="${id}" ${qs.length ? "" : "disabled"}>Start quiz</button></div></div>${fxHTML}`; }
  const pathL = l.seq ? window.LESSONS.filter(x => x.sys === l.sys && x.seq).sort((a, b) => a.seq - b.seq) : [];
  const pIdx = pathL.indexOf(l), prevL = pathL[pIdx - 1], nextL = pathL[pIdx + 1];
  const pathNav = l.seq ? `<div class="spread" style="margin-top:18px;gap:10px;flex-wrap:wrap">${prevL ? `<button class="btn" data-a="go" data-x="systems" data-y="lesson-${prevL.id}">${icon("left", 16)} Step ${prevL.seq}: ${esc(prevL.short || prevL.title)}</button>` : "<span></span>"}${nextL ? `<button class="btn primary" data-a="go" data-x="systems" data-y="lesson-${nextL.id}">Step ${nextL.seq}: ${esc(nextL.short || nextL.title)} ${icon("right", 16)}</button>` : `<button class="btn" data-a="go" data-x="systems" data-y="sys-${l.sys}">Back to the path</button>`}</div>` : "";
  return head(esc(l.title), esc(DATA.sysName(l.sys)) + (l.seq ? ` · Step ${l.seq} of ${pathL.length}` : ""), bmBtn("lesson:" + id), crumbBack(DATA.sysName(l.sys), "systems", "sys-" + l.sys))
   + glance + tabs("lessonMode", LESSON_MODES, mode) + body + pathNav
   + `<details class="x"><summary>Where this content comes from</summary><div class="in small stack-s"><p>${l.course ? "This lesson was written from your own course files (pages below). Where a chapter and a slide deck disagree, the difference is shown in the \u201cWhere your sources differ\u201d box. It is educational, not a care protocol." : "Lesson text was written for this app from standard PN/LVN nursing references and is educational, not a care protocol. The course-file pages below are where the linked questions and cited points appear in your materials."}</p>${li(srcs.length ? srcs : ["No course pages linked yet."])}</div></details>`;
}
ACT.fxPick = el => { UI.fx[el.dataset.x] = +el.dataset.i; logActivity(); rerender(); };
ACT.lessonQuiz = el => { const l = DATA.lesson(el.dataset.x); startPractice(l.qs.filter(x => DATA.Q[x]), "Quiz: " + l.title, "systems"); };
function connectionsHTML() {
  return `<p class="muted">Each chain links a disorder to the treatment, the monitoring, and the risk it creates. Tap any step to open it.</p>` + window.CONNECTIONS.map(c => `<div class="panel"><h3 style="margin-bottom:12px">${esc(c.title)}</h3><div class="row" style="gap:6px">${c.nodes.map((n, i) => `${i ? `<span class="muted">${icon("right", 16)}</span>` : ""}<button class="chip" data-a="cxGo" data-x="${esc(n.to)}">${esc(n.t)}</button>`).join("")}</div></div>`).join("");
}
ACT.cxGo = el => { const [t, id] = [el.dataset.x.split(":")[0], el.dataset.x.slice(el.dataset.x.indexOf(":") + 1)]; openKey(t + ":" + id); };
function teachBackHTML() {
  const cur = UI.tbId || window.TEACHBACK[0].id; const tb = window.TEACHBACK.find(x => x.id === cur); const r = UI.tbRes && UI.tbRes.id === cur ? UI.tbRes : null;
  return `<p class="muted">Explain the concept in your own words, as if teaching a classmate. Your answer is checked against a list of key concepts (any reasonable wording counts), then you confirm what you covered.</p>
  <div class="chips">${window.TEACHBACK.map(t => `<button class="chip" data-a="tbPick" data-x="${t.id}" aria-pressed="${t.id === cur}">${esc(t.prompt.replace(/^Explain (to a client )?/, "").slice(0, 48))}…</button>`).join("")}</div>
  <div class="panel raised stack"><h3>${esc(tb.prompt)}</h3><textarea id="tbText" placeholder="Type your explanation here…">${esc(r ? r.text : (S.tb[cur] && S.tb[cur].text) || "")}</textarea><div class="row"><button class="btn primary" data-a="tbCheck" data-x="${cur}">Check my explanation</button><span class="small muted">Aim for 3–6 sentences.</span></div>
  ${r ? `<div class="explain"><div class="verdict ${r.hit.length >= tb.concepts.length - 1 ? "ok" : r.hit.length >= 2 ? "part" : "bad"}"><span class="badge">${r.hit.length}/${tb.concepts.length}</span>${r.hit.length >= tb.concepts.length - 1 ? "Strong explanation" : r.hit.length >= 2 ? "Good start — fill the gaps" : "Key points missing"}</div>
   <div class="grid g2"><div class="callout ok"><h4>Concepts you covered</h4>${r.hit.length ? li(r.hit.map(i => tb.concepts[i].label)) : "<p class='small'>None detected yet.</p>"}</div><div class="callout warn"><h4>Missing critical points</h4>${r.miss.length ? li(r.miss.map(i => tb.concepts[i].label)) : "<p class='small'>Nothing missing.</p>"}</div></div>
   ${r.wrong.length ? `<div class="callout bad"><h4>Check this reasoning</h4>${li(r.wrong)}</div>` : ""}
   <p class="small muted">Keyword matching can miss correct ideas phrased differently. If you covered a point the checker missed, count it — and if it credited a point you didn't really explain, don't.</p>
   <div class="row"><button class="btn sm" data-a="cxGo" data-x="${esc(tb.follow)}">${icon("book", 16)} Recommended follow-up</button></div></div>` : ""}</div>`;
}
ACT.tbPick = el => { UI.tbId = el.dataset.x; UI.tbRes = null; rerender(); };
ACT.tbCheck = el => { const tb = window.TEACHBACK.find(x => x.id === el.dataset.x); const text = $("#tbText").value; const low = " " + text.toLowerCase() + " ";
  const hit = [], miss = []; tb.concepts.forEach((c, i) => (c.any.some(k => low.includes(k.toLowerCase())) ? hit : miss).push(i));
  const wrong = (tb.wrong || []).filter(w => new RegExp(w.re, "i").test(text)).map(w => w.msg);
  if (text.trim().split(/\s+/).length < 8) { toast("Write at least a couple of sentences first."); return; }
  UI.tbRes = { id: tb.id, text, hit, miss, wrong }; S.tb[tb.id] = { text, score: hit.length, ts: Date.now() }; logActivity(); rerender(); };

/* =================== RAPID REVIEW =================== */
const RAPID_MODES = [["due", "Due for review"], ["m5", "5-minute review"], ["m10", "10-minute review"], ["r25", "25 random essentials"], ["meds", "Medication speed drill"], ["labs", "Critical labs drill"], ["prio", "Nursing priorities drill"], ["morning", "Exam-morning review"], ["missed", "My missed concepts"], ["browse", "Browse by category"]];
function rapidDeck(mode) {
  const C = window.CARDS; const due = dueCards(); const fresh = C.filter(c => !S.cards[c.id]);
  if (mode === "due") return due.length ? due : shuffle(fresh).slice(0, 10);
  if (mode === "m5") return due.concat(shuffle(fresh)).slice(0, 8);
  if (mode === "m10") return due.concat(shuffle(fresh)).slice(0, 15);
  if (mode === "r25") return shuffle(C).slice(0, 25);
  if (mode === "prio") return shuffle(C.filter(c => ["Top Nursing Priorities", "High-Yield Clinical Judgment", "Emergency Findings", "Common Examination Traps"].includes(c.cat)));
  if (mode === "morning") return C.filter(c => ["Last-Minute Examination Review", "Top Nursing Priorities", "Drug Antidotes and Reversal Agents", "Common Examination Traps"].includes(c.cat));
  if (mode === "missed") { const sys = uniq(S.journal.filter(j => !j.resolved).map(j => DATA.Q[j.qid]).filter(Boolean).map(q => DATA.sysOf(q.subj))); const ls = window.LESSONS.filter(l => sys.includes(l.sys)).map(l => l.card); const rated = C.filter(c => S.cards[c.id] && S.cards[c.id].lastRate === 0); return uniq(rated.concat(ls.map(id => DATA.card(id)).filter(Boolean))); }
  if (mode === "browse") return C.filter(c => c.cat === (UI.rapidCat || window.CARD_CATS[0]));
  return C;
}
function drillQs(mode) {
  if (mode === "meds") return shuffle(window.MEDS).slice(0, 12).map(m => { const others = shuffle(window.MEDS.filter(x => x.g !== m.g && x.c !== m.c));
    const kinds = [["Which class does " + m.g + " belong to?", m.c, others.map(o => o.c)], ["What must the nurse monitor for " + m.g + "?", m.mon, others.map(o => o.mon)], ["Antidote or reversal for " + m.g + "?", m.anti, others.map(o => o.anti)]].filter(k => k[1] && k[1].length > 2 && !/^—|supportive/i.test(k[1]));
    const [q, a, ds] = pick(kinds.length ? kinds : [["Which class does " + m.g + " belong to?", m.c, others.map(o => o.c)]]); const opts = shuffle(uniq([a].concat(ds.filter(d => d && d !== a && !/^—/.test(d)))).slice(0, 4)); if (!opts.includes(a)) opts[0] = a; return { q, opts: shuffle(opts), a, why: m.cue }; });
  if (mode === "labs") return shuffle(window.LABS).slice(0, 12).map(l => { const ds = shuffle(window.LABS.filter(x => x.n !== l.n && x.g === l.g)).map(x => x.r); const ds2 = ds.length >= 3 ? ds : ds.concat(shuffle(window.LABS.filter(x => x.n !== l.n)).map(x => x.r)); const opts = shuffle([l.r].concat(uniq(ds2).slice(0, 3)));
    return { q: "Reference range for " + l.n + " (" + l.a + ")?", opts, a: l.r, why: "Nursing action: " + l.act }; });
  return null;
}
function rapidCardHTML(c, solo) {
  const rev = solo || UI.rapidReveal; const ch = UI.rapidCheck && UI.rapidCheck.id === c.id ? UI.rapidCheck : null;
  if (!UI.rapidOrd || UI.rapidOrd.id !== c.id) UI.rapidOrd = { id: c.id, o: shuffle([0, 1, 2, 3].slice(0, c.check.opts.length)) };
  const ord = UI.rapidOrd.o;
  return `<article class="rcard"><div class="top"><div class="spread"><span class="pill teal">${esc(c.cat)}</span>${bmBtn("card:" + c.id)}</div><h2 style="margin-top:8px">${esc(c.topic)}</h2><div class="must">${labTag("must")}<p style="margin-top:6px">${emph(c.remember)}</p></div></div>
   <div class="body">${rev ? `<div class="rf"><span class="k">${labTag("assess", "Recognize")}</span><span>${emph(c.recognize)}</span></div><div class="rf"><span class="k">${labTag("prio", "Act")}</span><span>${emph(c.act)}</span></div><div class="rf"><span class="k">${labTag("trap", "Avoid")}</span><span>${emph(c.avoid)}</span></div><div class="rf"><span class="k">${labTag("why", "Why")}</span><span>${esc(c.why)}</span></div>
    <div class="callout"><h4>Check your understanding</h4><p style="margin:4px 0 10px">${esc(c.check.q)}</p><div class="opts">${ord.map(i => { const cls = ch ? (i === c.check.key ? " right" : i === ch.pick ? " wrong" : "") : ""; return `<button class="opt${cls}" data-a="rcCheck" data-x="${c.id}" data-i="${i}" ${ch ? "disabled" : ""}><span class="mk">${icon(ch && i === c.check.key ? "check" : "right", 13, 3)}</span><span>${esc(c.check.opts[i])}</span></button>`; }).join("")}</div></div>` : `<button class="btn primary big" data-a="rcReveal">Reveal: recognize, act, avoid, why</button><p class="small muted">Try to say the answer out loud before revealing.</p>`}</div></article>`;
}
ROUTES.rapid = (arg) => {
  if (arg && arg.startsWith("card-")) { const c = DATA.card(arg.slice(5)); if (c) return head("Rapid Review", "", "", crumbBack("Rapid Review", "rapid")) + rapidCardHTML(c, true); }
  const mode = UI.rapidMode || "due";
  const modeBar = `<div class="chips">${RAPID_MODES.map(([k, l]) => `<button class="chip" data-a="rMode" data-x="${k}" aria-pressed="${mode === k}">${l}${k === "due" && dueCards().length ? ` (${dueCards().length})` : ""}</button>`).join("")}</div>`;
  const drill = drillQs(mode);
  if (drill) { if (!UI.drill || UI.drill.mode !== mode) UI.drill = { mode, qs: drill, i: 0, ok: 0, pick: null };
    const D = UI.drill; if (D.i >= D.qs.length) return head("Rapid Review", "Fast recall with spaced repetition.") + modeBar + `<div class="panel raised stack"><h2>${D.ok} of ${D.qs.length} correct</h2><p class="muted">Speed drills build recognition. Review missed items in the medication or lab library.</p><div class="row"><button class="btn primary" data-a="drillAgain">New drill</button><button class="btn" data-a="nav" data-x="${mode === "meds" ? "meds" : "labs"}">Open the ${mode === "meds" ? "medication" : "lab"} library</button></div></div>`;
    const x = D.qs[D.i];
    return head("Rapid Review", "Fast recall with spaced repetition.") + modeBar + `<div class="panel raised stack"><div class="spread"><span class="pill info">${mode === "meds" ? "Medication speed drill" : "Critical labs drill"}</span><span class="small muted num">${D.i + 1} / ${D.qs.length} · ${D.ok} correct</span></div><h2>${esc(x.q)}</h2><div class="opts">${x.opts.map((o, i) => { const cls = D.pick == null ? "" : o === x.a ? " right" : i === D.pick ? " wrong" : ""; return `<button class="opt${cls}" data-a="drillPick" data-i="${i}" ${D.pick != null ? "disabled" : ""}><span class="mk">${L(i)}</span><span>${esc(o)}</span></button>`; }).join("")}</div>${D.pick != null ? `<p class="small"><b>${x.opts[D.pick] === x.a ? "Correct." : "Answer: " + esc(x.a)}</b> ${esc(x.why || "")}</p><div class="row" style="justify-content:flex-end"><button class="btn primary" data-a="drillNext">Next ${icon("right")}</button></div>` : ""}</div>`; }
  if (!UI.rapidDeck || UI.rapidDeck.mode !== mode || (mode === "browse" && UI.rapidDeck.cat !== UI.rapidCat)) { UI.rapidDeck = { mode, cat: UI.rapidCat, ids: rapidDeck(mode).map(c => c.id) }; UI.rapidIdx = 0; UI.rapidReveal = false; }
  const ids = UI.rapidDeck.ids; const i = UI.rapidIdx || 0;
  const catBar = mode === "browse" ? `<div class="chips scroll">${window.CARD_CATS.map(c => `<button class="chip" data-a="rCat" data-x="${esc(c)}" aria-pressed="${(UI.rapidCat || window.CARD_CATS[0]) === c}">${esc(c)} (${window.CARDS.filter(x => x.cat === c).length})</button>`).join("")}</div>` : "";
  if (!ids.length) return head("Rapid Review", "Fast recall with spaced repetition.") + modeBar + catBar + `<div class="empty">${mode === "missed" ? "No missed concepts yet. Cards you rate 'Again' and topics from questions you miss will collect here." : "No cards in this set."}</div>`;
  if (i >= ids.length) return head("Rapid Review", "Fast recall with spaced repetition.") + modeBar + catBar + `<div class="panel raised stack"><h2>Set complete</h2><p class="muted">${ids.length} cards reviewed. Cards you rated "Again" will come back today; "Good" cards move further out.</p><div class="row"><button class="btn primary" data-a="rMode" data-x="due">Review what's due</button><button class="btn" data-a="rMode" data-x="r25">25 random essentials</button></div></div>`;
  const c = DATA.card(ids[i]);
  return head("Rapid Review", "Fast recall with spaced repetition.") + modeBar + catBar
   + `<div class="spread"><span class="small muted num">Card ${i + 1} of ${ids.length}</span><div class="progress-line" style="max-width:300px"><span style="width:${100 * i / ids.length}%"></span></div></div>`
   + rapidCardHTML(c) + (UI.rapidReveal ? `<div class="spread"><span class="small muted">How well did you know it?</span><div class="row"><button class="btn" data-a="rRate" data-x="0">Again</button><button class="btn" data-a="rRate" data-x="1">Hard</button><button class="btn primary" data-a="rRate" data-x="2">Good</button></div></div>` : `<div class="row" style="justify-content:flex-end"><button class="btn ghost" data-a="rSkip">Skip</button></div>`);
};
Object.assign(ACT, {
  rMode: el => { UI.rapidMode = el.dataset.x; UI.rapidDeck = null; UI.drill = null; rerender(); },
  rCat: el => { UI.rapidCat = el.dataset.x; UI.rapidDeck = null; rerender(); },
  rcReveal: () => { UI.rapidReveal = true; rerender(); },
  rcCheck: el => { UI.rapidCheck = { id: el.dataset.x, pick: +el.dataset.i }; rerender(); },
  rSkip: () => { UI.rapidIdx++; UI.rapidReveal = false; UI.rapidCheck = null; rerender(); },
  rRate: el => { const id = UI.rapidDeck.ids[UI.rapidIdx], r = +el.dataset.x; const c = S.cards[id] || (S.cards[id] = { box: 0, n: 0, ok: 0 });
    c.n++; c.last = Date.now(); c.lastRate = r; if (r === 2) { c.box = Math.min(5, c.box + 1); c.ok++; } else if (r === 0) c.box = 0;
    c.due = r === 0 ? Date.now() + 10 * 60000 : dayStart() + Math.max(1, BOX_DAYS[c.box] || 1) * DAY; logActivity();
    UI.rapidIdx++; UI.rapidReveal = false; UI.rapidCheck = null; rerender(); },
  drillPick: el => { const D = UI.drill, x = D.qs[D.i]; D.pick = +el.dataset.i; if (x.opts[D.pick] === x.a) D.ok++; rerender(); },
  drillNext: () => { UI.drill.i++; UI.drill.pick = null; rerender(); },
  drillAgain: () => { UI.drill = null; logActivity(); rerender(); }
});

/* =================== DISEASE COMPARISONS =================== */
ROUTES.compare = (arg) => {
  const sysF = UI.cmpSys || "all";
  const list = window.COMPARE.filter(c => sysF === "all" || c.sys === sysF);
  const cur = arg && arg.startsWith("cmp-") ? DATA.cmp(arg.slice(4)) : null;
  if (cur) return compareView(cur);
  if (arg === "custom") return customCompareView();
  const syss = uniq(window.COMPARE.map(c => c.sys));
  return head("Disease Comparisons", "Side-by-side charts for conditions that look alike. Hide a column to test yourself, or turn any chart into a quiz.", `<button class="btn" data-a="go" data-x="compare" data-y="custom">Build your own comparison</button>`)
   + `<div class="chips scroll"><button class="chip" data-a="cmpSys" data-x="all" aria-pressed="${sysF === "all"}">All (${window.COMPARE.length})</button>${syss.map(s => `<button class="chip" data-a="cmpSys" data-x="${s}" aria-pressed="${sysF === s}">${s === "pharm" ? "Pharmacology" : esc((window.SYSTEMS.find(x => x.id === s) || {}).short || s)}</button>`).join("")}</div>`
   + `<div class="grid auto">${list.map(c => `<button class="card-link" data-a="go" data-x="compare" data-y="cmp-${c.id}"><span class="pill ${c.drug ? "info" : "teal"}">${c.drug ? "Pharmacology" : esc((window.SYSTEMS.find(x => x.id === c.sys) || {}).short || "")}</span><h3>${c.names.map(esc).join(" <span class='muted'>vs</span> ")}</h3><span class="small muted">${esc(c.rows[c.rows.length - 1].join(" / ")).slice(0, 110)}</span></button>`).join("")}</div>`;
};
ACT.cmpSys = el => { UI.cmpSys = el.dataset.x; rerender(); };
function compareStack(names, rows, labels, hideIdx) {
  const bar = `<div class="cmp-hidebar"><span class="small muted">Self-test: hide one side</span>${names.map((n, i) => `<button class="chip" data-a="cmpHide" data-x="${i}" aria-pressed="${hideIdx === i}">${hideIdx === i ? "Show" : "Hide"} ${esc(n)}</button>`).join("")}</div>`;
  return `<div class="cmp-stack">${bar}${rows.map((r, ri) => { const key = ri === rows.length - 1; return `<section class="cmp-sec${key ? " key" : ""}"><h4>${esc(labels[ri] || "")}${key ? labTag("must", "Key difference") : ""}</h4>${r.map((cell, ci) => { const hid = hideIdx === ci && !(UI.cmpPeek || []).includes(ri + ":" + ci); return `<div class="cmp-cell${hid ? " hid" : ""}" ${hideIdx === ci ? `data-a="cmpPeek" data-x="${ri}:${ci}" role="button" tabindex="0" aria-label="${hid ? "Hidden. Tap to reveal " + esc(names[ci]) : esc(names[ci])}"` : ""}><span class="cn">${esc(names[ci])}</span>${esc(cell)}</div>`; }).join("")}</section>`; }).join("")}</div>`;
}
function compareTable(names, rows, labels, hideIdx) {
  return compareStack(names, rows, labels, hideIdx) + `<div class="tablewrap cmp-wide"><table class="t cmp"><thead><tr><th>Feature</th>${names.map((n, i) => `<th>${esc(n)} <button class="btn sm ghost" data-a="cmpHide" data-x="${i}" aria-pressed="${hideIdx === i}">${hideIdx === i ? "Show" : "Hide"}</button></th>`).join("")}</tr></thead><tbody>${rows.map((r, ri) => `<tr class="${ri === rows.length - 1 ? "key" : ""}"><td>${esc(labels[ri] || "")}</td>${r.map((cell, ci) => `<td class="${hideIdx === ci && !(UI.cmpPeek || []).includes(ri + ":" + ci) ? "hid" : ""}" ${hideIdx === ci ? `data-a="cmpPeek" data-x="${ri}:${ci}" title="Tap to reveal"` : ""}>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function compareView(c) {
  const labels = c.drug ? window.CMP_DRUG_ROWS : window.CMP_ROWS;
  const hide = UI.cmpHideId === c.id ? UI.cmpHide : null;
  const qz = UI.cmpQuiz && UI.cmpQuiz.id === c.id ? UI.cmpQuiz : null;
  let quiz = "";
  if (qz) { const x = qz.items[qz.i]; quiz = qz.i >= qz.items.length ? `<div class="callout ok"><h4>Chart quiz complete: ${qz.ok} of ${qz.items.length}</h4><button class="btn sm" data-a="cmpQuiz" data-x="${c.id}">Try again</button></div>` : `<div class="panel raised stack"><div class="spread"><span class="pill">Chart quiz</span><span class="small muted num">${qz.i + 1}/${qz.items.length}</span></div><p><b>${esc(x.label)}:</b> "${esc(x.text)}"</p><p class="small muted">Which condition does this describe?</p><div class="opts">${c.names.map((n, i) => { const cls = qz.pick == null ? "" : i === x.ans ? " right" : i === qz.pick ? " wrong" : ""; return `<button class="opt${cls}" data-a="cmpQPick" data-i="${i}" ${qz.pick != null ? "disabled" : ""}><span class="mk">${L(i)}</span><span>${esc(n)}</span></button>`; }).join("")}</div>${qz.pick != null ? `<div class="row" style="justify-content:flex-end"><button class="btn primary sm" data-a="cmpQNext">Next</button></div>` : ""}</div>`; }
  const vg = UI.cmpV && UI.cmpV.id === c.id ? UI.cmpV : { id: c.id, picks: {} };
  return head(c.names.map(esc).join(" vs "), "", bmBtn("cmp:" + c.id), crumbBack("All comparisons", "compare"))
   + `<div class="callout teal"><h4>How to tell them apart on HESI</h4>${esc(c.hesi)}</div>`
   + compareTable(c.names, c.rows, labels, hide)
   + `<div class="row"><button class="btn" data-a="cmpQuiz" data-x="${c.id}">${icon("quiz", 16)} Turn this chart into a quiz</button><span class="small muted">Hide a column, then tap any striped cell to check yourself.</span></div>` + quiz
   + `<div class="panel"><h3>Which one is it?</h3><div class="stack" style="margin-top:10px">${c.vign.map((v, vi) => { const p = vg.picks[vi]; return `<div class="stack-s"><p>${esc(v.t)}</p><div class="chips">${c.names.map((n, i) => `<button class="chip" data-a="cmpV" data-x="${c.id}" data-v="${vi}" data-i="${i}" aria-pressed="${p === i}" style="${p != null ? (i === v.ans ? "border-color:var(--ok);background:var(--ok-soft)" : p === i ? "border-color:var(--bad);background:var(--bad-soft)" : "") : ""}">${esc(n)}</button>`).join("")}</div></div>`; }).join("")}</div></div>`;
}
Object.assign(ACT, {
  cmpHide: el => { const id = (location.hash.match(/cmp-(.+)$/) || [])[1] || "custom"; const i = +el.dataset.x; if (UI.cmpHideId === id && UI.cmpHide === i) UI.cmpHide = null; else { UI.cmpHide = i; UI.cmpHideId = id; } UI.cmpPeek = []; rerender(); },
  cmpPeek: el => { UI.cmpPeek = (UI.cmpPeek || []).concat(el.dataset.x); rerender(); },
  cmpQuiz: el => { const c = DATA.cmp(el.dataset.x); const labels = c.drug ? window.CMP_DRUG_ROWS : window.CMP_ROWS; const items = []; c.rows.forEach((r, ri) => { const vals = r.map(x => x.trim()); r.forEach((cell, ci) => { if (cell && cell !== "—" && vals.filter(v => v === cell.trim()).length === 1) items.push({ label: labels[ri], text: cell, ans: ci }); }); }); UI.cmpQuiz = { id: c.id, items: shuffle(items).slice(0, 8), i: 0, ok: 0, pick: null }; logActivity(); rerender(); },
  cmpQPick: el => { const q = UI.cmpQuiz; q.pick = +el.dataset.i; if (q.pick === q.items[q.i].ans) q.ok++; rerender(); },
  cmpQNext: () => { UI.cmpQuiz.i++; UI.cmpQuiz.pick = null; rerender(); },
  cmpV: el => { if (!UI.cmpV || UI.cmpV.id !== el.dataset.x) UI.cmpV = { id: el.dataset.x, picks: {} }; UI.cmpV.picks[el.dataset.v] = +el.dataset.i; rerender(); }
});
function conditionIndex() { const out = []; window.COMPARE.filter(c => !c.drug).forEach(c => c.names.forEach((n, i) => out.push({ key: c.id + ":" + i, name: n, c, i }))); return out; }
function customCompareView() {
  const all = conditionIndex(); const sel = UI.custom || [];
  const chosen = sel.map(k => all.find(x => x.key === k)).filter(Boolean);
  return head("Build your own comparison", "Choose two or three conditions from anywhere in the library.", "", crumbBack("All comparisons", "compare"))
   + `<div class="panel"><div class="chips">${all.map(x => `<button class="chip" data-a="custPick" data-x="${x.key}" aria-pressed="${sel.includes(x.key)}">${esc(x.name)}</button>`).join("")}</div></div>`
   + (chosen.length >= 2 ? compareTable(chosen.map(x => x.name), window.CMP_ROWS.map((_, ri) => chosen.map(x => x.c.rows[ri][x.i])), window.CMP_ROWS, UI.cmpHideId === "custom" ? UI.cmpHide : null) : `<div class="empty">Pick at least two conditions.</div>`);
}
ACT.custPick = el => { const k = el.dataset.x; let s = UI.custom || []; s = s.includes(k) ? s.filter(x => x !== k) : s.concat(k).slice(-3); UI.custom = s; rerender(); };

/* =================== MEDICATIONS =================== */
ROUTES.meds = (arg) => {
  if (arg && arg.startsWith("med-")) { UI.medTab = "cards"; UI.medOpen = arg.slice(4); }
  const t = UI.medTab || "cards";
  let body = "";
  if (t === "cards") body = medCardsHTML();
  else if (t === "safety") body = medSafetyHTML();
  else if (t === "calc") body = calcHTML();
  else if (t === "cmp") body = `<div class="grid auto">${window.COMPARE.filter(c => c.drug).map(c => `<button class="card-link" data-a="go" data-x="compare" data-y="cmp-${c.id}"><span class="pill info">Pharmacology</span><h3>${c.names.map(esc).join(" vs ")}</h3><span class="small muted">${esc(c.hesi.slice(0, 120))}</span></button>`).join("")}</div>`;
  return head("Medication Mastery", "Each drug connects to what you assess, what you monitor, when you hold, and what you teach. Hold parameters shown are common examples — always follow the written order and facility policy.") + tabs("medTab", [["cards", "Drug cards"], ["safety", "Medication safety simulator"], ["calc", "Calculation lab"], ["cmp", "Drug comparisons"]], t) + body;
};
const has = v => v && String(v).trim() && String(v).trim() !== "—";
function drugCardBody(m, F) {
  const useHold = has(m.hold);
  const row = (lab, html, cls = "") => html ? `<div class="lvl ${cls}"><div>${lab}</div><div class="lt">${html}</div></div>` : "";
  const rows = [
    has(m.bw) ? row(labTag("unexpected", "Boxed warning"), emph(m.bw), "bw") : "",
    row(labTag("must", "HESI priority"), useHold ? emph(m.hold) : has(m.as) ? "<b>Before giving:</b> " + emph(m.as) : "", "must"),
    row(labTag("why", "How it works"), has(m.mech) ? emph(m.mech) : ""),
    row(labTag("define", "Used for"), has(m.ind) ? emph(m.ind) : ""),
    useHold ? row(labTag("assess", "Assess before giving"), has(m.as) ? emph(m.as) : "") : "",
    row(labTag("assess", "Monitor"), has(m.mon) && m.mon !== m.as ? emph(m.mon) : ""),
    row(labTag("teach"), has(m.teach) ? emph(m.teach) : "")
  ].join("");
  const se = `<div class="se"><div><h4>Common side effects</h4>${has(m.ae) ? emph(m.ae) : "<span class='muted'>None listed.</span>"}</div><div class="sev"><h4 style="color:var(--bad)">${icon("alert", 16, 2.2)}Serious: report immediately</h4>${has(m.sae) ? emph(m.sae) : "<span class='muted'>None listed.</span>"}</div></div>`;
  const nFields = F.filter(([, k]) => m[k]).length;
  return `<div class="lvls">${rows}</div>${se}${has(m.cue) ? memBox(emph(m.cue), "Memory trick") : ""}<details class="x"><summary>All drug details (${nFields} fields)</summary><div class="in"><div class="tablewrap"><table class="t"><tbody>${F.map(([l, k]) => m[k] ? `<tr><th style="width:240px">${l}</th><td>${esc(m[k])}</td></tr>` : "").join("")}</tbody></table></div></div></details>`;
}
function medCardsHTML() {
  const qx = (UI.medQ || "").toLowerCase(), cls = UI.medCls || "all";
  const classes = uniq(window.MEDS.map(m => m.cls));
  const list = window.MEDS.filter(m => (cls === "all" || m.cls === cls) && (!qx || (m.g + m.b + m.c + m.ind).toLowerCase().includes(qx)));
  const F = [["Common brand names", "b"], ["Class", "c"], ["Mechanism of action", "mech"], ["Clinical indications", "ind"], ["Expected therapeutic effects", "eff"], ["Common adverse effects", "ae"], ["Serious adverse effects", "sae"], ["FDA boxed warning", "bw"], ["Contraindications and major precautions", "ci"], ["Important drug interactions", "int"], ["Required nursing assessments", "as"], ["Vital signs and lab monitoring", "mon"], ["Administration considerations", "adm"], ["When to withhold and clarify", "hold"], ["Signs of toxicity or complications", "tox"], ["Antidote / reversal", "anti"], ["Patient teaching", "teach"]];
  return `<div class="row"><input type="search" id="medQ" placeholder="Search drugs (e.g., digoxin, ACE inhibitor)" value="${esc(UI.medQ || "")}" style="flex:1;min-width:220px"><div class="chips scroll"><button class="chip" data-a="medCls" data-x="all" aria-pressed="${cls === "all"}">All (${window.MEDS.length})</button>${classes.map(c => `<button class="chip" data-a="medCls" data-x="${esc(c)}" aria-pressed="${cls === c}">${esc(c)}</button>`).join("")}</div></div>
  <div class="stack">${list.map(m => { const open = UI.medOpen === slug(m.g); return `<details class="x drug" ${open ? "open" : ""} id="med-${slug(m.g)}"><summary><span class="dn">${esc(m.g)}</span>${m.b && m.b !== "—" ? `<span class="dtr">(${esc(m.b)})</span>` : ""}<span class="dcl"><span>${esc(m.c)}</span><span class="pill info">${esc(m.cls)}</span></span></summary><div class="in stack">${drugCardBody(m, F)}<div class="row">${bmBtn("med:" + m.g)}</div></div></details>`; }).join("") || `<div class="empty">No drugs match.</div>`}</div>`;
}
VIEW_AFTER.meds = () => { const i = $("#medQ"); if (i) { i.oninput = () => { UI.medQ = i.value; const pos = i.selectionStart; rerender(); const j = $("#medQ"); j.focus(); j.setSelectionRange(pos, pos); }; } if (UI.medOpen) { const d = document.getElementById("med-" + UI.medOpen); if (d) d.scrollIntoView({ block: "start" }); UI.medOpen = null; } };
ACT.medCls = el => { UI.medCls = el.dataset.x; rerender(); };
function medSafetyHTML() {
  const cur = UI.msId || window.MEDSIMS[0].id; const m = window.MEDSIMS.find(x => x.id === cur); const pickI = (UI.msPick || {})[cur];
  return `<p class="muted">Review the order and the client data, then choose what you would do. Every choice is explained.</p><div class="chips">${window.MEDSIMS.map(x => `<button class="chip" data-a="msPick" data-x="${x.id}" aria-pressed="${x.id === cur}">${esc(x.title)}${S.sims[x.id] ? " ✓" : ""}</button>`).join("")}</div>
  <div class="panel raised stack"><h2>${esc(m.title)}</h2><div class="tablewrap"><table class="t"><tbody><tr><th style="width:180px">Medication order</th><td><b>${esc(m.order)}</b></td></tr><tr><th>Client</th><td>${esc(m.pt)}</td></tr><tr><th>Vital signs</th><td>${esc(m.vit)}</td></tr><tr><th>Labs</th><td>${esc(m.labs)}</td></tr><tr><th>History and MAR</th><td>${esc(m.hx)}</td></tr></tbody></table></div>
   <h3>What will you do?</h3><div class="opts">${m.opts.map((o, i) => { const cls = pickI == null ? "" : i === m.key ? " right" : i === pickI ? " wrong" : ""; return `<button class="opt${cls}" data-a="msChoose" data-x="${cur}" data-i="${i}" ${pickI != null ? "disabled" : ""}><span class="mk">${L(i)}</span><span>${esc(o)}${pickI != null ? `<div class="small" style="margin-top:4px;color:var(--muted)">${esc(m.why[i])}</div>` : ""}</span></button>`; }).join("")}</div>
   ${pickI != null ? `<div class="callout ${pickI === m.key ? "ok" : "warn"}"><h4>${pickI === m.key ? "Safe decision" : "Safer decision: " + esc(m.opts[m.key])}</h4>High-alert safeguards: verify the right client, drug, dose, route, time, and documentation; use an independent double-check for high-alert drugs (insulin, heparin, opioids, potassium, magnesium) per policy; reconcile home medications at every transition.</div><div class="row"><button class="btn" data-a="msReset" data-x="${cur}">Try again</button></div>` : ""}</div>`;
}
Object.assign(ACT, {
  msPick: el => { UI.msId = el.dataset.x; rerender(); },
  msChoose: el => { UI.msPick = UI.msPick || {}; UI.msPick[el.dataset.x] = +el.dataset.i; const m = window.MEDSIMS.find(x => x.id === el.dataset.x); S.sims[m.id] = { last: +el.dataset.i === m.key ? 1 : 0, ts: Date.now() }; logActivity(); rerender(); },
  msReset: el => { delete UI.msPick[el.dataset.x]; rerender(); }
});

/* ----- Calculation lab: every answer is computed in code, not written by hand ----- */
const R = (x, d) => { const f = Math.pow(10, d); return Math.round(x * f + 1e-9) / f; };
const CALC_TYPES = [["tab", "Oral tablets"], ["liq", "Liquid medications"], ["wt", "Weight-based dosing"], ["peds", "Pediatric safe dose"], ["mlhr", "IV flow rate (mL/hr)"], ["gtt", "IV drip rate (gtt/min)"], ["hep", "Infusion pump (units/hr)"], ["mcg", "Weight-based infusion (mcg/kg/min)"], ["tube", "Enteral feeding rate"], ["conv", "Unit conversions"]];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function genCalc(type) {
  const P = (stem, ans, unit, dp, steps, rule) => ({ type, stem, ans: R(ans, dp), unit, dp, steps, rule });
  switch (type) {
    case "tab": { const have = pick([5, 10, 12.5, 20, 25, 50, 100, 250, 500]); const mult = pick([0.5, 1, 1.5, 2, 3]); const want = R(have * mult, 2);
      return P(`Order: ${want} mg PO. Available: ${have} mg tablets. How many tablets will you give?`, want / have, "tablet(s)", 1, [`Desired ÷ Have = ${want} mg ÷ ${have} mg/tablet`, `= ${R(want / have, 2)} tablet(s)`], "Tablets: round to the nearest half tablet only if the tablet is scored."); }
    case "liq": { const conc = pick([[125, 5], [250, 5], [100, 5], [40, 5], [10, 1], [2, 1], [50, 1]]); const want = pick([0.5, 0.75, 1, 1.25, 1.5, 2]) * conc[0]; const ml = want / conc[0] * conc[1];
      return P(`Order: ${want} mg PO. Available: ${conc[0]} mg per ${conc[1]} mL. How many mL will you give?`, ml, "mL", 1, [`(Desired ÷ Have) × Volume = (${want} mg ÷ ${conc[0]} mg) × ${conc[1]} mL`, `= ${R(ml, 2)} mL`], "Liquids: round to the nearest tenth of a mL."); }
    case "wt": { const lb = ri(110, 240), dose = pick([1, 1.5, 2, 5, 0.5]); const kg = R(lb / 2.2, 1); const mg = kg * dose;
      return P(`Order: ${dose} mg/kg IV. The client weighs ${lb} lb. How many mg will you give?`, mg, "mg", 1, [`${lb} lb ÷ 2.2 lb/kg = ${kg} kg (rounded to tenth)`, `${kg} kg × ${dose} mg/kg = ${R(mg, 2)} mg`], "Convert lb to kg first (2.2 lb = 1 kg), rounding kg to the tenth; then round the dose to the tenth."); }
    case "peds": { const kg = ri(8, 30), lo = pick([20, 25, 30, 40]), hi = lo + pick([10, 15, 20]); const freq = pick([[4, "q6h"], [3, "q8h"], [2, "q12h"]]); const maxDose = kg * hi / freq[0]; const minDose = kg * lo / freq[0];
      const order = R(Math.random() < .5 ? maxDose * pick([0.6, 0.8, 1]) : maxDose * pick([1.2, 1.5]), 0); const safe = order <= R(maxDose, 1) + 1e-9 && order >= R(minDose, 1) - 1e-9;
      return { type, stem: `A child weighs ${kg} kg. Safe range: ${lo}–${hi} mg/kg/day divided ${freq[1]}. Order: ${order} mg ${freq[1]}. What is the maximum safe single dose (mg)? Then decide if the order is safe.`, ans: R(maxDose, 1), unit: "mg per dose (max)", dp: 1, safe,
        steps: [`Daily range: ${kg} kg × ${lo} = ${kg * lo} mg/day to ${kg} kg × ${hi} = ${kg * hi} mg/day`, `Divided ${freq[1]} = ${freq[0]} doses/day → ${R(minDose, 1)}–${R(maxDose, 1)} mg per dose`, `Ordered ${order} mg per dose → ${safe ? "within the safe range" : order > maxDose ? "ABOVE the safe range: hold and clarify" : "BELOW the range: clarify (may be ineffective)"}`], rule: "Compare the ordered single dose against the per-dose range; clarify any dose outside it." }; }
    case "mlhr": { const v = pick([250, 500, 1000, 100, 50]), hr = pick([1, 2, 4, 6, 8, 10, 12]);
      return P(`Infuse ${v} mL over ${hr} hour${hr > 1 ? "s" : ""} by pump. Set the rate in mL/hr.`, v / hr, "mL/hr", 0, [`${v} mL ÷ ${hr} hr = ${R(v / hr, 2)} mL/hr`], "Most pumps: round to the nearest whole mL/hr (some pumps allow tenths — follow the device)."); }
    case "gtt": { const v = pick([100, 250, 500, 1000]), min = pick([30, 60, 120, 240, 480]), df = pick([10, 15, 20, 60]);
      return P(`Infuse ${v} mL over ${min} minutes with tubing of ${df} gtt/mL. Drip rate in gtt/min?`, v * df / min, "gtt/min", 0, [`(Volume × drop factor) ÷ minutes = (${v} mL × ${df} gtt/mL) ÷ ${min} min`, `= ${R(v * df / min, 2)} gtt/min`], "Drops can't be split: round to the nearest whole drop."); }
    case "hep": { const bag = pick([[25000, 250], [25000, 500], [20000, 500], [10000, 250]]); const u = pick([800, 1000, 1200, 1300, 1500, 1600, 1800]); const c = bag[0] / bag[1];
      return P(`Heparin ${bag[0].toLocaleString()} units in ${bag[1]} mL. Order: ${u.toLocaleString()} units/hr. Pump rate in mL/hr?`, u / c, "mL/hr", 1, [`Concentration = ${bag[0].toLocaleString()} units ÷ ${bag[1]} mL = ${R(c, 2)} units/mL`, `${u} units/hr ÷ ${R(c, 2)} units/mL = ${R(u / c, 2)} mL/hr`], "Round to the tenth unless the pump accepts only whole numbers. Heparin is high-alert: independent double-check."); }
    case "mcg": { const kg = ri(55, 110), dose = pick([2, 3, 5, 8, 10]), drug = pick([[400, 250], [800, 250], [200, 50]]); const conc = drug[0] * 1000 / drug[1]; const mlhr = dose * kg * 60 / conc;
      return P(`Order: ${dose} mcg/kg/min. Client: ${kg} kg. Bag: ${drug[0]} mg in ${drug[1]} mL. Pump rate in mL/hr?`, mlhr, "mL/hr", 1, [`Concentration: ${drug[0]} mg × 1,000 = ${drug[0] * 1000} mcg ÷ ${drug[1]} mL = ${R(conc, 2)} mcg/mL`, `Dose per hour: ${dose} mcg × ${kg} kg × 60 min = ${dose * kg * 60} mcg/hr`, `${dose * kg * 60} ÷ ${R(conc, 2)} = ${R(mlhr, 2)} mL/hr`], "Round to the tenth of a mL/hr."); }
    case "tube": { const vol = pick([960, 1200, 1440, 1500, 1800]), hr = pick([12, 16, 20, 24]);
      return P(`Enteral formula: ${vol} mL to infuse continuously over ${hr} hours. Pump rate in mL/hr?`, vol / hr, "mL/hr", 0, [`${vol} mL ÷ ${hr} hr = ${R(vol / hr, 2)} mL/hr`], "Round to the nearest whole mL/hr."); }
    case "conv": { const k = pick(["lbkg", "kglb", "mgmcg", "gmg", "ozml", "tspml", "mlL"]);
      if (k === "lbkg") { const lb = ri(90, 260); return P(`Convert ${lb} lb to kg.`, lb / 2.2, "kg", 1, [`${lb} ÷ 2.2 = ${R(lb / 2.2, 2)} kg`], "Round to the tenth."); }
      if (k === "kglb") { const kg = ri(3, 120); return P(`Convert ${kg} kg to lb.`, kg * 2.2, "lb", 1, [`${kg} × 2.2 = ${R(kg * 2.2, 2)} lb`], "Round to the tenth."); }
      if (k === "mgmcg") { const mg = pick([0.125, 0.25, 0.5, 0.05, 1.5]); return P(`Convert ${mg} mg to mcg.`, mg * 1000, "mcg", 0, [`${mg} mg × 1,000 mcg/mg = ${mg * 1000} mcg`], "1 mg = 1,000 mcg."); }
      if (k === "gmg") { const g = pick([0.5, 1, 1.5, 2, 0.25]); return P(`Convert ${g} g to mg.`, g * 1000, "mg", 0, [`${g} g × 1,000 mg/g = ${g * 1000} mg`], "1 g = 1,000 mg."); }
      if (k === "ozml") { const oz = pick([2, 4, 6, 8, 10, 12]); return P(`A client drank ${oz} oz of juice. How many mL?`, oz * 30, "mL", 0, [`${oz} oz × 30 mL/oz = ${oz * 30} mL`], "1 oz = 30 mL."); }
      if (k === "tspml") { const t = pick([0.5, 1, 1.5, 2, 3]); return P(`Convert ${t} tsp to mL.`, t * 5, "mL", 1, [`${t} tsp × 5 mL/tsp = ${t * 5} mL`], "1 tsp = 5 mL; 1 tbsp = 15 mL."); }
      const L2 = pick([0.25, 0.5, 1.5, 2]); return P(`Convert ${L2} L to mL.`, L2 * 1000, "mL", 0, [`${L2} L × 1,000 mL/L = ${L2 * 1000} mL`], "1 L = 1,000 mL."); }
  }
}
function checkCalc(p, input, safePick) {
  const v = parseFloat(String(input).replace(/[^0-9.\-]/g, "")); if (isNaN(v)) return null;
  const okNum = Math.abs(R(v, p.dp) - p.ans) < 1e-9 && Math.abs(v - p.ans) <= Math.pow(10, -p.dp) / 2 + 1e-9;
  if (p.type === "peds") return okNum && safePick === p.safe;
  return okNum;
}
function calcHTML() {
  const type = UI.calcType || "tab"; if (!UI.calc || UI.calc.type !== type) UI.calc = genCalc(type);
  const p = UI.calc, res = UI.calcRes;
  return `<p class="muted">Problems are generated with new numbers each time, and every answer is calculated by the app — never typed in by hand. Steps show dimensional analysis and the rounding rule.</p>
   <div class="chips">${CALC_TYPES.map(([k, l]) => `<button class="chip" data-a="calcType" data-x="${k}" aria-pressed="${type === k}">${l}</button>`).join("")}</div>
   <div class="panel raised stack"><span class="pill info">${esc((CALC_TYPES.find(x => x[0] === type) || [])[1])}</span><h2 style="font-size:1.25rem">${esc(p.stem)}</h2>
    <div class="row"><input type="text" inputmode="decimal" id="calcIn" placeholder="Your answer" value="${esc(res ? res.input : "")}" style="width:160px" ${res ? "disabled" : ""}><span class="muted">${esc(p.unit)}</span>
     ${p.type === "peds" ? `<span class="chips"><button class="chip" data-a="calcSafe" data-x="1" aria-pressed="${UI.calcSafe === true}">Order is safe</button><button class="chip" data-a="calcSafe" data-x="0" aria-pressed="${UI.calcSafe === false}">Hold and clarify</button></span>` : ""}
     ${res ? "" : `<button class="btn primary" data-a="calcCheck">Check</button>`}</div>
    ${res ? `<div class="callout ${res.ok ? "ok" : "bad"}"><h4>${res.ok ? "Correct" : "Not quite — correct answer: " + p.ans + " " + esc(p.unit) + (p.type === "peds" ? (p.safe ? " (order is safe)" : " (hold and clarify)") : "")}</h4><ol style="margin:6px 0 0;padding-left:1.2rem">${p.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol><p class="small" style="margin-top:8px"><b>Rounding:</b> ${esc(p.rule)}</p></div><div class="row"><button class="btn primary" data-a="calcNew">New problem ${icon("right")}</button></div>` : ""}</div>`;
}
Object.assign(ACT, {
  calcType: el => { UI.calcType = el.dataset.x; UI.calc = null; UI.calcRes = null; UI.calcSafe = null; rerender(); },
  calcSafe: el => { UI.calcSafe = el.dataset.x === "1"; rerender(); },
  calcCheck: () => { const v = $("#calcIn").value; if (!v.trim()) { toast("Enter an answer first."); return; } if (UI.calc.type === "peds" && UI.calcSafe == null) { toast("Also choose whether the order is safe."); return; } const ok = checkCalc(UI.calc, v, UI.calcSafe); if (ok === null) { toast("Enter a number."); return; } UI.calcRes = { input: v, ok }; const d = dayRec(); d.q++; if (ok) d.ok++; logActivity(); rerender(); },
  calcNew: () => { UI.calc = genCalc(UI.calcType || "tab"); UI.calcRes = null; UI.calcSafe = null; rerender(); }
});

/* =================== LABS =================== */
ROUTES.labs = (arg) => {
  if (arg && arg.startsWith("lab-")) { UI.labTab = "lib"; UI.labOpen = arg.slice(4); }
  const t = UI.labTab || "lib"; let body = "";
  if (t === "lib") body = labLibHTML(); else if (t === "sets") body = labSetsHTML(); else body = abgHTML();
  return head("Laboratory Values", "Reference ranges with what they mean and what the nurse does. Ranges vary by lab, assay, age, and pregnancy; they are not critical-value thresholds, which each facility's lab sets.") + tabs("labTab", [["lib", "Reference library"], ["sets", "Interpret a lab set"], ["abg", "ABG interpreter"]], t) + body;
};
function labCardBody(l) {
  const row = (lab, html, cls = "") => html ? `<div class="lvl ${cls}"><div>${lab}</div><div class="lt">${html}</div></div>` : "";
  return `<div class="lvls">${[
    row(labTag("must", "Normal range"), `<span class="num" style="font-size:1.1rem">${esc(l.r)}</span>${has(l.pop) ? `<div class="small muted">${esc(l.pop)}</div>` : ""}`, "must"),
    row(labTag("define", "What it measures"), has(l.m) ? emph(l.m) : ""),
    row(labTag("unexpected", "Too high"), has(l.hi) ? emph(l.hi) : ""),
    row(labTag("unexpected", "Too low"), has(l.lo) ? emph(l.lo) : ""),
    row(labTag("assess", "Recognize"), has(l.man) ? emph(l.man) : ""),
    row(labTag("assess"), has(l.as) ? emph(l.as) : ""),
    row(labTag("prio", "Act and escalate"), has(l.act) ? emph(l.act) : "")
  ].join("")}</div>`;
}
function labLibHTML() {
  const g = UI.labG || "all", qx = (UI.labQ || "").toLowerCase(); const groups = uniq(window.LABS.map(l => l.g));
  const list = window.LABS.filter(l => (g === "all" || l.g === g) && (!qx || (l.n + l.a + l.hi + l.lo).toLowerCase().includes(qx)));
  const F = [["Reference range", "r"], ["Population", "pop"], ["What it measures", "m"], ["Causes of increased values", "hi"], ["Causes of decreased values", "lo"], ["Clinical manifestations", "man"], ["Related medications and diseases", "rel"], ["Priority nursing assessments", "as"], ["Nursing interventions and escalation", "act"]];
  return `<div class="row"><input type="search" id="labQ" placeholder="Search labs (e.g., potassium, INR)" value="${esc(UI.labQ || "")}" style="flex:1;min-width:220px"></div><div class="chips scroll"><button class="chip" data-a="labG" data-x="all" aria-pressed="${g === "all"}">All (${window.LABS.length})</button>${groups.map(x => `<button class="chip" data-a="labG" data-x="${esc(x)}" aria-pressed="${g === x}">${esc(x)}</button>`).join("")}</div>
  <div class="stack">${list.map(l => `<details class="x drug" id="lab-${slug(l.n)}" ${UI.labOpen === slug(l.n) ? "open" : ""}><summary><span class="dn">${esc(l.n)}</span>${has(l.a) && l.a !== l.n ? `<span class="dtr">(${esc(l.a)})</span>` : ""}<span class="dcl"><span class="num" style="color:var(--ink)">${esc(l.r)}</span><span class="pill teal">${esc(l.g)}</span></span></summary><div class="in stack">${labCardBody(l)}<details class="x"><summary>All lab details</summary><div class="in"><div class="tablewrap"><table class="t"><tbody>${F.map(([lab, k]) => l[k] ? `<tr><th style="width:240px">${lab}</th><td>${esc(l[k])}</td></tr>` : "").join("")}<tr><th>Source basis</th><td class="small">Standard nursing laboratory references; confirm with your facility's reference intervals.</td></tr></tbody></table></div></div></details><div class="row">${bmBtn("lab:" + l.n)}</div></div></details>`).join("")}</div>`;
}
VIEW_AFTER.labs = () => { const i = $("#labQ"); if (i) i.oninput = () => { UI.labQ = i.value; const pos = i.selectionStart; rerender(); const j = $("#labQ"); j.focus(); j.setSelectionRange(pos, pos); }; if (UI.labOpen) { const d = document.getElementById("lab-" + UI.labOpen); if (d) d.scrollIntoView({ block: "start" }); UI.labOpen = null; } abgWire(); };
ACT.labG = el => { UI.labG = el.dataset.x; rerender(); };
function mcBlock(prefix, id, qs, store) {
  return qs.map((x, qi) => { const p = (store[id] || {})[qi]; return `<div class="stack-s" style="margin-top:12px"><b>${esc(x.q)}</b><div class="opts">${x.opts.map((o, i) => { const cls = p == null ? "" : i === x.key ? " right" : i === p ? " wrong" : ""; return `<button class="opt${cls}" data-a="${prefix}" data-x="${id}" data-q="${qi}" data-i="${i}" ${p != null ? "disabled" : ""}><span class="mk">${L(i)}</span><span>${esc(o)}</span></button>`; }).join("")}</div>${p != null ? `<p class="small"><b>${p === x.key ? "Correct." : "Best answer: " + esc(x.opts[x.key]) + "."}</b> ${esc(x.why)}</p>` : ""}</div>`; }).join("");
}
function labSetsHTML() {
  UI.lsPick = UI.lsPick || {};
  return window.LABSETS.map(s => `<div class="panel"><h3>${esc(s.title)}</h3><p class="small muted">${esc(s.ctx)}</p><div class="tablewrap" style="margin-top:10px"><table class="t"><thead><tr><th>Test</th><th>Result</th><th>Flag</th></tr></thead><tbody>${s.labs.map(([n, v, f]) => `<tr><td>${esc(n)}</td><td class="num"><b>${esc(v)}</b></td><td>${f ? `<span class="pill ${f === "high" ? "bad" : "warn"}">${f === "high" ? "High" : "Low"}</span>` : `<span class="pill">Within range</span>`}</td></tr>`).join("")}</tbody></table></div>${mcBlock("lsPick", s.id, s.qs, UI.lsPick)}</div>`).join("");
}
ACT.lsPick = el => { const s = UI.lsPick; s[el.dataset.x] = s[el.dataset.x] || {}; s[el.dataset.x][el.dataset.q] = +el.dataset.i; logActivity(); rerender(); };
function interpretABG(pH, co2, hco3) {
  const steps = []; let res;
  const pHs = pH < 7.35 ? "acid" : pH > 7.45 ? "base" : "norm";
  const co2s = co2 > 45 ? "acid" : co2 < 35 ? "base" : "norm";
  const hs = hco3 < 22 ? "acid" : hco3 > 26 ? "base" : "norm";
  steps.push(`1. pH ${pH}: ${pHs === "acid" ? "below 7.35 → acidosis" : pHs === "base" ? "above 7.45 → alkalosis" : "7.35–7.45 → normal range"}`);
  steps.push(`2. PaCO₂ ${co2} mm Hg: ${co2s === "acid" ? "above 45 → acid (respiratory)" : co2s === "base" ? "below 35 → base (respiratory)" : "normal (35–45)"}`);
  steps.push(`3. HCO₃⁻ ${hco3} mEq/L: ${hs === "acid" ? "below 22 → acid (metabolic)" : hs === "base" ? "above 26 → base (metabolic)" : "normal (22–26)"}`);
  if (pHs === "norm") {
    if (co2s === "norm" && hs === "norm") { res = "Normal"; steps.push("4. All values normal."); }
    else if (co2s !== "norm" && hs !== "norm" && co2s !== hs) { const side = pH < 7.40 ? "acid" : "base"; const prim = co2s === side ? "Respiratory" : "Metabolic"; res = `${prim} ${side === "acid" ? "acidosis" : "alkalosis"}, fully compensated`; steps.push(`4. pH is normal but on the ${side === "acid" ? "acid (< 7.40)" : "alkaline (> 7.40)"} side, and both PaCO₂ and HCO₃⁻ are abnormal in opposite directions → full compensation. The value matching the pH side (${prim.toLowerCase()}) is the primary problem.`); }
    else { res = "Mixed or uninterpretable pattern — compare with the clinical picture"; steps.push("4. Pattern doesn't fit a single compensated disorder."); }
  } else {
    const resp = co2s === pHs, met = hs === pHs;
    if (resp && met) { res = `Combined respiratory and metabolic ${pHs === "acid" ? "acidosis" : "alkalosis"}`; steps.push("4. Both components match the pH: mixed disorder."); }
    else if (resp || met) { const prim = resp ? "Respiratory" : "Metabolic"; const other = resp ? hs : co2s; const comp = other === "norm" ? "uncompensated" : "partially compensated"; res = `${prim} ${pHs === "acid" ? "acidosis" : "alkalosis"}, ${comp}`;
      steps.push(`4. ROME: ${prim === "Respiratory" ? "Respiratory = Opposite (pH and PaCO₂ move in opposite directions)" : "Metabolic = Equal (pH and HCO₃⁻ move in the same direction)"} → primary ${prim.toLowerCase()}.`);
      steps.push(`5. The other value is ${other === "norm" ? "normal → no compensation yet (uncompensated)" : "moving the opposite way to correct pH while pH is still abnormal → partial compensation"}.`); }
    else { res = "Pattern doesn't match the pH — recheck values"; steps.push("4. Neither component explains the pH."); }
  }
  return { res, steps };
}
function abgHTML() {
  const v = UI.abg || { pH: 7.30, co2: 58, hco3: 25 }; const out = interpretABG(+v.pH, +v.co2, +v.hco3);
  const dr = UI.abgDrill || (UI.abgDrill = { i: 0, pick: null, ok: 0, order: shuffle(window.ABG_DRILLS.map((_, i) => i)) }); const d = window.ABG_DRILLS[dr.order[dr.i % dr.order.length]];
  const choices = ["Respiratory acidosis, uncompensated", "Respiratory acidosis, partially compensated", "Respiratory acidosis, fully compensated", "Respiratory alkalosis, uncompensated", "Metabolic acidosis, uncompensated", "Metabolic acidosis, partially compensated", "Metabolic alkalosis, uncompensated", "Metabolic alkalosis, partially compensated", "Normal"];
  const correct = interpretABG(d.pH, d.co2, d.hco3).res;
  return `<div class="grid g2"><div class="panel raised stack"><h3>Stepwise interpreter</h3><p class="small muted">Enter values to see each step of the interpretation.</p><div class="row"><label class="field">pH<input type="number" step="0.01" id="abgPH" value="${v.pH}" style="width:110px"></label><label class="field">PaCO₂<input type="number" step="1" id="abgCO2" value="${v.co2}" style="width:110px"></label><label class="field">HCO₃⁻<input type="number" step="1" id="abgHCO3" value="${v.hco3}" style="width:110px"></label></div>
     <div class="callout teal"><h4>${esc(out.res)}</h4><div class="small stack-s" style="margin-top:6px">${out.steps.map(s => `<div>${esc(s)}</div>`).join("")}</div></div><p class="tiny muted">Normal: pH 7.35–7.45 · PaCO₂ 35–45 mm Hg · HCO₃⁻ 22–26 mEq/L. Always interpret with the client's condition and PaO₂/SpO₂.</p></div>
    <div class="panel raised stack"><div class="spread"><h3>ABG practice</h3><span class="small muted num">${dr.ok} correct</span></div><p>${esc(d.ctx)}</p><div class="vmon" style="grid-template-columns:repeat(3,1fr)"><div class="cell"><div class="k">pH</div><div class="v">${d.pH.toFixed(2)}</div></div><div class="cell"><div class="k">PaCO₂</div><div class="v">${d.co2}</div></div><div class="cell"><div class="k">HCO₃⁻</div><div class="v">${d.hco3}</div></div></div>
     <select id="abgPick" ${dr.pick != null ? "disabled" : ""}><option value="">Choose an interpretation…</option>${choices.map(c => `<option ${dr.pick === c ? "selected" : ""}>${c}</option>`).join("")}</select>
     ${dr.pick == null ? `<button class="btn primary" data-a="abgCheck">Check</button>` : `<div class="callout ${dr.pick === correct ? "ok" : "bad"}"><h4>${dr.pick === correct ? "Correct" : "Answer: " + esc(correct)}</h4><div class="small">${interpretABG(d.pH, d.co2, d.hco3).steps.map(esc).join("<br>")}</div></div><button class="btn primary" data-a="abgNext">Next ABG</button>`}</div></div>`;
}
function abgWire() { ["abgPH", "abgCO2", "abgHCO3"].forEach(id => { const el = $("#" + id); if (el) el.onchange = () => { UI.abg = { pH: $("#abgPH").value, co2: $("#abgCO2").value, hco3: $("#abgHCO3").value }; rerender(); }; }); }
Object.assign(ACT, {
  abgCheck: () => { const v = $("#abgPick").value; if (!v) { toast("Choose an interpretation."); return; } const dr = UI.abgDrill; dr.pick = v; const d = window.ABG_DRILLS[dr.order[dr.i % dr.order.length]]; if (v === interpretABG(d.pH, d.co2, d.hco3).res) dr.ok++; logActivity(); rerender(); },
  abgNext: () => { UI.abgDrill.i++; UI.abgDrill.pick = null; rerender(); }
});
