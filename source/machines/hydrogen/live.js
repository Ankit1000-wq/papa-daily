// ---------- live page: one loop, one model ----------
const $ = (id) => document.getElementById(id);
const P = DATA.P;
const fig = document.querySelector(".fig");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const span = (t, a, b) => ease((t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const f1 = (v) => Math.round(v * 10) / 10;
const NS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}, parent) => { const n = document.createElementNS(NS, name); for (const key in attrs) n.setAttribute(key, attrs[key]); if (parent) parent.appendChild(n); return n; };
const K = Math.sqrt(1.6) * P.scale;

let S;
function fresh(metal) {
  return {
    metal, metalIn: false, acidIn: false, reacting: false, V: 0, jarStart: 0, target: 0,
    done: 0, playing: -1, t: 0, phase: 0, wait: 0,
    gran: 0, acid: 0, carry: 0, tilt: 0, pour: 0,
    jarLift: 0, jarAlpha: 1, spares: 2, spareFade: [1, 1],
    splint: 0, flame: 0, popAt: -1, said: {},
    bclock: 0, iclock: 0,
  };
}
S = fresh("Zn");
let M = model(S);

// ---------- static references ----------
const granEls = [...document.querySelectorAll("#granules .gran")];
const acidEls = document.querySelectorAll("#acid path");
const stemAcid = document.querySelector("#stemAcid path");
const jarGrp = $("jarGrp");
const jw = document.querySelectorAll("#jarWater path");
const jarLabel = $("jarLabel");
const acidBottle = $("acidBottle");
const pour = $("pour");
const cupAcid = $("cupAcid");
const splintG = $("splint");
const flame = $("flame");
const flameO = flame.querySelector(".flame-o");
const flameI = flame.querySelector(".flame-i");
const popG = $("popFlash");
const words = $("words");
const spareEls = [$("spareFront"), $("spareBack")];

// acid bottle: rotate about its mouth, carry the mouth to just above the thistle cup
const mouth0 = iso(DATA.POUR_FROM, P);
const mouth1 = [DATA.CUP[0] + 16, DATA.CUP[1] - 22];

// ---------- bubbles ----------
const bubA = $("bubblesA"), bubT = $("bubblesT");
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const bottleBubbles = Array.from({ length: 18 }, (_, i) => {
  const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (DATA.WB_R - 10);
  return { x: DATA.WB[0] + Math.cos(a) * d, y: DATA.WB[1] + Math.sin(a) * d, off: rnd(), wob: rnd() * 6, node: el("circle", { class: "bub", r: 0 }, bubA) };
});
const troughBubbles = Array.from({ length: 10 }, (_, i) => ({ off: i / 10 + rnd() * 0.05, wob: rnd() * 6, node: el("circle", { class: "bub", r: 0 }, bubT) }));

// ---------- ion scene ----------
const ionMoving = $("ionMoving"), ionCl = $("ionClFixed");
const ionCap = $("ionCap");
const ionLiquid = $("ionLiquid");
const surfaceAtoms = [...document.querySelectorAll("#ionSurface .atom")];
const slotAtom = surfaceAtoms.find((a) => a.dataset.row === "0" && a.dataset.i === "4");
const ionBall = (cls, r, label) => { const g = el("g", { class: "atom " + cls }, ionMoving); el("circle", { r }, g); const t = el("text", { y: r > 10 ? 3.6 : 3 }, g); t.textContent = label; return g; };
const CL_SPOTS = [[40, 78], [196, 66], [58, 150], [206, 150], [118, 112]];
const clEls = CL_SPOTS.map(() => { const g = el("g", { class: "atom cl" }, ionCl); el("circle", { r: 12 }, g); const t = el("text", { y: 3.6 }, g); t.textContent = "Cl⁻"; return g; });
const freeIons = [ionBall("mion", 13, "Zn²⁺"), ionBall("mion", 13, "Zn²⁺")];
const traveller = ionBall("mion", 13, "Zn");
const hA = ionBall("hion", 9, "H⁺"), hB = ionBall("hion", 9, "H⁺");
const idleH = [ionBall("hion", 9, "H⁺"), ionBall("hion", 9, "H⁺")];
const h2 = el("g", { class: "h2" }, ionMoving);
const h2Bubble = el("circle", { class: "h2-bubble", r: 18 }, h2);
el("circle", { class: "h2-atom", cx: -5.5, r: 7 }, h2);
el("circle", { class: "h2-atom", cx: 5.5, r: 7 }, h2);
const h2t = el("text", { class: "h2-t", y: 3 }, h2); h2t.textContent = "H₂";
const place = (g, x, y, o = 1) => { g.setAttribute("transform", `translate(${f1(x)} ${f1(y)})`); g.setAttribute("opacity", f1(o * 100) / 100); };
const label = (g, text) => { const t = g.querySelector("text"); if (t.textContent !== text) t.textContent = text; };

