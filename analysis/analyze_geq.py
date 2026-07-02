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
    "core": {
        "Competence": [2, 10, 15, 17, 21],
        "Sensory and Imaginative Immersion": [3, 12, 18, 19, 27, 30],
        "Flow": [5, 13, 25, 28, 31],
        "Tension/Annoyance": [22, 24, 29],
        "Challenge": [11, 23, 26, 32, 33],
        "Negative Affect": [7, 8, 9, 16],
        "Positive Affect": [1, 4, 6, 14, 20],
    },
    "ingame": {
        "Competence": [2, 9],
        "Sensory and Imaginative Immersion": [1, 4],
        "Flow": [5, 10],
        "Tension": [6, 8],
        "Challenge": [12, 13],
        "Negative Affect": [3, 7],
        "Positive Affect": [11, 14],
    },
    "social": {
        "Psychological Involvement - Empathy": [1, 4, 8, 9, 10, 13],
        "Psychological Involvement - Negative Feelings": [7, 11, 12, 16, 17],
        "Behavioural Involvement": [2, 3, 5, 6, 14, 15],
    },
    "postgame": {
        "Positive Experience": [1, 5, 7, 8, 12, 16],
        "Negative Experience": [2, 4, 6, 11, 14, 15],
        "Tiredness": [10, 13],
        "Returning to Reality": [3, 9, 17],
    },
}


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
        m = re.match(r"(core|ingame|social|postgame)_item\d+$", col)
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
    ax.set_xlim(0, 4)
    ax.set_xlabel("Component score (0 = not at all … 4 = extremely)")
    ax.set_title(f"GEQ component means ± SD (N = {int(stats['n'].max())})")
    ax.grid(axis="x", alpha=0.3)
    fig.tight_layout()
    path = os.path.join(out_dir, "geq_component_means.png")
    fig.savefig(path, dpi=200)
    print(f"Chart saved: {path}")


def report(stats, out_dir):
    lines = ["GEQ RESULTS SUMMARY", "=" * 50, ""]
    for mod, group in stats.groupby("module", sort=False):
        lines.append(f"[{mod.upper()} MODULE]")
        for r in group.itertuples():
            lines.append(
                f"  {r.component}: M = {r.mean:.2f}, SD = {r.sd:.2f} "
                f"(N = {r.n}, alpha = {r.cronbach_alpha})"
            )
        lines.append("")
    lines.append("Scale: 0 = not at all, 4 = extremely. Component score = mean of its items.")
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
        sys.exit("No GEQ item columns found — are these files from the GEQ Toolkit?")
    plot(stats, args.out)
    report(stats, args.out)


if __name__ == "__main__":
    main()
