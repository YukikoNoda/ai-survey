// ===== 設定 =====
const SRC_URL = "/assets/data/ai_survey.renamed.json"; // 例: 自サイト配下

const TARGET = document.querySelector("togostanza-barchart");
const SEL_C = document.getElementById("country-select");
const SEL_A = document.getElementById("age-select");
const SEL_G = document.getElementById("gender-select");

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

// ===== 並び順（指定どおりに固定） =====
const AGE_ORDER = [
  "< 25 years old",
  "25 - 34",
  "35 - 44",
  "45 - 54",
  "> 55 years old",
  "Prefer not to answer",
];

const GENDER_ORDER = ["Man", "Woman", "Non-binary", "Prefer not to answer"];

// ===== 正規化ユーティリティ =====

// 国名ゆれ統一（必要に応じて ALIAS を拡張）
function normalizeCountry(raw) {
  if (!raw) return "";
  const s = String(raw).normalize("NFKC").trim();
  const key = s
    .toLowerCase()
    .replace(/[\.\u2000-\u206F\u2E00-\u2E7F'’_,\-()/]/g, " ")
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
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 年齢の正規化（表記ゆれを指定カテゴリへ寄せる）
function normalizeAge(raw) {
  if (!raw) return "";
  let s = String(raw).normalize("NFKC").trim();

  const low = s.toLowerCase().replace(/\s+/g, " ");

  if (/^<\s*25/.test(low) || /under\s*25/.test(low)) return "< 25 years old";
  if (/^25\s*-\s*34/.test(low)) return "25 - 34";
  if (/^35\s*-\s*44/.test(low)) return "35 - 44";
  if (/^45\s*-\s*54/.test(low)) return "45 - 54";
  if (
    /^>\s*55/.test(low) ||
    /55\+/.test(low) ||
    /55\s*and\s*over/.test(low) ||
    /over\s*55/.test(low) ||
    /older\s*than\s*55/.test(low)
  )
    return "> 55 years old";
  if (/prefer not/i.test(low)) return "Prefer not to answer";

  // どれにも当たらない場合はそのまま返す（並びは後述のソートで末尾）
  return s;
}

// 性別の正規化
function normalizeGender(raw) {
  if (!raw) return "";
  const s = String(raw).normalize("NFKC").trim().toLowerCase();
  const ALIAS = {
    man: "Man",
    male: "Man",
    woman: "Woman",
    female: "Woman",
    "non-binary": "Non-binary",
    nonbinary: "Non-binary",
    "non binary": "Non-binary",
    "prefer not to say": "Prefer not to answer",
    "prefer not to answer": "Prefer not to answer",
  };
  return ALIAS[s] || s.charAt(0).toUpperCase() + s.slice(1);
}

// AIタスク使用アプローチの正規化（3分類）
function normChoice(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, " ").trim();
  if (s.includes("assist with specific parts")) return "assist";
  if (s.includes("generate a first draft")) return "draft";
  if (s.includes("complete the entire task")) return "complete";
  return null;
}

// ===== 読み込み =====
let ROWS = [];
async function loadOnce() {
  const res = await fetch(SRC_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  ROWS = await res.json();
}

// ===== セレクト候補の作成 =====
function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
function sortedByList(list, orderList) {
  const orderMap = new Map(orderList.map((v, i) => [v, i]));
  return list
    .slice()
    .sort(
      (a, b) =>
        (orderMap.get(a) ?? 999) - (orderMap.get(b) ?? 999) ||
        a.localeCompare(b),
    );
}

function uniqueCountries(rows) {
  return uniq(rows.map((r) => normalizeCountry(r.country))).sort((a, b) =>
    a.localeCompare(b),
  );
}
function uniqueAges(rows) {
  const vals = uniq(rows.map((r) => normalizeAge(r.age)));
  return sortedByList(vals, AGE_ORDER);
}
function uniqueGenders(rows) {
  const vals = uniq(rows.map((r) => normalizeGender(r.gender)));
  return sortedByList(vals, GENDER_ORDER);
}

// ===== フィルタ =====
function filterRows(rows, country, age, gender) {
  const c = normalizeCountry(country);
  const a = normalizeAge(age);
  const g = normalizeGender(gender);
  return rows.filter((r) => {
    const rc = normalizeCountry(r.country);
    const ra = normalizeAge(r.age);
    const rg = normalizeGender(r.gender);
    return (
      (c ? rc === c : true) && (a ? ra === a : true) && (g ? rg === g : true)
    );
  });
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

// ===== チャートへ受け渡し =====
function setChartData(flat) {
  const blob = new Blob([JSON.stringify(flat)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  TARGET.setAttribute("data-type", "json");
  TARGET.setAttribute("data-url", url);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// ===== UI 構築 =====
function populateSelect(el, list) {
  // 既存（All…以外）をクリア
  [...el.querySelectorAll('option:not([value=""])')].forEach((o) => o.remove());
  for (const v of list) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  }
}

function readHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  return {
    country: h.get("country") || "",
    age: h.get("age") || "",
    gender: h.get("gender") || "",
  };
}

function writeHash({ country, age, gender }) {
  const p = new URLSearchParams();
  if (country) p.set("country", country);
  if (age) p.set("age", age);
  if (gender) p.set("gender", gender);
  const hash = p.toString();
  history.replaceState(null, "", hash ? `#${hash}` : "#");
}

// ===== 更新 =====
async function updateFromUI() {
  const country = SEL_C.value;
  const age = SEL_A.value;
  const gender = SEL_G.value;

  writeHash({ country, age, gender });

  const filtered = filterRows(ROWS, country, age, gender);
  const flat = aggregateFlat(filtered);
  setChartData(flat);
}

// ===== 起動 =====
async function start() {
  await loadOnce();

  // 選択肢を生成（Age/Gender は指定順に）
  populateSelect(SEL_C, uniqueCountries(ROWS));
  populateSelect(SEL_A, uniqueAges(ROWS));
  populateSelect(SEL_G, uniqueGenders(ROWS));

  // ハッシュから初期値を反映
  const init = readHash();
  if (init.country) SEL_C.value = init.country;
  if (init.age) SEL_A.value = init.age;
  if (init.gender) SEL_G.value = init.gender;

  // イベント
  SEL_C.addEventListener("change", updateFromUI);
  SEL_A.addEventListener("change", updateFromUI);
  SEL_G.addEventListener("change", updateFromUI);

  // 初回描画
  await updateFromUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
