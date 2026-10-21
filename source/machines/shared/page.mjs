// Writes one standalone machine page (all CSS and JS inline, no network, relative links only).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(HERE, p), "utf8");
const KIT_SRC = read("../hydrogen/kit/iso-kit.mjs").replace(/^export /gm, "");

export const TRAIL = [
  { slug: "hydrogen", title: "The Hydrogen Machine", what: "make hydrogen in the lab" },
  { slug: "properties", title: "The Properties Lab", what: "what hydrogen is like" },
  { slug: "copper-oxide", title: "The Copper Oxide Changer", what: "hydrogen steals oxygen" },
  { slug: "metal-water", title: "The Metal–Water Race", what: "metals that pull hydrogen out of water" },
];

export function page(o) {
  const css = read("../hydrogen/page.css") + read("series.css") + (o.css || "");
  const i = TRAIL.findIndex((t) => t.slug === o.slug);
  const prev = TRAIL[i - 1], next = TRAIL[i + 1];
  const steps = o.steps.map((s, n) => `<li><button class="step" type="button" data-step="${n}" disabled><span class="num" aria-hidden="true">${n + 1}</span><span class="tick" aria-hidden="true">✓</span><span class="lbl">${s.label}</span></button></li>`).join("");
  const guesses = o.guesses.map((q, n) => `<label class="q"><span>${q}</span><textarea data-key="guess-${n + 1}" rows="3" placeholder="Write what you think…"></textarea></label>`).join("");
  const apply = o.apply.map((q, n) => `<li class="q"><span>${q}</span><textarea data-key="apply-${n + 1}" rows="3" aria-label="Your answer" placeholder="Your thinking…"></textarea></li>`).join("");
  const chips = o.chips.map(([id, label]) => `<div class="chip"><span class="cl" id="${id}L">${label}</span><b id="${id}">…</b></div>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${o.title}</title>
<style>${css}</style>
</head>
<body>
<main class="page series">
  <header class="top">
    <p class="hello">${o.hello}</p>
    <h1>${o.title}</h1>
  </header>

  <section class="lab" aria-label="${o.title}">
    <nav class="steps" aria-label="Steps">
      <ol>${steps}</ol>
      <div class="modes">
        <label class="auto"><input type="checkbox" id="auto"> <span>Auto play</span></label>
        <label class="auto"><input type="checkbox" id="sound"> <span>Sound</span></label>
        <a href="#" id="restart" class="restart">Start over</a>
      </div>
    </nav>

    <div class="stage">
      <div class="hint" aria-live="polite"><span class="hint-bubble" id="hint">Tap step 1 to start.</span></div>
      <div class="eq" aria-label="Equation">${o.eq}</div>
      <div class="card">
        <div class="corner fig">Fig ${o.fig}</div>
        <div class="corner title" id="figTitle">${o.figTitle}</div>
        ${o.svg}
        <div class="corner readout" id="readout"></div>
      </div>
      <p class="note" id="note"></p>
      <p class="big">${o.big}</p>
    </div>

    <aside class="side">
      <div class="panel lens-panel">
        <h2>Papa’s magnifier</h2>
        <svg class="ionsvg" viewBox="0 0 240 240" role="img" aria-label="${o.ionLabel}">
          <defs><clipPath id="ionClip"><circle cx="120" cy="120" r="116"/></clipPath></defs>
          <g clip-path="url(#ionClip)">${o.ions}</g>
          <circle class="ion-rim" cx="120" cy="120" r="116"/>
        </svg>
        <p class="legend">${o.legend}</p>
      </div>
      <div class="panel gauges" aria-label="Numbers from the model">
        ${chips}
        <p class="foot">${o.foot}</p>
      </div>
      ${o.chooser || ""}
    </aside>
  </section>

  ${o.extra || ""}

  <section class="guess">
    <h2>Can you guess why?</h2>
    ${guesses}
  </section>

  <section class="guess apply">
    <h2>Try it on something new</h2>
    <p class="apply-intro">${o.applyIntro}</p>
    <ol class="apply-list">${apply}</ol>
    <p class="saved">Your answers stay on this device only. Show them to Papa when you’re done!</p>
  </section>

  <nav class="trail" aria-label="Hydrogen machines">
    ${prev ? `<a class="trail-link" href="../${prev.slug}/">← ${prev.title}</a>` : "<span></span>"}
    ${next ? `<a class="trail-link next" href="../${next.slug}/">Next: ${next.title} →</a>` : `<a class="trail-link next" href="../${TRAIL[0].slug}/">Back to ${TRAIL[0].title} ↺</a>`}
  </nav>
</main>
<script>
${KIT_SRC.replace(/<\/(script)/gi, "<\\/$1")}
${o.model}
const DATA = ${JSON.stringify(o.data)};
const STEPS = ${JSON.stringify(o.steps)};
${read("core-head.js")}
${o.live}
${read("core-tail.js")}
</script>
</body></html>`;
}
