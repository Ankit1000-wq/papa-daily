// node build.mjs  ->  writes ../../../machines/copper-oxide/index.html (standalone, everything inline)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, drawKit } from "../shared/draw.mjs";
import { page } from "../shared/page.mjs";
import { MODEL_SRC } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../../machines/copper-oxide");
const W = 880;
const H = 560;

// ---------- world (units ≈ px, x/y on the bench, z up) ----------
const BENCH = { x: -240, y: -80, w: 456, d: 160, r: 6 };
const WB = [-190, 20];          // Woulfe bottle (hydrogen generator)
const WB_R = 32;
const NL = [-204, 20];          // thistle neck
const NR = [-176, 20];          // delivery neck
const NECK_R0 = 6;
const STOP_Z = [80, 88];
const ACID_TOP = 26;
const DRY = [-118, 20];         // drying tube
const DRY_R = 9;
const TUBE_Z = 54;              // axis of the hard-glass tube
const TUBE_R = 8;
const TX0 = -80, TX1 = 98;      // hard-glass tube from x0 to x1
const TY = 0;
const BURN = [-4, 0];
const BURN_TIP = 34;
const ROD_A = [-40, -46], ROD_B = [66, -46];
const JET = [108, 0];
const JET_TOP = 96;
const BAL = [150, 50];
const MAG = [-100, -62];
const GAS_TAP = [-6, 58];
const SEGS = 8;
const BOAT_X0 = -20, BOAT_W = 40;
const SPLINT = { x: 40, y: 66, w: 46, d: 3.2, r: 1.2 };
const SPLINT_TIP = [40, 67.6, 2.2];
const MB = { x: 96, y: 60, w: 24, d: 14, r: 1 };

const P = k.fitProjection(
  [...k.boxCorners(BENCH, -30, 0), [NL[0], NL[1], 140], [JET[0], JET[1], 120], [BAL[0], BAL[1], 40], [20, 0, 190]],
  W, H, { pad: 18, azimuth: 60, elevation: 30 },
);
const D = drawKit(P);
const { at, f1, K, solid, line, dots, slab, cyl, up, alongX, turned, circ, shadow } = D;

// ---------- hydrogen generator: Woulfe bottle, zinc, acid, thistle funnel ----------
const BODY = [[0, WB_R], [53, WB_R], [59, WB_R - 2.4, 1], [64, WB_R - 8, 1], [67, WB_R - 16, 1], [69, 10]];
function granules() {
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const list = [];
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (WB_R - 8);
    const c = [WB[0] + Math.cos(a) * d, WB[1] + Math.sin(a) * d], r = 2.6 + rnd() * 1.8;
    const ring = Array.from({ length: 6 }, (_, j) => { const b = (j / 6) * Math.PI * 2 + rnd() * 0.5, q = r * (0.75 + rnd() * 0.45); return [c[0] + Math.cos(b) * q, c[1] + Math.sin(b) * q]; });
    list.push({ c, ring, h: 1.8 + rnd() * 1.8, z: 1.5 + rnd() });
  }
  list.sort((a, b) => D.depth([a.c[0], a.c[1], 0]) - D.depth([b.c[0], b.c[1], 0]));
  return list.map((g) => solid(k.extrude(g.ring, g.z, g.h, P), "m-metal", { crease: false })).join("");
}
function bottleBack() { return `<path class="glass-back" d="${turned(WB, 0, BODY).fill}"/>` + line(k.pathOf(circ(WB, WB_R - 1.5, 64).map(([x, y]) => at([x, y, 1.5])), true), "ln glassline"); }
function bottleFront() {
  const out = [solid(turned(WB, 0, BODY), "m-glass", { crease: false })];
  const s1 = [WB[0] + Math.cos(2.75) * WB_R, WB[1] + Math.sin(2.75) * WB_R];
  out.push(line(k.segment([s1[0], s1[1], 8], [s1[0], s1[1], 48], P), "shine"));
  out.push(line(G.arcOf(up(WB, 0), 4, WB_R, P), "ln faint"));
  return out.join("");
}
const neck = (c) => solid(turned(c, 62, [[0, NECK_R0], [16, NECK_R0], [17, NECK_R0 + 1.4], [20, NECK_R0 + 1.4]]), "m-glass", { crease: false });
function stopper(c, hole) {
  const F = up(c, STOP_Z[0]);
  const p = G.lathe([[0, 0], [0, NECK_R0 - 0.6], [8, NECK_R0 + 1.2], [8, 0]], F, P);
  return solid(p, "m-rubber") + `<ellipse class="hole" cx="${f1(at([c[0], c[1], STOP_Z[1]])[0])}" cy="${f1(at([c[0], c[1], STOP_Z[1]])[1])}" rx="${f1(hole * K)}" ry="${f1(hole * K * 0.5)}"/>`;
}
const STEM_R = 2;
const stem = (z0, z1) => solid(cyl(NL, STEM_R, z0, z1 - z0, 14), "m-glass", { crease: false });
function thistle() {
  const z = 112, F = up(NL, z);
  const p = G.lathe([[0, 0], [0, STEM_R], [2, 4, 1], [6, 6.5, 1], [10, 4, 1], [12, 3], [14, 4], [24, 12], [26, 13], [26, 0]], F, P);
  return solid(p, "m-glass", { crease: false }) + `<path class="cup-in" d="${D.ringAt(NL, 12.4, z + 26, 40)}"/>`;
}

