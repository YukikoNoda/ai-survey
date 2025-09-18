// ===== 設定 =====
const SRC_URL = "/assets/data/ai_survey.renamed.json"; // 自サイト配下に置いた JSON を参照

const TARGET = document.querySelector("togostanza-barchart");
const SELECT = document.getElementById("country-select");

// 7タスク（列名 → 表示名）
const TASKS = [
  ["task_approach_coding", "Coding"],
  ["task_approach_research", "Research"],
  ["task_approach_brainstorm", "Brainstorming"],
  ["task_approach_writing", "Writing/Editing"],
  ["task_approach_teaching", "Teaching & Curriculum"],
  ["task_approach_translation", "Translation"],
  ["task_approach_personal", "Personal"],
];

const SERIES = [
  ["assist", "assist", "#f87171"],
  ["draft", "draft", "#60a5fa"],
  ["complete", "complete", "#34d399"],
];

// ===== 国名正規化 =====
function normalizeCountry(raw) {
  if (!raw) return "";
  let s = String(raw).normalize("NFKC").trim();

  const key = s
    .toLowerCase()
    .replace(/[\.\u2000-\u206F\u2E00-\u2E7F'’_,\-()/]/g, " ") // 記号→空白
    .replace(/\s+/g, " ")
    .trim();

  const ALIAS = {
    // Germany
    germany: "Germany",
    de: "Germany",
    deutschland: "Germany",

    // United Kingdom
    uk: "United Kingdom",
    "u k": "United Kingdom",
    "united kingdom": "United Kingdom",
    "great britain": "United Kingdom",
    gb: "United Kingdom",

    // United States
    usa: "United States",
    "u s a": "United States",
    "united states": "United States",
    "united states of america": "United States",
    us: "United States",
    "u s": "United States",
  };

  if (ALIAS[key]) return ALIAS[key];

  // マッチしなければそのまま返す
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ===== AI利用の選択肢正規化 =====
function normChoice(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, " ").trim();
  if (s.includes("assist with specific parts")) return "assist";
  if (s.includes("generate a first draft")) return "draft";
  if (s.includes("complete the entire task")) return "complete";
  return null;
}

let ROWS = [];

// ===== データ読込 =====
async function loadOnce() {
  const res = await fetch(SRC_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  ROWS = await res.json();
}

// ===== 国リスト生成 =====
function uniqueCountries(rows) {
  const set = new Set();
  for (const r of rows) {
    const canon = normalizeCountry(r.country);
    if (canon) set.add(canon);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// ===== 国でフィルタ =====
function filterByCountry(rows, selectedLabel) {
  const target = normalizeCountry(selectedLabel);
  if (!target) return rows; // All countries
  return rows.filter((r) => normalizeCountry(r.country) === target);
}

// ===== 集計 =====
function aggregateFlat(rows) {
  const counts = Object.fromEntries(
    TASKS.map(([f]) => [f, { assist: 0, draft: 0, complete: 0 }]),
  );
  for (const r of rows) {
    for (const [field] of TASKS) {
      const k = normChoice(r[field]);
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

// ===== グラフにデータを渡す =====
function setChartData(flat) {
  const blob = new Blob([JSON.stringify(flat)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  TARGET.setAttribute("data-type", "json");
  TARGET.setAttribute("data-url", url);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// ===== UI操作 =====
function populateSelect(countries) {
  [...SELECT.querySelectorAll('option:not([value=""])')].forEach((o) =>
    o.remove(),
  );
  for (const c of countries) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    SELECT.appendChild(opt);
  }
}

function initEvents() {
  SELECT.addEventListener("change", () => {
    const c = SELECT.value;
    history.replaceState(
      null,
      "",
      c ? `#country=${encodeURIComponent(c)}` : "#",
    );
    update(c);
  });

  const m = location.hash.match(/country=([^&]+)/);
  if (m) {
    const c = decodeURIComponent(m[1]);
    SELECT.value = c;
  }
}

// ===== 更新 =====
async function update(country = "") {
  const filtered = filterByCountry(ROWS, country);
  const flat = aggregateFlat(filtered);
  setChartData(flat);
}

// ===== スタートアップ =====
async function start() {
  await loadOnce();
  populateSelect(uniqueCountries(ROWS));
  initEvents();
  await update(SELECT.value || "");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
