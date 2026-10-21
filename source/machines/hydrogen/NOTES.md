# The Hydrogen Machine: notes

## What's here
- `index.html` is the page. It is one standalone file with all CSS and JS inline: no network requests, no web fonts, only relative links, and `noindex`.
- `build.mjs` writes `index.html`. Run it with `node build.mjs`. It draws the isometric apparatus with the anatomy kit (copied into `kit/`: `iso-kit.mjs`, `lathe.mjs`) and inlines `page.css`, `live.js`, `model.mjs` and the kit runtime.
- `model.mjs` holds the one pure `model(state)`. It produces every number on screen: metal used and left (g), H₂ made (mL), gas in the jar (mL, and whether it is air or H₂), bubble rate, jars of H₂, and air left inside. The jar's water level comes from it too. Its inputs are the metal, whether metal and acid are in, whether it is reacting, `V` (the gas made so far) and the V at which the current jar went on the shelf. Its constants are 22.4 L/mol, 1.3 g Zn ≈ 448 mL possible, jar ≈ 112 mL, and air in the flask + tube ≈ 112 mL. It uses Mg = 24, Fe = 56, and rates of 8 / 4 / 1.5 / 0 bubbles per second.
- `stills/`: `desktop-fizz.png`, `desktop-pop.png`, `phone-collect.png`.

## What it does
- The bench holds a Woulfe bottle (granulated zinc, thistle funnel dipping under the acid, rubber stoppers), a clamp stand, a bent delivery tube, and a glass trough with a beehive shelf and an inverted gas jar with an mL scale. Around them sit two spare jars on glass plates, a "dil. HCl" bottle, a splint, a matchbox and a magnifier on a stand. The drawing has ink outlines, 3-tone fills, cream paper and warm grey hard shadows.
- There are 7 steps, and only the next one can be clicked. Finished steps get a tick. Each step has a hint, a "Papa's note" (the "why" facts from the brief), comic sound words, and its own animation:
  1. Granules drop in.
  2. The acid bottle tips over the funnel and the level rises.
  3. Bubbles start and the magnifier shows the ion swap.
  4. The first jar fills with air and is thrown away; a fresh jar goes on the shelf.
  5. Hydrogen pushes the water down.
  6. The jar is lifted mouth down, the lit splint comes up, then POP with a pale blue flash.
  7. A new jar goes on the shelf and the counter goes up.
- The equation builds up piece by piece: Zn, then + 2HCl, then → ZnCl₂ + H₂↑.
- **Papa's magnifier**: a lens drawn on the bottle and a larger readable panel show the same animated scene. Zn atoms, H⁺, Cl⁻, Zn²⁺ leaving the surface, and 2 H⁺ → H₂ in a bubble.
- **Metal chooser** (Mg / Zn / Fe / Cu): changes the rate, the masses, the equation, the colours, the hints and the highlight on the reactivity ladder. Cu gives "no reaction" and nothing happens. Changing the metal starts the experiment over.
- Auto play, Start over, and an optional pop sound. The sound is off until it's ticked, and uses WebAudio only.
- The four "Can you guess why?" boxes save to localStorage only.
- Phone (390 px): the steps become a horizontal strip that scrolls to the current step. Touch targets are at least 44 px and nothing scrolls sideways.

## Checked
- Headless Chrome at 1280×900 and 390×844 showed no console errors. All 7 steps played in manual mode for Zn. Auto play ran all 7 for Mg (≈ 336 mL, 0.36 g Mg, 2 jars). Start over reset everything. Cu ran to the end with "no reaction" and 0 mL. Fe showed 1.5 /s and FeCl₂.

## Limitations / simplifications
- The reaction only bubbles while a gas step is playing and pauses between steps, so manual mode can wait for her. The "≈ bubbles/s" figure is a friendly relative number, and each drawn bubble stands for ≈ 4 mL.
- The figure is drawn with the kit's geometry but uses its own colour styling. The kit's `--audit` and `lines.mjs` checks were not run, because they target the kit's `.iso-line` markup and pipe recorder, which this figure doesn't use. It was checked by eye at 1× and in close-ups instead.
- The acid bottle tips with a flat 2D rotation (a cartoon pour), and old jars fade away rather than being carried off.
- On a phone the magnifier panel sits below the figure, so she has to scroll to see it. The lens on the bottle itself is too small to read there.