// ---------- drying tube: glass, white beads, cork, two tubes ----------
function dryBack() { return `<path class="glass-back" d="${turned(DRY, 2, [[0, DRY_R], [52, DRY_R]]).fill}"/>`; }
function dryBeads() {
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pts = [];
  for (let i = 0; i < 64; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (DRY_R - 2), z = 4 + rnd() * 36; pts.push([DRY[0] + Math.cos(a) * d, DRY[1] + Math.sin(a) * d, z]); }
  pts.sort((a, b) => D.depth(a) - D.depth(b));
  return pts.map((p) => { const [x, y] = at(p); return `<circle class="bead" cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.5 + (p[2] % 1) * 0.5)}"/>`; }).join("");
}
function dryFront() {
  const out = [solid(turned(DRY, 2, [[0, DRY_R], [52, DRY_R]]), "m-glass", { crease: false })];
  out.push(line(k.segment([DRY[0] - 6, DRY[1] + 3, 8], [DRY[0] - 6, DRY[1] + 3, 46], P), "shine"));
  out.push(solid(turned(DRY, 52, [[0, DRY_R + 0.4], [5, DRY_R + 0.4]], { rims: "all" }), "m-cork"));
  const inlet = [DRY[0] - 4, DRY[1]], outlet = [DRY[0] + 4, DRY[1]];
  out.push(solid(cyl(inlet, 1.8, 56, 8, 12), "m-glass", { crease: false }), solid(cyl(outlet, 1.8, 56, 8, 12), "m-glass", { crease: false }));
  out.push(D.wrapLabel(up(DRY, 0), 18, 36, DRY_R, "dry", G.angleToward(up(DRY, 0), [0.5, 0.866, 0]), 0.9));
  return out.join("");
}
// the gas lines
const TUBE1 = G.fillet([[NR[0], NR[1], 74], [NR[0], NR[1], 114], [DRY[0] - 4, DRY[1], 114], [DRY[0] - 4, DRY[1], 64]], 7, 8);
const HOSE1 = G.fillet([[DRY[0] + 4, DRY[1], 62], [DRY[0] + 4, DRY[1], 84], [-96, 12, 84], [-92, 2, TUBE_Z + 14], [TX0 - 8, TY, TUBE_Z + 6], [TX0 - 8, TY, TUBE_Z]], 6, 8);

