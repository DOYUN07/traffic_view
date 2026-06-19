/* sw.js — TrafficView 서비스워커 (PWA 오프라인 캐시)
 *
 * 전략: network-first + 캐시 폴백.
 *   - 온라인: 항상 최신 네트워크 응답을 쓰고, 사본을 캐시에 갱신.
 *   - 오프라인: 네트워크 실패 시 캐시된 사본으로 폴백.
 *   → 개발 중 stale 캐시 문제 없이, 오프라인 내성만 확보.
 *
 * 주의: 서비스워커는 HTTPS 또는 localhost 에서만 등록됩니다(file:// 미지원).
 *       실제 동작은 배포(#5) 환경에서 확인하세요.
 */
const CACHE = "trafficview-v1";

// 설치 시 미리 캐시할 앱 셸(동일 출처 파일)
const APP_SHELL = [
  "./traffic_view.html",
  "./data.jsx",
  "./signal_api.jsx",
  "./map.jsx",
  "./kakao_map.jsx",
  "./app.jsx",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  e.respondWith(
    fetch(request)
      .then((res) => {
        // 정상 응답이면 캐시 갱신(동일 출처/CORS 가능 응답만)
        if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("./traffic_view.html")))
  );
});
