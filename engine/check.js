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
console.log("장소",Object.keys(PLACES).length,"문제",bad);