// ---------- the hard-glass tube, boat and powder ----------
const TF = alongX([TX0, TY, TUBE_Z]);
const TLEN = TX1 - TX0;
const tubeSolid = () => G.solidOf([[0, TUBE_R], [TLEN, TUBE_R]], TF, P);
function tubeBack() { return `<path class="glass-back" d="${tubeSolid().fill}"/>`; }
function tubeFront() {
  const out = [solid(tubeSolid(), "m-glass", { crease: false })];
  const [a, b] = [[TX0 + 8, TY - 3.2, TUBE_Z + 6], [TX1 - 8, TY - 3.2, TUBE_Z + 6]];
  out.push(line(k.segment(a, b, P), "shine thin"));
  out.push(line(G.arcOf(TF, 4, TUBE_R, P), "ln glassline"), line(G.arcOf(TF, TLEN - 4, TUBE_R, P), "ln glassline"));
  return out.join("");
}
const BOAT_Z = TUBE_Z - TUBE_R + 0.6;
function boat() {
  const out = [];
  out.push(solid(slab({ x: BOAT_X0 - 2, y: TY - 4.6, w: BOAT_W + 4, d: 9.2, r: 2 }, BOAT_Z, 3, 3, 0.5), "m-porc"));
  out.push(line(k.lineOnTop([BOAT_X0 + 3, TY], [BOAT_X0 + BOAT_W - 3, TY], BOAT_Z + 3, P), "ln faint"));
  const sw = BOAT_W / SEGS;
  for (let i = 0; i < SEGS; i++) out.push(`<g class="seg" data-i="${i}">${solid(slab({ x: BOAT_X0 + i * sw, y: TY - 3.4, w: sw + 0.4, d: 6.8, r: 1.2 }, BOAT_Z + 3, 3, 2, 0.3), "m-seg", { crease: false })}</g>`);
  out.push(`<path class="o-line" d="${slab({ x: BOAT_X0, y: TY - 3.4, w: BOAT_W, d: 6.8, r: 2.8 }, BOAT_Z + 3, 3, 3, 0.3).outline}"/>`);
  return out.join("");
}
// water drops on the cool end of the tube, inside the glass at the bottom
const DROP_N = 10;
const dropSpots = Array.from({ length: DROP_N }, (_, i) => [TX1 - 40 + ((i * 7) % 33) * 1.0, TY + (((i * 5) % 7) - 3) * 0.9, TUBE_Z - TUBE_R + 1.2]);
function clampRing(x) {
  const F = alongX([x - 3, TY, TUBE_Z]);
  return solid(G.solidOf([[0, TUBE_R + 1.6], [6, TUBE_R + 1.6]], F, P), "m-cork");
}
const ARM_Z = TUBE_Z + TUBE_R + 2.2;      // the clamp arm rests on the ring around the tube
function stands() {
  const out = [];
  for (const rod of [ROD_A, ROD_B]) {
    out.push(D.clampStand(rod, 100));
    out.push(solid(slab({ x: rod[0] - 5, y: rod[1] - 5, w: 10, d: 10, r: 1.5 }, ARM_Z - 6, 14, 3, 0.5), "m-steel-d"));
    out.push(solid(cyl([rod[0], rod[1] + 7], 2.6, ARM_Z + 1, 4, 16), "m-brass"));
  }
  return out.join("");
}
const clamps = () => [ROD_A, ROD_B].map((rod) => {
  const x = rod[0];
  return clampRing(x) + solid(slab({ x: x - 2.2, y: rod[1] + 5, w: 4.4, d: TY + 3 - rod[1] - 5, r: 1 }, ARM_Z, 4, 2, 0.4), "m-steel") + solid(cyl([x, TY], 2.4, ARM_Z + 4, 3, 12), "m-brass");
}).join("");
const endStopper = (x, face) => solid(G.solidOf([[0, TUBE_R + 0.6], [8, TUBE_R + 0.6]], alongX([x, TY, TUBE_Z]), P), "m-rubber");

