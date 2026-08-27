# Weather Store

기존 Weather Router 프로젝트에 Pinia를 붙여, 앱 전체에서 공유하는 온도 단위 설정을 만든 실습입니다. 상단 메뉴의 버튼을 누르면 날씨 목록과 도시 상세 페이지가 함께 섭씨(°C)와 화씨(°F)로 바뀝니다.

## 요구사항별 구현 내용

### 1. 온도 단위를 Pinia store로 분리

검색어와 선택한 도시는 날씨 목록 화면 안에서만 의미가 있으므로 `WeatherParent.vue`에 남겨 두었습니다. 반면 온도 단위와 즐겨찾기는 여러 컴포넌트에서 재사용할 수 있는 상태라 Pinia store로 분리했습니다. 온도 단위는 `configStore.js`, 즐겨찾기는 `favoriteStore.js`가 관리합니다.

```js
export const useConfigStore = defineStore("config", {
  state: () => ({ unit: "celsius" }),
  getters: {
    unitSymbol: (state) => (state.unit === "celsius" ? "°C" : "°F"),
  },
  actions: {
    toggleUnit() {
      this.unit = this.unit === "celsius" ? "fahrenheit" : "celsius";
    },
  },
});
```

state에는 비교하기 쉬운 `celsius`, `fahrenheit`만 저장하고, 화면용 기호는 getter에서 만들었습니다. 기호까지 state에 넣으면 조건문마다 `°C`를 직접 비교해야 해서 읽기 어려워진다고 느꼈습니다.

<img src="/screenshot/main.png" width="500" height="1000">

### 2. 즐겨찾기도 Pinia store로 관리

도시 카드의 별 버튼과 상단의 즐겨찾기 개수는 같은 상태를 사용하므로, 도시 ID 목록과 토글 동작을 `favoriteStore.js`에 모았습니다.

```js
export const useFavoriteStore = defineStore("favorite", {
  state: () => ({ favoriteCityIds: [] }),
  getters: {
    favoriteCount: (state) => state.favoriteCityIds.length,
    isFavorite: (state) => (cityId) => state.favoriteCityIds.includes(cityId),
  },
  actions: {
    toggleFavorite(cityId) {
      const index = this.favoriteCityIds.indexOf(cityId);
      if (index >= 0) this.favoriteCityIds.splice(index, 1);
      else this.favoriteCityIds.push(cityId);
    },
  },
});
```

`WeatherParent.vue`는 카드에서 받은 도시 ID를 `toggleFavorite` action에 전달하고, `isFavorite` getter로 별 아이콘 상태를 표시합니다. 따라서 즐겨찾기를 다른 화면에 보여 주어도 동일한 store를 바로 사용할 수 있습니다.

### 3. Pinia를 앱에 연결

```js
createApp(App).use(createPinia()).use(router).mount("#app");
```

`main.js`에서 `createPinia()`를 등록해야 Vue가 store를 사용할 수 있습니다. 처음에는 store의 import 경로가 문제인 줄 알았지만, Pinia 등록이 빠지면 “활성화된 Pinia가 없다”는 오류가 난다는 점이 원인이었습니다.

### 4. 공통 메뉴에 단위 변경 버튼 배치

페이지마다 버튼을 복사하지 않기 위해, 페이지 전환 뒤에도 계속 남는 `App.vue`의 Navigation Bar에 넣었습니다.

```vue
<nav class="app-header__nav" aria-label="주요 메뉴">
  <RouterLink to="/weather">날씨</RouterLink>
  <RouterLink to="/about">서비스 소개</RouterLink>
  <UnitToggler />
</nav>
```

`UnitToggler`는 props와 emit을 여러 단계로 거치지 않고 store action을 직접 호출합니다. 여러 화면이 공유하는 단순 설정에는 이 방식이 더 자연스럽다고 판단했습니다.

### 5. 원본 데이터는 섭씨로 두고, 화면에서만 변환

`weather.js`의 숫자는 섭씨 원본 그대로 유지했습니다. 데이터를 직접 화씨로 바꾸면 다시 섭씨로 돌아갈 때 원본을 잃을 수 있기 때문입니다. 출력 직전에만 변환식 `C × 9 / 5 + 32`을 적용하고, 보기 좋게 `Math.round()`로 반올림했습니다.

```js
const temperature =
  configStore.unit === "celsius"
    ? celsius
    : Math.round((celsius * 9) / 5 + 32);

return `${temperature}${configStore.unitSymbol}`;
```

상세 화면은 `formattedTemperature`를 `computed`로 만들었습니다. 덕분에 도시 상세 화면을 보고 있는 동안 상단 버튼을 눌러도 페이지 이동 없이 표시값이 즉시 바뀝니다.

<img src="/screenshot/Celsius.png" width="500" height="1000">
<img src="/screenshot/Fahrenheit.png" width="500" height="1000">

## AI를 사용한 부분

- Pinia의 state, getters, actions를 이 요구사항에 맞게 나누는 방식을 확인했습니다.
- 화씨 변환식과 반올림 위치를 점검했습니다.
- 구현 뒤 lint와 production build로 문법 및 번들 오류가 없는지 확인했습니다.

## 트러블 슈팅

### 로컬 상태와 전역 상태의 경계

처음에는 “이 화면에서 쓰니까 이 컴포넌트에 두면 되겠지”라고 생각했습니다. 하지만 다른 페이지가 생기는 순간 같은 단위 값이나 즐겨찾기 목록을 복사해야 했고, 한쪽만 바뀌는 문제가 생겼습니다. 이번 과제를 거치며 한 화면에서만 의미가 있으면 컴포넌트 상태, 화면을 넘어 공유되면 store 상태라는 기준을 세울 수 있었습니다.

### getter가 필요한 이유

템플릿에서 `unit === "celsius"` 조건문을 매번 써도 기능은 됩니다. 다만 그 조건이 여러 군데 반복되면 표기 규칙을 바꿀 때 빠뜨릴 가능성이 있습니다. `unitSymbol` getter로 이름을 붙이니, 화면 코드가 “기호를 보여 준다”는 의도를 더 잘 드러냈습니다.

### 전역 store도 새로고침하면 초기화된다는 점

Pinia store는 앱이 실행되는 동안에는 페이지 이동을 넘어 유지됩니다. 그래서 메인에서 °F로 바꾼 뒤 상세 페이지로 가도 화씨가 유지됩니다. 다만 브라우저 새로고침까지 저장하는 기능은 아직 넣지 않았습니다. 다음 단계에서는 localStorage를 연동해 볼 수 있습니다.
