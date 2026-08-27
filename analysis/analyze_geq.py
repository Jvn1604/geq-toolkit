#!/usr/bin/env python3
"""
GEQ Toolkit — data analysis

Aggregates the per-participant CSV files produced by the web questionnaire
into descriptive statistics, internal-consistency estimates (Cronbach's
alpha), and a chart of component means.

Usage:
    python analyze_geq.py responses/*.csv
    python analyze_geq.py responses/            # a folder of CSVs
    python analyze_geq.py combined.csv          # or one merged CSV

Outputs (written next to this script unless --out is given):
    geq_combined.csv          all participants, one row each
    geq_component_stats.csv   N, mean, SD, min, max, alpha per component
    geq_component_means.png   bar chart with SD error bars
    geq_report.txt            plain-text summary for pasting into a report

Requires: pandas, matplotlib   (pip install pandas matplotlib)
"""

import argparse
import glob
import os
import re
import sys

import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Item -> component maps, matching js/geq-items.js (1-based item numbers).
COMPONENTS = {
    "learning_engagement": {
        "Learning Engagement": [1, 2, 3, 4, 5],
    },
    "financial_knowledge": {
        "Financial Knowledge and Concepts": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    },
    "financial_decision_making": {
        "Financial Decision Making": [1, 2, 3, 4, 5],
    },
    "learning_outcomes": {
        "Learning Outcomes and Behavioral Awareness": [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
}

MODULE_PATTERN = "|".join(COMPONENTS.keys())


def load_responses(paths):
    """Read one or many CSVs into a single DataFrame (one row per participant)."""
    files = []
    for p in paths:
        if os.path.isdir(p):
            files += sorted(glob.glob(os.path.join(p, "*.csv")))
        else:
            files += sorted(glob.glob(p))
    if not files:
        sys.exit("No CSV files found. Pass file paths, globs, or a folder.")
    frames = [pd.read_csv(f) for f in files]
    df = pd.concat(frames, ignore_index=True)
    if "participant_id" in df.columns:
        before = len(df)
        df = df.drop_duplicates(subset="participant_id", keep="last")
        dropped = before - len(df)
        if dropped:
            print(f"Note: dropped {dropped} duplicate participant_id row(s).")
    print(f"Loaded {len(df)} participants from {len(files)} file(s).")
    return df


def modules_present(df):
    mods = set()
    for col in df.columns:
        m = re.match(rf"({MODULE_PATTERN})_item\d+$", col)
        if m:
            mods.add(m.group(1))
    return sorted(mods)


def cronbach_alpha(items_df):
    """Cronbach's alpha for a DataFrame of item columns (rows = participants)."""
    items_df = items_df.dropna()
    k = items_df.shape[1]
    if k < 2 or len(items_df) < 2:
        return float("nan")
    item_vars = items_df.var(axis=0, ddof=1)
    total_var = items_df.sum(axis=1).var(ddof=1)
    if total_var == 0:
        return float("nan")
    return (k / (k - 1)) * (1 - item_vars.sum() / total_var)


def analyze(df, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    rows = []
    for mod in modules_present(df):
        for comp, item_nums in COMPONENTS[mod].items():
            cols = [f"{mod}_item{n}" for n in item_nums]
            missing = [c for c in cols if c not in df.columns]
            if missing:
                print(f"Warning: {mod}/{comp} skipped, missing columns: {missing}")
                continue
            items = df[cols].apply(pd.to_numeric, errors="coerce")
            score = items.mean(axis=1)
            rows.append({
                "module": mod,
                "component": comp,
                "n": int(score.count()),
                "mean": round(score.mean(), 3),
                "sd": round(score.std(ddof=1), 3),
                "min": round(score.min(), 2),
                "max": round(score.max(), 2),
                "cronbach_alpha": round(cronbach_alpha(items), 3),
            })
    stats = pd.DataFrame(rows)

    df.to_csv(os.path.join(out_dir, "geq_combined.csv"), index=False)
    stats.to_csv(os.path.join(out_dir, "geq_component_stats.csv"), index=False)
    return stats


def plot(stats, out_dir):
    fig, ax = plt.subplots(figsize=(9, 0.55 * len(stats) + 2))
    labels = [f"{r.component}\n({r.module})" for r in stats.itertuples()]
    y = range(len(stats))
    ax.barh(y, stats["mean"], xerr=stats["sd"], color="#14655A",
            error_kw={"ecolor": "#5C6B65", "capsize": 3}, height=0.6)
    ax.set_yticks(list(y))
    ax.set_yticklabels(labels, fontsize=8)
    ax.invert_yaxis()
    ax.set_xlim(1, 5)
    ax.set_xlabel("Component score (1 = strongly disagree … 5 = strongly agree)")
    ax.set_title(f"Debt awareness component means ± SD (N = {int(stats['n'].max())})")
    ax.grid(axis="x", alpha=0.3)
    fig.tight_layout()
    path = os.path.join(out_dir, "geq_component_means.png")
    fig.savefig(path, dpi=200)
    print(f"Chart saved: {path}")


def report(stats, out_dir):
    lines = ["ESCAPE THE DEBT — DEBT MANAGEMENT AWARENESS RESULTS SUMMARY", "=" * 50, ""]
    for mod, group in stats.groupby("module", sort=False):
        lines.append(f"[{mod.upper()} MODULE]")
        for r in group.itertuples():
            lines.append(
                f"  {r.component}: M = {r.mean:.2f}, SD = {r.sd:.2f} "
                f"(N = {r.n}, alpha = {r.cronbach_alpha})"
            )
        lines.append("")
    lines.append("Scale: 1 = strongly disagree, 5 = strongly agree. Component score = mean of its items.")
    text = "\n".join(lines)
    with open(os.path.join(out_dir, "geq_report.txt"), "w") as f:
        f.write(text + "\n")
    print("\n" + text)


def main():
    ap = argparse.ArgumentParser(description="Aggregate GEQ Toolkit response CSVs.")
    ap.add_argument("paths", nargs="+", help="CSV files, globs, or a folder")
    ap.add_argument("--out", default="results", help="output folder (default: results)")
    args = ap.parse_args()

    df = load_responses(args.paths)
    stats = analyze(df, args.out)
    if stats.empty:
        sys.exit("No questionnaire item columns found — are these files from this toolkit?")
    plot(stats, args.out)
    report(stats, args.out)


if __name__ == "__main__":
    main()
