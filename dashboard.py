import json
import pandas as pd
import streamlit as st
import altair as alt

st.set_page_config(
    page_title="Benchmark Results",
    page_icon=":bar_chart:",
    layout="wide",
)

"""
# :material/leaderboard: Benchmark Results

"""

""
""

RESULTS_FILE = "results.json"

METRIC_LABELS = {
    "token_f1": "Token F1",
    "rouge_l": "ROUGE-L",
    "exact_match": "Exact Match",
    "recall_at_k": "Recall@K",
    "precision_at_k": "Precision@K",
    "mrr": "MRR",
    "faithfulness": "Faithfulness",
    "relevance": "Relevance",
    "retrieve_ms": "Retrieve (ms)",
    "rerank_ms": "Rerank (ms)",
    "generate_ms": "Generate (ms)",
    "total_ms": "Total (ms)",
}

METRIC_SUBTITLES = {
    "token_f1": "Token-overlap with reference answer",
    "rouge_l": "Longest common subsequence overlap",
    "exact_match": "Fraction of exact answer matches",
    "recall_at_k": "Relevant docs found in top-K",
    "precision_at_k": "Fraction of top-K docs that are relevant",
    "mrr": "Mean reciprocal rank of first relevant result",
    "faithfulness": "LLM Judge-assigned answer faithfulness score (1-5)",
    "relevance": "LLM Judge-assigned answer relevance score (1-5)",
}

JUDGE_METRICS = {"faithfulness", "relevance"}
LATENCY_METRICS = {"retrieve_ms", "rerank_ms", "generate_ms", "total_ms"}
LATENCY_PHASES = ["retrieve_ms", "rerank_ms", "generate_ms"]
PHASE_LABELS = {"retrieve_ms": "Retrieve", "rerank_ms": "Rerank", "generate_ms": "Generate"}
COLOR_PALETTE = ["#00A1F1", "#7CBB00", "#FFBB00", "#F65314", "#BA39E5"]
AXIS_COLOR = "#314158"
SUBTITLE_COLOR = "#afbbca"
NUM_COLS = 4
CHART_HEIGHT = 220
LEGEND_HEIGHT = 60


def load_results(path: str) -> list[dict]:
    with open(path) as f:
        return json.load(f)


def build_dataframes(results: list[dict]) -> tuple[pd.DataFrame, pd.DataFrame]:
    metrics_df = pd.DataFrame(
        [{"config": r["config"], **r["metrics"]} for r in results]
    ).set_index("config")
    judge_df = pd.DataFrame(
        [{"config": r["config"], **q["judge"]} for r in results for q in r["per_question"]]
    )
    return metrics_df, judge_df


def color_scale_for(configs: list[str]) -> alt.Scale:
    return alt.Scale(domain=configs, range=COLOR_PALETTE[: len(configs)])


def render_legend(configs: list[str], scale: alt.Scale) -> None:
    legend_data = pd.DataFrame({"config": configs, "x": range(len(configs))})
    chart = (
        alt.Chart(legend_data)
        .mark_point(size=0)
        .encode(
            alt.X("x:Q", axis=None),
            alt.Color(
                "config:N",
                scale=scale,
                legend=alt.Legend(orient="top", direction="horizontal", title=None),
            ),
        )
        .properties(height=LEGEND_HEIGHT)
    )
    st.altair_chart(chart, width="stretch")