// ---------- burner, gas tap and hose ----------
const BURNER = D.burner(BURN, "bflame", [[14, 14, 4], [4, 38, 5], [GAS_TAP[0] + 2, GAS_TAP[1] - 5, 22]]);
function gasTap() {
  const out = [];
  out.push(solid(cyl(GAS_TAP, 3, 0, 26, 16), "m-brass", { crease: false }));
  out.push(solid(slab({ x: GAS_TAP[0] - 2, y: GAS_TAP[1] - 7, w: 4, d: 8, r: 1 }, 18, 5, 2, 0.4), "m-brass"));
  out.push(solid(slab({ x: GAS_TAP[0] - 9, y: GAS_TAP[1] - 1, w: 18, d: 2, r: 0.8 }, 27, 2.4, 2, 0.2), "m-black"));
  return out.join("");
}

// ---------- the jet where the extra hydrogen burns ----------
function jet() {
  const out = [];
  out.push(endStopper(TX1, 1));
  out.push(solid(cyl(JET, 2.4, TUBE_Z - 2, JET_TOP - 10 - TUBE_Z + 2, 14), "m-glass", { crease: false }));
  out.push(solid(turned(JET, JET_TOP - 10, [[0, 2.4], [6, 1.5, 1], [10, 1.1]]), "m-glass", { crease: false }));
  out.push(`<g id="jetFlame" opacity="0"><path class="h2flame-o" d=""/><path class="h2flame-i" d=""/></g>`);
  return out.join("");
}
// a short elbow joins the tube end to the jet's foot
const ELBOW = G.fillet([[TX1 + 6, TY, TUBE_Z], [JET[0], JET[1], TUBE_Z], [JET[0], JET[1], TUBE_Z + 12]], 4, 6);

// ---------- balance ----------
const BH = { x: BAL[0] - 28, y: BAL[1] - 18, w: 56, d: 36, r: 3 };
function balance() {
  const out = [];
  out.push(solid(slab(BH, 0, 14, 4, 0.8), "m-steel"));
  out.push(solid(slab({ x: BH.x + 3, y: BH.y + BH.d - 0.6, w: BH.w - 6, d: 1, r: 0.4 }, 3.5, 8, 2, 0), "m-lcd", { crease: false }));
  out.push(`<text id="lcdText" class="lcd-t" transform="${k.sideMatrix([BAL[0], BH.y + BH.d + 0.5, 4.2], 4.2, P, "left")}" font-size="6.2" text-anchor="middle">0.00 g</text>`);
  out.push(solid(cyl([BAL[0], BAL[1] - 2], 3.4, 14, 8, 14), "m-steel-d"));
  out.push(solid(cyl([BAL[0], BAL[1] - 2], 15, 22, 2, 36, 0.4), "m-steel"));
  out.push(dots(k.corners(BH, 4).map(([x, y]) => [x, y, 14]), 0.9, "dot screw"));
  // the porcelain boat, tipped out for weighing: shown in step 7
  const BP = [BAL[0], BAL[1] - 2];
  out.push(`<g id="weigh" opacity="0">${solid(slab({ x: BP[0] - 14, y: BP[1] - 4.6, w: 28, d: 9.2, r: 2 }, 24, 3, 3, 0.5), "m-porc")}<g class="wseg">${solid(slab({ x: BP[0] - 11, y: BP[1] - 3.4, w: 22, d: 6.8, r: 1.4 }, 27, 2.6, 2, 0.3), "m-seg", { crease: false })}</g></g>`);
  return out.join("");
}

