// node make_task_approach_with_legend_json_only.js ./ai_survey.renamed.json
const fs = require('fs');
const path = require('path');

const inPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'ai_survey.renamed.json');

const outFlatJson = inPath.replace(/\.json$/i, '.task_approach_legend.flat.json');

// 7タスク（列名 → 表示名）
const TASKS = [
  ['task_approach_coding',      'Coding'],
  ['task_approach_research',    'Research'],
  ['task_approach_brainstorm',  'Brainstorming'],
  ['task_approach_writing',     'Writing/Editing'],
  ['task_approach_teaching',    'Teaching & Curriculum'],
  ['task_approach_translation', 'Translation'],
  ['task_approach_personal',    'Personal']
];

// 凡例（series）の順序・色（色は任意）
const SERIES = [
  ['assist',   'assist',   '#f87171'],
  ['draft',    'draft',    '#60a5fa'],
  ['complete', 'complete', '#34d399']
];

// 英語文言を3択キーへ正規化
function normalizeChoice(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, ' ').trim();
  if (s.includes('assist with specific parts')) return 'assist';
  if (s.includes('generate a first draft'))     return 'draft';
  if (s.includes('complete the entire task'))   return 'complete';
  return null; // 未回答は集計しない
}

const rows = JSON.parse(fs.readFileSync(inPath, 'utf8'));

// 集計: task × series → count
const counts = Object.fromEntries(
  TASKS.map(([field]) => [field, { assist: 0, draft: 0, complete: 0 }])
);

for (const r of rows) {
  for (const [field] of TASKS) {
    const choice = normalizeChoice(r[field]);
    if (!choice) continue;
    counts[field][choice] += 1;
  }
}

// フラット配列: x=task_approach, legend=series, y=count
const flat = [];
TASKS.forEach(([field, label], taskIdx) => {
  SERIES.forEach(([key, seriesLabel, color], seriesIdx) => {
    flat.push({
      task_approach: label,  // x軸
      task_order: taskIdx,
      series: seriesLabel,   // Legend
      series_order: seriesIdx,
      count: counts[field][key], // y軸
      color,                 // 任意
      url: "",               // 任意
      error: null            // 任意（[lo, hi]ならエラーバー可）
    });
  });
});

fs.writeFileSync(outFlatJson, JSON.stringify(flat, null, 2), 'utf8');
console.log(`✅ Flat JSON: ${outFlatJson}`);
