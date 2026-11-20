/* Question engine: render, grade, explain. Practice runner, mock exam runner. */
"use strict";
const FMT_NAME = { mc: "Multiple choice", sata: "Select all that apply", matrix: "Matrix", num: "Calculation", bowtie: "Bow-tie", order: "Ordered response", highlight: "Highlight", cloze: "Drop-down (cloze)" };
const DIFF_NAME = { F: "Foundational", I: "Intermediate", A: "Advanced" };
const TRAP = {
 unsafe: "It looks like action, but it could harm the client or skips a safety step.",
 otherdx: "It fits a different condition that shares some of these findings.",
 irrelevant: "It's true or reasonable, but it doesn't address the problem this question asks about.",
 scope: "The task sounds simple, but the client's condition makes it a licensed-nurse responsibility, or it's outside LVN scope.",
 reassure: "It sounds kind, but it offers false reassurance and closes communication.",
 lower: "It's a real need, but lower priority than the physiologic or safety threat.",
 delay: "Gathering more data feels careful, but waiting delays an action the client needs now.",
 later: "It's a correct action, just not the first one.",
 isolated: "It reacts to one finding in isolation instead of the whole pattern.",
 invasive: "It's more invasive than needed when a simpler action comes first.",
 premature: "It jumps to a conclusion or next step before the problem is confirmed."
};
const REASONS = ["I did not know the content", "I misunderstood the question", "I confused two disorders", "I missed a safety priority", "I misinterpreted the lab or vital sign", "I made a medication error", "I rushed", "I guessed"];
const REASON_ADVICE = {
 0: "Read the linked lesson, then retry the related question.", 1: "Before answering, restate the question in your own words: who, what problem, and what is being asked (first, best, further teaching).",
 2: "Open the matching disease comparison and practice with one side hidden.", 3: "Practice in Nursing Priorities: run a 'Who do you see first?' set.",
 4: "Drill the Laboratory Values and Vital Signs references.", 5: "Do two Medication Safety Simulator cases.", 6: "Use timed mock exams to build pace without rushing: read every option before choosing.", 7: "Mark items you guess on; the app reviews them sooner."
};
function cjSkill(q) {
  if (q.cj) return q.cj;
  return ({ Interpret: "Analyze cues", Prioritize: "Prioritize hypotheses", Sequence: "Prioritize hypotheses", Intervene: "Take action", Evaluate: "Evaluate outcomes", Teach: "Take action", Clarify: "Generate solutions", Scope: "Generate solutions", Calculate: "Take action" })[q.ask] || "Recognize cues";
}
const LAB_RE = /potassium|sodium|glucose|inr|aptt|platelet|hemoglobin|hgb|wbc|creatinine|bun|level|mEq|mg\/dL|ammonia|calcium|magnesium|abg|ph |lab/i;
function skillTags(q) {
  const t = [];
  if (q.ask === "Prioritize" || q.ask === "Sequence" || q.comp === "priority" || /priorit|first/i.test(q.topic + " " + q.stem)) t.push("Priority setting");
  if (q.comp === "med" || q.cn === "Pharmacological Therapies" || q.med) t.push("Medication safety");
  if (LAB_RE.test(q.topic + " " + q.stem)) t.push("Lab and vital sign interpretation");
  if (q.ask === "Teach" || q.comp === "teach") t.push("Patient teaching");
  if (q.ask === "Scope" || q.comp === "scope") t.push("Delegation and scope");
  if (!t.length) t.push("Knowledge and application");
  return t;
}

/* ---------- Question state ---------- */
const QS = {}; // uid -> state
let QUID = 0;
function newQState(q, mode, prevResp) {
  const uid = "q" + (++QUID);
  const st = { uid, q, mode, done: false, score: null, t0: Date.now(), conf: null };
  const n = (q.opts || []).length;
  st.ord = (q.fmt === "mc" || q.fmt === "sata") ? shuffle([...Array(n).keys()]) : [...Array(n).keys()];
  if (q.fmt === "bowtie") st.bord = { cond: shuffle([...Array(q.cond.opts.length).keys()]), act: shuffle([...Array(q.act.opts.length).keys()]), par: shuffle([...Array(q.par.opts.length).keys()]) };
  st.resp = prevResp != null ? JSON.parse(JSON.stringify(prevResp)) : initResp(q, st);
  QS[uid] = st; return st;
}
function initResp(q, st) {
  switch (q.fmt) {
    case "mc": return null; case "sata": case "highlight": return [];
    case "matrix": return q.rows.map(() => -1); case "num": return "";
    case "bowtie": return { cond: -1, act: [], par: [] };
    case "order": { let o = shuffle([...Array(q.opts.length).keys()]); if (o.every((v, i) => v === q.key[i]) && o.length > 1) o = o.slice(1).concat(o[0]); return o; }
    case "cloze": return q.blanks.map(() => -1);
  }
  return null;
}
function answered(q, r) {
  if (r == null) return false;
  switch (q.fmt) {
    case "mc": return r !== null; case "sata": case "highlight": return r.length > 0;
    case "matrix": case "cloze": return r.every(x => x >= 0); case "num": return String(r).trim() !== "" && !isNaN(parseFloat(r));
    case "bowtie": return r.cond >= 0 && r.act.length === 2 && r.par.length === 2;
    case "order": return true;
  }
  return false;
}
function grade(q, r) {
  if (!answered(q, r)) return 0;
  switch (q.fmt) {
    case "mc": return r === q.key ? 1 : 0;
    case "sata": case "highlight": { const k = new Set(q.key); let hit = 0, bad = 0; r.forEach(i => k.has(i) ? hit++ : bad++); return Math.max(0, (hit - bad) / k.size); }
    case "matrix": return r.filter((v, i) => v === q.key[i]).length / q.rows.length;
    case "num": { const v = parseFloat(String(r).replace(/[^0-9.\-]/g, "")); return Math.abs(v - Number(q.key)) <= (Number(q.tol) || 0) + 1e-9 ? 1 : 0; }
    case "bowtie": { let s = r.cond === q.cond.key ? 1 : 0; r.act.forEach(i => { if (q.act.key.includes(i)) s++; }); r.par.forEach(i => { if (q.par.key.includes(i)) s++; }); return s / 5; }
    case "order": { const exact = r.every((v, i) => v === q.key[i]); return exact ? 1 : r.filter((v, i) => v === q.key[i]).length / r.length; }
    case "cloze": return r.filter((v, i) => v === q.blanks[i].key).length / q.blanks.length;
  }
  return 0;
}
const L = i => String.fromCharCode(65 + i);

