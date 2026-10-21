// The one model. Every number on the page comes out of model(state).
// state = { metal, metalIn, acidIn, reacting, V, jarStart }
//   V        mL of gas the reaction has made so far (the only integrated quantity)
//   jarStart value of V when the jar now on the beehive shelf was put there (null: no jar on shelf)
export const MODEL_SRC = `
const METALS = {
  Mg: { name: "magnesium", M: 24, rate: 8, salt: "MgCl\\u2082", ion: "Mg\\u00b2\\u207a", speed: "fast" },
  Zn: { name: "zinc", M: 65, rate: 4, salt: "ZnCl\\u2082", ion: "Zn\\u00b2\\u207a", speed: "steady" },
  Fe: { name: "iron", M: 56, rate: 1.5, salt: "FeCl\\u2082", ion: "Fe\\u00b2\\u207a", speed: "slow" },
  Cu: { name: "copper", M: 63.5, rate: 0, salt: null, ion: "Cu", speed: "nothing" },
};
const MOLAR_VOLUME = 22400;   // mL of gas in 1 mole at STP (ICSE value)
const H2_POSSIBLE = 448;      // mL: the metal added can make this much with enough acid
const JAR = 112;              // mL a gas jar holds (approx.)
const AIR = 112;              // mL of air in the flask + delivery tube, pushed out first
const ML_PER_BUBBLE = 4;    // friendly: one drawn bubble stands for about this much gas
function model(s) {
  const m = METALS[s.metal];
  const reacts = m.rate > 0;
  const added = s.metalIn ? (reacts ? (H2_POSSIBLE / MOLAR_VOLUME) * m.M : 1.3) : 0;
  const V = reacts ? Math.max(0, Math.min(s.V, H2_POSSIBLE)) : 0;
  const used = (V / MOLAR_VOLUME) * m.M;
  const rate = s.metalIn && s.acidIn && s.reacting && reacts && V < H2_POSSIBLE ? m.rate : 0;
  const onShelf = s.jarStart !== null && s.jarStart !== undefined;
  const inJar = onShelf ? Math.max(0, Math.min(JAR, V - s.jarStart)) : 0;
  const airLeft = Math.max(0, AIR - V);
  return {
    metal: s.metal,
    name: m.name,
    added,                                   // g of metal in the bottle
    used,                                    // g of metal used up
    left: added - used,                      // g of metal still in the bottle
    h2: Math.max(0, V - AIR),                // mL of hydrogen that has left the apparatus into jars
    made: V,                                 // mL of hydrogen made in the bottle
    airLeft,                                 // mL of air still inside flask + tube
    inJar,                                   // mL of gas in the jar on the shelf
    jarFull: inJar / JAR,                    // 0..1
    jarHolds: !onShelf ? "none" : s.jarStart < AIR ? "air" : "hydrogen",
    jars: Math.max(0, Math.min(3, Math.floor((V - AIR + 0.001) / JAR))),   // full jars of hydrogen collected
    rate,                                    // bubbles per second (relative)
    flow: rate * ML_PER_BUBBLE,              // mL per second while it bubbles
    reacts,
    salt: m.salt,
    ion: m.ion,
    speed: m.speed,
  };
}
`;