function drawIons(dt) {
  const m = METALS[S.metal];
  const sym = S.metal;
  const ion = m.ion;
  for (const a of surfaceAtoms) { label(a, sym); a.setAttribute("opacity", S.metalIn ? 1 : 0); }
  document.querySelector("#ions").dataset.metal = sym;
  const wet = S.acid > 0.6;
  ionLiquid.setAttribute("opacity", f1(clamp((S.acid - 0.4) / 0.6, 0, 1) * 100) / 100);
  const calm = still.matches;
  if (M.rate > 0 && !calm) S.iclock += dt * M.rate / 12;
  const u = S.iclock % 1;
  const cycles = Math.floor(S.iclock);
  const wob = (i, s = 1) => (calm ? 0 : Math.sin(performance.now() / 700 + i * 1.7) * 3 * s);
  CL_SPOTS.forEach(([x, y], i) => place(clEls[i], x + wob(i), y + wob(i + 3), wet ? 1 : 0));
  place(idleH[0], 150 + wob(7, 2), 78 + wob(8), wet ? 1 : 0);
  place(idleH[1], 24 + wob(9), 110 + wob(10, 2), wet ? 1 : 0);
  const reacting = M.reacts && wet && S.metalIn && (S.iclock > 0 || M.rate > 0);
  // ions made in earlier cycles drift around: they stay dissolved (with Cl⁻ that is the salt solution)
  freeIons.forEach((g, i) => { label(g, ion); place(g, (i ? 80 : 168) + wob(i + 11, 2), (i ? 52 : 120) + wob(i + 13), reacting && cycles > i ? 1 : 0); });
  if (!reacting) {
    place(traveller, 0, 0, 0); place(h2, 0, 0, 0);
    place(hA, 70 + wob(1), 110 + wob(2), wet ? 1 : 0); place(hB, 172 + wob(4), 100 + wob(5), wet ? 1 : 0);
    slotAtom.setAttribute("opacity", S.metalIn ? 1 : 0);
    ionCap.textContent = !S.metalIn ? (wet ? "acid, but no metal" : "empty bottle") : !wet ? `dry ${m.name}, waiting for acid` : M.reacts ? `${sym} atoms meet H⁺ ions` : `${sym} can’t push hydrogen out`;
    return;
  }
  // 1. a metal atom leaves the surface as an ion
  const a1 = span(u, 0, 0.35);
  label(traveller, u < 0.1 ? sym : ion);
  traveller.classList.toggle("charged", u >= 0.1);
  place(traveller, lerp(120, 158, a1) + (u > 0.35 ? (u - 0.35) * 30 : 0), lerp(206, 150, a1) - (u > 0.35 ? (u - 0.35) * 40 : 0), 1 - span(u, 0.7, 1));
  slotAtom.setAttribute("opacity", f1(span(u, 0.85, 1) * 100) / 100);
  // 2. two H⁺ come down to the surface and pair up
  const a2 = span(u, 0.12, 0.5);
  const pin = 1 - span(u, 0.55, 0.62);
  const fadeIn = span(u, 0, 0.1);
  place(hA, lerp(70, 111, a2), lerp(110, 184, a2), fadeIn * pin);
  place(hB, lerp(172, 129, a2), lerp(100, 184, a2), fadeIn * pin);
  // 3. one H₂ molecule, wrapped in a bubble, floats up
  const a3 = span(u, 0.62, 1);
  h2Bubble.setAttribute("r", f1(lerp(9, 20, span(u, 0.6, 0.75))));
  h2Bubble.setAttribute("opacity", f1(span(u, 0.62, 0.72) * 100) / 100);
  place(h2, 120, lerp(184, -10, a3), span(u, 0.5, 0.58) * (1 - span(u, 0.92, 1)));
  ionCap.textContent = M.rate === 0 ? "resting… tap the next step" : u < 0.4 ? `${sym} atom leaves as ${ion}` : u < 0.66 ? "2 H⁺ join → H₂" : "H₂ bubble floats up";
}

