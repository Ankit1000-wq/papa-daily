// node build.mjs  ->  writes ../../../machines/metal-water/index.html (standalone, everything inline)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, drawKit } from "../shared/draw.mjs";
import { page } from "../shared/page.mjs";
import { MODEL_SRC } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../../machines/metal-water");
const W = 880;
const H = 560;

// ---------- world (units ≈ px, x/y on the bench, z up) ----------
const BENCH = { x: -240, y: -80, w: 456, d: 160, r: 6 };
// station A: a beaker of water on a tripod over a burner; the gas is caught in a jar upside down in the water
const BK = [-160, 10], BK_R = 36, BK_H = 68, BK_Z = 62, WATER_A = 48;
const JA_Z = BK_Z + 4.8;
// station B: steam passes over hot metal in a hard-glass tube; the gas goes to a jar over a beehive shelf
const TY = -30, TX0 = -72, TX1 = -2, TUBE_Z = 54, TUBE_R = 7;
const TR = [104, -16], TR_R = 46, TR_H = 40, WATER_B = 30, BEE_TOP = 15;
const BURN_A = BK, BURN_B0 = [-62, TY], BURN_B1 = [-30, TY];
const ROD_B = [-50, -74], ROD_C = [-12, -74];
const JAR_LIFT = 56;
const TILE = { x: -112, y: 46, w: 46, d: 24, r: 1.5 };
const LUMP0 = [-88, 58, 2.6];
const STRIP0 = [-108, 58, 2.6];
const SPLINT = { x: 12, y: 68, w: 46, d: 3.2, r: 1.2 };
const SPLINT_TIP = [12, 69.6, 2.2];
const MB = { x: 70, y: 62, w: 24, d: 14, r: 1 };
const KJ = [-222, 50];
const MAG = [-110, -70];

const P = k.fitProjection(
  [...k.boxCorners(BENCH, -30, 0), [BK[0], BK[1], BK_Z + 150], [TR[0], TR[1], BEE_TOP + 92 + JAR_LIFT + 6], [-70, -40, 218]],
  W, H, { pad: 18, azimuth: 60, elevation: 30 },
);
const D = drawKit(P);
const { at, f1, K, solid, line, dots, slab, cyl, up, alongX, turned, circ, shadow } = D;
const JAR_R = D.JAR_R, JAR_H = D.JAR_H;

// ---------- station A: tripod, gauze, burner ----------
const LEG_R = 28;
const legAt = (deg) => [BK[0] + Math.cos((deg * Math.PI) / 180) * LEG_R, BK[1] + Math.sin((deg * Math.PI) / 180) * LEG_R];
const leg = (deg) => solid(cyl(legAt(deg), 1.7, 0, BK_Z - 4, 12), "m-steel", { crease: false }) + solid(cyl(legAt(deg), 2.6, 0, 1.4, 12), "m-steel-d");
const tripodTop = () => [
  line(k.ring(BK[0], BK[1], LEG_R + 1.5, BK_Z - 4, P, 56), "ln ring"),
  solid(cyl(BK, LEG_R, BK_Z - 3, 1.6, 48, 0.3), "m-gauze"),
  line(k.lineOnTop([BK[0] - LEG_R + 2, BK[1]], [BK[0] + LEG_R - 2, BK[1]], BK_Z - 1.4, P), "ln faint"),
  line(k.lineOnTop([BK[0], BK[1] - LEG_R + 2], [BK[0], BK[1] + LEG_R - 2], BK_Z - 1.4, P), "ln faint"),
].join("");
const BURNER_A = D.burner(BURN_A, "bflameA", null);
const BURNER_B = D.burner([0, 0], "bflameB", null);
const BA_TIP = 34;

