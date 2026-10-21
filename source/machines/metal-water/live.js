// ---------- The Metal–Water Race: steps and drawing (core-head.js comes before, core-tail.js after) ----------
function fresh(choice) {
  const [metal, water] = choice.split("|");
  return {
    metal, water, V: 0, ready: 0, popped: false, run: false,
    lumpVis: 0, lumpPos: DATA.LUMP0, stripIn: 0, jLift: 0, jAlpha: 1,
    heatA: false, heatB: false, burnA: 0, burnB: 0, burnBx: 0,
    tip: null, flame: 0, popAt: -1, dip: null, lit: 0, litVis: 0,
    bclock: 0, iclock: 0, mclock: 0,
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
const isSteam = () => S.water === "steam";
const stn = () => (isSteam() ? "B" : "A");
const MOUTH = () => (isSteam() ? [DATA.TR[0], DATA.TR[1], DATA.BEE_TOP + DATA.JAR_LIFT] : [DATA.BK[0], DATA.BK[1], DATA.JA_Z + DATA.JAR_LIFT]);
const TIP0 = DATA.SPLINT_TIP;
const racing = () => M.reacts;

const RUN = [
  // 1. cut a tiny piece and put it on the tile
  (t) => { S.lumpVis = span(t, 0.3, 1.1); sayOnce("w", "snip", "tile", 0.4); return t >= 2.2; },
  // 2. get the water ready: cool, warm, or steam
  (t) => {
    if (S.water === "hot") S.heatA = true;
    if (isSteam()) { S.heatB = true; S.burnBx = 0; }
    S.ready = S.water === "cold" ? span(t, 0, 1.4) : span(t, 0.6, 4.6);
    sayOnce("w", S.water === "cold" ? "swish" : S.water === "hot" ? "fwoomp" : "fwoomp", isSteam() ? "burner" : "beaker", 0.4);
    if (S.water !== "cold" && t > 2.5) sayOnce("s", isSteam() ? "steam!" : "warm…", isSteam() ? "tube" : "beaker", t, "small");
    return t >= (S.water === "cold" ? 2.2 : 5);
  },
  // 3. start it off: metal into the water (or the flame slides under the metal)
  (t) => {
    if (isSteam()) {
      S.burnBx = span(t, 0.2, 1.6);
      S.lumpVis = 1 - span(t, 0.5, 1.4); S.stripIn = span(t, 0.9, 1.8);
      if (t >= 1.7) S.run = true;
      sayOnce("w", "plop", "burner", 1.0);
      if (M.reacts) sayOnce("f", M.metal === "Mg" ? "bright flash!" : "fizz", "tube", 2.0, M.metal === "Mg" ? "small" : "");
      else sayOnce("n", "…nothing", "tube", 2.0, "quiet");
      return t >= 3;
    }
    S.jLift = span(t, 0, 0.8) * (1 - span(t, 2.3, 3.1)) * 22;
    const keys = [[0, DATA.LUMP0], [0.6, ADD(DATA.LUMP0, [0, 0, 44])], [1.3, [DATA.BK[0] + 8, DATA.BK[1] + 14, DATA.BK_Z + 100]], [2.0, DATA.LUMP_IN]];
    S.lumpPos = along(keys, t);
    sayOnce("w", "plop", "beaker", 1.9);
    if (t >= 2.7) S.run = true;
    if (t >= 2.9) { if (M.reacts) sayOnce("f", S.metal === "Na" ? "zzzip!" : "fizz", "jarA", 2.9); else sayOnce("n", "…nothing", "jarA", 2.9, "quiet"); }
    return t >= 3.4;
  },
  // 4. watch the race
  (t) => {
    if (!M.reacts) { sayOnce("w", "still nothing", isSteam() ? "tube" : "jarA", 0.5, "quiet"); return t >= 3.2; }
    return S.V >= Math.min(60, M.possible - 0.5) || t > 60;
  },
  // 5. collect the gas
  (t) => {
    if (!M.reacts) { sayOnce("w", "no gas to catch", isSteam() ? "jarB" : "jarA", 0.4, "quiet"); return t >= 2.6; }
    sayOnce("w", "bubble-bubble", isSteam() ? "jarB" : "jarA", 0.3);
    const full = S.V >= Math.min(112, M.possible) - 0.5 || t > 60;
    if (full) S.run = false;   // the jar is full: pause the reaction so the numbers match the jar
    return full;
  },
  // 6. the splint test
  (t) => {
    S.heatA = false; S.heatB = false;
    S.jLift = span(t, 0, 1.3) * DATA.JAR_LIFT;
    const m = MOUTH(), test = [m[0] - 2, m[1], m[2] - 6];
    S.tip = along([[0.8, TIP0], [1.4, ADD(TIP0, [0, 0, 70])], [2.8, ADD(test, [14, 14, 24])], [3.4, test], [4.4, test], [5.0, ADD(test, [0, 0, 26])], [6.0, TIP0]], t);
    S.flame = span(t, 0.9, 1.2) * (1 - span(t, 5.4, 6.0));
    if (t >= 3.4 && !S.said.pop) {
      S.said.pop = true;
      if (M.reacts) { S.popAt = performance.now(); S.run = false; S.popped = true; popSound(); say("POP!", "pop" + (isSteam() ? "" : "A"), "big"); }
      else say("no pop…", "pop" + (isSteam() ? "" : "A"), "quiet");
    }
    S.jAlpha = 1 - span(t, 4.6, 5.4) * (M.reacts ? 1 : 0);
    if (t >= 6.2) S.tip = null;
    return t >= 6.3;
  },
  // 7. litmus paper in the water
  (t) => {
    S.run = false;
    S.jLift = 0; S.jAlpha = 1;
    const dip = isSteam() ? DATA.DIP_B : DATA.DIP_A;
    S.litVis = 1;
    S.dip = along([[0, DATA.STRIP0], [0.8, ADD(DATA.STRIP0, [0, 0, 56])], [1.8, ADD(dip, [0, 0, 36])], [2.6, dip], [4.4, dip], [5.2, ADD(dip, [0, 0, 36])]], t);
    S.lit = span(t, 3.0, 4.2) * (M.alkaline ? 1 : 0);
    sayOnce("w", "dip", isSteam() ? "trough" : "beaker", 2.2);
    if (t >= 5 && !S.said.fin) S.said.fin = true;
    return t >= 5.6;
  },
];

function update(dt) {
  const calm = still.matches, k1 = (tau) => (calm ? 1 : 1 - Math.exp(-dt / tau));
  if (S.run) S.V += M.flow * dt;
  S.burnA += ((S.heatA ? 1 : 0) - S.burnA) * k1(0.2);
  S.burnB += ((S.heatB ? 1 : 0) - S.burnB) * k1(0.2);
  if (!S.heatA && !S.heatB && S.ready > 0 && S.done >= 6) S.ready = Math.max(S.ready, 0);
  if (M.flow > 0 && !calm) S.iclock += dt * M.rate / 10;
  if (M.flow > 0) S.bclock += dt * M.rate * 0.12;
}
function onReset() { $("popFlash").innerHTML = ""; }

// ---------- static references ----------
const jar = { A: $("jarA"), B: $("jarB") }, jw = { A: document.querySelectorAll("#jwA path"), B: document.querySelectorAll("#jwB path") }, jlab = { A: $("jlabA"), B: $("jlabB") };
const bubG = { A: $("bubA"), B: $("bubB") }, tickA = $("tickA");
const lump = $("lump"), stripB = $("stripB"), litRest = $("litmusRest"), litFly = $("litmusFly");
const bflameA = $("bflameA"), bflameB = $("bflameB"), burnBg = $("burnBg"), warmA = $("warmA"), milkA = $("milkA"), glowB = $("glowB"), wetWool = $("wetWool");
const splintG = $("splint"), flameG = $("flame"), popG = $("popFlash"), wispsA = $("wispsA"), steamDots = $("steamDots");
const COL = { A: { c: DATA.BK, z: DATA.JA_Z, bee: DATA.BK_Z + 4.8 }, B: { c: DATA.TR, z: DATA.BEE_TOP, bee: DATA.BEE_TOP } };
const nb = 10;
const bubbles = { A: [], B: [] };
for (const s of ["A", "B"]) for (let i = 0; i < nb; i++) bubbles[s].push({ off: i / nb + rnd() * 0.05, wob: rnd() * 6, node: el("circle", { class: "bub", r: 0 }, bubG[s]) });
const wisps = [0, 1, 2].map(() => el("path", { class: "waft", d: "" }, wispsA));
const sdots = Array.from({ length: 8 }, (_, i) => ({ off: i / 8, node: el("circle", { class: "steamdot", r: 0 }, steamDots) }));
const wavy = (x, y, h, ph) => { const pts = []; for (let i = 0; i <= 8; i++) { const v = i / 8; pts.push(`${f1(x + Math.sin(v * 6 + ph) * 3)} ${f1(y - v * h)}`); } return "M" + pts.join("L"); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, u) => "#" + hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], u)).toString(16).padStart(2, "0")).join("");
const pal = (c) => `--l:${c[0]};--m:${c[1]};--d:${c[2]}`;
const LIT_RED = ["#f3a0a0", "#e06464", "#b44646"], LIT_BLUE = ["#8cc3ef", "#4f97d6", "#336fa8"];
const burnShift = (x) => translateAlong(P, [x, DATA.TY, 0]);

