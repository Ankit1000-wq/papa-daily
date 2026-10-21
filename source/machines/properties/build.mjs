// node build.mjs  ->  writes ../../../machines/properties/index.html (standalone, everything inline)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, drawKit } from "../shared/draw.mjs";
import { page } from "../shared/page.mjs";
import { MODEL_SRC } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../../machines/properties");
const W = 880;
const H = 560;

// ---------- world (units ≈ px, x/y on the bench, z up) ----------
const BENCH = { x: -240, y: -80, w: 456, d: 160, r: 6 };
const CYL = [-205, -45];        // hydrogen cylinder
const CYL_R = 15;
const VALVE_Z = 118;
const ROD1 = [-188, 24];        // clamp stand holding the bubble funnel
const FUN = [-152, 24];         // funnel, mouth up
const FUN_Z = 48;               // bottom of its stem
const FUN_TOP = 73;
const DISH = [-136, 62];        // soap dish
const J1 = [-100, 20];          // jar 1: mouth down on a plate
const J2 = [-58, -4];          // jar 2: mouth up, plate on top
const J3 = [-17, -28];           // jar 3: mouth up, plate on top (look, litmus)
const J4 = [25, -52];            // jar 4: mouth down on a plate (candle)
const WATCH = [-84, 62];        // stopwatch lying on the bench
const TILE = { x: -52, y: 56, w: 26, d: 14, r: 1 };   // white tile with litmus strips
const HOLD = [58, -6];          // deflagrating spoon in its wooden holder
const ROD2 = [152, -54];        // clamp stand at the jet
const JET = [152, -22];
const JET_TIP = 62;
const DISH2_Z = 96;             // cold china dish above the jet
const MAG = [-122, -50];        // magnifier stand
const SPLINT = { x: 112, y: 70, w: 46, d: 3.2, r: 1.2 };
const SPLINT_TIP = [112, 71.6, 2.2];
const MB = { x: 172, y: 54, w: 24, d: 14, r: 1 };
const PLATE_Z = 1.8;

const P = k.fitProjection(
  [...k.boxCorners(BENCH, -30, 0), [CYL[0], CYL[1], 150], [ROD1[0], ROD1[1], 120], [ROD2[0], ROD2[1], 140], [J2[0], J2[1], 130], [-60, -60, 205]],
  W, H, { pad: 18, azimuth: 60, elevation: 30 },
);
const D = drawKit(P);
const { at, f1, K, solid, line, dots, slab, cyl, up, turned, circ, shadow } = D;

// ---------- the gas cylinder with a two-way brass valve ----------
function cylinder() {
  const out = [];
  out.push(solid(turned(CYL, 0, [[0, CYL_R + 3], [3, CYL_R + 3], [4, CYL_R]]), "m-rubber"));
  const body = [[4, CYL_R], [92, CYL_R], [100, CYL_R - 3, 1], [106, CYL_R - 8, 1], [109, 6], [116, 6]];
  out.push(solid(turned(CYL, 0, body), "m-cyl", { crease: false }));
  const F = up(CYL, 0);
  out.push(line(G.arcOf(F, 12, CYL_R, P), "ln faint"));
  out.push(line(G.arcOf(F, 88, CYL_R, P), "ln faint"));
  const face = G.angleToward(F, [0.5, 0.866, 0]);
  out.push(D.wrapLabel(F, 48, 70, CYL_R, "H₂", face, 0.75, "label-t big"));
  const s1 = [CYL[0] + Math.cos(2.6) * CYL_R, CYL[1] + Math.sin(2.6) * CYL_R];
  out.push(line(k.segment([s1[0], s1[1], 10], [s1[0], s1[1], 86], P), "shine thin"));
  // valve block, hand wheel and two outlets: one to the bubble funnel (+y), one to the jet (+x)
  out.push(solid(slab({ x: CYL[0] - 5, y: CYL[1] - 5, w: 10, d: 10, r: 1.5 }, VALVE_Z - 2, 10, 3, 0.5), "m-brass"));
  out.push(solid(slab({ x: CYL[0] - 1.8, y: CYL[1] + 5, w: 3.6, d: 9, r: 1 }, VALVE_Z + 2, 3.6, 2, 0), "m-brass"));
  out.push(solid(slab({ x: CYL[0] + 5, y: CYL[1] - 1.8, w: 9, d: 3.6, r: 1 }, VALVE_Z + 2, 3.6, 2, 0), "m-brass"));
  out.push(solid(cyl(CYL, 2, VALVE_Z + 8, 4, 12), "m-steel"));
  out.push(solid(cyl(CYL, 7, VALVE_Z + 12, 2.6, 28, 0.4), "m-steel-d"));
  out.push(line(k.knurl(CYL[0], CYL[1], 7, VALVE_Z + 12, VALVE_Z + 14.6, 20, P), "ln faint"));
  return out.join("");
}
const OUT_Y = [CYL[0], CYL[1] + 14, VALVE_Z + 3.8];
const OUT_X = [CYL[0] + 14, CYL[1], VALVE_Z + 3.8];

