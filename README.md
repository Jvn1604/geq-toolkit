# GEQ Toolkit

An open-source, zero-backend web implementation of the **Game Experience Questionnaire (GEQ)** by IJsselsteijn, de Kort & Poels (2013) — for anyone running playtests or game user research.

Point your playtesters at a link. They rate the standardized GEQ items on the official 0–4 scale, component scores are computed automatically per the published scoring guidelines, and each response is exported as CSV/JSON (and optionally submitted straight into your Google Sheet). A bundled Python script turns a folder of responses into descriptive statistics, Cronbach's alpha, and a publication-ready chart.

Built for my Final Year Project evaluation of *Escape The Debt* (UTeM), released so any game project can use it.

## What's included

| Path | What it does |
|---|---|
| `index.html` + `js/` + `css/` | The questionnaire web app (static — runs on GitHub Pages) |
| `config.js` | **The only file you edit** — game name, modules, demographics, webhook |
| `js/geq-items.js` | Full GEQ item bank: Core (33), In-game (14), Social Presence (17), Post-game (17) + scoring maps |
| `webhook/Code.gs` | Optional Google Apps Script to collect responses into a Google Sheet |
| `analysis/analyze_geq.py` | Aggregates response CSVs → stats, Cronbach's alpha, chart, text report |

## Quick start (use it for your game)

1. **Fork or clone** this repository.
2. Edit `config.js`:
   ```js
   gameName: "Your Game",
   researcher: "Your name / institution",
   modules: ["core", "postgame"],   // pick what your study needs
   ```
3. **Deploy on GitHub Pages**: repo Settings → Pages → deploy from `main` branch, root folder. Your questionnaire is live at `https://yourname.github.io/repo-name/`.
4. Run your playtest session, then have each participant open the link and complete it. They download a CSV at the end (or it auto-submits — see below).
5. Analyze:
   ```bash
   pip install pandas matplotlib
   python analysis/analyze_geq.py responses/
   ```
   You get `geq_component_stats.csv`, `geq_component_means.png`, and `geq_report.txt` — ready for your thesis or report.

No server, no database, no build step. Open `index.html` locally and it also just works.

## Choosing modules

- **`core`** — the main 33-item questionnaire. Measures Competence, Sensory & Imaginative Immersion, Flow, Tension/Annoyance, Challenge, Negative Affect, Positive Affect. Use this for almost every study.
- **`postgame`** — 17 items on how players felt *after* stopping (Positive/Negative Experience, Tiredness, Returning to Reality). Administer right after core.
- **`social`** — only if your game involves co-players or meaningful in-game characters (virtual, online, or co-located).
- **`ingame`** — a 14-item short form of core, designed for repeated measurement at intervals *during* a session, not as a replacement for core.

All modules use the official response scale: `0 not at all · 1 slightly · 2 moderately · 3 fairly · 4 extremely`. Component scores are the mean of their items, exactly as in the published scoring guidelines.

## Collecting responses remotely (Google Sheets webhook)

If testers aren't in the room with you, downloads get lost. The optional webhook appends every completed response as a row in your own Google Sheet:

1. Create a Google Sheet.
2. Extensions → **Apps Script** → paste in `webhook/Code.gs`.
3. Deploy → New deployment → **Web app** → Execute as *Me*, access *Anyone* → copy the URL.
4. Paste that URL into `webhookUrl` in `config.js`.

The first submission creates the header row automatically. Participants are still offered the CSV download as a backup.

## Analysis output

```
[CORE MODULE]
  Competence: M = 2.73, SD = 0.47 (N = 24, alpha = 0.81)
  Flow:       M = 2.75, SD = 0.49 (N = 24, alpha = 0.78)
  ...
```

- `geq_combined.csv` — all participants merged (duplicate participant IDs are de-duplicated, keeping the latest).
- `geq_component_stats.csv` — N, mean, SD, min, max, and Cronbach's alpha per component.
- `geq_component_means.png` — horizontal bar chart of component means with SD error bars, on the 0–4 scale.

The script accepts individual files, globs, a folder, or the single merged CSV exported from the Google Sheet.

## Data & ethics notes

- Everything runs client-side; nothing is stored unless the participant downloads it or you enable the webhook (which sends data to *your* sheet).
- Assign participant IDs yourself (`participantId: "ask"`) rather than collecting names — keep responses pseudonymous.
- Get whatever ethics/consent approval your institution requires before running a study.

## Citation & instrument license

The questionnaire items and scoring guidelines are the intellectual work of the original authors. If you use this in academic work, cite:

> IJsselsteijn, W. A., de Kort, Y. A. W., & Poels, K. (2013). *The Game Experience Questionnaire.* Technische Universiteit Eindhoven.

The item wording in `js/geq-items.js` is reproduced verbatim for research use, as validity depends on exact wording — do not modify the items. The GEQ is distributed by TU/e for private study and research; commercial use of the instrument may require permission from the authors.

The **code** in this repository (app, webhook, analysis) is released under the MIT License — see `LICENSE`.

## Contributing

Issues and PRs welcome. Useful directions: translations (with back-translation validation), an in-game repeated-measures mode with timestamps, additional export formats (SPSS/JASP), and a Unity WebView helper for launching the questionnaire straight from a build.