// ---------- comic sound words ----------
function say(text, spot, cls = "") {
  const [x, y] = DATA.SPOTS[spot];
  const g = el("g", { class: "pow " + cls, transform: `translate(${f1(x)} ${f1(y)})` }, words);
  const inner = el("g", { class: "pow-in" }, g);
  el("text", { class: "pow-back" }, inner).textContent = text;
  el("text", { class: "pow-front" }, inner).textContent = text;
  setTimeout(() => g.remove(), still.matches ? 2400 : 1900);
}
function sayOnce(key, text, spot, at, cls) { if (S.t >= at && !S.said[key]) { S.said[key] = true; say(text, spot, cls); } }

// ---------- optional tiny pop sound (off until the reader turns it on) ----------
let audio = null;
$("sound").addEventListener("change", (e) => { if (e.target.checked && !audio) audio = new (window.AudioContext || window.webkitAudioContext)(); });
function popSound() {
  if (!audio || !$("sound").checked) return;
  const len = audio.sampleRate * 0.25;
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * 0.03));
  const src = audio.createBufferSource(); src.buffer = buf;
  const gain = audio.createGain(); gain.gain.value = 0.6;
  src.connect(gain).connect(audio.destination); src.start();
}

// ---------- the steps ----------
const gas = (target) => { if (M.reacts) { S.target = target; S.reacting = S.V < target; } };
function advanceGas(dt) {
  if (S.reacting) {
    S.V = Math.min(S.target, S.V + M.flow * dt);
    if (S.V >= S.target) S.reacting = false;
  }
}
const RUN = [
  // 1. zinc in
  (t) => { S.metalIn = true; S.gran = t; sayOnce("w", "plink plink", "zinc", 0.25); return t >= 2.1; },
  // 2. acid in through the thistle funnel
  (t) => {
    S.carry = span(t, 0, 1.2) * (1 - span(t, 3.8, 5));
    S.tilt = span(t, 0.8, 1.5) * (1 - span(t, 3.5, 4.2));
    S.pour = span(t, 1.4, 1.6) * (1 - span(t, 3.4, 3.6));
    S.acid = span(t, 1.5, 3.6);
    S.acidIn = S.acid > 0.3;
    sayOnce("w", "glug glug", "acid", 1.5);
    return t >= 5.1;
  },
  // 3. fizz
  (t) => {
    if (t === 0) gas(40);
    if (M.reacts) sayOnce("w", "fizz", "fizz", 0.4); else sayOnce("w", "…nothing!", "fizz", 0.4, "quiet");
    return t >= 3.2 && !S.reacting;
  },
  // 4. let the air out: first jar fills with air, and we throw it away
  (t) => {
    if (!M.reacts) { sayOnce("w", "…still nothing", "trough", 0.3, "quiet"); return t >= 2.5; }
    if (S.phase === 0) { if (t === 0) gas(112); sayOnce("w", "bubble-bubble", "trough", 0.3); if (!S.reacting && t > 0.5) { S.phase = 1; S.t0 = t; } return false; }
    const u = t - S.t0;
    if (S.phase === 1) { S.jarLift = span(u, 0, 1.2); S.jarAlpha = 1 - span(u, 1.0, 1.8); sayOnce("air", "air — let it go!", "trough", 0.2, "small"); if (u >= 1.9) { S.phase = 2; S.t0 = t; S.jarStart = S.V; S.spares = 1; } return false; }
    S.jarLift = 1 - span(u, 0, 1.2); S.jarAlpha = span(u, 0, 0.6);
    return u >= 1.3;
  },
  // 5. collect hydrogen over water
  (t) => {
    if (!M.reacts) { sayOnce("w", "no gas to catch", "trough", 0.3, "quiet"); return t >= 2.5; }
    if (t === 0) gas(224);
    sayOnce("w", "bubble-bubble", "trough", 0.3);
    return t >= 1 && !S.reacting;
  },
  // 6. the burning splint test
  (t) => {
    if (!M.reacts) { sayOnce("w", "no pop…", "pop", 0.4, "quiet"); return t >= 2.5; }
    S.jarLift = span(t, 0, 1.3);
    S.splint = span(t, 1.1, 3.0) * (1 - span(t, 4.0, 5.2));
    S.flame = span(t, 1.0, 1.3) * (1 - span(t, 4.8, 5.2));
    if (t >= 3.0 && S.popAt < 0) { S.popAt = performance.now(); S.jarStart = null; popSound(); }
    sayOnce("w", "POP!", "pop", 3.0, "big");
    S.jarAlpha = 1 - span(t, 4.2, 5.0);
    return t >= 5.3;
  },
  // 7. a new jar on the shelf
  (t) => {
    if (!M.reacts) { sayOnce("w", "copper stays quiet", "trough", 0.3, "quiet"); return t >= 2.5; }
    if (t === 0) { S.jarStart = S.V; S.spares = 0; }
    S.jarLift = 1 - span(t, 0, 1.2); S.jarAlpha = span(t, 0, 0.6);
    if (t >= 1.2 && S.target < 336) gas(336);
    if (t >= 1.3) sayOnce("w", "bubble-bubble", "trough", 1.3);
    return t >= 1.4 && S.target >= 336 && !S.reacting;
  },
];

