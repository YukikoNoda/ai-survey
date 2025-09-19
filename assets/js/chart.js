// chart.js
import { TASKS, SERIES } from "./config.js";
import { normalizeChoice } from "./normalize.js";

// Aggregation (unchanged)
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

// Pass data to <togostanza-barchart> (adjust axis ticks by max value)
export function setChartData(chartEl, flat) {
  const blob = new Blob([JSON.stringify(flat)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  chartEl.setAttribute("data-type", "json");
  chartEl.setAttribute("data-url", url);

  // Adjust axis-y-ticks_interval based on max value
  const maxCount = getMaxCount(flat);
  if (maxCount < 4) {
    chartEl.setAttribute("axis-y-ticks_interval", "1");
    // Specify integer label format (delete if unnecessary)
    chartEl.setAttribute("axis-y-ticks_labels_format", ",.0f");
  } else {
    chartEl.removeAttribute("axis-y-ticks_interval");
    // If using other formats elsewhere, you can leave this untouched
    // chartEl.removeAttribute("axis-y-ticks_labels_format");
  }

  // Delay revoke to avoid loading failure in some environments
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
