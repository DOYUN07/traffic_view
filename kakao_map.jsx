/* kakao_map.jsx — 실제 카카오 지도 + 실제 GPS 레이어 (Phase 1)
 *
 * window.KAKAO_MAP_KEY (config.local.js) 가 있을 때만 app.jsx 가 이 컴포넌트를 렌더합니다.
 * 키가 없으면 기존 map.jsx 의 CityMap(SVG 시뮬레이션)으로 자동 폴백합니다.
 *
 * 표시 요소:
 *   - 경로 폴리라인 (NODES 의 geo 좌표)
 *   - 신호등 마커 (signalsState 색/잔여초 반영, 탭하면 onSignalTap)
 *   - 시뮬레이션 보행자 마커 (userDist → latLngAtDist)
 *   - 실제 내 위치 마커 (userGeo, 브라우저 GPS)
 *
 * Phase 2 에서 NODES 를 TMap 보행자경로 응답으로 교체하면 그대로 실경로가 그려집니다.
 */

// 카카오 지도 SDK 동적 로더 (autoload=false → kakao.maps.load 콜백에서 resolve)
function loadKakaoSdk(appKey) {
  if (window.__kakaoSdkPromise) return window.__kakaoSdkPromise;
  window.__kakaoSdkPromise = new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) return resolve(window.kakao);
    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    s.async = true;
    s.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    s.onerror = () => reject(new Error("Kakao SDK 로드 실패 (앱키·도메인 등록 확인)"));
    document.head.appendChild(s);
  });
  return window.__kakaoSdkPromise;
}

// 신호등 마커 DOM (색 원 + 잔여초). recolor 로 상태만 갱신.
function makeSignalEl(onTap) {
  const el = document.createElement("div");
  el.style.cssText =
    "min-width:30px;height:24px;padding:0 7px;border-radius:999px;" +
    "display:flex;align-items:center;justify-content:center;gap:3px;font:700 12px/1 Pretendard,system-ui,sans-serif;" +
    "color:#fff;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer;user-select:none;";
  if (onTap) el.onclick = onTap;
  return el;
}
function recolorSignalEl(el, st) {
  if (!st) return;
  el.style.background = st.color === "green" ? "#1FA463" : "#E5484D";
  el.textContent = `${Math.round(st.remain)}`;
}

function KakaoMap({ userDist, signalsState, mode, onSignalTap, activeSignalId, dark, a11y, userGeo }) {
  const boxRef = React.useRef(null);
  const kakaoRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const sigRef = React.useRef({});      // { [id]: {overlay, el} }
  const walkerRef = React.useRef(null); // 시뮬레이션 보행자 overlay
  const gpsRef = React.useRef(null);    // 실제 GPS overlay
  const [status, setStatus] = React.useState("loading"); // loading | ready | error
  const [errMsg, setErrMsg] = React.useState("");

  // ----- 초기화 (마운트 시 1회) -----
  React.useEffect(() => {
    let cancelled = false;
    const key = window.KAKAO_MAP_KEY;
    if (!key) { setStatus("error"); setErrMsg("KAKAO_MAP_KEY 없음"); return; }

    loadKakaoSdk(key).then((kakao) => {
      if (cancelled || !boxRef.current) return;
      kakaoRef.current = kakao;
      const mid = latLngAtDist(TOTAL_DIST / 2);
      const map = new kakao.maps.Map(boxRef.current, {
        center: new kakao.maps.LatLng(mid.lat, mid.lng),
        level: 4,
      });
      mapRef.current = map;

      // 경로 폴리라인
      new kakao.maps.Polyline({
        map,
        path: NODES.map((n) => new kakao.maps.LatLng(n.geo.lat, n.geo.lng)),
        strokeWeight: 6,
        strokeColor: dark ? "#E7E9EE" : "#2B2B30",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });

      // 경로 전체가 보이도록 bounds 맞춤
      const bounds = new kakao.maps.LatLngBounds();
      NODES.forEach((n) => bounds.extend(new kakao.maps.LatLng(n.geo.lat, n.geo.lng)));
      map.setBounds(bounds);

      // 신호등 마커
      SIGNALS.forEach((s) => {
        const p = latLngAtDist(s.d);
        const el = makeSignalEl(() => onSignalTap && onSignalTap(s.id));
        recolorSignalEl(el, signalsState[s.id]);
        const overlay = new kakao.maps.CustomOverlay({
          map, position: new kakao.maps.LatLng(p.lat, p.lng), content: el, yAnchor: 0.5, xAnchor: 0.5, zIndex: 5,
        });
        sigRef.current[s.id] = { overlay, el };
      });

      // 시뮬레이션 보행자 마커 (파란 점)
      const wEl = document.createElement("div");
      wEl.style.cssText =
        "width:18px;height:18px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 3px rgba(37,99,235,.3);";
      const wp = latLngAtDist(userDist || 0);
      walkerRef.current = new kakao.maps.CustomOverlay({
        map, position: new kakao.maps.LatLng(wp.lat, wp.lng), content: wEl, yAnchor: 0.5, xAnchor: 0.5, zIndex: 8,
      });

      if (!cancelled) setStatus("ready");
    }).catch((e) => {
      if (cancelled) return;
      setStatus("error"); setErrMsg(e.message || "지도 로드 실패");
    });

    return () => { cancelled = true; };
  }, []);

  // ----- 신호 상태 갱신 -----
  React.useEffect(() => {
    if (status !== "ready") return;
    SIGNALS.forEach((s) => {
      const ref = sigRef.current[s.id];
      if (ref) recolorSignalEl(ref.el, signalsState[s.id]);
    });
  }, [signalsState, status]);

  // ----- 시뮬레이션 보행자 위치 갱신 -----
  React.useEffect(() => {
    if (status !== "ready" || !walkerRef.current || !kakaoRef.current) return;
    const p = latLngAtDist(userDist || 0);
    walkerRef.current.setPosition(new kakaoRef.current.maps.LatLng(p.lat, p.lng));
  }, [userDist, status]);

  // ----- 실제 GPS 위치 마커 -----
  React.useEffect(() => {
    if (status !== "ready" || !kakaoRef.current || !userGeo) return;
    const kakao = kakaoRef.current, map = mapRef.current;
    const pos = new kakao.maps.LatLng(userGeo.lat, userGeo.lng);
    if (!gpsRef.current) {
      const el = document.createElement("div");
      el.title = "내 실제 위치";
      el.style.cssText =
        "width:16px;height:16px;border-radius:50%;background:#1FA463;border:3px solid #fff;box-shadow:0 0 0 4px rgba(31,164,99,.25);";
      gpsRef.current = new kakao.maps.CustomOverlay({
        map, position: pos, content: el, yAnchor: 0.5, xAnchor: 0.5, zIndex: 9,
      });
    } else {
      gpsRef.current.setPosition(pos);
    }
  }, [userGeo, status]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={boxRef} style={{ position: "absolute", inset: 0, background: dark ? "#0E0F13" : "#E8EAED" }} />
      {status === "error" && (
        <div style={{
          position: "absolute", left: 12, bottom: 12, right: 12, padding: "10px 14px", borderRadius: 12,
          background: "rgba(229,72,77,.95)", color: "#fff", fontSize: 12.5, fontWeight: 600, lineHeight: 1.4,
        }}>
          지도를 불러오지 못했어요 ({errMsg}). 시뮬레이션 화면으로 보고 있어요.
        </div>
      )}
    </div>
  );
}

window.KakaoMap = KakaoMap;
