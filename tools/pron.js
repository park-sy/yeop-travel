/* 중국어 → 한글 발음 표 (trips/<slug>/pron.json)

   node tools/pron.js trips/<slug>

   data.js·talk.js 에 나오는 한자 덩어리마다 병음과 한글 발음을 만들어 둔다. 빌드된 페이지는
   이 표만 읽는다 (사전 라이브러리를 페이지에 싣지 않으려고). data.js 를 고친 뒤
   새 한자가 생기면 build.py 가 "pron.json 다시 만들기" 를 요구한다.

   한글 표기는 외래어 표기법이 아니라 '소리 내어 따라 읽기 쉬운' 쪽을 골랐다
   (解放碑 지에 팡 베이, 小面 샤오 미엔). 음절마다 띄어 쓴다. */
const fs = require("fs");
const path = require("path");

const HAN_RUN = /[㐀-鿿]+/g;

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const block = (cho, jung, jong = "") =>
  String.fromCharCode(0xac00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28 + JONG.indexOf(jong));

/* 성모 — 두 글자짜리(zh/ch/sh)를 먼저 본다 */
const INITIALS = [["zh", "ㅈ"], ["ch", "ㅊ"], ["sh", "ㅅ"], ["b", "ㅂ"], ["p", "ㅍ"], ["m", "ㅁ"], ["f", "ㅍ"],
  ["d", "ㄷ"], ["t", "ㅌ"], ["n", "ㄴ"], ["l", "ㄹ"], ["g", "ㄱ"], ["k", "ㅋ"], ["h", "ㅎ"], ["j", "ㅈ"],
  ["q", "ㅊ"], ["x", "ㅅ"], ["r", "ㄹ"], ["z", "ㅉ"], ["c", "ㅊ"], ["s", "ㅆ"]];

/* 운모 → [모음, 받침] 음절들. 첫 음절이 성모를 받고 나머지는 ㅇ 으로 시작 */
const FINALS = {
  a: [["ㅏ"]], o: [["ㅗ"]], e: [["ㅓ"]], ai: [["ㅏ"], ["ㅣ"]], ei: [["ㅔ"], ["ㅣ"]], ao: [["ㅏ"], ["ㅗ"]], ou: [["ㅓ"], ["ㅜ"]],
  an: [["ㅏ", "ㄴ"]], en: [["ㅓ", "ㄴ"]], ang: [["ㅏ", "ㅇ"]], eng: [["ㅓ", "ㅇ"]], ong: [["ㅗ", "ㅇ"]],
  i: [["ㅣ"]], ia: [["ㅑ"]], iao: [["ㅑ"], ["ㅗ"]], ie: [["ㅣ"], ["ㅔ"]], iu: [["ㅣ"], ["ㅜ"]], ian: [["ㅣ"], ["ㅔ", "ㄴ"]],
  in: [["ㅣ", "ㄴ"]], iang: [["ㅑ", "ㅇ"]], ing: [["ㅣ", "ㅇ"]], iong: [["ㅣ"], ["ㅗ", "ㅇ"]],
  u: [["ㅜ"]], ua: [["ㅘ"]], uo: [["ㅝ"]], uai: [["ㅘ"], ["ㅣ"]], ui: [["ㅜ"], ["ㅣ"]], uan: [["ㅘ", "ㄴ"]], un: [["ㅜ", "ㄴ"]], uang: [["ㅘ", "ㅇ"]],
  "ü": [["ㅟ"]], "üe": [["ㅞ"]], "üan": [["ㅟ"], ["ㅔ", "ㄴ"]], "ün": [["ㅟ", "ㄴ"]],
};

/* 성모 없는 음절(y·w 로 시작하는 것 포함)은 통째로 */
const ZERO = {
  a: "아", o: "오", e: "어", ai: "아이", ei: "에이", ao: "아오", ou: "어우", an: "안", en: "언", ang: "앙", eng: "엉", er: "얼",
  yi: "이", ya: "야", yao: "야오", ye: "예", you: "요우", yan: "옌", yang: "양", yin: "인", ying: "잉", yong: "융",
  yu: "위", yue: "웨", yuan: "위엔", yun: "윈",
  wu: "우", wa: "와", wo: "워", wai: "와이", wei: "웨이", wan: "완", wen: "원", wang: "왕", weng: "웡",
};

/* 한국에서 굳어진 읽기 (重庆 충칭, 中国 중궈) */
const SPECIAL = {chong: "충", zhong: "중"};

/* 병음 한 음절(성조 없음) → 한글. 모르는 음절은 병음 그대로 돌려준다 */
function syllable(py) {
  const s = py.toLowerCase().replace(/v/g, "ü");
  if (SPECIAL[s]) return SPECIAL[s];
  if (ZERO[s]) return ZERO[s];
  const hit = INITIALS.find(([ini]) => s.startsWith(ini));
  if (!hit) return py;
  const [ini, cho] = hit;
  let fin = s.slice(ini.length);
  if ("jqx".includes(ini)) fin = fin.replace(/^u/, "ü");           // ju = 쥐
  if (fin === "i" && ["zh", "ch", "sh", "r", "z", "c", "s"].includes(ini)) return block(cho, "ㅡ");  // 즈 츠 스 르 쯔 츠 쓰
  const parts = FINALS[fin];
  if (!parts) return py;
  return parts.map(([v, f], i) => block(i === 0 ? cho : "ㅇ", v, f)).join("");
}

/* 한자 덩어리 → {h: 한글(음절마다 띄움), p: 성조 병음} */
function reading(run, pinyinLib) {
  const plain = pinyinLib.pinyin(run, {toneType: "none", type: "array"});
  const toned = pinyinLib.pinyin(run, {type: "array"});
  return {h: plain.map(syllable).join(" "), p: toned.join(" ")};
}

function buildTable(dataText, pinyinLib) {
  const runs = [...new Set(dataText.match(HAN_RUN) || [])].sort();
  return Object.fromEntries(runs.map(r => [r, reading(r, pinyinLib)]));
}

module.exports = {syllable, reading, buildTable, HAN_RUN};

if (require.main === module) {
  const dir = process.argv[2];
  if (!dir) { console.error("사용법: node tools/pron.js trips/<slug>"); process.exit(1); }
  let pinyinLib;
  try { pinyinLib = require("pinyin-pro"); }
  catch (e) { console.error("pinyin-pro 가 없어요. 저장소 루트에서 npm install 먼저"); process.exit(1); }
  const text = ["data.js", "talk.js"].map(f => path.join(dir, f)).filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, "utf8")).join("\n");
  const table = buildTable(text, pinyinLib);
  const unknown = Object.entries(table).filter(([, v]) => /[a-zü]/i.test(v.h)).map(([k, v]) => `${k}=${v.h}`);
  fs.writeFileSync(path.join(dir, "pron.json"), JSON.stringify(table, null, 1) + "\n");
  console.log(`${dir}/pron.json: 한자 덩어리 ${Object.keys(table).length}개`);
  if (unknown.length) console.log("한글로 못 바꾼 음절이 있어요 (병음 그대로 둠):\n  " + unknown.join("\n  "));
}