// ---------- collectors: a glass vessel of water with a jar standing upside down in it ----------
function vessel(id, c, z0, R, Hh, water) {
  const F = up(c, z0);
  const body = turned(c, z0, [[0, R], [Hh, R]]);
  return {
    back: `<path class="glass-back" d="${body.fill}"/><path class="glass-floor" d="${D.ringAt(c, R - 2, z0 + 3, 72)}"/>${line(G.arcOf(F, Hh, R - 2, P, { inward: true }), "ln glassline")}`,
    water: (() => { const p = turned(c, z0 + 3, [[0, R - 1.5], [water - 3, R - 1.5]]); return `<g class="water"><path class="w-body" d="${p.fill}"/><path class="w-top" d="${p.top}"/>${line(G.arcOf(up(c, z0), z0 * 0 + water, R - 1.5, P, { inward: false }), "ln waterline")}</g>`; })(),
    front: (() => {
      const out = [solid(body, "m-glass", { crease: false })];
      out.push(line(G.arcOf(F, 3, R, P), "ln glassline"), line(G.arcOf(F, Hh - 3, R, P), "ln glassline"));
      const s1 = [c[0] + Math.cos(2.9) * R, c[1] + Math.sin(2.9) * R];
      out.push(line(k.segment([s1[0], s1[1], z0 + 8], [s1[0], s1[1], z0 + Hh - 8], P), "shine"));
      return out.join("");
    })(),
  };
}
const VA = vessel("A", BK, BK_Z, BK_R, BK_H, WATER_A);
const VB = vessel("B", TR, 0, TR_R, TR_H, WATER_B);
const jarGroup = (id, c, z) => `<g id="jar${id}">${D.jarBack(c, z)}<g id="jw${id}"><path class="jw-body" d=""/><path class="jw-top" d=""/><path class="jg-body" d=""/></g><g id="bub${id}"></g><text id="jlab${id}" class="jar-gas" text-anchor="middle"></text>${D.jarFront(c, z)}</g>`;
// mL scale ticks on the front of each jar come from the same drawing as the jar
const jarTicks = (c, z) => {
  const F = up(c, z), face = G.angleToward(F, [0.5, 0.866, 0]) + 0.42, out = [];
  const top = JAR_H - 6, bottom = 6;
  for (let i = 0; i <= 8; i++) {
    const s = top - ((top - bottom) * i) / 8, long = i % 2 === 0;
    out.push(line(k.pathOf([at(G.pointOf(F, s, JAR_R, face)), at(G.pointOf(F, s, JAR_R, face + (long ? 0.32 : 0.18)))]), "ln tick"));
    if (long && i > 0) { const [x, y] = at(G.pointOf(F, s, JAR_R, face + 0.36)); out.push(`<text class="jar-num" x="${f1(x + 1)}" y="${f1(y + 2)}">${Math.round((112 * i) / 8)}</text>`); }
  }
  return out.join("");
};
function beehive() {
  const F = up(TR, 3);
  const p = G.solidOf([[0, 19], [3, 19], [5, 18, 1], [9, 15, 1], [12, 11]], F, P);
  const out = [solid(p, "m-terra"), line(G.arcOf(F, 3, 19, P), "ln faint")];
  const [hx, hy] = at([TR[0], TR[1], BEE_TOP]);
  out.push(`<ellipse class="hole" cx="${f1(hx)}" cy="${f1(hy)}" rx="${f1(4 * K)}" ry="${f1(2 * K)}"/>`);
  const slot = [];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; slot.push(at([TR[0] - 18.4 + (1 - Math.sin(a)) * 0.3, TR[1] + Math.cos(a) * 4.2, 3 + Math.sin(a) * 7])); }
  out.push(`<path class="hole" d="${k.pathOf(slot, true)}"/>`);
  return out.join("");
}

