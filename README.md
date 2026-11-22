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
  data.js        PLACES · DAYS · COMMON(공통 탭) · PHRASES · METRO(선택)
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

## 지키는 것

- **공개 저장소다.** 이름·연락처·계정 ID·일정 시트 원본 링크를 넣지 않는다 (`build.py` 가 시트 링크를 막는다). 모든 페이지는 `noindex`.
- 일정·가격·예약 상태는 시트가 기준. 가이드는 시트를 옮겨 적고, 설명·메뉴·팁만 더한다.
- 사진은 라이선스가 있는 것만 (Commons), 출처를 페이지 아래에 남긴다.
