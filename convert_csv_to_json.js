const fs = require('fs');
const path = require('path');

// CSVファイルのパス
const csvFilePath = path.join(__dirname, 'ai_survey.csv');

// CSVを読み込んでJSONに変換
function csvToJson(csvFilePath) {
  const csv = fs.readFileSync(csvFilePath, 'utf8');
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');

  const json = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = (values[i] !== undefined ? values[i].trim() : "");
    });
    return obj;
  });

  return json;
}

// 変換してファイルに保存
const jsonData = csvToJson(csvFilePath);
fs.writeFileSync(path.join(__dirname, 'ai_survey.json'), JSON.stringify(jsonData, null, 2), 'utf8');

console.log('変換完了: ai_survey.json');