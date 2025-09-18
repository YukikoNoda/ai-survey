import { SELECTORS } from "./config.js";
import {
  loadRows,
  uniqueCountries,
  uniqueAges,
  uniqueGenders,
  filterRows,
} from "./data.js";
import { aggregateFlat, setChartData } from "./chart.js";

const CHART = document.querySelector(SELECTORS.chart);
const SEL_C = document.querySelector(SELECTORS.country);
const SEL_A = document.querySelector(SELECTORS.age);
const SEL_G = document.querySelector(SELECTORS.gender);

let ROWS = [];

function populateSelect(el, list) {
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
  history.replaceState(null, "", p.toString() ? `#${p}` : "#");
}

function updateFromUI() {
  const country = SEL_C.value,
    age = SEL_A.value,
    gender = SEL_G.value;
  writeHash({ country, age, gender });
  const filtered = filterRows(ROWS, country, age, gender);
  const flat = aggregateFlat(filtered);
  setChartData(CHART, flat);
}

async function start() {
  ROWS = await loadRows();

  populateSelect(SEL_C, uniqueCountries(ROWS));
  populateSelect(SEL_A, uniqueAges(ROWS));
  populateSelect(SEL_G, uniqueGenders(ROWS));

  const init = readHash();
  if (init.country) SEL_C.value = init.country;
  if (init.age) SEL_A.value = init.age;
  if (init.gender) SEL_G.value = init.gender;

  SEL_C.addEventListener("change", updateFromUI);
  SEL_A.addEventListener("change", updateFromUI);
  SEL_G.addEventListener("change", updateFromUI);

  updateFromUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