// ---------- station B: hard-glass tube, wet wool, metal strip, clamps, delivery tube ----------
const TF = alongX([TX0, TY, TUBE_Z]);
const TLEN = TX1 - TX0;
const tubeSolid = () => G.solidOf([[0, TUBE_R], [TLEN, TUBE_R]], TF, P);
const tubeBack = () => `<path class="glass-back" d="${tubeSolid().fill}"/>`;
function tubeFront() {
  const out = [solid(tubeSolid(), "m-glass", { crease: false })];
  out.push(line(k.segment([TX0 + 8, TY - 3, TUBE_Z + 5.5], [TX1 - 8, TY - 3, TUBE_Z + 5.5], P), "shine thin"));
  out.push(line(G.arcOf(TF, 4, TUBE_R, P), "ln glassline"), line(G.arcOf(TF, TLEN - 4, TUBE_R, P), "ln glassline"));
  return out.join("");
}
const BOT = TUBE_Z - TUBE_R + 0.6;
const wool = () => `<g id="wool">${solid(G.solidOf([[0, 5.6], [15, 5.6]], alongX([TX0 + 11, TY, BOT + 5]), P), "m-wool", { crease: false })}<path id="wetWool" class="wet-wool" d="${G.solidOf([[0, 5.6], [15, 5.6]], alongX([TX0 + 11, TY, BOT + 5]), P).fill}" opacity="0"/></g>`;
const stripB = () => `<g id="stripB" opacity="0">${solid(slab({ x: -42, y: TY - 2.6, w: 30, d: 5.2, r: 1 }, BOT, 1.3, 2, 0.3), "m-lump", { crease: false })}</g>`;
const ARM_Z = TUBE_Z + TUBE_R + 2.2;
const ring = (x) => solid(G.solidOf([[0, TUBE_R + 1.6], [6, TUBE_R + 1.6]], alongX([x - 3, TY, TUBE_Z]), P), "m-cork");
function stands() {
  const out = [];
  for (const rod of [ROD_B, ROD_C]) {
    out.push(D.clampStand(rod, 100));
    out.push(solid(slab({ x: rod[0] - 5, y: rod[1] - 5, w: 10, d: 10, r: 1.5 }, ARM_Z - 6, 14, 3, 0.5), "m-steel-d"));
    out.push(solid(cyl([rod[0], rod[1] + 7], 2.6, ARM_Z + 1, 4, 16), "m-brass"));
  }
  return out.join("");
}
const clamps = () => [ROD_B, ROD_C].map((rod) => ring(rod[0]) + solid(slab({ x: rod[0] - 2.2, y: rod[1] + 5, w: 4.4, d: TY + 3 - rod[1] - 5, r: 1 }, ARM_Z, 4, 2, 0.4), "m-steel") + solid(cyl([rod[0], TY], 2.4, ARM_Z + 4, 3, 12), "m-brass")).join("");
const endStopper = (x) => solid(G.solidOf([[0, TUBE_R + 0.6], [8, TUBE_R + 0.6]], alongX([x, TY, TUBE_Z]), P), "m-rubber");
const TUBE_ROUTE = G.fillet([[TX1 + 7, TY, TUBE_Z], [28, TY, TUBE_Z], [28, TR[1], 7.5], [TR[0] - 17, TR[1], 7.5]], 9, 8);
const TUBE_END = [TR[0] - 17, TR[1], 7.5];

// ---------- the glowing metal in the tube, steam, and flames ----------
const glowB = `<ellipse id="glowB" class="glow-b" cx="${f1(at([-27, TY, BOT + 3])[0])}" cy="${f1(at([-27, TY, BOT + 3])[1])}" rx="${f1(24 * K * 0.62)}" ry="${f1(7 * K * 0.62)}" opacity="0"/>`;

