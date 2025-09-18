// node convert_ai_survey.js ./ai_survey.csv
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const inPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'ai_survey.csv');
const outJsonPath = inPath.replace(/\.csv$/i, '.renamed.json');
const outCsvPath  = inPath.replace(/\.csv$/i, '.renamed.csv');

// ヘッダーの表記ゆれを吸収（余分な空白をまとめる・前後空白除去・全角空白→半角）
const normalize = (s) =>
  String(s).replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();

// === 元ヘッダー → 短いキー のマッピング ===
// ※normalize() 後の文字列で一致します。
const HEADER_MAP = {
  "Are/were you a BioHackathon participant? (Select all that apply)": "bh_participation",
  "What is your field? (Select all the apply)": "field",
  "What institution type do you work for?": "institution_type",
  "Which country do you work in?": "country",
  "What is your age?": "age",
  "Which of the following best describes your gender?": "gender",
  "Which of the following best describes your use of AI?": "ai_use_level",
  "Is there a reason why you don't use AI? (Select all that apply)": "ai_nonuse_reasons",
  "Please briefly describe your AI-related work": "ai_work_desc",
  "If you would like to have your work cited please provide us a link to a paper, code repository, etc.": "citation_link",
  "Which AI tools do you use most often?": "ai_tools",
  "What tasks do you use AI for? When you use AI for that task, which of the following best describes your approach? [Coding]": "task_approach_coding",
  "What tasks do you use AI for? When you use AI for that task, which of the following best describes your approach? [Research]": "task_approach_research",
  "What tasks do you use AI for? When you use AI for that task, which of the following best describes your approach? [Brainstorming]": "task_approach_brainstorm",
  "What tasks do you use AI for? When you use AI for that task, which of the following best describes your approach? [Writing/Editing]": "task_approach_writing",
  "What tasks do you use AI for? When you use AI for that task, which of the following best describes your approach? [Teaching and curriculum]": "task_approach_teaching",
  "What tasks do you use AI for? When you use AI for that task, which of the following best describes your approach? [Translation]": "task_approach_translation",
  "What tasks do you use AI for? When you use AI for that task, which of the following best describes your approach? [Personal use (trip planning, recipes, making songs, etc)]": "task_approach_personal",
  "What has been your success using AI in your work or projects? Please describe the task, the AI tool(s) used, and the outcome.": "ai_success_story",
  "When using AI tools in your work, what challenges have you faced? (Select all that apply)": "ai_challenges",
  "Tell us about a time AI really failed you or caused unexpected trouble. What happened, and what did you learn?": "ai_failure_story",
  "Please rate your overall satisfaction with your use of AI.": "ai_satisfaction",
  "What would AI tools need to improve for you to be more satisfied? (Select all the apply)": "ai_improve_needs",
  "How would you describe the level of institutional support you receive regarding AI usage?": "support_level",
  "What kinds of support does your institution provide? Select as many as apply": "support_types",
  "How concerned are you with the following issues in relation to AI? [Bias in algorithms]": "concern_bias",
  "How concerned are you with the following issues in relation to AI? [Data privacy/security]": "concern_privacy",
  "How concerned are you with the following issues in relation to AI? [Intellectual property, ownership]": "concern_ip",
  "How concerned are you with the following issues in relation to AI? [Misinformation/Hallucinations]": "concern_misinfo",
  "How concerned are you with the following issues in relation to AI? [Environment impact]": "concern_env",
  "Is there anything else on the topic you'd like to share? Anything we didn't ask but should have?": "other_comments",
  "If you're ok with us contacting you with further questions, please share your email here": "contact_email"
};

// 未マッチ見出しのフォールバック（安全なキーを作る）
const toSafeKey = (h) =>
  normalize(h)
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'col';

const csvText = fs.readFileSync(inPath, 'utf8');

// 1) まずはヘッダー列を取得（配列）するため、columns:false で1行目だけ読む
const headerOnly = parse(csvText, { to: 1 })[0];
const rawHeaders = headerOnly.map(String);

// 2) 新しいカラム名を決定（順序は元CSVの順を維持）
const newColumns = rawHeaders.map((h) => {
  const key = HEADER_MAP[normalize(h)];
  return key || toSafeKey(h);
});

// 3) columns: 新しいカラム名でパース（→ 配列の各オブジェクトは短いキーになる）
const records = parse(csvText, {
  columns: newColumns,
  skip_empty_lines: true,
  relax_quotes: true
});

// 4) JSON出力
fs.writeFileSync(outJsonPath, JSON.stringify(records, null, 2), 'utf8');

// 5) 置換後ヘッダーのCSVも出力
const renamedCsv = stringify(records, {
  header: true,
  columns: newColumns
});
fs.writeFileSync(outCsvPath, renamedCsv, 'utf8');

console.log(`✅ JSON: ${outJsonPath}`);
console.log(`✅ CSV : ${outCsvPath}`);
