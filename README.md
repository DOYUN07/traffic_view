# 신호등 길찾기 · TrafficView

보행자가 횡단보도 신호에 맞춰 최적의 걸음 속도로 이동할 수 있도록 안내하는 모바일 웹 앱입니다.
다음 초록불 타이밍을 계산해 "지금 속도를 유지하세요 / 조금 빠르게 / 천천히"를 실시간으로 안내합니다.

## 팀원

- 이도윤
- 박은규
- 김민석

## 실행 방법

빌드 도구 없이 브라우저에서 바로 실행됩니다. (Babel Standalone이 JSX를 런타임 트랜스파일)

```bash
# traffic_view.html 을 브라우저로 열기
start traffic_view.html
```

API 키 없이도 **시뮬레이션 모드**로 바로 동작합니다.

## 실시간 신호 연동 설정 (선택)

서울시 실시간 보행신호와 연동하려면 공공데이터포털 인증키가 필요합니다.

1. [공공데이터포털](https://www.data.go.kr)에서 신호정보 API 인증키를 발급받습니다.
2. `config.example.js` 를 같은 폴더에 `config.local.js` 로 복사합니다.
3. `config.local.js` 안의 `window.SIGNAL_API_KEY` 값에 발급받은 키를 넣습니다.
4. (CORS 우회용) `proxy/cloudflare-worker.js` 를 Cloudflare Worker로 배포하고, 주소를 `signal_api.jsx` 의 `PROXY` 에 설정합니다.

> `config.local.js` 는 `.gitignore`에 등록돼 있어 키가 커밋되지 않습니다.

## 파일 구성

| 파일 | 역할 |
|------|------|
| `traffic_view.html` | 진입점, React·Babel 로드 및 스크립트 연결 |
| `data.jsx` | 경로 노드(NODES), 신호등 데이터(SIGNALS), 타이밍·속도 추천 로직 |
| `signal_api.jsx` | 공공데이터포털 실시간 보행신호 API 연동 (`SignalAPI.fetchOnce`) |
| `map.jsx` | SVG 도시 지도 컴포넌트 (`CityMap`) |
| `app.jsx` | 앱 셸, 화면 전환, 설정(다크/접근성/음성 안내) |
| `proxy/cloudflare-worker.js` | CORS 우회용 Cloudflare Worker 프록시 |

## 주요 기능

- **속도 추천**: 다음 초록불 창에 맞춰 보행 속도(0.7~1.95 m/s) 계산
- **실시간 신호 연동**: 서울 보행신호 API 5초 폴링, 실패 시 시뮬레이션 모드 자동 전환
- **접근성**: 다크 모드, 고대비(A11y) 모드, 음성 안내(Web Speech API), 진동 피드백
