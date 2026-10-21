# Brief: "Hydrogen machine" – interactive lesson (use the anatomy skill)

Audience: Sairah, 12, Class 8 ICSE (India), struggling with Chemistry, studying the Hydrogen chapter (Selina Concise Chemistry Class 8). Her Papa sits with her. Build ONE standalone HTML file: ./index.html (in this folder, /workspace/sairah-daily/machines/hydrogen/). All CSS/JS inline, no external network requests (no CDN, no web fonts). It is served from a GitHub Pages sub-path, so only relative links. Do NOT touch anything outside this folder. Do not publish or push anything; do not run git.

Use the anatomy skill at ~/.claude/skills/anatomy (read SKILL.md, references/craft.md, references/kit.md, references/motion.md, references/verify.md and the closest examples, e.g. examples/dial-indicator, examples/ripple-tank). Size: Figure (or small Hero). You may use kit/iso-kit.mjs with a build.mjs here that writes index.html (inline the kit), or hand-write SVG — the output must be one standalone index.html. Keep a build.mjs if you use one. No WebGL needed; keep it light for phones.

## Rules of the figure
- Real recognisable apparatus, many small parts (40–80), isometric view: Woulfe bottle (two-neck) on a bench/stand with granulated zinc on the bottom; thistle funnel through one neck with its stem end dipping BELOW the acid level; bent delivery tube from the other neck down into a glass trough of water; beehive shelf in the trough; inverted gas jar on the beehive shelf (jar full of water at start, water pushed down as gas collects = downward displacement of water); a spare jar or two standing nearby (mouth down, glass plate); acid bottle labelled "dil. HCl"; a wooden splint for the test; corks/rubber stoppers, clamp stand, screws, label plates, ticks on the jar (mL scale).
- Step buttons in a column on the left (on phone: a horizontal scrollable strip or stacked above the figure — must remain usable). Only the NEXT step is clickable; done steps show a tick; each click plays that step on the apparatus with calm eased motion.
- A cut-away window (a round magnifier/lens drawn on the flask) where the real work happens: Zn atoms on the zinc surface, H⁺ and Cl⁻ ions in the acid; Zn leaves as Zn²⁺ (stays in solution with Cl⁻ → ZnCl₂ in solution), two H⁺ become one H₂ molecule that forms a bubble. Keep labels tiny but readable.
- ONE small pure-function model (e.g. `function model(state)`) drives EVERY number on screen (gauges, chips): zinc used (g), H₂ made (mL), gas in jar (mL), bubble rate, jars collected, air left in apparatus. No number is set anywhere else.
- One short hint per step at the top that a 7-year-old would get.
- Sound words on actions, drawn as comic text near the action: "plink plink" (zinc), "glug glug" (acid), "fizz", "bubble-bubble", "POP!". (Optional tiny WebAudio pop is fine but must be off until user taps.)
- Manual mode default + Auto mode toggle (Auto plays the steps one after another with pauses). A "Start over" link.
- Equation Zn + 2HCl → ZnCl₂ + H₂↑ builds up piece by piece as steps happen (Zn appears at step 1, + 2HCl at step 2, → ZnCl₂ + H₂↑ when it fizzes).
- One big-idea line under the figure: "A more reactive metal pushes hydrogen out of the acid."
- Bonus: a metal chooser (segmented buttons or slider): Mg (fast), Zn (steady, default), Fe (slow), Cu (nothing happens — copper is below hydrogen in the reactivity series). It changes the bubble rate, equation (Mg + 2HCl → MgCl₂ + H₂↑, Fe + 2HCl → FeCl₂ + H₂↑, Cu: "no reaction") and the model numbers. Show a tiny reactivity-series ladder (K Na Ca Mg Al Zn Fe … H … Cu Ag Au) with the chosen metal highlighted relative to H.

## Style
Hand-inked children's-book look: dark navy outlines (#1f2a44-ish) 1.2px, flat fills with 3 tones per surface (light/mid/dark faces), cream paper background #f5f0e5, warm grey HARD shadows #ddd4c3 (never blue/purple shadows), nothing important hidden behind other parts (correct painter's order). Friendly rounded type (system fonts). Must work on phone (~390px wide), tablet and laptop: touch targets ≥44px, no horizontal overflow, the SVG scales with viewBox, text readable.

