// 国名ゆれ統一
export function normalizeCountry(raw) {
  if (!raw) return "";
  const s = String(raw).normalize("NFKC").trim();
  const key = s
    .toLowerCase()
    .replace(/[\.\u2000-\u206F\u2E00-\u2E7F'’_,\-()/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const ALIAS = {
    germany: "Germany",
    de: "Germany",
    deutschland: "Germany",
    uk: "United Kingdom",
    "u k": "United Kingdom",
    "united kingdom": "United Kingdom",
    "great britain": "United Kingdom",
    gb: "United Kingdom",
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

// 年齢
export function normalizeAge(raw) {
  if (!raw) return "";
  const s = String(raw).normalize("NFKC").trim();
  const low = s.toLowerCase().replace(/\s+/g, " ");
  if (/^<\s*25/.test(low) || /under\s*25/.test(low)) return "< 25 years old";
  if (/^25\s*-\s*34/.test(low)) return "25 - 34";
  if (/^35\s*-\s*44/.test(low)) return "35 - 44";
  if (/^45\s*-\s*54/.test(low)) return "45 - 54";
  if (
    /^>\s*55/.test(low) ||
    /55\+/.test(low) ||
    /over\s*55/.test(low) ||
    /older\s*than\s*55/.test(low)
  )
    return "> 55 years old";
  if (/prefer not/i.test(low)) return "Prefer not to answer";
  return s;
}

// 性別
export function normalizeGender(raw) {
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

// タスク使用アプローチ（3分類）
export function normalizeChoice(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, " ").trim();
  if (s.includes("assist with specific parts")) return "assist";
  if (s.includes("generate a first draft")) return "draft";
  if (s.includes("complete the entire task")) return "complete";
  return null;
}
