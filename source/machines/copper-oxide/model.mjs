// The one model. Every number on the page comes out of model(state).
// state = { oxide, V, frac, temp }
//   oxide  "CuO" | "PbO" | "ZnO"
//   V      mL of hydrogen that has flowed through the tube so far
//   frac   fraction of the oxide that has been reduced so far (0..1)
//   temp   how hot the boat is (0..1)
export const MODEL_SRC = `
const OXIDES = {
  CuO: { name: "copper oxide", M: 80, metal: "Cu", metalName: "copper", Mm: 64, reacts: true, was: "black", now: "reddish-brown" },
  PbO: { name: "lead oxide", M: 223, metal: "Pb", metalName: "lead", Mm: 207, reacts: true, was: "yellow", now: "grey" },
  ZnO: { name: "zinc oxide", M: 81, metal: "Zn", metalName: "zinc", Mm: 65, reacts: false, was: "white", now: "white" },
};
const MOLES = 0.0125;         // mol of oxide in the boat (CuO: 1.0 g)
const MOLAR_VOLUME = 22400;   // mL of gas in 1 mole at STP (ICSE value)
const AIR = 150;              // mL of air in the tube and flask, pushed out first (approx.)
const H2O_MASS = 18;          // g per mole of water
function model(s) {
  const o = OXIDES[s.oxide];
  const frac = o.reacts ? Math.max(0, Math.min(1, s.frac)) : 0;
  const before = MOLES * o.M;                         // g of oxide put in the boat
  const metal = MOLES * frac * o.Mm;                  // g of metal made
  const oxideLeft = MOLES * (1 - frac) * o.M;         // g of oxide still there
  const boat = metal + oxideLeft;                     // g in the boat now (the weighing)
  const water = MOLES * frac * H2O_MASS;              // g of water made
  const airLeft = Math.max(0, AIR - s.V);
  return {
    name: o.name, metal: o.metal, metalName: o.metalName, reacts: o.reacts, was: o.was, now: o.now,
    before,                                           // g
    boat,                                             // g
    lost: before - boat,                              // g: the oxygen that left
    metalMade: metal,                                 // g
    water,                                            // g
    frac,                                             // 0..1
    h2Needed: MOLES * MOLAR_VOLUME,                   // mL of H2 the whole sample needs
    h2Used: MOLES * frac * MOLAR_VOLUME,              // mL of H2 used up so far
    h2Passed: s.V,                                    // mL of H2 that has flowed through
    airLeft,                                          // mL of air still inside
    safe: airLeft <= 5,                               // true once the air has been pushed out
    hot: s.temp,                                      // 0..1
    rate: 0.16,                                       // fraction reduced per second while hot with H2 (friendly)
    flow: s.V < AIR + 20 ? 40 : 12,                   // mL of H2 per second: a strong stream to flush, then gentle (friendly)
  };
}
`;
