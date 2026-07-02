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

/* ---------------- 1. BAR CHART - INTERACTIVE ---------------- */
Charts.bar = function (container, data, opts) {
  opts = opts || {};
  const max = opts.max || 4;
  const W = 640, H = 320;
  const padL = 140, padR = 24, padT = 20, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const step = plotH / data.length;
  const barH = Math.max(14, step - 10);

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const x = padL + (i / 4) * plotW;
    gridLines.push(`<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + plotH}" stroke="${CHART_THEME.grid}" stroke-width="1"/>`);
    gridLines.push(`<text x="${x}" y="${H - 6}" text-anchor="middle" fill="${CHART_THEME.muted}" font-family="IBM Plex Mono" font-size="10">${i}</text>`);
  }

  const bars = data.map((d, i) => {
    const y = padT + i * step + (step - barH) / 2;
    const w = (d.value / max) * plotW;
    const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length];
    return `
      <g class="bar-row" data-label="${esc(d.label)}" data-value="${d.value}">
        <text x="${padL - 12}" y="${y + barH / 2 + 4}" text-anchor="end" fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="12">${esc(d.label)}</text>
        <rect x="${padL}" y="${y}" width="${plotW}" height="${barH}" fill="${CHART_THEME.grid}" rx="3"/>
        <rect x="${padL}" y="${y}" width="${w}" height="${barH}" fill="${color}" rx="3">
          <title>${esc(d.label)}: ${d.value.toFixed(2)}</title>
        </rect>
        <text x="${padL + w + 6}" y="${y + barH / 2 + 4}" fill="${CHART_THEME.ink}" font-family="IBM Plex Mono" font-size="11">${d.value.toFixed(2)}</text>
      </g>`;
  }).join("");

  container.innerHTML = `${svg(W, H)}
    ${gridLines.join("")}
    ${bars}
    </svg>`;
};

/* ---------------- 2. FUNNEL CHART - GRID BACKGROUND ---------------- */
Charts.funnel = function (container, data) {
  const W = 480, H = 320;
  const padT = 20, padB = 20, padX = 60;
  const plotH = H - padT - padB;
  const stepH = plotH / data.length;
  const maxV = Math.max(...data.map((d) => d.value), 0.0001);

  // Grid background
  const grid = [];
  for (let x = 0; x <= W; x += 20) {
    grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${CHART_THEME.grid}" stroke-width="1"/>`);
  }
  for (let y = 0; y <= H; y += 20) {
    grid.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${CHART_THEME.grid}" stroke-width="1"/>`);
  }

  const trapezoids = data.map((d, i) => {
    const top = padT + i * stepH;
    const bot = top + stepH - 6;
    const wTop = (d.value / maxV) * (W - padX * 2);
    const wBot = i + 1 < data.length ? (data[i + 1].value / maxV) * (W - padX * 2) : wTop * 0.6;
    const cx = W / 2;
    const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length];
    return `
      <polygon points="${cx - wTop/2},${top} ${cx + wTop/2},${top} ${cx + wBot/2},${bot} ${cx - wBot/2},${bot}"
               fill="${color}" opacity="0.85"><title>${esc(d.label)}: ${d.value.toFixed(2)}</title></polygon>
      <text x="${cx}" y="${top + stepH/2 - 4}" text-anchor="middle" fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="11" font-weight="500">${esc(d.label)}</text>
      <text x="${cx}" y="${top + stepH/2 + 12}" text-anchor="middle" fill="${CHART_THEME.ink}" font-family="IBM Plex Mono" font-size="12" opacity="0.75">${d.value.toFixed(2)}</text>`;
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
  const W = 340, H = 260;
  const cx = 130, cy = H / 2;
  const rings = series.length;
  const rMax = 100, rMin = 40;
  const step = (rMax - rMin) / rings;

  const arcs = series.map((s, i) => {
    const r = rMax - i * step;
    const pct = Math.max(0, Math.min(1, s.value / max));
    const endA = -90 + pct * 360;
    const color = s.color || CHART_PALETTE[i % CHART_PALETTE.length];
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CHART_THEME.grid}" stroke-width="10"/>
      <path d="${pct >= 0.999
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
        : describeCircleArc(cx, cy, r, -90, endA)}"
        fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`;
  }).join("");

  const legend = series.map((s, i) => {
    const color = s.color || CHART_PALETTE[i % CHART_PALETTE.length];
    return `<g transform="translate(250, ${40 + i * 28})">
      <rect width="10" height="10" fill="${color}" rx="2"/>
      <text x="18" y="9" fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="11.5">${esc(s.label)}</text>
      <text x="18" y="24" fill="${CHART_THEME.muted}" font-family="IBM Plex Mono" font-size="10">${s.value.toFixed(2)} / ${max}</text>
    </g>`;
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
  const W = 420, H = 380;
  const cx = W / 2, cy = H / 2 + 8, r = 130;
  const n = data.length;

  // grid rings
  const rings = [1, 2, 3, 4].map((k) => {
    const rr = (k / 4) * r;
    return `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${CHART_THEME.grid}" stroke-width="1"/>`;
  }).join("");

  // spokes + labels
  const spokes = data.map((d, i) => {
    const angle = (i / n) * 360;
    const p = polarToXY(cx, cy, r, angle);
    const pl = polarToXY(cx, cy, r + 20, angle);
    return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${CHART_THEME.grid}" stroke-width="1"/>
      <text x="${pl.x}" y="${pl.y + 4}" text-anchor="${pl.x > cx + 5 ? "start" : pl.x < cx - 5 ? "end" : "middle"}"
            fill="${CHART_THEME.ink}" font-family="IBM Plex Sans" font-size="10.5" font-weight="500">${esc(d.label)}</text>`;
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
