/* ============================================================
 * GEQ Toolkit — app logic
 * Flow: welcome → participant info → module(s) → results/export
 * No dependencies, no build step. Everything runs client-side.
 * ============================================================ */

(function () {
  "use strict";

  const cfg = STUDY_CONFIG;
  const app = document.getElementById("app");
  const spine = document.getElementById("spine");

  const state = {
    participantId: "",
    demographics: {},
    answers: {},        // moduleId -> array of values
    scores: {},         // moduleId -> { component: score }
    startedAt: null,
    finishedAt: null,
    step: -1            // -1 welcome, 0..n-1 modules, n results
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

  /* ---------- screens ---------- */

  function showWelcome() {
    state.step = -1;
    renderSpine();

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
             <input type="text" id="pid" placeholder="e.g. P01"></label>`
        : "";

    app.innerHTML = "";
    app.appendChild(
      el(`<div>
        <p class="eyebrow">${esc(cfg.studyTitle)}</p>
        <h1>How was your experience playing<br>${esc(cfg.gameName)}?</h1>
        <p class="lede">You'll rate a series of short statements about how you felt
        while playing. There are no right or wrong answers — please answer honestly.
        It takes about 5–10 minutes, and your responses are used for research only.</p>
        <div class="card">
          <h2>Before you start</h2>
          ${idField}
          ${demoFields}
          <button class="primary" id="startBtn">Start questionnaire</button>
          <p class="status">Conducted by ${esc(cfg.researcher)}</p>
        </div>
      </div>`)
    );

    document.getElementById("startBtn").addEventListener("click", () => {
      if (cfg.participantId === "ask") {
        const v = document.getElementById("pid").value.trim();
        if (!v) {
          alert("Please enter your Participant ID.");
          return;
        }
        state.participantId = v;
      } else {
        state.participantId = autoId();
      }
      document.querySelectorAll("[data-demo]").forEach((f) => {
        state.demographics[f.dataset.demo] = f.value || "";
      });
      state.startedAt = new Date().toISOString();
      state.step = 0;
      showModule();
    });
  }

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
        return `<fieldset class="item" id="row-${i}" style="border:1px solid var(--line)">
          <div class="stem"><span class="num">${String(i + 1).padStart(2, "0")}</span>
          <span class="text">${esc(text)}</span></div>
          <div class="seg">${opts}</div>
        </fieldset>`;
      })
      .join("");

    const isLast = state.step === cfg.modules.length - 1;

    app.innerHTML = `
      <p class="eyebrow">Part ${state.step + 1} of ${cfg.modules.length} · ${esc(mod.name)}</p>
      <h1>${esc(mod.instruction)}</h1>
      ${legend}
      ${items}
      <p class="missing-note" id="missingNote">Some items are unanswered — they're outlined in red above.</p>
      <button class="primary" id="nextBtn">${isLast ? "Finish" : "Continue to next part"}</button>`;

    // fieldsets pick up .item styles; strip default fieldset chrome
    document.querySelectorAll("fieldset.item").forEach((f) => {
      f.style.margin = "10px 0 0";
      f.style.padding = "16px 18px";
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      const answers = [];
      let firstMissing = null;
      mod.items.forEach((_, i) => {
        const sel = document.querySelector(`input[name="${modId}-${i}"]:checked`);
        const row = document.getElementById(`row-${i}`);
        row.classList.remove("missing");
        if (sel) {
          answers[i] = Number(sel.value);
        } else {
          row.classList.add("missing");
          if (firstMissing === null) firstMissing = row;
        }
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

  function showResults() {
    renderSpine();
    state.finishedAt = new Date().toISOString();
    window.scrollTo(0, 0);

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
            <h2>${esc(GEQ_MODULES[modId].name)}</h2>
            <table class="scores">
              <tr><th>Component</th><th style="width:45%"></th><th>0–4</th></tr>
              ${rows}
            </table>
          </div>`;
        })
        .join("");
    }

    app.innerHTML = `
      <p class="eyebrow">Complete</p>
      <h1>Thank you, your responses are recorded.</h1>
      <p class="lede">Please download your response file below and send it to the
      researcher${cfg.webhookUrl ? " — it has also been submitted automatically" : ""}.</p>
      ${scoreTables}
      <div class="card">
        <h2>Save your responses</h2>
        <button class="ghost" id="csvBtn">Download CSV</button>
        <button class="ghost" id="jsonBtn">Download JSON</button>
        <p class="status" id="webhookStatus"></p>
      </div>`;

    document.getElementById("csvBtn").addEventListener("click", () =>
      download(buildCsv(), csvJsonName("csv"), "text/csv")
    );
    document.getElementById("jsonBtn").addEventListener("click", () =>
      download(JSON.stringify(buildRecord(), null, 2), csvJsonName("json"), "application/json")
    );

    if (cfg.webhookUrl) submitWebhook();
  }

  /* ---------- export ---------- */

  function buildRecord() {
    return {
      participant_id: state.participantId,
      game: cfg.gameName,
      started_at: state.startedAt,
      finished_at: state.finishedAt,
      demographics: state.demographics,
      answers: state.answers,
      component_scores: state.scores
    };
  }

  function csvHeaderAndRow() {
    const header = ["participant_id", "game", "started_at", "finished_at"];
    const row = [state.participantId, cfg.gameName, state.startedAt, state.finishedAt];

    cfg.demographics.forEach((d) => {
      header.push("demo_" + d.id);
      row.push(state.demographics[d.id]);
    });

    cfg.modules.forEach((modId) => {
      state.answers[modId].forEach((v, i) => {
        header.push(`${modId}_item${i + 1}`);
        row.push(v);
      });
      Object.entries(state.scores[modId]).forEach(([comp, val]) => {
        header.push(`${modId}_score_${comp.replace(/[^A-Za-z]+/g, "_")}`);
        row.push(val);
      });
    });
    return { header, row };
  }

  function buildCsv() {
    const { header, row } = csvHeaderAndRow();
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    return header.map(q).join(",") + "\n" + row.map(q).join(",") + "\n";
  }

  function csvJsonName(ext) {
    return `geq_${cfg.gameName.replace(/\s+/g, "-").toLowerCase()}_${state.participantId}.${ext}`;
  }

  function download(content, filename, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function submitWebhook() {
    const status = document.getElementById("webhookStatus");
    status.textContent = "Submitting to researcher's sheet…";
    fetch(cfg.webhookUrl, {
      method: "POST",
      mode: "no-cors", // Apps Script web apps don't send CORS headers
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(buildRecord())
    })
      .then(() => {
        status.textContent = "✓ Submitted automatically. Downloading a copy is still recommended.";
        status.className = "status ok";
      })
      .catch(() => {
        status.textContent =
          "Automatic submission failed — please download the CSV and send it to the researcher.";
        status.className = "status err";
      });
  }

  showWelcome();
})();
