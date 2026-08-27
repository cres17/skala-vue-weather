# Weather Components

Vue 3 Composition API로 작성된 지역별 날씨 화면을 역할에 따라 컴포넌트로 나눈 프로젝트입니다. 기존 `2-weather-composition` 브랜치의 검색, 도시 선택, 상세보기 같은 동작은 그대로 두고 컴포넌트 구조를 다시 잡았습니다.

## 요구사항별 구현 내용

### 1. `WeatherParent.vue`에서 모든 반응형 데이터 유지

검색어, 도시 목록, 선택 도시, 온도 단위와 즐겨찾기 ID를 모두 `WeatherParent.vue`의 `ref`로 관리했습니다. 검색 결과, 선택 도시 안내 문구, 가장 따뜻한 도시와 즐겨찾기 목록은 이 값들을 바탕으로 `computed`에서 계산합니다.

상태를 부모에 모아 둔 이유는 여러 자식 컴포넌트가 같은 데이터를 필요로 하기 때문입니다. 예를 들어 검색 결과 개수는 `SearchBar`에 필요하고 실제 검색 결과는 날씨 카드 목록에 필요합니다. 둘 중 한쪽에 상태를 두면 형제 컴포넌트 사이의 전달 과정이 복잡해지므로 공통 부모가 관리하는 방식이 적합했습니다.

### 2. `BaseDashboardCard.vue`로 공통 디자인 통합

검색 박스와 날씨 목록 박스에서 반복되는 surface 디자인을 하나의 컴포넌트로 합쳤습니다. 검색 영역에는 `variant="search"`, 목록 영역에는 `variant="content"`를 전달하여 공통된 분위기는 유지하면서 용도에 맞는 여백과 모서리 값을 적용했습니다.

내부 콘텐츠는 default slot으로 받고, 목록 제목과 하단 안내는 각각 `header`, `footer` slot으로 받습니다. 덕분에 레이아웃 컴포넌트가 검색이나 날씨 데이터에 의존하지 않아도 됩니다.

### 3. `SearchBar.vue`의 props와 emits 통신

부모가 현재 검색어와 결과 개수를 props로 전달하고, `SearchBar`는 이를 입력창과 결과 문구에 표시합니다. 사용자가 값을 입력하거나 초기화 버튼을 누르면 다음 이벤트가 부모로 전달됩니다.

```vue
<SearchBar
  :query="searchQuery"
  :result-count="filteredWeatherList.length"
  :total-count="weatherList.length"
  @update-query="updateSearchQuery"
/>
```

`SearchBar`는 부모 상태를 직접 수정하지 않으므로 다른 데이터 소스와 연결하더라도 컴포넌트 코드를 크게 바꿀 필요가 없습니다.

### 4. `WeatherCard.vue`의 props와 emits 통신

각 카드에는 도시 객체와 화면 표시용 상태를 props로 내려줍니다. 사용자가 카드를 선택하거나 상세보기 버튼을 누르면 해당 도시 객체를 이벤트 인자로 부모에게 전달합니다.

```vue
<WeatherCard
  :city="city"
  :temperature="formatTemperature(city.temp)"
  :favorite="isFavorite(city)"
  :selected="selectedCity?.id === city.id"
  @select-card="selectCity"
  @click-detail="showDetail"
  @toggle-favorite="toggleFavorite"
/>
```

기본 요구사항인 `select-card`, `click-detail` 외에 즐겨찾기 기능도 같은 통신 규칙을 따르도록 `toggle-favorite` 이벤트로 분리했습니다.

### 5. 컴포넌트별 `<style scoped>` 적용

각 컴포넌트의 모양은 해당 `.vue` 파일의 `<style scoped>` 안에서 관리합니다. 검색창을 수정할 때는 `SearchBar.vue`, 카드 디자인을 수정할 때는 `WeatherCard.vue`만 보면 되도록 구성했습니다.

`src/styles.css`에는 글꼴, 색상 변수, box-sizing, body 배경처럼 앱 전체에서 공통으로 사용하는 최소한의 전역 스타일만 남겼습니다. 컴포넌트 스타일이 다른 영역으로 새어 나가는 문제를 줄이면서 공통 디자인 값은 계속 재사용할 수 있습니다.

### 6. slot 배치와 부모 scope 유지

`SearchBar`와 `WeatherCard`는 화면상으로는 `BaseDashboardCard` 내부에 들어가지만, 실제 템플릿은 `WeatherParent.vue`에서 작성합니다. Vue slot 콘텐츠는 콘텐츠를 작성한 부모 scope를 사용하므로 `searchQuery`, `filteredWeatherList`, `selectCity` 같은 부모의 상태와 함수를 바로 바인딩할 수 있습니다.

즉, `BaseDashboardCard`는 **어디에 어떻게 보일지**를 담당하고 `WeatherParent`는 **무슨 데이터를 보여주고 어떤 동작을 할지**를 담당합니다. 이 구분 덕분에 공통 카드가 자식 컴포넌트의 구체적인 기능을 알 필요가 없습니다.

### 7. 추가로 분리하거나 보완한 기능

