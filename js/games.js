/* Nursing Learning Games (v4.2): Match It, Put It In Order, Clinical Sort, PPE Challenge, HESI Brain Boost,
   weak-area review, and progress. Tap, drag (mouse or the grip handle on touch), and keyboard all work.
   Progress lives in S.games and saves with the rest of the app's progress. */
IC.grid = '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>';
IC.redo = '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>';
IC.grip = '<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>';
(function () { const g = NAV.find(x => x.g === "Practice"); if (g && !g.items.some(i => i[0] === "games")) g.items.unshift(["games", "Nursing Learning Games", "grid"]); })();

const GM_TYPE = { match: "Match It", order: "Put It In Order", sort: "Clinical Sort" };
const GM_LVL = { B: "Beginner", I: "Intermediate", A: "Advanced" };
const gmGame = id => (window.GAMES || []).find(g => g.id === id);
const gmKey = (g, text) => g.id + ":" + slug(text).slice(0, 48);
function GST() { if (!S.games || typeof S.games !== "object") S.games = {}; const s = S.games; s.g = s.g || {}; s.it = s.it || {}; s.log = s.log || []; return s; }
function gmStorageNote() {
  let ok = true; try { localStorage.setItem("hcc.t", "1"); localStorage.removeItem("hcc.t"); } catch (e) { ok = false; }
  if (SYNC.status === "ok") return "Game results save with your other progress, on this device and to your account.";
  if (ok) return "Game results save with your other progress on this device.";
  return "This browser is blocking storage, so game results last only until you close the page.";
}

/* ---------- Building a round ---------- */
function gmItemsFor(g, opts) {
  const focus = new Set(opts.focus || []), small = opts.small;
  if (g.type === "order") return g.steps.map((s, i) => i);
  if (g.type === "match") {
    const n = Math.min(small ? 5 : (g.round || 6), g.pairs.length);
    const idx = shuffle(g.pairs.map((p, i) => i)).sort((a, b) => (focus.has(gmKey(g, g.pairs[b].a)) ? 1 : 0) - (focus.has(gmKey(g, g.pairs[a].a)) ? 1 : 0));
    const out = [], seenB = new Set();
    for (const i of idx) { const b = g.pairs[i].b.toLowerCase(); if (seenB.has(b)) continue; seenB.add(b); out.push(i); if (out.length >= n) break; }
    return out;
  }
  const n = Math.min(small ? 6 : (g.round || 8), g.items.length);
  const idx = shuffle(g.items.map((p, i) => i));
  const out = [];
  idx.filter(i => focus.has(gmKey(g, g.items[i].t))).forEach(i => { if (out.length < n) out.push(i); });
  g.cats.forEach((c, ci) => { if (out.some(i => g.items[i].c === ci)) return; const pick = idx.find(i => g.items[i].c === ci && !out.includes(i)); if (pick != null && out.length < n) out.push(pick); });
  idx.forEach(i => { if (out.length < n && !out.includes(i)) out.push(i); });
  return shuffle(out);
}
function gmStart(id, opts = {}) {
  const g = gmGame(id); if (!g) { toast("That game isn't available."); return; }
  const items = gmItemsFor(g, opts);
  const st = { gid: id, type: g.type, items, attempt: 1, checked: false, done: false, first: null, firstMarks: null, mistakes: 0, wrongTiles: {}, mode: opts.mode || g.mode || "check", sel: null, msg: null, t0: Date.now(), focus: opts.focus || null, small: !!opts.small };
  if (g.type === "order") { st.slots = items.map(() => -1); st.locked = items.map(() => false); st.bankOrder = shuffle(items.slice()); }
  if (g.type === "match") { st.left = shuffle(items.slice()); st.right = shuffle(items.slice()); st.resp = {}; }
  if (g.type === "sort") { st.resp = {}; items.forEach(i => st.resp[i] = -1); }
  UI.gm = st; if (route !== "games") navTo("games"); else rerender(); window.scrollTo(0, 0);
}

