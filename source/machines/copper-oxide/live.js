// ---------- The Copper Oxide Changer: steps and drawing (core-head.js comes before, core-tail.js after) ----------
function fresh(choice) {
  return {
    oxide: choice, V: 0, frac: 0, temp: 0,
    flowOn: false, valve: 0, burn: 0, burnOn: false, jetLit: 0, load: 0, boatOut: 0,
    tip: null, flame: 0, bclock: 0, lcd: "before", mclock: 0,
  };
}
const ADD = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const SUB = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const MIX = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
function along(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return MIX(keys[i - 1][1], keys[i][1], ease((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
}
const TIP0 = DATA.SPLINT_TIP;
const ABOVE_JET = [DATA.JET[0] - 2, DATA.JET[1] + 4, DATA.JET_TOP + 4];
const SPLINT_KEYS = [[0, TIP0], [0.6, ADD(TIP0, [0, 0, 70])], [1.8, ADD(ABOVE_JET, [10, 10, 24])], [2.4, ABOVE_JET], [3.4, ABOVE_JET], [4.4, ADD(TIP0, [0, 0, 70])], [5.4, TIP0]];

const RUN = [
  // 1. the boat of powder is lowered into the tube
  (t) => { S.load = span(t, 0.2, 1.8); sayOnce("w", "scoop", "boat", 0.4); return t >= 2.4; },
  // 2. hydrogen flows and pushes the air out
  (t) => {
    if (t > 0.3) S.flowOn = true;
    sayOnce("w", "hiss", "flow", 0.5);
    if (M.safe && t > 1) sayOnce("ok", "air’s gone!", "flow", t, "small");
    return M.safe && t > 1.5;
  },
  // 3. the splint lights the hydrogen at the jet
  (t) => {
    S.tip = along(SPLINT_KEYS, t);
    S.flame = span(t, 0.2, 0.5) * (1 - span(t, 4.2, 4.8));
    if (S.flame > 0 && !S.said.sc) { S.said.sc = true; say("scritch", "pop", "small"); }
    if (t >= 2.6) S.jetLit = Math.min(1, span(t, 2.6, 2.9));
    if (t >= 2.6 && !S.said.p) { S.said.p = true; say("pop", "jet", "small"); }
    if (t >= 5.4) S.tip = null;
    return t >= 5.5;
  },
  // 4. the burner is lit: the powder changes colour
  (t) => {
    S.burnOn = true;
    sayOnce("w", "fwoomp", "burner", 0.3);
    if (!M.reacts) return t >= 4;
    return S.frac >= 0.5;
  },
  // 5. water drops gather at the cool end
  (t) => {
    if (!M.reacts) { sayOnce("w", "no change…", "cool", 0.3, "quiet"); return t >= 3; }
    sayOnce("w", "drip drip", "drips", 0.6);
    return S.frac >= 0.999;
  },
  // 6. burner off, hydrogen keeps flowing while it cools
  (t) => {
    S.burnOn = false;
    sayOnce("w", "tsss…", "cool", 0.5);
    return t >= 1 && S.temp < 0.22;
  },
  // 7. weigh the boat
  (t) => {
    if (t > 0.2) S.flowOn = false;
    S.boatOut = span(t, 0.4, 2.2);
    S.lcd = t < 3.2 ? "before" : "now";
    sayOnce("w", "beep!", "weigh", 2.3);
    return t >= 5.2;
  },
];

function update(dt) {
  const calm = still.matches;
  // hydrogen through the tube (the model decides the flow)
  if (S.flowOn) S.V += M.flow * dt;
  // the burner flame, and how hot the boat gets
  S.burn += ((S.burnOn ? 1 : 0) - S.burn) * (calm ? 1 : 1 - Math.exp(-dt / 0.2));
  const target = S.burnOn ? 1 : 0, tau = S.burnOn ? 1.5 : 3.5;
  S.temp += (target - S.temp) * (calm ? 1 : 1 - Math.exp(-dt / tau)) * (calm ? 0.2 : 1);
  // jet goes out when the gas stops
  if (!S.flowOn && S.jetLit > 0) S.jetLit = Math.max(0, S.jetLit - dt * 1.4);
  // the reaction: needs hydrogen, no air left, and heat
  if (M.reacts && S.flowOn && M.safe && S.temp > 0.7) S.frac = Math.min(1, S.frac + M.rate * dt);
  if (S.flowOn || S.burn > 0.01) S.bclock += dt * 0.5;
}
function onReset() {}

// ---------- static references ----------
const boatG = $("boatG"), segs = [...document.querySelectorAll("#boatG .seg .s")], weighG = $("weigh"), wseg = weighG.querySelector(".wseg .s");
const dropEls = [...document.querySelectorAll("#drops .drop")];
const bflame = $("bflame"), jetF = $("jetFlame"), glow = $("hotGlow"), splintG = $("splint"), flameG = $("flame"), lcd = $("lcdText");
const bubA = $("bubblesA"), shimmer = $("shimmer");
const bubbles = Array.from({ length: 12 }, () => { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (DATA.WB_R - 9); return { x: DATA.WB[0] + Math.cos(a) * d, y: DATA.WB[1] + Math.sin(a) * d, off: rnd(), wob: rnd() * 6, node: el("circle", { class: "bub", r: 0 }, bubA) }; });
const waves = [0, 1, 2].map(() => el("path", { class: "waft", d: "" }, shimmer));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, u) => "#" + hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], u)).toString(16).padStart(2, "0")).join("");
const style = (c, u) => `--l:${mixHex(c.from[0], c.to[0], u)};--m:${mixHex(c.from[1], c.to[1], u)};--d:${mixHex(c.from[2], c.to[2], u)}`;
const wavy = (x, y, h, ph) => { const pts = []; for (let i = 0; i <= 8; i++) { const v = i / 8; pts.push(`${f1(x + Math.sin(v * 6 + ph) * 3)} ${f1(y - v * h)}`); } return "M" + pts.join("L"); };

