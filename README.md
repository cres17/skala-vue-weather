# Weather Mockup

Vue 학습 과제를 브랜치별로 관리하는 저장소입니다.

## 브랜치별 과제

| 번호 | 과제 | 브랜치 | 상태 |
| --- | --- | --- | --- |
| 1 | Weather Mockup | `1-weather-mockup` | 완료 |
| 2 | Weather Composition | 추후 생성 | 예정 |

Vue에서 배운 디렉티브와 이벤트 처리를 한 화면에 적용해 보기 위해 만든 지역별 날씨 화면이다. 서울, 부산, 도쿄, 삿포로의 날씨를 카드로 보여 주고, 도시 검색 입력과 카드별 상세 정보 기능을 넣었다.

<img src="/screenshot/main_page.png">

## 적용한 내용

### 1. 날씨 카드 반복 출력

날씨 정보는 `weatherList` 배열에 저장했다. `v-for`로 배열 안의 도시를 반복 출력하고, 각 카드에는 `id`를 `:key`로 연결했다. 도시마다 이름, 기온, 상태, 강수확률, 습도, 바람 정보를 가지고 있다.

### 2. 조건에 따른 라벨과 카드 색상

기온이 25도 이상이면 `더움`, 미만이면 `선선함` 라벨이 보이도록 `v-if`, `v-else`를 사용했다.

날씨 상태도 `:class`로 처리했다. 날씨가 맑음이면 `sunny-card` 클래스를, 흐림이면 `cloudy-card` 클래스를 추가해서 카드의 배경색과 테두리 색이 달라진다.

### 3. 도시 검색 입력

검색 input은 `v-model` 대신 `:value`와 `@input`을 사용했다. 입력할 때마다 이벤트 객체의 `target.value`를 `searchedCity`에 저장하고, 화면 아래에 현재 입력한 도시명을 출력한다. 양방향 바인딩이 실제로 어떤 방식으로 동작하는지 확인하려고 이렇게 작성했다.

<img src="/screenshot/search_input.png">

### 4. 카드 클릭과 이벤트 수식어

카드를 클릭하면 상태바에 선택한 도시 이름이 표시된다. 카드 안의 버튼을 누를 때는 부모 카드의 클릭 이벤트가 같이 실행되지 않도록 `@click.stop`을 사용했다.

- `상세 날씨 보기`: 해당 도시의 습도와 바람 정보를 펼치거나 닫는다.
- `알림 보기`: 현재 날씨 상태를 `window.alert`로 보여 준다.

<img src="/screenshot/alram_button.png">

### 5. `v-show`로 상세 정보 열기/닫기

각 도시 데이터에는 `showDetails` 값을 두었다. 상세 버튼을 누르면 이 값이 `true`와 `false`로 바뀌고, `v-show`가 습도와 바람 영역을 보이거나 숨긴다. 카드를 다시 만들지 않고 CSS의 `display`만 바뀌는 점을 확인할 수 있다.


<img src="/screenshot/detail_button.png">