// ---------- magnifier ----------
const LENS_C = at([24, 8, 112]);
const LENS_R = 36;
function magnifier() {
  const out = [];
  out.push(solid(cyl(MAG, 10, 0, 3, 32, 0.5), "m-steel-d"), solid(cyl(MAG, 2, 3, 26, 16), "m-steel", { crease: false }), solid(cyl(MAG, 3.2, 27, 4, 16), "m-brass"));
  const [hx, hy] = at([MAG[0], MAG[1], 31]);
  const ang = Math.atan2(LENS_C[1] - hy, LENS_C[0] - hx);
  const ex = LENS_C[0] - Math.cos(ang) * (LENS_R + 3), ey = LENS_C[1] - Math.sin(ang) * (LENS_R + 3);
  out.push(`<path class="handle-ink" d="M${f1(hx)} ${f1(hy)}L${f1(ex)} ${f1(ey)}"/><path class="handle" d="M${f1(hx)} ${f1(hy)}L${f1(ex)} ${f1(ey)}"/>`);
  out.push(`<circle class="dot screw" cx="${f1(hx)}" cy="${f1(hy)}" r="1.6"/>`);
  return out.join("");
}

const ionScene = () => `<g id="ions"><rect class="ion-bg" x="0" y="0" width="240" height="240"/><g id="oxGrid"></g><g id="molMid"></g><g id="molFront"></g><text id="ionCap" class="ion-cap" x="120" y="58" text-anchor="middle"></text></g>`;

const shadows = () => `<g clip-path="url(#benchTop)">${[
  shadow(circ(WB, WB_R), 70), shadow(circ(DRY, DRY_R + 1), 60),
  shadow(k.ringOf({ x: ROD_A[0] - 16, y: ROD_A[1] - 24, w: 30, d: 48, r: 3 }, 3), 6), shadow(circ(ROD_A, 3, 12), 110),
  shadow(k.ringOf({ x: ROD_B[0] - 16, y: ROD_B[1] - 24, w: 30, d: 48, r: 3 }, 3), 6), shadow(circ(ROD_B, 3, 12), 110),
  shadow(circ(BURN, 11), 36), shadow(circ(GAS_TAP, 3), 30), shadow(circ(JET, 2.4, 10), 60),
  shadow(k.ringOf(BH, 3), 14), shadow(circ(MAG, 10), 30), shadow(k.ringOf(SPLINT, 2), 2), shadow(k.ringOf(MB, 2), 7),
].join("")}</g>`;

const SVG = `<svg class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="A bench set-up for reducing copper oxide with hydrogen. A bottle makes hydrogen from zinc and acid, a drying tube dries it, and it flows over a boat of black copper oxide in a hard-glass tube heated by a burner. Water drops collect at the cool end, extra hydrogen burns at a jet, and a balance weighs the boat.">
<defs>
  <clipPath id="benchTop"><path d="${k.slabOf(BENCH, 0, 0.01, P, 6).fill}"/></clipPath>
  <clipPath id="lensClip"><circle cx="${f1(LENS_C[0])}" cy="${f1(LENS_C[1])}" r="${LENS_R}"/></clipPath>
</defs>
<g id="scene">
${D.bench(BENCH, "H₂ REDUCES OXIDES · CLASS 8")}
${shadows()}
${magnifier()}
${stands()}
<g id="bottle">
  ${bottleBack()}
  <g id="granules">${granules()}</g>
  <g id="acid"><path class="acid-body" d="${k.cylinder(WB[0], WB[1], WB_R - 1.5, 1.5, ACID_TOP, P, 64).fill}"/><path class="acid-top" d="${k.cylinder(WB[0], WB[1], WB_R - 1.5, 1.5, ACID_TOP, P, 64).top}"/></g>
  <g id="bubblesA"></g>
  ${bottleFront()}
  ${neck(NL)}${neck(NR)}
  ${D.tube([[NR[0], NR[1], 72], [NR[0], NR[1], 82]], 2.2, "inner")}
</g>
${stem(8, 96)}
${stopper(NL, STEM_R)}${stopper(NR, 2.2)}
${stem(STOP_Z[1] - 1, 114)}
${thistle()}
${D.tube(TUBE1, 2.2)}
${dryBack()}${dryBeads()}${dryFront()}
${D.hose(HOSE1, 2.6)}
${BURNER.body}
${tubeBack()}
<ellipse id="hotGlow" class="hot-glow" cx="${f1(at([BURN[0], BURN[1], TUBE_Z - 4])[0])}" cy="${f1(at([BURN[0], BURN[1], TUBE_Z - 4])[1])}" rx="${f1(30 * K * 0.6)}" ry="${f1(7 * K * 0.6)}" opacity="0"/>
<g id="boatG">${boat()}</g>
<g id="drops">${dropSpots.map((p, i) => `<ellipse class="drop" data-i="${i}" rx="0" ry="0" cx="${f1(at(p)[0])}" cy="${f1(at(p)[1])}"/>`).join("")}</g>
${tubeFront()}
${clamps()}
${endStopper(TX0 + 6, 0)}
${D.tube(ELBOW, 2.4, "")}
${jet()}
${BURNER.hose}${gasTap()}
<g id="shimmer"></g>
<g id="falling"></g>
${balance()}
${D.matchbox(MB)}
<g id="splint">${D.splint(SPLINT)}<g id="flame" opacity="0"><path class="flame-o" d=""/><path class="flame-i" d=""/></g></g>
${D.lens(LENS_C, LENS_R)}
<g id="words"></g>
</g>
</svg>`;

