# Weather Axios

Vue 3로 만든 지역별 날씨 앱입니다. 이전 단계에서 만든 컴포넌트 분리, Vue Router, Pinia 구조를 유지하면서, Mock Data 대신 **OpenWeather API의 실시간 날씨 데이터**를 Axios로 불러오도록 바꿨습니다.

초기 화면에는 서울·수원·부산·제주·대전·광주의 날씨가 표시됩니다. 도시를 검색하면 OpenWeather Geocoding API로 국내 도시를 찾고, 카드의 상세보기에서 해당 도시의 상세 날씨를 확인할 수 있습니다.

<img src="/screenshot/main.png" width="500" alt="섭씨로 표시된 날씨 목록 화면">

<img src="/screenshot/Fahrenheit.png" width="500" alt="화씨로 표시된 날씨 목록 화면">

## 시작하기

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. OpenWeather API 키 설정

[OpenWeather](https://openweathermap.org/api)에서 API 키를 발급받은 뒤, 프로젝트 최상위에 \`.env.local\` 파일을 만들고 다음 값을 넣습니다.

\`\`\`env
VITE_OPENWEATHER_API_KEY=발급받은_API_키
\`\`\`

Vite에서는 클라이언트 코드에서 사용할 환경 변수 이름이 \`VITE_\`로 시작해야 합니다. API 키는 저장소에 올리지 않도록 \`.env.local\`을 사용합니다.

### 3. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

프로덕션 번들은 다음 명령으로 만들 수 있습니다.

\`\`\`bash
npm run build
\`\`\`

## 구현 내용

### Axios로 OpenWeather API 호출

\`src/services/weather.js\`에 Axios 인스턴스를 만들고, API 요청과 응답 변환 코드를 화면 컴포넌트 밖으로 분리했습니다. 화면은 \`getWeatherList\`, \`getWeatherForCity\`, \`searchCities\` 함수만 호출하므로 HTTP 요청 세부 사항을 알 필요가 없습니다.

\`\`\`js
const weatherApi = axios.create({
  baseURL: "https://api.openweathermap.org/data/2.5",
  timeout: 10_000,
});
\`\`\`

- 초기 목록: 도시별 위도·경도로 \`/weather\`를 호출합니다.
- 도시 검색: \`/geo/1.0/direct\`에서 국내 도시 후보를 찾은 뒤 각 도시의 현재 날씨를 요청합니다.
- 요청값: \`units=metric\`으로 섭씨 기준 데이터를 받고, \`lang=kr\`로 날씨 설명을 한국어로 받습니다.
- 화면 데이터: API 응답을 카드에서 쓰기 쉬운 \`id\`, \`name\`, \`temp\`, \`status\`, \`humidity\`, \`wind\`, \`icon\`, \`note\` 형태로 변환합니다.

API 응답의 날씨 코드에 따라 ☀️, ☁️, 🌧️, ❄️ 등의 아이콘과 상황별 안내 문구도 함께 만듭니다. 따라서 UI 컴포넌트가 OpenWeather 응답 구조에 직접 의존하지 않습니다.

### 로딩과 오류 상태

\`WeatherParent.vue\`는 화면을 열 때 \`onMounted\`에서 날씨 목록을 비동기로 불러옵니다. 요청 중에는 로딩 안내를 표시하고, 실패하면 오류 메시지와 재시도 버튼을 보여 줍니다. 상세 화면도 같은 방식으로 현재 도시의 날씨를 요청합니다.

서비스 레이어에서는 다음과 같이 사용자가 이해하기 쉬운 오류로 변환합니다.

- API 키가 없거나 잘못된 경우: API 키 확인 안내
- 요청 한도 초과(429): 잠시 후 재시도 안내
- 그 밖의 요청 실패: API 메시지 또는 일반적인 로딩 실패 안내

### URL을 기준으로 한 상세 화면

상세 페이지의 주소는 \`/weather/:cityId\`입니다. 기본 도시의 ID는 서비스 레이어에 정의해 두었고, 검색 결과는 도시 이름·위도·경도를 query string으로 함께 전달합니다. 상세 화면은 주소를 기준으로 다시 API를 호출하므로 새로고침하거나 URL을 공유해도 같은 도시를 표시할 수 있습니다.

\`\`\`js
router.push({
  name: "weather-detail",
  params: { cityId: city.id },
  query: { name: city.name, lat: city.lat, lon: city.lon },
});
\`\`\`

\`watch\`로 \`cityId\` 변화를 감지해, 상세 화면에서 다른 도시 URL로 이동해도 날씨를 다시 불러옵니다.

### Pinia로 공유 상태 관리

온도 단위와 즐겨찾기 목록은 여러 화면에서 사용하므로 Pinia store로 관리합니다.

- \`configStore\`: 섭씨/화씨 단위와 표시 기호를 관리합니다.
- \`favoriteStore\`: 즐겨찾기 도시 ID, 개수, 추가·해제 동작을 관리합니다.

원본 날씨 데이터는 섭씨로 유지하고 화면에 표시할 때만 화씨로 변환합니다. 상단의 단위 버튼을 누르면 목록과 상세 화면의 온도가 함께 갱신됩니다.

\`\`\`js
const temperature =
  configStore.unit === "celsius"
    ? celsius
    : Math.round((celsius * 9) / 5 + 32);
\`\`\`

## 프로젝트 구조

\`\`\`text
src/
├── components/
│   ├── exercise/          # 검색창, 날씨 카드, 공통 카드 UI
│   ├── UnitToggler.vue    # 전역 온도 단위 변경 버튼
│   └── WeatherParent.vue  # 목록 조회와 화면 상태 관리
├── router/index.js        # 페이지 경로 정의
├── services/weather.js    # Axios 요청, 응답 변환, 오류 처리
├── stores/                # Pinia 전역 상태
└── views/                 # 홈, 상세, 소개, 404 페이지
\`\`\`

## 사용 기술

- Vue 3 / Composition API
- Vue Router
- Pinia
- Axios
- OpenWeather Current Weather API, Geocoding API
- Vite

## 트러블 슈팅

### Mock Data와 API 응답을 화면에 바로 연결하지 않은 이유

Mock Data는 필요한 속성을 원하는 이름으로 직접 정할 수 있었지만, API 응답은 \`main.temp\`, \`weather[0].description\`, \`wind.speed\`처럼 중첩된 구조입니다. 이 구조를 컴포넌트에서 바로 사용하면 API를 변경하거나 누락 데이터를 처리할 때 여러 화면을 수정해야 합니다.

그래서 \`toWeatherCity\`에서 응답을 앱에서 사용할 도시 객체로 한 번 변환했습니다. 카드와 상세 화면은 같은 형태의 데이터를 받으므로, API 호출 위치가 달라도 UI 코드는 단순하게 유지됩니다.

### API 키를 코드에 직접 넣지 않은 이유

API 키를 서비스 파일에 직접 작성하면 공개 저장소에 키가 노출될 수 있습니다. \`import.meta.env.VITE_OPENWEATHER_API_KEY\`로 환경 변수에서만 읽도록 하고, 키가 없으면 요청 전에 명확한 안내 오류를 발생시키도록 했습니다.

### 비동기 요청 중 빈 화면이 보이는 문제

API 요청은 즉시 끝나지 않기 때문에 목록을 처음 렌더링할 때 데이터 배열이 비어 있습니다. 빈 배열을 “검색 결과 없음”으로 처리하면 사용자는 요청이 진행 중인지 알 수 없습니다. \`isLoading\`과 \`errorMessage\` 상태를 분리해 로딩, 성공, 실패를 각각 다른 화면으로 보여 주도록 했습니다.

## AI를 사용한 부분

- Axios 인스턴스와 OpenWeather 요청 파라미터 구성을 점검했습니다.
- API 응답을 화면용 데이터로 변환하는 구조와 오류 상태 분리 방식을 확인했습니다.
- 환경 변수로 API 키를 관리하는 Vite 방식과 구현 후 production build를 확인했습니다.
