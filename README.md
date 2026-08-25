# Weather_Composition

<img src="/screenshot/main.png" width="500" height="1000">
## 적용한 내용

1. 반응형 상태 관리
   - `searchQuery`, `selectedCityInfo`, `weatherList`를 `ref`로 선언했습니다.
   - 검색어 입력과 도시 카드 클릭으로 값이 바뀌면 화면이 바로 다시 렌더링됩니다.

2. 검색 도시 (`computed`)
   - `filteredWeatherList`에서 `searchQuery`가 비어 있으면 `weatherList` 전체를 반환합니다.
   - 검색어가 있으면 `filter()`로 도시 이름에 검색어가 포함된 데이터만 반환합니다.

3. 변수 변경 감시 (`watch`, `watchEffect`)
   - `watch(selectedCityInfo)`로 상태바 문구가 바뀔 때 이전 값과 현재 값을 콘솔에 출력했습니다.
   - `watchEffect()` 내부에서 `searchQuery`를 사용해, 검색어 입력 시마다 자동으로 콘솔 로그가 출력되도록 했습니다.
<img src="/screenshot/console_log.png" width="500" height="1000">

4. 검색 결과 표시
   - `filteredWeatherList`에 데이터가 있으면 `v-for`로 날씨 카드를 출력합니다.
   - 검색어가 없으면 computed 결과가 전체 목록이므로 원본 날씨 데이터가 표시됩니다.
   - 검색 결과가 없으면 `v-if` / `v-else`로 “일치하는 도시가 없어요” 안내 화면을 보여 줍니다.
<img src="/screenshot/search.png" width="500" height="1000">
<img src="/screenshot/search_null.png" width="500" height="1000">

5. 개인 확장 기능
   - `temperatureUnit` 상태를 추가해 섭씨와 화씨를 전환할 수 있게 했고, `watch`로 단위 변경도 감지합니다.
   - `favoriteCityIds` 배열에 즐겨찾기한 도시 ID를 저장하고, `favoriteCities` computed로 즐겨찾기 도시와 개수를 계산했습니다.
<img src="/screenshot/fahrenheit.png" width="500" height="1000">
<img src="/screenshot/favorites.png"  width="500" height="1000">

## 트러블 슈팅

이번 과제에서 가장 오래 고민한 부분은 검색 기능과 카드 안에 있는 버튼들의 클릭 처리였습니다. 화면에서는 자연스럽게 보이지만, 상태를 직접 바꾸지 않고 유지하는 방법과 클릭 이벤트가 전달되는 방식을 이해해야 했습니다. 막힌 부분은 AI에게 현재 코드와 원하는 동작을 함께 보여 주고, 원인을 설명받은 뒤 제 코드에 맞게 적용했습니다.

### 1. 검색어를 지우면 원래 목록으로 돌아오지 않는 문제

기능: 검색창에 도시 이름을 입력하면 해당 도시만 보여 주고, 검색어가 비어 있으면 전체 도시 목록을 보여 줍니다.

문제: 처음에는 검색할 때마다 `weatherList` 자체를 바꾸는 방향으로 생각했습니다. 하지만 이렇게 하면 검색어를 지웠을 때 원래 목록을 다시 만들거나 따로 저장해야 해서 상태가 꼬일 수 있었습니다. 공백만 입력했을 때를 어떻게 처리할지도 애매했습니다.

해결: AI에게 “원본 목록은 그대로 두고 검색 결과만 바꾸고 싶다”고 질문했고, `searchQuery`와 `weatherList`를 바꾸는 대신 결과를 `computed`로 계산하는 방식을 적용했습니다. `trim()`으로 공백을 제거한 값을 먼저 만들고, 값이 없으면 전체 목록을 반환하도록 했습니다.

```js
const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLowerCase())

const filteredWeatherList = computed(() => {
  if (!normalizedSearchQuery.value) return weatherList.value
  return weatherList.value.filter((city) =>
    city.name.toLowerCase().includes(normalizedSearchQuery.value),
  )
})
```

배운 점: 검색 결과처럼 다른 상태로부터 바로 만들 수 있는 값은 따로 저장하기보다 `computed`로 관리하는 편이 안전했습니다. 원본 `weatherList`를 건드리지 않으니 검색어를 지웠을 때도 자연스럽게 전체 목록으로 돌아옵니다.

### 2. 즐겨찾기·상세보기 버튼을 눌러도 카드 선택이 함께 실행되는 문제

기능: 날씨 카드를 클릭하면 선택한 도시의 날씨를 상태바에 표시합니다. 카드 안의 별 버튼은 즐겨찾기만, 상세보기 버튼은 안내창만 실행되어야 합니다.

문제: 카드 전체에 `@click="selectCity(city)"`를 걸어 둔 상태에서 별 또는 상세보기 버튼을 눌렀더니, 버튼 기능이 실행된 뒤 카드 선택 기능까지 같이 실행됐습니다. 버튼만 눌렀는데 상태바 문구까지 바뀌어서 처음에는 왜 두 함수가 실행되는지 알기 어려웠습니다.

원인: AI 도움으로 자식 요소의 클릭 이벤트가 부모 요소까지 전달되는 이벤트 버블링 때문이라는 것을 알았습니다. 버튼은 카드 안에 있으므로 버튼에서 발생한 클릭이 카드의 `@click`까지 전달되고 있었습니다.

해결: 버튼 클릭에는 Vue 이벤트 수식어인 `.stop`을 붙여 부모 카드로 이벤트가 전달되지 않게 했습니다.

```vue
<article @click="selectCity(city)">
  <button @click.stop="toggleFavorite(city)">☆</button>
  <button @click.stop="showDetail(city)">상세보기</button>
</article>
```

배운 점: 카드처럼 넓은 영역을 클릭 가능하게 만들 때 내부 버튼의 동작도 함께 확인해야 했습니다. 단순히 기능이 작동하는지만 보는 것이 아니라, 한 번의 클릭에 의도하지 않은 함수가 실행되지 않는지도 확인하는 습관이 필요하다고 느꼈습니다.