// ---------- things on the bench ----------
function tile() {
  const out = [solid(slab(TILE, 0, 2.2, 2, 0.4), "m-tile")];
  // a strip of red litmus paper waiting on the tile
  out.push(`<g id="litmusRest">${solid(slab({ x: STRIP0[0] - 8, y: STRIP0[1] - 1.8, w: 16, d: 3.6, r: 0.4 }, 2.2, 0.5, 1, 0), "m-litmus", { crease: false })}</g>`);
  return out.join("");
}
const blob = (c, r, seed) => {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 7 }, (_, j) => { const b = (j / 7) * Math.PI * 2 + rnd() * 0.4, q = r * (0.8 + rnd() * 0.4); return [c[0] + Math.cos(b) * q, c[1] + Math.sin(b) * q]; });
};
const lump = () => `<g id="lump" opacity="0">${solid(k.extrude(blob(LUMP0, 4.4, 9), LUMP0[2], 3.6, P), "m-lump", { crease: false })}</g>`;
const litmusFly = () => `<g id="litmusFly" opacity="0">${solid(slab({ x: STRIP0[0] - 8, y: STRIP0[1] - 1.8, w: 16, d: 3.6, r: 0.4 }, STRIP0[2] - 0.4, 0.8, 1, 0), "m-litmus", { crease: false })}</g>`;
function kerosene() {
  const out = [];
  const F = up(KJ, 0);
  out.push(solid(turned(KJ, 0, [[0, 13], [24, 13], [28, 10.5, 1], [30, 9]]), "m-kero", { crease: false }));
  out.push(solid(turned(KJ, 30, [[0, 9.6], [4, 9.6]], { rims: "all" }), "m-steel-d"));
  out.push(D.wrapLabel(F, 8, 20, 13, "kerosene", G.angleToward(F, [0.5, 0.866, 0]), 0.95, "label-t sm"));
  return out.join("");
}
function magnifier(lensC, lensR) {
  const out = [solid(cyl(MAG, 10, 0, 3, 32, 0.5), "m-steel-d"), solid(cyl(MAG, 2, 3, 26, 16), "m-steel", { crease: false }), solid(cyl(MAG, 3.2, 27, 4, 16), "m-brass")];
  const [hx, hy] = at([MAG[0], MAG[1], 31]);
  const ang = Math.atan2(lensC[1] - hy, lensC[0] - hx);
  const ex = lensC[0] - Math.cos(ang) * (lensR + 3), ey = lensC[1] - Math.sin(ang) * (lensR + 3);
  out.push(`<path class="handle-ink" d="M${f1(hx)} ${f1(hy)}L${f1(ex)} ${f1(ey)}"/><path class="handle" d="M${f1(hx)} ${f1(hy)}L${f1(ex)} ${f1(ey)}"/>`, `<circle class="dot screw" cx="${f1(hx)}" cy="${f1(hy)}" r="1.6"/>`);
  return out.join("");
}
const LENS_C = at([-60, -40, 214]);
const LENS_R = 36;

const ionScene = () => `<g id="ions"><rect class="ion-bg" x="0" y="0" width="240" height="240"/><rect id="ionLiquid" class="ion-liquid" x="0" y="64" width="240" height="176" opacity="0.55"/><g id="mAtoms"></g><g id="mMid"></g><g id="mFront"></g><text id="ionCap" class="ion-cap" x="120" y="42" text-anchor="middle"></text></g>`;

const shadows = () => `<g clip-path="url(#benchTop)">${[
  shadow(circ(BK, BK_R), 50), shadow(circ(legAt(0), 2.6), 50), shadow(circ(legAt(120), 2.6), 50), shadow(circ(legAt(240), 2.6), 50), shadow(circ(BURN_A, 11), 36),
  shadow(circ(TR, TR_R), 34), shadow(circ(KJ, 13), 30), shadow(k.ringOf(TILE, 2), 2),
  shadow(k.ringOf({ x: ROD_B[0] - 16, y: ROD_B[1] - 24, w: 30, d: 48, r: 3 }, 3), 6), shadow(circ(ROD_B, 3, 12), 110),
  shadow(k.ringOf({ x: ROD_C[0] - 16, y: ROD_C[1] - 24, w: 30, d: 48, r: 3 }, 3), 6), shadow(circ(ROD_C, 3, 12), 110),
  shadow(circ([-46, TY], 11), 36), shadow(circ(MAG, 10), 30), shadow(k.ringOf(SPLINT, 2), 2), shadow(k.ringOf(MB, 2), 7),
].join("")}</g>`;

