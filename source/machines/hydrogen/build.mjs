// node build.mjs  ->  writes ./index.html (standalone, everything inline)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { MODEL_SRC } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SRC = readFileSync(join(HERE, "kit/iso-kit.mjs"), "utf8").replace(/^export /gm, "");

const W = 880;
const H = 560;

// ---------- world (units ≈ px, x/y on the bench, z up) ----------
const BENCH = { x: -240, y: -80, w: 456, d: 160, r: 6 };
const WB = [-125, 5];          // Woulfe bottle centre
const WB_R = 40;
const NECK_L = [-143, 5];      // thistle funnel neck
const NECK_R = [-107, 5];      // delivery tube neck
const NECK_R0 = 7.5;
const STOP_Z = [100, 109];     // rubber stopper
const ACID_TOP = 34;           // acid level when full
const TR = [70, 5];           // trough centre
const TR_R = 50;
const TR_H = 40;
const WATER = 30;
const BEE_TOP = 15;            // beehive shelf top
const JAR_R = 17;
const JAR_H = 92;
const JAR_LIFT = 56;
const SPARES = [[160, -40], [172, 36]];
const ROD = [-200, 5];
const CLAMP_Z = 140;
const ACID = [-52, -52];       // acid bottle
const SPLINT = { x: 70, y: 70, w: 50, d: 3.2, r: 1.2 };
const SPLINT_TIP = [70, 71.6, 2.2];
const SPLINT_TEST = [TR[0] - 2, TR[1], BEE_TOP + JAR_LIFT - 6];
const MAG = [-178, 58];        // magnifier stand

const P = k.fitProjection(
  [...k.boxCorners(BENCH, -30, 0), [ROD[0], ROD[1], 202], [NECK_L[0], NECK_L[1], 214], [TR[0], TR[1], BEE_TOP + JAR_H + JAR_LIFT + 4], [NECK_L[0], NECK_L[1], 204]],
  W, H, { pad: 18, azimuth: 60, elevation: 30 },
);
const at = (p) => k.iso(p, P);
const f1 = (v) => Math.round(v * 10) / 10;
const pt = (p) => { const [x, y] = at(p); return `${f1(x)} ${f1(y)}`; };
const K = G.scaleOf(P);

