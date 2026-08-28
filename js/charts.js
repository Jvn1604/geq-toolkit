/* ============================================================
 * GEQ Toolkit — chart library
 * Six chart types inspired by bklit/bklit-ui, implemented in pure
 * SVG so the dashboard has zero runtime dependencies.
 * ============================================================ */

const CHART_THEME = {
  accent: "#e8734a",
  gold: "#f2b134",
  coral: "#f0824a",
  purple: "#7b5aa3",
  teal: "#4a9d94",
  rose: "#d96b7e",
  ink: "#f5e6d3",
  muted: "#8a7fa8",
  grid: "rgba(245,230,211,0.08)",
  gridStrong: "rgba(245,230,211,0.18)"
};

const CHART_PALETTE = [
  CHART_THEME.accent,
  CHART_THEME.gold,
  CHART_THEME.purple,
  CHART_THEME.teal,
  CHART_THEME.rose,
  CHART_THEME.coral
];

const Charts = {};

/* ---------------- helpers ---------------- */
function svg(w, h, attrs) {
  const a = attrs || "";
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" ${a}>`;
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}
function polarToXY(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx, cy, r, start, end) {
  const s = polarToXY(cx, cy, r, end);
  const e = polarToXY(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}
function donutSlice(cx, cy, rOuter, rInner, start, end) {
  const so = polarToXY(cx, cy, rOuter, end);
  const eo = polarToXY(cx, cy, rOuter, start);
  const si = polarToXY(cx, cy, rInner, start);
  const ei = polarToXY(cx, cy, rInner, end);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${so.x} ${so.y}
          A ${rOuter} ${rOuter} 0 ${large} 0 ${eo.x} ${eo.y}
          L ${si.x} ${si.y}
          A ${rInner} ${rInner} 0 ${large} 1 ${ei.x} ${ei.y} Z`;
}
/* Word-wrap text into up to maxLines lines of ~charsPerLine chars each,
 * so labels are readable in full rather than hard-truncated mid-word. */
function wrapLines(text, charsPerLine, maxLines) {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (test.length > charsPerLine && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) { cur = ""; break; }
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;

  const consumedLen = lines.join(" ").length;
  if (consumedLen < String(text).trim().length && lines.length) {
    let last = lines[lines.length - 1];
    if (last.length > charsPerLine - 1) last = last.slice(0, charsPerLine - 1).trim();
    lines[lines.length - 1] = last + "\u2026";
  }
  return lines.length ? lines : [""];
}

/* ---------------- 1. BAR CHART - INTERACTIVE ---------------- */
Charts.bar = function (container, data, opts) {
  opts = opts || {};
  const max = opts.max || 4;
  const W = 640;
  const padL = opts.padL || 250, padR = 46, padT = 20, padB = 24;
  const plotW = W - padL - padR;
  const fontSize = 11, lineHeight = 13;
  const maxLines = opts.maxLines || 4;
  const charsPerLine = opts.charsPerLine || Math.max(14, Math.floor((padL - 14) / (fontSize * 0.55)));

  const rows = data.map((d) => ({
    ...d,
    lines: wrapLines(d.label, charsPerLine, maxLines)
  }));
  const rowHeights = rows.map((r) => Math.max(30, r.lines.length * lineHeight + 16));
  const plotH = rowHeights.reduce((a, b) => a + b, 0);
  const H = padT + padB + plotH;

  const gridLines = [];
  for (let i = 0; i <= max; i++) {
    const x = padL + (i / max) * plotW;
    gridLines.push(`<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + plotH}" stroke="${CHART_THEME.grid}" stroke-width="1"/>`);
    gridLines.push(`<text x="${x}" y="${H - 6}" text-anchor="middle" fill="${CHART_THEME.muted}" font-family="IBM Plex Mono" font-size="10.5">${i}</text>`);
  }

  let cursorY = padT;
  const bars = rows.map((d, i) => {
    const rowH = rowHeights[i];
    const barH = Math.min(22, rowH - 12);
    const barY = cursorY + (rowH - barH) / 2;
    const w = (d.value / max) * plotW;
    const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length];
    const textBlockH = d.lines.length * lineHeight;
    const firstLineY = cursorY + rowH / 2 - textBlockH / 2 + lineHeight - 3;
    const tspans = d.lines.map((line, li) => `<tspan x="${padL - 14}" y="${firstLineY + li * lineHeight}">${esc(line)}</tspan>`).join("");
    const rowSvg = `
      <g class="bar-row" data-label="${esc(d.label)}" data-value="${d.value}">
        <text text-anchor="end" fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="${fontSize}">${tspans}</text>
        <rect x="${padL}" y="${barY}" width="${plotW}" height="${barH}" fill="${CHART_THEME.grid}" rx="3"/>
        <rect x="${padL}" y="${barY}" width="${w}" height="${barH}" fill="${color}" rx="3">
          <title>${esc(d.label)}: ${d.value.toFixed(2)}</title>
        </rect>
        <text x="${padL + w + 8}" y="${barY + barH / 2 + 4}" fill="${CHART_THEME.ink}" font-family="IBM Plex Mono" font-size="11.5">${d.value.toFixed(2)}</text>
      </g>`;
    cursorY += rowH;
    return rowSvg;
  }).join("");

  container.innerHTML = `${svg(W, H)}
    ${gridLines.join("")}
    ${bars}
    </svg>`;
};

