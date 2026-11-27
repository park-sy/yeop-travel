---
name: travel-guide
description: 여행 일정(구글 시트 등)을 받아 폰에서 보는 일정별 여행 가이드를 만든다 — 장소마다 명소/가게 상세 페이지, 이동 연결선, 블로그 후기 기반 메뉴·팁, 사진. yeop-travel 저장소에 새 여행을 추가하고 GitHub Pages 로 올린다. "여행 가이드 만들어줘", "여행 계획 정리해서 모바일로", "이 일정 시트로 가이드" 요청에 사용.
---

# 여행 가이드 만들기

저장소: `~/dev/yeop-travel` (공개 · GitHub Pages `https://park-sy.github.io/yeop-travel/<slug>/`).
틀은 `engine/` 에 있고, 여행 하나는 `trips/<slug>/` 폴더 하나다. **틀은 고치지 말고 데이터를 채운다.**
틀을 고쳐야 하면 다른 여행도 다시 빌드해서 깨지지 않는지 확인한다.

## 사용자가 이미 정한 것 (다시 묻지 말 것)

- 결과물은 **링크로 여는 웹 페이지**. 아티팩트 X. 카톡 파일 뷰어·iOS 파일 미리보기는 JS 를 안 돌려서 HTML 파일을 보내면 빈 화면이 된다 → GitHub Pages 로 올린다
- **글만 있으면 안 된다.** 사진, 타입 칩, 상태 배지, 이동 아이콘, 맵기 미터 같은 시각 요소
- 일차 목록은 **짧은 카드**, 누르면 **장소 상세**. 상세는 타입별 **고정 목차**를 빠짐없이 채운다
- 카드 사이에 **세로 이동 연결선**: 수단 아이콘 + 소요 분 + 비용 + 메모
- 타입은 둘: **명소**(spot) / **가게**(shop — 식당·카페·마사지·먹자골목처럼 돈 내고 메뉴 고르는 곳)
- 가게는 **블로그·후기 기반** 대표 메뉴와 설명. 명소는 **가이드가 들려줄 법한 이야기**(유래·역사·현지 사정·알고 보면 재밌는 것)까지
- 처음 타는 교통수단(지하철 등)은 **카드 찍는 법·표 사는 법까지 단계별로**

## 절차

### 1. 일정 읽기
- 구글 시트는 공개 링크면 탭마다 `https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=<gid>` 로 받는다. 받은 CSV 는 `scratch/`(gitignore) 에.
- 시트가 **단일 기준(SSOT)** 이다. 시간·가격·예약 상태는 옮겨 적기만 한다. 안(A/B/C안)이 여럿이면 어느 안인지 확인하고 `DAYS[].sub` 에 적는다. 분기(케이스 1/2)는 `{branch, note}`.
- 시트에서 이상한 점(칸 밀림, 인원 수 불일치 등)은 고치지 말고 **사용자에게 보고**.

### 2. 장소 분류와 조사
- 장소마다 spot/shop 을 정한다.
- **가게**: 네이버 블로그 검색 (`naver-blog-research` 스킬, k-skill CLI).
  `npx -y @nomadamas/k-skill@0 exec naver-blog-research scripts/naver_search.py -- "<지역> <가게명>" --count 8`
  → 본문 `scripts/naver_read.py -- <url> --no-images --max-length 4000`.
  최근 1~2년 후기 3개 이상에서 겹치는 메뉴·가격·맵기·웨이팅·주의점만 쓴다. 근거가 약하면 "후기 부족" 이라고 적는다.
- **명소**: 유래·역사·현지 사정은 일반 지식으로 쓰되, 확실하지 않은 연도·수치는 빼거나 "~쯤" 으로. 사용자에게 **검증 못 한 항목**을 따로 알린다.
- **교통**: 현지 교통수단(지하철 QR 발급, 개찰구, 1회권, 보안검색, 방향 확인)은 블로그로 확인해서 `METRO`/이동의 `steps` 로.

