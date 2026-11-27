# yeop-travel

여행 일정 시트와 블로그 후기로 만드는 **모바일 여행 가이드** 모음.
GitHub Pages 로 올라가서 링크 하나로 폰에서 열린다 → https://park-sy.github.io/yeop-travel/

| 여행 | 링크 |
|---|---|
| 충칭 3박 4일 (2026.11.28 – 12.01) | [chongqing-2026](https://park-sy.github.io/yeop-travel/chongqing-2026/) |

## 구조

```
engine/          모든 여행이 같이 쓰는 틀
  template.html  화면 (CSS + 렌더링 JS). 여행마다 다른 값은 {{자리}}·/*자리*/ 로 비워 둠
  build.py       trips/<slug> → <slug>/index.html (사진을 base64 로 넣은 파일 하나)
  check.js       빈 목차·없는 장소·일정에 안 쓰인 장소 검사
trips/<slug>/    여행 하나의 원본
  trip.json      제목·표지 문구·시간대·지도 검색 주소
  data.js        PLACES · DAYS · COMMON(공통 탭) · PHRASES · METRO(선택) · STORY(선택, 이야기 탭) · ARRIVAL(선택, 입국카드 탭) · SHOPPING(선택, 기념품 탭) · CAFES(선택, 카페·가게 탭)
  img/*.jpg      사진 (Wikimedia Commons, 720px)
  credits.json   사진 저작자·라이선스
<slug>/index.html  빌드 결과 — Pages 가 이걸 보여준다
tools/           Commons 사진 검색(commons.py)·내려받기(fetchimg.py)
skills/          새 여행 가이드를 만드는 절차 (Claude Code 스킬)
```

## 고치고 다시 올리기

```bash
# trips/<slug>/data.js 수정 후
node engine/check.js trips/<slug>/data.js     # "문제 0" 이어야 함
python3 -I engine/build.py trips/<slug>
git add -A && git commit -m "fix: ..." && git push   # 1분쯤 뒤 링크에 반영
```

## 장소 두 가지 타입 (목차 고정)

- **명소** (spot): 한눈에 · 어떤 곳인가 · 가이드 이야기 · 꼭 볼 것·할 것 · 사진 스팟 · 가는 법·동선 · 입장·예약 · 주의할 점 · 플랜 B · 출처
- **가게** (shop — 식당·카페·마사지·먹자골목): 한눈에 · 어떤 집인가(좋다는 점/아쉽다는 점) · 대표 메뉴·코스 · 우리 추천 주문 · 주문·결제 · 웨이팅·자리 팁 · 주의할 점 · 플랜 B · 출처

## 중국어 이름 복사

모든 장소의 `cn`(현지어 이름)은 화면에서 눌러 복사된다. 목록 카드 아래·상세 머리·메뉴 행이 같은 버튼(`.cc` + `data-copy`)을 쓰고, `navigator.clipboard` 가 막힌 브라우저에선 `textarea` + `execCommand('copy')` 로 떨어진다. 그래서 `cn` 에는 **지도·디디에 그대로 붙여넣을 이름만** 넣는다(‘근처’·설명 붙이지 않기).

## 이야기 탭 (선택)

`data.js` 에 `STORY = {label, small, html}` 을 두면 마지막 탭이 하나 늘어난다. `html` 안에서 `data-jump="id"` 로 목차를 만들면 그 `id` 섹션으로 스크롤된다. 없는 `id` 는 `check.js` 가 잡는다. `STORY` 가 없으면 탭도 생기지 않는다.

## 기념품 탭 (선택)

`data.js` 에 `SHOPPING = {label, small, title, lead, warn, filters, tags, gifts, stores, tips, carry, src}` 을 두면 공통 탭 뒤에 한 탭이 늘어난다. `gifts[]` 는 `{name, cn, price, krw, tags, why, where, note, warn}` 이고 `tags` 값은 `tags` 객체의 키(`work`/`friend`/`family`)를 쓴다. 화면 위 필터 버튼이 `tags` 로 카드를 거르고, 카드의 `cn` 은 다른 곳과 같은 복사 버튼으로 떨어진다. `stores[]` 는 `{name, cn, kind, addr, why, best, goto}` — `cn` 으로 고덕지도 검색 링크가 붙고, `goto` 에 장소 id 를 넣으면 그 장소 상세로 가는 버튼도 붙는다. `check.js` 가 빈 칸·모르는 태그를 잡는다.

## 카페·가게 탭 (선택)

`data.js` 에 `CAFES = {label, small, title, lead, note, countNote, areas, tags, filters, shops}` 을 두면 기념품 탭 뒤에 한 탭이 늘어난다. `shops[]` 는 `{id, name, cn, area, tags, badge, price, krw, hours, where, one, menu[[이름,가격]], tip, photos[[이미지키,캡션]], src[[이름,url]]}` 이고, `area` 는 `areas` 의 키, `tags` 값은 `tags` 객체의 키(`cafe`/`dessert`/`snack`/`shop`)를 쓴다. 화면 위에 **구역**과 **성격** 두 줄 필터가 있고, 카드의 사진은 가로로 넘겨 본다(캡션은 사진마다). `badge` 는 `ok`(영업 확인)·`wait`(웨이팅)·`cand`(현장 확인)만 쓴다. `check.js` 가 빈 칸·모르는 구역/태그·사진 2장 미만·빈 캡션을 잡는다.

사진은 매장 실사를 구할 수 없을 때 같은 거리·골목과 대표 메뉴 사진으로 대신하고, **캡션에 무엇을 찍은 사진인지 그대로 적는다**(예: “대표 메뉴 — 마화(메뉴 자료 사진)”). 매장 실제 사진은 카드의 고덕지도 검색 링크로 넘긴다.

## 지키는 것

- **공개 저장소다.** 이름·연락처·계정 ID·일정 시트 원본 링크를 넣지 않는다 (`build.py` 가 시트 링크를 막는다). 모든 페이지는 `noindex`.
- 일정·가격·예약 상태는 시트가 기준. 가이드는 시트를 옮겨 적고, 설명·메뉴·팁만 더한다.
- 사진은 라이선스가 있는 것만 (Commons), 출처를 페이지 아래에 남긴다.
- 카페·가게 카드의 사진 캡션은 사실대로. 매장 사진이 아닌 것을 매장 사진처럼 적지 않는다.