def build_lollipop_chart(data: pd.DataFrame, col_name: str, label: str, scale: alt.Scale, subtitle: str = "") -> alt.Chart:
    plot_data = data[[col_name]].rename(columns={col_name: label}).reset_index()
    base = alt.Chart(plot_data)
    stem = base.mark_bar(width=4).encode(
        alt.X("config:N", axis=None),
        alt.Y(f"{label}:Q", axis=alt.Axis(title=None)).scale(zero=True),
        alt.Color("config:N", scale=scale, legend=None),
        alt.Tooltip(["config", label]),
    )
    dot = base.mark_circle(size=150, filled=True, opacity=1).encode(
        alt.X("config:N", axis=None),
        alt.Y(f"{label}:Q"),
        alt.Color("config:N", scale=scale, legend=None),
        alt.Tooltip(["config", label]),
    )
    return (
        (stem + dot)
        .properties(title=alt.TitleParams(text=label, subtitle=subtitle, subtitleColor=SUBTITLE_COLOR, subtitlePadding=12), height=CHART_HEIGHT)
        .configure_axis(domainColor=AXIS_COLOR, gridColor=AXIS_COLOR, tickColor=AXIS_COLOR)
    )


def build_latency_stacked_chart(data: pd.DataFrame) -> alt.Chart:
    phases = [p for p in LATENCY_PHASES if p in data.columns]
    latency_long = (
        data[phases]
        .reset_index()
        .melt(id_vars="config", var_name="phase", value_name="ms")
    )
    latency_long["phase_label"] = latency_long["phase"].map(PHASE_LABELS)
    latency_long["_order"] = latency_long["phase"].map({p: i for i, p in enumerate(phases)})
    phase_order = [PHASE_LABELS[p] for p in phases]
    return (
        alt.Chart(latency_long)
        .mark_bar()
        .encode(
            alt.X("config:N", axis=alt.Axis(title=None, labelAngle=0)),
            alt.Y("ms:Q", axis=alt.Axis(title=None)),
            alt.Color(
                "phase_label:N",
                scale=alt.Scale(
                    domain=phase_order,
                    range=["#BBE1FA", "#3282B8", "#0F4C75"][: len(phases)],
                ),
                legend=alt.Legend(orient="top", title=None),
            ),
            alt.Order("_order:Q"),
            alt.Tooltip(["config:N", "phase_label:N", "ms:Q"]),
        )
        .properties(title=alt.TitleParams(text="Latency (ms)", subtitle="Time spent on each phase in the pipeline", subtitleColor=SUBTITLE_COLOR, subtitlePadding=12), height=400)
        .configure_axis(domainColor=AXIS_COLOR, gridColor=AXIS_COLOR, tickColor=AXIS_COLOR)
    )


def build_box_chart(
    judge_df: pd.DataFrame, configs: list[str], col_name: str, label: str, scale: alt.Scale, subtitle: str = ""
) -> alt.Chart:
    plot_data = (
        judge_df[judge_df["config"].isin(configs)][["config", col_name]]
        .rename(columns={col_name: label})
    )
    return (
        alt.Chart(plot_data)
        .mark_boxplot(extent="min-max", rule=alt.MarkConfig(color="#6B7F9B"))
        .encode(
            alt.X("config:N", axis=None),
            alt.Y(f"{label}:Q", axis=alt.Axis(title=None)).scale(domain=[1, 5]),
            alt.Color("config:N", scale=scale, legend=None),
        )
        .properties(title=alt.TitleParams(text=label, subtitle=subtitle, subtitleColor=SUBTITLE_COLOR, subtitlePadding=12), height=CHART_HEIGHT)
        .configure_axis(domainColor=AXIS_COLOR, gridColor=AXIS_COLOR, tickColor=AXIS_COLOR)
    )


def render_metrics_grid(
    filtered_df: pd.DataFrame,
    judge_df: pd.DataFrame,
    selected_configs: list[str],
    scale: alt.Scale,
) -> None:
    grid_cols = st.columns(NUM_COLS)
    i = 0
    for col_name, label in METRIC_LABELS.items():
        if col_name not in filtered_df.columns or col_name in LATENCY_METRICS:
            continue
        subtitle = METRIC_SUBTITLES.get(col_name, "")
        if col_name in JUDGE_METRICS:
            chart = build_box_chart(judge_df, selected_configs, col_name, label, scale, subtitle)
        else:
            chart = build_lollipop_chart(filtered_df, col_name, label, scale, subtitle)
        cell = grid_cols[i % NUM_COLS].container(border=True)
        cell.write("")
        cell.altair_chart(chart, width="stretch")
        i += 1

