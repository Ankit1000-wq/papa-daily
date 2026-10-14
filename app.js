(() => {
  const $ = (id) => document.getElementById(id);

  const emptyEl = $("empty");
  const mainEl = $("main");
  const doneEl = $("done");
  const titleEl = $("title");
  const metaEl = $("meta");
  const passageEl = $("passage");
  const fieldsEl = $("fields");
  const formEl = $("form");
  const submitBtn = $("submit");
  const statusEl = $("status");
  const showEl = $("show");
  const showMsgEl = $("show-msg");
  const answersTextEl = $("answers-text");
  const copyBtn = $("copy-btn");
  const shareBtn = $("share-btn");
  const editBtn = $("edit-btn");

  let content = null;
  // true when served from a static host (no /api backend), e.g. GitHub Pages
  let staticMode = false;
  let answersText = "";

  function showEmpty() {
    showEl.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    mainEl.classList.add("hidden");
    doneEl.classList.add("hidden");
    titleEl.textContent = "Today’s bite";
    metaEl.hidden = true;
  }

  function showMain() {
    showEl.classList.add("hidden");
    emptyEl.classList.add("hidden");
    mainEl.classList.remove("hidden");
    doneEl.classList.add("hidden");
  }

  function showDone() {
    showEl.classList.add("hidden");
    emptyEl.classList.add("hidden");
    mainEl.classList.add("hidden");
    doneEl.classList.remove("hidden");
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function render(data) {
    if (!data || !data.date || !Array.isArray(data.fields) || data.fields.length === 0) {
      showEmpty();
      return;
    }

    content = data;
    titleEl.textContent = data.title || "Today’s bite";

    const bits = [];
    if (data.date) bits.push(`<span>${formatDate(data.date)}</span>`);
    if (data.minutes) bits.push(`<span>~${escapeHtml(data.minutes)} min</span>`);
    metaEl.innerHTML = bits.join("");
    metaEl.hidden = bits.length === 0;

    passageEl.innerHTML = data.kidHtml || "";

    fieldsEl.innerHTML = "";
    for (const field of data.fields) {
      if (!field || !field.id) continue;
      const label = document.createElement("label");
      label.className = "field";
      label.htmlFor = field.id;

      const lbl = document.createElement("span");
      lbl.className = "lbl";
      lbl.textContent = field.label || field.id;

      const input = document.createElement("textarea");
      input.id = field.id;
      input.name = field.id;
      input.rows = field.id === "stretch" ? 3 : 4;
      input.placeholder = "Type your answer here…";
      input.autocomplete = "off";

      label.appendChild(lbl);
      label.appendChild(input);
      fieldsEl.appendChild(label);
    }

    showMain();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchJson(url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  async function loadContent() {
    // 1) Live server (node server.js) → api/content
    let data = await fetchJson("api/content");
    if (!data || typeof data !== "object") {
      // 2) Static host → content.json next to this page (cache-busted)
      data = await fetchJson("content.json?v=" + Date.now());
      staticMode = !!data;
    }
    render(data);
  }

  function buildAnswersText(answers) {
    const lines = [`Sairah's answers — ${formatDate(content.date) || content.date}`, ""];
    for (const field of content.fields) {
      if (!field || !field.id) continue;
      const val = answers[field.id];
      if (!val) continue;
      lines.push(`⭐ ${field.label || field.id}`);
      lines.push(val);
      lines.push("");
    }
    return lines.join("\n").trim();
  }

  async function copyAnswers() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(answersText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = answersText;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      showMsgEl.textContent = "Copied! 🎉 Paste it in a message to Papa — or just show him this screen.";
    } catch (_) {
      showMsgEl.textContent = "Couldn’t copy, but that’s okay — just show this screen to Papa! 💛";
    }
  }

  function showForPapa(answers) {
    answersText = buildAnswersText(answers);
    answersTextEl.textContent = answersText;
    showMsgEl.textContent =
      "Lovely work! Show this screen to Papa, or copy your answers and send them to him.";
    if (navigator.share) shareBtn.classList.remove("hidden");
    emptyEl.classList.add("hidden");
    mainEl.classList.add("hidden");
    doneEl.classList.add("hidden");
    showEl.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  copyBtn.addEventListener("click", copyAnswers);
  shareBtn.addEventListener("click", async () => {
    try {
      await navigator.share({ title: "My answers for Papa", text: answersText });
    } catch (_) {
      /* cancelled — nothing to do */
    }
  });
  editBtn.addEventListener("click", () => {
    submitBtn.disabled = false;
    statusEl.textContent = "";
    showMain();
  });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!content) return;

    statusEl.textContent = "";
    statusEl.classList.remove("error");

    const answers = {};
    for (const field of content.fields) {
      const el = $(field.id);
      answers[field.id] = el ? el.value.trim() : "";
    }

    const required = content.fields.filter((f) => f.id !== "stretch");
    const missing = required.some((f) => !answers[f.id]);
    if (missing) {
      statusEl.textContent = "Please answer the main questions first (stretch is optional).";
      statusEl.classList.add("error");
      return;
    }

    if (staticMode) {
      // No backend on the static host: let her show / copy the answers for Papa.
      showForPapa(answers);
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = "Sending…";

    try {
      const res = await fetch("api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          date: content.date,
          answers,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Send failed");
      }
      showDone();
    } catch (_) {
      // Server unreachable: never leave her stuck — fall back to "show Papa".
      submitBtn.disabled = false;
      statusEl.textContent = "";
      showForPapa(answers);
    }
  });

  loadContent();
})();