// ---------- the bubble funnel on its clamp stand, and the soap dish ----------
function funnel() {
  const F = up(FUN, FUN_Z);
  const p = G.lathe([[0, 0], [0, 2.2], [12, 2.2], [13, 3.2, 1], [24, 12.4, 1], [25, 13.2], [25, 0]], F, P);
  const out = [solid(p, "m-glass", { crease: false })];
  out.push(`<path class="soapfilm" d="${D.ringAt(FUN, 12.2, FUN_TOP, 40)}"/>`);
  out.push(line(G.arcOf(F, 12.5, 3, P), "ln glassline"));
  return out.join("");
}
function funnelClamp() {
  const out = [D.boss(ROD1, 54, "x", FUN[0] - ROD1[0] - 9)];
  out.push(solid(turned(FUN, 52, [[0, 4.8], [6, 4.8]], { rims: "all" }), "m-cork"));
  out.push(solid(slab({ x: FUN[0] - 1, y: FUN[1] + 4.4, w: 2, d: 5, r: 0.6 }, 55, 3.4, 2, 0), "m-brass"));
  return out.join("");
}
function soapDish() {
  const out = [];
  out.push(solid(turned(DISH, 0, [[0, 15], [5, 15]], { rims: "all" }), "m-glass"));
  out.push(`<path class="soap" d="${D.ringAt(DISH, 13.6, 3.6, 40)}"/>`);
  out.push(line(k.ring(DISH[0] - 4, DISH[1] + 2, 3, 3.7, P, 16), "ln faint"));
  // a bubble wand: a wire ring and a little wooden handle resting on the rim
  out.push(`<g id="wand">`);
  out.push(line(k.ring(DISH[0] + 2, DISH[1] - 2, 5.5, 5.6, P, 28), "ln wire"));
  out.push(solid(slab({ x: DISH[0] + 7, y: DISH[1] - 3.2, w: 26, d: 2.4, r: 1 }, 5, 2.2, 2, 0.3), "m-splint"));
  out.push(`</g>`);
  return out.join("");
}

// ---------- jars ----------
const jar = (c, upright, id, plateTop, inside = "") => `<g id="${id}">${plateTop ? "" : `<g id="${id}Plate">${D.glassPlate(c, 0)}</g>`}<g id="${id}Jar">${D.jarBack(c, PLATE_Z, upright)}${inside}${D.jarFront(c, PLATE_Z, upright)}<g id="${id}Gas"></g></g>${plateTop ? `<g id="${id}Plate">${D.glassPlate(c, PLATE_Z + D.JAR_H)}</g>` : ""}</g>`;

