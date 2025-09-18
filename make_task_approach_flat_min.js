// node make_task_approach_flat_min.js ./ai_survey.renamed.json
const fs = require('fs');
const path = require('path');

const inPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'ai_survey.renamed.json');
const outJsonPath = inPath.replace(/\.json$/i, '.task_approach_flat.json');

const TASKS = [
  ['task_approach_coding',      'Coding'],
  ['task_approach_research',    'Research'],
  ['task_approach_brainstorm',  'Brainstorming'],
  ['task_approach_writing',     'Writing/Editing'],
  ['task_approach_teaching',    'Teaching & Curriculum'],
  ['task_approach_translation', 'Translation'],
  ['task_approach_personal',    'Personal']
];

const APPROACHES = [
  ['assist',   'assist'],
  ['draft',    'draft'],
  ['complete', 'complete']
];

// 正規化（英語文言を3択キーへ）
function normalizeChoice(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, ' ').trim();
  if (s.includes('assist with specific parts')) return 'assist';
  if (s.includes('generate a first draft'))     return 'draft';
  if (s.includes('complete the entire task'))   return 'complete';
  return null; // 未回答・その他は集計しない
}

const rows = JSON.parse(fs.readFileSync(inPath, 'utf8'));

// 集計: task × approach → count
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

// フラット配列へ
const flat = [];
TASKS.forEach(([field, label], catIdx) => {
  APPROACHES.forEach(([key, xLabel], chrIdx) => {
    flat.push({
      category: label,
      category_order: catIdx,
      chromosome: xLabel,          // x 軸
      chromosome_order: chrIdx,
      count: counts[field][key],   // y 軸（数値）
      color: null,                 // 任意
      error: null,                 // 任意
      url: ""                      // 任意
    });
  });
});

fs.writeFileSync(outJsonPath, JSON.stringify(flat, null, 2), 'utf8');
console.log(`✅ Flat JSON: ${outJsonPath}`);