const SVG = `<svg class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="Two stations for making hydrogen from water. On the left a beaker of water sits on a tripod over a burner, with a gas jar upside down in it. On the right, steam passes over hot metal in a hard-glass tube and the gas goes to a jar over a beehive shelf in a trough. A tile holds the metal piece and a strip of litmus paper, with a splint and matches nearby.">
<defs>
  <clipPath id="benchTop"><path d="${k.slabOf(BENCH, 0, 0.01, P, 6).fill}"/></clipPath>
  <clipPath id="lensClip"><circle cx="${f1(LENS_C[0])}" cy="${f1(LENS_C[1])}" r="${LENS_R}"/></clipPath>
</defs>
<g id="scene">
${D.bench(BENCH, "H₂ FROM WATER · CLASS 8")}
${shadows()}
${magnifier(LENS_C, LENS_R)}
${kerosene()}
${stands()}
${leg(240)}
${BURNER_A.body}
${tripodTop()}
${leg(0)}${leg(120)}
<g id="warmA" opacity="0"><ellipse class="hot-glow" cx="${f1(at([BK[0], BK[1], BK_Z - 2])[0])}" cy="${f1(at([BK[0], BK[1], BK_Z - 2])[1])}" rx="${f1(30 * K * 0.6)}" ry="${f1(8 * K * 0.6)}"/></g>
${VA.back}
<g id="plateA">${D.glassPlate(BK, BK_Z + 3, 22)}</g>
<g id="tubeB">${tubeBack()}${wool()}${stripB()}${glowB}<g id="steamDots"></g>${tubeFront()}</g>
<g id="burnB"><g id="burnBg">${BURNER_B.body.replace(/<g id="bflameB"[^]*?<\/g>/, "")}<g id="bflameB" opacity="0"><path class="bflame-o" d=""/><path class="bflame-i" d=""/></g></g></g>
${clamps()}
${endStopper(TX0 + 4)}${endStopper(TX1 - 4)}
${VB.back}
${D.tube(TUBE_ROUTE, 2.4)}
${D.tubeCap(TUBE_END, 2.4, false)}
${beehive()}
${jarGroup("B", TR, BEE_TOP)}
${VB.water}
${VB.front}
<g id="milkA" opacity="0"><ellipse class="milk" cx="${f1(at([BK[0], BK[1], BK_Z + 16])[0])}" cy="${f1(at([BK[0], BK[1], BK_Z + 16])[1])}" rx="${f1(33 * K * 0.62)}" ry="${f1(15 * K * 0.62)}"/><ellipse class="milk" cx="${f1(at([BK[0] + 6, BK[1] - 4, BK_Z + 34])[0])}" cy="${f1(at([BK[0] + 6, BK[1] - 4, BK_Z + 34])[1])}" rx="${f1(24 * K * 0.62)}" ry="${f1(10 * K * 0.62)}"/></g>
${jarGroup("A", BK, JA_Z)}
${VA.water}
${VA.front}
<g id="wispsA"></g>
<g id="tickA">${jarTicks(BK, JA_Z)}</g>
${tile()}
${lump()}${litmusFly()}
<g id="splint">${D.splint(SPLINT)}<g id="flame" opacity="0"><path class="flame-o" d=""/><path class="flame-i" d=""/></g></g>
${D.matchbox(MB)}
<g id="air"><g id="bubbles"></g></g>
${D.lens(LENS_C, LENS_R)}
<g id="popFlash" opacity="0"></g>
<g id="words"></g>
</g>
</svg>`;