## Steps (suggested — keep 7)
1. Add zinc granules — hint: "Drop the little zinc pieces into the bottle." plink plink. Granulated zinc (small pieces, with a trace of copper which helps it react faster).
2. Pour dilute HCl through the thistle funnel — hint: "Pour the acid in till the funnel's tip is under it." glug glug. Thistle funnel end must dip below the acid so the gas cannot escape through the funnel.
3. Watch it fizz — hint: "Zinc pushes hydrogen out of the acid — see the bubbles!" fizz. Window plays the ion swap. Equation completes.
4. Let the air escape first — hint: "The first bubbles are just air from the bottle. Let them go!" bubble-bubble. First jar(s) collect air that was in the flask and tube; rejected, because a hydrogen–air mixture can explode if lit.
5. Collect over water — hint: "Hydrogen pushes the water down and fills the jar." bubble-bubble. Downward displacement of water because hydrogen is almost insoluble in water. (Not collected over air: lighter than air but a hydrogen–air mixture is explosive.) Jar gauge fills.
6. Test with a burning splint — hint: "Bring a lit splint to the jar's mouth… POP!" POP! Hydrogen burns with a pop sound (pale blue flame) — that's the test. Jar is held mouth DOWN because hydrogen is lighter than air.
7. New jar — hint: "Slide a fresh jar on the shelf and collect more." Jar counter increases.

## Verified facts (only these; do not invent others)
- Lab method (Selina Class 8): action of dilute HCl (or dilute H₂SO₄) on granulated zinc. Zn + 2HCl → ZnCl₂ + H₂↑ ; Zn + H₂SO₄ → ZnSO₄ + H₂↑.
- Thistle funnel's lower end dips in the acid so the gas does not escape through it.
- Collected by downward displacement of water because hydrogen is almost (sparingly) insoluble in water.
- Not collected by displacement of air: a mixture of hydrogen and air is explosive.
- First one or two jars contain the air that was in the flask and delivery tube; they are rejected.
- Granulated zinc preferred: contains copper as impurity, which speeds the reaction (acts like a catalyst).
- Nitric acid (even dilute) not used: it is a strong oxidising agent; it oxidises hydrogen to water (gives nitric oxide instead).
- Concentrated H₂SO₄ not used: it is an oxidiser and gives sulphur dioxide, not hydrogen.
- Test: a burning splint brought near the gas → burns with a pop sound.
- Reactivity: metals above hydrogen (Mg, Zn, Fe) displace hydrogen from dilute acids; Mg fastest, Fe slower than Zn; Cu is below hydrogen and does not.
- ZnCl₂ stays dissolved in the solution.
Show these "why" facts as a small "Papa's note" line that appears with the relevant step (in Papa's warm voice), not as a wall of text.

## The model (pure function; mark numbers "≈" / "approx.")
- 1 mole of gas ≈ 22.4 L at STP (ICSE value). Zn 65 g → 1 mol H₂ (2 g) ≈ 22.4 L. So 0.065 g Zn → ≈ 22.4 mL H₂.
- Scale: zinc added 1.3 g (≈ 448 mL H₂ possible with enough acid). Gas jar holds ≈ 112 mL (marked approx.). Air in flask + tube to push out first ≈ 112 mL (one jar's worth, rejected).
- Mg = 24 g/mol, Fe = 56 g/mol: zinc-equivalent mass for same H₂ changes accordingly; show "metal used (g)" from the model. Cu → 0 mL.
- Rate (bubbles/second, a friendly relative number): Mg fast (~8), Zn steady (~4), Fe slow (~1.5), Cu 0. Mark as approximate/relative.
- Label approximate numbers with "≈" and a tiny footnote "numbers are approximate, at room-ish conditions / STP".

## Voice and words
All kid-facing text in Papa's warm voice. Opening line at top: "Hey Sairah, it's Papa. Let's make some hydrogen together!" NEVER use mechanical labels like "Warm-up", "Part A", "Question 1", "Step 1 of 7" chips are fine as plain numbers on buttons. No answer keys anywhere in the page.
Below the machine add 4 gentle "Can you guess why?" prompts, each with a free-text textarea (saved to localStorage only, nothing sent anywhere). Use exactly these 4 prompts:
 1. "Why do you think the thistle funnel's tip has to stay under the acid?"
 2. "We let the first bubbles go. Can you guess why?"
 3. "Why do you think we collect hydrogen over water and not just in an open jar of air?"
 4. "If we swapped zinc for copper, what do you think would happen — and why?"
No answers shown.
Title the page "The Hydrogen Machine". Add <meta name="robots" content="noindex">. Do not put her full name anywhere other than the greeting line.

## Done means
- index.html opens in headless Chrome with no console errors; all 7 steps play; Auto mode works; Start over resets; metal chooser works.
- Use the skill's scripts/capture.mjs / drive.mjs (or your own headless Chrome / puppeteer-free CDP script) to capture stills mid-every-step at 1280×900 and 390×844; check for overlaps, overflow, hidden parts, and numbers that disagree; fix.
- Save 3 good stills as PNG into ./stills/ (e.g. stills/desktop-fizz.png, stills/desktop-pop.png, stills/phone-collect.png).
- Write a short NOTES.md here listing what you built and any limitations.
