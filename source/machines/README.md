# The Hydrogen-chapter machines

Interactive lab simulations for Sairah (Class 8, ICSE, Selina Concise Chemistry, Hydrogen chapter).
Each machine is ONE standalone page (all CSS and JS inline, no network requests, relative links only, `noindex`),
built with the "anatomy" skill's isometric kit. Hand-inked look, Papa's voice, steps she taps in order, comic sound
words, a magnifier onto the atoms, one pure `model()` that drives every number, "Can you guess why?" boxes
(saved on her device only) and **no answers anywhere on the page**.

| Page | Folder | Chapter topic |
|---|---|---|
| `machines/hydrogen/` | `source/machines/hydrogen/` | Lab preparation (zinc + dilute HCl), collection over water, the pop test |
| `machines/properties/` | `source/machines/properties/` | Physical and chemical properties and tests of hydrogen |
| `machines/copper-oxide/` | `source/machines/copper-oxide/` | Reducing action of hydrogen; oxidation and reduction (the "oxygen see-saw") |
| `machines/metal-water/` | `source/machines/metal-water/` | Hydrogen from water (cold water, hot water, steam) and the reactivity series |

## How to rebuild a page

```
cd source/machines/<name> && node build.mjs
```

The three newer machines write straight to `machines/<name>/index.html`. The original `hydrogen` build writes
`index.html` next to itself; copy it to `machines/hydrogen/index.html` (and delete the copy in `source/`).
Needs Node 20+. The drawing kit is in `hydrogen/kit/` (copied from the anatomy skill).

## What is shared (`shared/`)

- `draw.mjs`: the bench, clamp stands, glass and rubber tubing, gas jars, Bunsen burner, splint, matchbox, lens.
- `page.mjs`: the page template (step column, hint, equation, figure card, magnifier panel, number chips, guess
  boxes, "Try it on something new" boxes and the link to the next machine).
- `core-head.js` / `core-tail.js`: the live runtime (step buttons, Auto play, Start over, sound words, optional
  WebAudio pop that is off until she ticks it, saved writing). Each machine's own `live.js` sits between them and
  provides `fresh`, `RUN` (the steps), `update`, `draw`, `panel` and, optionally, `hintFor` / `noteFor` / `onChoice`.
- `series.css`: the series additions, including the phone layout (sticky step strip, magnifier right under the figure).

## Per-machine rules kept from the Hydrogen brief

- Opening line "Hey Sairah, it's Papa. ..." and her name nowhere else.
- Only the next step is tappable; done steps show a tick; Auto play and Start over.
- Every number comes out of `model(state)` (`model.mjs`) and is marked "≈".
- Touch targets at least 44 px, no sideways scroll from 360 px up to desktop.
- The "Try it on something new" boxes and the see-saw slots never mark anything right or wrong.

## Facts to check against her Selina book before she relies on them

I could not open the Selina text while building, so these come from standard Class 8 content. Please tick each one:

1. Hydrogen from water: the equations and which water each metal needs (Na and Ca cold; Mg hot or steam; Zn and
   Fe steam only; Cu never), and `Mg + 2H2O -> Mg(OH)2 + H2` for hot water.
2. Iron and steam written as a reversible reaction (`3Fe + 4H2O <=> Fe3O4 + 4H2`).
3. The drying tube in the copper oxide set-up, and PbO / ZnO as extra oxides (ZnO is the "no reaction" example).
4. Oxidation and reduction defined by oxygen only (the page does not use the hydrogen-based definitions).
5. "About 14 times lighter than air" (from 0.09 g/L and 1.29 g/L at STP) and the soap-bubble and candle tests.

## Limitations

- The reaction speeds ("bubbles per second", heating time, the 30 s jar wait) are friendly relative numbers.
- Sodium with hot water or steam is shown for comparison only; Papa's note says it is never done in real life.
- Drawn with the kit's geometry but not run through its `--audit` / `lines.mjs` checks (they target the kit's own
  markup). Checked by eye at 1x and in close-ups, and by scripted runs of every step, metal and water.
