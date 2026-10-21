// The one model. Every number on the page comes out of model(state).
// state = { wait, opened, popped1, popped2, burnt }
//   wait     seconds the two test jars have stood open (mouth up / mouth down)
//   opened   true once their plates are off      popped1/2: jar already tested with the splint
//   burnt    mL of hydrogen burnt at the jet so far
export const MODEL_SRC = `
const H2_DENSITY = 0.09;      // g per litre at STP
const AIR_DENSITY = 1.29;     // g per litre at STP
const MOLAR_VOLUME = 22400;   // mL of gas in 1 mole at STP (ICSE value)
const JAR = 112;              // mL a gas jar holds (approx.)
const TAU_UP = 6;             // s: friendly time for hydrogen to float out of a mouth-up jar
const TAU_DOWN = 900;         // s: a mouth-down jar keeps it for a long time
const JET_FLOW = 20;          // mL of hydrogen per second at the jet (friendly)
function model(s) {
  const ratio = AIR_DENSITY / H2_DENSITY;
  const t = s.opened ? s.wait : 0;
  const upLeft = s.popped2 ? 0 : JAR * Math.exp(-t / TAU_UP);
  const downLeft = s.popped1 ? 0 : JAR * Math.exp(-t / TAU_DOWN);
  const burnt = Math.max(0, s.burnt);
  return {
    ratio,                                   // air is this many times heavier than hydrogen
    jarH2: (JAR / 1000) * H2_DENSITY,        // g of hydrogen in one jar
    jarAir: (JAR / 1000) * AIR_DENSITY,      // g of air in the same jar
    upLeft,                                  // mL of hydrogen left in the mouth-up jar
    downLeft,                                // mL of hydrogen left in the mouth-down jar
    upLoud: upLeft / JAR,                    // 0..1 how much there is to pop
    downLoud: downLeft / JAR,
    waited: t,                               // s
    burnt,                                   // mL of hydrogen burnt at the jet
    o2: burnt / 2,                           // mL of oxygen from the air it used (2 : 1)
    water: (burnt / MOLAR_VOLUME) * 18,      // g of water made (2H2 + O2 -> 2H2O)
    flow: JET_FLOW,
  };
}
`;