function draw(dt) {
  const calm = still.matches, now = performance.now() / 1000, C = DATA.COLORS[S.oxide];
  // the boat of powder: lowered in at step 1, lifted out at step 7
  const drop = (1 - S.load) + S.boatOut * 0.9;
  write(boatG, "transform", translateAlong(P, [0, 0, drop * 46]));
  write(boatG, "opacity", op(S.load * (1 - span(S.boatOut, 0.7, 1))));
  segs.forEach((g, i) => write(g, "style", style(C, clamp(M.frac * DATA.SEGS - i, 0, 1))));
  write(weighG, "opacity", op(span(S.boatOut, 0.6, 1)));
  write(wseg, "style", style(C, M.frac));
  // heat: glow under the boat, shimmer above it
  write(glow, "opacity", op(M.hot * 0.55));
  waves.forEach((p, i) => {
    const [x, y] = iso([DATA.BURN[0] - 10 + i * 10, DATA.BURN[1] + 1, DATA.TUBE_Z + 12], P);
    write(p, "d", M.hot > 0.15 ? wavy(x, y, 12, i * 2 + (calm ? 0 : now * 3)) : ""); write(p, "opacity", op(M.hot * 0.8));
  });
  // burner flame and the jet flame
  write(bflame, "opacity", op(S.burn));
  if (S.burn > 0.02) { const [fx, fy] = iso([DATA.BURN[0], DATA.BURN[1], DATA.BURN_TIP], P); const h = (11 + flick()) * S.burn; write(bflame.children[0], "d", flameD(fx, fy, h, 5)); write(bflame.children[1], "d", flameD(fx, fy, h * 0.5, 2.4)); }
  write(jetF, "opacity", op(S.jetLit));
  if (S.jetLit > 0.02) { const [jx, jy] = iso([DATA.JET[0], DATA.JET[1], DATA.JET_TOP], P); const h = (13 + flick(4)) * S.jetLit; write(jetF.children[0], "d", flameD(jx, jy, h, 4.5)); write(jetF.children[1], "d", flameD(jx, jy, h * 0.5, 2)); }
  // splint
  write(splintG, "transform", S.tip ? translateAlong(P, SUB(S.tip, TIP0)) : "");
  write(flameG, "opacity", op(S.flame));
  if (S.flame > 0) { const [fx, fy] = iso(TIP0, P); const h = 10 + flick(); write(flameG.children[0], "d", flameD(fx - 1, fy, h, 6)); write(flameG.children[1], "d", flameD(fx - 1, fy, h * 0.55, 3)); }
  // water drops at the cool end (as many as the model says have formed)
  dropEls.forEach((d, i) => { const s = clamp(M.frac * DATA.DROP_N * 1.1 - i, 0, 1); write(d, "rx", String(f1(s * 1.9))); write(d, "ry", String(f1(s * 1.3))); });
  // bubbles in the generator while the gas flows
  const n = S.flowOn ? Math.round(clamp(M.flow / 4, 2, bubbles.length)) : 0;
  bubbles.forEach((b, i) => {
    if (i >= n) { write(b.node, "r", "0"); return; }
    const u = (S.bclock + b.off) % 1, z = 3 + u * (DATA.ACID_TOP - 4);
    const [x, y] = iso([b.x + Math.sin(u * 9 + b.wob) * 1.2, b.y, z], P);
    write(b.node, "cx", String(f1(x))); write(b.node, "cy", String(f1(y))); write(b.node, "r", String(f1((0.9 + u * 1.2) * K)));
  });
  // the balance display
  text(lcd, S.boatOut < 0.5 ? "0.00 g" : S.lcd === "before" ? `${M.before.toFixed(2)} g` : `${M.boat.toFixed(2)} g`);
  molecules(dt);
}

