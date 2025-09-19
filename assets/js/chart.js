// chart.js
import { TASKS, SERIES } from "./config.js";
import { normalizeChoice } from "./normalize.js";

// Aggregation (unchanged)
export function aggregateFlat(rows) {
  const counts = Object.fromEntries(
    TASKS.map(([f]) => [f, { complete: 0, draft: 0, assist: 0 }]),
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

// Utility: Get maximum count
function getMaxCount(flat) {
  if (!flat?.length) return 0;
  let max = 0;
  for (const d of flat) {
    const v = Number(d.count) || 0;
    if (v > max) max = v;
  }
  return max;
}

// series order: complete → draft → assist
// const SERIES_ORDER = { complete: 0, draft: 1, assist: 2 };

// <togostanza-barchart>
export function setChartData(chartEl, flat) {
  // 並べ替え（task_order優先 → series順）
  const sorted = flat
    .slice()
    .sort(
      (a, b) => a.task_order - b.task_order || a.series_order - b.series_order,
    );

  const blob = new Blob([JSON.stringify(sorted)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  chartEl.setAttribute("data-type", "json");
  chartEl.setAttribute("data-url", url);

  // Adjust axis-y-ticks_interval based on max value
  const maxCount = getMaxCount(flat);
  if (maxCount < 4) {
    chartEl.setAttribute("axis-y-ticks_interval", "1");
    chartEl.setAttribute("axis-y-ticks_labels_format", ",.0f");
  } else {
    chartEl.removeAttribute("axis-y-ticks_interval");
    chartEl.removeAttribute("axis-y-ticks_labels_format");
  }

  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