/* ---------------- 2. FUNNEL CHART - GRID BACKGROUND ---------------- */
Charts.funnel = function (container, data, opts) {
  opts = opts || {};
  const W = 480;
  const padT = 20, padB = 20, padX = 40;
  const fontSize = 11, lineHeight = 13;
  const maxLines = opts.maxLines || 4;
  const charsPerLine = opts.charsPerLine || 42;
  const maxV = Math.max(...data.map((d) => d.value), 0.0001);

  const rows = data.map((d) => ({ ...d, lines: wrapLines(d.label, charsPerLine, maxLines) }));
  const rowHeights = rows.map((r) => Math.max(56, r.lines.length * lineHeight + 30));
  const plotH = rowHeights.reduce((a, b) => a + b, 0);
  const H = padT + padB + plotH;

  // Grid background
  const grid = [];
  for (let x = 0; x <= W; x += 20) {
    grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${CHART_THEME.grid}" stroke-width="1"/>`);
  }
  for (let y = 0; y <= H; y += 20) {
    grid.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${CHART_THEME.grid}" stroke-width="1"/>`);
  }

  let cursorY = padT;
  const trapezoids = rows.map((d, i) => {
    const stepH = rowHeights[i];
    const top = cursorY;
    const bot = top + stepH - 6;
    const wTop = (d.value / maxV) * (W - padX * 2);
    const wBot = i + 1 < rows.length ? (rows[i + 1].value / maxV) * (W - padX * 2) : wTop * 0.6;
    const cx = W / 2;
    const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length];
    const textBlockH = d.lines.length * lineHeight;
    const labelStartY = top + stepH / 2 - textBlockH / 2 - 4;
    const tspans = d.lines.map((line, li) => `<tspan x="${cx}" y="${labelStartY + li * lineHeight}">${esc(line)}</tspan>`).join("");
    cursorY += stepH;
    return `
      <polygon points="${cx - wTop/2},${top} ${cx + wTop/2},${top} ${cx + wBot/2},${bot} ${cx - wBot/2},${bot}"
               fill="${color}" opacity="0.85"><title>${esc(d.label)}: ${d.value.toFixed(2)}</title></polygon>
      <text text-anchor="middle" fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="${fontSize}" font-weight="500">${tspans}</text>
      <text x="${cx}" y="${labelStartY + textBlockH + 14}" text-anchor="middle" fill="${CHART_THEME.ink}" font-family="IBM Plex Mono" font-size="12" opacity="0.75">${d.value.toFixed(2)}</text>`;
  }).join("");

  container.innerHTML = `${svg(W, H)}
    ${grid.join("")}
    ${trapezoids}
    </svg>`;
};

