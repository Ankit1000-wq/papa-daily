// ---------- The Properties Lab: steps and drawing (core-head.js comes before, core-tail.js after) ----------
function fresh() {
  return {
    plate3: 0, waft: 0, strip: 0, sink: 0, wand: 0, airB: -1, h2B: -1, valve: 0,
    open: 0, close: 0, lift1: 0, wait: 0, opened: false, popped1: false, popped2: false,
    tip: null, flame: 0, popAt: -1, lift4: 0, cand: [0, 0, 0], candLit: 0, smoke: 0, ring: 0,
    jet: 0, burnt: 0, eq: 0, found: {},
  };
}
const ADD = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const SUB = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const MIX = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
// a path of [time, point] keys, eased between keys
function along(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return MIX(keys[i - 1][1], keys[i][1], ease((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
}
const JTOP = DATA.PLATE_Z + DATA.JAR_H;
const LIFT1 = 26, LIFT4 = 64;
const TIP0 = DATA.SPLINT_TIP;
const AT_J2 = [DATA.J2[0] + 2, DATA.J2[1] + 4, JTOP + 6];
const AT_J1 = [DATA.J1[0] + 2, DATA.J1[1] + 4, DATA.PLATE_Z + LIFT1 - 5];
const SPLINT_KEYS = [[0, TIP0], [0.5, ADD(TIP0, [0, 0, 70])], [1.2, ADD(AT_J2, [0, 0, 26])], [1.6, AT_J2], [2.2, AT_J2], [2.6, ADD(AT_J2, [0, 0, 20])], [3.3, ADD(AT_J1, [24, 10, 0])], [3.7, AT_J1], [4.5, AT_J1], [5.6, TIP0]];
const UNDER4 = [DATA.J4[0] - DATA.HOLD[0], DATA.J4[1] - DATA.HOLD[1], 4];
const CAND_KEYS = [[0, [0, 0, 0]], [0.5, [0, 0, 10]], [1.4, ADD(UNDER4, [0, 0, 6])], [1.6, UNDER4], [2.4, ADD(UNDER4, [0, 0, 30])]];
const CAND_BACK = [[0, ADD(UNDER4, [0, 0, 30])], [0.8, UNDER4], [1.0, ADD(UNDER4, [0, 0, 6])], [1.9, [0, 0, 10]], [2.4, [0, 0, 0]]];
const find = (key) => { S.found[key] = true; };

const RUN = [
  // 1. look and waft
  (t) => {
    S.plate3 = span(t, 0, 1) * (1 - span(t, 3.6, 4.4));
    S.waft = span(t, 1, 1.4) * (1 - span(t, 3.2, 3.8));
    sayOnce("w", "waft waft", "look", 1.2);
    if (t > 1.6) find("look");
    return t >= 4.6;
  },
  // 2. litmus strips dropped into the jar
  (t) => {
    S.plate3 = span(t, 0, 0.8) * (1 - span(t, 4.2, 5));
    S.strip = span(t, 0.6, 2.6);
    S.sink = span(t, 2.6, 3.6);
    sayOnce("w", "dip dip", "look", 3.0);
    if (t > 3.8) find("litmus");
    return t >= 5.2;
  },
  // 3. soap bubbles: air sinks, hydrogen floats up
  (t) => {
    S.wand = span(t, 0, 0.8) * (1 - span(t, 1.6, 2.4));
    S.airB = t < 0.8 ? -1 : t < 4.2 ? (t - 0.8) / 3.4 : -1;
    if (t >= 4.0 && !S.said.plip) { S.said.plip = true; say("plip", "soap", "small"); }
    S.valve = span(t, 4.2, 4.6) * (1 - span(t, 8.0, 8.4));
    S.h2B = t < 4.4 ? -1 : t < 8.6 ? (t - 4.4) / 4.2 : -1;
    sayOnce("w", "whee!", "soap", 6.0);
    if (t > 6.2) find("soap");
    return t >= 8.8;
  },
  // 4. two open jars for 30 s, then the splint
  (t) => {
    S.open = span(t, 0, 1); S.lift1 = span(t, 0, 1);
    S.opened = S.open > 0.5;
    S.wait = clamp((t - 1.2) / 3.6, 0, 1) * 30;
    const u = t - 5;
    S.flame = span(t, 4.8, 5.0) * (1 - span(u, 5.2, 5.6));
    if (S.flame > 0 && !S.said.lit) { S.said.lit = true; say("scritch", "jet", "small"); }
    S.tip = u > 0 ? along(SPLINT_KEYS, u) : null;
    if (u >= 1.7 && !S.popped2) { S.popped2 = true; say(M.upLoud > 0.2 ? "pop" : "…nothing", "quiet", "quiet"); }
    if (u >= 3.8 && !S.popped1) { S.popped1 = true; S.popAt = performance.now(); popSound(); say("POP!", "pop", "big"); }
    if (u > 4) find("jars");
    S.close = span(u, 5, 6);
    return u >= 6.2;
  },
  // 5. a burning candle pushed up into a jar of hydrogen
  (t) => {
    S.candLit = t < 0.3 ? span(t, 0, 0.3) : S.candLit;
    if (t >= 0.2 && !S.said.lit) { S.said.lit = true; say("scritch", "candle", "small"); }
    S.lift4 = span(t, 0.4, 1.4) * (1 - span(t, 7.6, 8.6));
    const goIn = t - 1.4, goOut = t - 5.4;
    S.cand = goOut < 0 ? along(CAND_KEYS, goIn) : along(CAND_BACK, goOut);
    S.ring = span(goIn, 1.8, 2.1) * (1 - span(t, 7.0, 7.8));
    if (goIn >= 1.9 && !S.said.whoosh) { S.said.whoosh = true; say("whoosh", "candle", "small"); }
    if (goOut < 0 && goIn > 2.2) S.candLit = 1 - span(goIn, 2.2, 2.9);
    S.smoke = goOut < 0 ? span(goIn, 2.6, 2.9) : 1 - span(goOut, 0, 0.6);
    sayOnce("w", "fsss…", "candle", 4.4);
    if (goOut >= 0.75 && !S.said.again) { S.said.again = true; S.candLit = 1; say("it lights again!", "candle", "small"); }
    if (t > 6.6) find("candle");
    if (t > 8.6) S.candLit = 1 - span(t, 8.6, 9);
    return t >= 9.2;
  },
  // 6. burn hydrogen at the jet under a cold dish
  (t) => {
    S.valve = span(t, 0, 0.4) * (1 - span(t, 7.4, 7.8));
    S.jet = span(t, 0.5, 0.8) * (1 - span(t, 7.4, 7.8));
    S.eq = t > 1 ? (t > 2 ? (t > 3 ? 3 : 2) : 1) : 0;
    sayOnce("p", "pop", "jet", 0.5, "small");
    sayOnce("w", "drip drip", "jet", 3.6);
    if (t > 4) find("jet");
    return t >= 8;
  },
];
function update(dt) { if (S.jet > 0.5) S.burnt += M.flow * dt; }
function onReset() { $("popFlash").innerHTML = ""; }

// ---------- static references ----------
const plate3 = $("j3Plate"), j1Jar = $("j1Jar"), j1Plate = $("j1Plate"), j2Plate = $("j2Plate"), j4Jar = $("j4Jar");
const stripsRest = $("stripsRest"), stripsFly = $("stripsFly"), stripsIn = $("stripsIn");
const wand = $("wand"), bubbles = $("bubbles"), wafts = $("wafts"), wisps = $("wisps");
const hand = $("watchHand"), splintG = $("splint"), flameG = $("flame");
const popG = $("popFlash"), spoonG = $("spoon"), smokeP = $("candleSmoke");
const candleF = $("candleFlame"), ringG = $("j4Ring").querySelector("path"), jetF = $("jetFlame"), dropsG = $("drops");
const airBub = el("g", { class: "sbub" }, bubbles), h2Bub = el("g", { class: "sbub h2b" }, bubbles);
[airBub, h2Bub].forEach((g, i) => { el("circle", { class: "sb-body", r: 0 }, g); el("path", { class: "sb-glint", d: "" }, g); el("text", { class: "sb-t", "text-anchor": "middle" }, g).textContent = i ? "H₂" : "air"; });
const waftEls = [0, 1, 2].map(() => el("path", { class: "waft", d: "" }, wafts));
const wispEls = [0, 1, 2].map(() => el("path", { class: "waft wisp", d: "" }, wisps));
const gasTag = (id, c) => { const t = el("text", { class: "jar-gas", "text-anchor": "middle" }, $(id)); t.textContent = "H₂"; const [x, y] = at3([c[0] + 4, c[1] - 6, 46]); t.setAttribute("x", f1(x)); t.setAttribute("y", f1(y)); return t; };
const tags = { j1: gasTag("j1Gas", DATA.J1), j2: gasTag("j2Gas", DATA.J2), j3: gasTag("j3Gas", DATA.J3), j4: gasTag("j4Gas", DATA.J4) };
const DROP_SPOTS = Array.from({ length: 9 }, (_, i) => { const a = i * 2.4, r = 3 + (i % 3) * 3.4; return [DATA.JET[0] + Math.cos(a) * r, DATA.JET[1] + Math.sin(a) * r, DATA.DISH2_Z + 0.4]; });
const dropEls = DROP_SPOTS.map(() => el("ellipse", { class: "drop", rx: 0, ry: 0 }, dropsG));

function wavy(x, y, h, ph) { const pts = []; for (let i = 0; i <= 8; i++) { const v = i / 8; pts.push(`${f1(x + Math.sin(v * 6 + ph) * 3.2)} ${f1(y - v * h)}`); } return "M" + pts.join("L"); }
function soap(g, p, r, o) {
  const [x, y] = at3(p);
  write(g.children[0], "cx", String(f1(x))); write(g.children[0], "cy", String(f1(y))); write(g.children[0], "r", String(f1(r * K)));
  write(g.children[1], "d", r > 1 ? `M${f1(x - r * K * 0.6)} ${f1(y - r * K * 0.15)}A${f1(r * K * 0.62)} ${f1(r * K * 0.62)} 0 0 1 ${f1(x - r * K * 0.15)} ${f1(y - r * K * 0.6)}` : "");
  write(g.children[2], "x", String(f1(x))); write(g.children[2], "y", String(f1(y + 3)));
  write(g, "opacity", op(o));
}

function draw(dt) {
  const calm = still.matches, now = performance.now() / 1000;
  // jar 3: the lid slides, wafts rise, litmus strips fly in
  write(plate3, "transform", translateAlong(P, [S.plate3 * 22, 0, 0]));
  waftEls.forEach((p, i) => {
    const u = calm ? 0.5 : (now * 0.6 + i / 3) % 1;
    const [x, y] = at3([DATA.J3[0] - 8 + i * 8, DATA.J3[1], JTOP + 4 + u * 26]);
    write(p, "d", S.waft > 0 ? wavy(x, y, 16, i + now * 2) : ""); write(p, "opacity", op(S.waft * (1 - u)));
  });
  const flyTo = [DATA.J3[0] - DATA.STRIP_C[0], DATA.J3[1] - DATA.STRIP_C[1], JTOP + 6 - DATA.STRIP_C[2]];
  write(stripsRest, "opacity", S.strip > 0 ? "0" : "1");
  const fly = S.strip > 0 && S.sink === 0;
  const off = MIX([0, 0, 2.2], ADD(flyTo, [0, 0, 2.2]), S.strip); off[2] += Math.sin(S.strip * Math.PI) * 50;
  write(stripsFly, "opacity", fly ? "1" : "0"); if (fly) write(stripsFly, "transform", translateAlong(P, off));
  write(stripsIn, "opacity", S.sink > 0 ? "1" : "0");
  if (S.sink > 0) write(stripsIn, "transform", translateAlong(P, ADD(flyTo, [0, 0, 2.2 - S.sink * (JTOP - 6)])));
  // soap bubbles
  write(wand, "transform", translateAlong(P, [0, 0, S.wand * 50]));
  if (S.airB >= 0) {
    const u = S.airB, ring = [DATA.DISH[0] + 2, DATA.DISH[1] - 2, 56];
    const r = 7 * span(u, 0, 0.22);
    const p = ADD(ring, [span(u, 0.22, 1) * 18, span(u, 0.22, 1) * 6, -span(u, 0.25, 1) * 41 + r]);
    soap(airBub, p, r, 1 - span(u, 0.96, 1));
  } else write(airBub, "opacity", "0");
  if (S.h2B >= 0) {
    const u = S.h2B, r = 9 * span(u, 0, 0.28);
    const p = [DATA.FUN[0] + Math.sin(u * 8) * 2 * span(u, 0.3, 1), DATA.FUN[1], DATA.FUN_TOP + r + span(u, 0.3, 1) * 190];
    soap(h2Bub, p, r, 1 - span(u, 0.85, 1));
  } else write(h2Bub, "opacity", "0");
  // jars 1 and 2 opened, the watch hand, hydrogen floating out of the mouth-up jar
  write(j1Jar, "transform", translateAlong(P, [0, 0, S.lift1 * (1 - S.close) * LIFT1]));
  write(j1Plate, "transform", translateAlong(P, [0, S.open * (1 - S.close) * 30, 0]));
  write(j1Plate, "opacity", op(1 - 0.85 * S.open * (1 - S.close)));
  write(j2Plate, "transform", translateAlong(P, [S.open * (1 - S.close) * 30, 0, 0]));
  write(j2Plate, "opacity", op(1 - S.open * (1 - S.close)));
  const a = (M.waited / 60) * Math.PI * 2, [cx, cy] = at3([DATA.WATCH[0], DATA.WATCH[1], 4.1]), [hx, hy] = at3([DATA.WATCH[0] + Math.sin(a) * 8.4, DATA.WATCH[1] - Math.cos(a) * 8.4, 4.1]);
  write(hand, "d", `M${f1(cx)} ${f1(cy)}L${f1(hx)} ${f1(hy)}`);
  const leaving = S.opened && !S.popped2 ? clamp(M.upLoud * 1.4, 0, 1) * (M.waited < 29.5 ? 1 : 0.3) : 0;
  wispEls.forEach((p, i) => {
    const u = calm ? 0.5 : (now * 0.8 + i / 3) % 1;
    const [x, y] = at3([DATA.J2[0] - 8 + i * 8, DATA.J2[1], JTOP + 2 + u * 34]);
    write(p, "d", leaving > 0.02 ? wavy(x, y, 18, i * 2 + now * 3) : ""); write(p, "opacity", op(leaving * (1 - u)));
  });
  write(tags.j1, "opacity", op(M.downLoud * 0.9)); write(tags.j2, "opacity", op(M.upLoud * 0.9));
  write(tags.j3, "opacity", "0.9"); write(tags.j4, "opacity", op(0.9 * (1 - S.ring)));
  // the splint
  const tip = S.tip || TIP0;
  write(splintG, "transform", S.tip ? translateAlong(P, SUB(tip, TIP0)) : "");
  write(flameG, "opacity", op(S.flame));
  if (S.flame > 0) { const [fx, fy] = at3(TIP0); const h = 10 + flick(); write(flameG.children[0], "d", flameD(fx - 1, fy, h, 6)); write(flameG.children[1], "d", flameD(fx - 1, fy, h * 0.55, 3)); }
  // pop: a pale blue flash at the mouth of jar 1
  const age = S.popAt > 0 ? now - S.popAt / 1000 : -1;
  const flash = age < 0 ? 0 : calm ? (age < 1 ? 1 : 0) : clamp(age / 0.08, 0, 1) * Math.exp(-Math.max(0, age - 0.08) / 0.35);
  write(popG, "opacity", op(flash));
  if (flash > 0.01) {
    const [mx, my] = at3([DATA.J1[0], DATA.J1[1], DATA.PLATE_Z + LIFT1]);
    const r = 10 + Math.min(1, Math.max(0, age) * 4) * 14;
    const pts = Array.from({ length: 16 }, (_, i) => { const b = (i / 16) * Math.PI * 2; const q = i % 2 ? r * 0.55 : r; return `${f1(mx + Math.cos(b) * q * 1.2)} ${f1(my + 4 + Math.sin(b) * q * 0.7)}`; });
    popG.innerHTML = `<path class="pop-o" d="M${pts.join("L")}Z"/><ellipse class="pop-i" cx="${f1(mx)}" cy="${f1(my + 4)}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.3)}"/>`;
  }
  // jar 4 and the candle
  write(j4Jar, "transform", translateAlong(P, [0, 0, S.lift4 * LIFT4]));
  write(spoonG, "transform", translateAlong(P, S.cand));
  const top = [DATA.HOLD[0], DATA.HOLD[1], DATA.CANDLE_TOP + 2];   // the spoon group carries it along
  const [tx, ty] = at3(top);
  write(candleF, "opacity", op(S.candLit));
  if (S.candLit > 0) { const h = (9 + flick(2)) * (0.4 + 0.6 * S.candLit); write(candleF.children[0], "d", flameD(tx, ty, h, 4.5)); write(candleF.children[1], "d", flameD(tx, ty, h * 0.5, 2.2)); }
  write(smokeP, "opacity", op(S.smoke * 0.8));
  if (S.smoke > 0) write(smokeP, "d", wavy(tx, ty - 2, 22, now * 3));
  write(ringG.parentNode, "opacity", op(S.ring));
  if (S.ring > 0) {
    const mz = DATA.PLATE_Z + S.lift4 * LIFT4, pts = [];
    for (let i = 0; i <= 32; i++) { const b = (i / 32) * Math.PI * 2, q = DATA.JAR_R + 1.6; const [x, y] = at3([DATA.J4[0] + Math.cos(b) * q, DATA.J4[1] + Math.sin(b) * q, mz]); const h = i % 2 ? 0 : (5 + flick(i)) * K * 0.5; pts.push(`${f1(x)} ${f1(y + h)}`); }
    write(ringG, "d", "M" + pts.join("L") + "Z");
  }
  // the jet and the cold dish
  write(jetF, "opacity", op(S.jet));
  if (S.jet > 0) { const [jx, jy] = at3([DATA.JET[0], DATA.JET[1], DATA.JET_TIP]); const h = 16 + flick(5) * 1.5; write(jetF.children[0], "d", flameD(jx, jy, h, 5)); write(jetF.children[1], "d", flameD(jx, jy, h * 0.45, 2.2)); }
  const wet = clamp(M.water / 0.08, 0, 1);
  dropEls.forEach((d, i) => {
    const s = clamp(wet * 9 - i, 0, 1), [x, y] = at3(DROP_SPOTS[i]);
    write(d, "cx", String(f1(x))); write(d, "cy", String(f1(y + s * 1.6))); write(d, "rx", String(f1(s * 1.6))); write(d, "ry", String(f1(s * 2.1)));
  });
  molecules(dt);
}

// ---------- Papa's magnifier: molecules ----------
const back = $("molBack"), mid = $("molMid"), front = $("molFront"), cap = $("ionCap");
function mol(kind, parent) {
  const g = el("g", { class: "mol " + kind }, parent);
  const atom = (cx, cy, r, cls, label) => { el("circle", { cx, cy, r, class: cls }, g); const t = el("text", { x: cx, y: cy + (r > 7 ? 3.4 : 2.6), class: "mol-t" }, g); t.textContent = label; };
  if (kind === "hh") { atom(-5, 0, 6.5, "a-h", "H"); atom(5, 0, 6.5, "a-h", "H"); }
  if (kind === "oo") { atom(-7, 0, 9, "a-o", "O"); atom(7, 0, 9, "a-o", "O"); }
  if (kind === "nn") { atom(-7, 0, 9, "a-n", "N"); atom(7, 0, 9, "a-n", "N"); }
  if (kind === "w") { atom(-8, 6, 5.5, "a-h", "H"); atom(8, 6, 5.5, "a-h", "H"); atom(0, 0, 9, "a-o", "O"); }
  return g;
}
const HH = Array.from({ length: 8 }, () => mol("hh", mid));
const OO = Array.from({ length: 3 }, () => mol("oo", mid));
const NN = Array.from({ length: 5 }, () => mol("nn", mid));
const WW = Array.from({ length: 2 }, () => mol("w", front));
const divider = el("path", { class: "divider", d: "M120 52L120 236" }, back);
const sideL = el("text", { class: "side-t", x: 62, y: 72, "text-anchor": "middle" }, back), sideR = el("text", { class: "side-t", x: 178, y: 72, "text-anchor": "middle" }, back);
const tinyFlame = el("g", { class: "tiny" }, back); el("path", { class: "flame-o", d: "" }, tinyFlame); el("path", { class: "flame-i", d: "" }, tinyFlame);
el("rect", { class: "tiny-candle", x: 112, y: 196, width: 16, height: 40, rx: 2 }, tinyFlame);
const flash = el("circle", { class: "burn-flash", cx: 120, cy: 130, r: 0 }, back);
const put = (g, x, y, o = 1, rot = 0) => { write(g, "transform", `translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})`); write(g, "opacity", op(o)); };
let mclock = 0;
function modeOf() {
  const i = S.playing >= 0 ? S.playing : S.done - 1;
  return ["jar", "jar", "compare", "compare", "candle", "burn"][i] || "jar";
}
function molecules(dt) {
  if (!still.matches) mclock += dt;
  const T = mclock, mode = modeOf();
  const bob = (i, w, ax, ay, cx, cy) => [cx + Math.sin(T * w + i * 2.1) * ax + Math.sin(T * w * 0.37 + i) * ax * 0.4, cy + Math.cos(T * w * 0.83 + i * 1.3) * ay];
  [divider, sideL, sideR].forEach((n) => write(n, "opacity", mode === "compare" ? "1" : "0"));
  text(sideL, "hydrogen"); text(sideR, "air");
  write(tinyFlame, "opacity", mode === "candle" ? "1" : "0");
  write(flash, "r", "0");
  WW.forEach((g) => put(g, 0, 0, 0));
  if (mode === "jar" || mode === "candle") {
    HH.forEach((g, i) => { const [x, y] = bob(i, 2.4, 70, 60, 120, 132); put(g, x, y, 1, T * 90 + i * 40); });
    OO.forEach((g) => put(g, 0, 0, 0)); NN.forEach((g) => put(g, 0, 0, 0));
    if (mode === "candle") {
      const out = S.candLit; const h = 26 * (0.2 + 0.8 * out) + flick(3) * 2;
      write(tinyFlame.children[0], "d", flameD(120, 196, h, 9)); write(tinyFlame.children[1], "d", flameD(120, 196, h * 0.5, 4));
      write(tinyFlame.children[0], "opacity", op(0.2 + out)); write(tinyFlame.children[1], "opacity", op(0.2 + out));
      text(cap, out > 0.5 ? "a candle needs oxygen…" : "no oxygen, so it goes out");
    } else text(cap, S.done === 0 && S.playing < 0 ? "hydrogen: tiny and fast" : S.found.litmus || S.playing === 1 ? "H₂ leaves litmus alone" : "too tiny to see: colourless");
    return;
  }
  if (mode === "compare") {
    HH.slice(0, 5).forEach((g, i) => { const [x, y] = bob(i, 2.8, 34, 60, 62, 150); put(g, x, y, 1, T * 120 + i * 50); });
    HH.slice(5).forEach((g) => put(g, 0, 0, 0));
    NN.forEach((g, i) => { const [x, y] = bob(i + 3, 0.9, 26, 56, 178, 150); put(g, x, y, 1, T * 25 + i * 60); });
    OO.slice(0, 2).forEach((g, i) => { const [x, y] = bob(i + 9, 0.8, 26, 50, 178, 150); put(g, x, y, 1, T * 20 + i * 80); });
    OO.slice(2).forEach((g) => put(g, 0, 0, 0));
    text(cap, `air ≈ ${Math.round(M.ratio)}× heavier`);
    return;
  }
  // burn: 2 H₂ + O₂ meet, then 2 H₂O drift off
  const u = (T * 0.35) % 1, come = span(u, 0, 0.45), go = span(u, 0.55, 1);
  NN.forEach((g, i) => { const [x, y] = bob(i, 0.9, 80, 30, 120, 210); put(g, x, y, 0.35, T * 25 + i * 60); });
  HH.slice(2).forEach((g) => put(g, 0, 0, 0));
  OO.slice(1).forEach((g) => put(g, 0, 0, 0));
  const on = S.jet > 0.3;
  put(HH[0], lerp(40, 104, come), lerp(90, 126, come), on ? 1 - span(u, 0.47, 0.52) : 1, 0);
  put(HH[1], lerp(200, 136, come), lerp(96, 126, come), on ? 1 - span(u, 0.47, 0.52) : 1, 0);
  put(OO[0], 120, lerp(196, 146, come), on ? 1 - span(u, 0.47, 0.52) : 1, 90);
  if (!on) { put(HH[0], 50, 100); put(HH[1], 190, 100); put(OO[0], 120, 180, 1, 90); text(cap, "waiting for a flame"); return; }
  write(flash, "r", String(f1(30 * span(u, 0.42, 0.5) * (1 - span(u, 0.5, 0.62)))));
  const wo = span(u, 0.5, 0.56) * (1 - span(u, 0.94, 1));
  put(WW[0], lerp(110, 50, go), lerp(132, 70, go), wo, -12);
  put(WW[1], lerp(130, 190, go), lerp(132, 76, go), wo, 12);
  text(cap, u < 0.45 ? "2H₂ + O₂ come together…" : "…and make 2H₂O: water!");
}

// ---------- numbers and words (all from the model) ----------
const g2 = (n, d = 0) => (n < 0.0005 ? "0" : n.toFixed(d));
function panel() {
  text($("gRatio"), `≈ ${Math.round(M.ratio)}×`);
  text($("gJarH"), `≈ ${g2(M.jarH2, 3)} g`);
  text($("gJarA"), `≈ ${g2(M.jarAir, 3)} g`);
  text($("gUp"), S.popped2 ? "tested" : `≈ ${g2(M.upLeft)} mL H₂`);
  text($("gDown"), S.popped1 ? "popped!" : `≈ ${g2(M.downLeft)} mL H₂`);
  text($("gWater"), `≈ ${g2(M.water, 2)} g`);
  text($("readout"), M.burnt > 0 ? `H₂ burnt ≈ ${g2(M.burnt)} mL · O₂ used ≈ ${g2(M.o2)} mL` : S.opened ? `jars open ≈ ${g2(M.waited)} s` : "4 jars of H₂");
  document.querySelectorAll(".idk").forEach((n) => n.classList.toggle("on", !!S.found[n.dataset.step]));
  $("eqA").classList.toggle("on", S.eq >= 1); $("eqB").classList.toggle("on", S.eq >= 2); $("eqC").classList.toggle("on", S.eq >= 3);
}