// ---------- stopwatch lying on the bench ----------
function stopwatch() {
  const out = [];
  out.push(solid(cyl(WATCH, 12, 0, 4, 40, 0.6), "m-steel"));
  out.push(`<path class="dial" d="${D.ringAt(WATCH, 10, 4.05, 48)}"/>`);
  const t = k.radialTicks(WATCH[0], WATCH[1], 9.6, 12, 3, 4.06, [1.4, 2.6], P);
  out.push(line(t.minor, "ln faint"), line(t.major, "ln"));
  out.push(solid(cyl([WATCH[0] + 0.5, WATCH[1] - 13.5], 1.6, 1.4, 2.4, 12), "m-steel-d"));
  out.push(`<path id="watchHand" class="hand" d=""/>`);
  out.push(dots([[WATCH[0], WATCH[1], 4.1]], 1.1));
  return out.join("");
}

// ---------- litmus tile ----------
const STRIP_B = { x: TILE.x + 4, y: TILE.y + 3.5, w: 18, d: 2.6, r: 0.4 };
const STRIP_R = { x: TILE.x + 4, y: TILE.y + 8, w: 18, d: 2.6, r: 0.4 };
const strips = () => solid(slab(STRIP_B, 0, 0.5, 1, 0), "m-blue", { crease: false }) + solid(slab(STRIP_R, 0, 0.5, 1, 0), "m-red", { crease: false });
function tile() {
  return solid(slab(TILE, 0, 2.2, 2, 0.4), "m-tile") + `<g id="stripsRest" transform="${k.translateAlong(P, [0, 0, 2.2])}">${strips()}</g>`;
}

// ---------- deflagrating spoon with a candle stub ----------
function holder() {
  const b = { x: HOLD[0] - 8, y: HOLD[1] - 8, w: 16, d: 16, r: 2 };
  return solid(slab(b, 0, 7, 3, 0.6), "m-wood-d") + `<ellipse class="hole" cx="${f1(at([HOLD[0], HOLD[1], 7])[0])}" cy="${f1(at([HOLD[0], HOLD[1], 7])[1])}" rx="${f1(1.8 * K)}" ry="${f1(0.9 * K)}"/>`;
}
const CANDLE_TOP = 51;
function spoon() {
  const out = [];
  out.push(solid(cyl(HOLD, 0.9, 7, 33, 10), "m-steel", { crease: false }));
  out.push(solid(turned(HOLD, 40, [[0, 5], [1.4, 5]], { rims: "all" }), "m-brass"));
  out.push(solid(cyl(HOLD, 3, 41.4, CANDLE_TOP - 41.4, 20), "m-candle"));
  out.push(line(k.segment([HOLD[0], HOLD[1], CANDLE_TOP], [HOLD[0], HOLD[1], CANDLE_TOP + 2.2], P), "ln"));
  out.push(`<g id="candleFlame"><path class="flame-o" d=""/><path class="flame-i" d=""/></g><path id="candleSmoke" class="smoke" d="" opacity="0"/>`);
  return out.join("");
}

// ---------- jet with a cold china dish held above it ----------
function jetStand() {
  const out = [D.clampStand(ROD2, 120)];
  out.push(D.boss(ROD2, 38, "y", JET[1] - ROD2[1] - 9));
  out.push(D.boss(ROD2, DISH2_Z - 6, "y", JET[1] - ROD2[1] - 22));
  return out.join("");
}
function jet() {
  const out = [];
  const F = up(JET, 14);
  out.push(solid(G.lathe([[0, 0], [0, 3], [36, 3], [42, 1.4, 1], [JET_TIP - 14, 1], [JET_TIP - 14, 0]], F, P), "m-glass", { crease: false }));
  out.push(solid(turned(JET, 36, [[0, 4.8], [6, 4.8]], { rims: "all" }), "m-cork"));
  out.push(`<g id="jetFlame" opacity="0"><path class="h2flame-o" d=""/><path class="h2flame-i" d=""/></g>`);
  return out.join("");
}
function coldDish() {
  const out = [];
  // a ring on the second arm holds the dish
  out.push(line(k.ring(JET[0], JET[1], 15.5, DISH2_Z, P, 40), "ln ring"));
  const p = turned(JET, DISH2_Z, [[0, 5], [2, 9, 1], [6, 14, 1], [10, 16.4]]);
  out.push(solid(p, "m-porc", { crease: false }));
  out.push(`<path class="coldwater" d="${D.ringAt(JET, 13.4, DISH2_Z + 7.6, 40)}"/>`);
  out.push(`<g id="drops"></g>`);
  return out.join("");
}