/* ---------------- 3. GAUGE - DUAL ARC GRADIENTS ---------------- */
Charts.gauge = function (container, value, opts) {
  opts = opts || {};
  const max = opts.max || 4;
  const label = opts.label || "";
  const W = 300, H = 200;
  const cx = W / 2, cy = 150, r1 = 100, r2 = 80;
  const pct = Math.max(0, Math.min(1, value / max));
  const angle = -90 + pct * 180;

  const uid = "g" + Math.random().toString(36).slice(2, 8);

  container.innerHTML = `${svg(W, H)}
    <defs>
      <linearGradient id="${uid}-outer" x1="0" x2="1">
        <stop offset="0%" stop-color="${CHART_THEME.teal}"/>
        <stop offset="55%" stop-color="${CHART_THEME.gold}"/>
        <stop offset="100%" stop-color="${CHART_THEME.accent}"/>
      </linearGradient>
      <linearGradient id="${uid}-inner" x1="0" x2="1">
        <stop offset="0%" stop-color="${CHART_THEME.purple}"/>
        <stop offset="100%" stop-color="${CHART_THEME.rose}"/>
      </linearGradient>
    </defs>
    <path d="${arcPath(cx, cy, r1, -90, 90)}" fill="none" stroke="${CHART_THEME.grid}" stroke-width="14" stroke-linecap="round"/>
    <path d="${arcPath(cx, cy, r1, -90, angle)}" fill="none" stroke="url(#${uid}-outer)" stroke-width="14" stroke-linecap="round"/>
    <path d="${arcPath(cx, cy, r2, -90, 90)}" fill="none" stroke="${CHART_THEME.grid}" stroke-width="8" stroke-linecap="round"/>
    <path d="${arcPath(cx, cy, r2, -90, angle)}" fill="none" stroke="url(#${uid}-inner)" stroke-width="8" stroke-linecap="round" opacity="0.85"/>
    <text x="${cx}" y="${cy - 12}" text-anchor="middle" fill="${CHART_THEME.ink}" font-family="Space Grotesk" font-size="34" font-weight="600">${value.toFixed(2)}</text>
    <text x="${cx}" y="${cy + 8}" text-anchor="middle" fill="${CHART_THEME.muted}" font-family="IBM Plex Mono" font-size="10" letter-spacing="1.5">/ ${max.toFixed(1)}</text>
    ${label ? `<text x="${cx}" y="${cy + 30}" text-anchor="middle" fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="12" opacity="0.85">${esc(label)}</text>` : ""}
    </svg>`;
};

/* ---------------- 4. PIE CHART - DONUT ---------------- */
Charts.donut = function (container, data) {
  const W = 320, H = 260;
  const cx = 130, cy = H / 2, rOuter = 90, rInner = 55;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let acc = 0;
  const slices = data.map((d, i) => {
    const start = (acc / total) * 360;
    acc += d.value;
    const end = (acc / total) * 360;
    const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length];
    return `<path d="${donutSlice(cx, cy, rOuter, rInner, start, end)}" fill="${color}">
      <title>${esc(d.label)}: ${d.value}</title></path>`;
  }).join("");

  const legend = data.map((d, i) => {
    const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length];
    const pct = ((d.value / total) * 100).toFixed(0);
    return `<g transform="translate(240, ${60 + i * 26})">
      <rect width="10" height="10" fill="${color}" rx="2"/>
      <text x="18" y="9" fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="12">${esc(d.label)}</text>
      <text x="18" y="24" fill="${CHART_THEME.muted}" font-family="IBM Plex Mono" font-size="10">${d.value} · ${pct}%</text>
    </g>`;
  }).join("");

  container.innerHTML = `${svg(W, H)}
    ${slices}
    <circle cx="${cx}" cy="${cy}" r="${rInner - 1}" fill="#1e1a2b"/>
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="${CHART_THEME.ink}" font-family="Space Grotesk" font-size="24" font-weight="600">${total}</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="${CHART_THEME.muted}" font-family="IBM Plex Mono" font-size="9" letter-spacing="1">TOTAL</text>
    ${legend}
    </svg>`;
};