function draw(dt) {
  const calm = still.matches, now = performance.now() / 1000, C = DATA.COLORS[S.metal], st = stn();
  // metal piece: on the tile, then in the jar (or the tube); it shrinks as it is used
  const lumpS = M.reacts && S.run || S.done >= 3 && M.reacts ? clamp(M.left / M.added, 0.12, 1) : 1;
  const [ox, oy] = at3(DATA.LUMP0), [px, py] = at3(S.lumpPos);
  write(lump, "transform", `translate(${f1(px - ox * lumpS)} ${f1(py - oy * lumpS)}) scale(${f1(lumpS * 100) / 100})`);
  write(lump, "opacity", op(isSteam() ? S.lumpVis : S.lumpVis));
  lump.querySelectorAll(".s").forEach((n) => write(n, "style", pal(C)));
  write(stripB, "opacity", op(S.stripIn));
  stripB.querySelectorAll(".s").forEach((n) => write(n, "style", pal(C)));
  // litmus paper: waits on the tile, then dips into the water and may change colour
  write(litRest, "opacity", S.litVis > 0 ? "0" : "1");
  write(litFly, "opacity", op(S.litVis));
  if (S.dip) write(litFly, "transform", translateAlong(P, SUB(S.dip, DATA.STRIP0)));
  litFly.querySelectorAll(".s").forEach((n) => write(n, "style", `--l:${mixHex(LIT_RED[0], LIT_BLUE[0], S.lit)};--m:${mixHex(LIT_RED[1], LIT_BLUE[1], S.lit)};--d:${mixHex(LIT_RED[2], LIT_BLUE[2], S.lit)}`));
  // burners
  write(bflameA, "opacity", op(S.burnA));
  if (S.burnA > 0.02) { const [fx, fy] = at3([DATA.BURN_A[0], DATA.BURN_A[1], DATA.BA_TIP]); const h = (21 + flick() * 1.5) * S.burnA; write(bflameA.children[0], "d", flameD(fx, fy, h, 6)); write(bflameA.children[1], "d", flameD(fx, fy, h * 0.5, 3)); }
  write(warmA, "opacity", op(S.burnA * 0.6));
  const bx = lerp(DATA.BURN_B0[0], DATA.BURN_B1[0], S.burnBx);
  write($("burnB"), "transform", burnShift(bx));
  write(bflameB, "opacity", op(S.burnB));
  if (S.burnB > 0.02) { const [fx, fy] = at3([0, 0, DATA.BA_TIP]); const h = (10 + flick(2)) * S.burnB; write(bflameB.children[0], "d", flameD(fx, fy, h, 5)); write(bflameB.children[1], "d", flameD(fx, fy, h * 0.5, 2.4)); }
  // warm water wisps over the beaker, steam in the tube
  wisps.forEach((p, i) => {
    const u = calm ? 0.5 : (now * 0.5 + i / 3) % 1, [x, y] = at3([DATA.BK[0] - 8 + i * 8, DATA.BK[1], DATA.BK_Z + DATA.WATER_A + 6 + u * 26]);
    const on = S.water === "hot" ? S.burnA * S.ready : 0;
    write(p, "d", on > 0.05 ? wavy(x, y, 16, i * 2 + now * 2) : ""); write(p, "opacity", op(on * (1 - u) * 0.9));
  });
  sdots.forEach((d, i) => {
    const u = calm ? i / 8 : (now * 0.35 + d.off) % 1, on = isSteam() ? S.ready * S.burnB + (S.run ? 0.4 : 0) : 0;
    const [x, y] = at3([lerp(DATA.TX0 + 16, DATA.TX1 - 8, u), DATA.TY + Math.sin(u * 9 + i) * 2, DATA.TUBE_Z + 1]);
    write(d.node, "cx", String(f1(x))); write(d.node, "cy", String(f1(y))); write(d.node, "r", String(f1(clamp(on, 0, 1) * (1.2 + (i % 3) * 0.5) * K)));
  });
  write(wetWool, "opacity", op(isSteam() ? 1 - 0.6 * S.ready : 0.0));
  // the hot metal glows when steam reacts with it
  const glowOn = isSteam() && M.reacts && S.run && M.flow > 0 ? 1 : isSteam() && S.burnB > 0.5 && S.burnBx > 0.9 ? 0.25 : 0;
  write(glowB, "style", S.metal === "Mg" ? "fill:#ffffff" : "fill:#ffb36b"); write(glowB, "opacity", op(glowOn * (S.metal === "Mg" ? 0.95 : 0.55) * (0.85 + 0.15 * (calm ? 1 : Math.sin(now * 30)))));
  write(milkA, "opacity", op(!isSteam() ? M.milky * 0.9 : 0));
  // the two jars: lift, fade, water pushed down by gas
  for (const s of ["A", "B"]) {
    const here = s === st, g = jar[s], c = COL[s];
    const lift = here ? S.jLift : 0, alpha = here ? S.jAlpha : 1;
    write(g, "transform", translateAlong(P, [0, 0, lift]));
    write(g, "opacity", op(alpha));
    const z0 = c.z + 3.4, z1 = c.z + DATA.JAR_H - 6, full = here ? M.jarFull : 0;
    const wTop = z1 - (z1 - z0) * full;
    const lifted = lift > 0.5 && s === st && S.done >= 5;
    if (wTop - z0 > 0.4 && !lifted && !(here && S.popped)) { const cy = cylinder(c.c[0], c.c[1], DATA.JAR_R - 1.3, z0, wTop - z0, P, 40); write(jw[s][0], "d", cy.fill); write(jw[s][1], "d", cy.top); } else { write(jw[s][0], "d", ""); write(jw[s][1], "d", ""); }
    const gasFrom = lifted ? z0 : Math.max(wTop, z0);
    const hasGas = here && !S.popped && (M.inJar > 0.5 || lifted);
    if (hasGas && z1 - gasFrom > 1.5) {
      write(jw[s][2], "d", cylinder(c.c[0], c.c[1], DATA.JAR_R - 1.3, gasFrom, z1 - gasFrom, P, 40).fill);
      const [lx, ly] = at3([c.c[0] + 5, c.c[1] - 8, Math.max(gasFrom + 3, z1 - 12)]);
      write(jlab[s], "x", String(f1(lx))); write(jlab[s], "y", String(f1(ly))); text(jlab[s], "H₂");
    } else { write(jw[s][2], "d", ""); text(jlab[s], ""); }
    // bubbles rise from the metal into the jar
    const n = here && M.flow > 0 && lift < 1 ? Math.round(clamp(M.rate * 1.4, 1, nb)) : 0;
    bubbles[s].forEach((b, i) => {
      if (i >= n) { write(b.node, "r", "0"); return; }
      const u = (S.bclock * 1.3 + b.off) % 1, zz = c.bee + 1 + u * Math.max(0, wTop - c.bee - 2);
      const [x, y] = at3([c.c[0] + Math.sin(u * 7 + b.wob) * 3, c.c[1], zz]);
      write(b.node, "cx", String(f1(x))); write(b.node, "cy", String(f1(y))); write(b.node, "r", String(f1((1 + u * 1.2) * K)));
    });
  }
  write(tickA, "transform", translateAlong(P, [0, 0, stn() === "A" ? S.jLift : 0]));
  write(tickA, "opacity", op(stn() === "A" ? S.jAlpha : 1));
  // splint
  write(splintG, "transform", S.tip ? translateAlong(P, SUB(S.tip, TIP0)) : "");
  write(flameG, "opacity", op(S.flame));
  if (S.flame > 0) { const [fx, fy] = at3(TIP0); const h = 10 + flick(); write(flameG.children[0], "d", flameD(fx - 1, fy, h, 6)); write(flameG.children[1], "d", flameD(fx - 1, fy, h * 0.55, 3)); }
  const age = S.popAt > 0 ? now - S.popAt / 1000 : -1;
  const flash = age < 0 ? 0 : calm ? (age < 1 ? 1 : 0) : clamp(age / 0.08, 0, 1) * Math.exp(-Math.max(0, age - 0.08) / 0.35);
  write(popG, "opacity", op(flash));
  if (flash > 0.01) {
    const m = MOUTH(), [mx, my] = at3(m), r = 10 + Math.min(1, Math.max(0, age) * 4) * 14;
    const pts = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, q = i % 2 ? r * 0.55 : r; return `${f1(mx + Math.cos(a) * q * 1.2)} ${f1(my + 4 + Math.sin(a) * q * 0.7)}`; });
    popG.innerHTML = `<path class="pop-o" d="M${pts.join("L")}Z"/><ellipse class="pop-i" cx="${f1(mx)}" cy="${f1(my + 4)}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.3)}"/>`;
  }
  molecules(dt);
}

