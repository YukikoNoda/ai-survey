// Data source
export const SRC_URL = new URL(
  "../data/ai_survey.renamed.json",
  import.meta.url,
).href;

// Target DOM elements
export const SELECTORS = {
  chart: "togostanza-barchart",
  country: "#country-select",
  age: "#age-select",
  gender: "#gender-select",
};

// 7 tasks (column name → display name)
export const TASKS = [
  ["task_approach_coding", "Coding"],
  ["task_approach_research", "Research"],
  ["task_approach_brainstorm", "Brainstorming"],
  ["task_approach_writing", "Writing/Editing"],
  ["task_approach_teaching", "Teaching & Curriculum"],
  ["task_approach_translation", "Translation"],
  ["task_approach_personal", "Personal"],
];

// Legend (series)
export const SERIES = [
  ["complete", "complete", "#34d399"],
  ["draft", "draft", "#f87171"],
  ["assist", "assist", "#60a5fa"],
];

// Sort order
export const AGE_ORDER = [
  "< 25 years old",
  "25 - 34",
  "35 - 44",
  "45 - 54",
  "> 55 years old",
  "Prefer not to answer",
];

export const GENDER_ORDER = [
  "Man",
  "Woman",
  "Non-binary",
  "Prefer not to answer",
];
