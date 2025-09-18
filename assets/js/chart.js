import { TASKS, SERIES } from "./config.js";
import { normalizeChoice } from "./normalize.js";

// 集計（task × series → count → フラット）
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

// <togostanza-barchart> に渡す
export function setChartData(chartEl, flat) {
  const blob = new Blob([JSON.stringify(flat)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  chartEl.setAttribute("data-type", "json");
  chartEl.setAttribute("data-url", url);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
