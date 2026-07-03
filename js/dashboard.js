/* ============================================================
 * GEQ Toolkit — researcher dashboard (FIXED)
 * Reads responses from localStorage + CSV/JSON import
 * FIXED: CSV import now reads ALL rows, not just the first
 * ============================================================ */

(function () {
  "use strict";

  const cfg = STUDY_CONFIG;
  const STORE_KEY = "geq_responses_v1";
  let responses = [];
  let filter = { gender: "all" };

  function gate() {
    if (!cfg.dashboardPasscode) { init(); return; }
    const ok = sessionStorage.getItem("geq_dash_unlocked") === "1";
    if (ok) { init(); return; }
    document.body.innerHTML = `
      <div class="gate">
        <form class="gate-panel" id="gateForm">
          <h1>Researcher Dashboard</h1>
          <p>Enter the passphrase to view participant data.</p>
          <input type="password" id="pw" autocomplete="off" placeholder="Passphrase" autofocus>
          <button class="btn primary" type="submit">Unlock</button>
          <div class="error" id="err"></div>
        </form>
      </div>`;
    document.getElementById("gateForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (document.getElementById("pw").value === cfg.dashboardPasscode) {
        sessionStorage.setItem("geq_dash_unlocked", "1");
        location.reload();
      } else {
        document.getElementById("err").textContent = "Incorrect passphrase.";
      }
    });
  }

  function init() {
    responses = loadFromLocal();
    render();
    setupTopbarActions();
  }

  function loadFromLocal() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function saveToLocal() {
    localStorage.setItem(STORE_KEY, JSON.stringify(responses));
  }

  function filtered() {
    return responses.filter((r) => {
      if (filter.gender !== "all" && r.gender !== filter.gender) return false;
      return true;
    });
  }

  function render() {
    const rs = filtered();
    if (responses.length === 0) {
      document.getElementById("dashBody").innerHTML = renderEmpty();
      setupImportZone();
      return;
    }
    document.getElementById("dashBody").innerHTML = `
      ${renderFilterBar()}
      ${renderStats(rs)}
      ${renderCharts(rs)}
      ${renderTable(rs)}
      ${renderImportZone()}`;
    drawAllCharts(rs);
    setupTableActions();
    setupImportZone();
    setupFilters();
  }

  function renderFilterBar() {
    const opts = ["all", "Male", "Female"];
    return `<div class="filter-bar">
      <span>Filter</span>
      <select id="fGender">
        ${opts.map((o) => `<option value="${o}" ${filter.gender === o ? "selected" : ""}>${o === "all" ? "All genders" : o}</option>`).join("")}
      </select>
      <span style="margin-left:auto">${filtered().length} of ${responses.length} shown</span>
    </div>`;
  }

  function renderEmpty() {
    return `<div class="empty">
      <h2>No responses yet</h2>
      <p>Once participants complete the questionnaire, their responses appear here automatically.<br>You can also import CSVs from other machines below.</p>
      ${renderImportZone()}
    </div>`;
  }

  function renderStats(rs) {
    const total = rs.length;
    const durations = rs.map((r) => r.duration_seconds).filter((x) => x > 0);
    const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const posAff = avgComponent(rs, "core", "Positive Affect");
    const negAff = avgComponent(rs, "core", "Negative Affect");
    return `<div class="stats-row">
      <div class="stat">
        <div class="label">Total participants</div>
        <div class="value">${total}</div>
        <div class="caption">responses collected</div>
      </div>
      <div class="stat">
        <div class="label">Avg completion</div>
        <div class="value">${Math.floor(avgDur / 60)}<small>m ${avgDur % 60}s</small></div>
        <div class="caption">time on task</div>
      </div>
      <div class="stat">
        <div class="label">Positive affect</div>
        <div class="value">${isFinite(posAff) ? posAff.toFixed(2) : "—"}<small>/ 4</small></div>
        <div class="caption">avg core score</div>
      </div>
      <div class="stat">
        <div class="label">Negative affect</div>
        <div class="value">${isFinite(negAff) ? negAff.toFixed(2) : "—"}<small>/ 4</small></div>
        <div class="caption">avg core score</div>
      </div>
    </div>`;
  }

  function renderCharts(rs) {
    return `<div class="chart-grid">
      <div class="panel span-4"><div class="kicker">01 · Radar (Minimal)</div><h3>GEQ core profile — component means</h3><div id="chart-radar"></div></div>
      <div class="panel span-2"><div class="kicker">02 · Gauge (Dual arc)</div><h3>Overall satisfaction</h3><div id="chart-gauge"></div></div>
      <div class="panel span-4"><div class="kicker">03 · Bar (Interactive)</div><h3>Component means across modules</h3><div id="chart-bar"></div></div>
      <div class="panel span-2"><div class="kicker">04 · Donut (Pie)</div><h3>Gender split</h3><div id="chart-donut"></div></div>
      <div class="panel span-3"><div class="kicker">05 · Ring (Legend)</div><h3>Post-game comparison</h3><div id="chart-ring"></div></div>
      <div class="panel span-3"><div class="kicker">06 · Funnel (Grid)</div><h3>Core components ranked high → low</h3><div id="chart-funnel"></div></div>
    </div>`;
  }

  function renderTable(rs) {
    const rows = rs.slice().reverse().map((r) => {
      const posAff = r.component_scores && r.component_scores.core && r.component_scores.core["Positive Affect"];
      const flow = r.component_scores && r.component_scores.core && r.component_scores.core["Flow"];
      return `<tr>
        <td class="mono">${esc(r.participant_id)}</td>
        <td>${esc(r.gender || "—")}</td>
        <td class="mono">${esc(r.demographics && r.demographics.age || "—")}</td>
        <td>${esc(r.demographics && r.demographics.gaming_freq || "—")}</td>
        <td class="mono">${new Date(r.finished_at).toLocaleString()}</td>
        <td class="mono">${posAff !== undefined ? posAff.toFixed(2) : "—"}</td>
        <td class="mono">${flow !== undefined ? flow.toFixed(2) : "—"}</td>
        <td class="row-actions">
          <button data-action="csv" data-id="${esc(r.participant_id)}">CSV</button>
          <button data-action="json" data-id="${esc(r.participant_id)}">JSON</button>
          <button class="del" data-action="del" data-id="${esc(r.participant_id)}">Delete</button>
        </td>
      </tr>`;
    }).join("");
    return `<div class="chart-grid"><div class="panel table-panel">
      <div class="kicker">Participants</div>
      <h3 style="margin-bottom:16px">All responses</h3>
      <div style="overflow-x:auto"><table class="data">
        <thead><tr>
          <th>ID</th><th>Gender</th><th>Age</th><th>Gaming</th>
          <th>Finished</th><th>Pos. affect</th><th>Flow</th><th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div></div>`;
  }

  function renderImportZone() {
    return `<div class="import-zone" id="importZone">
      <p>Drop CSV files here or <strong>click to browse</strong></p>
      <p style="font-size:12px;margin:4px 0 0">Merges participant responses from other testing machines.</p>
      <input type="file" id="importFiles" accept=".csv,.json" multiple hidden>
    </div>`;
  }

  function drawAllCharts(rs) {
    if (rs.length === 0) return;
    drawRadar(rs);
    drawGauge(rs);
    drawBar(rs);
    drawDonut(rs);
    drawRing(rs);
    drawFunnel(rs);
  }

  function drawRadar(rs) {
    const container = document.getElementById("chart-radar");
    if (!container) return;
    const comps = Object.keys(GEQ_MODULES.core.components);
    const data = comps.map((c) => ({ label: shortLabel(c), value: avgComponent(rs, "core", c) || 0 }));
    Charts.radar(container, data, { max: 4 });
  }

  function drawGauge(rs) {
    const container = document.getElementById("chart-gauge");
    if (!container) return;
    const pos = avgComponent(rs, "core", "Positive Affect") || 0;
    const flow = avgComponent(rs, "core", "Flow") || 0;
    const comp = avgComponent(rs, "core", "Competence") || 0;
    const neg = avgComponent(rs, "core", "Negative Affect") || 0;
    const overall = Math.max(0, Math.min(4, (pos + flow + comp) / 3 - neg * 0.3));
    Charts.gauge(container, overall, { max: 4, label: "Composite index" });
  }

  function drawBar(rs) {
    const container = document.getElementById("chart-bar");
    if (!container) return;
    const data = [];
    const modules = new Set();
    rs.forEach((r) => Object.keys(r.component_scores || {}).forEach((m) => modules.add(m)));
    modules.forEach((mod) => {
      if (!GEQ_MODULES[mod]) return;
      Object.keys(GEQ_MODULES[mod].components).forEach((c) => {
        const v = avgComponent(rs, mod, c);
        if (isFinite(v)) data.push({ label: `${shortLabel(c)} (${mod})`, value: v });
      });
    });
    data.sort((a, b) => b.value - a.value);
    Charts.bar(container, data, { max: 4 });
  }

  function drawDonut(rs) {
    const container = document.getElementById("chart-donut");
    if (!container) return;
    const counts = {};
    rs.forEach((r) => {
      const g = r.gender || "Unspecified";
      counts[g] = (counts[g] || 0) + 1;
    });
    const colors = { Male: Charts.theme.purple, Female: Charts.theme.rose, Unspecified: Charts.theme.muted };
    const data = Object.entries(counts).map(([label, value]) => ({ label, value, color: colors[label] }));
    Charts.donut(container, data);
  }

  function drawRing(rs) {
    const container = document.getElementById("chart-ring");
    if (!container) return;
    const modId = "postgame";
    if (!GEQ_MODULES[modId]) return;
    const series = Object.keys(GEQ_MODULES[modId].components).map((c) => ({
      label: shortLabel(c),
      value: avgComponent(rs, modId, c) || 0
    }));
    if (series.length === 0) {
      container.innerHTML = `<p style="color:var(--muted);font-size:13px;padding:20px 0">Post-game module data not available.</p>`;
      return;
    }
    Charts.ring(container, series, { max: 4 });
  }

  function drawFunnel(rs) {
    const container = document.getElementById("chart-funnel");
    if (!container) return;
    const data = Object.keys(GEQ_MODULES.core.components)
      .map((c) => ({ label: shortLabel(c), value: avgComponent(rs, "core", c) || 0 }))
      .sort((a, b) => b.value - a.value);
    Charts.funnel(container, data);
  }

  function avgComponent(rs, mod, comp) {
    const vals = rs.map((r) => r.component_scores && r.component_scores[mod] && r.component_scores[mod][comp])
      .filter((v) => typeof v === "number");
    if (!vals.length) return NaN;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function shortLabel(c) {
    return c
      .replace("Sensory and Imaginative Immersion", "Immersion")
      .replace("Tension/Annoyance", "Tension")
      .replace("Psychological Involvement – Empathy", "Ps. Empathy")
      .replace("Psychological Involvement – Negative Feelings", "Ps. Negative")
      .replace("Behavioural Involvement", "Behavioural")
      .replace("Returning to Reality", "Return to Reality")
      .replace("Negative Experience", "Neg. Experience")
      .replace("Positive Experience", "Pos. Experience");
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }

  function setupTableActions() {
    document.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id, action = btn.dataset.action;
        const rec = responses.find((r) => r.participant_id === id);
        if (!rec) return;
        if (action === "csv") download(recordToCsv(rec), `geq_${id}.csv`, "text/csv");
        else if (action === "json") download(JSON.stringify(rec, null, 2), `geq_${id}.json`, "application/json");
        else if (action === "del") {
          if (confirm(`Delete response for ${id}? This cannot be undone.`)) {
            responses = responses.filter((r) => r.participant_id !== id);
            saveToLocal();
            render();
          }
        }
      });
    });
  }

  // ===== FIXED CSV IMPORT: Now reads ALL rows, not just first =====
  function csvToRecords(text) {
    // Returns ARRAY of records (fixed: was only returning first row)
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const header = parseCsvLine(lines[0]);
    const records = [];
    
    // Loop through ALL data rows
    for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
      const values = parseCsvLine(lines[lineIdx]);
      if (values.every(v => !v.trim())) continue; // skip empty rows
      
      const map = {};
      header.forEach((h, i) => (map[h] = values[i]));

      const rec = {
        participant_id: map.participant_id,
        gender: map.gender || "",
        game: map.game || "",
        started_at: map.started_at,
        finished_at: map.finished_at,
        duration_seconds: Number(map.duration_seconds || 0),
        demographics: {},
        answers: {},
        component_scores: {}
      };

      for (const key in map) {
        if (key.startsWith("demo_")) rec.demographics[key.slice(5)] = map[key];
        else if (/^(core|ingame|social|postgame)_item\d+$/.test(key)) {
          const m = key.match(/^(\w+)_item(\d+)$/);
          rec.answers[m[1]] = rec.answers[m[1]] || [];
          rec.answers[m[1]][Number(m[2]) - 1] = Number(map[key]);
        } else if (/^(core|ingame|social|postgame)_score_/.test(key)) {
          const m = key.match(/^(\w+)_score_(.+)$/);
          const compName = restoreCompName(m[1], m[2]);
          rec.component_scores[m[1]] = rec.component_scores[m[1]] || {};
          rec.component_scores[m[1]][compName] = Number(map[key]);
        }
      }
      
      records.push(rec);
    }
    
    return records;
  }

  function setupImportZone() {
    const zone = document.getElementById("importZone");
    if (!zone) return;
    const input = document.getElementById("importFiles");
    zone.addEventListener("click", () => input.click());
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("hover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("hover"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault(); zone.classList.remove("hover");
      handleFiles(e.dataTransfer.files);
    });
    input.addEventListener("change", () => handleFiles(input.files));
  }

  // ===== FIXED handleFiles: Process ALL records from CSV =====
  function handleFiles(files) {
    let added = 0;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result;
          // FIXED: csvToRecords returns array; JSON returns single object wrapped in array
          const recs = f.name.endsWith(".json")
            ? [JSON.parse(text)]
            : csvToRecords(text);
          
          // Process ALL records
          recs.forEach((rec) => {
            if (rec && rec.participant_id) {
              responses = responses.filter((r) => r.participant_id !== rec.participant_id);
              responses.push(rec);
              added += 1;
            }
          });
          
          if (added > 0) {
            saveToLocal();
            render();
          }
        } catch (e) { console.warn("Failed to parse", f.name, e); }
      };
      reader.readAsText(f);
    });
  }

  function restoreCompName(mod, slug) {
    if (!GEQ_MODULES[mod]) return slug;
    for (const c of Object.keys(GEQ_MODULES[mod].components)) {
      if (c.replace(/[^A-Za-z]+/g, "_") === slug) return c;
    }
    return slug;
  }

  function parseCsvLine(line) {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") { out.push(cur); cur = ""; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  }

  function recordToCsv(rec) {
    const header = ["participant_id", "gender", "game", "started_at", "finished_at", "duration_seconds"];
    const row = [rec.participant_id, rec.gender, rec.game, rec.started_at, rec.finished_at, rec.duration_seconds];
    for (const k in rec.demographics) { header.push("demo_" + k); row.push(rec.demographics[k]); }
    for (const mod in rec.answers) {
      rec.answers[mod].forEach((v, i) => { header.push(`${mod}_item${i + 1}`); row.push(v); });
      for (const c in (rec.component_scores[mod] || {})) {
        header.push(`${mod}_score_${c.replace(/[^A-Za-z]+/g, "_")}`);
        row.push(rec.component_scores[mod][c]);
      }
    }
    const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    return header.map(q).join(",") + "\n" + row.map(q).join(",") + "\n";
  }

  function exportAll() {
    if (!responses.length) return alert("No responses to export.");
    const cols = new Set(["participant_id", "gender", "game", "started_at", "finished_at", "duration_seconds"]);
    responses.forEach((r) => {
      for (const k in (r.demographics || {})) cols.add("demo_" + k);
      for (const mod in (r.answers || {})) {
        r.answers[mod].forEach((_, i) => cols.add(`${mod}_item${i + 1}`));
        for (const c in (r.component_scores[mod] || {})) {
          cols.add(`${mod}_score_${c.replace(/[^A-Za-z]+/g, "_")}`);
        }
      }
    });
    const header = Array.from(cols);
    const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const lines = [header.map(q).join(",")];
    responses.forEach((r) => {
      const flat = {
        participant_id: r.participant_id, gender: r.gender, game: r.game,
        started_at: r.started_at, finished_at: r.finished_at, duration_seconds: r.duration_seconds
      };
      for (const k in (r.demographics || {})) flat["demo_" + k] = r.demographics[k];
      for (const mod in (r.answers || {})) {
        r.answers[mod].forEach((v, i) => (flat[`${mod}_item${i + 1}`] = v));
        for (const c in (r.component_scores[mod] || {})) {
          flat[`${mod}_score_${c.replace(/[^A-Za-z]+/g, "_")}`] = r.component_scores[mod][c];
        }
      }
      lines.push(header.map((h) => q(flat[h])).join(","));
    });
    download(lines.join("\n") + "\n", `geq_all_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
  }

  function download(content, filename, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  }

  function setupTopbarActions() {
    document.getElementById("exportAll").addEventListener("click", exportAll);
    document.getElementById("clearAll").addEventListener("click", () => {
      if (!responses.length) return;
      if (confirm(`Delete ALL ${responses.length} responses from this browser? This cannot be undone.`)) {
        responses = []; saveToLocal(); render();
      }
    });
  }

  function setupFilters() {
    const g = document.getElementById("fGender");
    if (g) g.addEventListener("change", () => { filter.gender = g.value; render(); });
  }

  gate();
})();