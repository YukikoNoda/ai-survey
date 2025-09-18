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

// セレクト候補
export function uniqueCountries(rows) {
  return uniq(rows.map((r) => normalizeCountry(r.country))).sort((a, b) =>
    a.localeCompare(b),
  );
}
export function uniqueAges(rows) {
  return sortedByList(uniq(rows.map((r) => normalizeAge(r.age))), AGE_ORDER);
}
export function uniqueGenders(rows) {
  return sortedByList(
    uniq(rows.map((r) => normalizeGender(r.gender))),
    GENDER_ORDER,
  );
}

// フィルタ
export function filterRows(rows, country, age, gender) {
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
