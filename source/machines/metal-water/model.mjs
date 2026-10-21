// The one model. Every number on the page comes out of model(state).
// state = { metal, water, V, ready, popped }
//   metal   "Na" | "Ca" | "Mg" | "Zn" | "Fe" | "Cu"
//   water   "cold" | "hot" | "steam"
//   V       mL of hydrogen made so far (the only integrated quantity)
//   ready   how far the water has got to its temperature (0..1)
//   popped  true once the jar has been used for the splint test
export const MODEL_SRC = `
const METALS = {
  Na: { name: "sodium", M: 23, h2per: 0.5 },
  Ca: { name: "calcium", M: 40, h2per: 1 },
  Mg: { name: "magnesium", M: 24, h2per: 1 },
  Zn: { name: "zinc", M: 65, h2per: 1 },
  Fe: { name: "iron", M: 56, h2per: 4 / 3 },
  Cu: { name: "copper", M: 63.5, h2per: 0 },
};
// friendly relative bubbles per second for each metal in each kind of water (0 = nothing happens)
const RATE = {
  Na: { cold: 5, hot: 7, steam: 9 },
  Ca: { cold: 3, hot: 4.5, steam: 6 },
  Mg: { cold: 0, hot: 1.6, steam: 4 },
  Zn: { cold: 0, hot: 0, steam: 1.8 },
  Fe: { cold: 0, hot: 0, steam: 1 },
  Cu: { cold: 0, hot: 0, steam: 0 },
};
// what the metal turns into, and the equation as it builds up
const EQ = {
  Na: { any: ["2Na", "+ 2H₂O", "→ 2NaOH + H₂↑", "NaOH"] },
  Ca: { any: ["Ca", "+ 2H₂O", "→ Ca(OH)₂ + H₂↑", "Ca(OH)₂"] },
  Mg: { hot: ["Mg", "+ 2H₂O", "→ Mg(OH)₂ + H₂↑", "Mg(OH)₂"], steam: ["Mg", "+ H₂O", "→ MgO + H₂↑", "MgO"] },
  Zn: { steam: ["Zn", "+ H₂O", "→ ZnO + H₂↑", "ZnO"] },
  Fe: { steam: ["3Fe", "+ 4H₂O", "⇌ Fe₃O₄ + 4H₂↑", "Fe₃O₄"] },
};
const ALKALI = { NaOH: true, "Ca(OH)₂": true, "Mg(OH)₂": true };   // products that dissolve a little and turn red litmus blue
const MOLES = 0.01;           // mol of metal in the piece
const MOLAR_VOLUME = 22400;   // mL of gas in 1 mole at STP (ICSE value)
const JAR = 112;              // mL a gas jar holds (approx.)
const ML_PER_RATE = 10;       // friendly: mL of gas per second for each bubble per second
const TEMP = { cold: 25, hot: 80, steam: 100 };   // degrees C
function model(s) {
  const m = METALS[s.metal];
  const rate = RATE[s.metal][s.water];
  const reacts = rate > 0;
  const eq = EQ[s.metal] && (EQ[s.metal][s.water] || EQ[s.metal].any);
  const possible = MOLES * m.h2per * MOLAR_VOLUME;                 // mL of H2 if the whole piece reacts
  const V = reacts ? Math.max(0, Math.min(s.V, possible)) : 0;
  const used = m.h2per ? (V / MOLAR_VOLUME / m.h2per) * m.M : 0;   // g of metal used
  const added = MOLES * m.M;                                       // g in the piece
  const salt = reacts && eq ? eq[3] : null;
  return {
    name: m.name, metal: s.metal, water: s.water,
    reacts, rate, possible,
    flow: reacts && V < possible ? rate * ML_PER_RATE : 0,         // mL per second while it reacts
    made: V,                                                       // mL of H2 made
    inJar: s.popped ? 0 : Math.min(V, JAR),                        // mL of gas in the jar
    jarFull: s.popped ? 0 : Math.min(V, JAR) / JAR,                // 0..1
    added, used, left: added - used,                               // g
    tempC: 25 + (TEMP[s.water] - 25) * s.ready,                    // water temperature
    eq: reacts && eq ? eq : null,
    salt,
    alkaline: !!(salt && ALKALI[salt]),                            // does the water now turn red litmus blue?
    milky: s.metal === "Ca" && reacts ? Math.min(1, V / 40) : 0,   // lime water goes cloudy
    jarSize: JAR,
  };
}
`;