// ---------- magnifier on its stand ----------
const LENS_C = at([-58, -58, 196]);
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

// ---------- hoses ----------
const HOSE1 = G.fillet([OUT_Y, [CYL[0], CYL[1] + 22, VALVE_Z + 3.8], [CYL[0] + 8, -8, 92], [FUN[0] - 8, 2, 30], [FUN[0], FUN[1], 26], [FUN[0], FUN[1], FUN_Z + 1]], 8, 8);
const HOSE2 = G.fillet([OUT_X, [CYL[0] + 24, CYL[1], VALVE_Z + 3.8], [CYL[0] + 30, -74, 60], [CYL[0] + 40, -74, 4], [118, -74, 4], [140, -40, 8], [JET[0], JET[1], 8], [JET[0], JET[1], 15]], 8, 8);

// ---------- ion scene: drawn live by the page ----------
const ionScene = () => `<g id="ions"><rect class="ion-bg" x="0" y="0" width="240" height="240"/><g id="molBack"></g><g id="molMid"></g><g id="molFront"></g><text id="ionCap" class="ion-cap" x="120" y="58" text-anchor="middle"></text></g>`;

const shadows = () => `<g clip-path="url(#benchTop)">${[
  shadow(circ(CYL, CYL_R + 3), 110), shadow(k.ringOf({ x: ROD1[0] - 16, y: ROD1[1] - 24, w: 30, d: 48, r: 3 }, 3), 6), shadow(circ(ROD1, 3, 12), 110),
  shadow(circ(J1, 22), 70), shadow(circ(J2, 22), 70), shadow(circ(J3, 22), 70), shadow(circ(J4, 22), 70), shadow(circ(DISH, 15), 5),
  shadow(circ(WATCH, 12), 4), shadow(k.ringOf(TILE, 2), 2), shadow(k.ringOf({ x: HOLD[0] - 8, y: HOLD[1] - 8, w: 16, d: 16, r: 2 }, 2), 30),
  shadow(k.ringOf({ x: ROD2[0] - 16, y: ROD2[1] - 24, w: 30, d: 48, r: 3 }, 3), 6), shadow(circ(ROD2, 3, 12), 110), shadow(circ(MAG, 10), 30),
  shadow(k.ringOf(SPLINT, 2), 2), shadow(k.ringOf(MB, 2), 7),
].join("")}</g>`;

