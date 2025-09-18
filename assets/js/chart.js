// chart.js
import { TASKS, SERIES } from "./config.js";
import { normalizeChoice } from "./normalize.js";

// 集計（据え置き）
export function aggregateFlat(rows) {
  const counts = Object.fromEntries(
    TASKS.map(([f]) => [f, { assist: 0, draft: 0, complete: 0 }]),
  );
  for (const r of rows) {
    for (const [field] of TASKS) {
      const k = normalizeChoice(r[field]);
      if (k) counts[field][k] += 1;
    }
  }
  const out = [];
  TASKS.forEach(([field, label], tIdx) => {
    SERIES.forEach(([key, sLabel, color], sIdx) => {
      out.push({
        task_approach: label,
        task_order: tIdx,
        series: sLabel,
        series_order: sIdx,
        count: counts[field][key],
        color,
        url: "",
        error: null,
      });
    });
  });
  return out;
}

// ユーティリティ：最大countを取得
function getMaxCount(flat) {
  if (!flat?.length) return 0;
  let max = 0;
  for (const d of flat) {
    const v = Number(d.count) || 0;
    if (v > max) max = v;
  }
  return max;
}

// <togostanza-barchart> に渡す（最大値で軸ティックを調整）
export function setChartData(chartEl, flat) {
  const blob = new Blob([JSON.stringify(flat)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  chartEl.setAttribute("data-type", "json");
  chartEl.setAttribute("data-url", url);

  // ここで最大値を判断して axis-y-ticks_interval を調整
  const maxCount = getMaxCount(flat);
  if (maxCount < 4) {
    chartEl.setAttribute("axis-y-ticks_interval", "1");
    // ラベルは整数表示が望ましいので一緒に指定（不要なら削除OK）
    chartEl.setAttribute("axis-y-ticks_labels_format", ",.0f");
  } else {
    chartEl.removeAttribute("axis-y-ticks_interval");
    // 他の場面で別フォーマットを使っているなら触らなくてもOK
    // chartEl.removeAttribute("axis-y-ticks_labels_format");
  }

  // 早すぎるrevokeで読み込み失敗する環境があるので少し遅らせる
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
