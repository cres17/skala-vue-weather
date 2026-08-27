# Weather Router

기존에 만들었던 지역별 날씨 화면에 Vue Router를 붙여서, 한 화면 안에서만 동작하던 기능을 여러 페이지와 URL로 나눈 프로젝트입니다. 메인 화면에서 도시를 검색하고 상세보기 버튼을 누르면 해당 도시의 상세 주소로 이동합니다. 소개 페이지와 존재하지 않는 주소를 위한 404 페이지도 함께 만들었습니다.

## 요구사항별 구현 과정

### 1. Vue Router 설정, Lazy Loading, Catch-all Route

가장 먼저 `router/index.js`에 어떤 URL에서 어떤 화면을 보여 줄지 적었습니다. 라우터 파일만 만든다고 바로 작동하지는 않습니다. `main.js`에서 `createApp(App).use(router).mount('#app')`처럼 Vue 앱에 router를 등록해야 `RouterLink`, `RouterView`, `useRouter`를 쓸 수 있습니다.

처음에는 컴포넌트를 일반 import로 가져오는 방식도 생각했지만, 과제 요구사항에 맞춰 아래처럼 함수로 작성했습니다.

```js
component: () => import("../views/WeatherAboutView.vue")
```

이렇게 작성하면 처음 `/weather`에 들어왔을 때 소개·상세·404 페이지까지 한꺼번에 읽지 않고, 해당 페이지에 실제로 이동했을 때 파일을 불러옵니다. 이 방식이 Lazy Loading입니다. 작은 프로젝트에서는 체감이 크지 않지만, 라우팅 파일에서 어떤 이유로 함수 형태를 쓰는지 이해하기 위해 적용했습니다.

마지막 route에는 `/:pathMatch(.*)*`를 넣었습니다. 이 문법은 Vue Router 4 이상에서 사용하는 Catch-all 방식이라 처음 보면 특히 헷갈렸습니다. `/weather`나 `/about` 같은 경로는 정해진 화면으로 보내고, 그 외 주소는 전부 `NotFoundView.vue`로 보내도록 했습니다. 없는 페이지로 접근했을 때 흰 화면이나 오류 대신 돌아갈 링크를 제공할 수 있습니다.

### 2. App.vue에 Navigation Bar와 RouterView 배치

`App.vue`에는 모든 화면에서 공통으로 보여야 하는 메뉴만 두었습니다. 날씨와 서비스 소개 메뉴는 `<RouterLink>`로 만들었고, 실제 페이지가 표시될 위치에는 `<RouterView>`를 두었습니다.

처음에는 `RouterLink`를 일반 `<a>` 태그처럼 생각했는데, 일반 링크는 페이지를 새로 요청하는 반면 `RouterLink`는 Vue Router가 현재 주소를 바꾸고 필요한 view만 교체합니다. 또 `router-link-active` 클래스를 자동으로 받을 수 있어 현재 메뉴 표시도 쉽게 처리할 수 있었습니다.

상세 페이지는 `/weather/city-01`, `/weather/city-02`처럼 같은 view를 공유하면서 파라미터만 달라질 수 있습니다. 현재 구현은 `RouterView`에 `:key="$route.fullPath"`를 주어 주소가 바뀌면 view가 새로 마운트되게 했습니다. 따라서 상세 화면의 `onMounted`에서 다시 데이터를 찾는 방식과 맞춰 동작합니다.

<img src="/screenshot/introduce.png" width="500" height="1000">

### 3. WeatherHomeView에서 기존 날씨 화면 연결

기존 `WeatherParent.vue`에는 검색어, 선택한 도시, 온도 단위, 즐겨찾기처럼 메인 화면에서만 필요한 상태가 이미 들어 있었습니다. 이 상태를 라우터 파일이나 App.vue로 옮기면 책임이 섞일 수 있어서 그대로 유지했습니다.