const COLORS = {
  Na: ["#f4f5f8", "#d9dce4", "#b4b9c5"], Ca: ["#d9d6d2", "#b4b0aa", "#8c8882"], Mg: ["#fbfcfd", "#e3e7ec", "#bcc3cc"],
  Zn: ["#cbd3dc", "#9ca7b4", "#76818f"], Fe: ["#8c8f95", "#5f6269", "#3f4146"], Cu: ["#f1a679", "#d4784a", "#a85a33"],
};
const BBOX = (p) => at(p);
const DATA = {
  slug: "metal-water", choice0: "Na|cold", COLORS,
  P, BK, BK_R, BK_Z, WATER_A, JA_Z, TR, TR_R, WATER_B, BEE_TOP, JAR_R, JAR_H, JAR_LIFT, TUBE_Z, TY, TX0, TX1, BOT, BURN_A, BURN_B0, BURN_B1, BA_TIP,
  LUMP0, STRIP0, SPLINT_TIP, LUMP_IN: [BK[0] + 1, BK[1] + 1, BK_Z + 4.8 + 2.6], STRIP_IN: [-27, TY, BOT + 0.6],
  DIP_A: [BK[0] + 26, BK[1] - 4, BK_Z + WATER_A - 6], DIP_B: [TR[0] + 30, TR[1] + 6, WATER_B - 6],
  SPOTS: {
    tile: at([-90, 58, 30]), beaker: at([BK[0] + 40, BK[1], BK_Z + 70]), tube: at([-34, TY, 96]), trough: at([TR[0] + 50, TR[1], 80]),
    jarA: at([BK[0] + 26, BK[1], BK_Z + 120]), jarB: at([TR[0], TR[1], BEE_TOP + JAR_H + 14]), burner: at([-46, TY + 12, 40]), pop: at([TR[0], TR[1], BEE_TOP + JAR_H + JAR_LIFT + 6]),
    popA: at([BK[0], BK[1], BK_Z + JA_Z * 0 + JAR_H + JAR_LIFT + 12]), lit: at([BK[0] + 40, BK[1], BK_Z + 40]),
  },
  doneHint: "All done! You’ve run a hydrogen race.",
  firstNote: "Papa’s note: acids aren’t the only thing metals can pull hydrogen from. Water has hydrogen in it too. Pick a metal and a kind of water, then press step 1.",
};

const STEPS = [
  { key: "cut", label: "Cut a piece", hint: "Cut a tiny piece of the metal and put it on the tile.", word: "snip",
    note: "Papa’s note: metals this lively are kept <b>away from air and water</b>. Sodium lives under kerosene, and we only ever cut a pea-sized piece." },
  { key: "ready", label: "Get the water ready", hint: "Get the water ready: cool, warm or steam.", word: "swish",
    note: "Papa’s note: cold water, hot water and steam are all <b>water</b>, but the hotter it is, the more energy it gives the metal to work with." },
  { key: "start", label: "Start it off", hint: "Put the metal in and see if anything happens.", word: "plop",
    note: "Papa’s note: a metal that is high on the reactivity ladder pulls hydrogen out of water more easily. One that is low down may not at all." },
  { key: "race", label: "Watch the race", hint: "Watch the bubbles. How fast is this one?", word: "fizz",
    note: "Papa’s note: the speed is the race. Watch the bubble speed number, and watch where this metal sits on the ladder." },
  { key: "collect", label: "Collect the gas", hint: "Hydrogen pushes the water down and fills the jar.", word: "bubble-bubble",
    note: "Papa’s note: we catch the gas over water, the same way as in the Hydrogen Machine, because hydrogen hardly dissolves in water." },
  { key: "test", label: "Splint test", hint: "Bring a lit splint to the jar’s mouth… POP?", word: "POP!",
    note: "Papa’s note: the same old test. Hydrogen burns with a <b>pop</b>. If the jar stays quiet, there was no hydrogen." },
  { key: "litmus", label: "Litmus test", hint: "Dip a red litmus strip into the water. What colour does it turn?", word: "dip",
    note: "Papa’s note: look at the colour the strip turns, or doesn’t turn. What does that tell you about what is left in the water?" },
];

