const fs=require("fs");
const src=fs.readFileSync(process.argv[2],"utf8");
eval(src.replace(/^const /gm,"var "));
const need={spot:["glance","about","story","see","photo","route","entry","warn","planb","src"],shop:["glance","about","menu","order","pay","queue","warn","planb","src"]};
let bad=0; const used=new Set();
for(const d of DAYS) for(const x of d.flow){ if(x.stop){ if(!PLACES[x.stop]){console.log("없는 장소",x.stop);bad++} used.add(x.stop)} }
for(const [id,p] of Object.entries(PLACES)){
  for(const k of need[p.type]) if(!p[k]||(Array.isArray(p[k])&&!p[k].length)){console.log("빈 목차",id,k);bad++}
  if(p.type==="shop"&&!(p.about.pros&&p.about.cons)){console.log("장단점 없음",id);bad++}
  if(!used.has(id)){console.log("일정에 없음",id);bad++}
  if(!p.cn||!String(p.cn).trim()){console.log("중국어 이름 없음",id);bad++}
}
if(typeof STORY!=="undefined"&&STORY){
  const html=STORY.html||"";
  if(html.length<800){console.log("이야기 탭이 비었어요");bad++}
  for(const m of html.matchAll(/data-jump="([^"]+)"/g)) if(!html.includes('id="'+m[1]+'"')){console.log("이야기 목차 링크 깨짐",m[1]);bad++}
}
if(src.includes("@@END@@")){console.log("남은 자리 표시자");bad++}
if(typeof SHOPPING!=="undefined"&&SHOPPING){
  const tagset=new Set(Object.keys(SHOPPING.tags||{}));
  if(!SHOPPING.gifts||!SHOPPING.gifts.length){console.log("기념품 탭에 카드 없음");bad++}
  for(const g of SHOPPING.gifts||[]){
    for(const k of ["name","cn","price","krw","why"]) if(!g[k]){console.log("기념품 빈 칸",k,g.name||"?");bad++}
    if(!g.tags||!g.tags.length){console.log("기념품 태그 없음",g.name);bad++}
    for(const t of g.tags||[]) if(!tagset.has(t)){console.log("모르는 대상 태그",t,g.name);bad++}
  }
  for(const s of SHOPPING.stores||[]) if(!s.name||!s.cn||!s.addr){console.log("상점 빈 칸",s.name||s.cn||"?");bad++}
}
if(typeof CAFES!=="undefined"&&CAFES){
  const areas=new Set((CAFES.areas||[]).map(a=>a[0]));
  const tagset=new Set(Object.keys(CAFES.tags||{}));
  if(!CAFES.shops||!CAFES.shops.length){console.log("카페 탭에 가게 없음");bad++}
  const ids=new Set(), got=new Set();
  for(const s of CAFES.shops||[]){
    for(const k of ["id","name","cn","area","price","hours","where","one","tip"]) if(!s[k]){console.log("카페 빈 칸",k,s.name||s.id||"?");bad++}
    if(ids.has(s.id)){console.log("카페 id 중복",s.id);bad++} ids.add(s.id);
    if(!s.tags||!s.tags.length){console.log("카페 태그 없음",s.name);bad++}
    for(const t of s.tags||[]) if(!tagset.has(t)){console.log("모르는 카페 태그",t,s.name);bad++}
    if(!areas.has(s.area)){console.log("카페 모르는 구역",s.area,s.name);bad++} got.add(s.area);
    if(!s.photos||s.photos.length<2){console.log("카페 사진 2장 미만",s.name);bad++}
    for(const ph of s.photos||[]) if(!ph[0]||!ph[1]){console.log("카페 사진 캡션 없음",s.name);bad++}
    if(!s.menu||!s.menu.length){console.log("카페 메뉴 없음",s.name);bad++}
  }
  for(const a of areas) if(a!=="all"&&!got.has(a)){console.log("카페 구역에 가게 없음",a);bad++}
}
console.log("장소",Object.keys(PLACES).length,"문제",bad);
