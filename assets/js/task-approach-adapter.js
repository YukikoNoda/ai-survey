// ===== 設定 =====
const SRC_URL =
  "https://raw.githubusercontent.com/YukikoNoda/ai-survey/refs/heads/master/assets/data/ai_survey.renamed.json";

// 対象チャート（複数あるなら 'togostanza-barchart.my-class' のようにクラスで絞る）
const TARGET_SELECTOR = "togostanza-barchart";

// series の色（HTML側の CSS 変数と揃えています）
const SERIES = [
  ["assist", "assist", "#f87171"],
  ["draft", "draft", "#60a5fa"],
  ["complete", "complete", "#34d399"],
];

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

// ===== 集計ロジック =====

// 英語文言 → 3択キーへ正規化
function normalizeChoice(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, " ").trim();
  if (s.includes("assist with specific parts")) return "assist";
  if (s.includes("generate a first draft")) return "draft";
  if (s.includes("complete the entire task")) return "complete";
  return null;
}

async function fetchRows() {
  const res = await fetch(SRC_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

function aggregateToFlat(rows) {
  // task × series → count
  const counts = Object.fromEntries(
    TASKS.map(([f]) => [f, { assist: 0, draft: 0, complete: 0 }]),
  );
  for (const r of rows) {
    for (const [field] of TASKS) {
      const k = normalizeChoice(r[field]);
      if (k) counts[field][k] += 1;
    }
  }

  // フラット配列（x=task_approach, legend=series, y=count）
  const flat = [];
  TASKS.forEach(([field, label], taskIdx) => {
    SERIES.forEach(([key, seriesLabel, color], seriesIdx) => {
      flat.push({
        task_approach: label,
        task_order: taskIdx,
        series: seriesLabel,
        series_order: seriesIdx,
        count: counts[field][key],
        color,
        url: "",
        error: null,
      });
    });
  });
  return flat;
}

async function buildBlobUrl() {
  const rows = await fetchRows();
  const flat = aggregateToFlat(rows);
  const blob = new Blob([JSON.stringify(flat)], { type: "application/json" });
  return URL.createObjectURL(blob);
}

// ===== 初期化 =====

async function initChart(el) {
  // すでに data-url がある場合は何もしない（手動指定を尊重）
  if (el.hasAttribute("data-url")) return;

  // Stanza 定義待ち（保険）
  if (window.customElements?.whenDefined) {
    try {
      await window.customElements.whenDefined("togostanza-barchart");
    } catch {}
  }

  try {
    const blobUrl = await buildBlobUrl();
    el.setAttribute("data-type", "json"); // 念のため
    el.setAttribute("data-url", blobUrl);

    // 早すぎる revoke で読み込みに失敗する環境があるため、解放は任意
    // 問題なければコメントを外してください
    // setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
  } catch (err) {
    console.error("[task-approach-adapter] failed:", err);
    // 失敗時の簡易UI（任意）
    const msg = document.createElement("div");
    msg.style.cssText = "color:#b91c1c;margin:8px 0;font-size:12px;";
    msg.textContent = "Failed to load data.";
    el.insertAdjacentElement("afterend", msg);
  }
}

function initAllExisting() {
  document.querySelectorAll(TARGET_SELECTOR).forEach(initChart);
}

// 動的に追加される <togostanza-barchart> にも対応
const mo = new MutationObserver((muts) => {
  for (const m of muts) {
    for (const node of m.addedNodes) {
      if (node instanceof Element && node.matches?.(TARGET_SELECTOR)) {
        initChart(node);
      }
      if (node instanceof Element) {
        node.querySelectorAll?.(TARGET_SELECTOR).forEach(initChart);
      }
    }
  }
});

function start() {
  initAllExisting();
  mo.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