// ---------- Papa's magnifier: the hot powder up close ----------
const grid = $("oxGrid"), mmid = $("molMid"), mfront = $("molFront"), cap = $("ionCap");
const U = 12, cols = 4;
const unitPos = (i) => [50 + (i % cols) * 44, 126 + Math.floor(i / cols) * 34];
const units = Array.from({ length: U }, (_, i) => {
  const [cx, cy] = unitPos(i), g = el("g", { class: "mol unit" }, grid);
  el("circle", { cx, cy, r: 13, class: "a-cu" }, g); el("text", { x: cx, y: cy + 3.4, class: "mol-t" }, g).textContent = "Cu";
  const o = el("g", { class: "oxy" }, g); el("circle", { cx: cx + 15, cy: cy - 5, r: 8, class: "a-o" }, o); el("text", { x: cx + 15, y: cy - 2.4, class: "mol-t" }, o).textContent = "O";
  return { g, o, cu: g.querySelector(".a-cu"), t: g.querySelector(".mol-t") };
});
const h2mol = (parent) => { const g = el("g", { class: "mol" }, parent); [-5.5, 5.5].forEach((x) => { el("circle", { cx: x, cy: 0, r: 6.5, class: "a-h" }, g); el("text", { x, y: 2.6, class: "mol-t" }, g).textContent = "H"; }); return g; };
const watermol = (parent) => { const g = el("g", { class: "mol" }, parent); [-8, 8].forEach((x) => { el("circle", { cx: x, cy: 6, r: 5.5, class: "a-h" }, g); el("text", { x, y: 8.6, class: "mol-t" }, g).textContent = "H"; }); el("circle", { cx: 0, cy: 0, r: 9, class: "a-o" }, g); el("text", { x: 0, y: 3.4, class: "mol-t" }, g).textContent = "O"; return g; };
const idle = [h2mol(mmid), h2mol(mmid), h2mol(mmid)], active = h2mol(mfront), wmol = watermol(mfront);
const put = (g, x, y, o = 1, rot = 0) => { write(g, "transform", `translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})`); write(g, "opacity", op(o)); };
function molecules(dt) {
  const T = (S.mclock += still.matches ? 0 : dt), sym = M.metal, flowing = S.flowOn, N = M.frac * U;
  const C = DATA.COLORS[S.oxide];
  units.forEach((u, i) => {
    const t = clamp(N - i, 0, 1);
    write(u.o, "opacity", op(1 - span(t, 0.4, 0.5)));
    text(u.t, sym);
    write(u.cu, "style", `fill:${S.oxide === "PbO" ? "#a9aeb6" : S.oxide === "ZnO" ? "#c9ced6" : "#d4784a"}`);
  });
  // a few idle hydrogen molecules drift across the top while the gas flows
  idle.forEach((g, i) => { const x = 20 + ((T * 40 + i * 80) % 220), y = 96 + Math.sin(T * 2.2 + i * 2) * 14; put(g, x, y, flowing ? 1 : 0, T * 80 + i * 40); });
  const i = Math.min(U - 1, Math.floor(N)), u = N - i, [cx, cy] = unitPos(i);
  const reacting = M.reacts && M.frac > 0 && M.frac < 0.999 && S.temp > 0.5 && flowing;
  if (reacting) {
    const come = span(u, 0, 0.4), go = span(u, 0.55, 1);
    put(active, lerp(-10, cx + 14, come), lerp(100, cy - 5, come), (1 - span(u, 0.42, 0.5)) * span(u, 0, 0.08), 0);
    put(wmol, lerp(cx + 14, 215, go), lerp(cy - 5, 70, go), span(u, 0.45, 0.55) * (1 - span(u, 0.92, 1)), lerp(0, -20, go));
  } else if (!M.reacts && flowing && S.temp > 0.5) {
    const b = Math.abs(Math.sin(T * 1.6)); put(active, lerp(10, 90, b), lerp(120, 138, b) + Math.sin(T * 9) * 2, 1, T * 200); put(wmol, 0, 0, 0);
  } else { put(active, 0, 0, 0); put(wmol, 0, 0, 0); }
  const done = M.frac >= 0.999;
  text(cap, !flowing && S.done < 2 ? "waiting for hydrogen" : S.temp < 0.5 && !done ? (M.reacts ? "cold: not much happens" : "cold and still") : !M.reacts ? "H₂ can’t pull O away" : done ? `all that’s left: ${sym}` : u < 0.4 ? "H₂ reaches an oxygen atom" : u < 0.6 ? "H₂ + O join: water!" : `water leaves, ${sym} stays`);
}