// ---------- drawing helpers ----------
function solid(p, mat, { crease = true, cls = "", extra = "", attrs = "" } = {}) {
  const sh = p.shades.map((d, i) => (d ? `<path class="h${i}" d="${d}"/>` : "")).join("");
  return `<g class="s ${mat} ${cls}"${p.seamless ? " data-seamless" : ""}${attrs}><path class="f" d="${p.fill}"/>${sh}${p.top ? `<path class="t" d="${p.top}"/>` : ""}${crease && p.crease ? `<path class="c" d="${p.crease}"/>` : ""}${p.bevel ? `<path class="b" d="${p.bevel}"/>` : ""}${extra}<path class="o" d="${p.outline}"/></g>`;
}
const line = (d, cls = "ln") => (d ? `<path class="${cls}" d="${d}"/>` : "");
const dots = (pts, r = 0.9, cls = "dot") => pts.map((p) => { const [x, y] = at(p); return `<circle class="${cls}" cx="${f1(x)}" cy="${f1(y)}" r="${r}"/>`; }).join("");
const slab = (plan, z, h, steps = 3, bevel = 0.6) => k.slabOf(plan, z, h, P, steps, bevel);
const cyl = (c, r, z, h, steps = 28, bevel = 0) => k.cylinder(c[0], c[1], r, z, h, P, steps, bevel);
const up = (c, z) => G.frameOf([c[0], c[1], z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const turned = (c, z, profile, opts) => G.solidOf(profile, up(c, z), P, opts);

function hull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of pts.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
// hard cast shadow on the bench: footprint swept away from the light
const SHADOW_DIR = [0.62, -0.42];
function shadow(ring, h, z = 0) {
  const pts = [];
  for (const [x, y] of ring) { pts.push(at([x, y, z])); pts.push(at([x + SHADOW_DIR[0] * h, y + SHADOW_DIR[1] * h, z])); }
  return `<path class="shd" d="${k.pathOf(hull(pts), true)}"/>`;
}
const circ = (c, r, n = 40) => k.circleRing(c[0], c[1], r, n);

// ---------- bench ----------
function bench() {
  const out = [];
  out.push(`<path class="shd paper" d="${k.slabOf(k.insetPlan(BENCH, -6), -40, 0.1, P).fill}" transform="translate(10 8)"/>`);
  for (const [x, y] of k.corners(BENCH, 16)) out.push(solid(cyl([x, y], 9, -40, 12, 24), "m-wood-d"));
  out.push(solid(slab(k.insetPlan(BENCH, 8), -28, 14, 4, 0), "m-wood-d"));
  out.push(solid(slab(BENCH, -14, 14, 6, 1.2), "m-wood"));
  const ys = [-44, -2, 40];
  for (const y of ys) out.push(line(k.lineOnTop([BENCH.x, y], [BENCH.x + BENCH.w, y], 0, P), "ln faint"));
  // plank seams continue down the front face
  for (const y of ys) out.push(line(k.segment([BENCH.x + BENCH.w, y, 0], [BENCH.x + BENCH.w, y, -14], P), "ln faint"));
  // screws in the front apron
  const apron = k.insetPlan(BENCH, 8);
  out.push(dots([-180, -60, 60, 180].map((x) => [x, apron.y + apron.d, -21]), 1.1, "dot screw"));
  // brass label plate on the bench edge
  const plate = { x: -30, y: BENCH.y + BENCH.d - 0.6, w: 60, d: 0.8, r: 0.4 };
  out.push(solid(slab(plate, -12, 10, 2, 0), "m-brass", { crease: false }));
  out.push(`<text class="engrave" transform="${k.sideMatrix([plate.x + 30, plate.y + plate.d, -5], -5, P, "left")}" font-size="5.6" text-anchor="middle">H₂ LAB · CLASS 8</text>`);
  out.push(dots([[plate.x + 3, plate.y + plate.d, -7], [plate.x + 57, plate.y + plate.d, -7]], 0.9, "dot screw"));
  return out.join("");
}

// ---------- shadows on the bench ----------
function shadows() {
  const out = [];
  out.push(shadow(circ(WB, WB_R), 60));
  out.push(shadow(circ(TR, TR_R), 34));
  out.push(shadow(k.ringOf({ x: ROD[0] - 16, y: ROD[1] - 24, w: 30, d: 48, r: 3 }, 3), 6));
  out.push(shadow(circ(ROD, 3, 12), 120));
  out.push(shadow(circ(ACID, 17), 46));
  out.push(shadow(k.ringOf(SPLINT, 2), 2));
  out.push(shadow(circ(MAG, 10), 30));
  return `<g clip-path="url(#benchTop)">${out.join("")}</g>`;
}

// ---------- clamp stand ----------
function clampStand() {
  const out = [];
  const base = { x: ROD[0] - 16, y: ROD[1] - 24, w: 30, d: 48, r: 3 };
  out.push(solid(slab(base, 0, 6, 4, 0.8), "m-steel-d"));
  out.push(dots(k.corners(base, 4).map(([x, y]) => [x, y, 6]), 1, "dot screw"));
  out.push(solid(cyl(ROD, 4.5, 6, 4, 20), "m-steel"));
  out.push(solid(cyl(ROD, 2.6, 10, 190, 20), "m-steel", { crease: false }));
  out.push(solid(cyl(ROD, 3.2, 200, 2.4, 20), "m-steel"));
  // boss head on the rod
  const boss = { x: ROD[0] - 5, y: ROD[1] - 5, w: 10, d: 10, r: 1.5 };
  out.push(solid(slab(boss, CLAMP_Z - 6, 14, 3, 0.5), "m-steel-d"));
  out.push(solid(cyl([ROD[0], ROD[1] + 7], 2.6, CLAMP_Z + 1, 4, 16), "m-brass"));
  out.push(line(k.knurl(ROD[0], ROD[1] + 7, 2.6, CLAMP_Z + 1, CLAMP_Z + 5, 14, P), "ln faint"));
  // arm reaching forward to the thistle funnel stem
  const arm = { x: ROD[0] + 5, y: NECK_L[1] - 2.2, w: NECK_L[0] - ROD[0] - 9, d: 4.4, r: 1 };
  out.push(solid(slab(arm, CLAMP_Z, 4, 2, 0.4), "m-steel"));
  return out.join("");
}
function clampJaw() {
  const out = [];
  const c = NECK_L;
  out.push(solid(turned(c, CLAMP_Z - 2, [[0, 5], [8, 5]], { rims: "all" }), "m-cork"));
  out.push(line(G.arcOf(up(c, CLAMP_Z - 2), 4, 5, P), "ln faint"));
  // wing screw that tightens the jaw
  out.push(solid(slab({ x: c[0] - 1, y: c[1] + 4.6, w: 2, d: 6, r: 0.6 }, CLAMP_Z + 1, 4, 2, 0), "m-brass"));
  return out.join("");
}

// ---------- Woulfe bottle ----------
const BODY = [[0, WB_R], [66, WB_R], [74, WB_R - 3, 1], [80, WB_R - 10, 1], [84, WB_R - 20, 1], [86, 12]];
const BODY_F = up(WB, 0);
function granules() {
  // irregular little lumps of granulated zinc on the bottom, painted back to front
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const list = [];
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * (WB_R - 9);
    const c = [WB[0] + Math.cos(a) * d, WB[1] + Math.sin(a) * d];
    const r = 3.2 + rnd() * 2.4;
    const ring = Array.from({ length: 6 }, (_, j) => { const b = (j / 6) * Math.PI * 2 + rnd() * 0.5; const q = r * (0.75 + rnd() * 0.45); return [c[0] + Math.cos(b) * q, c[1] + Math.sin(b) * q]; });
    list.push({ c, ring, h: 2.2 + rnd() * 2.4, z: 1.5 + rnd() * 1.2 });
  }
  list.sort((a, b) => k.depthOf([a.c[0], a.c[1], 0], P) - k.depthOf([b.c[0], b.c[1], 0], P));
  return list.map((g, i) => `<g class="gran" data-i="${i}">${solid(k.extrude(g.ring, g.z, g.h, P), "m-metal", { crease: false })}</g>`).join("");
}
function bottleBack() {
  const p = turned(WB, 0, BODY);
  return `<path class="glass-back" d="${p.fill}"/>` + line(k.pathOf(circ(WB, WB_R - 1.5, 64).map(([x, y]) => at([x, y, 1.5])), true), "ln glassline");
}
function bottleFront() {
  const p = turned(WB, 0, BODY);
  const out = [solid(p, "m-glass", { crease: false })];
  // shine streaks on the glass
  const s1 = [WB[0] + Math.cos(2.75) * WB_R, WB[1] + Math.sin(2.75) * WB_R];
  const s2 = [WB[0] + Math.cos(2.45) * WB_R, WB[1] + Math.sin(2.45) * WB_R];
  out.push(line(k.segment([s1[0], s1[1], 8], [s1[0], s1[1], 62], P), "shine"));
  out.push(line(k.segment([s2[0], s2[1], 30], [s2[0], s2[1], 58], P), "shine thin"));
  // base thickening ring and the mould seam
  out.push(line(G.arcOf(BODY_F, 4, WB_R, P), "ln faint"));
  // graduation ticks on the front
  const face = G.angleToward(BODY_F, [Math.cos((60 * Math.PI) / 180), Math.sin((60 * Math.PI) / 180), 0]) + 0.55;
  for (let z = 10; z <= 60; z += 5) {
    const long = z % 10 === 0;
    const a0 = face, a1 = face + (long ? 0.13 : 0.07);
    out.push(line(k.pathOf([at(G.pointOf(BODY_F, z, WB_R, a0)), at(G.pointOf(BODY_F, z, WB_R, a1))]), "ln tick"));
  }
  return out.join("");
}
function neck(c) {
  const out = [];
  const p = turned(c, 78, [[0, NECK_R0], [18, NECK_R0], [19, NECK_R0 + 1.6], [22, NECK_R0 + 1.6]]);
  out.push(solid(p, "m-glass", { crease: false }));
  out.push(line(G.arcOf(up(c, 78), 19, NECK_R0 + 1.6, P), "ln glassline"));
  return out.join("");
}
function stopper(c, hole) {
  const F = up(c, STOP_Z[0]);
  const p = G.lathe([[0, 0], [0, NECK_R0 - 0.6], [9, NECK_R0 + 1.4], [9, 0]], F, P);
  const out = [solid(p, "m-rubber")];
  out.push(`<ellipse class="hole" cx="${f1(at([c[0], c[1], STOP_Z[1]])[0])}" cy="${f1(at([c[0], c[1], STOP_Z[1]])[1])}" rx="${f1(hole * K * 1.0)}" ry="${f1(hole * K * 0.5)}"/>`);
  return out.join("");
}
// thistle funnel: long stem dipping under the acid, a round thistle bulb and an open cup
const STEM_R = 2.4;
const STEM_LOW = 8;
function stemPart(z0, z1) {
  return solid(cyl(NECK_L, STEM_R, z0, z1 - z0, 16), "m-glass m-stem", { crease: false }) + line(k.segment([NECK_L[0] - 1.6, NECK_L[1] + 0.6, z0 + 1], [NECK_L[0] - 1.6, NECK_L[1] + 0.6, z1 - 1], P), "shine thin");
}
function thistleHead() {
  const z = 154;
  const F = up(NECK_L, z);
  const profile = [[0, STEM_R], [2, 4.5, 1], [7, 8, 1], [12, 4.5, 1], [14, 3.2], [16, 4.6], [28, 15], [30, 16.4]];
  const p = G.lathe([[0, 0], ...profile, [30, 0]], F, P);
  const out = [solid(p, "m-glass", { crease: false })];
  // the open mouth of the cup
  const rim = k.pathOf(circ(NECK_L, 15.2, 48).map(([x, y]) => at([x, y, z + 30])), true);
  out.push(`<path class="cup-in" d="${rim}"/>`);
  out.push(`<path id="cupAcid" class="acid-in" d="${k.pathOf(circ(NECK_L, 6, 32).map(([x, y]) => at([x, y, z + 18])), true)}" opacity="0"/>`);
  out.push(line(G.arcOf(F, 14, 3.2, P), "ln glassline"));
  return out.join("");
}

// ---------- delivery tube ----------
const TUBE_R = 2.6;
const TUBE_END = [TR[0] - 17, TR[1], 7.5];
const TUBE_ROUTE = G.fillet([[NECK_R[0], NECK_R[1], 94], [NECK_R[0], NECK_R[1], 132], [24, NECK_R[1], 132], [24, TR[1], 7.5], TUBE_END], 9, 8);
function tube(points, cls = "") {
  const d = k.pathOf(points.map(at));
  const w = TUBE_R * 2 * K;
  return `<g class="tube ${cls}"><path class="tube-ink" d="${d}" stroke-width="${f1(w + 2.6)}"/><path class="tube-glass" d="${d}" stroke-width="${f1(w)}"/><path class="tube-shine" d="${d}" stroke-width="${f1(w * 0.28)}" transform="translate(${f1(-w * 0.22)} ${f1(-w * 0.12)})"/></g>`;
}
function tubeCap(p) {
  const [x, y] = at(p);
  return `<ellipse class="tube-end" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(TUBE_R * K * 0.55)}" ry="${f1(TUBE_R * K * 1.05)}"/>`;
}

// ---------- trough, beehive shelf, jars ----------
const TROUGH_F = up(TR, 0);
function troughBack() {
  const out = [];
  const p = turned(TR, 0, [[0, TR_R], [TR_H, TR_R]]);
  out.push(`<path class="glass-back" d="${p.fill}"/>`);
  // inside of the back wall and the floor
  out.push(`<path class="glass-floor" d="${k.pathOf(circ(TR, TR_R - 2, 72).map(([x, y]) => at([x, y, 3])), true)}"/>`);
  out.push(line(G.arcOf(TROUGH_F, TR_H, TR_R - 2, P, { inward: true }), "ln glassline"));
  return out.join("");
}
function beehive() {
  const F = up(TR, 3);
  const p = G.solidOf([[0, 19], [3, 19], [5, 18, 1], [9, 15, 1], [12, 11]], F, P);
  const out = [solid(p, "m-terra")];
  out.push(line(G.arcOf(F, 3, 19, P), "ln faint"));
  // hole on top where the gas goes up into the jar
  const [hx, hy] = at([TR[0], TR[1], BEE_TOP]);
  out.push(`<ellipse class="hole" cx="${f1(hx)}" cy="${f1(hy)}" rx="${f1(4 * K)}" ry="${f1(2 * K)}"/>`);
  // side slot (the arch the delivery tube goes into), on the -x side
  const slot = [];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; const yy = TR[1] + Math.cos(a) * 4.2; const zz = 3 + Math.sin(a) * 7; slot.push(at([TR[0] - 18.4 + (1 - Math.sin(a)) * 0.3, yy, zz])); }
  out.push(`<path class="hole" d="${k.pathOf(slot, true)}"/>`);
  return out.join("");
}
const JAR_PROFILE = [[0, JAR_R + 1.6], [3, JAR_R + 1.6], [3.4, JAR_R], [JAR_H - 6, JAR_R, 1], [JAR_H - 2, JAR_R - 3, 1], [JAR_H, JAR_R - 7]];
function jarGlass(c, z, flipped, id) {
  // flipped: inverted (mouth down) — the profile above already reads mouth at z
  const p = turned(c, z, JAR_PROFILE);
  const out = [];
  out.push(`<path class="glass-back" d="${p.fill}"/>`);
  return { back: out.join(""), p };
}
function jarFront(c, z, withScale) {
  const p = turned(c, z, JAR_PROFILE);
  const out = [solid(p, "m-glass", { crease: false })];
  const F = up(c, z);
  out.push(line(G.arcOf(F, 3.4, JAR_R, P), "ln glassline"));
  const s1 = [c[0] + Math.cos(2.7) * JAR_R, c[1] + Math.sin(2.7) * JAR_R];
  out.push(line(k.segment([s1[0], s1[1], z + 8], [s1[0], s1[1], z + JAR_H - 10], P), "shine"));
  if (withScale) {
    // mL scale on the inverted jar: 0 at the top (closed end), 112 at the mouth
    const face = G.angleToward(F, [0.5, 0.866, 0]) + 0.42;
    const top = JAR_H - 6, bottom = 6;
    for (let i = 0; i <= 8; i++) {
      const s = top - ((top - bottom) * i) / 8;
      const long = i % 2 === 0;
      out.push(line(k.pathOf([at(G.pointOf(F, s, JAR_R, face)), at(G.pointOf(F, s, JAR_R, face + (long ? 0.32 : 0.18)))]), "ln tick"));
      if (long && i > 0) {
        const [x, y] = at(G.pointOf(F, s, JAR_R, face + 0.36));
        out.push(`<text class="jar-num" x="${f1(x + 1)}" y="${f1(y + 2)}">${Math.round((112 * i) / 8)}</text>`);
      }
    }
    const [x, y] = at(G.pointOf(F, top + 1.5, JAR_R, face + 0.36));
    out.push(`<text class="jar-num" x="${f1(x + 1)}" y="${f1(y + 1)}">mL≈</text>`);
  }
  return out.join("");
}
function plate(c) {
  const pl = { x: c[0] - 22, y: c[1] - 22, w: 44, d: 44, r: 1.5 };
  return solid(slab(pl, 0, 1.8, 2, 0.5), "m-glass m-plate");
}
function troughFront() {
  const p = turned(TR, 0, [[0, TR_R], [TR_H, TR_R]]);
  const out = [solid(p, "m-glass", { crease: false })];
  out.push(line(G.arcOf(TROUGH_F, 3, TR_R, P), "ln glassline"));
  out.push(line(G.arcOf(TROUGH_F, TR_H - 3, TR_R, P), "ln glassline"));
  const s1 = [TR[0] + Math.cos(2.9) * TR_R, TR[1] + Math.sin(2.9) * TR_R];
  out.push(line(k.segment([s1[0], s1[1], 8], [s1[0], s1[1], TR_H - 8], P), "shine"));
  return out.join("");
}
function troughWater() {
  const p = turned(TR, 3, [[0, TR_R - 1.5], [WATER - 3, TR_R - 1.5]]);
  return `<g class="water"><path class="w-body" d="${p.fill}"/><path class="w-top" d="${p.top}"/>${line(G.arcOf(up(TR, 0), WATER, TR_R - 1.5, P, { inward: false }), "ln waterline")}</g>`;
}

