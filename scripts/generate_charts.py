import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib as mpl
import matplotlib.dates as mdates
import matplotlib.ticker as mticker
import numpy as np

INPUT_PATH = "data/spending.xlsx"
OUTPUT_DIR = "charts"

# Use a font stack that includes the manat sign (₼) on Windows.
mpl.rcParams["font.sans-serif"] = [
    "Segoe UI Symbol",
    "Segoe UI",
    "Arial Unicode MS",
    "DejaVu Sans",
]
mpl.rcParams["font.family"] = "sans-serif"
# Consistent professional palette
C = {
    "navy":    "#1f4e79",
    "green":   "#2ca02c",
    "orange":  "#ff7f0e",
    "red":     "#d62728",
    "purple":  "#9467bd",
    "brown":   "#8c564b",
    "teal":    "#17becf",
    "muted":   "#7f7f7f",
    "lightblue": "#aec7e8",
    "palette": ["#1f4e79", "#2ca02c", "#ff7f0e", "#d62728", "#9467bd", "#8c564b", "#17becf"],
}

CATEGORY_MAP = {
    "Restuarant": "Restaurant",
    "Coffe": "Coffee",
    "business_expenses": "Business Expenses",
    "joy": "Joy",
}

DOW_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


# ── Data loading ──────────────────────────────────────────────────────────────

def load_data():
    df = pd.read_excel(INPUT_PATH, sheet_name="budjet")
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce", utc=True)
    df = df.dropna(subset=["datetime", "amount"])
    df = df[df["amount"] > 0]
    df["category"] = df["category"].replace(CATEGORY_MAP)
    df["date"] = df["datetime"].dt.date
    df["month"] = df["datetime"].dt.to_period("M").astype(str)
    df["quarter"] = df["datetime"].dt.to_period("Q").astype(str)
    df["year"] = df["datetime"].dt.year
    df["day_of_week"] = df["datetime"].dt.day_name()
    return df


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


# ── Chart helpers ─────────────────────────────────────────────────────────────

def format_currency(ax, axis="y"):
    fmt = mticker.FuncFormatter(lambda x, _: f"{x:,.0f}")
    if axis == "y":
        ax.yaxis.set_major_formatter(fmt)
    else:
        ax.xaxis.set_major_formatter(fmt)


def add_bar_labels(ax, fontsize=8, color="#333333", padding=4, fmt=None):
    for bar in ax.patches:
        h = bar.get_height()
        if h > 0:
            label = fmt(h) if fmt else f"{h:,.0f}"
            ax.annotate(
                label,
                xy=(bar.get_x() + bar.get_width() / 2, h),
                xytext=(0, padding),
                textcoords="offset points",
                ha="center", va="bottom",
                fontsize=fontsize, color=color,
            )


def year_xticks(ax, index):
    """Set x-ticks to show only year labels for monthly series."""
    ticks, labels = [], []
    for i, m in enumerate(index):
        if str(m).endswith("-01") or i == 0:
            ticks.append(i)
            labels.append(str(m)[:4])
    ax.set_xticks(ticks)
    ax.set_xticklabels(labels)