const SVG = `<svg class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="A lab bench for testing hydrogen: a red hydrogen cylinder feeds a funnel for soap bubbles and a glass jet under a cold china dish. Four gas jars of hydrogen stand on glass plates, two mouth up and two mouth down, with a stopwatch, a tile of litmus strips, a candle on a deflagrating spoon and a splint.">
<defs>
  <clipPath id="benchTop"><path d="${k.slabOf(BENCH, 0, 0.01, P, 6).fill}"/></clipPath>
  <clipPath id="lensClip"><circle cx="${f1(LENS_C[0])}" cy="${f1(LENS_C[1])}" r="${LENS_R}"/></clipPath>
</defs>
<g id="scene">
${D.bench(BENCH, "H₂ PROPERTIES LAB · CLASS 8")}
${shadows()}
${cylinder()}
${D.hose(HOSE2)}
${magnifier()}
${D.hose(HOSE1)}
${D.clampStand(ROD1, 100)}
${jar(J1, false, "j1", false)}
${funnel()}${funnelClamp()}
${stopwatch()}
${jar(J2, true, "j2", true)}
${soapDish()}
${jar(J3, true, "j3", true, `<g id="stripsIn" opacity="0">${strips()}</g>`)}
${jetStand()}
${jet()}
${coldDish()}
${jar(J4, false, "j4", false)}
<g id="j4Ring" opacity="0"><path class="h2flame-o" d=""/></g>
${tile()}
${holder()}
<g id="spoon">${spoon()}</g>
<g id="splint">${D.splint(SPLINT)}<g id="flame" opacity="0"><path class="flame-o" d=""/><path class="flame-i" d=""/></g></g>
${D.matchbox(MB)}
<g id="air"><g id="stripsFly" opacity="0">${strips()}</g><g id="wafts"></g><g id="wisps"></g><g id="bubbles"></g></g>
${D.lens(LENS_C, LENS_R)}
<g id="popFlash" opacity="0"></g>
<g id="words"></g>
</g>
</svg>`;

// ---------- data the page needs ----------
const DATA = {
  slug: "properties", choice0: "H2",
  P, J1, J2, J3, J4, JAR_R: D.JAR_R, JAR_H: D.JAR_H, PLATE_Z, WATCH, TILE, HOLD, CANDLE_TOP, JET, JET_TIP, DISH2_Z, FUN, FUN_TOP, DISH, SPLINT_TIP,
  STRIP_C: [TILE.x + 13, TILE.y + 7, 2.2],
  SPOTS: {
    look: at([J3[0] + 30, J3[1], 140]), soap: at([FUN[0] + 30, FUN[1], 120]), jars: at([J2[0] + 20, J2[1], 150]),
    candle: at([J4[0] + 40, J4[1], 160]), jet: at([JET[0] - 40, JET[1], 150]), pop: at([J1[0], J1[1], 120]), quiet: at([J2[0], J2[1], 128]),
  },
  doneHint: "All done! You found seven clues about hydrogen.",
  firstNote: "Papa’s note: we made jars of hydrogen in the Hydrogen Machine. Today we play detective and find out what hydrogen is <b>like</b>.",
};

const STEPS = [
  { key: "look", label: "Look and waft", hint: "Slide the lid a little. Can you see the gas? Waft it gently!", word: "waft waft",
    note: "Papa’s note: hydrogen is <b>colourless</b>, has <b>no smell</b> and no taste, and it isn’t poisonous. We still never sniff a gas straight from the jar. We waft it towards our nose with our hand." },
  { key: "litmus", label: "Litmus test", hint: "Drop a blue and a red litmus strip into the jar.", word: "dip dip",
    note: "Papa’s note: the blue strip stays blue and the red strip stays red. Hydrogen is <b>neutral</b>: it isn’t an acid and it isn’t a base." },
  { key: "soap", label: "Soap bubbles", hint: "Papa blows an air bubble. Then we fill one with hydrogen. Watch where each goes!", word: "whee!",
    note: "Papa’s note: the air bubble sinks, the hydrogen bubble floats up and away. Hydrogen is the <b>lightest gas</b> of all, about 14 times lighter than air." },
  { key: "jars", label: "Two jars, 30 s", hint: "Take the lids off both jars, wait 30 seconds, then test each with a lit splint.", word: "POP!",
    note: "Papa’s note: the jar standing mouth <b>up</b> lost its hydrogen, so it stays quiet. The jar held mouth <b>down</b> kept it, so it pops. That’s why we store hydrogen jars upside down." },
  { key: "candle", label: "Candle in the jar", hint: "Push a burning candle up into a jar of hydrogen…", word: "fsss…",
    note: "Papa’s note: the hydrogen catches fire at the jar’s mouth with a pale blue flame, but the candle <b>goes out</b> inside! Hydrogen burns, but it does <b>not help</b> other things burn. Pull the candle out and it lights again from the burning gas." },
  { key: "jet", label: "Burn it at a jet", hint: "Light the hydrogen at the jet and hold a cold dish over it.", word: "drip drip",
    note: "Papa’s note: hydrogen burns with a pale blue flame and joins with oxygen from the air to make <b>water</b>. The cold dish catches it as drops. That’s where the name comes from: hydrogen means ‘water-maker’. (Papa only lights a jet after checking the gas pops quietly, so no air is mixed in.)" },
];