const ladder = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "H", "Cu", "Hg", "Ag", "Au"];
const NAMES = { Na: "sodium", Ca: "calcium", Mg: "magnesium", Zn: "zinc", Fe: "iron", Cu: "copper" };
const chooser = `<div class="panel metals">
  <h2>Pick a metal and its water</h2>
  <div class="seg many3" role="radiogroup" aria-label="Metal">
    ${Object.keys(NAMES).map((m) => `<button type="button" role="radio" class="segb segm" data-metal="${m}" aria-checked="${m === "Na"}">${m}<small>${NAMES[m]}</small></button>`).join("")}
  </div>
  <div class="seg water3" role="radiogroup" aria-label="Water">
    ${[["cold", "Cold water"], ["hot", "Hot water"], ["steam", "Steam"]].map(([w, l]) => `<button type="button" role="radio" class="segb segw" data-water="${w}" aria-checked="${w === "cold"}">${l}</button>`).join("")}
  </div>
  <ol class="ladder" aria-label="Reactivity series, most reactive first">
    ${ladder.map((m) => `<li data-el="${m}"${m === "H" ? ' class="hyd"' : ""}>${m}</li>`).join('<li class="gap" aria-hidden="true">›</li>')}
  </ol>
  <p class="ladder-note" id="ladderNote"></p>
</div>`;

const html = page({
  slug: "metal-water", fig: 4, title: "The Metal–Water Race",
  hello: "Hey Sairah, it’s Papa. Which metal can pull hydrogen out of plain water? Let’s race them!",
  figTitle: "Hydrogen from water",
  eq: `<span id="eqA" class="eqp">2Na</span> <span id="eqB" class="eqp">+ 2H₂O</span> <span id="eqC" class="eqp">→ 2NaOH + H₂↑</span>`,
  svg: SVG,
  big: "The more reactive the metal, the easier it pulls hydrogen out of water.",
  ionLabel: "Close-up of the metal in water: metal atoms at the bottom, water molecules above. A water molecule meets a metal atom, gives up its hydrogen, and two hydrogen atoms join to make a hydrogen molecule that floats up.",
  ions: ionScene(),
  legend: `<span class="key k-m" id="keyMetal">Na</span> <span class="key k-w">H₂O</span> <span class="key k-hh">H₂</span> <span class="key k-oh">OH</span>`,
  chips: [["gTemp", "Water is"], ["gUsed", "Metal used"], ["gMade", "H₂ made"], ["gJar", "Gas in jar"], ["gRate", "Bubbles"], ["gLeft", "Metal left"]],
  foot: "≈ numbers are approximate, at STP (1 mole of gas ≈ 22.4 L). The sample is 0.01 mol of metal. Bubble speed is a friendly relative number.",
  chooser,
  guesses: [
    "Why do you think sodium is kept under kerosene and not in a jar of air?",
    "Magnesium hardly fizzes in cold water but is happy in steam. What do you think the heat is doing?",
    "Copper didn’t do anything, even in steam. Where is copper on the ladder, and what does that tell you?",
    "Why do you think we collect the gas over water, just like in the Hydrogen Machine?",
  ],
  applyIntro: "No machine for these. Use the race results and the ladder to think them through, then tell Papa.",
  apply: [
    "A new metal, ‘Mystery-ium’, fizzes in cold water, but more slowly than calcium. Where on the ladder would you guess it sits, and what would you expect to see in steam?",
    "Papa has a piece of metal that does nothing in cold water and nothing in hot water, but fizzes a little in steam. Name two metals it could be, and say how you decided.",
    "A water pipe at home is made of copper. Using what you saw today, why is copper a good choice, and why would a pipe made of sodium be a terrible idea?",
    "After a metal reacted, the water turned red litmus blue. A different metal reacted in steam and the litmus didn’t change. What do you think was different about what each one made?",
  ],
  data: DATA, steps: STEPS, model: MODEL_SRC,
  live: readFileSync(join(HERE, "live.js"), "utf8"),
  css: readFileSync(join(HERE, "extra.css"), "utf8"),
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), html);
console.log("wrote machines/metal-water/index.html", (html.length / 1024).toFixed(0) + " KB");