// ---------- drawing ----------
const write = (node, attr, value) => { if (node.getAttribute(attr) !== value) node.setAttribute(attr, value); };
const text = (node, value) => { if (node.textContent !== value) node.textContent = value; };
function draw(dt) {
  const calm = still.matches;
  // granules fall in one after another
  granEls.forEach((g, i) => {
    const u = clamp((S.gran - i * 0.05) / 0.7, 0, 1);
    const fall = 1 - u * u;
    write(g, "transform", translateAlong(P, [0, 0, fall * 80]));
    write(g, "opacity", String(f1(clamp(u * 4, 0, 1) * 100) / 100));
  });
  document.getElementById("granules").setAttribute("opacity", S.metalIn ? 1 : 0);
  // acid level in the bottle and up the funnel stem
  const level = DATA.ACID_TOP * S.acid;
  if (level > 0.3) {
    const c = cylinder(DATA.WB[0], DATA.WB[1], DATA.WB_R - 1.5, 1.5, level, P, 64);
    write(acidEls[0], "d", c.fill); write(acidEls[1], "d", c.top); write(acidEls[2], "d", c.outline);
    const sz = Math.max(DATA.STEM_LOW, level + 1.5);
    write(stemAcid, "d", sz > DATA.STEM_LOW + 0.5 ? cylinder(DATA.NECK_L[0], DATA.NECK_L[1], DATA.STEM_R - 0.7, DATA.STEM_LOW, sz - DATA.STEM_LOW, P, 12).fill : "");
  } else { acidEls.forEach((p) => write(p, "d", "")); write(stemAcid, "d", ""); }
  // acid bottle carried over and tipped
  const dx = (mouth1[0] - mouth0[0]) * S.carry, dy = (mouth1[1] - mouth0[1]) * S.carry;
  write(acidBottle, "transform", S.carry > 0 ? `translate(${f1(dx)} ${f1(dy)}) rotate(${f1(-118 * S.tilt)} ${f1(mouth0[0])} ${f1(mouth0[1])})` : "");
  write(pour, "opacity", String(f1(S.pour * 100) / 100));
  write(cupAcid, "opacity", String(f1(S.pour * 100) / 100));
  if (S.pour > 0) {
    const [ax, ay] = mouth0, [bx, by] = DATA.CUP;
    // pour is inside the moved group: express the stream in the group's own (unrotated) coordinates
    const back = (x, y) => { const rx = x - dx - ax, ry = y - dy - ay; const r = (118 * S.tilt * Math.PI) / 180; return [ax + rx * Math.cos(r) - ry * Math.sin(r), ay + rx * Math.sin(r) + ry * Math.cos(r)]; };
    const s0 = back(mouth1[0] - 2, mouth1[1] + 2), s1 = back(bx + 4, by - 10), s2 = back(bx, by + 6);
    write(pour, "d", `M${f1(s0[0])} ${f1(s0[1])}Q${f1(s1[0])} ${f1(s1[1])} ${f1(s2[0])} ${f1(s2[1])}`);
  }
  // the jar on the shelf: lift, fade, and its water pushed down by the gas
  write(jarGrp, "transform", translateAlong(P, [0, 0, S.jarLift * DATA.JAR_LIFT]));
  write(jarGrp, "opacity", String(f1(S.jarAlpha * 100) / 100));
  const z0 = DATA.JAR_Z + 3.4, z1 = DATA.JAR_Z + DATA.JAR_H - 6;
  const full = S.jarStart === null ? (S.popAt > 0 ? 1 : 0) : M.jarFull;
  const wTop = z1 - (z1 - z0) * full;
  if (wTop - z0 > 0.4 && S.jarLift < 0.02) {
    const c = cylinder(DATA.TR[0], DATA.TR[1], DATA.JAR_R - 1.3, z0, wTop - z0, P, 40);
    write(jw[0], "d", c.fill); write(jw[1], "d", c.top);
  } else { write(jw[0], "d", ""); write(jw[1], "d", ""); }
  // the gas trapped at the top of the jar (it's see-through; a pale tint and a word tell us it's there)
  const gasFrom = S.jarLift < 0.02 ? Math.max(wTop, z0) : z0;
  const holds = S.jarStart === null ? (S.popAt > 0 && S.t < 3 ? "hydrogen" : "none") : M.jarHolds;
  if (z1 - gasFrom > 1.5 && holds !== "none" && (S.jarStart !== null ? M.inJar > 0.5 : S.popAt < 0)) {
    write(jw[2], "d", cylinder(DATA.TR[0], DATA.TR[1], DATA.JAR_R - 1.3, gasFrom, z1 - gasFrom, P, 40).fill);
    const [lx, ly] = iso([DATA.TR[0] + 5, DATA.TR[1] - 8, Math.max(gasFrom + 3, z1 - 12)], P);
    write(jarLabel, "x", String(f1(lx))); write(jarLabel, "y", String(f1(ly)));
    text(jarLabel, holds === "air" ? "air" : "H₂");
  } else { write(jw[2], "d", ""); text(jarLabel, ""); }
  spareEls.forEach((g, i) => { const want = S.spares > i ? 1 : 0; S.spareFade[i] += (want - S.spareFade[i]) * (calm ? 1 : 1 - Math.exp(-dt / 0.25)); write(g, "opacity", String(f1(S.spareFade[i] * 100) / 100)); });
  // bubbles
  if (!calm) S.bclock += dt * M.rate * 0.22;
  const n = Math.round(clamp(M.rate * 2, 0, bottleBubbles.length));
  bottleBubbles.forEach((b, i) => {
    if (i >= n || level < 3) { write(b.node, "r", "0"); return; }
    const u = (S.bclock + b.off) % 1;
    const z = 3 + u * (level - 4);
    const [x, y] = iso([b.x + Math.sin(u * 9 + b.wob) * 1.2, b.y, z], P);
    write(b.node, "cx", String(f1(x))); write(b.node, "cy", String(f1(y))); write(b.node, "r", String(f1((0.9 + u * 1.3) * K)));
  });
  const nt = Math.round(clamp(M.rate * 1.4, 0, troughBubbles.length));
  troughBubbles.forEach((b, i) => {
    if (i >= nt || S.jarLift > 0.01) { write(b.node, "r", "0"); return; }
    const u = (S.bclock * 1.3 + b.off) % 1;
    const z = DATA.BEE_TOP + 1 + u * Math.max(0, wTop - DATA.BEE_TOP - 2);
    const [x, y] = iso([DATA.TR[0] + Math.sin(u * 7 + b.wob) * 3, DATA.TR[1], z], P);
    write(b.node, "cx", String(f1(x))); write(b.node, "cy", String(f1(y))); write(b.node, "r", String(f1((1 + u * 1.2) * K)));
  });
  // the splint goes up, then back over the trough to the jar's mouth
  const tip = DATA.SPLINT_TIP, test = DATA.SPLINT_TEST;
  const s = S.splint;
  const off = [(test[0] - tip[0]) * span(s, 0, 0.5), (test[1] - tip[1]) * span(s, 0.45, 1), (test[2] - tip[2]) * span(s, 0, 0.5)];
  write(splintG, "transform", s > 0 ? translateAlong(P, off) : "");
  write(flame, "opacity", String(f1(S.flame * 100) / 100));
  if (S.flame > 0) {
    const [fx, fy] = iso(tip, P);
    const flick = calm ? 0 : Math.sin(performance.now() / 70) * 0.8;
    const h = 10 + flick;
    const sh = (hh, w) => `M${f1(fx - 1)} ${f1(fy + 1)}C${f1(fx - w)} ${f1(fy - 2)} ${f1(fx - w * 0.4)} ${f1(fy - hh * 0.7)} ${f1(fx - 3)} ${f1(fy - hh)}C${f1(fx + w * 0.5)} ${f1(fy - hh * 0.6)} ${f1(fx + w * 0.7)} ${f1(fy - 2)} ${f1(fx - 1)} ${f1(fy + 1)}Z`;
    write(flameO, "d", sh(h, 6)); write(flameI, "d", sh(h * 0.55, 3));
  }
  // pop: a pale blue flash at the jar's mouth
  const age = S.popAt > 0 ? (performance.now() - S.popAt) / 1000 : -1;
  const flash = age < 0 || calm ? (age >= 0 && age < 1 ? 1 : 0) : clamp(age / 0.08, 0, 1) * Math.exp(-Math.max(0, age - 0.08) / 0.35);
  write(popG, "opacity", String(f1(flash * 100) / 100));
  if (flash > 0.01) {
    const [mx, my] = iso([DATA.TR[0], DATA.TR[1], DATA.JAR_Z + DATA.JAR_LIFT], P);
    const r = 10 + Math.min(1, Math.max(0, age) * 4) * 14;
    const pts = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; const q = i % 2 ? r * 0.55 : r; return `${f1(mx + Math.cos(a) * q * 1.2)} ${f1(my + 4 + Math.sin(a) * q * 0.7)}`; });
    popG.innerHTML = `<path class="pop-o" d="M${pts.join("L")}Z"/><ellipse class="pop-i" cx="${f1(mx)}" cy="${f1(my + 4)}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.3)}"/>`;
  }
  drawIons(dt);
}