/* ---------- Rendering ---------- */
function qMeta(q, mode) {
  if (mode === "exam") return `<div class="q-meta"><span class="pill">${FMT_NAME[q.fmt] || q.fmt}</span></div>`;
  return `<div class="q-meta"><span class="pill teal">${esc(q.subj)}</span><span class="pill">${FMT_NAME[q.fmt] || q.fmt}</span>${q.diff ? `<span class="pill">${DIFF_NAME[q.diff] || q.diff}</span>` : ""}${q.cn ? `<span class="pill">${esc(q.cn)}</span>` : ""}<span class="pill info">${esc(cjSkill(q))}</span></div>`;
}
function renderQ(st) {
  const q = st.q, r = st.resp, done = st.done, rev = done && st.mode !== "exam";
  let body = "";
  if (q.exhibit) body += `<div class="exhibit panel flat">${q.exhibit}</div>`;
  if (q.trend) body += trendChart(q.trend);
  body += `<div class="q-stem">${emphStem(q.stem)}</div>`;
  const dis = done ? "disabled" : "";
  if (q.fmt === "mc" || q.fmt === "sata") {
    const multi = q.fmt === "sata";
    body += `<div class="opts" role="${multi ? "group" : "radiogroup"}">` + st.ord.map((oi, di) => {
      const sel = multi ? r.includes(oi) : r === oi;
      const isKey = multi ? q.key.includes(oi) : q.key === oi;
      let cls = "opt" + (multi ? " sq" : "");
      if (rev) cls += isKey ? (sel ? " right" : " missed") : (sel ? " wrong" : "");
      const tag = rev ? (isKey ? `<span class="tag-ok">${sel ? "Correct" : "Missed"}</span>` : sel ? `<span class="tag-bad">Incorrect</span>` : "") : "";
      return `<button class="${cls}" ${multi ? `role="checkbox" aria-checked="${sel}"` : `role="radio" aria-checked="${sel}"`} data-a="qopt" data-u="${st.uid}" data-x="${oi}" ${dis}><span class="mk">${multi ? (sel ? icon("check", 14, 3) : "") : L(di)}</span><span>${esc(q.opts[oi])}</span>${tag}</button>`;
    }).join("") + `</div>`;
    if (multi && !done) body += `<p class="small muted">Select every option that applies.</p>`;
  } else if (q.fmt === "matrix") {
    body += `<div class="tablewrap"><table class="t matrix"><thead><tr><th>Finding</th>${q.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>` + q.rows.map((row, ri) => {
      const ok = rev ? (r[ri] === q.key[ri] ? " r-ok" : " r-bad") : "";
      return `<tr class="${ok}"><td>${esc(row)}${rev && r[ri] !== q.key[ri] ? `<div class="small" style="color:var(--ok)">Correct: ${esc(q.cols[q.key[ri]])}</div>` : ""}</td>${q.cols.map((c, ci) => `<td><label class="mc"><input type="radio" name="${st.uid}-r${ri}" aria-label="${esc(row)}: ${esc(c)}" data-a="qmat" data-u="${st.uid}" data-r="${ri}" data-x="${ci}" ${r[ri] === ci ? "checked" : ""} ${dis}><span class="ml" aria-hidden="true">${esc(c)}</span></label></td>`).join("")}</tr>`;
    }).join("") + `</tbody></table></div>`;
  } else if (q.fmt === "num") {
    body += `<div class="row"><label class="field" style="flex-direction:row;align-items:center;gap:10px">Answer <input type="text" inputmode="decimal" id="${st.uid}-num" value="${esc(r)}" ${dis} style="width:140px" data-in="qnum" data-u="${st.uid}"></label><span class="muted">${esc(q.unit || "")}</span>${rev ? (st.score === 1 ? `<span class="pill ok">Correct</span>` : `<span class="pill bad">Correct answer: ${esc(q.key)} ${esc(q.unit || "")}</span>`) : ""}</div>`;
  } else if (q.fmt === "highlight") {
    body += `<div class="note-box">` + q.segs.map((sg, i) => {
      if (!sg.s) return esc(sg.t);
      const sel = r.includes(i), isKey = q.key.includes(i);
      let cls = "seg"; if (rev) cls += isKey ? (sel ? " right" : " missed") : (sel ? " wrong" : "");
      return `<span class="${cls}" role="button" tabindex="0" aria-pressed="${sel}" data-a="qseg" data-u="${st.uid}" data-x="${i}">${esc(sg.t)}</span>`;
    }).join("") + `</div><p class="small muted">Tap each finding to highlight or unhighlight it.</p>`;
  } else if (q.fmt === "order") {
    body += `<div class="order-list">` + r.map((oi, pos) => {
      const cls = rev ? (q.key[pos] === oi ? " right" : " wrong") : "";
      return `<div class="order-item${cls}"><span class="n">${pos + 1}</span><span>${esc(q.opts[oi])}${rev && q.key[pos] !== oi ? `<div class="small" style="color:var(--ok)">Should be: ${esc(q.opts[q.key[pos]])}</div>` : ""}</span>${done ? "" : `<span class="mv"><button class="iconbtn" style="width:34px;height:34px" aria-label="Move up" data-a="qmove" data-u="${st.uid}" data-x="${pos}" data-d="-1" ${pos === 0 ? "disabled" : ""}>${icon("up")}</button><button class="iconbtn" style="width:34px;height:34px" aria-label="Move down" data-a="qmove" data-u="${st.uid}" data-x="${pos}" data-d="1" ${pos === r.length - 1 ? "disabled" : ""}>${icon("down")}</button></span>`}</div>`;
    }).join("") + `</div><p class="small muted">Use the arrows to put the steps in order, first at the top.</p>`;
  } else if (q.fmt === "cloze") {
    const parts = q.text.split(/(\{\d+\})/);
    body += `<div class="note-box" style="line-height:2.4">` + parts.map(p => { const m = p.match(/^\{(\d+)\}$/); if (!m) return esc(p).replace(/\n/g, "<br>"); const bi = +m[1], b = q.blanks[bi];
      const bad = rev && r[bi] !== b.key;
      return `<select aria-label="Blank ${bi + 1}" data-in="qcloze" data-u="${st.uid}" data-x="${bi}" ${dis} style="${rev ? (bad ? "border-color:var(--bad)" : "border-color:var(--ok)") : ""}"><option value="-1">Select…</option>${b.opts.map((o, oi) => `<option value="${oi}" ${r[bi] === oi ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>${bad ? ` <span class="small" style="color:var(--ok)">(${esc(b.opts[b.key])})</span>` : ""}`; }).join("") + `</div>`;
  } else if (q.fmt === "bowtie") {
    const col = (part, title, max) => `<div class="col"><h4>${title}${max > 1 ? ` <span class="small muted">(choose ${max})</span>` : ""}</h4>${st.bord[part].map(oi => {
      const sel = part === "cond" ? r.cond === oi : r[part].includes(oi);
      const isKey = part === "cond" ? q.cond.key === oi : q[part].key.includes(oi);
      let cls = "opt sq"; if (rev) cls += isKey ? (sel ? " right" : " missed") : (sel ? " wrong" : "");
      return `<button class="${cls}" aria-pressed="${sel}" data-a="qbow" data-u="${st.uid}" data-p="${part}" data-x="${oi}" ${dis}><span class="mk">${sel ? icon("check", 14, 3) : ""}</span><span>${esc(q[part].opts[oi])}</span></button>`; }).join("")}</div>`;
    body += `<div class="bowtie">${col("act", "Actions to take", 2)}<div class="center">${col("cond", "Condition most likely", 1)}</div>${col("par", "Parameters to monitor", 2)}</div>`;
  }
  return `<div class="q" id="${st.uid}">${qMeta(q, st.mode)}${body}</div>`;
}

/* ---------- Explanation ("The wrong answer explained") ---------- */
function relatedQ(q, excludeIds) {
  const ex = new Set([q.id].concat(excludeIds || []));
  const cand = (q.sameFormExclude || []).map(id => DATA.Q[id]).filter(x => x && !x.caseId && !ex.has(x.id));
  if (cand.length) return cand[0];
  const same = DATA.pool.filter(x => x.subj === q.subj && x.comp === q.comp && !ex.has(x.id));
  const unseen = same.filter(x => !S.items[x.id]);
  return (unseen.length ? pick(unseen) : same.length ? pick(same) : null);
}
function explainHTML(st) {
  const q = st.q, r = st.resp, sc = st.score, ok = sc >= .999;
  const verdict = ok ? `<div class="verdict ok"><span class="badge">${icon("check", 20, 3)}</span>Correct</div>` : sc > 0 ? `<div class="verdict part"><span class="badge">${Math.round(sc * 100)}%</span>Partly correct</div>` : `<div class="verdict bad"><span class="badge">${icon("x", 20, 3)}</span>Not quite</div>`;
  let h = verdict;
  // correct answer statement
  if (q.fmt === "mc") h += `<div class="callout ok"><h4 class="eh">${icon("check", 18, 2.6)}Correct answer</h4>${esc(q.opts[q.key])}</div>`;
  else if (q.fmt === "sata") h += `<div class="callout ok"><h4 class="eh">${icon("check", 18, 2.6)}Correct answers</h4><ul class="clean">${q.key.map(i => `<li>${esc(q.opts[i])}</li>`).join("")}</ul></div>`;
  else if (q.fmt === "bowtie") h += `<div class="callout ok"><h4>Correct bow-tie</h4><b>Condition:</b> ${esc(q.cond.opts[q.cond.key])}<br><b>Actions:</b> ${q.act.key.map(i => esc(q.act.opts[i])).join("; ")}<br><b>Monitor:</b> ${q.par.key.map(i => esc(q.par.opts[i])).join("; ")}</div>`;
  h += `<div><h4 class="eh">${icon("info", 18, 2.2)}Why this is the answer</h4><p class="prose">${emph(q.rat)}</p></div>`;
  // every option explained (mc/sata)
  if ((q.fmt === "mc" || q.fmt === "sata") && q.opts) {
    const keyset = new Set([].concat(q.key));
    h += `<details class="x" ${ok ? "" : "open"}><summary>Why each option is right or wrong</summary><div class="in"><div class="list">${q.opts.map((o, i) => {
      const isK = keyset.has(i); const w = (q.why || {})[i] || (q.why || {})[String(i)];
      const txt = w || (isK ? (q.fmt === "sata" ? "Belongs: supported by the rationale above." : "Best answer: see the rationale above.") : (TRAP[(q.traps || {})[i]] || "Less appropriate than the correct answer for this client."));
      return `<div class="opt-why"><span class="pill ${isK ? "ok" : "bad"}">${isK ? "Correct" : "Incorrect"}</span><div><b>${esc(o)}</b><br><span class="small">${esc(txt)}</span></div></div>`; }).join("")}</div></div></details>`;
  }
  // wrong-answer breakdown (mc)
  if (!ok && q.fmt === "mc" && r != null) {
    const trap = (q.traps || {})[r]; const cmp = q.compare;
    const tempting = (cmp && cmp.b === r && cmp.bWhy) || TRAP[trap] || "It addresses part of the picture, which makes it feel right.";
    const changes = (cmp && cmp.decider) || q.cues || (q.safer && q.safer.r) || "Look for the finding that makes one action time-critical.";
    h += `<div><h4 style="margin-bottom:8px">The wrong answer explained</h4><div class="wae">
      <div><h4>What you selected</h4><p class="small">${esc(q.opts[r])}</p></div>
      <div><h4>Why it was tempting</h4><p class="small">${esc(tempting)}</p></div>
      <div><h4>Why it isn't best</h4><p class="small">${esc((q.why || {})[r] || TRAP[trap] || "It doesn't address the most important problem.")}</p></div>
      <div><h4>What changes the priority</h4><p class="small">${esc(changes)}</p></div>
      <div style="grid-column:1/-1"><h4>What to remember next time</h4><p class="small">${esc(q.principle || "")} ${esc(q.takeaway || "")}</p>${cmp && cmp.flip ? `<p class="small muted" style="margin-top:4px"><b>If the scenario changed:</b> ${esc(cmp.flip)}</p>` : ""}</div></div></div>`;
  } else if (!ok && q.takeaway) h += `<div class="callout teal"><h4>What to remember next time</h4>${esc(q.principle || "")} ${esc(q.takeaway)}</div>`;
  if (q.safer) h += `<details class="x"><summary>Reason it through, step by step</summary><div class="in"><div class="stack-s small">${[["What is being asked", q.safer.s], ["Key data", q.safer.a], ["Framework", q.safer.f], ["Eliminate", q.safer.e], ["Decide", q.safer.r]].filter(x => x[1]).map(([k, v]) => `<div><b>${k}:</b> ${esc(v)}</div>`).join("")}</div></div></details>`;
  if (q.med) h += `<div class="callout info"><h4>Medication connection</h4><div class="small stack-s">${[["Why given", q.med.why], ["Check first", q.med.check], ["Give", q.med.give], ["Watch for", q.med.watch], ["Teach", q.med.teach]].filter(x => x[1]).map(([k, v]) => `<div><b>${k}:</b> ${esc(v)}</div>`).join("")}</div></div>`;
  if (q.aid) h += memBox(`<b>${esc(q.aid)}</b>`, "Remember this");
  const les = DATA.lessonForQ(q.id);
  h += `<div class="row small muted">${q.src ? `<span>Source: ${esc(q.src)}${q.pg ? ", " + esc(q.pg) : ""}</span>` : ""}</div>`;
  h += `<div class="row">${les ? `<button class="btn sm" data-a="go" data-x="systems" data-y="lesson-${les.id}">${icon("book", 16)} Lesson: ${esc(les.title)}</button>` : `<button class="btn sm" data-a="go" data-x="systems" data-y="sys-${DATA.sysOf(q.subj)}">${icon("book", 16)} ${esc(DATA.sysName(DATA.sysOf(q.subj)))}</button>`}${bmBtn("q:" + q.id)}</div>`;
  if (!ok && st.mode !== "exam") {
    const j = S.journal.find(x => x.qid === q.id && !x.resolved);
    h += `<div class="stack-s"><h4>Why did you miss it? <span class="small muted">(saved to your mistake journal)</span></h4><div class="chips reason-chips">${REASONS.map((t, i) => `<button class="chip" data-a="qreason" data-x="${q.id}" data-r="${i}" aria-pressed="${j && j.reason === i}">${t}</button>`).join("")}</div>${j && j.reason != null ? `<p class="small muted">${esc(REASON_ADVICE[j.reason])}</p>` : ""}</div>`;
    const rq = relatedQ(q);
    if (rq) h += `<div class="callout teal spread"><div><h4>Try again</h4><span class="small">A related question that tests the same principle: ${esc(rq.topic)}</span></div><button class="btn primary sm" data-a="tryRelated" data-x="${rq.id}">Try it now</button></div>`;
  }
  return `<div class="explain">${h}</div>`;
}

/* ---------- Interactions ---------- */
function stOf(el) { return QS[el.dataset.u]; }
function refreshQ(st) { const el = document.getElementById(st.uid); if (el) el.outerHTML = renderQ(st); if (st.onChange) st.onChange(st); }
Object.assign(ACT, {
  qopt: el => { const st = stOf(el); if (!st || st.done) return; const i = +el.dataset.x; if (st.q.fmt === "sata") st.resp = st.resp.includes(i) ? st.resp.filter(x => x !== i) : st.resp.concat(i); else st.resp = i; refreshQ(st); },
  qmat: el => { const st = stOf(el); if (!st || st.done) return; st.resp[+el.dataset.r] = +el.dataset.x; if (st.onChange) st.onChange(st); },
  qseg: el => { const st = stOf(el); if (!st || st.done) return; const i = +el.dataset.x; st.resp = st.resp.includes(i) ? st.resp.filter(x => x !== i) : st.resp.concat(i); refreshQ(st); },
  qmove: el => { const st = stOf(el); if (!st || st.done) return; const p = +el.dataset.x, d = +el.dataset.d, a = st.resp; const t = a[p + d]; a[p + d] = a[p]; a[p] = t; refreshQ(st); const b = document.querySelector(`#${st.uid} [data-x="${p + d}"][data-d="${d}"]`); if (b && !b.disabled) b.focus(); },
  qbow: el => { const st = stOf(el); if (!st || st.done) return; const p = el.dataset.p, i = +el.dataset.x; if (p === "cond") st.resp.cond = i; else { const a = st.resp[p]; if (a.includes(i)) st.resp[p] = a.filter(x => x !== i); else if (a.length < 2) a.push(i); else { a.shift(); a.push(i); } } refreshQ(st); },
  qreason: el => { const j = S.journal.find(x => x.qid === el.dataset.x && !x.resolved); if (j) { j.reason = +el.dataset.r; save(); } const box = el.closest(".stack-s"); if (box) { $$(".chip", box).forEach(c => c.setAttribute("aria-pressed", c === el)); let p = box.querySelector("p"); if (!p) { p = document.createElement("p"); p.className = "small muted"; box.appendChild(p); } p.textContent = REASON_ADVICE[+el.dataset.r]; } },
  qconf: el => { const st = stOf(el); if (!st) return; st.conf = +el.dataset.x; $$(`[data-a="qconf"][data-u="${st.uid}"]`).forEach(b => b.setAttribute("aria-pressed", b === el)); },
  tryRelated: el => { startPractice([el.dataset.x], "Related question", route); }
});
document.addEventListener("input", ev => { const el = ev.target; if (el.dataset.in === "qnum") { const st = QS[el.dataset.u]; if (st && !st.done) { st.resp = el.value; if (st.onChange) st.onChange(st); } } });
document.addEventListener("change", ev => { const el = ev.target; if (el.dataset.in === "qcloze") { const st = QS[el.dataset.u]; if (st && !st.done) { st.resp[+el.dataset.x] = +el.value; if (st.onChange) st.onChange(st); } } if (el.dataset.a === "qmat" && el.tagName === "INPUT") { /* handled by click */ } });
document.addEventListener("keydown", ev => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.classList && (ev.target.classList.contains("seg") || ev.target.classList.contains("cmp-cell"))) { ev.preventDefault(); ev.target.click(); } });

/* ---------- Practice runner (tutor mode) ---------- */
function startPractice(ids, title, back, opts = {}) {
  ids = ids.filter(id => DATA.Q[id]);
  if (!ids.length) { toast("No questions match. Try different filters."); return; }
  UI.run = { ids, i: 0, title, back: back || "bank", res: [], st: null, opts };
  navTo("practice"); window.scrollTo(0, 0);
}
function runnerHTML() {
  const R = UI.run;
  if (!R) return `<div class="empty">No practice session is running. <button class="btn sm" data-a="nav" data-x="bank">Open the question bank</button></div>`;
  if (R.i >= R.ids.length) return runnerSummary();
  const q = DATA.Q[R.ids[R.i]];
  if (!R.st || R.st.q.id !== q.id) R.st = newQState(q, "practice");
  const st = R.st;
  st.onChange = () => { const b = $("#qSubmit"); if (b) b.disabled = !answered(st.q, st.resp); };
  const n = R.ids.length, done = R.res.length;
  const caseRec = q.caseId ? (DATA.cases.find(c => c.case === q.caseId) || {}) : null;
  return `<div class="qbar"><div><div class="crumb"><button data-a="endRun">${icon("left", 14)} Back</button></div><h2>${esc(R.title)}</h2></div><div class="row" style="flex:1;max-width:420px"><span class="small muted num">Question ${R.i + 1} of ${n}</span><div class="progress-line"><span style="width:${100 * done / n}%"></span></div></div></div>
   ${caseRec ? `<details class="x"><summary>Client record: ${esc(caseRec.title)}</summary><div class="in exhibit">${caseRec.record || ""}</div></details>` : ""}
   <div class="panel raised">${renderQ(st)}
   ${st.done ? explainHTML(st) : `<div class="spread" style="margin-top:16px"><div class="conf"><span class="small muted">How sure are you?</span>${["Guessing", "Unsure", "Sure"].map((t, i) => `<button class="chip" data-a="qconf" data-u="${st.uid}" data-x="${i}" aria-pressed="${st.conf === i}">${t}</button>`).join("")}</div><button class="btn primary" id="qSubmit" data-a="runSubmit" ${answered(q, st.resp) ? "" : "disabled"}>Submit answer</button></div>`}
   ${st.done ? `<div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary big" data-a="runNext">${R.i + 1 >= n ? "See session summary" : "Next question"} ${icon("right")}</button></div>` : ""}</div>`;
}
function runnerSummary() {
  const R = UI.run, n = R.res.length, c = R.res.filter(x => x.s >= .999).length;
  const avg = n ? Math.round(R.res.reduce((a, x) => a + x.s, 0) / n * 100) : 0;
  return `<div class="page-head"><div><h1>Session complete</h1><p class="lede">${esc(R.title)}</p></div></div>
  <div class="grid g3"><div class="panel"><div class="muted small">Fully correct</div><div class="mon-days" style="color:var(--teal);font-size:3rem">${c}/${n}</div></div><div class="panel"><div class="muted small">Score with partial credit</div><div class="mon-days" style="color:var(--ink);font-size:3rem">${avg}%</div></div><div class="panel"><div class="muted small">Added to mistake journal</div><div class="mon-days" style="color:var(--bad);font-size:3rem">${n - c}</div></div></div>
  <div class="panel"><h3 style="margin-bottom:10px">Review</h3><div class="list">${R.res.map(x => { const q = DATA.Q[x.id]; return `<button class="item-row" data-a="tryRelated" data-x="${q.id}"><span class="pill ${x.s >= .999 ? "ok" : x.s > 0 ? "warn" : "bad"}">${x.s >= .999 ? "Correct" : Math.round(x.s * 100) + "%"}</span><span><b>${esc(q.topic)}</b><br><span class="small muted">${esc(q.subj)}</span></span></button>`; }).join("")}</div></div>
  <div class="row"><button class="btn primary" data-a="endRun">Done</button>${n - c ? `<button class="btn" data-a="retryMissed">Retry the ones I missed</button>` : ""}</div>`;
}
Object.assign(ACT, {
  runSubmit: () => { const R = UI.run, st = R.st; if (!answered(st.q, st.resp)) return; st.done = true; st.score = grade(st.q, st.resp); const ms = Date.now() - st.t0;
    recordAttempt(st.q.id, st.score, "p", ms, st.conf, st.resp); if (st.score >= .999) resolveJournalIfCorrect(st.q.id); R.res.push({ id: st.q.id, s: st.score }); rerender(); const ex = $(".explain"); if (ex) ex.scrollIntoView({ behavior: S.settings.motion === "reduce" ? "auto" : "smooth", block: "start" }); },
  runNext: () => { UI.run.i++; UI.run.st = null; render(); window.scrollTo(0, 0); },
  endRun: () => { const b = UI.run ? UI.run.back : "bank"; UI.run = null; navTo(b); },
  retryMissed: () => { const R = UI.run; startPractice(R.res.filter(x => x.s < .999).map(x => x.id), "Retry missed questions", R.back); }
});
ROUTES.practice = () => runnerHTML();

/* ---------- Mock exam runner ---------- */
function buildMock(cfg) {
  let pool = DATA.pool.slice();
  if (cfg.subj && cfg.subj !== "all") pool = pool.filter(q => DATA.sysOf(q.subj) === cfg.subj);
  if (cfg.focus === "cj") pool = pool.filter(q => q.ngn || q.cj || ["Prioritize", "Interpret", "Sequence", "Evaluate"].includes(q.ask) || q.fmt !== "mc");
  if (cfg.focus === "missed") { const miss = new Set(S.journal.filter(j => !j.resolved).map(j => j.qid)); pool = pool.filter(q => miss.has(q.id)); }
  const casesOK = cfg.subj === "all" && cfg.focus !== "missed";
  // prefer unseen, then least recently seen
  pool = shuffle(pool).sort((a, b) => ((S.items[a.id] || {}).last || 0) - ((S.items[b.id] || {}).last || 0));
  let ids = [];
  if (casesOK && cfg.n >= 25) { const nc = Math.min(DATA.cases.length, Math.floor(cfg.n / 25)); shuffle(DATA.cases).slice(0, nc).forEach(c => ids.push(...c.items.map(i => i.id))); }
  const need = Math.max(0, cfg.n - ids.length);
  // spread across subjects for mixed tests
  ids = ids.concat(pool.slice(0, need).map(q => q.id));
  // keep case items contiguous; shuffle standalone blocks
  const blocks = []; let cur = null;
  ids.forEach(id => { const q = DATA.Q[id]; if (q.caseId) { if (!cur || cur.c !== q.caseId) { cur = { c: q.caseId, ids: [] }; blocks.push(cur); } cur.ids.push(id); } else blocks.push({ ids: [id] }); });
  return shuffle(blocks).flatMap(b => b.ids);
}
function startMock(cfg) {
  const ids = buildMock(cfg);
  if (!ids.length) { toast("No questions available for that selection."); return; }
  const ords = {}; ids.forEach(id => { const q = DATA.Q[id]; const st = newQState(q, "exam"); ords[id] = { ord: st.ord, bord: st.bord, resp: st.resp }; });
  S.session = { active: true, id: "m" + Date.now(), cfg, ids, i: 0, start: Date.now(), limit: cfg.timed ? Math.round(ids.length * cfg.pace) : 0, resp: {}, flag: [], time: {}, ords, short: ids.length < cfg.n, elapsed: 0, lastTick: 0 };
  save(); navTo("exam");
}
function examRemaining() { const s = S.session; return s.limit ? s.limit - (s.elapsed || 0) : null; }
let EXQ = null;
function examHTML() {
  const s = S.session;
  if (!s || !s.active) return `<div class="empty">No exam in progress. <button class="btn sm" data-a="nav" data-x="mock">Set up a mock exam</button></div>`;
  if (UI.examReview) return examReviewHTML();
  const id = s.ids[s.i], q = DATA.Q[id], o = s.ords[id];
  const st = newQState(q, "exam", s.resp[id] != null ? s.resp[id] : o.resp); st.ord = o.ord; if (o.bord) st.bord = o.bord;
  st.onChange = (x) => { s.resp[id] = x.resp; save(); updateExamNav(); };
  EXQ = { st, t: Date.now() };
  const nAns = s.ids.filter(i => answered(DATA.Q[i], s.resp[i])).length;
  const caseRec = q.caseId ? (DATA.cases.find(c => c.case === q.caseId) || {}) : null;
  return `<div class="exam-top"><div><b>Mock Exit Exam</b> <span class="small" style="color:var(--nav-dim)">· no feedback until you submit</span></div><div class="row"><span class="num small" id="exAns">${nAns} of ${s.ids.length} answered</span>${s.limit ? `<span class="timer" id="exTimer">--:--</span>` : `<span class="small">Untimed</span>`}</div></div>
   ${s.short ? `<p class="small muted">Only ${s.ids.length} questions matched your settings, so this exam is shorter than requested.</p>` : ""}
   ${caseRec ? `<div class="panel flat"><h4 style="margin-bottom:6px">Case: ${esc(caseRec.title)}</h4><div class="exhibit">${caseRec.record || ""}</div></div>` : ""}
   <div class="panel raised"><div class="spread" style="margin-bottom:10px"><b class="num">Question ${s.i + 1}</b><button class="btn sm" data-a="exFlag" aria-pressed="${s.flag.includes(id)}">${icon("flag", 16)} ${s.flag.includes(id) ? "Flagged" : "Flag for review"}</button></div>${renderQ(st)}</div>
   <div class="spread"><div class="row"><button class="btn" data-a="exMove" data-x="-1" ${s.i === 0 ? "disabled" : ""}>${icon("left")} Previous</button><button class="btn primary" data-a="exMove" data-x="1">${s.i + 1 >= s.ids.length ? "Review answers" : "Next"} ${icon("right")}</button></div><button class="btn" data-a="exReview">Review and submit</button></div>
   <details class="x"><summary>Question navigator</summary><div class="in"><div class="navgrid" id="exNav">${examNavCells()}</div><p class="tiny muted" style="margin-top:8px">Filled = answered · dot = flagged</p></div></details>`;
}
function examNavCells() { const s = S.session; return s.ids.map((id, k) => `<button class="nq ${answered(DATA.Q[id], s.resp[id]) ? "ans" : ""} ${s.flag.includes(id) ? "flag" : ""} ${k === s.i ? "cur" : ""}" data-a="exGo" data-x="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`).join(""); }
function updateExamNav() { const s = S.session; const n = $("#exNav"); if (n) n.innerHTML = examNavCells(); const a = $("#exAns"); if (a) a.textContent = s.ids.filter(i => answered(DATA.Q[i], s.resp[i])).length + " of " + s.ids.length + " answered"; }
function examTick() { const s = S.session; if (!s || !s.active || !s.limit) return; const now = Date.now(); if (s.lastTick) s.elapsed = (s.elapsed || 0) + Math.min(5, (now - s.lastTick) / 1000); s.lastTick = now; if (Math.round(s.elapsed) % 10 === 0) save(true); const rem = examRemaining(); const t = $("#exTimer"); if (t) { t.textContent = fmtTime(rem); t.classList.toggle("low", rem < 300); } if (rem <= 0) { toast("Time is up — your exam was submitted."); submitExam(); } }
function logExamTime() { if (!EXQ || !S.session) return; const id = EXQ.st.q.id; S.session.time[id] = (S.session.time[id] || 0) + (Date.now() - EXQ.t); EXQ.t = Date.now(); }
function examReviewHTML() {
  const s = S.session; const un = s.ids.map((id, k) => [id, k]).filter(([id]) => !answered(DATA.Q[id], s.resp[id]));
  const fl = s.ids.map((id, k) => [id, k]).filter(([id]) => s.flag.includes(id));
  return `<div class="exam-top"><b>Review before submitting</b>${s.limit ? `<span class="timer" id="exTimer">--:--</span>` : ""}</div>
   <div class="grid g2"><div class="panel"><h3>Unanswered (${un.length})</h3><div class="navgrid" style="margin-top:10px">${un.map(([id, k]) => `<button class="nq" data-a="exGo" data-x="${k}">${k + 1}</button>`).join("") || `<span class="muted small">None — every question has an answer.</span>`}</div></div>
   <div class="panel"><h3>Flagged (${fl.length})</h3><div class="navgrid" style="margin-top:10px">${fl.map(([id, k]) => `<button class="nq flag" data-a="exGo" data-x="${k}">${k + 1}</button>`).join("") || `<span class="muted small">No flagged questions.</span>`}</div></div></div>
   <div class="row"><button class="btn" data-a="exBack">Return to the exam</button><button class="btn primary big" data-a="exSubmitAsk">Submit exam</button></div>`;
}
function submitExam() {
  const s = S.session; if (!s || !s.active) return;
  logExamTime();
  const res = s.ids.map(id => { const q = DATA.Q[id]; const r = s.resp[id]; const sc = grade(q, r); return { id, s: sc, a: answered(q, r), ms: s.time[id] || 0, r }; });
  res.forEach(x => { if (x.a) { recordAttempt(x.id, x.s, "e", x.ms, null, x.r); if (x.s < .999) addJournal(x.id, x.r); else resolveJournalIfCorrect(x.id); } });
  const by = (fn) => { const m = {}; res.forEach(x => { const k = fn(DATA.Q[x.id]); (m[k] = m[k] || { n: 0, sum: 0 }); m[k].n++; m[k].sum += x.s; }); return m; };
  const mock = { id: s.id, ts: Date.now(), n: res.length, answered: res.filter(x => x.a).length, score: Math.round(100 * res.reduce((a, x) => a + x.s, 0) / res.length), full: res.filter(x => x.s >= .999).length,
    bySubj: by(q => q.subj), byFmt: by(q => q.fmt), byCj: by(q => cjSkill(q)), bySkill: by(q => skillTags(q)[0]), avgMs: Math.round(res.reduce((a, x) => a + x.ms, 0) / res.length), res: res.map(x => [x.id, Math.round(x.s * 100) / 100, x.a ? 1 : 0, x.r == null ? null : x.r, Math.round(x.ms / 1000)]), cfg: s.cfg, dur: Date.now() - s.start };
  S.mocks.unshift(mock); S.mocks = S.mocks.slice(0, 30);
  S.session = null; UI.examReview = false; UI.mockView = mock.id; save(); navTo("mock", "result");
}
Object.assign(ACT, {
  exMove: el => { logExamTime(); const s = S.session, d = +el.dataset.x; if (s.i + d >= s.ids.length) { UI.examReview = true; } else s.i = Math.max(0, s.i + d); save(); render(); window.scrollTo(0, 0); },
  exGo: el => { logExamTime(); S.session.i = +el.dataset.x; UI.examReview = false; save(); render(); window.scrollTo(0, 0); },
  exFlag: el => { const s = S.session, id = s.ids[s.i]; s.flag = s.flag.includes(id) ? s.flag.filter(x => x !== id) : s.flag.concat(id); save(); el.setAttribute("aria-pressed", s.flag.includes(id)); el.innerHTML = icon("flag", 16) + (s.flag.includes(id) ? " Flagged" : " Flag for review"); updateExamNav(); },
  exReview: () => { logExamTime(); UI.examReview = true; render(); window.scrollTo(0, 0); },
  exBack: () => { UI.examReview = false; render(); },
  exSubmitAsk: () => { const s = S.session; const un = s.ids.filter(id => !answered(DATA.Q[id], s.resp[id])).length; confirmBox("Submit your exam?", un ? `You have <b>${un} unanswered</b> question${un > 1 ? "s" : ""}. Unanswered questions count as incorrect. You can't change answers after submitting.` : "You can't change answers after submitting.", "Submit exam", submitExam); },
  exQuit: () => confirmBox("Discard this exam?", "Your answers for this attempt will be deleted and nothing will be scored.", "Discard exam", () => { S.session = null; save(); navTo("mock"); }, true)
});
ROUTES.exam = () => examHTML();
VIEW_AFTER.exam = () => { if (S.session && S.session.limit) { S.session.lastTick = Date.now(); examTick(); TIMERS.push(setInterval(examTick, 1000)); } };

/* ---------- Small charts ---------- */
function trendChart(tr) {
  const W = 640, H = 210, pad = { l: 40, r: 16, t: 14, b: 30 };
  const n = tr.times.length; const colors = ["var(--teal)", "var(--bad)", "var(--rx)", "var(--warn)"];
  const x = i => pad.l + (W - pad.l - pad.r) * (n === 1 ? .5 : i / (n - 1));
  const panels = tr.series.map((s, si) => {
    const mn = Math.min(...s.vals), mx = Math.max(...s.vals); const lo = mn - (mx - mn || 1) * .15, hi = mx + (mx - mn || 1) * .15;
    const y = v => pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / (hi - lo));
    const pts = s.vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    return `<div class="panel flat chart" style="padding:12px"><div class="spread"><b class="small">${esc(s.name)}</b><span class="tiny muted">${esc(s.unit)}</span></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.name)} trend: ${s.vals.join(", ")} ${esc(s.unit)}">
      ${[0, .5, 1].map(f => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${pad.t + (H - pad.t - pad.b) * f}" y2="${pad.t + (H - pad.t - pad.b) * f}" stroke="var(--line)"/>`).join("")}
      <polyline points="${pts}" fill="none" stroke="${colors[si % 4]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${s.vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${i === n - 1 ? 6 : 4}" fill="${i === n - 1 ? colors[si % 4] : "var(--surface)"}" stroke="${colors[si % 4]}" stroke-width="2.5"/><text x="${x(i)}" y="${y(v) - 11}" text-anchor="middle" font-size="17" fill="var(--ink)" font-family="var(--body)" font-weight="700">${v}</text>`).join("")}
      ${tr.times.map((t, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="15" fill="var(--muted)" font-family="var(--body)">${esc(t)}</text>`).join("")}
    </svg></div>`; });
  return `<div class="grid ${tr.series.length >= 3 ? "g3" : "g2"}">${panels.join("")}</div>`;
}

/* ---------- Matrix fit (v4.1) ----------
   A matrix table that is wider than its box hides its right-hand columns behind a sideways scroll
   (seen in the case-study column at about 1024px). Switch any overflowing matrix to the stacked layout. */
function fitMatrices(root) {
  (root || document).querySelectorAll("table.matrix").forEach(t => {
    const w = t.closest(".tablewrap"); if (!w) return;
    t.classList.remove("stack");
    if (w.scrollWidth > w.clientWidth + 1) t.classList.add("stack");
  });
}
(function () {
  let raf = 0; const kick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => fitMatrices()); };
  if (typeof MutationObserver === "undefined" || typeof requestAnimationFrame === "undefined") return;
  const mo = new MutationObserver(kick);
  const hook = () => { ["#view", "#layer"].forEach(sel => { const el = document.querySelector(sel); if (el) mo.observe(el, { childList: true, subtree: true }); }); kick(); };
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", hook); else hook();
  window.addEventListener("resize", kick);
  if (typeof applySettings === "function") { const aps = applySettings; applySettings = function () { const r = aps.apply(this, arguments); kick(); return r; }; }
})();
