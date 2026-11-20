/* Views part 2: Vital Signs, Skills, Teaching, Simulator, Priorities, Assessment Lab, Question Bank, Mock Exams, Analytics. */
"use strict";

/* =================== VITAL SIGNS =================== */
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const RHYTHMS = [
 { id: "nsr", name: "Normal sinus rhythm", rate: "60–100", reg: "Regular", p: "Upright P before every QRS", act: "No intervention; correlate with the client." },
 { id: "brady", name: "Sinus bradycardia", rate: "< 60", reg: "Regular", p: "Normal P before every QRS", act: "Assess for symptoms (dizziness, hypotension, confusion); review drugs (beta blockers, digoxin); report. Atropine per order if symptomatic." },
 { id: "tachy", name: "Sinus tachycardia", rate: "> 100", reg: "Regular", p: "Normal P (may merge with T at fast rates)", act: "Find and treat the cause: pain, fever, hypovolemia, hypoxia, anxiety, bleeding." },
 { id: "afib", name: "Atrial fibrillation", rate: "Variable", reg: "Irregularly irregular", p: "No identifiable P waves; wavy baseline", act: "Check apical pulse and tolerance; stroke risk → anticoagulation per order; rate/rhythm control per order." },
 { id: "vtach", name: "Ventricular tachycardia", rate: "~150–250", reg: "Regular", p: "None; wide, bizarre QRS", act: "Check responsiveness and pulse immediately. No pulse: call a code, start CPR, defibrillate per ACLS. With pulse: call for help, oxygen, prepare per protocol." },
 { id: "vfib", name: "Ventricular fibrillation", rate: "Not measurable", reg: "Chaotic", p: "None", act: "Pulseless: call a code, start CPR, defibrillate as soon as available." },
 { id: "asys", name: "Asystole", rate: "None", reg: "Flat", p: "None", act: "Confirm in a second lead, check the client and leads; CPR and epinephrine per ACLS. Not shockable." }
];
function ecgSVG(id, seed = 7) {
  const W = 720, H = 130, dur = 6, pps = W / dur, rnd = seeded(seed + id.length * 31);
  const g = (t, m, s, a) => a * Math.exp(-((t - m) ** 2) / (2 * s * s));
  const beat = (t, sc = 1) => g(t, .10 * sc, .022 * sc, .13) + g(t, .2 * sc, .007, -.12) + g(t, .225 * sc, .010, 1) + g(t, .25 * sc, .009, -.27) + g(t, .42 * sc, .04 * sc, .28);
  let beats = [], t = .2;
  const rr = { nsr: () => .8, brady: () => 1.35, tachy: () => .47, afib: () => .42 + rnd() * .55 }[id];
  if (rr) while (t < dur) { beats.push(t); t += rr(); }
  const y = tt => {
    if (id === "vtach") return .85 * Math.sin(2 * Math.PI * tt / .32) * (0.9 + .1 * Math.sin(tt)) - .1;
    if (id === "vfib") return .35 * Math.sin(2 * Math.PI * tt * 4.3 + Math.sin(tt * 1.7) * 2) + .22 * Math.sin(2 * Math.PI * tt * 6.1) * Math.sin(tt * .9) + .1 * Math.sin(tt * 13);
    if (id === "asys") return .02 * Math.sin(tt * 2.1);
    let v = id === "afib" ? .045 * Math.sin(tt * 37) + .03 * Math.sin(tt * 53 + 1) : 0;
    const sc = id === "tachy" ? .8 : 1;
    for (const b of beats) { const d = tt - b + .225 * sc; if (d > -0.05 && d < .7) v += id === "afib" ? beat(d, sc) - g(d, .10, .022, .13) : beat(d, sc); }
    return v;
  };
  let d = ""; for (let px = 0; px <= W; px += 1.5) { const yy = H * .68 - y(px / pps) * H * .55; d += (px ? "L" : "M") + px.toFixed(1) + " " + yy.toFixed(1); }
  let grid = ""; for (let x = 0; x <= W; x += 24) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#E9A79C" stroke-width="${x % 120 === 0 ? 1 : .4}" opacity=".7"/>`; for (let yy = 0; yy <= H; yy += 24) grid += `<line x1="0" y1="${yy}" x2="${W}" y2="${yy}" stroke="#E9A79C" stroke-width=".4" opacity=".7"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="strip" role="img" aria-label="Educational illustration of ${esc((RHYTHMS.find(r => r.id === id) || {}).name)}">${grid}<path d="${d}" fill="none" stroke="#1B2B3A" stroke-width="1.8"/></svg>`;
}
function fhrSVG(type) {
  const W = 720, H = 240, mins = 10, ppm = W / mins; const rnd = seeded(type.length * 97);
  const uc = m => [2, 5, 8].reduce((a, c) => a + Math.exp(-((m - c) ** 2) / (2 * .32 * .32)), 0);
  const fhr = m => { let v = 142 + 2.5 * Math.sin(m * 9) + 1.5 * Math.sin(m * 23);
    if (type === "early") v -= 18 * uc(m);
    if (type === "late") v -= 20 * [2, 5, 8].reduce((a, c) => a + Math.exp(-((m - c - .45) ** 2) / (2 * .3 * .3)), 0);
    if (type === "variable") v -= [1.3, 4.1, 7.6].reduce((a, c, i) => a + (45 + i * 8) * Math.max(0, 1 - Math.abs(m - c) / .16), 0);
    return v; };
  const yF = v => 12 + (175 - v) / 85 * 120, yU = v => 228 - v * 70;
  let pf = "", pu = ""; for (let px = 0; px <= W; px += 2) { const m = px / ppm; pf += (px ? "L" : "M") + px + " " + yF(fhr(m)).toFixed(1); pu += (px ? "L" : "M") + px + " " + yU(uc(m)).toFixed(1); }
  const lbl = { early: "Early: mirrors the contraction (head compression)", variable: "Variable: abrupt drops, timing varies (cord compression)", late: "Late: starts after the peak, recovers after the contraction ends (placental insufficiency)" }[type];
  return `<figure class="panel flat" style="margin:0"><figcaption class="small" style="margin-bottom:6px"><b>${esc(lbl)}</b></figcaption><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Educational illustration of ${type} decelerations"><rect x="0" y="0" width="${W}" height="140" fill="var(--surface-2)"/><rect x="0" y="150" width="${W}" height="85" fill="var(--surface-2)"/>${[110, 160].map(v => `<line x1="0" x2="${W}" y1="${yF(v)}" y2="${yF(v)}" stroke="var(--line)" stroke-dasharray="4 4"/><text x="6" y="${yF(v) - 3}" font-size="12" fill="var(--muted)">${v}</text>`).join("")}<path d="${pf}" fill="none" stroke="var(--bad)" stroke-width="2"/><path d="${pu}" fill="none" stroke="var(--teal)" stroke-width="2"/><text x="${W - 6}" y="20" text-anchor="end" font-size="12" fill="var(--muted)">FHR (bpm)</text><text x="${W - 6}" y="165" text-anchor="end" font-size="12" fill="var(--muted)">Contractions</text></svg></figure>`;
}
ROUTES.vitals = () => {
  const t = UI.vTab || "ref"; let body = "";
  if (t === "ref") { const gid = UI.vGroup || "adult"; const gr = window.VITALS.groups.find(g => g.id === gid);
    body = `<div class="chips">${window.VITALS.groups.map(g => `<button class="chip" data-a="vGroup" data-x="${g.id}" aria-pressed="${g.id === gid}">${esc(g.name)}</button>`).join("")}</div><div class="tablewrap"><table class="t"><thead><tr><th style="width:220px">Measurement</th><th>${esc(gr.name)}</th></tr></thead><tbody>${gr.rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div><div class="callout warn"><h4>Pediatric blood pressure</h4>${esc(window.VITALS.pedsRule)}</div><p class="small muted">${esc(window.VITALS.note)}</p>`; }
  else if (t === "mon") { const cur = UI.vMon || window.MONITORS[0].id; const m = window.MONITORS.find(x => x.id === cur); UI.vmPick = UI.vmPick || {};
    body = `<div class="chips">${window.MONITORS.map(x => `<button class="chip" data-a="vMon" data-x="${x.id}" aria-pressed="${x.id === cur}">${esc(x.title)}</button>`).join("")}</div><div class="panel raised stack"><h3>${esc(m.title)}</h3><p class="muted">${esc(m.ctx)}</p><div class="vmon">${[["HR", m.v.HR, "/min", "c-green"], ["BP", m.v.BP, "mm Hg", "c-bad"], ["RR", m.v.RR, "/min", "c-amber"], ["SpO₂", m.v.SpO2, "%", "c-cyan"], ["Temp", m.v.T, "", "c-violet"]].map(([k, v, u, c]) => `<div class="cell"><div class="k">${k} ${u}</div><div class="v ${c === "c-bad" ? "" : c}" ${c === "c-bad" ? 'style="color:#FF8A80"' : ""}>${esc(v)}</div></div>`).join("")}</div><p><b>At the bedside:</b> ${esc(m.extra)}</p>${mcBlock("vmPick", m.id, m.qs, UI.vmPick)}<p class="small muted">Vital signs point to a problem; they rarely confirm a diagnosis alone. Assess, escalate, and reassess.</p></div>`; }
  else if (t === "trend") { UI.vtPick = UI.vtPick || {}; body = window.TRENDS.map(tr => `<div class="panel stack"><h3>${esc(tr.title)}</h3>${trendChart(tr)}${mcBlock("vtPick", tr.id, [{ q: tr.q, opts: tr.opts, key: tr.key, why: tr.why }], UI.vtPick)}</div>`).join(""); }
  else if (t === "ecg") { const ord = UI.ecgOrd || (UI.ecgOrd = shuffle(RHYTHMS.map(r => r.id))); const qi = UI.ecgI || 0; const cur = RHYTHMS.find(r => r.id === ord[qi % ord.length]); const pk = UI.ecgPick;
    body = `<p class="muted">Educational illustrations drawn by the app to show each rhythm's pattern; they're not real tracings. Always assess the client, not just the monitor.</p><div class="panel raised stack"><div class="spread"><h3>Name this rhythm</h3><span class="small muted num">${qi + 1} / ${ord.length}</span></div>${ecgSVG(cur.id, qi)}<div class="chips">${RHYTHMS.map(r => `<button class="chip" data-a="ecgPick" data-x="${r.id}" ${pk ? "disabled" : ""} style="${pk ? (r.id === cur.id ? "border-color:var(--ok);background:var(--ok-soft)" : r.id === pk ? "border-color:var(--bad);background:var(--bad-soft)" : "") : ""}">${esc(r.name)}</button>`).join("")}</div>${pk ? `<div class="callout ${pk === cur.id ? "ok" : "bad"}"><h4>${esc(cur.name)}</h4><div class="small">Rate ${esc(cur.rate)} · ${esc(cur.reg)} · ${esc(cur.p)}</div><p class="small" style="margin-top:6px"><b>Nurse:</b> ${esc(cur.act)}</p></div><button class="btn primary" data-a="ecgNext">Next strip</button>` : ""}</div>
    <details class="x"><summary>All rhythms side by side</summary><div class="in stack">${RHYTHMS.map(r => `<div><b>${esc(r.name)}</b> <span class="small muted">· ${esc(r.rate)} · ${esc(r.reg)}</span>${ecgSVG(r.id, 3)}<p class="small"><b>Nurse:</b> ${esc(r.act)}</p></div>`).join("")}</div></details>`; }
  else if (t === "fhr") body = `<p class="muted">Educational illustrations of fetal heart rate patterns over 10 minutes (top: FHR; bottom: contractions). Remember VEAL CHOP.</p>${["early", "variable", "late"].map(fhrSVG).join("")}<button class="btn" data-a="go" data-x="compare" data-y="cmp-decels">Open the deceleration comparison</button>`;
  return head("Vital Signs", "Age-specific ranges, bedside monitor practice, and trends — because one number rarely tells the story.") + tabs("vTab", [["ref", "Reference by age"], ["mon", "Monitor practice"], ["trend", "Trends: what changed?"], ["ecg", "ECG rhythms"], ["fhr", "Fetal heart rate"]], t) + body;
};
Object.assign(ACT, {
  vGroup: el => { UI.vGroup = el.dataset.x; rerender(); }, vMon: el => { UI.vMon = el.dataset.x; rerender(); },
  vmPick: el => { const s = UI.vmPick; s[el.dataset.x] = s[el.dataset.x] || {}; s[el.dataset.x][el.dataset.q] = +el.dataset.i; logActivity(); rerender(); },
  vtPick: el => { const s = UI.vtPick; s[el.dataset.x] = s[el.dataset.x] || {}; s[el.dataset.x][el.dataset.q] = +el.dataset.i; logActivity(); rerender(); },
  ecgPick: el => { UI.ecgPick = el.dataset.x; logActivity(); rerender(); }, ecgNext: () => { UI.ecgI = (UI.ecgI || 0) + 1; UI.ecgPick = null; rerender(); }
});