// ---------- numbers and words (all from the model) ----------
const g = (n, d = 0) => (n < 0.0005 ? "0" : n.toFixed(d));
function panel() {
  const m = M;
  text($("gUsedL"), `${m.name[0].toUpperCase() + m.name.slice(1)} used`);
  text($("gUsed"), `≈ ${g(m.used, 2)} g`);
  text($("gMade"), `≈ ${g(m.made)} mL`);
  text($("gJar"), m.jarHolds === "none" ? "no jar" : `≈ ${g(m.inJar)} mL ${m.jarHolds === "air" ? "air" : "H₂"}`);
  text($("gRate"), m.rate ? `≈ ${m.rate} /s` : "0 /s");
  text($("gJars"), String(m.jars));
  text($("gAir"), `≈ ${g(m.airLeft)} mL`);
  text($("readout"), S.metalIn ? `${S.metal} ${g(m.left, 2)} g left · jar ≈ ${g(m.inJar)} mL ${m.jarHolds === "air" ? "air" : m.jarHolds === "none" ? "" : "H₂"}`.trim() : "bottle empty");
  // equation builds up as the steps happen
  const shown = S.done + (S.playing >= 0 ? 1 : 0);
  text($("eqA"), S.metal);
  $("eqA").classList.toggle("on", shown >= 1);
  $("eqB").classList.toggle("on", shown >= 2);
  text($("eqC"), m.reacts ? `→ ${m.salt} + H₂↑` : "→ no reaction");
  $("eqC").classList.toggle("on", shown >= 3);
  $("eqC").classList.toggle("no", !m.reacts);
}
function buttons() {
  document.querySelectorAll(".step").forEach((b, i) => {
    const can = i === S.done && S.playing < 0;
    b.disabled = !can;
    b.classList.toggle("done", i < S.done);
    b.classList.toggle("playing", i === S.playing);
    b.classList.toggle("next", can);
    b.setAttribute("aria-label", `${i + 1}. ${STEPS[i].label}${i < S.done ? " (done)" : ""}`);
  });
  const next = document.querySelector(".step.next, .step.playing");
  if (next && matchMedia("(max-width: 699px)").matches) {
    const strip = document.querySelector(".steps ol");
    const left = next.parentElement.offsetLeft - 16;
    if (Math.abs(strip.scrollLeft - left) > 4) strip.scrollTo({ left, behavior: still.matches ? "auto" : "smooth" });
  }
}
function hintFor() {
  const i = S.playing >= 0 ? S.playing : S.done;
  if (S.done >= STEPS.length && S.playing < 0) return M.reacts ? `All done! We made ≈ ${Math.round(M.made)} mL of hydrogen.` : "Copper never fizzed. It’s below hydrogen!";
  if (!M.reacts && i >= 2) return "Nothing happens! Copper can’t push hydrogen out of the acid.";
  if (S.playing < 0 && S.done === 0) return "Tap step 1 to start.";
  return STEPS[i].hint;
}
function noteFor() {
  const i = S.playing >= 0 ? S.playing : S.done - 1;
  if (i < 0) return "Papa’s note: we’ll make hydrogen the Class 8 way: dilute acid on granulated zinc.";
  if (!M.reacts && i >= 2) return "Papa’s note: copper is <b>below</b> hydrogen in the reactivity series, so it can’t push hydrogen out of dilute acid. No bubbles, no gas, no pop.";
  if (S.metal !== "Zn" && i === 0) return `Papa’s note: we’re using ${M.name} today. ${S.metal === "Mg" ? "Magnesium is more reactive than zinc, so it fizzes faster." : S.metal === "Fe" ? "Iron is less reactive than zinc, so it bubbles slowly." : "Copper sits below hydrogen. Let’s see what happens…"}`;
  return STEPS[i].note;
}
let lastHint = "", lastNote = "";
const forMetal = (s) => (S.metal === "Zn" || S.metal === "Cu" ? s : s.replace(/zinc/g, M.name).replace(/Zinc/g, M.name[0].toUpperCase() + M.name.slice(1)));
function words2() {
  const h = forMetal(hintFor()), n = forMetal(noteFor());
  text($("figTitle"), `Hydrogen from ${M.name} & acid`);
  if (h !== lastHint) { lastHint = h; $("hint").textContent = h; }
  if (n !== lastNote) { lastNote = n; $("note").innerHTML = n; }
}
function ladder() {
  document.querySelectorAll(".ladder li[data-el]").forEach((li) => li.classList.toggle("pick", li.dataset.el === S.metal));
  document.querySelectorAll(".segb").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.metal === S.metal)));
  $("keyM").textContent = METALS[S.metal].ion;
  const above = S.metal !== "Cu";
  $("ladderNote").innerHTML = above
    ? `<b>${S.metal}</b> is above <b>H</b>, so it pushes hydrogen out (${M.speed}).`
    : `<b>Cu</b> is below <b>H</b>, so nothing happens.`;
}