/* ---------------- 5. RING CHART - LEGEND ---------------- */
/* Concentric rings, one per data series. Each ring fills to its value/max. */
Charts.ring = function (container, series, opts) {
  opts = opts || {};
  const max = opts.max || 4;
  const n = series.length;
  const W = 480;
  const fontSize = 11, lineHeight = 13;
  const maxLines = opts.maxLines || 4;
  const legendX = 235;
  const charsPerLine = opts.charsPerLine || Math.max(14, Math.floor((W - legendX - 18 - 10) / (fontSize * 0.55)));

  const rows = series.map((s) => ({ ...s, lines: wrapLines(s.label, charsPerLine, maxLines) }));
  const rowHeights = rows.map((r) => Math.max(30, r.lines.length * lineHeight + 18));
  const legendH = rowHeights.reduce((a, b) => a + b, 0) + 24;
  const H = Math.max(260, legendH);
  const cx = 115, cy = H / 2;
  const rMax = 92, rMin = 34;
  const step = n > 1 ? (rMax - rMin) / (n - 1) : 0;

  const arcs = rows.map((s, i) => {
    const r = rMax - i * step;
    const pct = Math.max(0, Math.min(1, s.value / max));
    const endA = -90 + pct * 360;
    const color = s.color || CHART_PALETTE[i % CHART_PALETTE.length];
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CHART_THEME.grid}" stroke-width="9"/>
      <path d="${pct >= 0.999
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
        : describeCircleArc(cx, cy, r, -90, endA)}"
        fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>`;
  }).join("");

  let cursorY = 18;
  const legend = rows.map((s, i) => {
    const rowH = rowHeights[i];
    const color = s.color || CHART_PALETTE[i % CHART_PALETTE.length];
    const tspans = s.lines.map((line, li) => `<tspan x="18" y="${9 + li * lineHeight}">${esc(line)}</tspan>`).join("");
    const g = `<g transform="translate(${legendX}, ${cursorY})">
      <rect width="10" height="10" fill="${color}" rx="2"/>
      <text fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="${fontSize}">${tspans}</text>
      <text x="18" y="${9 + s.lines.length * lineHeight + 3}" fill="${CHART_THEME.muted}" font-family="IBM Plex Mono" font-size="10">${s.value.toFixed(2)} / ${max}</text>
    </g>`;
    cursorY += rowH;
    return g;
  }).join("");

  container.innerHTML = `${svg(W, H)}
    ${arcs}
    ${legend}
    </svg>`;

  function describeCircleArc(cx, cy, r, startA, endA) {
    const s = polarToXY(cx, cy, r, startA);
    const e = polarToXY(cx, cy, r, endA);
    const large = endA - startA <= 180 ? 0 : 1;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }
};

/* ---------------- 6. RADAR CHART - MINIMAL ---------------- */
Charts.radar = function (container, data, opts) {
  opts = opts || {};
  const max = opts.max || 4;
  const W = 480, H = 380;
  const cx = W / 2, cy = H / 2 + 8, r = 95;
  const n = data.length;

  // grid rings
  const ringCount = Math.round(max);
  const rings = Array.from({ length: ringCount }, (_, i) => i + 1).map((k) => {
    const rr = (k / max) * r;
    return `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${CHART_THEME.grid}" stroke-width="1"/>`;
  }).join("");

  // spokes + labels
  const spokes = data.map((d, i) => {
    const angle = (i / n) * 360;
    const p = polarToXY(cx, cy, r, angle);
    const pl = polarToXY(cx, cy, r + 26, angle);
    return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${CHART_THEME.grid}" stroke-width="1"/>
      <text x="${pl.x}" y="${pl.y + 4}" text-anchor="${pl.x > cx + 5 ? "start" : pl.x < cx - 5 ? "end" : "middle"}"
            fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="11.5" font-weight="500">${esc(d.label)}</text>`;
  }).join("");

  const pts = data.map((d, i) => {
    const angle = (i / n) * 360;
    const rr = (Math.max(0, Math.min(max, d.value)) / max) * r;
    return polarToXY(cx, cy, rr, angle);
  });
  const polygon = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const dots = pts.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${CHART_THEME.gold}">
    <title>${esc(data[i].label)}: ${data[i].value.toFixed(2)}</title></circle>`).join("");

  container.innerHTML = `${svg(W, H)}
    ${rings}
    ${spokes}
    <polygon points="${polygon}" fill="${CHART_THEME.accent}" fill-opacity="0.22" stroke="${CHART_THEME.accent}" stroke-width="1.8"/>
    ${dots}
    </svg>`;
};

/* Expose theme + helper so dashboard can use them */
Charts.theme = CHART_THEME;
Charts.palette = CHART_PALETTE;