// ---------- colours of each oxide before and after (light, mid, dark) ----------
const COLORS = {
  CuO: { from: ["#59606e", "#3a404c", "#262a33"], to: ["#e7a07a", "#c46a3a", "#8f4a26"] },
  PbO: { from: ["#f6dd7a", "#e8c548", "#bf9b2a"], to: ["#c4c9d0", "#8e949c", "#656b73"] },
  ZnO: { from: ["#ffffff", "#ece9e2", "#cdc8bd"], to: ["#ffffff", "#ece9e2", "#cdc8bd"] },
};

const DATA = {
  slug: "copper-oxide", choice0: "CuO", ladderOf: { CuO: "Cu", PbO: "Pb", ZnO: "Zn" }, COLORS,
  P, BOAT_X0, BOAT_W, SEGS, TX0, TX1, TUBE_Z, TUBE_R, TY, BURN, BURN_TIP, JET, JET_TOP, WB, WB_R, ACID_TOP, DROP_N, BAL, dropSpots, SPLINT_TIP, ELBOW_TOP: [JET[0], JET[1], TUBE_Z + 12],
  SPOTS: {
    boat: at([BOAT_X0 + 20, TY, 92]), flow: at([-96, 8, 108]), jet: at([JET[0] - 10, JET[1], JET_TOP + 30]), burner: at([BURN[0] + 6, BURN[1] + 10, 40]),
    drips: at([TX1 - 30, TY, 90]), cool: at([BURN[0] + 6, BURN[1], 92]), weigh: at([BAL[0], BAL[1], 62]), pop: at([JET[0] + 10, JET[1], JET_TOP + 22]),
  },
  doneHint: "All done! The powder lost its oxygen to hydrogen.",
  firstNote: "Papa’s note: hydrogen is greedy for oxygen. Today we hand it a boat of metal oxide and watch what happens.",
};

