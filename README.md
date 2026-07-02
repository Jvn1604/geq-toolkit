# GEQ Toolkit

An open-source, zero-backend web implementation of the **Game Experience Questionnaire (GEQ)** by IJsselsteijn, de Kort & Poels (2013) — for anyone running playtests or game user research.

Two pages, no server:

- **`index.html`** — the participant questionnaire. Hero landing themed to your game, then the standardized GEQ items on the official 0–4 scale, with component scores computed per the published guidelines.
- **`dashboard.html`** — the researcher dashboard. Passcode-protected. Six chart types, filterable participant table, CSV/JSON export, drag-and-drop import for responses from other machines.

Built for my Final Year Project evaluation of *Escape The Debt* (UTeM), released so any game can use it.

## What's included

| Path | What it does |
|---|---|
| `index.html` + `js/app.js` + `css/style.css` | Participant questionnaire with hero landing |
| `dashboard.html` + `js/dashboard.js` + `js/charts.js` + `css/dashboard.css` | Researcher dashboard with 6 chart types |
| `assets/` | Hero background image + game logo (swap for your own) |
| `config.js` | **The only file you edit** — game name, images, modules, demographics, passcode |
| `js/geq-items.js` | Full GEQ item bank: Core (33), In-game (14), Social Presence (17), Post-game (17) + scoring maps |
| `webhook/Code.gs` | Optional Google Apps Script to collect responses into a Google Sheet |
| `analysis/analyze_geq.py` | Aggregates response CSVs → stats, Cronbach's alpha, chart, text report |

## Quick start (use it for your game)

1. **Fork or clone** this repository.
2. Replace `assets/hero-bg.png` and `assets/game-logo.png` with your own game's imagery (any web-friendly PNG/JPG works).
3. Edit `config.js`:
   ```js
   gameName: "Your Game",
   researcher: "Your name / institution",
   tagline: "Your game's tagline",
   dashboardPasscode: "change-this",     // controls dashboard access
   modules: ["core", "postgame"],         // pick what your study needs
   askGender: true,                       // Male / Female chips on welcome
   ```
4. **Deploy on GitHub Pages**: Settings → Pages → deploy from `main` branch, root folder. Your questionnaire is live at `https://yourname.github.io/repo-name/`.
5. Run playtest sessions, either in person or by sending the URL to remote testers.
6. Open `dashboard.html` (append `/dashboard.html` to your Pages URL), enter the passcode, and see all responses charted automatically.

No server, no database, no build step. Open `index.html` locally and it also just works.

## How responses reach the dashboard

Three complementary paths — pick one or use all three:

1. **Automatic (same browser).** When a participant finishes the questionnaire, their response is silently saved to that browser's `localStorage`. When you open `dashboard.html` on the same machine, it's already there. Perfect for supervised lab-style sessions on one PC.
2. **CSV drop (any machine).** Each participant downloads their CSV at the end. You collect the files (email/Drive/USB) and drag-and-drop them onto the dashboard's import zone. They merge in.
3. **Google Sheets webhook (fully remote).** Set `webhookUrl` in `config.js` (setup steps below) and every completed response is appended to your own Google Sheet automatically. Download the sheet as one CSV → drop on dashboard → done.

For your PSM I'd recommend path 1 if you're testing on-campus in a lab, path 3 if you're recruiting remotely.

## The dashboard at a glance

- **4 stat cards**: total participants, average completion time, mean Positive Affect, mean Negative Affect
- **6 charts** (all pure SVG, no libraries):
  1. **Radar (Minimal)** — GEQ core profile: all 7 components on one spider chart
  2. **Gauge (Dual arc gradients)** — composite satisfaction index
  3. **Bar (Interactive)** — component means across modules, sorted, hover for values
  4. **Donut** — gender split with legend
  5. **Ring (Legend)** — post-game module comparison
  6. **Funnel (Grid background)** — core components ranked high → low
- **Filter bar** — filter every chart + table by gender in real time
- **Participants table** — per-row CSV, JSON, or delete
- **Export all** — one combined CSV of every response (top bar)
- **Drag-and-drop import** — merge CSVs from other machines
- **Passcode gate** — set `dashboardPasscode` in config (session-only unlock)

## Choosing modules

- **`core`** — the main 33-item questionnaire. Measures Competence, Sensory & Imaginative Immersion, Flow, Tension/Annoyance, Challenge, Negative Affect, Positive Affect. Use this for almost every study.
- **`postgame`** — 17 items on how players felt *after* stopping (Positive/Negative Experience, Tiredness, Returning to Reality). Administer right after core.
- **`social`** — only if your game involves co-players or meaningful in-game characters (virtual, online, or co-located).
- **`ingame`** — a 14-item short form of core, designed for repeated measurement at intervals *during* a session.

All modules use the official response scale: `0 not at all · 1 slightly · 2 moderately · 3 fairly · 4 extremely`. Component scores are the mean of their items, exactly as in the published scoring guidelines.

## Collecting responses remotely (Google Sheets webhook)

If testers aren't in the room with you, the webhook appends every completed response as a row in your own Google Sheet:

1. Create a Google Sheet.
2. Extensions → **Apps Script** → paste in `webhook/Code.gs`.
3. Deploy → New deployment → **Web app** → Execute as *Me*, access *Anyone* → copy the URL.
4. Paste that URL into `webhookUrl` in `config.js`.

The first submission creates the header row automatically. Participants are still offered the CSV download as a backup.

## Offline Python analysis (optional)

For your written report you probably want Cronbach's alpha and a proper chart. The bundled script does this:

```bash
pip install pandas matplotlib
python analysis/analyze_geq.py responses/
```

Outputs `geq_component_stats.csv`, `geq_component_means.png`, and `geq_report.txt` — ready to paste into your thesis.

The script accepts individual files, globs, a folder, or the single merged CSV exported from the Google Sheet or the dashboard's "Export all".

## Data & privacy notes

- Everything runs client-side. Nothing is stored unless the participant downloads it, the webhook is enabled, or `saveToDashboard` is on.
- The dashboard's `localStorage` only holds data on *your* browser — it's not synced anywhere.
- Assign participant IDs yourself (`participantId: "ask"`) rather than collecting names — keep responses pseudonymous.
- The `dashboardPasscode` is client-side and stops casual access, not a determined attacker. Don't put personally identifying data in responses.
- Get whatever ethics/consent approval your institution requires before running a study.

## Citation & instrument license

The questionnaire items and scoring guidelines are the intellectual work of the original authors. If you use this in academic work, cite:

> IJsselsteijn, W. A., de Kort, Y. A. W., & Poels, K. (2013). *The Game Experience Questionnaire.* Technische Universiteit Eindhoven.

The item wording in `js/geq-items.js` is reproduced verbatim for research use, as validity depends on exact wording — do not modify the items. The GEQ is distributed by TU/e for private study and research.

The **code** in this repository (app, dashboard, charts, webhook, analysis) is released under the MIT License — see `LICENSE`.

## Contributing

Issues and PRs welcome. Useful directions: translations (with back-translation validation), an in-game repeated-measures mode with timestamps, additional export formats (SPSS/JASP), and a Unity WebView helper for launching the questionnaire straight from a build.
