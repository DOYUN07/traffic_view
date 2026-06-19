// config.example.js — 실시간 신호 연동용 설정 템플릿
//
// 사용법:
//   1) 이 파일을 같은 폴더에 config.local.js 로 복사합니다.
//   2) 아래 값에 공공데이터포털(data.go.kr)에서 발급받은 본인 인증키를 넣습니다.
//   3) traffic_view.html 을 브라우저로 엽니다.
//
// config.local.js 는 .gitignore 에 등록돼 있어 커밋되지 않습니다.
// 아무 키도 넣지 않으면 앱은 자동으로 시뮬레이션 모드로 동작합니다.

// (1) 공공데이터포털(data.go.kr) 실시간 보행신호 인증키
window.SIGNAL_API_KEY = "여기에-발급받은-신호-API-키를-넣으세요";

// (2) 카카오 지도 JavaScript 키 — 넣으면 실제 지도 + 실제 GPS 로 동작.
//     없으면 SVG 시뮬레이션 지도로 폴백합니다.
//     developers.kakao.com → 내 애플리케이션 → JavaScript 키.
//     ※ "플랫폼 > Web" 에 사이트 도메인 등록 필수 (로컬은 http://localhost).
window.KAKAO_MAP_KEY = "여기에-카카오-JavaScript-키를-넣으세요";

// (3) [Phase 2 예정] TMap 보행자경로 앱키 — 실제 도보 경로 연동용.
// window.TMAP_APP_KEY = "여기에-TMap-앱키를-넣으세요";