def save_chart(fig, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    print(f"  OK {filename}")


# ── 1. Total Spend by Category (with avg line + value labels) ─────────────────

def chart_total_spend_by_category(df):
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    avg = totals.mean()

    fig, ax = plt.subplots(figsize=(13, 6))
    totals.plot(kind="bar", ax=ax, color=C["navy"], width=0.7)
    ax.axhline(avg, color=C["orange"], linestyle="--", linewidth=1.8,
               label=f"Category avg: {avg:,.0f}")
    add_bar_labels(ax, fontsize=8)
    ax.set_title("Total Spend by Category", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("")
    ax.set_ylabel("Total Spend")
    ax.tick_params(axis="x", rotation=40)
    format_currency(ax)
    ax.legend(fontsize=9)
    save_chart(fig, "total_spend_by_category.png")


# ── 2. Spend Concentration (top 6 + Other) with % labels ─────────────────────

def chart_spend_concentration(df, top_n=6):
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    top = totals.head(top_n)
    other = totals.iloc[top_n:].sum()
    data = pd.concat([top, pd.Series({"Other": other})]).sort_values(ascending=False)
    total_all = data.sum()

    fig, ax = plt.subplots(figsize=(11, 5))
    bars = data.plot(kind="bar", ax=ax, color=C["green"], width=0.7)
    for bar, val in zip(ax.patches, data.values):
        pct = val / total_all * 100
        ax.annotate(
            f"{val:,.0f}\n({pct:.1f}%)",
            xy=(bar.get_x() + bar.get_width() / 2, bar.get_height()),
            xytext=(0, 5), textcoords="offset points",
            ha="center", va="bottom", fontsize=8,
        )
    ax.set_title("Spend Concentration: Top Categories + Other", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("")
    ax.set_ylabel("Total Spend")
    ax.tick_params(axis="x", rotation=30)
    format_currency(ax)
    save_chart(fig, "spend_concentration.png")


# ── 3. Monthly Spend Trend with 3-Month Rolling Average ──────────────────────

def chart_monthly_trend(df):
    monthly = df.groupby("month")["amount"].sum().sort_index()
    rolling = monthly.rolling(3, center=True).mean()
    avg = monthly.mean()

    fig, ax = plt.subplots(figsize=(14, 5))
    ax.bar(range(len(monthly)), monthly.values, color=C["lightblue"], alpha=0.85, label="Monthly Spend", zorder=2)
    ax.plot(range(len(monthly)), rolling.values, color=C["red"], linewidth=2.5,
            label="3-Month Rolling Avg", zorder=5)
    ax.axhline(avg, color=C["muted"], linestyle=":", linewidth=1.5,
               label=f"4-yr Avg: {avg:,.0f}", zorder=4)

    # Annotate peak month
    max_idx = int(np.argmax(monthly.values))
    ax.annotate(
        f"Peak\n{monthly.index[max_idx]}\n{monthly.values[max_idx]:,.0f}",
        xy=(max_idx, monthly.values[max_idx]),
        xytext=(max_idx - 5, monthly.values[max_idx] * 0.85),
        arrowprops=dict(arrowstyle="->", color="black", lw=1.2),
        fontsize=8, ha="center",
    )

    year_xticks(ax, monthly.index)
    ax.set_title("Monthly Spend Trend (3-Month Rolling Average)", fontsize=14, fontweight="bold", pad=12)
    ax.set_ylabel("Monthly Spend")
    format_currency(ax)
    ax.legend(fontsize=9)
    save_chart(fig, "monthly_spend_trend.png")


# ── 4. Quarterly Stacked Spend by Top Categories ─────────────────────────────

def chart_quarterly_category_stack(df, top_n=5):
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    top_cats = list(totals.head(top_n).index)

    df_s = df.copy()
    df_s["category"] = df_s["category"].where(df_s["category"].isin(top_cats), "Other")

    qcat = (
        df_s.groupby(["quarter", "category"])["amount"]
        .sum()
        .unstack(fill_value=0)
        .sort_index()
    )
    col_order = qcat.sum().sort_values(ascending=False).index
    qcat = qcat[col_order]

    fig, ax = plt.subplots(figsize=(14, 6))
    qcat.plot(kind="bar", stacked=True, ax=ax, color=C["palette"][: len(qcat.columns)], width=0.75)
    ax.set_title("Quarterly Spend by Top 5 Categories (Stacked)", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("")
    ax.set_ylabel("Quarterly Spend")
    ax.tick_params(axis="x", rotation=45)
    format_currency(ax)
    ax.legend(title="Category", bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=9)
    save_chart(fig, "monthly_spend_by_category_stacked.png")


# ── 5. Cumulative Spend with Milestone Markers ───────────────────────────────

def chart_cumulative_spend(df):
    daily = df.groupby("date")["amount"].sum().sort_index()
    cumulative = daily.cumsum()
    dates = pd.to_datetime(list(cumulative.index))

    fig, ax = plt.subplots(figsize=(13, 5))
    ax.plot(dates, cumulative.values, color=C["orange"], linewidth=2.5, zorder=5)
    ax.fill_between(dates, cumulative.values, alpha=0.15, color=C["orange"])

    for milestone in [25_000, 50_000, 75_000, 100_000]:
        if milestone <= cumulative.max():
            ax.axhline(milestone, color=C["muted"], linestyle="--", linewidth=1, alpha=0.7)
            ax.text(
                dates[0], milestone + 1_200,
                f"{milestone // 1000}k",
                fontsize=8, color=C["muted"],
            )

    ax.set_title("Cumulative Spend Over 44 Months", fontsize=14, fontweight="bold", pad=12)
    ax.set_ylabel("Cumulative Spend")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))
    ax.xaxis.set_major_locator(mdates.MonthLocator(interval=6))
    ax.tick_params(axis="x", rotation=30)
    format_currency(ax)
    save_chart(fig, "cumulative_spend.png")


# ── 6. Year-over-Year Annual Spend with Growth % ─────────────────────────────

def chart_yoy_comparison(df):
    yearly = df.groupby("year")["amount"].sum().sort_index()
    current_year = df["year"].max()
    colors = [C["navy"] if y < current_year else C["orange"] for y in yearly.index]

    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.bar(yearly.index.astype(str), yearly.values, color=colors, width=0.6)

    # Value labels on top
    for bar, val in zip(bars, yearly.values):
        ax.annotate(
            f"{val:,.0f}",
            xy=(bar.get_x() + bar.get_width() / 2, bar.get_height()),
            xytext=(0, 6), textcoords="offset points",
            ha="center", va="bottom", fontsize=10, fontweight="bold",
        )

    # YoY growth % inside bars
    for i in range(1, len(yearly)):
        prev, curr = yearly.values[i - 1], yearly.values[i]
        growth = (curr - prev) / prev * 100
        ax.text(
            i, curr / 2,
            f"{growth:+.1f}%",
            ha="center", va="center", fontsize=10, color="white", fontweight="bold",
        )

    ax.set_title("Annual Spend by Year (Year-over-Year)", fontsize=14, fontweight="bold", pad=12)
    ax.set_ylabel("Annual Spend")
    ax.tick_params(axis="x", rotation=0)
    format_currency(ax)
    ax.set_xlabel(f"* {current_year} is partial year (data through Feb)", fontsize=8, color=C["muted"])
    save_chart(fig, "monthly_spend.png")


# ── 7. Category Impact: Total Spend vs. Transaction Volume ───────────────────

def chart_frequency_vs_value(df):
    by_cat = (
        df.groupby("category")
        .agg(total_spend=("amount", "sum"), transactions=("amount", "count"), avg=("amount", "mean"))
        .sort_values("total_spend", ascending=False)
    )

    fig, ax1 = plt.subplots(figsize=(13, 6))
    ax1.bar(range(len(by_cat)), by_cat["total_spend"], color=C["navy"], width=0.65, label="Total Spend")
    ax1.set_ylabel("Total Spend", color=C["navy"])
    ax1.tick_params(axis="y", labelcolor=C["navy"])
    format_currency(ax1)

    # Avg transaction size embedded inside each bar
    for i, (_, row) in enumerate(by_cat.iterrows()):
        if row["total_spend"] > 1000:
            ax1.text(i, row["total_spend"] / 2, f"avg\n{row['avg']:.0f}",
                     ha="center", va="center", fontsize=7, color="white", fontweight="bold")

    ax2 = ax1.twinx()
    ax2.plot(range(len(by_cat)), by_cat["transactions"], color=C["orange"],
             marker="o", linewidth=2.2, markersize=7, label="# Transactions")
    ax2.set_ylabel("# Transactions", color=C["orange"])
    ax2.tick_params(axis="y", labelcolor=C["orange"])

    ax1.set_xticks(range(len(by_cat)))
    ax1.set_xticklabels(by_cat.index, rotation=45, ha="right")
    ax1.set_title("Category Impact: Total Spend vs. Transaction Volume", fontsize=14, fontweight="bold", pad=12)

    h1, l1 = ax1.get_legend_handles_labels()
    h2, l2 = ax2.get_legend_handles_labels()
    ax1.legend(h1 + h2, l1 + l2, loc="upper right", fontsize=9)
    save_chart(fig, "category_spend_vs_frequency.png")


# ── 8. Largest Transactions ───────────────────────────────────────────────────

def chart_top_transactions(df, top_n=10):
    top = df.sort_values("amount", ascending=False).head(top_n).copy()
    top["date"] = pd.to_datetime(top["date"])
    labels = top["date"].dt.strftime("%d %b %Y") + "  •  " + top["category"]

    fig, ax = plt.subplots(figsize=(12, 6))
    bars = ax.barh(labels, top["amount"], color=C["red"], height=0.65)
    ax.invert_yaxis()
    for bar, val in zip(bars, top["amount"]):
        ax.text(bar.get_width() + 30, bar.get_y() + bar.get_height() / 2,
                f"{val:,.0f}", va="center", fontsize=9)
    ax.set_title("Top 10 Largest Individual Transactions", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Amount")
    format_currency(ax, axis="x")
    save_chart(fig, "largest_transactions.png")


# ── 9. Day-of-Week Spending Pattern ──────────────────────────────────────────

def chart_day_of_week(df):
    # Average spend per calendar day (not per transaction)
    daily = df.groupby(["date", "day_of_week"])["amount"].sum().reset_index()
    dow_avg = daily.groupby("day_of_week")["amount"].mean().reindex(DOW_ORDER)

    bar_colors = [C["orange"] if d in ("Saturday", "Sunday") else C["navy"] for d in DOW_ORDER]

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(DOW_ORDER, dow_avg.values, color=bar_colors, width=0.65)
    add_bar_labels(ax, fontsize=9)
    ax.set_title("Average Daily Spend by Day of Week", fontsize=14, fontweight="bold", pad=12)
    ax.set_ylabel("Avg Spend per Day")
    ax.set_xlabel("Weekdays = navy   |   Weekends = orange", fontsize=8, color=C["muted"])
    format_currency(ax)
    save_chart(fig, "day_of_week_spend.png")


# ── 10. Habit Drift: Avg Transaction Size Over Time ──────────────────────────

def chart_avg_transaction_trend(df):
    monthly_avg = df.groupby("month")["amount"].mean().sort_index()
    rolling = monthly_avg.rolling(3, center=True).mean()
    overall = monthly_avg.mean()

    fig, ax = plt.subplots(figsize=(14, 5))
    ax.bar(range(len(monthly_avg)), monthly_avg.values, color=C["lightblue"], alpha=0.85,
           label="Monthly Avg Transaction", zorder=2)
    ax.plot(range(len(monthly_avg)), rolling.values, color=C["red"], linewidth=2.5,
            label="3-Month Rolling Avg", zorder=5)
    ax.axhline(overall, color=C["muted"], linestyle=":", linewidth=1.5,
               label=f"4-yr Avg: {overall:.1f}", zorder=4)

    year_xticks(ax, monthly_avg.index)
    ax.set_title("Average Transaction Size Over Time (Habit Drift)", fontsize=14, fontweight="bold", pad=12)
    ax.set_ylabel("Avg Transaction")
    format_currency(ax)
    ax.legend(fontsize=9)
    save_chart(fig, "avg_transaction_trend.png")


# ── 11. Category Year-over-Year Growth Heatmap (top 8 cats) ──────────────────

def chart_category_yoy(df, top_n=8):
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    top_cats = list(totals.head(top_n).index)

    pivot = (
        df[df["category"].isin(top_cats)]
        .groupby(["year", "category"])["amount"]
        .sum()
        .unstack(fill_value=0)
    )
    pivot = pivot[top_cats]  # order columns by total spend

    # Compute YoY % change
    pct = pivot.pct_change() * 100

    fig, ax = plt.subplots(figsize=(13, 5))
    im = ax.imshow(pct.values, cmap="RdYlGn", aspect="auto", vmin=-50, vmax=50)
    ax.set_xticks(range(len(top_cats)))
    ax.set_xticklabels(top_cats, rotation=35, ha="right", fontsize=9)
    ax.set_yticks(range(len(pct.index)))
    ax.set_yticklabels([f"{y} vs {y-1}" for y in pct.index], fontsize=9)

    for i in range(len(pct.index)):
        for j in range(len(top_cats)):
            val = pct.values[i, j]
            if not np.isnan(val):
                ax.text(j, i, f"{val:+.0f}%", ha="center", va="center",
                        fontsize=8, color="black" if abs(val) < 40 else "white")

    plt.colorbar(im, ax=ax, label="YoY Change %")
    ax.set_title("Category Spend: Year-over-Year Change (%)", fontsize=14, fontweight="bold", pad=12)
    save_chart(fig, "category_yoy_growth.png")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ensure_output_dir()
    df = load_data()

    print(f"Loaded {len(df):,} transactions | "
          f"{df['month'].nunique()} months | "
          f"Total: {df['amount'].sum():,.2f}")
    print()

    chart_total_spend_by_category(df)
    chart_spend_concentration(df)
    chart_monthly_trend(df)
    chart_quarterly_category_stack(df)
    chart_cumulative_spend(df)
    chart_yoy_comparison(df)
    chart_frequency_vs_value(df)
    chart_top_transactions(df)
    chart_day_of_week(df)
    chart_avg_transaction_trend(df)
    chart_category_yoy(df)

    print(f"\nDone - 11 charts saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