/* ---------- Interaction ---------- */
function gmSay(t, kind) { if (UI.gm) UI.gm.msg = { t, kind: kind || "" }; }
function gmPlace(stepIdx, slot) {
  const st = UI.gm, g = gmGame(st.gid); if (st.done || st.locked[slot]) return;
  if (st.mode === "learn") {
    if (stepIdx === slot) { const from = st.slots.indexOf(stepIdx); if (from >= 0) st.slots[from] = -1; st.slots[slot] = stepIdx; st.locked[slot] = true; st.flash = slot; gmSay("Correct: step " + (slot + 1) + " is " + g.steps[stepIdx].t + ". " + g.steps[stepIdx].why, "ok"); }
    else { st.mistakes++; st.wrongTiles[stepIdx] = 1; st.shake = stepIdx; gmSay("Not step " + (slot + 1) + ". " + g.steps[stepIdx].t + " belongs at step " + (stepIdx + 1) + ": " + g.steps[stepIdx].why, "bad"); }
    if (st.slots.every((v, i) => v === i)) gmFinish();
    return;
  }
  const from = st.slots.indexOf(stepIdx), occ = st.slots[slot];
  if (from >= 0) st.slots[from] = (occ >= 0 && !st.locked[from]) ? occ : -1;
  st.slots[slot] = stepIdx; st.msg = null;
}
function gmNextEmpty(st) { const sel = st.selSlot; if (sel != null && st.slots[sel] === -1) return sel; return st.slots.findIndex((v, i) => v === -1 && !st.locked[i]); }
function gmAssign(li, rj) { const st = UI.gm; if (st.done) return; Object.keys(st.resp).forEach(k => { if (st.resp[k] === rj) delete st.resp[k]; }); st.resp[li] = rj; st.sel = null; st.msg = null; }
function gmCheck() {
  const st = UI.gm, g = gmGame(st.gid); let marks;
  if (st.type === "order") marks = st.slots.map((v, i) => v === i);
  if (st.type === "match") marks = st.left.map(i => st.resp[i] === i);
  if (st.type === "sort") marks = st.items.map(i => st.resp[i] === g.items[i].c);
  st.marks = marks; st.checked = true;
  if (st.first == null) { st.first = marks.filter(Boolean).length / marks.length; st.firstMarks = marks.slice(); st.firstResp = JSON.parse(JSON.stringify(st.type === "order" ? st.slots : st.resp)); }
  const right = marks.filter(Boolean).length;
  gmSay(right === marks.length ? "All correct." : right + " of " + marks.length + " correct. Wrong ones are marked — read why, then try again.", right === marks.length ? "ok" : "bad");
  if (right === marks.length) gmFinish();
}
function gmRetry() {
  const st = UI.gm; st.attempt++; st.checked = false; st.msg = null;
  if (st.type === "order") { st.slots.forEach((v, i) => { if (st.marks[i]) st.locked[i] = true; else st.slots[i] = -1; }); st.bankOrder = shuffle(st.bankOrder); }
  if (st.type === "match") st.left.forEach((i, k) => { if (!st.marks[k]) delete st.resp[i]; });
  if (st.type === "sort") st.items.forEach((i, k) => { if (!st.marks[k]) st.resp[i] = -1; });
  st.marks = null;
}
function gmFinish() {
  const st = UI.gm, g = gmGame(st.gid); if (st.done) return; st.done = true;
  if (st.type === "order" && st.mode === "learn") { const n = g.steps.length; st.first = Math.max(0, (n - Object.keys(st.wrongTiles).length) / n); st.firstMarks = g.steps.map((s, i) => !st.wrongTiles[i]); }
  const G = GST(), now = Date.now(), rec = G.g[g.id] || (G.g[g.id] = { n: 0, best: 0, hist: [] });
  rec.n++; rec.best = Math.max(rec.best || 0, st.first); rec.last = now; rec.hist = (rec.hist || []).concat([Math.round(st.first * 100)]).slice(-12);
  const texts = st.type === "order" ? g.steps.map(s => s.t) : st.type === "match" ? st.left.map(i => g.pairs[i].a) : st.items.map(i => g.items[i].t);
  texts.forEach((t, k) => { const key = gmKey(g, t), it = G.it[key] || (G.it[key] = { n: 0, w: 0, g: g.id, t: t.slice(0, 90) }); it.n++; if (!st.firstMarks[k]) { it.w++; it.lastW = now; } it.last = now; });
  G.log.push([g.id, Math.round(st.first * 100), now, g.level, g.subj, g.type, st.attempt]); if (G.log.length > 800) G.log = G.log.slice(-700);
  const keys = Object.keys(G.it); if (keys.length > 1500) keys.sort((a, b) => (G.it[a].last || 0) - (G.it[b].last || 0)).slice(0, keys.length - 1400).forEach(k => delete G.it[k]);
  if (UI.boost && UI.boost.active) UI.boost.done.push({ gid: g.id, first: st.first });
  logActivity(); save();
}