// ---------- numbers and words (all from the model) ----------
const g2 = (n, d = 2) => (n < 0.0005 ? "0" : n.toFixed(d));
const cap1 = (s) => s[0].toUpperCase() + s.slice(1);
function panel() {
  text($("gBoat"), `≈ ${g2(M.boat)} g`);
  text($("gMetalL"), M.reacts ? `${cap1(M.metalName)} made` : "Metal made");
  text($("gMetal"), `≈ ${g2(M.metalMade)} g`);
  text($("gWater"), `≈ ${g2(M.water)} g`);
  text($("gH2"), `≈ ${Math.round(M.h2Passed)} mL`);
  text($("gAir"), `≈ ${Math.round(M.airLeft)} mL`);
  text($("gDone"), M.reacts ? `${Math.round(M.frac * 100)} %` : "no change");
  text($("readout"), S.load > 0.5 ? `${M.name} · boat ≈ ${g2(M.boat)} g · H₂ ≈ ${Math.round(M.h2Passed)} mL` : "boat not loaded yet");
  const shown = S.done + (S.playing >= 0 ? 1 : 0);
  text($("eqA"), S.oxide); text($("eqB"), "+ H₂"); text($("eqC"), M.reacts ? `→ ${M.metal} + H₂O` : "→ no reaction");
  $("eqA").classList.toggle("on", shown >= 1); $("eqB").classList.toggle("on", shown >= 2); $("eqC").classList.toggle("on", shown >= 4);
  $("eqC").classList.toggle("no", !M.reacts);
}
const OXNOTE = {
  CuO: null,
  PbO: "Papa’s note: this is <b>lead oxide</b>, a yellow powder. Lead has joined up with oxygen to make it.",
  ZnO: "Papa’s note: this is <b>zinc oxide</b>, a white powder. Zinc has joined up with oxygen to make it.",
};
function hintFor() {
  if (!M.reacts && S.playing >= 3 && S.playing <= 4) return "Look closely. Is anything changing?";
  if (!M.reacts && S.done >= STEPS.length && S.playing < 0) return "Nothing changed. Hydrogen couldn’t take the oxygen from zinc oxide.";
  return "";
}
function noteFor() {
  const i = S.playing >= 0 ? S.playing : S.done - 1;
  if (i === 0 && OXNOTE[S.oxide]) return OXNOTE[S.oxide];
  if (!M.reacts && i >= 3) return "Papa’s note: zinc is <b>high</b> on the reactivity ladder, so its oxide holds on to oxygen very tightly. Hydrogen can’t pull it away: no colour change and no water.";
  return "";
}
function onChoice() {
  text($("keyMetal"), M.metal);
  const msg = { CuO: "<b>Cu</b> is low on the ladder, so it doesn’t hold its oxygen tightly.", PbO: "<b>Pb</b> sits lower than zinc on the ladder. Let’s see if hydrogen can take its oxygen.", ZnO: "<b>Zn</b> is high on the ladder. Let’s see if hydrogen can take its oxygen." };
  $("ladderNote").innerHTML = msg[S.choice];
}
