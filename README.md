# Weather UI Library

Vue 3로 만든 지역별 날씨 앱입니다. 브랜치별 학습 과정을 누적해, 현재는 OpenWeather의 실시간 관측과 기상청 단기예보를 한 화면에서 확인할 수 있습니다.

기본 목록에는 서울·수원·부산·제주·대전·광주의 현재 날씨가 표시됩니다. 도시 검색 후 상세 화면으로 이동하면 현재 기온·습도·풍속과 함께 기상청의 다음 예보 시각 기준 기온, 하늘 상태, 강수 형태·확률, 강수량, 적설을 확인할 수 있습니다.

## 브랜치별 구현 과정

| 브랜치 | 핵심 구현 |
| --- | --- |
| `1-weather-mockup` | Vue 디렉티브와 이벤트로 날씨 카드, 검색 입력, 상세 영역을 구현했습니다. |
| `2-weather-composition` | Composition API의 `ref`, `computed`, `watch`로 검색·즐겨찾기·온도 단위를 반응형으로 관리했습니다. |
| `3-weather-component` | 검색창, 날씨 카드, 공통 대시보드 카드를 컴포넌트로 분리하고 props, emits, slot을 적용했습니다. |
| `4-weather-router` | Vue Router와 lazy loading으로 목록·상세·소개·404 페이지 및 URL 기반 상세 보기를 만들었습니다. |
| `5-weather-store` | Pinia로 온도 단위와 즐겨찾기 상태를 전역 관리했습니다. |
| `6-weather-axios` | Mock Data를 OpenWeather Current Weather·Geocoding API의 실시간 데이터로 교체했습니다. |
| `7-weather-ui-library` | 기상청 API 허브 단기예보를 상세 화면에 더해, 현재 관측 외의 예보 정보를 제공합니다. |

## 시작하기

```bash
npm install
npm run dev
```

프로젝트 최상위에 `.env.local`을 만들고 `.env.example`을 참고해 키를 설정합니다.

```env
VITE_OPENWEATHER_API_KEY=OpenWeather_API_키
VITE_KMA_AUTH_KEY=기상청_API_허브_인증키
```

- `VITE_OPENWEATHER_API_KEY`: [OpenWeather](https://openweathermap.org/api)의 API 키입니다.
- `VITE_KMA_AUTH_KEY`: [기상청 API 허브 단기예보](https://apihub.kma.go.kr/apiList.do?seqApi=10)의 `authKey`입니다. `getVilageFcst` 사용을 신청한 뒤 발급받습니다.

Vite에서 브라우저 코드가 읽는 환경 변수는 반드시 `VITE_`로 시작해야 합니다. 기존에 `KMA_API_KEY`로 저장했다면 `VITE_KMA_AUTH_KEY`로 이름을 바꿔 주세요. `.env.local`은 Git에 포함하지 않습니다.

> 이 프로젝트는 브라우저에서 API를 호출하는 학습용 앱입니다. 배포 환경에서는 API 키 보호와 요청 제어를 위해 서버 또는 서버리스 프록시를 권장합니다.

프로덕션 번들은 다음 명령으로 확인합니다.

```bash
npm run build
```

## 주요 기능

### 실시간 날씨와 국내 도시 검색

`src/services/weather.js`의 Axios 서비스 레이어가 OpenWeather API 응답을 화면용 데이터로 변환합니다.

- 초기 지역별 목록: 위도·경도 기반 현재 날씨 조회
- 검색: Geocoding API로 국내 도시를 찾은 뒤 현재 날씨 조회
- 표시 단위: 섭씨 원본을 유지하고, Pinia 설정에 따라 화씨로 변환
- 오류 처리: API 키 오류, 요청 한도 초과, 일반 요청 실패를 사용자 안내 문구로 변환

### 기상청 단기예보 상세 정보

상세 페이지는 현재 날씨와 기상청 단기예보를 병렬로 요청합니다. 위도·경도를 기상청 격자 좌표(`nx`, `ny`)로 변환하고, 한국 표준시 기준으로 이미 발표된 가장 최근 예보 발표 시각을 자동으로 선택합니다.

기상청 응답 중 다음 예보 시각의 항목을 골라 표시합니다.

- 예보 기온 (`TMP`)
- 하늘 상태 (`SKY`)와 강수 형태 (`PTY`)
- 강수 확률 (`POP`), 1시간 강수량 (`PCP`), 적설 (`SNO`)
- 습도 (`REH`), 풍속 (`WSD`)

기상청 API 키가 없거나 해당 요청만 실패한 경우에는 상세 화면에 안내를 표시하고 OpenWeather 현재 날씨는 그대로 유지합니다.

### URL 기반 상세 페이지

상세 주소는 `/weather/:cityId`입니다. 검색 결과는 도시명·위도·경도를 query string으로 함께 전달하므로, 새로고침하거나 주소를 공유해도 같은 위치의 데이터를 다시 조회합니다.

## 프로젝트 구조

```text
src/
├── components/
│   ├── exercise/          # 검색창, 날씨 카드, 공통 카드 UI
│   ├── UnitToggler.vue    # 온도 단위 변경 버튼
│   └── WeatherParent.vue  # 목록 조회와 화면 상태 관리
├── router/index.js        # 페이지 경로 정의
├── services/weather.js    # OpenWeather·기상청 API 요청과 응답 변환
├── stores/                # Pinia 전역 상태
└── views/                 # 홈, 상세, 소개, 404 페이지
```

## 사용 기술

- Vue 3 / Composition API
- Vue Router
- Pinia
- Axios
- OpenWeather Current Weather API / Geocoding API
- 기상청 API 허브 단기예보 API (`getVilageFcst`)
- Vite

## 확인 방법

1. `.env.local`에 두 API 키를 설정합니다.
2. 목록에서 도시를 선택해 상세 페이지로 이동합니다.
3. 현재 관측 정보 아래의 **기상청 단기예보** 영역에서 예보 시각과 8개 예보 지표를 확인합니다.
4. `npm run build`로 production build가 성공하는지 확인합니다.

## AI 사용 범위

- 기상청 단기예보 API의 최신 요청 형식과 예보 항목을 확인했습니다.
- 위경도에서 기상청 격자 좌표로 변환하는 공식을 구현에 적용했습니다.
- API 응답을 화면용 데이터로 분리하고, 기상청 예보 실패가 현재 날씨 화면을 막지 않도록 오류 처리를 구성했습니다.