/* ---------- Rendering ---------- */
const gmPill = g => `<span class="pill">${GM_TYPE[g.type]}</span><span class="pill">${GM_LVL[g.level]}</span>${g.hy ? `<span class="pill info">High yield</span>` : ""}`;
function gmCard(g) {
  const r = GST().g[g.id], n = g.type === "order" ? g.steps.length : g.type === "match" ? g.pairs.length : g.items.length;
  return `<button class="card-link gm-card" data-a="gmGo" data-x="${g.id}"><div class="row" style="gap:6px">${gmPill(g)}</div><h3>${esc(g.title)}</h3><span class="small muted">${esc((window.GAME_SUBJ || {})[g.subj] || g.subj)} · ${n} ${g.type === "order" ? "steps" : "items"}</span>${r ? `<span class="tiny muted">Played ${r.n}× · best first try ${Math.round((r.best || 0) * 100)}%</span>` : `<span class="tiny muted">Not played yet</span>`}</button>`;
}
function gmOrderHTML(g, st) {
  const done = st.done, chk = st.checked;
  const bank = st.bankOrder.filter(i => !st.slots.includes(i));
  const slots = st.slots.map((v, i) => {
    const mk = chk && st.marks ? (st.marks[i] ? " ok" : " bad") : (st.locked[i] ? " ok" : "");
    const fl = st.flash === i ? " gm-pop" : "";
    const tile = v >= 0 ? `<div class="gm-tile placed" ${!st.locked[i] && !done && !chk ? `data-drag="tile" data-x="${v}" data-from="${i}"` : ""}>${!st.locked[i] && !done && !chk ? `<span class="grip" aria-hidden="true">${icon("grip", 16)}</span>` : ""}<span class="gt">${esc(g.steps[v].t)}</span>${(st.locked[i] || (chk && st.marks && st.marks[i])) ? `<span class="tag-ok">${icon("check", 14, 3)} Correct</span>` : ""}${!st.locked[i] && !done && !chk ? `<span class="gm-mv"><button class="iconbtn sm" aria-label="Move up" data-a="gmMove" data-x="${i}" data-d="-1" ${i === 0 ? "disabled" : ""}>${icon("up", 14)}</button><button class="iconbtn sm" aria-label="Move down" data-a="gmMove" data-x="${i}" data-d="1" ${i === st.slots.length - 1 ? "disabled" : ""}>${icon("down", 14)}</button><button class="iconbtn sm" aria-label="Remove from step ${i + 1}" data-a="gmUnplace" data-x="${i}">${icon("x", 14)}</button></span>` : ""}</div>${chk && st.marks && !st.marks[i] ? `<div class="gm-why bad">This is step ${v + 1}, not step ${i + 1}. ${esc(g.steps[v].why)}</div>` : ""}` : `<span class="gm-empty">${st.selSlot === i ? "Tap a step to put it here" : "Empty — drop or tap a step"}</span>`;
    return `<li class="gm-slot${mk}${fl}" data-drop="slot" data-x="${i}" ${v < 0 && !done ? `role="button" tabindex="0" data-a="gmSlot" aria-pressed="${st.selSlot === i}"` : ""}><span class="gm-n" aria-hidden="true">${i + 1}</span><div class="gm-sbody">${tile}</div></li>`;
  }).join("");
  const bankHTML = bank.map(i => `<div class="gm-tile${st.shake === i ? " gm-shake" : ""}" data-drag="tile" data-x="${i}" data-from="bank"><span class="grip" aria-hidden="true">${icon("grip", 16)}</span><button class="gt-btn" data-a="gmTile" data-x="${i}">${esc(g.steps[i].t)}</button></div>`).join("");
  st.flash = null; st.shake = null;
  return `<div class="gm-order"><div><h4 class="gm-h">Steps in order</h4><ol class="gm-slots">${slots}</ol></div><div><h4 class="gm-h">Tiles ${bank.length ? `<span class="muted small">(${bank.length} left)</span>` : ""}</h4><div class="gm-bank" data-drop="bank">${bankHTML || `<span class="muted small">All tiles placed.</span>`}</div><p class="small muted">Tap a tile to place it in the next empty step (or tap an empty step first). Drag with a mouse, or by the grip ${icon("grip", 12)} on a touchscreen.</p></div></div>`;
}
function gmMatchHTML(g, st) {
  const chk = st.checked, pairNo = {}; let k = 0; st.left.forEach(i => { if (st.resp[i] != null) pairNo[st.resp[i]] = ++k; });
  const rows = st.left.map((i, ri) => {
    const j = st.resp[i], mk = chk && st.marks ? (st.marks[ri] ? " ok" : " bad") : "";
    return `<li class="gm-mrow${mk}${st.sel && st.sel.side === "a" && st.sel.i === i ? " sel" : ""}" data-drop="row" data-x="${i}"><button class="gm-a" data-a="gmA" data-x="${i}" aria-pressed="${!!(st.sel && st.sel.side === "a" && st.sel.i === i)}">${esc(g.pairs[i].a)}</button><div class="gm-slotb">${j != null ? `<span class="gm-pairno" aria-hidden="true">${pairNo[j]}</span><span>${esc(g.pairs[j].b)}</span>${!st.done && !chk ? `<button class="iconbtn sm" aria-label="Clear match for ${esc(g.pairs[i].a)}" data-a="gmClr" data-x="${i}">${icon("x", 14)}</button>` : ""}` : `<span class="gm-empty">${st.sel && st.sel.side === "b" ? "Tap here to match" : "Drop or tap a match"}</span>`}</div>${chk && st.marks && !st.marks[ri] ? `<div class="gm-why bad">Goes with: <b>${esc(g.pairs[i].b)}</b>. ${esc(g.pairs[i].why || "")}</div>` : ""}</li>`;
  }).join("");
  const chips = st.right.map(j => { const used = Object.values(st.resp).includes(j); return `<div class="gm-chipw${used ? " used" : ""}" ${!used && !st.done ? `data-drag="chip" data-x="${j}"` : ""}>${!used && !st.done ? `<span class="grip" aria-hidden="true">${icon("grip", 16)}</span>` : ""}<button class="gm-b" data-a="gmB" data-x="${j}" aria-pressed="${!!(st.sel && st.sel.side === "b" && st.sel.j === j)}" ${used || st.done ? "disabled" : ""}>${used ? `<span class="gm-pairno" aria-hidden="true">${pairNo[j]}</span>` : ""}${esc(g.pairs[j].b)}</button></div>`; }).join("");
  return `<div class="gm-match"><div><h4 class="gm-h">${esc(g.aLabel || "Item")}</h4><ul class="gm-mrows">${rows}</ul></div><div><h4 class="gm-h">${esc(g.bLabel || "Match")}</h4><div class="gm-chips">${chips}</div><p class="small muted">Tap an item, then its match (either order). Numbers show which pairs you've made. Drag with a mouse or by the grip on a touchscreen.</p></div></div>`;
}
function gmSortHTML(g, st) {
  const chk = st.checked;
  const card = (i, k) => { const c = st.resp[i], mk = chk && st.marks ? (st.marks[k] ? " ok" : " bad") : ""; return `<li class="gm-scard${mk}" ${!st.done && !chk ? `data-drag="card" data-x="${i}"` : ""}>${!st.done && !chk ? `<span class="grip" aria-hidden="true">${icon("grip", 16)}</span>` : ""}<div class="gm-sc"><span>${esc(g.items[i].t)}</span>${c < 0 && !st.done ? `<div class="gm-catbtns">${g.cats.map((n, ci) => `<button class="chip sm" data-a="gmSortTo" data-x="${i}" data-c="${ci}">${esc(n)}</button>`).join("")}</div>` : ""}${c >= 0 && !st.done && !chk ? `<button class="linkbtn small" data-a="gmSortTo" data-x="${i}" data-c="-1">${icon("redo", 12)} Move back</button>` : ""}${chk && st.marks && !st.marks[k] ? `<div class="gm-why bad">Belongs in <b>${esc(g.cats[g.items[i].c])}</b>. ${esc(g.items[i].why || "")}</div>` : ""}</div></li>`; };
  const pile = st.items.map((i, k) => st.resp[i] < 0 ? card(i, k) : "").join("");
  const bins = g.cats.map((n, ci) => `<div class="gm-bin" data-drop="bin" data-x="${ci}"><h4 class="gm-h">${esc(n)} <span class="muted small">(${st.items.filter(i => st.resp[i] === ci).length})</span></h4><ul class="gm-binlist">${st.items.map((i, k) => st.resp[i] === ci ? card(i, k) : "").join("") || `<li class="gm-empty">Drop or tap items here</li>`}</ul></div>`).join("");
  return `<div class="gm-sort"><div class="gm-pile" data-drop="pile"><h4 class="gm-h">To sort ${pile ? "" : `<span class="muted small">(all sorted)</span>`}</h4><ul class="gm-binlist">${pile}</ul></div><div class="gm-bins c${g.cats.length}">${bins}</div></div>`;
}
function gmResultHTML(g, st) {
  const marks = st.firstMarks || [], pct = Math.round((st.first || 0) * 100);
  const lines = st.type === "order" ? g.steps.map((s, i) => [marks[i], `<b>${i + 1}. ${esc(s.t)}</b> — ${esc(s.why)}`])
    : st.type === "match" ? st.left.map((i, k) => [marks[k], `<b>${esc(g.pairs[i].a)}</b> → ${esc(g.pairs[i].b)}${g.pairs[i].why ? ". " + esc(g.pairs[i].why) : ""}`])
    : st.items.map((i, k) => [marks[k], `<b>${esc(g.items[i].t)}</b> → ${esc(g.cats[g.items[i].c])}${g.items[i].why ? ". " + esc(g.items[i].why) : ""}`]);
  const wrongFirst = [];
  if (st.type === "match" && st.firstResp) st.left.forEach((i, k) => { if (!marks[k] && st.firstResp[i] != null) wrongFirst.push(`You matched <b>${esc(g.pairs[i].a)}</b> with “${esc(g.pairs[st.firstResp[i]].b)}”. That belongs to ${esc(g.pairs[st.firstResp[i]].a)}.`); });
  if (st.type === "sort" && st.firstResp) st.items.forEach((i, k) => { if (!marks[k] && st.firstResp[i] >= 0) wrongFirst.push(`You put <b>${esc(g.items[i].t)}</b> under ${esc(g.cats[st.firstResp[i]])}; it belongs under ${esc(g.cats[g.items[i].c])}.`); });
  if (st.type === "order" && st.mode !== "learn" && st.firstResp) st.firstResp.forEach((v, i) => { if (v >= 0 && v !== i) wrongFirst.push(`You put <b>${esc(g.steps[v].t)}</b> at step ${i + 1}; it is step ${v + 1}.`); });
  if (st.type === "order" && st.mode === "learn") Object.keys(st.wrongTiles).forEach(v => wrongFirst.push(`You tried <b>${esc(g.steps[v].t)}</b> too early or too late; it is step ${+v + 1}.`));
  return `<div class="gm-result stack">
   <div class="spread"><div><h3 tabindex="-1">${pct === 100 ? "Perfect first try" : "Round complete"}</h3><p class="small muted">First-try score <b>${pct}%</b> · finished in ${st.attempt} ${st.attempt === 1 ? "attempt" : "attempts"}${st.type === "order" && st.mode === "learn" ? ` · ${st.mistakes} wrong ${st.mistakes === 1 ? "placement" : "placements"}` : ""}</p></div>
   <div class="row"><button class="btn" data-a="gmAgain">${icon("redo", 16)} Try again</button>${st.type !== "order" ? `<button class="btn" data-a="gmNew">New round</button>` : ""}${UI.boost && UI.boost.active ? `<button class="btn primary" data-a="boostNext">Next round ${icon("right", 16)}</button>` : `<button class="btn primary" data-a="gmBack">Back to games</button>`}</div></div>
   ${g.cue ? memBox(esc(g.cue), "Memory cue") : ""}
   <div class="gm-ex"><h4>${labTag("why", "Why each answer is right")}</h4><ul class="gm-list">${lines.map(([ok, h]) => `<li class="${ok ? "ok" : "bad"}"><span class="${ok ? "tag-ok" : "tag-bad"}">${ok ? "Right first try" : "Missed first try"}</span> ${h}</li>`).join("")}</ul></div>
   ${wrongFirst.length ? `<div class="gm-ex"><h4>${labTag("trap", "Why your first choice didn't fit")}</h4><ul class="gm-list">${wrongFirst.map(x => `<li>${x}</li>`).join("")}</ul></div>` : ""}
   <div class="gm-ex grid g3"><div><h4>${labTag("define", "Concept tested")}</h4><p class="small">${esc(g.concept || "")}</p></div><div><h4>${labTag("prio", "Patient safety")}</h4><p class="small">${esc(g.safety || "")}</p></div><div><h4>${labTag("must", "On the HESI or NCLEX-PN")}</h4><p class="small">${esc(g.hesi || "")}</p></div></div>
   ${g.guideline ? `<p class="small"><b>Sequence used:</b> ${esc(g.guideline)}</p>` : ""}${g.note ? `<div class="callout"><p class="small">${esc(g.note)}</p></div>` : ""}
   <p class="tiny muted">Sources: ${esc((g.src || []).join(" · "))}</p></div>`;
}
function gmPlayerHTML() {
  const st = UI.gm, g = gmGame(st.gid); if (!g) { UI.gm = null; return gmCatalogHTML(); }
  const n = st.type === "order" ? st.slots.length : st.items.length;
  const placed = st.type === "order" ? st.slots.filter(v => v >= 0).length : st.type === "match" ? Object.keys(st.resp).length : st.items.filter(i => st.resp[i] >= 0).length;
  const ready = placed === n && !st.done && !st.checked;
  const boost = UI.boost && UI.boost.active ? `<div class="callout spread gm-boostbar"><span><b>HESI Brain Boost</b> · round ${UI.boost.i + 1} of ${UI.boost.queue.length}</span><span class="num" id="boostClock">${gmClock()}</span></div>` : "";
  const modeSw = st.type === "order" && !UI.boost ? `<div class="chips" role="group" aria-label="Feedback mode"><button class="chip" data-a="gmMode" data-x="learn" aria-pressed="${st.mode === "learn"}">Instant feedback</button><button class="chip" data-a="gmMode" data-x="check" aria-pressed="${st.mode === "check"}">Check at the end</button></div>` : "";
  const body = st.type === "order" ? gmOrderHTML(g, st) : st.type === "match" ? gmMatchHTML(g, st) : gmSortHTML(g, st);
  return `${boost}<div class="qbar"><div><div class="crumb"><button data-a="gmBack">${icon("left", 14)} ${UI.boost && UI.boost.active ? "End Brain Boost" : "All games"}</button></div><h2>${esc(g.title)}</h2><div class="row" style="gap:6px;margin-top:6px">${gmPill(g)}<span class="pill">${esc((window.GAME_SUBJ || {})[g.subj] || g.subj)}</span>${st.focus ? `<span class="pill warn">Focusing on your misses</span>` : ""}</div></div></div>
   <div class="panel raised gm" id="gmRoot"><p class="prose">${esc(g.intro || "")}</p>${modeSw}
   ${st.done ? "" : `<div class="gm-prog"><div class="progress-line"><span style="width:${100 * placed / n}%"></span></div><span class="small muted num">${placed} of ${n} ${st.type === "order" ? "placed" : st.type === "match" ? "matched" : "sorted"}${st.attempt > 1 ? ` · attempt ${st.attempt}` : ""}</span></div>`}
   ${body}
   <div class="gm-live${st.msg ? " " + (st.msg.kind || "") : ""}" role="status" aria-live="polite">${st.msg ? esc(st.msg.t) : ""}</div>
   ${st.done ? gmResultHTML(g, st) : `<div class="row gm-actions">${st.checked ? `<button class="btn primary" data-a="gmRetry">${icon("redo", 16)} Try again with the wrong ones</button>` : (st.type === "order" && st.mode === "learn" ? "" : `<button class="btn primary" data-a="gmCheck" ${ready ? "" : "disabled"}>Check my answer</button>`)}<button class="btn" data-a="gmRestart">Restart</button></div>`}
   </div>`;
}
function gmFilters() { UI.gmF = UI.gmF || { type: "all", level: "all", subj: "all" }; return UI.gmF; }
function gmCatalogHTML() {
  const F = gmFilters(), all = window.GAMES || [];
  const list = all.filter(g => (F.type === "all" || g.type === F.type) && (F.level === "all" || g.level === F.level) && (F.subj === "all" || g.subj === F.subj));
  const subs = uniq(all.map(g => g.subj));
  const chip = (k, v, l) => `<button class="chip" data-a="gmF" data-k="${k}" data-x="${v}" aria-pressed="${F[k] === v}">${l}</button>`;
  const ppe = all.filter(g => g.featured === "ppe");
  return `<div class="panel flat gm-feature"><div class="spread"><div><span class="pill info">Priority</span><h3 style="margin-top:6px">PPE Challenge — Put It In Order</h3><p class="small muted">Two games: putting PPE on (donning) and taking it off (doffing), using the CDC sequences.</p></div><div class="row">${ppe.map(g => `<button class="btn primary" data-a="gmGo" data-x="${g.id}">${g.id === "ppe-don" ? "Game A: Donning" : "Game B: Doffing"}</button>`).join("")}</div></div></div>
   <div class="stack-s"><div class="chips scroll">${chip("type", "all", "All types")}${chip("type", "match", "Match It")}${chip("type", "order", "Put It In Order")}${chip("type", "sort", "Clinical Sort")}</div>
   <div class="chips scroll">${chip("level", "all", "All levels")}${chip("level", "B", "Beginner")}${chip("level", "I", "Intermediate")}${chip("level", "A", "Advanced")}</div>
   <label class="field" style="max-width:360px">Subject <select data-in="gmSubj"><option value="all">All subjects</option>${subs.map(s => `<option value="${s}" ${F.subj === s ? "selected" : ""}>${esc((window.GAME_SUBJ || {})[s] || s)}</option>`).join("")}</select></label></div>
   <p class="small muted">${list.length} games. ${esc(gmStorageNote())}</p>
   <div class="grid auto">${list.map(gmCard).join("") || `<div class="empty">No games match these filters.</div>`}</div>`;
}