대신 `WeatherHomeView.vue`는 `WeatherParent`를 렌더링하는 역할만 맡겼습니다. 페이지 컴포넌트가 한 겹 생긴 셈이지만, 나중에 메인 화면에 배너나 안내 영역이 추가되어도 기존 상태 컴포넌트를 크게 건드리지 않아도 되는 구조입니다.

### 4. alert 대신 router.push로 상세 페이지 이동

기존 상세보기 버튼은 클릭하면 `alert`로 도시 정보를 보여 주는 흐름이었습니다. 이 방식은 확인만 가능하고 URL이 바뀌지 않아서, 뒤로 가기·새로고침·주소 공유가 불가능합니다.

`WeatherParent.vue`의 setup 영역에서 `useRouter()`를 가져온 뒤, 상세보기 이벤트를 처리하는 함수에서 아래처럼 이동하도록 바꿨습니다.

```js
function showDetail(city) {
  router.push(`/weather/${city.id}`)
}
```

여기서 `RouterLink` 대신 `router.push`를 쓴 이유는 이동 자체가 링크를 클릭하는 것이 아니라, `WeatherCard`가 `click-detail` 이벤트를 부모에게 전달한 결과이기 때문입니다. 카드 컴포넌트는 “상세보기 버튼이 눌렸다”는 사실과 도시 객체만 알리고, 실제 어디로 이동할지는 부모가 결정하게 했습니다.

<img src="/screenshot/weather_detail.png" width="500" height="1000">

### 5. WeatherDetailView에서 URL 파라미터로 도시 찾기

상세 라우트는 `/weather/:cityId`로 정의했습니다. 여기서 `:cityId`는 고정 문자열이 아니라 바뀌는 자리입니다. 예를 들어 `/weather/city-01`에 들어가면 `cityId` 값은 `city-01`이 됩니다.

`WeatherDetailView.vue`에서는 `useRoute()`로 현재 주소 정보를 가져오고, 마운트될 때 아래처럼 Mock Data에서 일치하는 도시를 찾습니다.

```js
city.value = weatherList.find(
  (weather) => weather.id === route.params.cityId,
)
```

홈에서 클릭하고 바로 이동하는 경우뿐 아니라, 브라우저 주소창에 `/weather/city-01`을 직접 입력하거나 새로고침해도 같은 결과가 나옵니다. 이 점 때문에 상세 화면이 홈의 `selectedCity` 상태를 그대로 사용하는 방식보다 URL 파라미터로 데이터를 다시 찾는 방식이 더 적절했습니다.

### 6. 공용 Mock Data로 홈과 상세 데이터 맞추기

처음에는 `WeatherParent.vue` 안에 있던 배열만으로도 홈 화면은 잘 보였습니다. 그런데 상세 페이지를 만들면 그 배열을 다른 파일에서 가져올 수 없어 같은 데이터를 한 번 더 작성해야 했습니다. 두 배열을 따로 두면 나중에 서울의 온도나 설명을 수정할 때 한쪽만 수정할 가능성이 큽니다.

그래서 날씨 배열을 `src/data/weather.js`로 옮겼습니다. 홈은 카드 목록을 만들 때, 상세 화면은 URL의 ID로 도시를 찾을 때 같은 `weatherList`를 import합니다. 데이터를 한 곳에서 관리하게 되어 화면 두 개의 내용이 일치합니다.

### 7. 소개 페이지와 404 페이지

`WeatherAboutView.vue`는 별도의 상태나 API 호출이 필요 없는 정적 페이지로 만들었습니다. 다만 단순한 문장만 넣지 않고, 서비스의 핵심 기능과 날씨 목록으로 가는 `RouterLink`를 배치했습니다.

`NotFoundView.vue`는 라우터에서 잡지 못한 주소를 위한 화면입니다. 잘못된 주소를 처리하는 것뿐 아니라, 사용자가 다시 `/weather`로 돌아갈 수 있는 링크를 함께 제공하는 것이 중요하다고 생각했습니다.

<img src="/screenshot/not_found.png" width="500" height="1000">

## 트러블 슈팅

