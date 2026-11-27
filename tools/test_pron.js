/* 한글 발음 표기·듣기 버튼 점검 (jsdom)
   node tools/test_pron.js  — 빌드된 chongqing-2026/index.html 을 읽어 확인한다. */
const fs = require("fs");
const path = require("path");
const {JSDOM, VirtualConsole} = require("jsdom");  // 저장소 루트에서 npm install
const {syllable} = require("./pron.js");

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); console.log((cond ? "PASS " : "FAIL ") + msg); };

/* 음절 변환 */
const SYL = {san: "싼", ge: "거", ren: "런", xian: "시엔", zai: "짜이", you: "요우", zhi: "즈", ma: "마", chong: "충", qing: "칭",
  jie: "지에", fang: "팡", bei: "베이", hong: "홍", ya: "야", dong: "동", ci: "츠", qi: "치", kou: "커우", wei: "웨이", la: "라",
  huo: "훠", guo: "궈", "lü": "뤼", xiao: "샤오", mian: "미엔", jiu: "지우", jiang: "쟝", xue: "쉐", ju: "쥐", yuan: "위엔",
  shi: "스", ri: "르", zi: "쯔", si: "쓰", kuai: "콰이", er: "얼", zhuang: "좡", liao: "랴오"};
for (const [py, h] of Object.entries(SYL)) ok(syllable(py) === h, `음절 ${py} → ${h} (실제 ${syllable(py)})`);
ok(syllable("hm") === "hm", "모르는 음절은 병음 그대로");

const PRON = require(path.join(__dirname, "..", "trips", "chongqing-2026", "pron.json"));
const left = Object.entries(PRON).filter(([, v]) => /[a-zü]/i.test(v.h));
ok(left.length === 0, `pron.json 한글 발음에 못 바꾼 병음 없음 ${left.map(([k, v]) => k + "=" + v.h).join(", ")}`);

/* 화면 */
const html = fs.readFileSync(path.join(__dirname, "..", "chongqing-2026", "index.html"), "utf8");
const spoken = [];
const dom = new JSDOM(html, {runScripts: "dangerously", url: "https://park-sy.github.io/yeop-travel/chongqing-2026/#d1", virtualConsole: new VirtualConsole(),
  beforeParse(w){
    w.SpeechSynthesisUtterance = function(t){ this.text = t; };
    w.speechSynthesis = {getVoices: () => [{lang: "ko-KR", name: "Yuna"}, {lang: "zh-CN", name: "Tingting"}],
      speak: u => spoken.push(u), cancel(){}, addEventListener(){}};
  }});
const {window} = dom; const doc = window.document;
const go = h => { window.location.hash = "#" + h; window.dispatchEvent(new window.Event("hashchange")); };

const zhCopies = () => [...doc.querySelectorAll(".cc[data-copy]")].filter(b => /[㐀-鿿]/.test(b.dataset.copy));
for (const tab of ["d1", "d2", "d3", "shopping", "cafes", "arrival"]) {
  go(tab);
  const cc = zhCopies();
  ok(cc.length > 0 && cc.every(b => b.querySelector(".yin")?.textContent.trim()), `${tab}: 중국어 복사 버튼 ${cc.length}개 모두 한글 발음`);
  ok(cc.every(b => b.nextElementSibling?.classList.contains("say")), `${tab}: 중국어 복사 버튼 옆마다 듣기 버튼`);
  ok(![...doc.querySelectorAll(".yin,.yinq")].some(e => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(e.textContent)), `${tab}: 발음에 성조 병음이 섞이지 않음`);
}

go("p-jiucun");
const cc = zhCopies()[0];
ok(cc.dataset.copy === "九村烤脑花(解放碑店)", "지우춘 상세 첫 복사 버튼은 가게 이름");
ok(cc.querySelector(".yin").textContent === "지우 춘 카오 나오 화 (지에 팡 베이 디엔)", `지우춘 발음: ${cc.querySelector(".yin").textContent}`);
ok(cc.querySelector(".zh").textContent === "九村烤脑花(解放碑店)", "복사 실패 시 골라지는 글자는 중국어만");
window.render();
ok(zhCopies().every(b => b.querySelectorAll(".yin").length === 1 && b.parentElement.querySelectorAll(`.say[data-say="${b.dataset.copy}"]`).length <= 1), "다시 그려도 발음·듣기 버튼이 겹치지 않음");

go("p-massage");
const q = [...doc.querySelectorAll(".zhq")].find(b => b.dataset.say === "三个人现在有位置吗？");
ok(!!q, "본문 ‘三个人现在有位置吗？’ 가 듣기 버튼이 됨");
ok(q && q.parentElement.querySelector(".yinq")?.textContent === "싼 거 런 시엔 짜이 요우 웨이 즈 마", "본문 문장 뒤에 한글 발음");
q.click();
const u = spoken.at(-1);
ok(u && u.text === "三个人现在有位置吗？" && u.lang === "zh-CN" && u.voice?.name === "Tingting", "누르면 중국어(zh-CN) 음성으로 읽음");

go("p-jiucun");
const talk = doc.querySelectorAll("#sec-talk .phrase");
ok(talk.length >= 3 && [...talk].every(p => p.querySelector(".yin").textContent.trim() && p.querySelector(".say") && p.querySelector("[data-copy]")), `지우춘 '현지에서 쓸 말' ${talk.length}개 모두 발음·듣기·복사`);
ok(doc.querySelectorAll(".toc button")[1]?.textContent.includes("현지에서 쓸 말"), "목차 두 번째가 '현지에서 쓸 말'");
ok(doc.querySelector("#sec-talk .yin").textContent === "워 짜이 다 중 디엔 핑 취 러 하오 치엔 미엔 하이 요우 지 줘", `발음: ${doc.querySelector("#sec-talk .yin").textContent}`);

go("common");
const ph = doc.querySelectorAll(".phrase");
ok(ph.length > 0 && [...ph].every(p => p.querySelector(".yin").textContent.trim() && p.querySelector(".say")), `공통 탭 문장 ${ph.length}개 모두 발음·듣기`);
const wl = [...doc.querySelectorAll(".zhq")].find(b => b.dataset.say === "微辣");
ok(!wl || !(wl.nextElementSibling?.classList.contains("yinq")), "‘微辣(웨이라)’ 처럼 발음이 이미 적힌 곳은 발음을 또 달지 않음");

doc.querySelector(".phrase .say").click();
ok(spoken.length >= 2, "공통 탭 듣기 버튼도 읽음");

if (fails.length) { console.error(`\n실패 ${fails.length}건`); process.exit(1); }
console.log("\n모두 통과");