/* ---------- Brain Boost ---------- */
function gmWeak() { const G = GST(); return Object.entries(G.it).filter(([k, v]) => v.w > 0 && gmGame(v.g)).map(([k, v]) => ({ k, ...v, score: v.w / v.n + v.w * 0.25 })).sort((a, b) => b.score - a.score); }
function boostStart(min) {
  const all = window.GAMES || [], G = GST(), now = Date.now();
  const weakG = uniq(gmWeak().map(w => w.g)), recent = id => G.g[id] && now - (G.g[id].last || 0) < DAY;
  const rounds = min <= 5 ? 4 : min <= 10 ? 7 : 13;
  const tier1 = shuffle(weakG).slice(0, Math.ceil(rounds / 3));
  const tier2 = shuffle(all.filter(g => g.hy && !tier1.includes(g.id) && !recent(g.id)).map(g => g.id));
  const tier3 = shuffle(all.filter(g => !tier1.includes(g.id) && !tier2.includes(g.id) && !recent(g.id)).map(g => g.id));
  const tier4 = shuffle(all.filter(g => !tier1.includes(g.id) && !tier2.includes(g.id) && !tier3.includes(g.id)).map(g => g.id));
  const pool = tier1.concat(tier2, tier3, tier4); const queue = [];
  const typeCount = { match: 0, order: 0, sort: 0 };
  for (const id of pool) { const g = gmGame(id); if (queue.length >= rounds) break; if (typeCount[g.type] > Math.ceil(rounds / 2)) continue; queue.push(id); typeCount[g.type]++; }
  UI.boost = { active: true, min, end: now + min * 60000, queue, i: 0, done: [] };
  const w = gmWeak(); boostOpen(queue[0], w);
}
function boostOpen(id, w) { const focus = (w || gmWeak()).filter(x => x.g === id).map(x => x.k); gmStart(id, { small: true, mode: "check", focus: focus.length ? focus : null }); }
function gmClock() { const B = UI.boost; if (!B) return ""; const ms = Math.max(0, B.end - Date.now()), m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000); return ms ? `${m}:${String(s).padStart(2, "0")} left` : "Time's up — finish this round"; }
function boostSummaryHTML() {
  const B = UI.boost, avg = B.done.length ? Math.round(B.done.reduce((a, x) => a + x.first, 0) / B.done.length * 100) : 0;
  return `<div class="panel raised stack"><h2>Brain Boost complete</h2><p class="muted">${B.done.length} ${B.done.length === 1 ? "round" : "rounds"} in ${B.min} minutes · average first-try score <b>${avg}%</b></p><div class="list">${B.done.map(d => { const g = gmGame(d.gid); return `<div class="spread" style="padding:6px 0"><span>${esc(g ? g.title : d.gid)}</span><span class="pill ${d.first >= .999 ? "ok" : d.first >= .7 ? "warn" : "bad"}">${Math.round(d.first * 100)}%</span></div>`; }).join("") || `<p class="muted small">No rounds finished.</p>`}</div><div class="row"><button class="btn primary" data-a="boostEnd">Done</button><button class="btn" data-a="gmTab" data-x="weak">Review my weak areas</button></div></div>`;
}
function boostHTML() {
  return `<div class="panel stack"><h3>HESI Brain Boost</h3><p class="muted">Short mixed rounds of matching, sequencing, and sorting. Your missed items come first, then high-yield safety topics, then games you haven't played lately. No game repeats inside a session.</p><div class="row">${[5, 10, 20].map(m => `<button class="btn big ${m === 10 ? "primary" : ""}" data-a="boostGo" data-x="${m}">${m}-minute review</button>`).join("")}</div><p class="small muted">${esc(gmStorageNote())}</p></div>`;
}
/* ---------- Weak areas and progress ---------- */
function weakHTML() {
  const w = gmWeak(); if (!w.length) return `<div class="empty">No weak areas yet. Play a few games — any item you miss on the first try shows up here.</div>`;
  const byG = {}; w.forEach(x => { (byG[x.g] = byG[x.g] || []).push(x); });
  const ids = Object.keys(byG).sort((a, b) => byG[b].reduce((s, x) => s + x.score, 0) - byG[a].reduce((s, x) => s + x.score, 0));
  return `<p class="muted">Items you missed on a first try, most-missed first. Replaying keeps your history; the misses come up first in the round.</p><div class="stack">${ids.slice(0, 12).map(id => { const g = gmGame(id); return `<div class="panel"><div class="spread"><div><h3>${esc(g.title)}</h3><div class="row" style="gap:6px;margin-top:4px">${gmPill(g)}</div></div><button class="btn primary sm" data-a="gmWeakGo" data-x="${id}">Practice these</button></div><ul class="gm-list" style="margin-top:8px">${byG[id].slice(0, 6).map(x => `<li><span class="pill ${x.w / x.n >= .5 ? "bad" : "warn"}">missed ${x.w} of ${x.n}</span> ${esc(x.t)}</li>`).join("")}</ul></div>`; }).join("")}</div>`;
}
function progressHTML() {
  const G = GST(), log = G.log; if (!log.length) return `<div class="empty">No games played yet.</div>`;
  const avg = a => a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0;
  const by = (idx, names) => { const m = {}; log.forEach(r => { (m[r[idx]] = m[r[idx]] || []).push(r[1]); }); return Object.entries(m).map(([k, v]) => `<tr><td>${esc(names[k] || k)}</td><td class="num">${v.length}</td><td class="num">${avg(v)}%</td></tr>`).join(""); };
  const items = Object.values(G.it), firstRight = items.reduce((s, x) => s + (x.n - x.w), 0), firstWrong = items.reduce((s, x) => s + x.w, 0);
  const imp = Object.entries(G.g).filter(([id, r]) => (r.hist || []).length >= 2 && gmGame(id)).map(([id, r]) => `<tr><td>${esc(gmGame(id).title)}</td><td class="num">${r.hist[0]}%</td><td class="num">${r.hist[r.hist.length - 1]}%</td><td class="num">${r.n}</td></tr>`).join("");
  const tbl = (h, rows) => `<div class="tablewrap"><table class="t"><thead><tr>${h.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
  return `<div class="grid g3"><div class="panel"><div class="small muted">Rounds completed</div><div class="gm-big num">${log.length}</div></div><div class="panel"><div class="small muted">First-attempt accuracy</div><div class="gm-big num">${avg(log.map(r => r[1]))}%</div></div><div class="panel"><div class="small muted">Items right / missed on first try</div><div class="gm-big num">${firstRight} / ${firstWrong}</div></div></div>
   <div class="grid g2"><div class="panel"><h3>By subject</h3>${tbl(["Subject", "Rounds", "First try"], by(4, window.GAME_SUBJ || {}))}</div><div class="panel"><h3>By difficulty and type</h3>${tbl(["Level", "Rounds", "First try"], by(3, GM_LVL))}${tbl(["Game type", "Rounds", "First try"], by(5, GM_TYPE))}</div></div>
   <div class="panel"><h3>Improvement across attempts</h3>${imp ? tbl(["Game", "First play", "Latest", "Plays"], imp) : `<p class="muted small">Play a game twice to see your change.</p>`}</div><p class="small muted">${esc(gmStorageNote())}</p>`;
}

/* ---------- Route ---------- */
ROUTES.games = () => {
  if (UI.boost && UI.boost.active && !UI.gm) return head("Nursing Learning Games", "HESI Brain Boost") + boostSummaryHTML();
  if (UI.gm) return gmPlayerHTML();
  const t = UI.gmTab || "play";
  const body = t === "play" ? gmCatalogHTML() : t === "boost" ? boostHTML() : t === "weak" ? weakHTML() : progressHTML();
  return head("Nursing Learning Games", "Learn by doing: match concepts, put nursing actions in order, and sort findings the way you will on the HESI Exit and NCLEX-PN. Every round ends with the why.")
    + `<div class="tabs" role="tablist">${[["play", "Games"], ["boost", "HESI Brain Boost"], ["weak", "Review my weak areas"], ["progress", "My progress"]].map(([k, l]) => `<button class="tab" role="tab" aria-selected="${t === k}" data-a="gmTab" data-x="${k}">${l}</button>`).join("")}</div>` + body;
};
VIEW_AFTER.games = () => {
  if (UI.gmFocus) { const sels = [].concat(UI.gmFocus); UI.gmFocus = null; for (const q of sels) { const el = q && document.querySelector(q); if (el) { el.focus(); break; } } }
  if (UI.boost && UI.boost.active) { const id = setInterval(() => { const el = $("#boostClock"); if (el) el.textContent = gmClock(); }, 1000); TIMERS.push(id); }
};
Object.assign(ACT, {
  gmGo: el => { UI.boost = null; gmStart(el.dataset.x); },
  gmTab: el => { UI.gm = null; UI.boost = null; UI.gmTab = el.dataset.x; if (route !== "games") navTo("games"); else rerender(); },
  gmF: el => { gmFilters()[el.dataset.k] = el.dataset.x; rerender(); },
  gmBack: () => { UI.gm = null; if (UI.boost) UI.boost = null; rerender(); window.scrollTo(0, 0); },
  gmMode: el => { const st = UI.gm; gmStart(st.gid, { mode: el.dataset.x, focus: st.focus }); },
  gmTile: el => { if (UI.gm && UI.gm.checked) return; UI.gmFocus = ['#gmRoot .gm-bank .gt-btn', '#gmRoot [data-a="gmCheck"]:not([disabled])', '#gmRoot .gm-result h3', '#gmRoot .gm-live']; const st = UI.gm; if (!st || st.done) return; const i = +el.dataset.x, s = gmNextEmpty(st); if (s < 0) return; st.selSlot = null; gmPlace(i, s); if (st.mode !== "learn") gmSay(gmGame(st.gid).steps[i].t + " placed at step " + (s + 1) + "."); rerender(); },
  gmSlot: el => { const st = UI.gm; const i = +el.closest("[data-x]").dataset.x; st.selSlot = st.selSlot === i ? null : i; UI.gmFocus = st.selSlot != null ? ['#gmRoot .gm-bank .gt-btn'] : [`#gmRoot .gm-slot[data-x="${i}"]`]; rerender(); },
  gmUnplace: el => { const st = UI.gm, i = +el.dataset.x; if (!st.locked[i]) st.slots[i] = -1; UI.gmFocus = [`#gmRoot .gm-slot[data-x="${i}"]`]; rerender(); },
  gmMove: el => { const st = UI.gm, i = +el.dataset.x, j = i + (+el.dataset.d); if (j < 0 || j >= st.slots.length || st.locked[j]) return; [st.slots[i], st.slots[j]] = [st.slots[j], st.slots[i]]; rerender(); setTimeout(() => { const b = document.querySelector(`[data-a="gmMove"][data-x="${j}"][data-d="${el.dataset.d}"]`) || document.querySelector(`[data-a="gmMove"][data-x="${j}"]`); if (b) b.focus(); }, 0); },
  gmA: el => { const st = UI.gm, i = +el.dataset.x; if (st.done || st.checked) return; UI.gmFocus = st.sel && st.sel.side === "b" ? ['#gmRoot .gm-mrow:not(:has(.gm-pairno)) .gm-a', '#gmRoot [data-a="gmCheck"]:not([disabled])'] : ['#gmRoot .gm-b:not([disabled])']; if (st.sel && st.sel.side === "b") gmAssign(i, st.sel.j); else st.sel = st.sel && st.sel.side === "a" && st.sel.i === i ? null : { side: "a", i }; rerender(); },
  gmB: el => { const st = UI.gm, j = +el.dataset.x; if (st.done || st.checked) return; UI.gmFocus = st.sel && st.sel.side === "a" ? ['#gmRoot .gm-mrow:not(:has(.gm-pairno)) .gm-a', '#gmRoot [data-a="gmCheck"]:not([disabled])'] : ['#gmRoot .gm-mrow:not(:has(.gm-pairno)) .gm-a']; if (st.sel && st.sel.side === "a") gmAssign(st.sel.i, j); else st.sel = st.sel && st.sel.side === "b" && st.sel.j === j ? null : { side: "b", j }; rerender(); },
  gmClr: el => { delete UI.gm.resp[+el.dataset.x]; UI.gmFocus = [`#gmRoot .gm-a[data-x="${el.dataset.x}"]`]; rerender(); },
  gmSortTo: el => { const st = UI.gm; if (st.done || st.checked) return; UI.gmFocus = ['#gmRoot .gm-pile button[data-a="gmSortTo"]', '#gmRoot [data-a="gmCheck"]:not([disabled])']; st.resp[+el.dataset.x] = +el.dataset.c; st.msg = null; rerender(); },
  gmCheck: () => { gmCheck(); UI.gmFocus = ['#gmRoot .gm-result h3', '#gmRoot [data-a="gmRetry"]']; rerender(); },
  gmRetry: () => { gmRetry(); UI.gmFocus = ['#gmRoot .gm-bank .gt-btn', '#gmRoot .gm-mrow:not(:has(.gm-pairno)) .gm-a', '#gmRoot .gm-pile button[data-a="gmSortTo"]']; rerender(); },
  gmRestart: () => { const st = UI.gm; gmStart(st.gid, { mode: st.mode, focus: st.focus, small: st.small }); },
  gmAgain: () => { const st = UI.gm; const items = st.items; gmStart(st.gid, { mode: st.mode, small: st.small }); const n = UI.gm; if (n.type !== "order") { n.items = shuffle(items); if (n.type === "match") { n.left = shuffle(items); n.right = shuffle(items); n.resp = {}; } else { n.resp = {}; items.forEach(i => n.resp[i] = -1); } } rerender(); },
  gmNew: () => { const st = UI.gm; gmStart(st.gid, { mode: st.mode, small: st.small }); },
  gmWeakGo: el => { UI.boost = null; const focus = gmWeak().filter(x => x.g === el.dataset.x).map(x => x.k); gmStart(el.dataset.x, { focus }); },
  boostGo: el => boostStart(+el.dataset.x),
  boostNext: () => { const B = UI.boost; B.i++; if (B.i >= B.queue.length || Date.now() >= B.end) { UI.gm = null; rerender(); window.scrollTo(0, 0); return; } boostOpen(B.queue[B.i]); },
  boostEnd: () => { UI.boost = null; UI.gm = null; UI.gmTab = "progress"; rerender(); }
});
document.addEventListener("change", ev => { const el = ev.target; if (el.dataset && el.dataset.in === "gmSubj") { gmFilters().subj = el.value; rerender(); } });
document.addEventListener("keydown", ev => { const el = ev.target; if ((ev.key === "Enter" || ev.key === " ") && el && el.dataset && el.dataset.a === "gmSlot") { ev.preventDefault(); ACT.gmSlot(el); } });