### Router를 만들었는데 RouterLink와 RouterView가 동작하지 않는 문제

처음 라우터 파일을 만들면 `router/index.js`에 모든 경로를 적었으니 끝난 것처럼 느껴집니다. 하지만 앱 시작 파일에서 router를 등록하지 않으면 Vue는 그 라우터를 모릅니다. 이때 화면에 `RouterView`를 넣어도 아무것도 안 보이거나, 라우터 관련 경고가 나올 수 있습니다.

해결은 `main.js`에서 `createApp(App)` 뒤에 `.use(router)`를 붙이는 것입니다. 이 연결이 빠지면 route 설정이 아무리 맞아도 실제 앱에서는 사용할 수 없다는 점을 확인했습니다.

### `useRouter()`와 `useRoute()`를 혼동한 문제

이름이 비슷해서 처음에는 상세 페이지에서도 `useRouter()`를 쓰려고 했습니다. 두 함수의 역할이 다릅니다.

- `useRouter()`는 `router.push()`처럼 **이동시키기 위한 객체**가 필요할 때 사용합니다.
- `useRoute()`는 `route.params.cityId`처럼 **현재 주소의 정보**를 읽을 때 사용합니다.

그래서 `WeatherParent.vue`에는 `useRouter()`를, `WeatherDetailView.vue`에는 `useRoute()`를 사용했습니다. 또 둘 다 `<script setup>` 안에서 호출해야 컴포넌트와 연결된 라우터 정보를 받을 수 있습니다.

### find 결과가 없을 때 template에서 오류가 나는 문제

`find()`는 일치하는 도시가 없으면 `undefined`를 반환합니다. 이 상태에서 바로 `city.name`을 화면에 쓰면 값을 읽을 수 없다는 오류가 날 수 있습니다. 특히 `/weather/없는아이디`처럼 주소를 직접 입력하면 실제로 생길 수 있는 경우입니다.

상세 화면에서는 `city`를 처음에 `null`로 두고, `v-if="city"`가 참일 때만 날씨 내용을 표시했습니다. 도시를 찾지 못한 경우에는 별도 안내와 목록 복귀 링크를 보여 줍니다. 404 route와 “형식은 맞지만 존재하지 않는 ID”는 다른 문제라는 것도 이 과정에서 알게 됐습니다.

<img src="/screenshot/nan_weather.png" width="500" height="1000">


### 동적 URL만 바뀌는데 화면이 그대로인 문제

Vue Router는 같은 컴포넌트를 재사용할 수 있습니다. 예를 들어 상세 화면에 있는 상태에서 다른 도시 상세 URL로 이동하면 컴포넌트가 새로 만들어지지 않을 수 있습니다. 이 경우 `onMounted`만 사용해서 데이터를 찾는 코드는 다시 실행되지 않을 가능성이 있습니다.

이번 구현에서는 `RouterView`에 `:key="$route.fullPath"`를 줘 주소가 바뀔 때 view를 다시 마운트하게 했습니다. 따라서 `onMounted`에서 매번 현재 `cityId` 기준으로 데이터를 찾습니다. 다른 방법으로는 `watch`로 route params 변화를 감지하는 방법도 있지만, 현재 과제에서는 마운트 시점 조회 요구사항과 맞추기 위해 key 방식을 선택했습니다.


## AI를 사용한 부분

- Vue Router의 동적 경로 문법과 Catch-all 문법이 현재 버전에서 어떻게 달라졌는지 확인했습니다.
- `useRouter`와 `useRoute`의 역할을 구분하고, `router.push`에 도시 ID를 넣는 방식을 점검했습니다.
- `find()`가 도시를 찾지 못했을 때 화면에서 어떤 예외 처리가 필요한지 확인했습니다.
- 카드 클릭과 내부 버튼 클릭이 동시에 반응하는 이유가 이벤트 버블링인지 확인했습니다.
- 구현 후 lint, production build, 브라우저 경로 전환을 검사할 때 요구사항이 빠진 부분이 없는지 체크했습니다.