기본 컴포넌트 분리 외에도 구조를 확인하기 쉽도록 다음 내용을 함께 구현했습니다.

- `header`, `footer` named slot 추가
- 검색 결과가 없을 때 빈 상태 화면 제공
- 섭씨/화씨 전환 기능 유지
- 즐겨찾기 추가·해제와 개수 표시
- 선택된 카드의 시각적 상태와 상태 안내 문구 표시
- 키보드 포커스와 ARIA label을 적용해 기본 접근성 보완
- 화면 폭에 따라 카드 목록이 3열에서 2열, 1열로 변경되는 반응형 레이아웃 적용


## AI를 사용한 부분
- slot 안에 들어간 컴포넌트가 어느 scope의 데이터를 참조하는지 헷갈려서 AI 도움을 받아 Vue의 slot scope 동작을 확인했습니다. 설명을 참고한 뒤 실제 데이터 연결은 `WeatherParent.vue`에서 직접 해 보고 재확인했습니다.
- ESLint 10에서 기존 설정 파일을 읽지 못하는 문제는 오류 메시지만으로 해결이 잘되지 않아 flat config 구성을 찾는 데 도움을 받았습니다. 설정을 추가한 뒤 lint와 build는 직접 다시 실행했습니다.


## 트러블 슈팅

### 자식 컴포넌트에서 검색어를 어떻게 변경할지

처음에는 검색 입력에 `v-model`을 그대로 사용하면 간단해 보였습니다. 하지만 자식이 부모 값을 직접 바꾸는 것처럼 보여 데이터 흐름이 잘 이해되지 않았습니다. `SearchBar`에는 현재 값을 prop으로 내려주고, 입력이 발생할 때 `update-query` 이벤트를 올리도록 바꿨습니다. 실제 `searchQuery` 수정은 부모의 `updateSearchQuery` 함수에서만 일어나게 했습니다.

### slot 안의 컴포넌트가 누구의 데이터를 사용하는지 헷갈린 문제

이 부분이 가장 헷갈렸습니다. `SearchBar`와 `WeatherCard`가 화면에서는 `BaseDashboardCard` 안에 있으니 공통 카드가 데이터를 다시 전달해야 한다고 생각했습니다. AI의 설명과 Vue 문서를 참고해 확인해 보니 slot 콘텐츠는 작성된 위치인 부모 scope를 사용했습니다. 그래서 `WeatherParent`에서 자식 컴포넌트를 slot에 직접 배치하고 props와 emits도 바로 연결했습니다. `BaseDashboardCard`에는 레이아웃 역할만 남겼습니다.

### 상세보기나 즐겨찾기를 눌렀을 때 카드 선택도 함께 실행된 문제

날씨 카드 전체에 클릭 이벤트가 있어 내부 버튼을 누르면 버튼 이벤트가 부모 요소까지 올라갔습니다. 그 결과 즐겨찾기만 바꾸려 해도 카드가 같이 선택됐습니다. 이벤트 버블링 문제라는 것을 확인한 뒤 내부 버튼에 `.stop`을 적용해 상세보기와 즐겨찾기 동작이 카드 선택과 겹치지 않게 했습니다.

### 컴포넌트 분리 후 계산 상태가 서로 어긋날 수 있었던 문제

검색 결과 수, 즐겨찾기 수, 선택된 카드처럼 같은 원본에서 파생되는 값을 각 컴포넌트에 따로 저장하면 한쪽만 갱신될 수 있습니다. 원본 `ref`는 부모에 두고 파생 값은 모두 `computed`로 계산한 뒤 필요한 결과만 자식에 전달했습니다. 덕분에 검색어, 온도 단위 또는 즐겨찾기가 바뀌면 관련 UI가 함께 갱신됩니다.

### 즐겨찾기가 추가되지 않던 오타

기존 로직을 옮기는 과정에서 즐겨찾기 배열 변수 이름에 오타가 있어 추가 동작이 정상적으로 실행되지 않았습니다. 읽기와 쓰기에서 모두 `favoriteCityIds`를 사용하도록 이름을 통일했고, 추가와 해제를 각각 다시 확인했습니다.

### ESLint 실행 시 설정 파일을 찾지 못한 문제

프로젝트에는 ESLint 10이 설치되어 있었지만 flat config 파일이 없어 검사 명령이 바로 중단됐습니다. 이 부분은 익숙하지 않아 오류 원인과 설정 예시를 AI로 확인했습니다. 그다음 프로젝트의 Vue 파일을 검사할 수 있도록 `eslint.config.js`를 추가하고 Vue 권장 규칙과 Prettier 충돌 방지 설정을 연결했습니다. 설정만 추가하고 끝내지 않고 lint와 production build를 다시 실행해 통과 여부를 확인했습니다.

### 모바일 화면에서 검색 영역이 좁아진 문제

데스크톱에서는 검색 입력과 결과 개수를 한 줄에 배치했지만 작은 화면에서는 입력 영역이 지나치게 좁아졌습니다. 미디어 쿼리에서 검색 영역을 세로 방향으로 바꾸고, 날씨 카드 그리드를 한 열로 줄였습니다. 390px 너비에서 가로 넘침이 없는지도 함께 확인했습니다.
