# Vue 날씨 검색 과제
Vue 3 Composition API를 사용해 지역별 날씨 검색 화면을 만들었습니다.

> 2번 업데이트: `computed`를 활용한 도시 검색 기능을 추가했습니다.

<img src="/screenshot/main.png">
## 적용한 애용

1. **반응형 상태 관리**
   - `searchQuery`, `selectedCityInfo`, `weatherList`를 `ref`로 선언했습니다.
   - 검색어 입력과 도시 카드 클릭으로 값이 바뀌면 화면이 바로 다시 렌더링됩니다.

2. **검색 도시 (`computed`)**
   - `filteredWeatherList`에서 `searchQuery`가 비어 있으면 `weatherList` 전체를 반환합니다.
   - 검색어가 있으면 `filter()`로 도시 이름에 검색어가 포함된 데이터만 반환합니다.

3. **변수 변경 감시 (`watch`, `watchEffect`)**
   - `watch(selectedCityInfo)`로 상태바 문구가 바뀔 때 이전 값과 현재 값을 콘솔에 출력했습니다.
   - `watchEffect()` 내부에서 `searchQuery`를 사용해, 검색어 입력 시마다 자동으로 콘솔 로그가 출력되도록 했습니다.
<img src="/screenshot/console_log.png">

4. **검색 결과 표시**
   - `filteredWeatherList`에 데이터가 있으면 `v-for`로 날씨 카드를 출력합니다.
   - 검색어가 없으면 computed 결과가 전체 목록이므로 원본 날씨 데이터가 표시됩니다.
   - 검색 결과가 없으면 `v-if` / `v-else`로 “일치하는 도시가 없어요” 안내 화면을 보여 줍니다.
<img src="/screenshot/search.png">
<img src="/screenshot/search_null.png">

5. **개인 확장 기능**
   - `temperatureUnit` 상태를 추가해 섭씨와 화씨를 전환할 수 있게 했고, `watch`로 단위 변경도 감지합니다.
   - `favoriteCityIds` 배열에 즐겨찾기한 도시 ID를 저장하고, `favoriteCities` computed로 즐겨찾기 도시와 개수를 계산했습니다.
<img src="/screenshot/fahrenheit.png">
<img src="/screenshot/favorites.png">
