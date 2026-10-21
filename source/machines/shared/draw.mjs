// Build-time drawing helpers shared by the Hydrogen-chapter machines.
// Same inked look as machines/hydrogen: 3-tone fills, navy outlines, warm hard shadows.
import * as k from "../hydrogen/kit/iso-kit.mjs";
import * as G from "../hydrogen/kit/lathe.mjs";

export { k, G };

export function drawKit(P) {
  const at = (p) => k.iso(p, P);
  const f1 = (v) => Math.round(v * 10) / 10;
  const K = G.scaleOf(P);

  function solid(p, mat, { crease = true, cls = "", extra = "", attrs = "" } = {}) {
    const sh = p.shades.map((d, i) => (d ? `<path class="h${i}" d="${d}"/>` : "")).join("");
    return `<g class="s ${mat} ${cls}"${p.seamless ? " data-seamless" : ""}${attrs}><path class="f" d="${p.fill}"/>${sh}${p.top ? `<path class="t" d="${p.top}"/>` : ""}${crease && p.crease ? `<path class="c" d="${p.crease}"/>` : ""}${p.bevel ? `<path class="b" d="${p.bevel}"/>` : ""}${extra}<path class="o" d="${p.outline}"/></g>`;
  }
  const line = (d, cls = "ln") => (d ? `<path class="${cls}" d="${d}"/>` : "");
  const dots = (pts, r = 0.9, cls = "dot") => pts.map((p) => { const [x, y] = at(p); return `<circle class="${cls}" cx="${f1(x)}" cy="${f1(y)}" r="${r}"/>`; }).join("");
  const slab = (plan, z, h, steps = 3, bevel = 0.6) => k.slabOf(plan, z, h, P, steps, bevel);
  const cyl = (c, r, z, h, steps = 28, bevel = 0) => k.cylinder(c[0], c[1], r, z, h, P, steps, bevel);
  const up = (c, z) => G.frameOf([c[0], c[1], z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const alongX = (o) => G.frameOf(o, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const turned = (c, z, profile, opts) => G.solidOf(profile, up(c, z), P, opts);
  const circ = (c, r, n = 40) => k.circleRing(c[0], c[1], r, n);
  const ringAt = (c, r, z, n = 48) => k.pathOf(circ(c, r, n).map(([x, y]) => at([x, y, z])), true);
  const depth = (p) => k.depthOf([p[0], p[1], p[2] || 0], P);

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

  // ---------- the wooden bench, same as the Hydrogen Machine ----------
  function bench(B, label) {
    const out = [];
    out.push(`<path class="shd paper" d="${k.slabOf(k.insetPlan(B, -6), -40, 0.1, P).fill}" transform="translate(10 8)"/>`);
    for (const [x, y] of k.corners(B, 16)) out.push(solid(cyl([x, y], 9, -40, 12, 24), "m-wood-d"));
    out.push(solid(slab(k.insetPlan(B, 8), -28, 14, 4, 0), "m-wood-d"));
    out.push(solid(slab(B, -14, 14, 6, 1.2), "m-wood"));
    const ys = [B.y + B.d * 0.225, B.y + B.d * 0.4875, B.y + B.d * 0.75];
    for (const y of ys) out.push(line(k.lineOnTop([B.x, y], [B.x + B.w, y], 0, P), "ln faint"));
    for (const y of ys) out.push(line(k.segment([B.x + B.w, y, 0], [B.x + B.w, y, -14], P), "ln faint"));
    const apron = k.insetPlan(B, 8);
    out.push(dots([-0.4, -0.13, 0.13, 0.4].map((f) => [B.x + B.w / 2 + f * B.w, apron.y + apron.d, -21]), 1.1, "dot screw"));
    const plate = { x: B.x + B.w / 2 - 38, y: B.y + B.d - 0.6, w: 76, d: 0.8, r: 0.4 };
    out.push(solid(slab(plate, -12, 10, 2, 0), "m-brass", { crease: false }));
    out.push(`<text class="engrave" transform="${k.sideMatrix([plate.x + 38, plate.y + plate.d, -5], -5, P, "left")}" font-size="5.6" text-anchor="middle">${label}</text>`);
    out.push(dots([[plate.x + 3, plate.y + plate.d, -7], [plate.x + 73, plate.y + plate.d, -7]], 0.9, "dot screw"));
    return out.join("");
  }

  // ---------- clamp stand: base plate, rod, boss and an arm along +x or +y ----------
  function clampStand(rod, h = 170) {
    const out = [];
    const base = { x: rod[0] - 16, y: rod[1] - 24, w: 30, d: 48, r: 3 };
    out.push(solid(slab(base, 0, 6, 4, 0.8), "m-steel-d"));
    out.push(dots(k.corners(base, 4).map(([x, y]) => [x, y, 6]), 1, "dot screw"));
    out.push(solid(cyl(rod, 4.5, 6, 4, 20), "m-steel"));
    out.push(solid(cyl(rod, 2.6, 10, h, 20), "m-steel", { crease: false }));
    out.push(solid(cyl(rod, 3.2, h + 10, 2.4, 20), "m-steel"));
    return out.join("");
  }
  function boss(rod, z, dir = "x", reach = 30) {
    const out = [];
    const b = { x: rod[0] - 5, y: rod[1] - 5, w: 10, d: 10, r: 1.5 };
    out.push(solid(slab(b, z - 6, 14, 3, 0.5), "m-steel-d"));
    out.push(solid(cyl([rod[0], rod[1] + 7], 2.6, z + 1, 4, 16), "m-brass"));
    out.push(line(k.knurl(rod[0], rod[1] + 7, 2.6, z + 1, z + 5, 14, P), "ln faint"));
    const arm = dir === "x" ? { x: rod[0] + 5, y: rod[1] - 2.2, w: reach, d: 4.4, r: 1 } : { x: rod[0] - 2.2, y: rod[1] + 5, w: 4.4, d: reach, r: 1 };
    out.push(solid(slab(arm, z, 4, 2, 0.4), "m-steel"));
    return out.join("");
  }

  // ---------- glass and rubber tubing (stroked polylines) ----------
  function tube(points, r = 2.6, cls = "") {
    const d = k.pathOf(points.map(at));
    const w = r * 2 * K;
    return `<g class="tube ${cls}"><path class="tube-ink" d="${d}" stroke-width="${f1(w + 2.6)}"/><path class="tube-glass" d="${d}" stroke-width="${f1(w)}"/><path class="tube-shine" d="${d}" stroke-width="${f1(w * 0.28)}" transform="translate(${f1(-w * 0.22)} ${f1(-w * 0.12)})"/></g>`;
  }
  function hose(points, r = 3) {
    const d = k.pathOf(points.map(at));
    const w = r * 2 * K;
    return `<g class="hose"><path class="hose-ink" d="${d}" stroke-width="${f1(w + 2.6)}"/><path class="hose-body" d="${d}" stroke-width="${f1(w)}"/><path class="hose-shine" d="${d}" stroke-width="${f1(w * 0.25)}" transform="translate(${f1(-w * 0.2)} ${f1(-w * 0.14)})"/></g>`;
  }
  function tubeCap(p, r = 2.6, vertical = true) {
    const [x, y] = at(p);
    return vertical
      ? `<ellipse class="tube-end" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * K * 1.0)}" ry="${f1(r * K * 0.5)}"/>`
      : `<ellipse class="tube-end" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * K * 0.55)}" ry="${f1(r * K * 1.05)}"/>`;
  }

  // ---------- gas jars (r 17, h 92), inverted or upright, and glass plates ----------
  const JAR_R = 17, JAR_H = 92;
  const JAR_DOWN = [[0, JAR_R + 1.6], [3, JAR_R + 1.6], [3.4, JAR_R], [JAR_H - 6, JAR_R, 1], [JAR_H - 2, JAR_R - 3, 1], [JAR_H, JAR_R - 7]];
  const JAR_UP = [[0, JAR_R - 7], [2, JAR_R - 3, 1], [6, JAR_R, 1], [JAR_H - 3.4, JAR_R], [JAR_H - 3, JAR_R + 1.6], [JAR_H, JAR_R + 1.6]];
  const jarSolid = (c, z, upright) => turned(c, z, upright ? JAR_UP : JAR_DOWN);
  const jarBack = (c, z, upright = false) => `<path class="glass-back" d="${jarSolid(c, z, upright).fill}"/>`;
  function jarFront(c, z, upright = false) {
    const p = jarSolid(c, z, upright);
    const out = [solid(p, "m-glass", { crease: false })];
    const F = up(c, z);
    out.push(line(G.arcOf(F, upright ? JAR_H - 3.4 : 3.4, JAR_R, P), "ln glassline"));
    const s1 = [c[0] + Math.cos(2.7) * JAR_R, c[1] + Math.sin(2.7) * JAR_R];
    out.push(line(k.segment([s1[0], s1[1], z + 8], [s1[0], s1[1], z + JAR_H - 10], P), "shine"));
    return out.join("");
  }
  const glassPlate = (c, z = 0, s = 22) => solid(slab({ x: c[0] - s, y: c[1] - s, w: s * 2, d: s * 2, r: 1.5 }, z, 1.8, 2, 0.5), "m-glass m-plate");

  // ---------- Bunsen burner (flame drawn live into #id) ----------
  function burner(c, id, hoseTo) {
    const out = [];
    out.push(solid(turned(c, 0, [[0, 11], [3, 11], [4, 9, 1], [6, 4]]), "m-steel-d"));
    out.push(line(G.arcOf(up(c, 0), 1.5, 11, P), "ln faint"));
    out.push(solid(cyl([c[0] + 6, c[1]], 1.6, 2.5, 3, 12), "m-brass"));
    out.push(solid(cyl(c, 3.2, 6, 28, 20), "m-brass", { crease: false }));
    out.push(solid(cyl(c, 4, 10, 5, 20), "m-steel"));
    out.push(line(k.segment([c[0] - 2, c[1] + 3.5, 11], [c[0] - 2, c[1] + 3.5, 14], P), "ln"));
    out.push(`<ellipse class="hole" cx="${f1(at([c[0], c[1], 34])[0])}" cy="${f1(at([c[0], c[1], 34])[1])}" rx="${f1(2.4 * K)}" ry="${f1(1.2 * K)}"/>`);
    out.push(`<g id="${id}" opacity="0"><path class="bflame-o" d=""/><path class="bflame-i" d=""/></g>`);
    return { body: out.join(""), hose: hoseTo ? hose([[c[0] + 9, c[1], 4], ...hoseTo], 1.8) : "", tip: [c[0], c[1], 34] };
  }

  // ---------- small things ----------
  function splint(S) {
    return solid(slab(S, 0, 2.2, 2, 0.3), "m-splint") + solid(slab({ x: S.x, y: S.y, w: 6, d: S.d, r: 1 }, 0.01, 2.22, 2, 0), "m-char", { crease: false });
  }
  function matchbox(mb) {
    const out = [solid(slab(mb, 0, 7, 2, 0.4), "m-box")];
    out.push(solid(slab({ x: mb.x + 0.5, y: mb.y + mb.d - 0.2, w: mb.w - 1, d: 0.4, r: 0 }, 1.5, 4, 1, 0), "m-strike", { crease: false }));
    out.push(line(k.lineOnTop([mb.x, mb.y + 4], [mb.x + mb.w, mb.y + 4], 7, P), "ln faint"));
    return out.join("");
  }
  // a paper label wrapped on a round bottle
  function wrapLabel(F, z0, z1, r, label, face, wide = 0.85, cls = "label-t") {
    const lab = [];
    for (let i = 0; i <= 12; i++) lab.push(at(G.pointOf(F, z1, r + 0.2, face - wide + (2 * wide * i) / 12)));
    for (let i = 12; i >= 0; i--) lab.push(at(G.pointOf(F, z0, r + 0.2, face - wide + (2 * wide * i) / 12)));
    const [tx, ty] = at(G.pointOf(F, (z0 + z1) / 2, r + 0.2, face - 0.08));
    return `<path class="label" d="${k.pathOf(lab, true)}"/><text class="${cls}" x="${f1(tx)}" y="${f1(ty + 3)}" text-anchor="middle">${label}</text>`;
  }
  // the brass magnifier rim drawn on the figure, showing #ions
  function lens(c, r, id = "lensClip") {
    const [cx, cy] = c;
    return `<g class="lens"><circle class="lens-shadow" cx="${f1(cx + 4)}" cy="${f1(cy + 5)}" r="${r + 4}"/>
    <circle class="lens-rim-d" cx="${f1(cx)}" cy="${f1(cy)}" r="${r + 4.5}"/>
    <circle class="lens-rim" cx="${f1(cx - 0.8)}" cy="${f1(cy - 0.8)}" r="${r + 3.2}"/>
    <g clip-path="url(#${id})"><use href="#ions" transform="translate(${f1(cx - r)} ${f1(cy - r)}) scale(${f1(((r * 2) / 240) * 1000) / 1000})"/></g>
    <circle class="lens-glass" cx="${f1(cx)}" cy="${f1(cy)}" r="${r}"/>
    <path class="lens-glint" d="M${f1(cx - r * 0.62)} ${f1(cy - r * 0.35)}A${f1(r * 0.72)} ${f1(r * 0.72)} 0 0 1 ${f1(cx - r * 0.2)} ${f1(cy - r * 0.7)}"/>
    <circle class="dot screw" cx="${f1(cx)}" cy="${f1(cy - r - 3.8)}" r="1.1"/><circle class="dot screw" cx="${f1(cx)}" cy="${f1(cy + r + 3.8)}" r="1.1"/></g>`;
  }

  return { at, f1, K, solid, line, dots, slab, cyl, up, alongX, turned, circ, ringAt, depth, hull, shadow, bench, clampStand, boss, tube, hose, tubeCap, JAR_R, JAR_H, jarBack, jarFront, glassPlate, burner, splint, matchbox, wrapLabel, lens };
}
