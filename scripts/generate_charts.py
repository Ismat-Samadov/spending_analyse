import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

INPUT_PATH = "data/spending.xlsx"
OUTPUT_DIR = "charts"

CATEGORY_MAP = {
    "Restuarant": "Restaurant",
    "Coffe": "Coffee",
    "business_expenses": "Business Expenses",
    "joy": "Joy",
}


def load_data():
    df = pd.read_excel(INPUT_PATH, sheet_name="budjet")
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce", utc=True)
    df["category"] = df["category"].replace(CATEGORY_MAP)
    df["date"] = df["datetime"].dt.date
    df["month"] = df["datetime"].dt.to_period("M").astype(str)
    return df


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def format_currency(ax):
    ax.get_yaxis().set_major_formatter(
        plt.FuncFormatter(lambda x, _: f"{x:,.0f}")
    )


def save_chart(fig, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    fig.tight_layout()
    fig.savefig(path, dpi=180)
    plt.close(fig)


def chart_total_spend_by_category(df):
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    fig, ax = plt.subplots(figsize=(10, 6))
    totals.plot(kind="bar", ax=ax, color="#1f4e79")
    ax.set_title("Total Spend by Category")
    ax.set_xlabel("")
    ax.set_ylabel("Total Spend")
    format_currency(ax)
    save_chart(fig, "total_spend_by_category.png")


def chart_daily_spend_trend(df):
    monthly = df.groupby("month")["amount"].sum().sort_index()
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(monthly.index, monthly.values, color="#2ca02c")
    ax.set_title("Monthly Spend Trend")
    ax.set_xlabel("")
    ax.set_ylabel("Monthly Spend")
    ax.tick_params(axis="x", rotation=0)
    format_currency(ax)
    save_chart(fig, "monthly_spend_trend.png")


def chart_cumulative_spend(df):
    daily = df.groupby("date")["amount"].sum().sort_index()
    cumulative = daily.cumsum()
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(cumulative.index, cumulative.values, color="#ff7f0e")
    ax.set_title("Cumulative Spend Over Time")
    ax.set_xlabel("")
    ax.set_ylabel("Cumulative Spend")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))
    ax.xaxis.set_major_locator(mdates.MonthLocator(interval=6))
    ax.tick_params(axis="x", rotation=0)
    format_currency(ax)
    save_chart(fig, "cumulative_spend.png")


def chart_top_categories_daily_stack(df, top_n=5):
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    top_categories = list(totals.head(top_n).index)

    df_stack = df.copy()
    df_stack["category"] = df_stack["category"].where(
        df_stack["category"].isin(top_categories), "Other"
    )

    monthly_cat = (
        df_stack.groupby(["month", "category"])["amount"]
        .sum()
        .unstack(fill_value=0)
        .sort_index()
    )

    fig, ax = plt.subplots(figsize=(11, 6))
    monthly_cat.plot(kind="bar", stacked=True, ax=ax)
    ax.set_title("Monthly Spend by Top Categories (Stacked)")
    ax.set_xlabel("")
    ax.set_ylabel("Monthly Spend")
    format_currency(ax)
    ax.legend(title="Category", bbox_to_anchor=(1.02, 1), loc="upper left")
    save_chart(fig, "monthly_spend_by_category_stacked.png")


def chart_top_transactions(df, top_n=10):
    top = df.sort_values("amount", ascending=False).head(top_n)
    labels = top["date"].astype(str) + " • " + top["category"]

    fig, ax = plt.subplots(figsize=(11, 6))
    ax.barh(labels, top["amount"], color="#d62728")
    ax.set_title("Largest Individual Transactions")
    ax.set_xlabel("Amount")
    ax.set_ylabel("")
    ax.invert_yaxis()
    format_currency(ax)
    save_chart(fig, "largest_transactions.png")


def chart_weekly_total(df):
    monthly = df.groupby("month")["amount"].sum().sort_index()
    fig, ax = plt.subplots(figsize=(9, 5))
    monthly.plot(kind="bar", ax=ax, color="#4c78a8")
    ax.set_title("Monthly Spend")
    ax.set_xlabel("")
    ax.set_ylabel("Monthly Spend")
    ax.tick_params(axis="x", rotation=0)
    format_currency(ax)
    save_chart(fig, "monthly_spend.png")


def chart_frequency_vs_value(df):
    by_cat = df.groupby("category").agg(
        total_spend=("amount", "sum"),
        transactions=("amount", "count"),
        avg_spend=("amount", "mean"),
    ).sort_values("total_spend", ascending=False)

    fig, ax1 = plt.subplots(figsize=(10, 6))
    ax1.bar(by_cat.index, by_cat["total_spend"], color="#1f4e79", label="Total Spend")
    ax1.set_ylabel("Total Spend")
    format_currency(ax1)
    ax1.set_title("Category Impact: Total Spend vs. Transaction Volume")

    ax2 = ax1.twinx()
    ax2.plot(by_cat.index, by_cat["transactions"], color="#ff7f0e", marker="o", label="Transactions")
    ax2.set_ylabel("Transactions")

    ax1.set_xlabel("")
    ax1.tick_params(axis="x", rotation=45)
    save_chart(fig, "category_spend_vs_frequency.png")


def chart_top_categories_share(df, top_n=6):
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    top = totals.head(top_n)
    other = totals.iloc[top_n:].sum()
    data = pd.concat([top, pd.Series({"Other": other})])

    fig, ax = plt.subplots(figsize=(9, 5))
    data.sort_values(ascending=False).plot(kind="bar", ax=ax, color="#2ca02c")
    ax.set_title("Spend Concentration (Top Categories + Other)")
    ax.set_xlabel("")
    ax.set_ylabel("Total Spend")
    format_currency(ax)
    save_chart(fig, "spend_concentration.png")


def main():
    ensure_output_dir()
    df = load_data()

    chart_total_spend_by_category(df)
    chart_daily_spend_trend(df)
    chart_cumulative_spend(df)
    chart_top_categories_daily_stack(df)
    chart_top_transactions(df)
    chart_weekly_total(df)
    chart_frequency_vs_value(df)
    chart_top_categories_share(df)


if __name__ == "__main__":
    main()