### 3. 데이터 쓰기 (`trips/<slug>/`)
- `trip.json`: slug · title · headline · eyebrow · dates · cover_alt · footer · tz(현지 IANA 시간대) · map_label · map_search(현지에서 쓰는 지도 검색 URL 접두어 — 중국은 고덕 `https://www.amap.com/search?query=`)
- `data.js` 형태는 `trips/chongqing-2026/data.js` 를 그대로 본뜬다:
  - `PLACES.<id>` 공통: `type, day, t, stay, name, cn(현지어 이름 — 복사해서 택시·지도에 붙여넣음), img?, badge, one(카드 한 줄), glance[[k,v]], warn[], planb[], src[[이름,url]]`
  - spot: `about(문자열), story[[제목,내용]](3~4개), see[], photo[], route[], entry[]`
  - shop: `about{text,pros[],cons[]}, menu[[한글,현지어,가격,맵기0-3,설명]], order{items[],total,note}, pay[], queue[]`
  - `DAYS[{id,tab,date,iso,title,sub,flow[]}]` — flow 는 `{stop}` · `{move:"walk|didi|metro|mall|cable",min,cost?,note?,steps?[]}` · `{branch,note}` · `{minor,t,name,note}`
  - `COMMON`(공통 탭 HTML: 결제·이동·먹을 때·앱 체크·날씨·긴급) · `PHRASES[[한글,현지어]]` · `METRO`(선택) · `STORY{label,small,html}`(선택, 이야기 탭) · `ARRIVAL{label,small,html}`(선택, 입국카드 탭 — 출국 전 준비, 탭 맨 앞에 불음) · `SHOPPING{...}`(선택, 기념품 탭) · `CAFES{areas,tags,shops[]}`(선택, 동선별 카페·가게 탭 — `shops` 는 `{name,cn,area,tags,price,krw,hours,where,one,menu,tip,photos[[이미지키,캡션]],src}`)
- `badge`: ok 확정 · pay 예매 필요 · open 오픈 대기 · wait 현장 웨이팅 · line 원격 줄서기 · free 무료 · opt 선택 · cand 후보
- 새 이동 수단이 필요하면 `engine/template.html` 의 `MOVE` 에 아이콘을 추가 (틀 변경 → 다른 여행도 재빌드).

### 4. 사진
- `cd trips/<slug> && python3 -I ../../tools/commons.py "<검색어>"` 로 Commons 후보 → 라이선스 있는 것만 골라 `{"키":"File:...jpg"}` JSON 을 만들고 `python3 -I ../../tools/fetchimg.py picks.json` (429 나면 자동 재시도, 느려도 정상).
- `img/*.raw` → `sips -s format jpeg -s formatOptions 55 -Z 720 x.raw --out img/x.jpg`, `img/credits.json` → `credits.json`. `.raw` 는 커밋하지 않는다.
- `hero` 키가 표지 사진. 사진 없는 장소는 현지어 첫 글자 타일로 자동 대체된다.

### 5. 검사 → 빌드 → 눈으로 확인
```bash
npm install                                      # 처음 한 번
node tools/pron.js trips/<slug>                  # 중국어 한글 발음 표 (현지어가 중국어일 때)
node engine/check.js trips/<slug>/data.js        # "문제 0"
npm test                                         # 화면 테스트 (충칭 기준)
python3 -I engine/build.py trips/<slug>          # → <slug>/index.html
```
- 헤드리스 크롬으로 폰 폭 스크린샷: 일차 목록 1개, 명소 상세 1개, 가게 상세 1개, 공통 탭. (크롬 최소 창 폭 때문에 오른쪽이 잘려 보이는 건 버그 아님)
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=500,2600 --virtual-time-budget=3000 --screenshot=x.png "file://$PWD/<slug>/index.html#p-<id>"`

### 6. 올리기
- 루트 `index.html` 목록과 `README.md` 표에 한 줄 추가.
- **공개 저장소 점검**: 사람 이름, 전화·이메일, 계정 ID, 예약번호, 시트 원본 링크가 없어야 한다 (`build.py` 가 시트 링크는 막는다). 커밋에 개인 이메일 대신 `park-sy@users.noreply.github.com`.
- `git add -A && git commit -m "feat: <여행> 가이드" && git push` → 1분쯤 뒤 `https://park-sy.github.io/yeop-travel/<slug>/`. `gh api repos/park-sy/yeop-travel/pages/builds/latest --jq .status` 가 `built` 인지 보고 링크를 전달.

## 보고할 것
링크 · 장소 수(명소/가게) · 사진 없는 곳 · 블로그 근거가 약한 곳 · 검증 못 한 이야기 · 시트에서 본 이상한 점.