// ---------- acid bottle ----------
function acidBottle() {
  const out = [];
  const F = up(ACID, 0);
  const prof = [[0, 16], [40, 16], [44, 13, 1], [48, 8, 1], [50, 6], [58, 6], [60, 7], [62, 7]];
  out.push(solid(turned(ACID, 0, prof), "m-amber", { crease: false }));
  out.push(line(G.arcOf(F, 3, 16, P), "ln faint"));
  // glass stopper
  out.push(solid(turned(ACID, 62, [[0, 4], [3, 4], [6, 7, 1], [9, 6.5, 1], [11, 3]]), "m-glass-s"));
  // paper label wrapped on the front
  const face = G.angleToward(F, [0.5, 0.866, 0]);
  const lab = [];
  for (let i = 0; i <= 12; i++) lab.push(at(G.pointOf(F, 30, 16.2, face - 0.85 + (1.7 * i) / 12)));
  for (let i = 12; i >= 0; i--) lab.push(at(G.pointOf(F, 14, 16.2, face - 0.85 + (1.7 * i) / 12)));
  out.push(`<path class="label" d="${k.pathOf(lab, true)}"/>`);
  const [tx, ty] = at(G.pointOf(F, 22, 16.2, face - 0.08));
  out.push(`<text class="label-t" x="${f1(tx)}" y="${f1(ty + 3)}" text-anchor="middle">dil. HCl</text>`);
  out.push(line(k.pathOf([0, 1, 2, 3, 4, 5, 6].map((i) => at(G.pointOf(F, 17.5, 16.2, face - 0.6 + (1.2 * i) / 6)))), "ln faint"));
  // a skull-free friendly warning mark: two little stripes
  return out.join("");
}

