// ---------- shared live runtime, part 2: steps, loop and her saved writing ----------
// ---------- buttons, hint, note ----------
function buttons() {
  document.querySelectorAll(".step").forEach((b, i) => {
    const can = i === S.done && S.playing < 0;
    b.disabled = !can;
    b.classList.toggle("done", i < S.done);
    b.classList.toggle("playing", i === S.playing);
    b.classList.toggle("next", can);
    b.setAttribute("aria-label", `${i + 1}. ${STEPS[i].label}${i < S.done ? " (done)" : ""}`);
  });
  const next = document.querySelector(".step.next, .step.playing");
  if (next && matchMedia("(max-width: 699px)").matches) {
    const strip = document.querySelector(".steps ol");
    const left = next.parentElement.offsetLeft - 16;
    if (Math.abs(strip.scrollLeft - left) > 4) strip.scrollTo({ left, behavior: still.matches ? "auto" : "smooth" });
  }
}
const hintOf = () => {
  if (typeof hintFor === "function") { const h = hintFor(); if (h) return h; }
  if (S.done >= STEPS.length && S.playing < 0) return DATA.doneHint;
  if (S.playing < 0 && S.done === 0) return "Tap step 1 to start.";
  return STEPS[S.playing >= 0 ? S.playing : S.done].hint;
};
const noteOf = () => {
  if (typeof noteFor === "function") { const n = noteFor(); if (n) return n; }
  const i = S.playing >= 0 ? S.playing : S.done - 1;
  return i < 0 ? DATA.firstNote : STEPS[i].note;
};
let lastHint = "", lastNote = "";
function wordsOnPage() {
  const h = hintOf(), n = noteOf();
  if (h !== lastHint) { lastHint = h; $("hint").textContent = h; }
  if (n !== lastNote) { lastNote = n; $("note").innerHTML = n; }
}
function chooser() {
  document.querySelectorAll(".segb[data-choice]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.choice === S.choice)));
  document.querySelectorAll(".ladder li[data-el]").forEach((li) => li.classList.toggle("pick", li.dataset.el === (DATA.ladderOf ? DATA.ladderOf[S.choice] : null)));
  if (typeof onChoice === "function") onChoice();
}

// ---------- the loop ----------
let frame = 0, last = 0, visible = true, autoTimer = 0;
function start(i) {
  if (i !== S.done || S.playing >= 0) return;
  S.playing = i; S.t = 0; S.t0 = 0; S.phase = 0; S.said = {};
  clearTimeout(autoTimer);
  kick();
}
function tick(now) {
  const real = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const dt = real * (still.matches ? 6 : 1);
  if (S.playing >= 0) {
    const finished = RUN[S.playing](S.t);
    if (typeof update === "function") update(dt);
    S.t += dt;
    if (finished) {
      S.done = S.playing + 1; S.playing = -1;
      if ($("auto").checked && S.done < STEPS.length) autoTimer = setTimeout(() => start(S.done), 1400);
    }
  } else if (typeof update === "function") update(dt);
  M = model(S);
  draw(real);
  panel(); buttons(); wordsOnPage();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
function kick() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) kick(); }, { rootMargin: "200px 0px" }).observe(document.querySelector(".lab"));

document.querySelectorAll(".step").forEach((b) => b.addEventListener("click", () => start(Number(b.dataset.step))));
$("auto").addEventListener("change", (e) => { if (e.target.checked && S.playing < 0 && S.done < STEPS.length) start(S.done); else clearTimeout(autoTimer); });
function reset(choice) {
  clearTimeout(autoTimer);
  words.innerHTML = "";
  if (typeof onReset === "function") onReset();
  S = base(choice);
  M = model(S);
  chooser(); kick();
  if ($("auto").checked) autoTimer = setTimeout(() => start(0), 900);
}
$("restart").addEventListener("click", (e) => { e.preventDefault(); reset(S.choice); });
document.querySelectorAll(".segb[data-choice]").forEach((b) => b.addEventListener("click", () => reset(b.dataset.choice)));
document.querySelectorAll(".segb[data-choice]").forEach((b, i, all) => b.addEventListener("keydown", (e) => {
  const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
  if (!d) return; e.preventDefault(); const n = all[(i + d + all.length) % all.length]; n.focus(); n.click();
}));

// her writing stays on this device
document.querySelectorAll("textarea[data-key]").forEach((t) => {
  const key = DATA.slug + "-" + t.dataset.key;
  try { t.value = localStorage.getItem(key) || ""; } catch (e) {}
  t.addEventListener("input", () => { try { localStorage.setItem(key, t.value); } catch (e) {} });
});
// tap-to-choose word slots (her choice, never marked right or wrong)
document.querySelectorAll(".slot").forEach((b) => {
  const opts = b.dataset.opts.split("|");
  const key = DATA.slug + "-" + b.dataset.key;
  let i = -1;
  try { i = opts.indexOf(localStorage.getItem(key)); } catch (e) {}
  const show = () => { b.textContent = i < 0 ? "tap to choose" : opts[i]; b.classList.toggle("picked", i >= 0); };
  b.addEventListener("click", () => { i = (i + 1) % opts.length; show(); try { localStorage.setItem(key, opts[i]); } catch (e) {} });
  show();
});
chooser();
kick();
