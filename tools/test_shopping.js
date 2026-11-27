/* 기념품 탭·필터·복사 버튼·개인정보 점검 (jsdom)
   node tools/test_shopping.js  — 빌드된 chongqing-2026/index.html 을 읽어 확인한다. */
const fs = require("fs");
const path = require("path");
const {JSDOM, VirtualConsole} = require("jsdom")  // 저장소 루트에서 npm install;

const file = path.join(__dirname, "..", "chongqing-2026", "index.html");
const html = fs.readFileSync(file, "utf8");
const vc = new VirtualConsole();  // jsdom 이 scrollTo 등 미구현 API에 남기는 소음은 무시
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); console.log((cond ? "PASS " : "FAIL ") + msg); };

const main = async () => {
const dom = new JSDOM(html, {runScripts: "dangerously", url: "https://park-sy.github.io/yeop-travel/chongqing-2026/", virtualConsole: vc});
const {window} = dom;
const doc = window.document;
// document.execCommand 은 jsdom 에 없다 → 복사 실패 경로(길게 눌러 복사)까지 같이 확인된다
const go = tab => { window.location.hash = "#" + tab; window.dispatchEvent(new window.Event("hashchange")); };

const tabs = [...doc.querySelectorAll("#tabs button")].map(b => b.dataset.id);
console.log("탭:", tabs.join(" | "));
ok(tabs.length === 9, "탭 9개 (입국카드+4일차+공통+기념품+카페·가게+이야기)");
ok(tabs.includes("shopping"), "기념품 탭이 붙었다");
ok(tabs[tabs.indexOf("common") + 1] === "shopping", "기념품 탭이 공통 다음");

// 입국카드 탭: 항공편 복사 버튼
go("arrival");
const arrivalCopies = [...doc.querySelectorAll("#ac-flight [data-copy]")].map(b => b.dataset.copy);
console.log("입국카드 항공편 복사:", arrivalCopies.join(", "));
ok(arrivalCopies.includes("CA0440") && arrivalCopies.includes("CA0439"), "입국카드 탭에 CA0440·CA0439 복사 버튼");
const arrivalText = doc.getElementById("view").textContent;
ok(/인천 제1여객터미널\(T1\).*14:00/.test(arrivalText) && /08:30/.test(arrivalText), "입국카드 탭에 터미널·시각 안내");
ok(!/시트에 없으니|e티켓\(예약 확인서\)을 보고|터미널 재확인/.test(arrivalText), "‘시트에 편명 없음’ 식 옛 안내가 남지 않음");

// 기념품 탭
go("shopping");
const gifts = [...doc.querySelectorAll("#giftlist .gift")];
const total = gifts.length;
const visible = () => gifts.filter(g => !g.hidden).length;
console.log("기념품 카드:", total, "개");
ok(total >= 12, "기념품 카드 12개 이상 (" + total + ")");
ok(visible() === total, "처음엔 전체가 다 보인다");
ok(doc.querySelectorAll("#giftfilters .fbtn").length === 4, "필터 버튼 4개(전체/회사용/지인용/가족용)");
ok(/전체 \d+개/.test(doc.getElementById("giftcount").textContent), "전체 몇 개인지 표시: " + doc.getElementById("giftcount").textContent);

const clickFilter = k => {
  doc.querySelector(`#giftfilters [data-filter="${k}"]`).dispatchEvent(new window.MouseEvent("click", {bubbles: true}));
};
for (const k of ["work", "friend", "family"]) {
  clickFilter(k);
  const expect = gifts.filter(g => g.dataset.tags.split(" ").includes(k)).length;
  const pressed = doc.querySelector(`#giftfilters [data-filter="${k}"]`).getAttribute("aria-pressed");
  ok(visible() === expect, `필터 ${k}: ${expect}개만 보임 (실제 ${visible()})`);
  ok(pressed === "true", `필터 ${k} 버튼이 눌린 상태`);
}
clickFilter("all");
ok(visible() === total, "전체로 되돌리면 모두 보인다");

// 태그 배지가 카드마다 있는지
const noBadge = gifts.filter(g => !g.querySelector(".gtag"));
ok(noBadge.length === 0, "모든 카드에 대상 태그 배지");

// 가격(元·원)과 중국어 복사 버튼
ok(gifts.every(g => /元/.test(g.querySelector(".gprice").textContent)), "모든 카드에 위안 가격");
ok(gifts.every(g => /원/.test(g.querySelector(".gprice").textContent)), "모든 카드에 원화 약산");
const ccs = [...doc.querySelectorAll("#giftlist [data-copy]")];
ok(ccs.length === total, "카드마다 중국어 복사 버튼 (" + ccs.length + ")");
const cc = ccs[0];
cc.dispatchEvent(new window.MouseEvent("click", {bubbles: true}));
await new Promise(r => setTimeout(r, 50));  // 복사는 async — 토스트가 뜰 때까지 한 틱
ok(doc.getElementById("toast").textContent.length > 0, "복사 버튼이 토스트로 반응: " + doc.getElementById("toast").textContent);
ok(cc.classList.contains("copied") || /길게 눌러/.test(cc.textContent), "복사 실패해도 길게 눌러 복사 안내로 떨어진다");

// 구매처
const stores = [...doc.querySelectorAll(".store")];
console.log("구매처:", stores.map(s => s.querySelector("h4").textContent.trim()).join(" / "));
ok(stores.length >= 6, "해방비 구매처 6곳 이상 (" + stores.length + ")");
ok(stores.every(s => s.querySelector("[data-copy]") && /amap\.com\/search/.test(s.innerHTML)), "구매처마다 중국어 복사 + 고덕지도 검색 링크");
ok(stores.some(s => /重百超市/.test(s.textContent)) && stores.some(s => /永辉超市/.test(s.textContent)), "重百超市·永辉超市 포함");
ok(stores.some(s => s.querySelector('[data-open="ciqikou"]')), "츠지커우 카드로 가는 링크");

// 반입·검역 안내
const shopText = doc.getElementById("view").textContent;
ok(/张飞牛肉/.test(shopText) && /반입 금지/.test(shopText) && /1,000만 원/.test(shopText), "육포 반입 금지 경고");
ok(/1PC/.test(shopText) && /2L/.test(shopText), "수하물·주류 면세 안내");

// 츠지커우 링크가 실제로 상세로 가는지
stores.find(s => s.querySelector('[data-open="ciqikou"]')).querySelector("[data-open]").dispatchEvent(new window.MouseEvent("click", {bubbles: true}));
ok(window.location.hash === "#p-ciqikou", "츠지커우 링크 → 장소 상세 이동 (" + window.location.hash + ")");

// 카페·가게 탭
go("cafes");
ok(tabs[tabs.indexOf("shopping") + 1] === "cafes", "카페 탭이 기념품 다음");
ok(tabs[tabs.indexOf("cafes") + 1] === "story", "카페 탭 다음이 이야기");
const cafes = [...doc.querySelectorAll("#cafelist .ccard")];
console.log("카페/가게 카드:", cafes.length);
ok(cafes.length >= 20, "카페·가게 카드 20곳 이상 (" + cafes.length + ")");
ok(doc.querySelectorAll("#cafeareas [data-af]").length === 7, "구역 필터 7개(전체+6구역)");
ok(doc.querySelectorAll("#cafetags [data-tf]").length === 5, "성격 필터 5개(전체/카페/디저트/간식/가게·소품)");
ok(cafes.every(c => c.querySelectorAll(".cg img").length >= 2), "카드마다 사진 2장 이상");
ok(cafes.every(c => [...c.querySelectorAll(".cg img")].every(i => /^data:image\/jpeg;base64,/.test(i.getAttribute("src")))), "사진이 모두 내장(base64) 이미지");
ok(cafes.every(c => c.querySelector(".cg figcaption")), "사진마다 캡션");
ok(cafes.every(c => c.querySelector("[data-copy]")), "카드마다 중국어 복사 버튼");
ok(cafes.every(c => /amap\.com\/search/.test(c.innerHTML)), "카드마다 고덕지도 검색 링크");
ok(cafes.every(c => /元/.test(c.textContent)), "카드마다 위안 가격");
ok(cafes.every(c => /동선 팁/.test(c.textContent)), "카드마다 동선 팁");
const visC = () => cafes.filter(c => !c.hidden).length;
const clickAf = k => doc.querySelector(`#cafeareas [data-af="${k}"]`).dispatchEvent(new window.MouseEvent("click", {bubbles: true}));
clickAf("ciqikou");
ok(visC() === 4, "츠지커우 필터 4곳 (" + visC() + ")");
ok(doc.querySelector('#cafeareas [data-af="ciqikou"]').getAttribute("aria-pressed") === "true", "구역 버튼 눌린 상태");
ok(/츠지커우/.test(doc.getElementById("cafecount").textContent), "필터 결과 문구: " + doc.getElementById("cafecount").textContent);
doc.querySelector('#cafetags [data-tf="cafe"]').dispatchEvent(new window.MouseEvent("click", {bubbles: true}));
ok(visC() === 3, "츠지커우 × 카페 = 3곳 (" + visC() + ")");
clickAf("all");
doc.querySelector('#cafetags [data-tf="all"]').dispatchEvent(new window.MouseEvent("click", {bubbles: true}));
ok(visC() === cafes.length, "전체로 되돌리면 모두 보인다");
// 카드 안 복사 버튼을 눌러도 구역 필터가 바뀌지 않는지 (data-area 충돌 방지)
cafes[0].querySelector("[data-copy]").dispatchEvent(new window.MouseEvent("click", {bubbles: true}));
await new Promise(r => setTimeout(r, 30));
ok(visC() === cafes.length, "카드 안 버튼 클릭은 필터를 건드리지 않는다");

// 개인정보 점검 (빌드 결과 전체)
const pii = ["PARK", "SANGYEOP", "SANG YEOP", "9992610234430", "DVRJHZ", "PVVH3Z", "2627-6970", "meko6970", "@gmail", "@naver"];
const found = pii.filter(s => html.includes(s));
// 여권번호·휴대폰·이메일 모양의 문자열이 남아 있지 않은지도 본다 (설명 문구의 '여권번호' 단어는 제외)
if (/\b[A-Z]{1,2}\d{7,8}\b/.test(html)) found.push("여권번호 모양 문자열");
if (/\b0?1[0-9][- .]?\d{3,4}[- .]?\d{4}\b/.test(html)) found.push("휴대폰 번호 모양");
if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(html)) found.push("이메일 주소");
ok(found.length === 0, "개인정보 문자열 0건" + (found.length ? " → " + found.join(", ") : ""));
ok(!/docs\.google\.com\/spreadsheets/.test(html), "시트 원본 링크 없음");
ok(!/\{\{/.test(html.split("<script>")[0]), "남은 {{자리}} 없음");

console.log(fails.length ? `\n실패 ${fails.length}건` : "\n전부 통과");
process.exit(fails.length ? 1 : 0);
};
main();
