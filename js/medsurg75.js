/* Med-Surg 75 exam mode + Weakness Challenge. Adds to the existing app; does not change other exams or saved progress. */
(function () {
  const X = window.MS75; if (!X) return;
  const all = X.items.concat(X.reserve);
  all.forEach(q => { DATA.Q[q.id] = Object.assign({}, q); }); // indexed for review/journal, kept out of the random pool
  const IDS = X.items.map(q => q.id);
  const CASE_NAME = { A: X.cases.A, B: X.cases.B, C: X.cases.C };
  const typeOf = q => q.msCase ? "Unfolding case" : (FMT_NAME[q.fmt] || q.fmt);

  /* fixed question list for this exam */
  const _build = buildMock;
  window.buildMock = function (cfg) { return cfg.fixedIds ? cfg.fixedIds.filter(id => DATA.Q[id]) : _build(cfg); };

  /* exam header uses the exam title; case items show which case/stage */
  const _exam = examHTML;
  window.examHTML = function () {
    let h = _exam(); const s = S.session;
    if (s && s.active && s.cfg && s.cfg.title) {
      h = h.replace("<b>Mock Exit Exam</b>", "<b>" + esc(s.cfg.title) + "</b>");
      const q = DATA.Q[s.ids[s.i]];
      if (q && q.msCase && !UI.examReview) h = h.replace('<div class="panel raised">', `<div class="callout teal small"><b>${esc(CASE_NAME[q.msCase])}</b> · Stage ${q.msStage} of 4. Earlier stages stay locked once you move on in a real case; here you may revisit them.</div><div class="panel raised">`);
    }
    return h;
  };

  /* error-reason analysis from the actual wrong choices */
  const REASON = { unsafe: "Missing knowledge (chose an unsafe action)", otherdx: "Confused similar conditions", irrelevant: "Misinterpreted the question", isolated: "Overlooked a critical cue (read one value alone)", lower: "Appropriate but lower priority", later: "Appropriate but lower priority", delay: "Incorrect prioritization (delayed care)", premature: "Overlooked a critical word", scope: "Misinterpreted the question (scope)", reassure: "Incorrect prioritization (false reassurance)", invasive: "Incorrect prioritization" };
  function reasons(q, r) {
    const out = [];
    if (r == null) return ["Not answered"];
    if (q.fmt === "mc") { const t = q.traps && q.traps[r]; out.push(t ? REASON[t] : "Missing knowledge"); }
    else if (q.fmt === "sata" || q.fmt === "highlight") {
      const k = new Set(q.key); if (r.some(i => !k.has(i))) out.push(q.fmt === "highlight" ? "Overlooked a critical word (chose a baseline/expected finding)" : "Missing knowledge (selected an incorrect option)");
      if (q.key.some(i => !r.includes(i))) out.push("Overlooked a critical cue (missed a correct option)");
    } else if (q.fmt === "order") out.push("Incorrect prioritization (sequence)");
    else if (q.fmt === "bowtie") { if (r.cond !== q.cond.key) out.push("Confused similar conditions"); if (r.act.some(i => !q.act.key.includes(i)) || r.par.some(i => !q.par.key.includes(i))) out.push("Missing knowledge (actions/monitoring)"); }
    else if (q.fmt === "matrix") out.push("Confused similar conditions / findings");
    return out.length ? out : ["Missing knowledge"];
  }

  function msSections(m) {
    const rows = m.res.map(r => [DATA.Q[r[0]], r[1], r[3], r[2]]).filter(x => x[0]);
    const by = fn => { const o = {}; rows.forEach(([q, s]) => { const k = fn(q); (o[k] = o[k] || { n: 0, sum: 0 }); o[k].n++; o[k].sum += s; }); return o; };
    const rc = {}, tagMiss = {};
    rows.forEach(([q, s, r]) => { if (s >= .999) return; reasons(q, r).forEach(x => rc[x] = (rc[x] || 0) + 1); tagMiss[q.tag] = (tagMiss[q.tag] || 0) + 1; });
    const rcRows = Object.entries(rc).sort((a, b) => b[1] - a[1]);
    const tagRows = Object.entries(tagMiss).sort((a, b) => b[1] - a[1]);
    const weakCat = Object.entries(by(q => q.msCat)).map(([k, v]) => [k, v.sum / v.n]).sort((a, b) => a[1] - b[1]).filter(x => x[1] < .8).slice(0, 3);
    const plan = weakCat.map(([k, v]) => `${k} (${Math.round(v * 100)}%): reread the rationales for every missed ${k} item, then review that system's lessons and comparisons.`);
    if (rcRows[0]) plan.push(`Your most common error type was "${rcRows[0][0]}" (${rcRows[0][1]}×). ${/priorit|lower/i.test(rcRows[0][0]) ? "Before answering, name the immediate threat (airway, breathing, circulation, acute change) and rank options against it." : /cue|word/i.test(rcRows[0][0]) ? "Underline what is new, changed or different from baseline before choosing." : /similar/i.test(rcRows[0][0]) ? "Use the Compare tool for the conditions you mixed up." : "Rebuild the missing facts from the rationales and source pages listed."}`);
    if (!plan.length) plan.push("Every category is at 80% or higher. Retake the exam untimed in a few days to confirm retention.");
    return `<div class="panel raised"><h3>Med-Surg 75 breakdown</h3><p class="small muted">Scoring: multiple choice is all-or-nothing; select-all and highlight use +/− scoring (correct picks minus wrong picks, floor 0); matrix scores each row; bow-tie scores 5 picks; ordered response gives full credit for the exact order, otherwise the share of steps in the right position. This is this app's own scoring, not Elsevier's HESI scoring algorithm, and it does not predict an official score.</p></div>
     <div class="grid g2"><div class="panel"><h3 style="margin-bottom:10px">By Med-Surg category</h3>${barRows(by(q => q.msCat))}</div><div class="panel"><h3 style="margin-bottom:10px">By item type</h3>${barRows(by(typeOf))}</div><div class="panel"><h3 style="margin-bottom:10px">By clinical judgment skill</h3>${barRows(by(q => cjSkill(q)))}</div><div class="panel"><h3 style="margin-bottom:10px">By difficulty</h3>${barRows(by(q => ({ C: "Challenging", V: "Very difficult", E: "Exceptionally difficult" })[q.msDiff]))}</div></div>
     <div class="grid g2"><div class="panel"><h3>Why points were lost</h3><p class="tiny muted">Worked out from the options you actually chose.</p>${rcRows.length ? li(rcRows.map(([k, n]) => `${k} — ${n}`)) : "<p class='small'>No errors.</p>"}</div>
      <div class="panel"><h3>Missed-concept tracker</h3>${tagRows.length ? li(tagRows.map(([k, n]) => `${k} — ${n} missed`)) : "<p class='small'>Nothing missed.</p>"}</div></div>
     <div class="callout teal"><h4>Your remediation plan</h4>${li(plan)}${tagRows.length ? `<button class="btn primary sm" style="margin-top:10px" data-a="msWeak" data-x="${m.id}">Start MED-SURG WEAKNESS CHALLENGE</button>` : ""}</div>`;
  }

  const _res = mockResultHTML;
  window.mockResultHTML = function (m) {
    const h = _res(m);
    if (!m.cfg || !m.cfg.ms75) return h;
    const i = h.indexOf('<div class="panel"><h3>Review every answer</h3>');
    return i < 0 ? h + msSections(m) : h.slice(0, i) + msSections(m) + h.slice(i);
  };

  function startMS(timed) {
    const go = () => { UI.mockView = null; startMock({ n: IDS.length, timed, pace: X.minutes * 60 / IDS.length, subj: "all", focus: "all", fixedIds: IDS, ms75: true, title: X.title }); logActivity(); };
    if (S.session && S.session.active) confirmBox("Replace the exam in progress?", "Starting a new exam discards your unfinished one.", "Start new exam", go, true); else go();
  }
  Object.assign(ACT, {
    msStart: el => startMS(el.dataset.x === "1"),
    msWeak: el => {
      const m = S.mocks.find(x => x.id === el.dataset.x); if (!m) return;
      const missTags = new Set(), missCats = new Set();
      m.res.filter(r => r[1] < .999).forEach(r => { const q = DATA.Q[r[0]]; if (q) { missTags.add(q.tag); missCats.add(q.msCat); } });
      const seen = new Set(S.att.map(a => a[0]));
      let ids = X.reserve.filter(q => missTags.has(q.tag) || missCats.has(q.msCat)).map(q => q.id);
      ids = ids.filter(id => !seen.has(id)).concat(ids.filter(id => seen.has(id)));
      if (!ids.length) { toast("No new challenge questions match your missed concepts."); return; }
      startPractice(ids.slice(0, 10), "MED-SURG WEAKNESS CHALLENGE", "mock");
    }
  });

  const _route = ROUTES.mock;
  ROUTES.mock = function (arg) {
    const h = _route(arg); if (arg === "result") return h;
    const card = `<div class="panel raised stack"><div class="spread"><div><h3>${esc(X.title)}</h3><p class="small muted">75 adult medical-surgical questions · 35 multiple choice, 9 select-all, 6 matrix, 5 highlight, 4 bow-tie, 4 ordered response, 3 unfolding cases (12 items). No hints or rationales until you submit; flag and review before submitting. Optional ${X.minutes}-minute timer. Original practice items — not official HESI questions.</p></div></div>
      <div class="row"><button class="btn primary big" data-a="msStart" data-x="1">${icon("clock", 16)} Start timed (${X.minutes} min)</button><button class="btn big" data-a="msStart" data-x="0">Start untimed</button></div></div>`;
    const i = h.indexOf('<div class="panel raised stack">');
    return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i);
  };
})();