const STEPS = [
  { key: "load", label: "Load the boat", hint: "Spoon some powder into the little boat and slide it in.", word: "scoop",
    note: "Papa’s note: this is <b>copper oxide</b>, a black powder. Copper has joined up with oxygen to make it. (Papa’s sample is only about 1 g.)" },
  { key: "flush", label: "Let hydrogen flow", hint: "Switch the hydrogen on and let it push the air out, before any flame.", word: "hiss",
    note: "Papa’s note: the tube is full of <b>air</b> at first. Hot hydrogen and air can explode, so we let the hydrogen push all the air out first. We also dry the gas, so any water we find later is brand new." },
  { key: "jet", label: "Light the jet", hint: "Check the gas pops quietly, then light the jet at the end.", word: "pop",
    note: "Papa’s note: a quiet little pop means the air is gone. The extra hydrogen now burns calmly at the jet, so it can’t fill the room." },
  { key: "heat", label: "Heat the boat", hint: "Light the burner under the boat. Watch the colour change!", word: "fwoomp",
    note: "Papa’s note: hydrogen takes the oxygen away from the hot powder. Taking away oxygen is called <b>reduction</b>, and the hydrogen is the <b>reducing agent</b>." },
  { key: "water", label: "Water drops!", hint: "Look at the cool end of the tube. What is gathering there?", word: "drip drip",
    note: "Papa’s note: the oxygen that hydrogen took has turned into <b>water</b>, <b>H₂O</b>. It runs to the cool end as drops." },
  { key: "cool", label: "Cool it down", hint: "Burner off, but keep the hydrogen flowing until the tube is cool.", word: "tsss…",
    note: "Papa’s note: we keep the hydrogen flowing while it cools. A hot metal would grab oxygen from the air again, and we’d be back where we started." },
  { key: "weigh", label: "Weigh the boat", hint: "Tip the powder onto the scale. Is it heavier, lighter or the same?", word: "beep!",
    note: "Papa’s note: look at the number on the scale and compare it with the one we started with. Where did the difference go?" },
];

const SEESAW = [
  { id: "cuo", title: "Copper oxide + hydrogen", eq: "CuO + H₂ → Cu + H₂O", a: "copper oxide", b: "hydrogen" },
  { id: "pbo", title: "Lead oxide + hydrogen", eq: "PbO + H₂ → Pb + H₂O", a: "lead oxide", b: "hydrogen" },
];
const slot = (key, opts) => `<button type="button" class="slot" data-key="${key}" data-opts="${opts.join("|")}"></button>`;
const card = (c) => `<article class="ss-card"><h3>${c.title}</h3><p class="ss-eq">${c.eq}</p>
  <p class="ss-row">Oxygen moves from ${slot(`ss-${c.id}-from`, [c.a, c.b])} to ${slot(`ss-${c.id}-to`, [c.a, c.b])}.</p>
  <p class="ss-row">${c.a[0].toUpperCase() + c.a.slice(1)} was ${slot(`ss-${c.id}-1`, ["oxidised", "reduced"])}. Hydrogen was ${slot(`ss-${c.id}-2`, ["oxidised", "reduced"])}.</p>
  <p class="ss-row">The reducing agent is ${slot(`ss-${c.id}-3`, [c.a, c.b])}. The oxidising agent is ${slot(`ss-${c.id}-4`, [c.a, c.b])}.</p></article>`;
const mgCard = `<article class="ss-card"><h3>Burning magnesium</h3><p class="ss-eq">2Mg + O₂ → 2MgO</p>
  <p class="ss-row">Oxygen moves from ${slot("ss-mg-from", ["magnesium", "oxygen"])} to ${slot("ss-mg-to", ["magnesium", "oxygen"])}.</p>
  <p class="ss-row">Magnesium was ${slot("ss-mg-1", ["oxidised", "reduced"])}.</p>
  <p class="ss-row">The oxidising agent is ${slot("ss-mg-2", ["magnesium", "oxygen"])}.</p></article>`;
const seesawHtml = `<section class="guess seesaw" aria-label="Oxygen see-saw">
  <h2>The oxygen see-saw</h2>
  <svg class="saw" viewBox="0 0 220 64" aria-hidden="true"><path class="saw-fulcrum" d="M110 60L96 42H124Z"/><g transform="rotate(-7 110 40)"><rect class="saw-plank" x="14" y="36" width="192" height="7" rx="3"/><circle class="saw-o" cx="30" cy="28" r="9"/><text class="saw-t" x="30" y="31.4" text-anchor="middle">O</text></g></svg>
  <p class="apply-intro">Oxygen is like a ball that gets passed along. Tap each box to choose what you saw. Nothing gets marked here. Talk it through with Papa!</p>
  <div class="ss-grid">${SEESAW.map(card).join("")}${mgCard}</div>
</section>`;

