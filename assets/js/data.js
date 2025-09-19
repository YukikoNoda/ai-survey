import { SRC_URL, AGE_ORDER, GENDER_ORDER } from "./config.js";
import {
  normalizeCountry,
  normalizeAge,
  normalizeGender,
} from "./normalize.js";

export async function loadRows() {
  const res = await fetch(SRC_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.json();
}

const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

const sortedByList = (values, order) => {
  const orderMap = new Map(order.map((v, i) => [v, i]));
  return values
    .slice()
    .sort(
      (a, b) =>
        (orderMap.get(a) ?? 999) - (orderMap.get(b) ?? 999) ||
        a.localeCompare(b),
    );
};

// Select options
export function uniqueCountries(rows) {
  return uniq(
    rows.map((r) => normalizeCountry(r.country)).filter((v) => v !== ""),
  ).sort((a, b) => a.localeCompare(b));
}

export function uniqueAges(rows) {
  const vals = uniq(rows.map((r) => normalizeAge(r.age)));
  return vals;
}

export function uniqueGenders(rows) {
  const vals = uniq(rows.map((r) => normalizeGender(r.gender)));
  return vals;
}

// Filter
export function filterRows(rows, country, age, gender) {
  const c = normalizeCountry(country);
  const a = normalizeAge(age);
  const g = normalizeGender(gender);

  return rows.filter((r) => {
    const rc = normalizeCountry(r.country);
    if (rc === "") return false; // 国名ではない → 集計対象外（常に除外）

    const ra = normalizeAge(r.age);
    const rg = normalizeGender(r.gender);
    return (
      (c ? rc === c : true) && (a ? ra === a : true) && (g ? rg === g : true)
    );
  });
}