// ---------- Papa's magnifier ----------
const aG = $("mAtoms"), mid = $("mMid"), fr = $("mFront"), cap = $("ionCap");
const AX = [34, 90, 146, 202];
const atoms = AX.map((x) => { const g = el("g", { class: "mol" }, aG); el("circle", { cx: x, cy: 210, r: 16, class: "a-m" }, g); el("text", { x, y: 213.4, class: "mol-t" }, g).textContent = "Na"; return g; });
const water = (parent) => { const g = el("g", { class: "mol" }, parent); [-8, 8].forEach((x) => { el("circle", { cx: x, cy: 6, r: 5.5, class: "a-h" }, g); el("text", { x, y: 8.6, class: "mol-t" }, g).textContent = "H"; }); el("circle", { cx: 0, cy: 0, r: 9, class: "a-o" }, g); el("text", { x: 0, y: 3.4, class: "mol-t" }, g).textContent = "O"; return g; };
const hatom = (parent) => { const g = el("g", { class: "mol" }, parent); el("circle", { r: 6, class: "a-h" }, g); el("text", { y: 2.6, class: "mol-t" }, g).textContent = "H"; return g; };
const idleW = [water(mid), water(mid), water(mid)];
const wA = water(fr), wB = water(fr), hA = hatom(fr), hB = hatom(fr);
const h2g = el("g", { class: "mol" }, fr); el("circle", { class: "h2-bubble", r: 18 }, h2g); [-5.5, 5.5].forEach((x) => el("circle", { cx: x, cy: 0, r: 6.5, class: "a-h" }, h2g)); el("text", { class: "h2-t", y: 3 }, h2g).textContent = "H₂";
const ohT = [0, 1].map(() => { const g = el("g", { class: "mol oh-tag" }, fr); el("circle", { r: 8 }, g); el("text", { y: 2.8, class: "mol-t" }, g).textContent = "OH"; return g; });
const put = (g, x, y, o = 1, rot = 0) => { write(g, "transform", `translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})`); write(g, "opacity", op(o)); };
function molecules(dt) {
  const T = (S.mclock += still.matches ? 0 : dt), sym = S.metal, C = DATA.COLORS[sym];
  atoms.forEach((g) => { text(g.querySelector("text"), sym); write(g.querySelector("circle"), "style", `fill:${C[1]}`); });
  text($("keyMetal"), sym);
  const wob = (i, a = 3) => Math.sin(T * 1.6 + i * 1.9) * a;
  idleW.forEach((g, i) => put(g, 40 + i * 80 + wob(i, 10), 100 + wob(i + 4, 8) + i * 10, S.ready > 0 || S.done >= 1 ? 1 : 0.6, wob(i + 2, 20)));
  const reacting = M.flow > 0 && S.run;
  const cycles = Math.floor(S.iclock), u = S.iclock % 1, p = cycles % 2, a = AX[p * 2], b = AX[p * 2 + 1];
  if (reacting) {
    const come = span(u, 0, 0.35);
    put(wA, lerp(a - 6, a, come), lerp(70, 180, come), 1 - span(u, 0.36, 0.44), 0);
    put(wB, lerp(b + 6, b, come), lerp(60, 180, come), 1 - span(u, 0.36, 0.44), 0);
    const split = span(u, 0.38, 0.62), join = span(u, 0.6, 0.7);
    put(hA, lerp(a, 112, split), lerp(176, 140, split), span(u, 0.36, 0.42) * (1 - join), 0);
    put(hB, lerp(b, 128, split), lerp(176, 140, split), span(u, 0.36, 0.42) * (1 - join), 0);
    put(ohT[0], a + 12, 186, span(u, 0.4, 0.5) * (1 - span(u, 0.82, 1)), 0);
    put(ohT[1], b + 12, 186, span(u, 0.4, 0.5) * (1 - span(u, 0.82, 1)), 0);
    const go = span(u, 0.68, 1);
    put(h2g, 120, lerp(140, -10, go), span(u, 0.62, 0.7) * (1 - span(u, 0.92, 1)), 0);
    text(cap, u < 0.36 ? "water meets metal atoms" : u < 0.6 ? "H leaves the water" : u < 0.7 ? "2 H join → H₂" : "H₂ bubble floats up");
  } else {
    [wA, wB].forEach((g, i) => put(g, 60 + i * 110 + wob(i + 7, 12), 150 + Math.abs(wob(i + 9, 18)), S.run || S.done >= 2 ? 1 : 0, wob(i + 5, 30)));
    [hA, hB, ohT[0], ohT[1], h2g].forEach((g) => put(g, 0, 0, 0));
    text(cap, S.done < 2 ? "metal atoms, water above" : S.run && !M.reacts ? "water stays whole" : S.popped || S.done >= 6 ? "all done: H₂ made" : "waiting to start");
  }
}

