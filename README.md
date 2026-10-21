<div align="center">

# Outcast — Vue 날씨 실습

![Vue 3](https://img.shields.io/badge/Vue%203-4FC08D?style=flat&logoColor=black&logo=vuedotjs)
![Vite](https://img.shields.io/badge/Vite-9135FF?style=flat&logoColor=white&logo=vite)
![Pinia](https://img.shields.io/badge/Pinia-FFD859?style=flat&logoColor=black&logo=pinia)
![Vue Router](https://img.shields.io/badge/Vue%20Router-4FC08D?style=flat&logoColor=black&logo=vuedotjs)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logoColor=white&logo=axios)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat&logoColor=white&logo=leaflet)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logoColor=white&logo=python)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logoColor=white&logo=vercel)
![기상청 API 허브](https://img.shields.io/badge/%EA%B8%B0%EC%83%81%EC%B2%AD%20API%20%ED%97%88%EB%B8%8C-2B6CB0?style=flat&logoColor=white)
![에어코리아](https://img.shields.io/badge/%EC%97%90%EC%96%B4%EC%BD%94%EB%A6%AC%EC%95%84-1F7A5C?style=flat&logoColor=white)

</div>

SKALA Vue 과정의 날씨 앱 과제를 단계별 브랜치로 쌓아 만든 저장소입니다. 최종 앱 **Outcast**는 지도에서 지역을 고르면 기상청 관측값과 중기예보, 에어코리아 대기질을 보여 주고, 체감온도(UTCI)와 대기질 · 강수로 "지금 밖에 나가도 되는지"를 판단해 줍니다.

`main`에는 이 안내만 있고 앱 코드는 과제 브랜치에 있습니다. 아래 내용은 최종 브랜치 [`9-weather-final`](https://github.com/cres17/skala-vue-weather/tree/9-weather-final) 기준입니다.

| 번호 | 과제 | 브랜치 |
|------|------|--------|
| 1 | Weather Mockup | `1-weather-mockup` |
| 2 | Weather Composition | `2-weather-composition` |
| 3 | Weather Component | `3-weather-component` |
| 4 | Weather Router | `4-weather-router` |
| 5 | Weather Store | `5-weather-store` |
| 6 | Weather Axios | `6-weather-axios` |
| 7 | Weather UI Library | `7-weather-ui-library` |
| 8 | Weather Deployment | `8-weather-deployment` |
| 9 | 최종 프로젝트 | `9-weather-final` |

## 전체 아키텍처

<p align="center">
  <img src="docs/assets/readme/architecture.svg" alt="Outcast 전체 아키텍처" width="100%">
</p>

| 흐름 | 설명 |
|------|------|
| 화면 | Vue 앱이 `/map`의 Leaflet 지도에서 시 · 도와 시군구를 고르고, `/weather/:cityId`에서 현재 날씨 · 주간 예보 · 외출 판단을 보여 줌 |
| API 호출 | 화면은 외부 API를 직접 부르지 않고 axios로 같은 출처의 `/api/*`만 호출. API 키는 서버의 `.env`에서만 읽음 |
| 현재 날씨 | 좌표에서 가장 가까운 기상청 지상관측소를 골라 기온 · 습도 · 풍속 · 강수를 조회 |
| 주간 예보 | 가장 가까운 중기예보 구역의 육상 · 기온 예보를 받아 4~10일 예보로 정리 |
| 외출 판단 | 관측값으로 UTCI를 계산하고, 대기질 등급 · 강수와 묶어 주의 · 위험 사유를 반환 |

## 각 기술 설명

### Vue 3 · Vite · Vue Router

`src/views`에 지도(`WeatherMapView`) · 도시 목록(`WeatherHomeView`) · 상세(`WeatherDetailView`) · 소개 화면이 있고, `src/router/index.js`가 `/map`, `/weather`, `/weather/:cityId`, `/about`과 404 경로를 연결합니다. 개발 서버는 `npm-run-all2`의 `run-p`로 Vite와 Python 서버를 함께 띄웁니다.

### Pinia

`weatherStore`는 도시별 날씨 · 예보 응답을, `configStore`는 섭씨 · 화씨 단위를, `favoriteStore`는 즐겨찾기 도시를 관리합니다.

### Axios

`src/services/weather.js`의 axios 인스턴스(`baseURL: "/api"`)로 현재 날씨 · 예보 · 외출 판단을 요청합니다. 여러 도시의 날씨는 `POST /api/weather` 한 번으로 묶어 받습니다.

### Leaflet · OpenStreetMap

OpenStreetMap 타일 위에 southkorea-maps의 시 · 도 GeoJSON과 시군구 TopoJSON(`topojson-client`로 변환)을 겹쳐 그립니다. 시 · 도를 누르면 해당 시군구 경계로 확대되고, 지역을 고르면 상세 화면으로 이동합니다.

### Python API (`http.server` · Vercel Python Functions)

`server/app.py`는 표준 라이브러리 `ThreadingHTTPServer`로 `/api/weather`, `/api/forecast`, `/api/geocoding`, `/api/outdoor-assessment`를 처리합니다. 외부 API는 `urllib`로 호출하고, 여러 도시 조회는 `ThreadPoolExecutor`(최대 8개)로 병렬 처리합니다. 배포 시에는 `api/*.py`가 같은 함수를 Vercel Python Functions로 감싸고, `vercel.json`이 나머지 경로를 SPA의 `index.html`로 돌립니다. 도시 검색은 외부 지오코딩 없이 서버에 들어 있는 한국 지역 목록에서 찾습니다.

### 기상청 API 허브

현재 날씨는 지상관측 자료(`kma_sfctm2.php`), 주간 예보는 중기예보 구역(`fct_medm_reg.php`) · 육상예보(`fct_afs_wl.php`) · 기온예보(`fct_afs_wc.php`)를 사용합니다. 좌표와 가장 가까운 관측소 · 예보 구역은 서버의 좌표 목록에서 거리로 고릅니다.

### 에어코리아

공공데이터포털의 측정소별 실시간 측정정보(`getMsrstnAcctoRltmMesureDnsty`)로 PM10 · PM2.5를 받아 등급을 매깁니다. 등급 3은 주의, 4 이상은 위험으로 외출 판단에 반영합니다.

### UTCI (`utci` 1.0.0)

최근 관측된 기온 · 습도 · 풍속과 일사량으로 평균복사온도를 추정해 `utci_approx`로 체감온도를 계산합니다. 32°C 초과는 강한 열 스트레스, 38°C 초과는 매우 강한 열 스트레스, -13°C 이하는 강한 한랭 스트레스로 판단합니다. 관측 시각이 오래됐거나 라이브러리를 불러오지 못하면 UTCI 없이 대기질 · 강수만으로 판단합니다.
