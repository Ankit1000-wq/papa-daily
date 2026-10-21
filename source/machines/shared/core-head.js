// ---------- shared live runtime for the Hydrogen-chapter machines ----------
// Part 1 (helpers and state). The machine script comes next, then core-tail.js. The machine defines:
//   fresh(choice)  -> machine state         RUN[i](t) -> true when step i is finished
//   update(dt)     -> per-tick physics       draw(dt)  -> writes the SVG
//   panel()        -> writes the numbers     hintFor() / noteFor() (optional overrides)
//   model(S)       -> the one pure model (from model.mjs)
const $ = (id) => document.getElementById(id);
const P = DATA.P;
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const span = (t, a, b) => ease((t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const f1 = (v) => Math.round(v * 10) / 10;
const op = (v) => String(f1(clamp(v, 0, 1) * 100) / 100);
const NS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}, parent) => { const n = document.createElementNS(NS, name); for (const key in attrs) n.setAttribute(key, attrs[key]); if (parent) parent.appendChild(n); return n; };
const K = Math.sqrt(1.6) * P.scale;
const write = (node, attr, value) => { if (node && node.getAttribute(attr) !== value) node.setAttribute(attr, value); };
const text = (node, value) => { if (node && node.textContent !== value) node.textContent = value; };
const at3 = (p) => iso(p, P);
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const base = (choice) => Object.assign({ choice, done: 0, playing: -1, t: 0, t0: 0, phase: 0, said: {} }, fresh(choice));
let S = base(DATA.choice0);
let M = model(S);

// ---------- comic sound words ----------
const words = $("words");
function say(word, spot, cls = "") {
  const [x, y] = DATA.SPOTS[spot];
  const g = el("g", { class: "pow " + cls, transform: `translate(${f1(x)} ${f1(y)})` }, words);
  const inner = el("g", { class: "pow-in" }, g);
  el("text", { class: "pow-back" }, inner).textContent = word;
  el("text", { class: "pow-front" }, inner).textContent = word;
  setTimeout(() => g.remove(), still.matches ? 2400 : 1900);
}
function sayOnce(key, word, spot, when, cls) { if (S.t >= when && !S.said[key]) { S.said[key] = true; say(word, spot, cls); } }

// ---------- flame shape (a teardrop) ----------
function flameD(fx, fy, h, w) {
  return `M${f1(fx)} ${f1(fy + 1)}C${f1(fx - w)} ${f1(fy - 2)} ${f1(fx - w * 0.4)} ${f1(fy - h * 0.7)} ${f1(fx - 1)} ${f1(fy - h)}C${f1(fx + w * 0.6)} ${f1(fy - h * 0.6)} ${f1(fx + w * 0.8)} ${f1(fy - 2)} ${f1(fx)} ${f1(fy + 1)}Z`;
}
const flick = (k = 1) => (still.matches ? 0 : Math.sin(performance.now() / 70 + k) * 0.8 + Math.sin(performance.now() / 113 + k * 2) * 0.5);

// ---------- optional tiny pop sound (off until the reader turns it on) ----------
let audio = null;
$("sound").addEventListener("change", (e) => { if (e.target.checked && !audio) audio = new (window.AudioContext || window.webkitAudioContext)(); });
function popSound(loud = 0.6) {
  if (!audio || !$("sound").checked) return;
  const len = audio.sampleRate * 0.25;
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * 0.03));
  const src = audio.createBufferSource(); src.buffer = buf;
  const gain = audio.createGain(); gain.gain.value = loud;
  src.connect(gain).connect(audio.destination); src.start();
}