const ladder = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "H", "Cu", "Hg", "Ag", "Au"];
const chooser = `<div class="panel metals">
  <h2>Try another oxide</h2>
  <div class="seg" role="radiogroup" aria-label="Oxide" style="grid-template-columns:repeat(3,1fr)">
    ${[["CuO", "black"], ["PbO", "yellow"], ["ZnO", "white"]].map(([m, c]) => `<button type="button" role="radio" class="segb" data-choice="${m}" aria-checked="${m === "CuO"}">${m}<small>${c}</small></button>`).join("")}
  </div>
  <ol class="ladder" aria-label="Reactivity series, most reactive first">
    ${ladder.map((m) => `<li data-el="${m}"${m === "H" ? ' class="hyd"' : ""}>${m}</li>`).join('<li class="gap" aria-hidden="true">›</li>')}
  </ol>
  <p class="ladder-note" id="ladderNote"></p>
</div>`;

const html = page({
  slug: "copper-oxide", fig: 3, title: "The Copper Oxide Changer",
  hello: "Hey Sairah, it’s Papa. Hydrogen is greedy for oxygen. Let’s watch it steal some!",
  figTitle: "Hydrogen takes oxygen away",
  eq: `<span id="eqA" class="eqp">CuO</span> <span id="eqB" class="eqp">+ H₂</span> <span id="eqC" class="eqp">→ Cu + H₂O</span>`,
  svg: SVG,
  big: "Hydrogen takes oxygen away from a metal oxide. Losing oxygen is reduction, and gaining it is oxidation.",
  ionLabel: "Close-up of the hot powder: copper atoms joined to oxygen atoms. Hydrogen molecules arrive, take an oxygen atom each and leave as water, and the copper atoms are left behind.",
  ions: ionScene(),
  legend: `<span class="key k-cu" id="keyMetal">Cu</span> <span class="key k-oo">O</span> <span class="key k-hh">H₂</span> <span class="key k-w">H₂O</span>`,
  chips: [["gBoat", "Boat holds"], ["gMetal", "Metal made"], ["gWater", "Water made"], ["gH2", "H₂ passed"], ["gAir", "Air left inside"], ["gDone", "Changed so far"]],
  foot: "≈ numbers are approximate, at STP (1 mole of gas ≈ 22.4 L). The sample is about 0.0125 mol of oxide. Heating speed is a friendly guess.",
  chooser, extra: seesawHtml,
  guesses: [
    "Why do you think we let hydrogen flow for a while before lighting the burner?",
    "Where do you think the oxygen from the powder went?",
    "Why do you think we keep the hydrogen flowing even after the burner is off?",
    "Why do you think Papa dries the hydrogen before it meets the hot powder?",
  ],
  applyIntro: "No machine for these. Use what you saw and tap on the see-saw to think them through, then tell Papa.",
  apply: [
    "A friend says, ‘The water drops came from damp gas, not from the experiment.’ What did Papa add to the set-up to settle this, and how would you explain it to her?",
    "Steel wool (iron) gets heavier when it rusts, but our black powder got lighter. Use the idea of oxygen moving to explain both.",
    "Zinc oxide stayed white and nothing happened. Look at the reactivity ladder. What pattern do you notice about which oxides hydrogen can reduce?",
    "A magnesium ribbon burns in air and leaves a white powder. Was the magnesium oxidised or reduced? How do you know?",
  ],
  data: DATA, steps: STEPS, model: MODEL_SRC,
  live: readFileSync(join(HERE, "live.js"), "utf8"),
  css: readFileSync(join(HERE, "extra.css"), "utf8"),
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), html);
console.log("wrote machines/copper-oxide/index.html", (html.length / 1024).toFixed(0) + " KB");