// ---------- the loop ----------
let frame = 0, last = 0, visible = true, autoTimer = 0;
function start(i) {
  if (i !== S.done || S.playing >= 0) return;
  S.playing = i; S.t = 0; S.phase = 0; S.said = {};
  clearTimeout(autoTimer);
  kick();
}
function tick(now) {
  const real = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const dt = real * (still.matches ? 6 : 1);
  if (S.playing >= 0) {
    const finished = RUN[S.playing](S.t);
    advanceGas(dt);
    S.t += dt;
    if (finished) {
      S.done = S.playing + 1; S.playing = -1;
      if ($("auto").checked && S.done < STEPS.length) autoTimer = setTimeout(() => start(S.done), 1400);
    }
  }
  M = model(S);
  draw(real);
  panel(); buttons(); words2();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
function kick() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) kick(); }, { rootMargin: "200px 0px" }).observe(document.querySelector(".lab"));

document.querySelectorAll(".step").forEach((b) => b.addEventListener("click", () => start(Number(b.dataset.step))));
$("auto").addEventListener("change", (e) => { if (e.target.checked && S.playing < 0 && S.done < STEPS.length) start(S.done); else clearTimeout(autoTimer); });
function reset(metal) {
  clearTimeout(autoTimer);
  words.innerHTML = ""; popG.innerHTML = "";
  S = fresh(metal);
  M = model(S);
  ladder(); kick();
  if ($("auto").checked) autoTimer = setTimeout(() => start(0), 900);
}
$("restart").addEventListener("click", (e) => { e.preventDefault(); reset(S.metal); });
document.querySelectorAll(".segb").forEach((b) => b.addEventListener("click", () => reset(b.dataset.metal)));
document.querySelectorAll(".segb").forEach((b, i, all) => b.addEventListener("keydown", (e) => {
  const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
  if (!d) return; e.preventDefault(); const n = all[(i + d + all.length) % all.length]; n.focus(); n.click();
}));

// guesses stay on this device
for (let i = 1; i <= 4; i++) {
  const t = $("guess" + i), key = "hydrogen-guess-" + i;
  try { t.value = localStorage.getItem(key) || ""; } catch (e) {}
  t.addEventListener("input", () => { try { localStorage.setItem(key, t.value); } catch (e) {} });
}
ladder();
kick();