/* ---------- Drag and drop (pointer events: mouse anywhere on the tile; touch/pen by the grip) ---------- */
const GDR = { el: null, ghost: null, x0: 0, y0: 0, on: false, over: null, suppress: false, px: 0, py: 0, raf: 0 };
function gmHover() { const t = document.elementFromPoint(GDR.px, GDR.py), d = t && t.closest("[data-drop]"); if (GDR.over !== d) { if (GDR.over) GDR.over.classList.remove("over"); if (d) d.classList.add("over"); GDR.over = d; } }
function gmAutoScroll() { if (!GDR.on) { GDR.raf = 0; return; } const edge = 70, vh = innerHeight; let dy = 0; if (GDR.py < edge) dy = -Math.ceil((edge - GDR.py) / 5); else if (GDR.py > vh - edge - 20) dy = Math.ceil((GDR.py - (vh - edge - 20)) / 5); if (dy) { window.scrollBy(0, dy); gmHover(); } GDR.raf = requestAnimationFrame(gmAutoScroll); }
function gmDrop(src, dst) {
  const st = UI.gm; if (!st || st.done || st.checked) return;
  const x = +src.x, dk = dst.drop, dx = +dst.x;
  if (src.drag === "tile") {
    if (dk === "slot") { if (st.mode === "learn") gmPlace(x, dx); else { const from = src.from === "bank" ? -1 : +src.from; const occ = st.slots[dx]; if (st.locked[dx]) return; st.slots[dx] = x; if (from >= 0) st.slots[from] = occ >= 0 && from !== dx ? occ : (from === dx ? x : -1); gmSay(gmGame(st.gid).steps[x].t + " placed at step " + (dx + 1) + "."); } }
    if (dk === "bank" && src.from !== "bank") { const f = +src.from; if (!st.locked[f]) st.slots[f] = -1; }
  }
  if (src.drag === "chip" && dk === "row") gmAssign(dx, x);
  if (src.drag === "card") { if (dk === "bin") st.resp[x] = dx; if (dk === "pile") st.resp[x] = -1; }
  rerender();
}
function gmDragEnd(ev, drop) {
  if (GDR.ghost) GDR.ghost.remove(); if (GDR.over) GDR.over.classList.remove("over");
  if (GDR.el) GDR.el.classList.remove("dragging");
  if (GDR.on && drop) { const t = document.elementFromPoint(ev.clientX, ev.clientY); const d = t && t.closest("[data-drop]"); GDR.suppress = true; setTimeout(() => GDR.suppress = false, 50); if (d) gmDrop({ ...GDR.el.dataset }, { ...d.dataset }); }
  if (GDR.raf) cancelAnimationFrame(GDR.raf);
  GDR.el = null; GDR.ghost = null; GDR.on = false; GDR.over = null; GDR.raf = 0;
}
document.addEventListener("pointerdown", ev => {
  if (ev.button !== 0 || !UI.gm || UI.gm.done || UI.gm.checked) return;
  const h = ev.target.closest && ev.target.closest("[data-drag]"); if (!h || !h.closest("#gmRoot")) return;
  if (ev.pointerType !== "mouse" && !ev.target.closest(".grip")) return;
  if (ev.target.closest(".iconbtn,.linkbtn,.gm-catbtns")) return;
  GDR.el = h; GDR.x0 = ev.clientX; GDR.y0 = ev.clientY; GDR.on = false;
  if (ev.pointerType !== "mouse") ev.preventDefault();
});
document.addEventListener("pointermove", ev => {
  if (!GDR.el) return;
  if (!GDR.on) { if (Math.hypot(ev.clientX - GDR.x0, ev.clientY - GDR.y0) < 7) return; GDR.on = true; const r = GDR.el.getBoundingClientRect(); const gh = GDR.el.cloneNode(true); gh.classList.add("gm-ghost"); gh.style.width = r.width + "px"; gh.dx = GDR.x0 - r.left; gh.dy = GDR.y0 - r.top; document.body.appendChild(gh); GDR.ghost = gh; GDR.el.classList.add("dragging"); }
  ev.preventDefault();
  const gh = GDR.ghost; gh.style.left = (ev.clientX - gh.dx) + "px"; gh.style.top = (ev.clientY - gh.dy) + "px";
  GDR.px = ev.clientX; GDR.py = ev.clientY; gmHover();
  if (!GDR.raf) GDR.raf = requestAnimationFrame(gmAutoScroll);
}, { passive: false });
document.addEventListener("pointerup", ev => { if (GDR.el) gmDragEnd(ev, true); });
document.addEventListener("pointercancel", ev => { if (GDR.el) gmDragEnd(ev, false); });
document.addEventListener("click", ev => { if (GDR.suppress) { ev.stopPropagation(); ev.preventDefault(); GDR.suppress = false; } }, true);
