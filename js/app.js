/* ============================================================
 * GEQ Toolkit — participant app
 * Flow: hero welcome → module(s) → results/export
 * Persists completed responses to localStorage for the dashboard.
 * ============================================================ */

(function () {
  "use strict";

  const cfg = STUDY_CONFIG;
  const app = document.getElementById("app");
  const spine = document.getElementById("spine");

  const state = {
    participantId: "",
    gender: "",
    demographics: {},
    answers: {},
    scores: {},
    startedAt: null,
    finishedAt: null,
    step: -1
  };

  /* ---------- helpers ---------- */
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }
  function autoId() {
    return "P-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function renderSpine() {
    spine.innerHTML = "";
    cfg.modules.forEach((m, i) => {
      const s = document.createElement("span");
      if (state.step > i) s.className = "done";
      else if (state.step === i) s.className = "now";
      spine.appendChild(s);
    });
  }

  /* ---------- HERO WELCOME ---------- */
  function showWelcome() {
    document.body.classList.add("hero-mode");
    state.step = -1;
    renderSpine();

    const genderField = cfg.askGender
      ? `<label class="field">Gender
          <div class="chip-row">
            <div class="chip">
              <input type="radio" name="gender" id="g-m" value="Male">
              <label for="g-m">Male</label>
            </div>
            <div class="chip">
              <input type="radio" name="gender" id="g-f" value="Female">
              <label for="g-f">Female</label>
            </div>
          </div>
        </label>`
      : "";

    const demoFields = cfg.demographics
      .map((d) => {
        if (d.type === "select") {
          const opts = d.options
            .map((o) => `<option value="${esc(o)}">${esc(o)}</option>`)
            .join("");
          return `<label class="field">${esc(d.label)}
            <select data-demo="${esc(d.id)}">
              <option value="" selected disabled>Select…</option>${opts}
            </select></label>`;
        }
        return `<label class="field">${esc(d.label)}
          <input type="${d.type === "number" ? "number" : "text"}" data-demo="${esc(d.id)}"></label>`;
      })
      .join("");

    const idField =
      cfg.participantId === "ask"
        ? `<label class="field">Participant ID (given by the researcher)
             <input type="text" id="pid" placeholder="e.g. P01" autocomplete="off"></label>`
        : "";

    const logo = cfg.logoImage
      ? `<img src="${esc(cfg.logoImage)}" alt="${esc(cfg.gameName)}" class="hero-logo">`
      : `<h1 class="hero-title">${esc(cfg.gameName)}</h1>`;

    const heroBg = cfg.heroImage
      ? `<div class="hero-bg" style="background-image:url('${esc(cfg.heroImage)}')"></div>`
      : `<div class="hero-bg" style="background:linear-gradient(135deg,#1e1936,#4a2f5c)"></div>`;

    const tagline = cfg.tagline
      ? `<p class="hero-tagline">${esc(cfg.tagline)}</p>`
      : "";

    app.innerHTML = "";
    app.appendChild(
      el(`<section class="hero">
        ${heroBg}
        <div class="hero-inner">
          <div class="hero-left">
            ${logo}
            <p class="hero-eyebrow">${esc(cfg.studyTitle)}</p>
            <h1 class="hero-title">How was your experience with <em>${esc(cfg.gameName)}</em>?</h1>
            ${tagline}
            <p class="hero-lede">You'll rate a series of short statements about how you felt while playing. There are no right or wrong answers — please answer honestly. It takes about 5–10 minutes, and your responses are used for research only.</p>
            <div class="hero-meta">
              <div><strong>5–10 min</strong>Estimated time</div>
              <div><strong>${cfg.modules.length}</strong>Section${cfg.modules.length > 1 ? "s" : ""}</div>
              <div><strong>0–4</strong>Rating scale</div>
            </div>
          </div>
          <div class="hero-panel">
            <p class="step-note">Step 1 — Before you begin</p>
            <h2>Tell us about yourself</h2>
            ${idField}
            ${genderField}
            ${demoFields}
            <button class="primary" id="startBtn">Start questionnaire →</button>
            <p class="footnote">Conducted by ${esc(cfg.researcher)}</p>
          </div>
        </div>
        <div class="scroll-hint">Scroll or start above</div>
      </section>`)
    );

    document.getElementById("startBtn").addEventListener("click", handleStart);
  }

  function handleStart() {
    if (cfg.participantId === "ask") {
      const v = document.getElementById("pid").value.trim();
      if (!v) { alert("Please enter your Participant ID."); return; }
      state.participantId = v;
    } else {
      state.participantId = autoId();
    }
    if (cfg.askGender) {
      const g = document.querySelector('input[name="gender"]:checked');
      if (!g) { alert("Please select your gender."); return; }
      state.gender = g.value;
    }
    document.querySelectorAll("[data-demo]").forEach((f) => {
      state.demographics[f.dataset.demo] = f.value || "";
    });
    state.startedAt = new Date().toISOString();
    state.step = 0;
    document.body.classList.remove("hero-mode");
    showModule();
  }

  /* ---------- MODULE PAGE ---------- */
  function showModule() {
    renderSpine();
    const modId = cfg.modules[state.step];
    const mod = GEQ_MODULES[modId];
    window.scrollTo(0, 0);

    const legend = `<div class="legend">${GEQ_SCALE.map(
      (s) => `<div><b>${s.value}</b>${esc(s.label)}</div>`
    ).join("")}</div>`;

    const items = mod.items
      .map((text, i) => {
        const opts = GEQ_SCALE.map(
          (s) => `
          <input type="radio" name="${modId}-${i}" id="${modId}-${i}-${s.value}" value="${s.value}">
          <label for="${modId}-${i}-${s.value}">${s.value}<small>${esc(s.label)}</small></label>`
        ).join("");
        return `<fieldset class="item" id="row-${i}">
          <div class="stem"><span class="num">${String(i + 1).padStart(2, "0")}</span>
          <span class="text">${esc(text)}</span></div>
          <div class="seg">${opts}</div>
        </fieldset>`;
      })
      .join("");

    const isLast = state.step === cfg.modules.length - 1;

    app.innerHTML = `
      <div class="wrap">
        <p class="eyebrow">Part ${state.step + 1} of ${cfg.modules.length} · ${esc(mod.name)}</p>
        <h1 class="q-title">${esc(mod.instruction)}</h1>
        ${legend}
        ${items}
        <p class="missing-note" id="missingNote">Some items are unanswered — they're outlined in red above.</p>
        <button class="primary" id="nextBtn">${isLast ? "Finish" : "Continue to next part →"}</button>
      </div>`;

    document.querySelectorAll("fieldset.item").forEach((f) => {
      f.style.margin = "10px 0 0"; f.style.padding = "16px 18px"; f.style.border = "1px solid var(--line)";
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      const answers = [];
      let firstMissing = null;
      mod.items.forEach((_, i) => {
        const sel = document.querySelector(`input[name="${modId}-${i}"]:checked`);
        const row = document.getElementById(`row-${i}`);
        row.classList.remove("missing");
        if (sel) answers[i] = Number(sel.value);
        else { row.classList.add("missing"); if (firstMissing === null) firstMissing = row; }
      });
      if (firstMissing) {
        document.getElementById("missingNote").style.display = "block";
        firstMissing.scrollIntoView({ block: "center" });
        return;
      }
      state.answers[modId] = answers;
      state.scores[modId] = scoreModule(modId, answers);
      state.step += 1;
      if (state.step < cfg.modules.length) showModule();
      else showResults();
    });
  }

  /* ---------- RESULTS ---------- */
  function showResults() {
    renderSpine();
    state.finishedAt = new Date().toISOString();
    window.scrollTo(0, 0);

    if (cfg.saveToDashboard) saveToLocal();

    let scoreTables = "";
    if (cfg.showResultsToParticipant) {
      scoreTables = cfg.modules
        .map((modId) => {
          const rows = Object.entries(state.scores[modId])
            .map(
              ([comp, val]) => `<tr>
                <td>${esc(comp)}</td>
                <td><div class="bar"><i style="width:${(val / 4) * 100}%"></i></div></td>
                <td class="val">${val.toFixed(2)}</td>
              </tr>`
            )
            .join("");
          return `<div class="card">
            <h2 style="font-family:var(--font-display);margin:0 0 8px">${esc(GEQ_MODULES[modId].name)}</h2>
            <table class="scores">
              <tr><th>Component</th><th style="width:45%"></th><th>0–4</th></tr>
              ${rows}
            </table>
          </div>`;
        })
        .join("");
    }

    app.innerHTML = `
      <div class="wrap">
        <p class="eyebrow">Complete</p>
        <h1 class="q-title">Thank you, your responses are recorded.</h1>
        <p style="color:var(--muted);max-width:56ch">Please download your response file below and send it to the
        researcher${cfg.webhookUrl ? " — it has also been submitted automatically" : ""}.</p>
        ${scoreTables}
        <div class="card">
          <h2 style="font-family:var(--font-display);margin:0 0 12px">Save your responses</h2>
          <button class="ghost" id="csvBtn">Download CSV</button>
          <button class="ghost" id="jsonBtn">Download JSON</button>
          <p class="status" id="webhookStatus"></p>
        </div>
      </div>`;

    document.getElementById("csvBtn").addEventListener("click", () =>
      download(buildCsv(), fileName("csv"), "text/csv")
    );
    document.getElementById("jsonBtn").addEventListener("click", () =>
      download(JSON.stringify(buildRecord(), null, 2), fileName("json"), "application/json")
    );

    if (cfg.webhookUrl) submitWebhook();
  }

  /* ---------- record / export ---------- */
  function buildRecord() {
    return {
      participant_id: state.participantId,
      gender: state.gender,
      game: cfg.gameName,
      started_at: state.startedAt,
      finished_at: state.finishedAt,
      duration_seconds: Math.round(
        (new Date(state.finishedAt) - new Date(state.startedAt)) / 1000
      ),
      demographics: state.demographics,
      answers: state.answers,
      component_scores: state.scores
    };
  }

  function csvHeaderAndRow() {
    const header = ["participant_id", "gender", "game", "started_at", "finished_at", "duration_seconds"];
    const rec = buildRecord();
    const row = [rec.participant_id, rec.gender, rec.game, rec.started_at, rec.finished_at, rec.duration_seconds];
    cfg.demographics.forEach((d) => {
      header.push("demo_" + d.id); row.push(state.demographics[d.id]);
    });
    cfg.modules.forEach((modId) => {
      state.answers[modId].forEach((v, i) => { header.push(`${modId}_item${i + 1}`); row.push(v); });
      Object.entries(state.scores[modId]).forEach(([comp, val]) => {
        header.push(`${modId}_score_${comp.replace(/[^A-Za-z]+/g, "_")}`); row.push(val);
      });
    });
    return { header, row };
  }

  function buildCsv() {
    const { header, row } = csvHeaderAndRow();
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    return header.map(q).join(",") + "\n" + row.map(q).join(",") + "\n";
  }

  function fileName(ext) {
    return `geq_${cfg.gameName.replace(/\s+/g, "-").toLowerCase()}_${state.participantId}.${ext}`;
  }

  function download(content, filename, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function saveToLocal() {
    try {
      const key = "geq_responses_v1";
      const all = JSON.parse(localStorage.getItem(key) || "[]");
      // dedupe on participant_id — keep the latest
      const kept = all.filter((r) => r.participant_id !== state.participantId);
      kept.push(buildRecord());
      localStorage.setItem(key, JSON.stringify(kept));
    } catch (e) { /* storage disabled or full — silently skip */ }
  }

  function submitWebhook() {
    const status = document.getElementById("webhookStatus");
    status.textContent = "Submitting to researcher's sheet…";
    fetch(cfg.webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(buildRecord())
    })
      .then(() => {
        status.textContent = "✓ Submitted automatically. Downloading a copy is still recommended.";
        status.className = "status ok";
      })
      .catch(() => {
        status.textContent = "Automatic submission failed — please download the CSV and send it to the researcher.";
        status.className = "status err";
      });
  }

  showWelcome();
})();