// ---------- splint and matchbox ----------
function splint() {
  const out = [];
  out.push(solid(slab(SPLINT, 0, 2.2, 2, 0.3), "m-splint"));
  out.push(solid(slab({ x: SPLINT.x, y: SPLINT.y, w: 6, d: SPLINT.d, r: 1 }, 0.01, 2.22, 2, 0), "m-char", { crease: false }));
  return out.join("");
}
function matchbox() {
  const mb = { x: 160, y: 62, w: 24, d: 14, r: 1 };
  const out = [solid(slab(mb, 0, 7, 2, 0.4), "m-box")];
  out.push(solid(slab({ x: mb.x + 0.5, y: mb.y + mb.d - 0.2, w: mb.w - 1, d: 0.4, r: 0 }, 1.5, 4, 1, 0), "m-strike", { crease: false }));
  out.push(line(k.lineOnTop([mb.x, mb.y + 4], [mb.x + mb.w, mb.y + 4], 7, P), "ln faint"));
  return out.join("");
}

// ---------- magnifier on its stand ----------
const LENS_C = (() => { const a = (60 * Math.PI) / 180 + 0.1; return at([WB[0] + Math.cos(a) * WB_R, WB[1] + Math.sin(a) * WB_R, 24]); })();
const LENS_R = 36;
function magnifier() {
  const out = [];
  out.push(solid(cyl(MAG, 10, 0, 3, 32, 0.5), "m-steel-d"));
  out.push(solid(cyl(MAG, 2, 3, 26, 16), "m-steel", { crease: false }));
  out.push(solid(cyl(MAG, 3.2, 27, 4, 16), "m-brass"));
  const [hx, hy] = at([MAG[0], MAG[1], 31]);
  const ang = Math.atan2(LENS_C[1] - hy, LENS_C[0] - hx);
  const ex = LENS_C[0] - Math.cos(ang) * (LENS_R + 3), ey = LENS_C[1] - Math.sin(ang) * (LENS_R + 3);
  out.push(`<path class="handle-ink" d="M${f1(hx)} ${f1(hy)}L${f1(ex)} ${f1(ey)}"/><path class="handle" d="M${f1(hx)} ${f1(hy)}L${f1(ex)} ${f1(ey)}"/>`);
  out.push(`<circle class="dot screw" cx="${f1(hx)}" cy="${f1(hy)}" r="1.6"/>`);
  return out.join("");
}
function lens() {
  const [cx, cy] = LENS_C;
  return `<g class="lens"><circle class="lens-shadow" cx="${f1(cx + 4)}" cy="${f1(cy + 5)}" r="${LENS_R + 4}"/>
  <circle class="lens-rim-d" cx="${f1(cx)}" cy="${f1(cy)}" r="${LENS_R + 4.5}"/>
  <circle class="lens-rim" cx="${f1(cx - 0.8)}" cy="${f1(cy - 0.8)}" r="${LENS_R + 3.2}"/>
  <g clip-path="url(#lensClip)"><use href="#ions" transform="translate(${f1(cx - LENS_R)} ${f1(cy - LENS_R)}) scale(${f1((LENS_R * 2) / 240 * 1000) / 1000})"/></g>
  <circle class="lens-glass" cx="${f1(cx)}" cy="${f1(cy)}" r="${LENS_R}"/>
  <path class="lens-glint" d="M${f1(cx - LENS_R * 0.62)} ${f1(cy - LENS_R * 0.35)}A${f1(LENS_R * 0.72)} ${f1(LENS_R * 0.72)} 0 0 1 ${f1(cx - LENS_R * 0.2)} ${f1(cy - LENS_R * 0.7)}"/>
  <circle class="dot screw" cx="${f1(cx)}" cy="${f1(cy - LENS_R - 3.8)}" r="1.1"/><circle class="dot screw" cx="${f1(cx)}" cy="${f1(cy + LENS_R + 3.8)}" r="1.1"/>
  </g>`;
}