/* =================== SKILLS =================== */
ROUTES.skills = (arg) => {
  const id = arg && arg.startsWith("proc-") ? arg.slice(5) : null; const p = id && window.PROCEDURES.find(x => x.id === id);
  if (!p) return head("Skills & Procedures", "Step-by-step procedures with the safety checks, infection prevention, and when to stop. Practice and perform procedures only within your training, supervision, state scope, and facility policy.")
    + `<div class="grid auto">${window.PROCEDURES.map(x => `<button class="card-link" data-a="go" data-x="skills" data-y="proc-${x.id}"><span class="pill teal">${x.steps.length} steps</span><h3>${esc(x.title)}</h3><span class="small muted">${esc(x.purpose)}</span>${S.sims["proc-" + x.id] ? `<span class="tiny" style="color:var(--ok)">Knowledge check passed</span>` : ""}</button>`).join("")}</div>`;
  if (!UI.procQ || UI.procQ.q.id !== "proc-" + p.id) UI.procQ = newQState({ id: "proc-" + p.id, fmt: "order", stem: "Put the steps in the correct order.", opts: p.steps, key: p.steps.map((_, i) => i), subj: "Fundamentals" }, "practice");
  const st = UI.procQ;
  const sec = (n, t, h, lab = "") => `<div class="lesson-sec"><div class="sec-n">${n}</div><div class="stack-s"><div class="sec-h"><h3>${t}</h3>${lab}</div>${h}</div></div>`;
  return head(esc(p.title), esc(p.purpose), "", crumbBack("All procedures", "skills")) + `<div class="panel raised">${[
    sec(1, "Purpose", `<p>${esc(p.purpose)}</p>`), sec(2, "Required equipment", li(p.equip)), sec(3, "Safety checks", liE(p.safety), labTag("prio", "Check before you start")), sec(4, "Preparation", liE(p.prep)),
    sec(5, "Step-by-step procedure", `<ol style="margin:0;padding-left:1.2rem">${p.steps.map(s => `<li style="margin:4px 0">${emph(s)}</li>`).join("")}</ol>${p.doff ? `<h4 style="margin-top:10px">Removing PPE (doffing)</h4><ol style="margin:0;padding-left:1.2rem">${p.doff.map(s => `<li>${emph(s)}</li>`).join("")}</ol>` : ""}`),
    sec(6, "Infection prevention", `<p>${emph(p.infection)}</p>`), sec(7, "Expected findings", `<p>${emph(p.expected)}</p>`, labTag("expected")), sec(8, "Possible complications", `<p>${emph(p.comps)}</p>`, labTag("unexpected")),
    sec(9, "When to stop or escalate", `<div class="callout bad">${emph(p.stop)}</div>`, labTag("report")), sec(10, "Documentation", `<p>${esc(p.doc)}</p>`), sec(11, "Patient education", `<p>${emph(p.teach)}</p>`, labTag("teach")),
    sec(12, "Knowledge check", `${renderQ(st)}${st.done ? `<div class="callout ${st.score >= .999 ? "ok" : "warn"}" style="margin-top:12px">${st.score >= .999 ? "All steps in order." : Math.round(st.score * 100) + "% of steps in the right position. Review the procedure above and try again."}</div><button class="btn" data-a="procReset">Try again</button>` : `<button class="btn primary" style="margin-top:12px" data-a="procCheck">Check order</button>`}`)].join("")}</div>`;
};
Object.assign(ACT, {
  procCheck: () => { const st = UI.procQ; st.done = true; st.score = grade(st.q, st.resp); if (st.score >= .999) S.sims[st.q.id] = { ts: Date.now(), ok: 1 }; logActivity(); rerender(); },
  procReset: () => { UI.procQ = null; rerender(); }
});

/* =================== PATIENT TEACHING =================== */
ROUTES.teaching = (arg) => {
  const t = UI.teTab || "topics";
  const open = arg && arg.startsWith("teach-") ? arg.slice(6) : null;
  let body = "";
  if (t === "topics") { UI.tePick = UI.tePick || {}; const cats = uniq(window.TEACHING.map(x => x.cat)); const cf = UI.teCat || "all";
    body = `<div class="chips"><button class="chip" data-a="teCat" data-x="all" aria-pressed="${cf === "all"}">All</button>${cats.map(c => `<button class="chip" data-a="teCat" data-x="${esc(c)}" aria-pressed="${cf === c}">${esc(c)}</button>`).join("")}</div>`
     + window.TEACHING.filter(x => cf === "all" || x.cat === cf).map(x => `<details class="x" ${open === x.id ? "open" : ""} id="teach-${x.id}"><summary><span class="pill teal">${esc(x.cat)}</span>${esc(x.title)}</summary><div class="in stack"><div class="grid g2"><div><h4>Teach in plain language</h4>${li(x.pts)}</div><div class="callout bad"><h4>Get help right away for</h4>${li(x.warn)}</div></div><div class="callout teal"><h4>Teach-back</h4>${esc(x.tb)}</div>${mcBlock("tePick", x.id, [{ q: x.q.stem, opts: x.q.opts, key: x.q.key, why: x.q.why }], UI.tePick)}</div></details>`).join("")
     + `<div class="panel"><h3>Teaching principles</h3><div class="grid g2" style="margin-top:8px"><div>${li(["Use plain language and short sentences; avoid jargon", "Chunk content; teach the most important safety points first", "Use a qualified medical interpreter — not family — for medical teaching", "Assess readiness, literacy, vision/hearing, culture, and pain/fatigue"])}</div><div>${li(["Involve caregivers when the client agrees", "Confirm with teach-back or return demonstration", "Give warning signs and who to call", "Schedule follow-up and give written materials at the right reading level"])}</div></div></div>`; }
  else { UI.tsSel = UI.tsSel || {}; body = window.TEACH_SCEN.map(s => { const sel = UI.tsSel[s.id] || { picks: [], done: false };
    return `<div class="panel stack"><h3>${esc(s.title)}</h3><p>${esc(s.pt)}</p><p class="small muted">Select every teaching action that fits this client.</p><div class="opts">${s.opts.map((o, i) => { const on = sel.picks.includes(i); let cls = "opt sq"; if (sel.done) cls += o.ok ? (on ? " right" : " missed") : (on ? " wrong" : ""); return `<button class="${cls}" role="checkbox" aria-checked="${on}" data-a="tsPick" data-x="${s.id}" data-i="${i}" ${sel.done ? "disabled" : ""}><span class="mk">${on ? icon("check", 14, 3) : ""}</span><span>${esc(o.t)}${sel.done ? `<div class="small muted">${esc(o.why)}</div>` : ""}</span></button>`; }).join("")}</div>${sel.done ? `<button class="btn" data-a="tsReset" data-x="${s.id}">Try again</button>` : `<button class="btn primary" data-a="tsCheck" data-x="${s.id}">Check my plan</button>`}</div>`; }).join(""); }
  return head("Patient Teaching", "What to teach, how to say it, the warning signs, and how to confirm the client understood.") + tabs("teTab", [["topics", "Teaching library"], ["scen", "Teaching scenarios"]], t) + body;
};
VIEW_AFTER.teaching = (arg) => { if (arg && arg.startsWith("teach-")) { const d = document.getElementById(arg); if (d) d.scrollIntoView({ block: "start" }); } };
Object.assign(ACT, {
  teCat: el => { UI.teCat = el.dataset.x; rerender(); },
  tePick: el => { const s = UI.tePick; s[el.dataset.x] = s[el.dataset.x] || {}; s[el.dataset.x][el.dataset.q] = +el.dataset.i; logActivity(); rerender(); },
  tsPick: el => { const s = UI.tsSel[el.dataset.x] || (UI.tsSel[el.dataset.x] = { picks: [], done: false }); const i = +el.dataset.i; s.picks = s.picks.includes(i) ? s.picks.filter(x => x !== i) : s.picks.concat(i); rerender(); },
  tsCheck: el => { UI.tsSel[el.dataset.x] = UI.tsSel[el.dataset.x] || { picks: [] }; UI.tsSel[el.dataset.x].done = true; logActivity(); rerender(); },
  tsReset: el => { UI.tsSel[el.dataset.x] = { picks: [], done: false }; rerender(); }
});