// ---------- numbers and words (all from the model) ----------
const g2 = (n, d = 0) => (n < 0.0005 ? "0" : n.toFixed(d));
function panel() {
  text($("gTemp"), S.water === "steam" ? `steam ≈ ${Math.round(M.tempC)} °C` : `≈ ${Math.round(M.tempC)} °C`);
  text($("gUsed"), `≈ ${g2(M.used, 2)} g`);
  text($("gMade"), `≈ ${g2(M.made)} mL`);
  text($("gJar"), M.inJar > 0.5 ? `≈ ${g2(M.inJar)} mL H₂` : "empty jar");
  text($("gRate"), M.reacts ? `≈ ${M.rate} /s` : "0 /s");
  text($("gLeft"), S.done >= 2 ? `≈ ${g2(M.left, 2)} g` : `≈ ${g2(M.added, 2)} g`);
  text($("readout"), `${M.name} in ${S.water === "steam" ? "steam" : S.water + " water"} · H₂ ≈ ${g2(M.made)} mL`);
  const shown = S.done + (S.playing >= 0 ? 1 : 0), e = M.eq;
  text($("eqA"), e ? e[0] : S.metal); text($("eqB"), e ? e[1] : (S.water === "steam" ? "+ steam" : "+ H₂O")); text($("eqC"), e ? e[2] : "→ no reaction");
  $("eqA").classList.toggle("on", shown >= 1); $("eqB").classList.toggle("on", shown >= 2); $("eqC").classList.toggle("on", shown >= 3);
  $("eqC").classList.toggle("no", !e);
}
function hintFor() {
  const i = S.playing >= 0 ? S.playing : S.done;
  if (S.done >= STEPS.length && S.playing < 0) return M.reacts ? `All done! We made ≈ ${Math.round(M.made)} mL of hydrogen.` : "Nothing happened. Try a livelier metal or hotter water!";
  if (S.playing < 0 && S.done === 0) return "Pick a metal and a water, then tap step 1.";
  if (i === 1) return S.water === "cold" ? "Cold water straight from the tap. Give it a swish." : S.water === "hot" ? "Light the burner and warm the water." : "Light the burner under the wet wool to make steam.";
  if (i === 2) return isSteam() ? "Slide the flame under the metal and see if anything happens." : "Lift the jar, drop the metal in, then put the jar back.";
  if (!M.reacts && i >= 3 && i <= 5) return "Look closely. Is anything happening?";
  return "";
}
function noteFor() {
  const i = S.playing >= 0 ? S.playing : S.done - 1;
  if (S.metal === "Na" && S.water !== "cold" && i >= 0) return "Papa’s note: sodium is already wild in cold water, and hotter water makes it wilder. Papa only does this one in <b>cold</b> water, from a safe distance. Treat this one as a drawing, not a recipe!";
  if (i >= 2 && !M.reacts) return S.metal === "Cu" ? "Papa’s note: copper sits <b>below</b> hydrogen on the ladder. It can’t pull hydrogen out of water, even in steam." : `Papa’s note: ${M.name} is not lively enough for ${S.water === "steam" ? "steam" : S.water + " water"}. Try hotter water, or a more reactive metal.`;
  if (S.metal === "Fe" && i >= 3 && M.reacts) return "Papa’s note: iron and steam make hydrogen, but the reaction can also run <b>backwards</b>. That’s what the ⇌ arrow in the equation means.";
  if (S.metal === "Mg" && S.water === "steam" && i >= 2) return "Papa’s note: magnesium burns with a dazzling white light in steam, and leaves a white powder, magnesium oxide, behind.";
  if (S.metal === "Ca" && i >= 3 && i <= 4) return "Papa’s note: calcium fizzes more gently than sodium, and the water turns milky white as it makes calcium hydroxide.";
  return "";
}
function onChoice() {
  document.querySelectorAll(".segm").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.metal === S.metal)));
  document.querySelectorAll(".segw").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.water === S.water)));
  document.querySelectorAll(".ladder li[data-el]").forEach((li) => li.classList.toggle("pick", li.dataset.el === S.metal));
  $("ladderNote").innerHTML = S.metal === "Cu" ? "<b>Cu</b> is below <b>H</b> on the ladder." : `<b>${S.metal}</b> is above <b>H</b> on the ladder.`;
}
document.querySelectorAll(".segm").forEach((b) => b.addEventListener("click", () => reset(`${b.dataset.metal}|${S.water}`)));
document.querySelectorAll(".segw").forEach((b) => b.addEventListener("click", () => reset(`${S.metal}|${b.dataset.water}`)));