// ---------- ion scene (drawn once, shown in the panel and through the lens) ----------
function ionScene() {
  const atoms = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
    const x = 8 + i * 28 + (row ? 14 : 0), y = 206 + row * 22;
    atoms.push(`<g class="atom metal-atom" data-row="${row}" data-i="${i}"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y + 3.6}">${"Zn"}</text></g>`);
  }
  return `<g id="ions">
    <rect class="ion-bg" x="0" y="0" width="240" height="240"/>
    <rect id="ionLiquid" class="ion-liquid" x="0" y="0" width="240" height="200" opacity="0"/>
    <g id="ionClFixed"></g>
    <g id="ionSurface">${atoms.join("")}</g>
    <g id="ionMoving"></g>
    <text id="ionCap" class="ion-cap" x="120" y="46" text-anchor="middle"></text>
  </g>`;
}

// ---------- assemble the figure ----------
const bottleLow = stemPart(STEM_LOW, 96);
const JAR_Z = BEE_TOP;
const SVG = `<svg class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="A Woulfe bottle with zinc and dilute hydrochloric acid makes hydrogen. A thistle funnel dips under the acid, a bent delivery tube carries the gas to a trough of water, and an upside-down gas jar on a beehive shelf collects it as the gas pushes the water down.">
<defs>
  <clipPath id="benchTop"><path d="${k.slabOf(BENCH, 0, 0.01, P, 6).fill}"/></clipPath>
  <clipPath id="lensClip"><circle cx="${f1(LENS_C[0])}" cy="${f1(LENS_C[1])}" r="${LENS_R}"/></clipPath>
</defs>
<g id="scene">
${bench()}
${shadows()}
${clampStand()}
<g id="spareBack"><g clip-path="url(#benchTop)">${shadow(circ(SPARES[0], JAR_R), 56)}</g>${plate(SPARES[0])}${jarGlass(SPARES[0], 1.8).back}${jarFront(SPARES[0], 1.8, false)}</g>
<g id="bottle">
  ${bottleBack()}
  <g id="granules" opacity="0">${granules()}</g>
  ${bottleLow}
  <g id="acid"><path class="acid-body" d=""/><path class="acid-top" d=""/><path class="acid-line" d=""/></g>
  <g id="stemAcid"><path class="acid-body" d=""/></g>
  <g id="bubblesA"></g>
  ${bottleFront()}
  ${neck(NECK_L)}${neck(NECK_R)}
  ${tube([[NECK_R[0], NECK_R[1], 92], [NECK_R[0], NECK_R[1], 101]], "inner")}
  ${stopper(NECK_L, STEM_R)}${stopper(NECK_R, TUBE_R)}
</g>
${stemPart(STOP_Z[1] - 1, CLAMP_Z - 2)}
${clampJaw()}
${stemPart(CLAMP_Z + 6, 155)}
${thistleHead()}
${troughBack()}
${tube(TUBE_ROUTE)}
${tubeCap(TUBE_END)}
${beehive()}
<g id="jarGrp">
  ${jarGlass(TR, JAR_Z).back}
  <g id="jarWater"><path class="jw-body" d=""/><path class="jw-top" d=""/><path class="jg-body" d=""/></g>
  <g id="bubblesT"></g>
  <text id="jarLabel" class="jar-gas" text-anchor="middle"></text>
  ${jarFront(TR, JAR_Z, true)}
</g>
${troughWater()}
${troughFront()}
<g id="spareFront"><g clip-path="url(#benchTop)">${shadow(circ(SPARES[1], JAR_R), 56)}</g>${plate(SPARES[1])}${jarGlass(SPARES[1], 1.8).back}${jarFront(SPARES[1], 1.8, false)}</g>
${matchbox()}
<g id="splint">${splint()}<g id="flame" opacity="0"><path class="flame-o" d=""/><path class="flame-i" d=""/></g></g>
${magnifier()}
${lens()}
<g id="acidBottle">${acidBottle()}<path id="pour" class="pour" d="" opacity="0"/></g>
<g id="popFlash" opacity="0"></g>
<g id="words"></g>
</g>
</svg>`;