/* =================== CLINICAL JUDGMENT SIMULATOR =================== */
const CJ_STEPS = ["Recognize cues", "Analyze cues", "Prioritize hypotheses", "Generate solutions", "Take action", "Evaluate outcomes"];
function ehrHTML(c, upto) {
  if (!c.ehr) return `<div class="exhibit">${c.record || ""}</div>`;
  const e = JSON.parse(JSON.stringify(c.ehr)); e.orders = e.orders || []; e.notes = e.notes || []; e.labs = e.labs || []; e.vitals = e.vitals || { times: [], rows: [] };
  c.items.slice(0, upto + 1).forEach(it => { const a = it.ehrAdd; if (!a) return; (a.notes || []).forEach(n => e.notes.push(n)); (a.orders || []).forEach(o => e.orders.push(o)); (a.labs || []).forEach(l => e.labs.push(l));
    if (a.vitals) { e.vitals.times.push(a.vitals.time); Object.entries(a.vitals.vals).forEach(([k, v]) => { let r = e.vitals.rows.find(x => x[0] === k); if (!r) { r = [k, e.vitals.times.slice(0, -1).map(() => "")]; e.vitals.rows.push(r); } r[1].push(v); }); e.vitals.rows.forEach(r => { while (r[1].length < e.vitals.times.length) r[1].push(""); }); } });
  const tab = UI.ehrTab || "notes";
  const T = [["hx", "History"], ["notes", "Nurse's notes"], ["vitals", "Vital signs"], ["labs", "Labs"], ["orders", "Orders"]];
  let b = "";
  if (tab === "hx") b = `<table class="t"><tbody>${(e.hx || []).map(([k, v]) => `<tr><th style="width:170px">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`;
  if (tab === "notes") b = e.notes.map(n => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b class="num">${esc(n.t)}</b> ${esc(n.text)}</div>`).join("") || "<p class='muted small'>No notes.</p>";
  if (tab === "vitals") b = e.vitals.times.length ? `<table class="t"><thead><tr><th></th>${e.vitals.times.map(t => `<th class="num">${esc(t)}</th>`).join("")}</tr></thead><tbody>${e.vitals.rows.map(([k, vs]) => `<tr><td><b>${esc(k)}</b></td>${vs.map(v => `<td class="num">${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "<p class='muted small'>No vital signs recorded.</p>";
  if (tab === "labs") b = e.labs.length ? `<table class="t"><thead><tr><th>Time</th><th>Test</th><th>Result</th><th>Reference</th></tr></thead><tbody>${e.labs.map(l => `<tr><td class="num">${esc(l.t)}</td><td>${esc(l.name)}</td><td><b>${esc(l.val)}</b></td><td class="small muted">${esc(l.ref)}</td></tr>`).join("")}</tbody></table>` : "<p class='muted small'>No labs.</p>";
  if (tab === "orders") b = e.orders.length ? li(e.orders) : "<p class='muted small'>No new orders.</p>";
  return `<div class="tabs">${T.map(([k, l]) => `<button class="tab" aria-selected="${tab === k}" data-a="ehrTab" data-x="${k}">${l}</button>`).join("")}</div><div class="exhibit" style="padding-top:10px">${b}</div>`;
}
ACT.ehrTab = el => { UI.ehrTab = el.dataset.x; rerender(); };
ROUTES.sim = () => {
  const t = UI.simTab || "cases"; let body = "";
  if (t === "cases") body = UI.case ? caseRunHTML() : `<p class="muted">Each case unfolds over six clinical judgment steps. New information appears in the chart as the situation changes.</p><div class="grid auto">${DATA.cases.map(c => { const done = c.items.filter(i => S.items[i.id]).length; return `<button class="card-link" data-a="caseStart" data-x="${c.case}"><span class="pill teal">${esc(c.subj)}</span><h3>${esc(c.title)}</h3><span class="small muted">${c.items.length} steps · ${done ? done + " attempted" : "Not started"}</span></button>`; }).join("")}</div>`;
  else if (t === "f5") body = first5HTML();
  else if (t === "wc") { const cur = UI.wcId || window.WHATCHANGED[0].id; const w = window.WHATCHANGED.find(x => x.id === cur); UI.wcPick = UI.wcPick || {};
    body = `<div class="chips">${window.WHATCHANGED.map(x => `<button class="chip" data-a="wcId" data-x="${x.id}" aria-pressed="${x.id === cur}">${esc(x.title)}</button>`).join("")}</div><div class="grid g2">${[w.t1, w.t2].map((s, i) => `<div class="panel ${i ? "raised" : "flat"}" style="${i ? "border-color:var(--warn)" : ""}"><span class="pill ${i ? "warn" : ""}">${esc(s.label)}</span><p style="margin:10px 0">${esc(s.text)}</p><p class="num"><b>${esc(s.vs)}</b></p></div>`).join("")}</div><div class="panel">${mcBlock("wcPick", w.id, w.qs, UI.wcPick)}</div>`; }
  else if (t === "shift") body = shiftHTML();
  return head("Clinical Judgment Simulator", "Practice the six steps nurses use: recognize cues, analyze them, prioritize, generate solutions, take action, and evaluate.") + tabs("simTab", [["cases", "Unfolding cases"], ["f5", "The first five minutes"], ["wc", "What changed?"], ["shift", "Virtual nursing shift"]], t) + body;
};
function caseRunHTML() {
  const C = UI.case, c = DATA.cases.find(x => x.case === C.id);
  if (C.i >= c.items.length) { const tot = C.res.reduce((a, x) => a + x, 0); return `<div class="panel raised stack"><h2>${esc(c.title)}: case complete</h2><p class="muted">Score with partial credit: <b>${Math.round(100 * tot / C.res.length)}%</b></p><div class="list">${c.items.map((it, i) => `<div class="spread" style="padding:8px 0"><span>${esc(it.cj || CJ_STEPS[i])}</span><span class="pill ${C.res[i] >= .999 ? "ok" : C.res[i] > 0 ? "warn" : "bad"} num">${Math.round(C.res[i] * 100)}%</span></div>`).join("")}</div><div class="row"><button class="btn primary" data-a="caseEnd">Back to cases</button><button class="btn" data-a="caseStart" data-x="${c.case}">Run again</button></div><p class="small muted">Source: ${esc(c.src)} · ${esc(c.pg)}</p></div>`; }
  const it = c.items[C.i]; if (!C.st || C.st.q.id !== it.id) C.st = newQState(DATA.Q[it.id], "practice"); const st = C.st;
  st.onChange = () => { const b = $("#caseSubmit"); if (b) b.disabled = !answered(st.q, st.resp); };
  const stepIdx = CJ_STEPS.indexOf(it.cj);
  return `<div class="spread"><div><div class="crumb"><button data-a="caseEnd">${icon("left", 14)} All cases</button></div><h2>${esc(c.title)}</h2></div></div>
   <div class="row" style="gap:6px">${CJ_STEPS.map((s, i) => `<span class="pill ${i === stepIdx ? "teal" : i < stepIdx ? "ok" : ""}">${i + 1}. ${s}</span>`).join("")}</div>
   <div class="grid g-case"><div class="panel">${ehrHTML(c, C.i)}</div>
    <div class="panel raised">${renderQ(st)}${st.done ? explainHTML(st) + `<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" data-a="caseNext">${C.i + 1 >= c.items.length ? "Finish case" : "Next step"} ${icon("right")}</button></div>` : `<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="caseSubmit" data-a="caseSubmit" ${answered(st.q, st.resp) ? "" : "disabled"}>Submit</button></div>`}</div></div>`;
}
Object.assign(ACT, {
  caseStart: el => { UI.simTab = "cases"; UI.case = { id: el.dataset.x, i: 0, res: [], st: null }; UI.ehrTab = "notes"; if (route !== "sim") navTo("sim"); else rerender(); window.scrollTo(0, 0); },
  caseSubmit: () => { const st = UI.case.st; st.done = true; st.score = grade(st.q, st.resp); recordAttempt(st.q.id, st.score, "c", Date.now() - st.t0, null, st.resp); UI.case.res.push(st.score); rerender(); },
  caseNext: () => { UI.case.i++; UI.case.st = null; rerender(); window.scrollTo(0, 0); },
  caseEnd: () => { UI.case = null; rerender(); },
  wcId: el => { UI.wcId = el.dataset.x; rerender(); },
  wcPick: el => { const s = UI.wcPick; s[el.dataset.x] = s[el.dataset.x] || {}; s[el.dataset.x][el.dataset.q] = +el.dataset.i; logActivity(); rerender(); }
});
function first5HTML() {
  const cur = UI.f5Id || window.FIRST5[0].id; const f = window.FIRST5.find(x => x.id === cur); const F = UI.f5 && UI.f5.id === cur ? UI.f5 : (UI.f5 = { id: cur, taken: [], used: 0, over: false });
  const left = 300 - F.used; const order = UI.f5Ord && UI.f5Ord.id === cur ? UI.f5Ord.o : (UI.f5Ord = { id: cur, o: shuffle(f.actions.map(a => a.id)) }).o;
  const chips = `<div class="chips">${window.FIRST5.map(x => `<button class="chip" data-a="f5Id" data-x="${x.id}" aria-pressed="${x.id === cur}">${esc(x.title)}</button>`).join("")}</div>`;
  if (F.over) { const taken = F.taken.map(id => f.actions.find(a => a.id === id)); const score = taken.reduce((a, x) => a + x.score, 0); const max = f.actions.filter(a => a.score > 0).reduce((a, x) => a + x.score, 0);
    const missed = f.essential.filter(id => !F.taken.includes(id)).map(id => f.actions.find(a => a.id === id)); const harm = taken.filter(a => a.score < 0); const firstOK = taken[0] && f.essential.slice(0, 2).includes(taken[0].id);
    return chips + `<div class="panel raised stack"><h2>Debrief: ${esc(f.title)}</h2><div class="grid g3"><div class="callout ${harm.length ? "bad" : "ok"}"><h4>Safety</h4>${harm.length ? harm.length + " unsafe action" + (harm.length > 1 ? "s" : "") : "No unsafe actions"}</div><div class="callout ${missed.length ? "warn" : "ok"}"><h4>Essential actions</h4>${f.essential.length - missed.length} of ${f.essential.length} done</div><div class="callout ${firstOK ? "ok" : "warn"}"><h4>First move</h4>${taken[0] ? esc(taken[0].t) : "None"}</div></div>
     <h3>Your actions, in order</h3><div class="list">${taken.map((a, i) => `<div style="padding:10px 0;display:flex;gap:10px"><span class="pill ${a.score > 0 ? "ok" : a.score < 0 ? "bad" : ""} num">${i + 1}</span><div><b>${esc(a.t)}</b><br><span class="small">${esc(a.fb)}</span></div></div>`).join("") || "<p class='muted'>No actions taken.</p>"}</div>
     ${missed.length ? `<div class="callout warn"><h4>Missed essential actions</h4>${li(missed.map(a => a.t + " — " + a.fb))}</div>` : ""}<div class="callout teal"><h4>Key takeaway</h4>${esc(f.debrief)}</div><p class="small muted">Priority score: ${Math.max(0, score)} of ${max} (patient safety and correct priorities, not speed).</p><button class="btn primary" data-a="f5Reset">Run it again</button></div>`; }
  return chips + `<div class="panel raised stack"><div class="spread"><h2>${esc(f.title)}</h2><span class="timer num" style="font-family:var(--display);font-size:1.6rem;color:${left < 60 ? "var(--bad)" : "var(--teal)"}">${fmtTime(left)}</span></div><p>${esc(f.intro)}</p><div class="callout warn"><b>Now:</b> ${esc(f.vs)}</div><p class="small muted">You have five simulated minutes. Each action uses time. Choose what you'd actually do, in the order you'd do it — feedback comes at the end.</p>
   <div class="grid g2">${order.map(id => { const a = f.actions.find(x => x.id === id); const done = F.taken.includes(id); return `<button class="opt" data-a="f5Do" data-x="${id}" ${done || left <= 0 ? "disabled" : ""} style="${done ? "opacity:.55" : ""}"><span class="mk">${done ? icon("check", 14, 3) : ""}</span><span>${esc(a.t)}<div class="tiny muted">${a.cost} sec</div></span></button>`; }).join("")}</div>
   ${F.taken.length ? `<div class="small"><b>Done so far:</b> ${F.taken.map((id, i) => (i + 1) + ". " + esc(f.actions.find(a => a.id === id).t)).join(" · ")}</div>` : ""}<div class="row" style="justify-content:flex-end"><button class="btn primary" data-a="f5End">End and see debrief</button></div></div>`;
}
Object.assign(ACT, {
  f5Id: el => { UI.f5Id = el.dataset.x; UI.f5 = null; rerender(); },
  f5Do: el => { const f = window.FIRST5.find(x => x.id === UI.f5.id); const a = f.actions.find(x => x.id === el.dataset.x); UI.f5.taken.push(a.id); UI.f5.used += a.cost; if (UI.f5.used >= 300) UI.f5.over = true; rerender(); },
  f5End: () => { UI.f5.over = true; S.sims["f5-" + UI.f5.id] = { ts: Date.now() }; logActivity(); rerender(); },
  f5Reset: () => { UI.f5 = null; UI.f5Ord = null; rerender(); }
});
function shiftHTML() {
  const sh = window.SHIFT; const V = UI.shift || (UI.shift = { i: -1, picks: [] });
  if (V.i < 0) return `<div class="panel raised stack"><h2>${esc(sh.title)}</h2><p>${esc(sh.intro)}</p><p class="small muted">${sh.steps.length} decisions with interruptions. You'll get feedback after each and an end-of-shift report. Everything stays within LVN scope.</p><button class="btn primary big" data-a="shStart">Start the shift</button></div>`;
  if (V.i >= sh.steps.length) { const cats = uniq(sh.steps.map(s => s.cat)); const unsafe = sh.steps.map((s, i) => [s, V.picks[i]]).filter(([s, p]) => s.bad.includes(p)); const ok = sh.steps.filter((s, i) => V.picks[i] === s.key).length;
    return `<div class="panel raised stack"><h2>End-of-shift report</h2><p><b>${ok} of ${sh.steps.length}</b> decisions matched the safest choice.</p><div class="tablewrap"><table class="t"><thead><tr><th>Area</th><th>Result</th></tr></thead><tbody>${cats.map(c => { const ss = sh.steps.map((s, i) => [s, i]).filter(([s]) => s.cat === c); const g = ss.filter(([s, i]) => V.picks[i] === s.key).length; return `<tr><td>${esc(c)}</td><td><span class="pill ${g === ss.length ? "ok" : "warn"}">${g}/${ss.length}</span></td></tr>`; }).join("")}</tbody></table></div>
     ${unsafe.length ? `<div class="callout bad"><h4>Unsafe choices to revisit</h4>${li(unsafe.map(([s, p]) => s.cat + ": " + s.opts[p]))}</div>` : `<div class="callout ok"><h4>No unsafe choices</h4>Strong shift.</div>`}<div class="callout teal"><h4>Strengths and next steps</h4>${ok === sh.steps.length ? "Every decision matched the safest choice. Try the First Five Minutes scenarios next." : "Review the areas below 100% in Nursing Priorities and Medication Mastery, then run the shift again."}</div><button class="btn primary" data-a="shReset">Run the shift again</button></div>`; }
  const s = sh.steps[V.i], p = V.picks[V.i];
  return `<div class="panel raised stack"><div class="spread"><span class="pill teal">${esc(s.cat)}</span><span class="small muted num">Decision ${V.i + 1} of ${sh.steps.length}</span></div><h3 style="font-family:var(--body);font-weight:400;font-size:1.1rem">${esc(s.t)}</h3><div class="opts">${s.opts.map((o, i) => { const cls = p == null ? "" : i === s.key ? " right" : i === p ? " wrong" : ""; return `<button class="opt${cls}" data-a="shPick" data-i="${i}" ${p != null ? "disabled" : ""}><span class="mk">${L(i)}</span><span>${esc(o)}</span></button>`; }).join("")}</div>${p != null ? `<p class="small"><b>${p === s.key ? "Safe choice." : s.bad.includes(p) ? "Unsafe choice." : "Not the best choice."}</b> ${esc(s.why)}</p><div class="row" style="justify-content:flex-end"><button class="btn primary" data-a="shNext">Continue ${icon("right")}</button></div>` : ""}</div>`;
}
Object.assign(ACT, {
  shStart: () => { UI.shift = { i: 0, picks: [] }; rerender(); }, shPick: el => { UI.shift.picks[UI.shift.i] = +el.dataset.i; rerender(); },
  shNext: () => { UI.shift.i++; if (UI.shift.i >= window.SHIFT.steps.length) { S.sims.shift = { ts: Date.now(), ok: window.SHIFT.steps.filter((s, i) => UI.shift.picks[i] === s.key).length }; logActivity(); } rerender(); },
  shReset: () => { UI.shift = { i: -1, picks: [] }; rerender(); }
});

/* =================== NURSING PRIORITIES =================== */
ROUTES.priorities = () => {
  const t = UI.prTab || "who"; let body = "";
  if (t === "who") { const cur = UI.psId || window.PRIORITY_SETS[0].id; const ps = window.PRIORITY_SETS.find(x => x.id === cur); UI.rank = UI.rank || {}; const rk = UI.rank[cur] || { o: [], done: false };
    body = `<div class="chips">${window.PRIORITY_SETS.map(x => `<button class="chip" data-a="psId" data-x="${x.id}" aria-pressed="${x.id === cur}">${esc(x.title)}${S.sims[x.id] ? " ✓" : ""}</button>`).join("")}</div>
     <div class="panel raised stack"><div class="spread"><h2>${esc(ps.title)}</h2><span class="small muted">${rk.done ? "Ranking checked" : "Tap patients in the order you'd see them"}</span></div>
      <div class="grid g2">${ps.pts.map((p, i) => { const pos = rk.o.indexOf(i); const right = rk.done ? ps.order.indexOf(i) : -1; return `<button class="card-link" style="${rk.done ? (ps.order[0] === i ? "border-color:var(--ok);background:var(--ok-soft)" : "") : pos >= 0 ? "border-color:var(--teal);background:var(--teal-soft)" : ""}" data-a="psTap" data-x="${cur}" data-i="${i}" ${rk.done ? "disabled" : ""}><div class="spread"><b>${esc(p.name)}</b>${pos >= 0 ? `<span class="pill teal num">Your #${pos + 1}</span>` : ""}${rk.done ? `<span class="pill ${pos === right ? "ok" : "warn"} num">Best #${right + 1}</span>` : ""}</div><span class="small muted">${esc(p.dx)}</span><span>${esc(p.rep)}</span>${rk.done ? `<span class="small" style="border-top:1px solid var(--line);padding-top:8px">${esc(ps.why[i])}</span>` : ""}</button>`; }).join("")}</div>
      ${rk.done ? `<div class="callout bad"><h4>The dangerous cue</h4>${esc(ps.cue)}</div><div class="callout teal"><h4>First nursing response</h4>${esc(ps.first)}</div>${ps.change && ps.change !== "—" ? `<div class="callout"><h4>What would change the ranking</h4>${esc(ps.change)}</div>` : ""}<div class="row"><button class="btn" data-a="psReset" data-x="${cur}">Try again</button></div>` : `<div class="row"><button class="btn" data-a="psReset" data-x="${cur}" ${rk.o.length ? "" : "disabled"}>Clear</button><button class="btn primary" data-a="psCheck" data-x="${cur}" ${rk.o.length === ps.pts.length ? "" : "disabled"}>Check my ranking</button></div>`}</div>`; }
  else if (t === "fw") body = `<div class="callout warn"><h4>Frameworks guide thinking; they aren't rigid rules</h4>"Always assess first" is wrong when an emergency needs immediate action (stop a transfusion, open an airway). Client status and context decide.</div><div class="grid g2">${[
    ["Airway, Breathing, Circulation", "Threats to oxygenation and perfusion usually come first. A chronic, stable airway finding at baseline may not."],
    ["Immediate threats to life", "Anything that will cause death or permanent harm in minutes (airway obstruction, hemorrhage, anaphylaxis, active seizure)."],
    ["Safety and risk prevention", "Falls, suicide risk, violence, infection exposure, and medication errors are priority safety concerns."],
    ["Acute versus chronic", "A new or sudden change outranks a long-standing, stable problem."],
    ["Unstable versus stable", "Unstable, unpredictable clients need the licensed nurse first; stable, predictable care can often be assigned."],
    ["Actual versus potential", "An actual problem usually outranks a risk — unless the potential problem is life-threatening and imminent."],
    ["Expected versus unexpected", "Expected findings for the condition (e.g., incision pain day 1) rank lower than unexpected ones (e.g., new confusion)."],
    ["Maslow's hierarchy", "Physiological needs, then safety, then love/belonging, esteem, and self-actualization. A psychosocial need that is a safety threat (suicidal plan) moves up."],
    ["Least restrictive, least invasive", "Choose the simplest effective intervention first (reorientation before restraints; repositioning before medication when safe)."],
    ["Time-sensitive interventions", "Stroke treatment windows, Rh immune globulin within 72 hr, antibiotics in sepsis, insulin timing with meals."],
    ["Reassessment and evaluation", "Every intervention ends with checking whether it worked and what changed."],
    ["Nursing process", "Collect data, interpret (with the RN), plan, implement, evaluate. The LVN contributes to each step within scope."]].map(([h, p]) => `<div class="panel"><h3>${h}</h3><p class="small" style="margin-top:6px">${esc(p)}</p></div>`).join("")}</div>`;
  else body = `<div class="callout warn"><h4>Scope depends on your state</h4>Delegation and LVN scope are set by the state Nurse Practice Act, your training and certification, supervision, and facility policy (Ch. 17, PDF p. 203). The lists below are common examples, not universal rules.</div>
   <div class="grid g3"><div class="panel"><h3>Usually assigned to trained assistive personnel</h3>${li(["Hygiene, bathing, oral care", "Ambulating and positioning stable clients", "Routine vital signs on stable clients", "Measuring and recording intake and output", "Feeding clients without swallowing or aspiration risk", "Making beds, reporting changes they observe"])}</div>
   <div class="panel"><h3>LVN/LPN (with RN collaboration)</h3>${li(["Data collection and focused assessment of stable clients", "Reinforcing teaching the RN started", "Medication administration as allowed by state law and facility", "Sterile procedures, wound care, catheters, tube feedings", "Contributing to the care plan; monitoring and reporting changes", "Assigning tasks to assistive personnel; delegating where permitted"])}</div>
   <div class="panel"><h3>Requires RN-level assessment or judgment</h3>${li(["Initial and comprehensive assessments", "Care planning and initial teaching", "Unstable or rapidly changing clients", "Evaluating the outcome of complex care", "Many IV push medications and initiating blood products (varies by state)", "Triage decisions in emergencies"])}</div></div>
   <div class="panel"><h3>Always escalate to the RN or provider</h3>${li(["New or worsening findings: change in LOC, SpO₂ drop, chest pain, hypotension, bleeding", "Findings that need interpretation that an assistant reported", "Orders that seem unsafe or unclear", "Client refusing essential care or treatment"])}<div class="row" style="margin-top:10px"><button class="btn" data-a="go" data-x="systems" data-y="lesson-lead-delegation">${icon("book", 16)} Lesson: Assignment, delegation, and SBAR</button><button class="btn" data-a="scopeQs">Practice scope questions</button></div></div>`;
  return head("Nursing Priorities", "What should the nurse do first? Rank patients, learn the frameworks, and know your scope.") + tabs("prTab", [["who", "Who do you see first?"], ["fw", "Priority frameworks"], ["scope", "Delegation and scope"]], t) + body;
};
Object.assign(ACT, {
  psId: el => { UI.psId = el.dataset.x; rerender(); },
  psTap: el => { const id = el.dataset.x, i = +el.dataset.i; const rk = UI.rank[id] || (UI.rank[id] = { o: [], done: false }); rk.o = rk.o.includes(i) ? rk.o.filter(x => x !== i) : rk.o.concat(i); rerender(); },
  psCheck: el => { const ps = window.PRIORITY_SETS.find(x => x.id === el.dataset.x); const rk = UI.rank[ps.id]; rk.done = true; S.sims[ps.id] = { ts: Date.now(), first: rk.o[0] === ps.order[0] ? 1 : 0 }; logActivity(); rerender(); },
  psReset: el => { UI.rank[el.dataset.x] = { o: [], done: false }; rerender(); },
  scopeQs: () => { const ids = DATA.pool.filter(q => q.ask === "Scope" || q.comp === "scope").map(q => q.id); startPractice(shuffle(ids).slice(0, 10), "Delegation and scope", "priorities"); }
});

/* =================== PATIENT ASSESSMENT LAB =================== */
const ASSESS_MOD = [
 ["General survey", ["Appearance, distress, hygiene", "LOC and orientation", "Posture, gait, speech", "Vital signs and pain"]], ["Head-to-toe", ["Neuro → HEENT → cardiac → respiratory → abdomen → GU → extremities → skin", "Compare sides", "Lines, drains, devices"]],
 ["Respiratory", ["Rate, depth, effort, accessory muscles", "SpO₂ and color", "Breath sounds all lobes", "Cough and sputum"]], ["Cardiovascular", ["Apical pulse 1 full minute when indicated", "Rhythm, BP, cap refill", "Peripheral pulses, edema, JVD", "Chest pain characteristics"]],
 ["Neurological", ["GCS or LOC, orientation", "Pupils (size, equality, reaction)", "Motor strength and symmetry", "Speech and swallow"]], ["Gastrointestinal", ["Inspect, auscultate, then percuss/palpate", "Bowel sounds, last BM", "Nausea, vomiting, tolerance of diet", "Abdominal girth if indicated"]],
 ["Genitourinary", ["Output amount and color", "Bladder distention", "Catheter patency", "Dysuria, frequency"]], ["Musculoskeletal", ["ROM, strength, gait", "Deformity, swelling", "Assistive devices", "Fall risk"]],
 ["Neurovascular", ["6 Ps: pain, pallor, pulse, paresthesia, paralysis, poikilothermia", "Compare with unaffected limb", "Cap refill < 3 s"]], ["Skin and wound", ["Braden score", "Color, temperature, turgor", "Wound size, bed, drainage, odor", "Pressure points"]],
 ["Pain", ["Location, intensity, quality, onset, duration", "Aggravating and relieving factors", "Behavioral scales for nonverbal clients", "Reassess after intervention"]], ["Mental status", ["Appearance, behavior, mood, affect", "Thought process and content", "Suicide and violence risk", "Insight and judgment"]],
 ["Maternal", ["BUBBLE-HE postpartum: breasts, uterus, bladder, bowel, lochia, episiotomy/incision, Homans/legs, emotions", "Fundal height and firmness", "BP and preeclampsia signs"]], ["Newborn", ["Apgar at 1 and 5 min", "Vital signs, temperature", "Glucose if at risk", "Feeding, voiding, stooling", "Jaundice (first 24 hr = pathologic)"]],
 ["Pediatric", ["Age-specific vital signs", "Developmental level", "Hydration (weight, diapers, fontanel)", "Work of breathing", "Family input"]]
];
ROUTES.assess = () => {
  const t = UI.alTab || "cases"; let body = "";
  if (t === "cases") body = UI.al ? alRunHTML() : `<p class="muted">Collect data the way you would at the bedside. Findings only appear after you choose an assessment. Then decide, communicate with SBAR, and document.</p><div class="grid auto">${window.ASSESS_CASES.map(c => `<button class="card-link" data-a="alStart" data-x="${c.id}"><span class="pill teal">Simulated patient</span><h3>${esc(c.title)}</h3><span class="small muted">${esc(c.pt)}</span></button>`).join("")}</div>`;
  else body = `<div class="grid auto">${ASSESS_MOD.map(([n, items]) => `<div class="panel"><h3>${esc(n)}</h3>${li(items)}</div>`).join("")}</div>`;
  return head("Patient Assessment Lab", "Learn to approach a patient systematically: collect meaningful data, spot the red flags, and report.") + tabs("alTab", [["cases", "Simulated patients"], ["mods", "Assessment checklists"]], t) + body;
};
function alRunHTML() {
  const A = UI.al, c = window.ASSESS_CASES.find(x => x.id === A.id);
  const acts = A.ord.map(id => c.actions.find(a => a.id === id));
  let h = `<div class="crumb"><button data-a="alEnd">${icon("left", 14)} All patients</button></div><div class="panel raised stack"><h2>${esc(c.title)}</h2><p>${esc(c.pt)}</p>`;
  if (A.stage === 0) {
    h += `<h3>Choose assessments</h3><div class="grid g2">${acts.map(a => { const done = A.taken.includes(a.id); return `<button class="opt" data-a="alDo" data-x="${a.id}" ${done ? "disabled" : ""}><span class="mk">${done ? icon("check", 14, 3) : ""}</span><span>${esc(a.t)}${done ? `<div class="small" style="margin-top:4px"><b>Finding:</b> ${esc(a.f)}</div>` : ""}</span></button>`; }).join("")}</div><div class="row" style="justify-content:flex-end"><button class="btn primary" data-a="alStage" data-x="1" ${A.taken.length ? "" : "disabled"}>I've collected enough — get feedback</button></div>`;
  } else {
    const keys = c.actions.filter(a => a.rel === "key"); const found = keys.filter(a => A.taken.includes(a.id)), miss = keys.filter(a => !A.taken.includes(a.id)), low = c.actions.filter(a => a.rel === "low" && A.taken.includes(a.id));
    h += `<div class="grid g3"><div class="callout ok"><h4>Important findings collected</h4>${found.length ? li(found.map(a => a.t + ": " + a.f)) : "<p class='small'>None.</p>"}</div><div class="callout warn"><h4>Missed</h4>${miss.length ? li(miss.map(a => a.t + ": " + a.f)) : "<p class='small'>Nothing important missed.</p>"}</div><div class="callout"><h4>Lower priority right now</h4>${low.length ? li(low.map(a => a.t)) : "<p class='small'>None chosen.</p>"}</div></div>
     <div class="callout bad"><h4>Red flags</h4>${li(c.red)}</div><div class="callout teal"><h4>Appropriate nursing response</h4>${esc(c.response)}</div><div class="callout"><h4>Reassess</h4>${esc(c.reassess)}</div>`;
    const sb = A.sbar; const letters = [["S", "Situation"], ["B", "Background"], ["A", "Assessment"], ["R", "Recommendation"]];
    h += `<h3>Practice the SBAR call</h3><p class="small muted">Choose the best statement for each part.</p>${letters.map(([k, n]) => { const ord = A.sbOrd[k]; return `<div class="stack-s"><b>${k} — ${n}</b><div class="opts">${ord.map(i => { const p = sb[k]; const cls = A.sbDone ? (i === 0 ? " right" : p === i ? " wrong" : "") : ""; return `<button class="opt${cls}" aria-pressed="${p === i}" data-a="alSb" data-k="${k}" data-x="${i}" ${A.sbDone ? "disabled" : ""}><span class="mk">${p === i ? icon("check", 13, 3) : ""}</span><span>${esc(c.sbar[k][i])}</span></button>`; }).join("")}</div></div>`; }).join("")}
     ${A.sbDone ? `<div class="callout ok"><h4>Sample documentation</h4><p class="small">${esc(sampleNote(c))}</p></div><div class="row"><button class="btn primary" data-a="alEnd">Finish</button><button class="btn" data-a="alStart" data-x="${c.id}">Run again</button></div>` : `<button class="btn primary" data-a="alSbCheck" ${letters.every(([k]) => sb[k] != null) ? "" : "disabled"}>Check my SBAR</button>`}`;
  }
  return h + `</div>`;
}
function sampleNote(c) { const k = c.actions.filter(a => a.rel === "key"); return "Time: " + k.map(a => a.f).join(" ") + " Interventions per protocol initiated; RN and provider notified using SBAR. Will reassess and document response."; }
Object.assign(ACT, {
  alStart: el => { const c = window.ASSESS_CASES.find(x => x.id === el.dataset.x); UI.al = { id: c.id, taken: [], stage: 0, ord: shuffle(c.actions.map(a => a.id)), sbar: {}, sbOrd: { S: shuffle([0, 1, 2]), B: shuffle([0, 1, 2]), A: shuffle([0, 1, 2]), R: shuffle([0, 1, 2]) }, sbDone: false }; UI.alTab = "cases"; rerender(); window.scrollTo(0, 0); },
  alDo: el => { UI.al.taken.push(el.dataset.x); rerender(); }, alStage: el => { UI.al.stage = +el.dataset.x; logActivity(); rerender(); },
  alSb: el => { UI.al.sbar[el.dataset.k] = +el.dataset.x; rerender(); }, alSbCheck: () => { UI.al.sbDone = true; S.sims["al-" + UI.al.id] = { ts: Date.now() }; save(); rerender(); },
  alEnd: () => { UI.al = null; rerender(); }
});

/* =================== QUESTION BANK =================== */
ROUTES.bank = (arg) => {
  const F = UI.bf || (UI.bf = { sys: "all", fmt: "all", diff: "all", cn: "all", status: "all", n: 10 });
  const pool = DATA.pool.filter(q => (F.sys === "all" || DATA.sysOf(q.subj) === F.sys) && (F.fmt === "all" || q.fmt === F.fmt) && (F.diff === "all" || q.diff === F.diff) && (F.cn === "all" || q.cn === F.cn)
    && (F.status === "all" || (F.status === "new" && !S.items[q.id]) || (F.status === "missed" && S.journal.some(j => j.qid === q.id && !j.resolved)) || (F.status === "due" && dueItems().includes(q.id)) || (F.status === "saved" && isBm("q:" + q.id))));
  const sel = (k, opts) => `<label class="field">${opts.label}<select data-in="bf" data-k="${k}">${opts.o.map(([v, l]) => `<option value="${v}" ${F[k] === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
  const cns = uniq(DATA.pool.map(q => q.cn)).sort();
  return head("HESI Question Bank", `${DATA.pool.length} standalone questions plus ${DATA.caseItems.length} case questions. Each has a validated answer key, full rationales, and a source in your course files. Practice mode shows feedback after each answer.`)
   + `<div class="panel stack"><div class="grid g3">${sel("sys", { label: "Subject", o: [["all", "All subjects"]].concat(window.SYSTEMS.filter(s => sysQs(s.id).length).map(s => [s.id, s.name + " (" + sysQs(s.id).length + ")"])) })}${sel("cn", { label: "Client needs", o: [["all", "All categories"]].concat(cns.map(c => [c, c])) })}${sel("fmt", { label: "Format", o: [["all", "All formats"]].concat(Object.entries(FMT_NAME).filter(([k]) => DATA.pool.some(q => q.fmt === k)).map(([k, v]) => [k, v])) })}${sel("diff", { label: "Difficulty", o: [["all", "All levels"], ["F", "Foundational"], ["I", "Intermediate"], ["A", "Advanced"]] })}${sel("status", { label: "Show", o: [["all", "All questions"], ["new", "Not yet attempted"], ["missed", "In my mistake journal"], ["due", "Due for spaced review"], ["saved", "Saved for later"]] })}${sel("n", { label: "Session length", o: [[5, "5 questions"], [10, "10 questions"], [20, "20 questions"], [40, "40 questions"]].map(([v, l]) => [String(v), l]) })}</div>
    <div class="spread"><span class="muted"><b class="num">${pool.length}</b> questions match</span><button class="btn primary big" data-a="bankStart" ${pool.length ? "" : "disabled"}>${icon("play", 16)} Start practice</button></div></div>
    <div class="panel"><h3>Matching questions</h3><div class="list" style="margin-top:6px">${pool.slice(0, 80).map(q => { const it = S.items[q.id]; return `<button class="item-row" data-a="tryRelated" data-x="${q.id}"><span class="pill ${it ? (it.c / it.n >= .8 ? "ok" : "warn") : ""} num">${it ? Math.round(100 * it.c / it.n) + "%" : "New"}</span><span><b>${esc(q.topic)}</b><br><span class="tiny muted">${esc(q.subj)} · ${FMT_NAME[q.fmt]} · ${DIFF_NAME[q.diff] || ""} · ${esc(q.id)}</span></span></button>`; }).join("")}${pool.length > 80 ? `<p class="small muted" style="padding:10px 4px">Showing 80 of ${pool.length}. Narrow the filters or start a session.</p>` : ""}</div></div>`;
};
VIEW_AFTER.bank = (arg) => { if (arg && arg.startsWith("q-")) { const id = arg.slice(2); history.replaceState(null, "", "#bank"); startPractice([id], "Question " + id, "bank"); } };
document.addEventListener("change", ev => { const el = ev.target; if (el.dataset.in === "bf") { UI.bf[el.dataset.k] = el.dataset.k === "n" ? el.value : el.value; rerender(); } });
ACT.bankStart = () => { const F = UI.bf; const pool = DATA.pool.filter(q => (F.sys === "all" || DATA.sysOf(q.subj) === F.sys) && (F.fmt === "all" || q.fmt === F.fmt) && (F.diff === "all" || q.diff === F.diff) && (F.cn === "all" || q.cn === F.cn) && (F.status === "all" || (F.status === "new" && !S.items[q.id]) || (F.status === "missed" && S.journal.some(j => j.qid === q.id && !j.resolved)) || (F.status === "due" && dueItems().includes(q.id)) || (F.status === "saved" && isBm("q:" + q.id))));
  const un = shuffle(pool.filter(q => !S.items[q.id])), seen = shuffle(pool.filter(q => S.items[q.id])); startPractice(un.concat(seen).slice(0, +F.n || 10).map(q => q.id), "Practice session", "bank"); };

/* =================== MOCK EXAMS =================== */
ROUTES.mock = (arg) => {
  if (arg === "result") { const m = S.mocks.find(x => x.id === UI.mockView) || S.mocks[0]; if (m) return mockResultHTML(m); }
  const N = UI.mockN || 25, timed = UI.mockTimed !== false, pace = UI.mockPace || 80, subj = UI.mockSubj || "all", focus = UI.mockFocus || "all";
  return head("Mock Exit Exams", "Timed, comprehensive practice with no feedback until you submit. These lengths are practice options — not claims about the official HESI Exit exam format.")
   + (S.session && S.session.active ? `<div class="callout warn spread"><span>An exam is already in progress.</span><button class="btn primary" data-a="nav" data-x="exam">Resume exam</button></div>` : "")
   + `<div class="panel raised stack"><div class="stack-s"><b>Length</b><div class="chips">${[10, 25, 50, 75, 100, 150].map(n => `<button class="chip" data-a="mkN" data-x="${n}" aria-pressed="${N === n}">${n} questions</button>`).join("")}<label class="row small">Custom <input type="number" min="5" max="${DATA.pool.length + DATA.caseItems.length}" id="mkCustom" value="${[10, 25, 50, 75, 100, 150].includes(N) ? "" : N}" style="width:90px"></label></div></div>
    <div class="grid g3"><div class="stack-s"><b>Timing</b><div class="chips"><button class="chip" data-a="mkTimed" data-x="1" aria-pressed="${timed}">Timed</button><button class="chip" data-a="mkTimed" data-x="0" aria-pressed="${!timed}">Untimed</button></div>${timed ? `<div class="chips">${[60, 80, 100].map(p => `<button class="chip" data-a="mkPace" data-x="${p}" aria-pressed="${pace === p}">${p} s per question</button>`).join("")}</div>` : ""}</div>
     <div class="stack-s"><b>Subjects</b><select id="mkSubj"><option value="all">Mixed (all subjects)</option>${window.SYSTEMS.filter(s => sysQs(s.id).length).map(s => `<option value="${s.id}" ${subj === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div>
     <div class="stack-s"><b>Focus</b><div class="chips"><button class="chip" data-a="mkFocus" data-x="all" aria-pressed="${focus === "all"}">Comprehensive</button><button class="chip" data-a="mkFocus" data-x="cj" aria-pressed="${focus === "cj"}">Clinical judgment</button><button class="chip" data-a="mkFocus" data-x="missed" aria-pressed="${focus === "missed"}">Missed questions</button></div></div></div>
    <div class="spread"><span class="small muted">${timed ? `Time limit: ${fmtTime(N * pace)} · ` : ""}Your answers save as you go — you can close the app and resume. Mixed exams of 25+ include unfolding case studies.</span><button class="btn primary big" data-a="mkStart">${icon("clock", 16)} Start exam</button></div></div>
   ${S.mocks.length ? `<div class="panel"><h3>Past results</h3><div class="list" style="margin-top:6px">${S.mocks.map(m => `<button class="item-row" data-a="mockOpen" data-x="${m.id}"><span class="pill ${m.score >= 80 ? "ok" : m.score >= 65 ? "warn" : "bad"} num">${m.score}%</span><span>${m.n} questions · ${fmtDate(m.ts)} · ${m.cfg.timed ? "timed" : "untimed"}<br><span class="small muted">${m.full} fully correct · ${m.answered} answered</span></span></button>`).join("")}</div></div>` : ""}`;
};
VIEW_AFTER.mock = () => { const c = $("#mkCustom"); if (c) c.onchange = () => { const v = Math.max(5, Math.min(+c.max, +c.value || 0)); if (v) { UI.mockN = v; rerender(); } }; const s = $("#mkSubj"); if (s) s.onchange = () => { UI.mockSubj = s.value; }; };
Object.assign(ACT, {
  mkN: el => { UI.mockN = +el.dataset.x; rerender(); }, mkTimed: el => { UI.mockTimed = el.dataset.x === "1"; rerender(); }, mkPace: el => { UI.mockPace = +el.dataset.x; rerender(); }, mkFocus: el => { UI.mockFocus = el.dataset.x; rerender(); },
  mkStart: () => { if (S.session && S.session.active) { confirmBox("Replace the exam in progress?", "Starting a new exam discards your unfinished one.", "Start new exam", go, true); return; } go();
    function go() { UI.mockView = null; startMock({ n: UI.mockN || 25, timed: UI.mockTimed !== false, pace: UI.mockPace || 80, subj: UI.mockSubj || "all", focus: UI.mockFocus || "all" }); logActivity(); } },
  mockOpen: el => { UI.mockView = el.dataset.x; UI.mockReview = null; navTo("mock", "result"); },
  mockBack: () => { UI.mockView = null; navTo("mock"); },
  mockRev: el => { UI.mockReview = UI.mockReview === el.dataset.x ? null : el.dataset.x; rerender(); },
  mockMissed: el => { const m = S.mocks.find(x => x.id === el.dataset.x); startPractice(m.res.filter(r => r[1] < .999).map(r => r[0]), "Missed on mock exam", "mock"); }
});
function barRows(map, labelFn) {
  const rows = Object.entries(map).map(([k, v]) => [k, Math.round(100 * v.sum / v.n), v.n]).sort((a, b) => a[1] - b[1]);
  return `<div class="stack-s">${rows.map(([k, p, n]) => `<div><div class="spread small"><span>${esc(labelFn ? labelFn(k) : k)}</span><span class="num muted">${p}% · ${n}</span></div><div class="meter"><span style="width:${p}%;background:${p >= 80 ? "var(--ok)" : p >= 65 ? "var(--warn)" : "var(--bad)"}"></span></div></div>`).join("")}</div>`;
}
function mockResultHTML(m) {
  const missed = m.res.filter(r => r[1] < .999).map(r => DATA.Q[r[0]]).filter(Boolean);
  const topics = uniq(missed.map(q => q.topic)).slice(0, 12);
  const weakSub = Object.entries(m.bySubj).filter(([, v]) => v.n >= 3).map(([k, v]) => [k, v.sum / v.n]).sort((a, b) => a[1] - b[1]).slice(0, 2);
  const weakCj = Object.entries(m.byCj).filter(([, v]) => v.n >= 2).map(([k, v]) => [k, v.sum / v.n]).sort((a, b) => a[1] - b[1])[0];
  const pr = m.bySkill["Priority setting"];
  const recs = [];
  weakSub.forEach(([k, v]) => { if (v < .8) recs.push(`${k}: ${Math.round(v * 100)}%. Open the ${DATA.sysName(DATA.sysOf(k))} lessons, then practice 10 ${k} questions.`); });
  if (weakCj && weakCj[1] < .75) recs.push(`Your weakest clinical judgment step was "${weakCj[0]}" (${Math.round(weakCj[1] * 100)}%). Work an unfolding case in the simulator and read the step-by-step reasoning after each answer.`);
  if (pr && pr.sum / pr.n < .75) recs.push(`Priority-setting questions: ${Math.round(100 * pr.sum / pr.n)}%. Run two "Who do you see first?" sets.`);
  if (!recs.length) recs.push("Strong, even performance. Take a longer exam next or switch to clinical-judgment focus.");
  const rev = UI.mockReview;
  return head("Mock exam results", fmtDate(m.ts) + " · " + m.n + " questions · " + (m.cfg.timed ? "timed" : "untimed") + " · " + fmtTime(m.dur / 1000) + " total", `<button class="btn" data-a="mockBack">New exam</button>`)
   + `<div class="grid g4"><div class="panel"><div class="small muted">Score (partial credit)</div><div class="mon-days" style="font-size:3rem;color:${m.score >= 80 ? "var(--ok)" : m.score >= 65 ? "var(--warn)" : "var(--bad)"}">${m.score}%</div></div><div class="panel"><div class="small muted">Fully correct</div><div class="mon-days num" style="font-size:3rem;color:var(--ink)">${m.full}/${m.n}</div></div><div class="panel"><div class="small muted">Answered</div><div class="mon-days num" style="font-size:3rem;color:var(--ink)">${m.answered}</div></div><div class="panel"><div class="small muted">Avg time per question</div><div class="mon-days num" style="font-size:3rem;color:var(--ink)">${Math.round(m.avgMs / 1000)}s</div></div></div>
   <p class="small muted">This is your score in this app only. It is not a HESI conversion score and doesn't predict your official result. Select-all, matrix, and bow-tie items earn partial credit.</p>
   <div class="callout teal"><h4>What to do next</h4>${li(recs)}${missed.length ? `<button class="btn primary sm" style="margin-top:10px" data-a="mockMissed" data-x="${m.id}">Practice the ${missed.length} I missed</button>` : ""}</div>
   <div class="grid g2"><div class="panel"><h3 style="margin-bottom:10px">By subject</h3>${barRows(m.bySubj)}</div><div class="panel"><h3 style="margin-bottom:10px">By clinical judgment step</h3>${barRows(m.byCj)}</div><div class="panel"><h3 style="margin-bottom:10px">By skill</h3>${barRows(m.bySkill)}</div><div class="panel"><h3 style="margin-bottom:10px">By question type</h3>${barRows(m.byFmt, k => FMT_NAME[k] || k)}</div></div>
   ${topics.length ? `<div class="panel"><h3>Missed concepts</h3><div class="chips" style="margin-top:10px">${topics.map(t => `<span class="chip" style="cursor:default">${esc(t)}</span>`).join("")}</div></div>` : ""}
   <div class="panel"><h3>Review every answer</h3><div class="list" style="margin-top:6px">${m.res.map((r, i) => { const q = DATA.Q[r[0]]; if (!q) return ""; const open = rev === r[0]; let inner = ""; if (open) { const st = newQState(q, "practice", r[3]); st.done = true; st.score = r[1]; inner = `<div style="padding:14px 4px">${renderQ(st)}${explainHTML(st)}</div>`; } return `<div><button class="item-row" data-a="mockRev" data-x="${q.id}"><span class="pill ${r[1] >= .999 ? "ok" : r[1] > 0 ? "warn" : "bad"} num">${i + 1}</span><span><b>${esc(q.topic)}</b><br><span class="tiny muted">${r[2] ? (r[1] >= .999 ? "Correct" : Math.round(r[1] * 100) + "%") : "Not answered"} · ${esc(q.subj)}</span></span></button>${inner}</div>`; }).join("")}</div></div>`;
}

/* =================== ANALYTICS =================== */
ROUTES.analytics = () => {
  const t = UI.anTab || "over"; let body = "";
  const all = itemStats();
  if (t === "over") {
    if (!all.n) body = `<div class="empty">No results yet. Answer practice questions, run cases, or take a mock exam — your analytics will build from your own answers only.</div>`;
    else { const bySys = window.SYSTEMS.map(s => ({ s, m: masteryFor(q => DATA.sysOf(q.subj) === s.id) })).filter(x => x.m.st.n);
      const agg = fn => { const m = {}; S.att.forEach(a => { const q = DATA.Q[a[0]]; if (!q) return; [].concat(fn(q)).forEach(k => { (m[k] = m[k] || { n: 0, sum: 0 }); m[k].n++; m[k].sum += a[1]; }); }); return m; };
      const days = [...Array(28).keys()].reverse().map(i => { const d = new Date(Date.now() - i * DAY); const r = S.days[todayKey(d)] || {}; return { d, q: r.q || 0, acc: r.q ? Math.round(100 * r.ok / r.q) : null }; });
      const mx = Math.max(1, ...days.map(x => x.q));
      const confWrong = S.att.filter(a => a[5] === 2 && a[1] < .999).length, confN = S.att.filter(a => a[5] === 2).length;
      const missCount = {}; S.att.filter(a => a[1] < .999).forEach(a => { const q = DATA.Q[a[0]]; if (q) missCount[q.topic] = (missCount[q.topic] || 0) + 1; });
      const topMiss = Object.entries(missCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const rs = {}; S.journal.forEach(j => { if (j.reason != null) rs[j.reason] = (rs[j.reason] || 0) + 1; }); const topR = Object.entries(rs).sort((a, b) => b[1] - a[1])[0];
      const recs = analyticsRecs(bySys, agg(q => skillTags(q)), topR, confWrong);
      body = `<div class="grid g4"><div class="panel"><div class="small muted">Questions answered</div><div class="mon-days num" style="font-size:2.6rem;color:var(--ink)">${all.n}</div><div class="tiny muted">${all.distinct} different questions</div></div><div class="panel"><div class="small muted">Overall accuracy</div><div class="mon-days num" style="font-size:2.6rem;color:var(--teal)">${all.acc}%</div></div><div class="panel"><div class="small muted">Mistake journal</div><div class="mon-days num" style="font-size:2.6rem;color:var(--bad)">${S.journal.filter(j => !j.resolved).length}</div><div class="tiny muted">open items</div></div><div class="panel"><div class="small muted">Sure but wrong</div><div class="mon-days num" style="font-size:2.6rem;color:var(--warn)">${confWrong}</div><div class="tiny muted">of ${confN} answers marked "Sure"</div></div></div>
       <div class="callout teal"><h4>Recommended next steps</h4>${li(recs)}</div>
       <div class="panel"><h3>Mastery by body system</h3><p class="small muted" style="margin:4px 0 12px">"Demonstrated mastery" requires 80%+ recent accuracy on at least 10 different questions, more than one question type, and at least 3 correct recalls on later days.</p><div class="stack-s">${bySys.map(({ s, m }) => `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><button class="btn ghost sm" style="padding:0" data-a="go" data-x="systems" data-y="sys-${s.id}">${esc(s.name)}</button><div class="row"><div class="meter" style="width:180px"><span style="width:${m.racc}%;background:${m.racc >= 80 ? "var(--ok)" : m.racc >= 65 ? "var(--warn)" : "var(--bad)"}"></span></div><span class="num small" style="width:84px">${m.racc}% · ${m.st.n}</span><span class="pill ${m.cls}">${m.label}</span></div></div>`).join("")}</div></div>
       <div class="grid g2"><div class="panel"><h3 style="margin-bottom:10px">Clinical judgment steps</h3>${barRows(agg(q => cjSkill(q)))}</div><div class="panel"><h3 style="margin-bottom:10px">Skill areas</h3>${barRows(agg(q => skillTags(q)))}</div><div class="panel"><h3 style="margin-bottom:10px">Client needs categories</h3>${barRows(agg(q => q.cn))}</div><div class="panel"><h3 style="margin-bottom:10px">Difficulty</h3>${barRows(agg(q => DIFF_NAME[q.diff] || "Other"))}</div></div>
       <div class="panel"><h3>Daily activity, last 4 weeks</h3><div class="row" style="align-items:flex-end;gap:3px;height:120px;margin-top:12px">${days.map(x => `<div title="${x.d.toLocaleDateString()}: ${x.q} questions${x.acc != null ? ", " + x.acc + "%" : ""}" style="flex:1;height:${Math.max(2, 100 * x.q / mx)}px;background:${x.q ? (x.acc >= 80 ? "var(--ok)" : x.acc >= 65 ? "var(--warn)" : "var(--bad)") : "var(--line)"};border-radius:4px"></div>`).join("")}</div><div class="spread tiny muted" style="margin-top:4px"><span>${fmtDate(days[0].d)}</span><span>Color shows that day's accuracy</span><span>Today</span></div></div>
       ${topMiss.length ? `<div class="panel"><h3>Most frequently missed</h3><div class="list" style="margin-top:6px">${topMiss.map(([t, n]) => `<div class="spread" style="padding:8px 0"><span>${esc(t)}</span><span class="pill bad num">${n}×</span></div>`).join("")}</div></div>` : ""}`; }
  } else if (t === "journal") body = journalHTML();
  else if (t === "data") body = `<div class="panel stack"><h3>Your data</h3><p class="small">Progress is saved in this browser and, when you're signed in, to your private space on your account. Nothing is shared with anyone else.</p><div class="row"><button class="btn" data-a="dataExport">Copy my progress (backup)</button><button class="btn" data-a="dataImport">Restore from a backup</button><button class="btn danger" data-a="dataReset">Reset all progress</button></div><p class="small muted">${all.n} answers · ${Object.keys(S.items).length} questions seen · ${Object.keys(S.cards).length} cards rated · ${S.mocks.length} mock exams.</p></div>`;
  return head("Learning Analytics", "Built only from your answers in this app. Completion isn't counted as mastery.") + tabs("anTab", [["over", "Overview"], ["journal", "Mistake journal"], ["data", "Backup and reset"]], t) + body;
};
function analyticsRecs(bySys, skills, topR, confWrong) {
  const r = [];
  bySys.filter(x => x.m.st.n >= 5).sort((a, b) => a.m.racc - b.m.racc).slice(0, 2).forEach(x => { if (x.m.racc < 80) r.push(`${x.s.name}: ${x.m.racc}% on recent questions. Review its lessons and do 10 more ${x.s.short} questions.`); });
  Object.entries(skills).filter(([, v]) => v.n >= 4).forEach(([k, v]) => { const p = Math.round(100 * v.sum / v.n); if (p < 70) r.push(`${k}: ${p}%. ${({ "Priority setting": "Run two 'Who do you see first?' sets and a First Five Minutes scenario.", "Medication safety": "Work through the Medication Safety Simulator cases.", "Lab and vital sign interpretation": "Do the lab sets and ABG drills, then the vital-sign monitor practice.", "Patient teaching": "Answer the 'further teaching needed' questions in Patient Teaching.", "Delegation and scope": "Read the delegation lesson and practice scope questions." })[k] || "Practice more mixed questions in this area."}`); });
  if (topR) r.push(`Your most common miss reason: "${REASONS[topR[0]]}". ${REASON_ADVICE[topR[0]]}`);
  if (confWrong >= 3) r.push(`You felt sure on ${confWrong} answers that were wrong. Those are misconceptions worth targeting — open the mistake journal and filter by topic.`);
  const due = dueItems().length; if (due) r.push(`${due} questions are due for spaced review today.`);
  if (!r.length) r.push("Keep a balanced mix; your results don't show a clear weak area yet.");
  return r;
}
function journalHTML() {
  const f = UI.jf || "open"; const list = S.journal.filter(j => f === "all" || (f === "open" ? !j.resolved : j.resolved)).filter(j => DATA.Q[j.qid]);
  return `<div class="spread"><div class="chips">${[["open", "Open"], ["resolved", "Resolved"], ["all", "All"]].map(([k, l]) => `<button class="chip" data-a="jf" data-x="${k}" aria-pressed="${f === k}">${l}</button>`).join("")}</div>${S.journal.filter(j => !j.resolved).length ? `<button class="btn primary" data-a="jReview">Review open items now</button>` : ""}</div>
   ${list.length ? `<div class="stack">${list.map(j => { const q = DATA.Q[j.qid], les = DATA.lessonForQ(q.id); let yours = ""; if (q.fmt === "mc" && j.resp != null && q.opts) yours = q.opts[j.resp];
     return `<div class="panel"><div class="spread"><div><b>${esc(q.topic)}</b><div class="tiny muted">${esc(q.subj)} · missed ${j.n || 1}× · last ${fmtDate(j.ts)} · review ${j.due <= Date.now() ? "due now" : "on " + fmtDate(j.due)}</div></div>${j.resolved ? `<span class="pill ok">Resolved</span>` : `<span class="pill warn">Open</span>`}</div>
      ${yours ? `<p class="small" style="margin-top:8px"><b>You chose:</b> ${esc(yours)}</p>` : ""}${q.fmt === "mc" ? `<p class="small"><b>Correct:</b> ${esc(q.opts[q.key])}</p>` : ""}<p class="small muted" style="margin-top:4px">${esc(q.takeaway || q.principle || "")}</p>
      <div class="chips reason-chips" style="margin-top:8px">${REASONS.map((t, i) => `<button class="chip" data-a="jReason" data-x="${j.qid}" data-r="${i}" aria-pressed="${j.reason === i}">${t}</button>`).join("")}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm primary" data-a="tryRelated" data-x="${q.id}">Retry</button>${les ? `<button class="btn sm" data-a="go" data-x="systems" data-y="lesson-${les.id}">${icon("book", 14)} ${esc(les.title)}</button>` : ""}</div></div>`; }).join("")}</div>` : `<div class="empty">${f === "open" ? "No open mistakes. Missed questions land here automatically with a review date." : "Nothing here yet."}</div>`}`;
}
Object.assign(ACT, {
  jf: el => { UI.jf = el.dataset.x; rerender(); },
  jReason: el => { const j = S.journal.find(x => x.qid === el.dataset.x); if (j) { j.reason = +el.dataset.r; save(); rerender(); } },
  jReview: () => startPractice(S.journal.filter(j => !j.resolved).map(j => j.qid).slice(0, 20), "Mistake journal review", "analytics"),
  dataExport: () => { const txt = JSON.stringify(S); modal("Your progress backup", `<p class="small">Copy this text and keep it somewhere safe. Paste it into "Restore from a backup" to bring your progress back.</p><textarea id="bk" readonly>${esc(txt)}</textarea><div class="row"><button class="btn primary" id="bkCopy">Copy to clipboard</button></div>`); $("#bkCopy").onclick = () => { navigator.clipboard.writeText(txt).then(() => toast("Copied"), () => { $("#bk").select(); toast("Select all and copy"); }); }; },
  dataImport: () => { modal("Restore from a backup", `<p class="small">Paste a backup below. This replaces your current progress.</p><textarea id="bkIn" placeholder="Paste backup text"></textarea><div class="row"><button class="btn primary" id="bkGo">Restore</button></div>`); $("#bkGo").onclick = () => { try { const d = JSON.parse($("#bkIn").value); if (!d || !d.v || !Array.isArray(d.att)) throw 0; S = Object.assign(DEFAULT(), d); save(); closeModal(); applySettings(); render(); toast("Progress restored"); } catch (e) { toast("That doesn't look like a backup from this app."); } }; },
  dataReset: () => confirmBox("Reset all progress?", "This erases every answer, review schedule, mistake journal entry, and mock exam result. Settings are kept.", "Erase progress", () => { const keep = S.settings; S = DEFAULT(); S.settings = keep; save(); render(); toast("Progress reset"); }, true)
});
