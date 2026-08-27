# GEQ Toolkit

An open-source, zero-backend web questionnaire toolkit for game user research — originally built around the **Game Experience Questionnaire (GEQ)** by IJsselsteijn, de Kort & Poels (2013), and now configured for a custom **Debt Management Awareness** instrument used to evaluate *Escape The Debt*.

Two pages, no server:

- **`index.html`** — the participant questionnaire. Hero landing themed to your game, then the four debt-awareness sections on a 1–5 (Strongly Disagree → Strongly Agree) scale, with section scores computed automatically.
- **`dashboard.html`** — the researcher dashboard. Passcode-protected. Six chart types, filterable participant table, CSV/JSON export, drag-and-drop import for responses from other machines.

Built for my Final Year Project evaluation of *Escape The Debt* (UTeM), released so any game/study can adapt it.

## What's included

| Path | What it does |
|---|---|
| `index.html` + `js/app.js` + `css/style.css` | Participant questionnaire with hero landing |
| `dashboard.html` + `js/dashboard.js` + `js/charts.js` + `css/dashboard.css` | Researcher dashboard with 6 chart types |
| `assets/` | Hero background image + game logo (swap for your own) |
| `config.js` | **The only file you edit** — game name, images, modules, demographics, passcode |
| `js/geq-items.js` | Debt Management Awareness item bank: Learning Engagement (5), Financial Knowledge and Concepts (13), Financial Decision Making (5), Learning Outcomes and Behavioral Awareness (9) + scoring maps |
| `webhook/Code.gs` | Optional Google Apps Script to collect responses into a Google Sheet |
| `analysis/analyze_geq.py` | Aggregates response CSVs → stats, Cronbach's alpha, chart, text report |

## Quick start (use it for your study)

1. **Fork or clone** this repository.
2. Replace `assets/hero-bg.png` and `assets/game-logo.png` with your own game's imagery (any web-friendly PNG/JPG works).
3. Edit `config.js`:
   ```js
   gameName: "Your Game",
   researcher: "Your name / institution",
   tagline: "Your game's tagline",
   dashboardPasscode: "change-this",     // controls dashboard access
   modules: [
     "learning_engagement",
     "financial_knowledge",
     "financial_decision_making",
     "learning_outcomes"
   ],                                     // pick what your study needs, in order
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

- **4 stat cards**: total participants, average completion time, mean Financial Knowledge score (Section B), mean Learning Outcomes score (Section D)
- **6 charts** (all pure SVG, no libraries):
  1. **Radar (Minimal)** — debt awareness profile: all 4 section means on one spider chart
  2. **Gauge (Dual arc gradients)** — overall debt awareness composite index
  3. **Bar (Interactive)** — Financial Knowledge and Concepts, item-by-item means (Section B), sorted, hover for values
  4. **Donut** — gender split with legend
  5. **Ring (Legend)** — Learning Outcomes and Behavioral Awareness, item-by-item means (Section D)
  6. **Funnel (Grid background)** — Financial Decision Making items ranked high → low (Section C)
- **Filter bar** — filter every chart + table by gender in real time
- **Participants table** — per-row CSV, JSON, or delete
- **Export all** — one combined CSV of every response (top bar)
- **Drag-and-drop import** — merge CSVs from other machines
- **Passcode gate** — set `dashboardPasscode` in config (session-only unlock)

## Choosing modules (sections)

- **`learning_engagement`** — Section A, 5 items on how engaging and instructive the game's puzzles felt.
- **`financial_knowledge`** — Section B, 13 items covering compound interest, PTPTN loans, BNPL risk, credit utilization, debt prioritization, and budgeting concepts.
- **`financial_decision_making`** — Section C, 5 items on confidence making and explaining debt-related decisions.
- **`learning_outcomes`** — Section D, 9 items on real-world behavioral awareness and intentions after playing.

All sections use a 5-point Likert scale: `1 Strongly Disagree · 2 Disagree · 3 Neutral · 4 Agree · 5 Strongly Agree`. Section scores are the mean of their items.

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

## Instrument notes

The current `js/geq-items.js` item bank is a **custom Debt Management Awareness questionnaire** authored for the *Escape The Debt* evaluation — it is not the published GEQ instrument. Keep the item wording identical to your paper/PDF version of the questionnaire so digital and paper responses stay comparable. If you fork this toolkit for a GEQ-based study instead, restore the original GEQ item bank (Core/In-game/Social/Post-game) and cite:

> IJsselsteijn, W. A., de Kort, Y. A. W., & Poels, K. (2013). *The Game Experience Questionnaire.* Technische Universiteit Eindhoven.

The **code** in this repository (app, dashboard, charts, webhook, analysis) is released under the MIT License — see `LICENSE`.

## Contributing

Issues and PRs welcome. Useful directions: translations (with back-translation validation), an in-game repeated-measures mode with timestamps, additional export formats (SPSS/JASP), and a Unity WebView helper for launching the questionnaire straight from a build.