// ---------- data the page needs ----------
const DATA = {
  P, WB, WB_R, NECK_L, STEM_R, STEM_LOW, ACID_TOP, TR, TR_R, WATER, BEE_TOP, JAR_R, JAR_H, JAR_Z, JAR_LIFT,
  TUBE_END, ACID, SPLINT_TIP, SPLINT_TEST, LENS_C, LENS_R,
  CUP: at([NECK_L[0], NECK_L[1], 184]),
  POUR_FROM: [ACID[0], ACID[1], 62],
  SPOTS: { zinc: at([WB[0], WB[1], 110]), acid: at([NECK_L[0] + 40, NECK_L[1], 215]), fizz: at([WB[0] + 30, WB[1], 70]), trough: at([TR[0] + 50, TR[1], 80]), pop: at([TR[0], TR[1], BEE_TOP + JAR_LIFT + JAR_H + 6]) },
};

const STEPS = [
  { key: "zinc", label: "Add zinc", hint: "Drop the little zinc pieces into the bottle.", word: "plink plink",
    note: "Papa’s note: we use <b>granulated</b> zinc. It has a tiny bit of copper in it, and that helps it react faster, like a helper." },
  { key: "acid", label: "Pour the acid", hint: "Pour the acid in till the funnel’s tip is under it.", word: "glug glug",
    note: "Papa’s note: the funnel’s tip must sit <b>under</b> the acid. Otherwise the gas would sneak out through the funnel." },
  { key: "fizz", label: "Watch it fizz", hint: "Zinc pushes hydrogen out of the acid — see the bubbles!", word: "fizz",
    note: "Papa’s note: zinc swaps places with hydrogen. The zinc chloride it makes stays dissolved in the liquid. Look in the magnifier!" },
  { key: "air", label: "Let the air out", hint: "The first bubbles are just air from the bottle. Let them go!", word: "bubble-bubble",
    note: "Papa’s note: the first jar is mostly the air that was already in the bottle and tube. We throw it away, because hydrogen mixed with air can explode if lit." },
  { key: "collect", label: "Collect over water", hint: "Hydrogen pushes the water down and fills the jar.", word: "bubble-bubble",
    note: "Papa’s note: hydrogen hardly dissolves in water, so it can push the water out of the jar. We don’t collect it in air: a hydrogen–air mix is explosive." },
  { key: "test", label: "Splint test", hint: "Bring a lit splint to the jar’s mouth… POP!", word: "POP!",
    note: "Papa’s note: hydrogen burns with a <b>pop</b> sound and a pale blue flame. That’s the test! We hold the jar mouth down because hydrogen is lighter than air." },
  { key: "next", label: "New jar", hint: "Slide a fresh jar on the shelf and collect more.", word: "bubble-bubble",
    note: "Papa’s note: no nitric acid or strong sulphuric acid for this. They are oxidising agents, so they don’t give us hydrogen (they give other gases instead)." },
];