def render_question_card(q: dict) -> None:
    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown("**Expected answer**")
        st.markdown(q.get("expected_answer", "—"))
    with col_b:
        st.markdown("**Generated answer**")
        st.markdown(q.get("generated_answer", "—"))

    st.divider()

    retrieval = q.get("retrieval", {})
    answer = q.get("answer", {})
    judge = q.get("judge", {})
    latency = q.get("latency_ms", {})

    metric_cols = st.columns(4)

    with metric_cols[0]:
        st.markdown("**Retrieval**")
        for key, label in [("recall_at_k", "Recall@K"), ("precision_at_k", "Precision@K"), ("mrr", "MRR")]:
            val = retrieval.get(key)
            if val is not None:
                st.markdown(f"{label} &nbsp; `{val:.3f}`")

    with metric_cols[1]:
        st.markdown("**Answer quality**")
        for key, label in [("token_f1", "Token F1"), ("rouge_l", "ROUGE-L"), ("exact_match", "Exact Match")]:
            val = answer.get(key)
            if val is not None:
                st.markdown(f"{label} &nbsp; `{val:.3f}`")

    with metric_cols[2]:
        st.markdown("**Judge scores**")
        for key, label in [("faithfulness", "Faithfulness"), ("relevance", "Relevance")]:
            val = judge.get(key)
            if val is not None:
                st.markdown(f"{label} &nbsp; `{val:.1f} / 5`")

    with metric_cols[3]:
        st.markdown("**Latency (ms)**")
        for key, label in [("retrieve", "Retrieve"), ("rerank", "Rerank"), ("generate", "Generate"), ("total", "Total")]:
            val = latency.get(key)
            if val is not None:
                st.markdown(f"{label} &nbsp; `{val:.0f} ms`")


def render_questions_section(results: list[dict], configs: list[str]) -> None:
    selected_config = st.selectbox("Configuration", configs)
    config_data = next(r for r in results if r["config"] == selected_config)
    for q in config_data["per_question"]:
        with st.expander(q["question"]):
            render_question_card(q)

#########################################
# RENDER DASHBOARD
#########################################

# Load data
try:
    results = load_results(RESULTS_FILE)
except FileNotFoundError:
    st.error(f"`{RESULTS_FILE}` not found. Run the benchmark first.")
    st.stop()

configs = [r["config"] for r in results]
metrics_df, judge_df = build_dataframes(results)

# Config selector
top_cols = st.columns([1, 2])
left_cell = top_cols[0].container(border=True, height="stretch", vertical_alignment="center")

with left_cell:
    selected_configs = st.multiselect(
        "Configurations",
        options=configs,
        default=configs,
        placeholder="Choose configs to compare",
    )

if not selected_configs:
    st.stop()

filtered_df = metrics_df.loc[selected_configs]

right_cell = top_cols[1].container(border=True, height="stretch", vertical_alignment="center")

with right_cell:
    best_config = st.metric(
        "Best (Token F1)",
        filtered_df["token_f1"].idxmax(),
        delta=f"{filtered_df['token_f1'].max():.4f}",
        delta_color="normal",
        width="content",
    )

""

# Charts
scale = color_scale_for(selected_configs)

render_legend(selected_configs, scale)
render_metrics_grid(filtered_df, judge_df, selected_configs, scale)

lat_col, qa_col = st.columns(2)

latency_phases = [p for p in LATENCY_PHASES if p in filtered_df.columns]
if latency_phases:
    with lat_col:
        with st.container(border=True):
            st.altair_chart(build_latency_stacked_chart(filtered_df), width="stretch")

with qa_col:
    with st.container(border=True):
        render_questions_section(results, configs)
