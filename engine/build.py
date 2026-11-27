"""여행 폴더(trips/<slug>) → 사진이 내장된 단일 HTML (<slug>/index.html).

    python3 -I engine/build.py trips/chongqing-2026            # → chongqing-2026/index.html
    python3 -I engine/build.py trips/chongqing-2026 out.html   # 다른 곳에 쓰기

여행 폴더에 있어야 하는 것: trip.json · data.js · credits.json · img/*.jpg
중국어가 있으면 pron.json(한글 발음 표)도 — node tools/pron.js trips/<slug> 로 만든다
"""
import base64
import html
import json
import re
import sys
from pathlib import Path

ENGINE = Path(__file__).parent
REPO = ENGINE.parent
TRIP_KEYS = ("slug", "title", "headline", "eyebrow", "cover_alt", "footer", "tz", "map_label", "map_search")
HAN_RUN = re.compile(r"[\u3400-\u9fff]+")
NOINDEX = '<meta name="robots" content="noindex, nofollow">'


def load_trip(trip_dir: Path) -> dict:
    trip = json.loads((trip_dir / "trip.json").read_text(encoding="utf-8"))
    missing = [k for k in TRIP_KEYS if not trip.get(k)]
    if missing:
        sys.exit(f"{trip_dir}/trip.json 에 빠진 값: {', '.join(missing)}")
    return trip


def load_pron(trip_dir: Path, data: str) -> dict:
    """data.js 의 한자 덩어리가 모두 pron.json 에 있어야 한다 (없으면 발음이 빈칸으로 나간다)."""
    runs = set(HAN_RUN.findall(data))
    pron_file = trip_dir / "pron.json"
    pron = json.loads(pron_file.read_text(encoding="utf-8")) if pron_file.exists() else {}
    missing = sorted(runs - pron.keys())
    if missing:
        sys.exit(f"pron.json 에 없는 한자 {len(missing)}개 (예: {', '.join(missing[:5])}). "
                 f"node tools/pron.js {trip_dir.relative_to(REPO) if trip_dir.is_relative_to(REPO) else trip_dir} 로 다시 만들어요")
    return {k: pron[k] for k in sorted(runs)}


def build(trip_dir: Path, out_path: Path) -> None:
    trip = load_trip(trip_dir)
    template = (ENGINE / "template.html").read_text(encoding="utf-8")
    data = (trip_dir / "data.js").read_text(encoding="utf-8")
    if "docs.google.com/spreadsheets" in data:
        sys.exit("data.js 에 구글 시트 링크가 있어요. 공개 저장소라 빼고 빌드해요 (SHEET 의 url 을 \"\" 로)")
    pron = load_pron(trip_dir, data)
    credits_file = trip_dir / "credits.json"
    credits = json.loads(credits_file.read_text(encoding="utf-8")) if credits_file.exists() else {}
    images = {
        p.stem: "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode()
        for p in sorted((trip_dir / "img").glob("*.jpg"))
    }
    used = {k: v for k, v in credits.items() if k in images}

    for marker in ("/*DATA*/", "/*TRIP*/", "/*IMAGES*/", "/*CREDITS*/", "/*PRON*/"):
        if marker not in template:
            sys.exit(f"template 에 {marker} 자리가 없어요")
    page = template
    for key in TRIP_KEYS:
        page = page.replace("{{" + key + "}}", html.escape(trip[key]))
    page = (page.replace("<head>", "<head>\n" + NOINDEX, 1)
                .replace("/*DATA*/", data)
                .replace("/*TRIP*/", json.dumps({k: trip[k] for k in TRIP_KEYS}, ensure_ascii=False))
                .replace("/*IMAGES*/", json.dumps(images))
                .replace("/*CREDITS*/", json.dumps(used, ensure_ascii=False))
                .replace("/*PRON*/", json.dumps(pron, ensure_ascii=False)))
    if "{{" in page.split("<script>")[0]:
        sys.exit("채워지지 않은 {{자리}} 가 남았어요")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(page, encoding="utf-8")
    print(f"{out_path}: {len(page) / 1024:.0f}KB, 사진 {len(images)}장")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    trip_dir = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else REPO / trip_dir.name / "index.html"
    build(trip_dir, out)