const css = readFileSync(join(HERE, "page.css"), "utf8");
const live = readFileSync(join(HERE, "live.js"), "utf8");

const ladder = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "H", "Cu", "Hg", "Ag", "Au"];
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>The Hydrogen Machine</title>
<style>${css}</style>
</head>
<body>
<main class="page">
  <header class="top">
    <p class="hello">Hey Sairah, it’s Papa. Let’s make some hydrogen together!</p>
    <h1>The Hydrogen Machine</h1>
  </header>

  <section class="lab" aria-label="The hydrogen machine">
    <nav class="steps" aria-label="Steps">
      <ol>
        ${STEPS.map((s, i) => `<li><button class="step" type="button" data-step="${i}" disabled><span class="num" aria-hidden="true">${i + 1}</span><span class="tick" aria-hidden="true">✓</span><span class="lbl">${s.label}</span></button></li>`).join("")}
      </ol>
      <div class="modes">
        <label class="auto"><input type="checkbox" id="auto"> <span>Auto play</span></label>
        <label class="auto"><input type="checkbox" id="sound"> <span>Sound</span></label>
        <a href="#" id="restart" class="restart">Start over</a>
      </div>
    </nav>

    <div class="stage">
      <div class="hint" aria-live="polite"><span class="hint-bubble" id="hint">Tap step 1 to start.</span></div>
      <div class="eq" aria-label="Equation"><span id="eqA" class="eqp">Zn</span> <span id="eqB" class="eqp">+ 2HCl</span> <span id="eqC" class="eqp">→ ZnCl₂ + H₂↑</span></div>
      <div class="card">
        <div class="corner fig">Fig 1</div>
        <div class="corner title" id="figTitle">Hydrogen from zinc &amp; acid</div>
        ${SVG}
        <div class="corner readout" id="readout"></div>
      </div>
      <p class="note" id="note"></p>
      <p class="big">A more reactive metal pushes hydrogen out of the acid.</p>
    </div>

    <aside class="side">
      <div class="panel lens-panel">
        <h2>Papa’s magnifier</h2>
        <svg class="ionsvg" viewBox="0 0 240 240" role="img" aria-label="Close-up inside the bottle: metal atoms on the surface, hydrogen ions and chloride ions in the acid. A metal atom leaves as an ion, and two hydrogen ions join to make one hydrogen molecule that floats up as a bubble.">
          <defs><clipPath id="ionClip"><circle cx="120" cy="120" r="116"/></clipPath></defs>
          <g clip-path="url(#ionClip)">${ionScene()}</g>
          <circle class="ion-rim" cx="120" cy="120" r="116"/>
        </svg>
        <p class="legend"><span class="key k-h">H⁺</span> <span class="key k-cl">Cl⁻</span> <span class="key k-m" id="keyM">Zn²⁺</span> <span class="key k-h2">H₂</span></p>
      </div>
      <div class="panel gauges" aria-label="Numbers from the model">
        <div class="chip"><span class="cl" id="gUsedL">Zinc used</span><b id="gUsed">≈ 0 g</b></div>
        <div class="chip"><span class="cl">H₂ made</span><b id="gMade">≈ 0 mL</b></div>
        <div class="chip"><span class="cl">Gas in jar</span><b id="gJar">≈ 0 mL</b></div>
        <div class="chip"><span class="cl">Bubbles</span><b id="gRate">0 /s</b></div>
        <div class="chip"><span class="cl">Jars of H₂</span><b id="gJars">0</b></div>
        <div class="chip"><span class="cl">Air left inside</span><b id="gAir">≈ 112 mL</b></div>
        <p class="foot">≈ numbers are approximate, at room-ish conditions / STP (1 mole of gas ≈ 22.4 L). Bubble rate is a friendly relative number.</p>
      </div>
      <div class="panel metals">
        <h2>Try another metal</h2>
        <div class="seg" role="radiogroup" aria-label="Metal">
          ${["Mg", "Zn", "Fe", "Cu"].map((m) => `<button type="button" role="radio" class="segb" data-metal="${m}" aria-checked="${m === "Zn"}">${m}<small>${{ Mg: "fast", Zn: "steady", Fe: "slow", Cu: "nothing" }[m]}</small></button>`).join("")}
        </div>
        <ol class="ladder" aria-label="Reactivity series, most reactive first">
          ${ladder.map((m) => `<li data-el="${m}"${m === "H" ? ' class="hyd"' : ""}>${m}</li>`).join('<li class="gap" aria-hidden="true">›</li>')}
        </ol>
        <p class="ladder-note" id="ladderNote"></p>
      </div>
    </aside>
  </section>

  <section class="guess">
    <h2>Can you guess why?</h2>
    ${[
      "Why do you think the thistle funnel's tip has to stay under the acid?",
      "We let the first bubbles go. Can you guess why?",
      "Why do you think we collect hydrogen over water and not just in an open jar of air?",
      "If we swapped zinc for copper, what do you think would happen — and why?",
    ].map((q, i) => `<label class="q"><span>${q}</span><textarea id="guess${i + 1}" rows="3" placeholder="Write what you think…"></textarea></label>`).join("")}
    <p class="saved">Your answers stay on this device only.</p>
  </section>
</main>
<script>
${KIT_SRC.replace(/<\/(script)/gi, "<\\/$1")}
${MODEL_SRC}
const DATA = ${JSON.stringify(DATA)};
const STEPS = ${JSON.stringify(STEPS)};
${live}
</script>
</body></html>`;

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html", (html.length / 1024).toFixed(0) + " KB");