const IDCARD = [["look", "colourless"], ["look", "no smell"], ["litmus", "neutral to litmus"], ["soap", "lighter than air"], ["jars", "burns with a pop"], ["candle", "doesn’t help burning"], ["jet", "burns → water"]];

const html = page({
  slug: "properties", fig: 2, title: "The Properties Lab",
  hello: "Hey Sairah, it’s Papa. Let’s play detective and find out what hydrogen is like!",
  figTitle: "What is hydrogen like?",
  eq: `<div class="idcard" aria-label="Clues found">${IDCARD.map(([s, w], i) => `<span class="idk" data-step="${s}" id="id${i}">${w}</span>`).join("")}</div><span id="eqA" class="eqp">2H₂</span> <span id="eqB" class="eqp">+ O₂</span> <span id="eqC" class="eqp">→ 2H₂O</span>`,
  svg: SVG,
  big: "Hydrogen is the lightest gas. It burns, but it won’t help other things burn.",
  ionLabel: "Close-up of the gas: small, fast hydrogen molecules; bigger nitrogen and oxygen molecules in air; and two hydrogen molecules joining one oxygen molecule to make two water molecules.",
  ions: ionScene(),
  legend: `<span class="key k-hh">H₂</span> <span class="key k-oo">O₂</span> <span class="key k-nn">N₂</span> <span class="key k-w">H₂O</span>`,
  chips: [["gRatio", "Air is heavier by"], ["gJarH", "A jar of H₂ weighs"], ["gJarA", "A jar of air weighs"], ["gUp", "Mouth-up jar"], ["gDown", "Mouth-down jar"], ["gWater", "Water made"]],
  foot: "≈ numbers are approximate, at STP (hydrogen ≈ 0.09 g per litre, air ≈ 1.29 g per litre, 1 mole of gas ≈ 22.4 L). How fast hydrogen leaves an open jar is a friendly guess.",
  guesses: [
    "Why do you think we waft a gas towards our nose instead of sniffing it straight from the jar?",
    "The mouth-up jar went quiet after 30 seconds. Where do you think its hydrogen went?",
    "The gas burnt at the jar’s mouth, but the candle went out inside. How can both be true?",
    "Why do you think the cold dish over the flame got wet?",
  ],
  applyIntro: "No machine for these. Use your clues to think them through, then tell Papa.",
  apply: [
    "Long ago, huge airships were filled with hydrogen, and one called the Hindenburg burst into flames in 1937. Why do you think people chose hydrogen to fill them, and what made it risky?",
    "You have three jars. One holds hydrogen, one oxygen and one carbon dioxide, but the labels fell off. Plan a test with a burning splint. What would you expect to see in each jar?",
    "You must carry an open jar of hydrogen across the room to Papa. How will you hold it, and why?",
    "Your friend says, ‘Hydrogen burns, so it must help things burn too.’ Which of today’s tests would you show her, and what would she see?",
  ],
  data: DATA, steps: STEPS, model: MODEL_SRC,
  live: readFileSync(join(HERE, "live.js"), "utf8"),
  css: readFileSync(join(HERE, "extra.css"), "utf8"),
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), html);
console.log("wrote machines/properties/index.html", (html.length / 1024).toFixed(0) + " KB");
