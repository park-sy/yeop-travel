/* 오프라인용 서비스 워커 — build.py 가 <slug>/sw.js 로 복사한다 (버전은 빌드마다 바뀜).

   페이지(index.html)는 사진까지 들어 있는 파일 하나라, 그 한 장만 저장해 두면 비행기 모드에서도 열린다.
   - 페이지: 저장본을 바로 보여주고 뒤에서 새 버전을 받아 둔다 (다음에 열 때 반영)
     현지 데이터가 느려도 바로 뜨는 쪽을 골랐다
   - 구글 폰트: 한 번 받은 글꼴 파일은 저장본 사용 (없으면 기본 글꼴로 보임)
   - 나머지(고덕지도 등 바깥 링크)는 건드리지 않는다 */
const VERSION = "69484ed6cd21";
const CACHE = "trip-chongqing-2026-" + VERSION;
const FONTS = "trip-fonts";
const SHELL = ["./", "manifest.webmanifest", "icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("trip-chongqing-2026-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const isPage = req => req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin && isPage(req)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const saved = await c.match("./");
      const fresh = fetch(req, {cache: "no-cache"})
        .then(r => { if (r.ok) c.put("./", r.clone()); return r; })
        .catch(() => null);
      if (saved) { e.waitUntil(fresh); return saved; }
      return (await fresh) || new Response("오프라인이에요. 인터넷이 될 때 한 번 열어 두면 다음부터 오프라인에서도 열려요.",
        {status: 503, headers: {"Content-Type": "text/plain; charset=utf-8"}});
    }));
    return;
  }

  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(r => r || fetch(req)));
    return;
  }

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(async c => {
      const saved = await c.match(req);
      if (saved) return saved;
      try { const r = await fetch(req); if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }
      catch (err) { return new Response("", {status: 504}); }
    }));
  }
});
