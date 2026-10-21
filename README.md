# Outcast

국내 지역의 현재 날씨와 중기예보를 한 화면에서 비교하는 Vue 3 날씨 서비스입니다.
지도에서 시·군·구를 선택하거나 도시를 검색하면, 가까운 기상청 관측소의 현재 관측값과
기상청 중기예보를 확인할 수 있습니다.

## 아키텍처

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/architecture-dark.svg">
  <img src="docs/assets/readme/architecture.svg" alt="Outcast · 날씨 실습 주요 구성과 데이터 흐름" width="1200">
</picture>

Vue와 Leaflet이 화면·지역 선택을 담당하고 Python 서버가 기상청·AirKorea 응답과 UTCI 계산을 조합합니다. 날씨와 대기질은 등록된 관측소 목록을 기준으로 조회합니다.

| 구성 | 역할 |
|---|---|
| 화면 | Vue 3·Vite와 Leaflet 지도, 현재 관측·중기예보 카드 |
| 서버 | 기상청·AirKorea 키를 서버에서 읽고 API 응답 조합 |
| 계산 | UTCI 체감온도와 대기질·강수 기반 외출 판단 |

## 기술 스택

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/tech-stack-dark.svg">
  <img src="docs/assets/readme/tech-stack.svg" alt="Outcast · 날씨 실습 기술 스택" width="1200">
</picture>

| 영역 | 사용 기술 | 역할 |
|---|---|---|
| 화면 | Vue 3, JavaScript, Vite | 도시 선택과 날씨·대기질 화면 |
| 지도 | Leaflet | 행정구역 레이어와 지역 선택 |
| 서버 | Python 3, utci==1.0.0 | 외부 API 조합과 체감온도 계산 |
| 데이터 | 기상청 API 허브, AirKorea | 현재 관측·중기예보·대기질 |
| 실행 | npm, concurrently | 개발 시 Vite와 Python 서버 동시 실행 |

## 실행 방법

이 앱 코드는 `9-weather-final` 브랜치에 있습니다. `main`에는 과제 목차만 있습니다.

### 요구사항

- Node.js `^20.19.0 || >=22.12.0`과 npm
- Python 3와 `requirements.txt`의 `utci==1.0.0`
- 기상청 API 허브 키 `KMA_API_KEY`
- AirKorea 서비스 키 `AIR_KOREA_API_KEY`

### macOS·Linux 로컬 실행

```bash
git clone --branch 9-weather-final https://github.com/cres17/skala-vue-weather.git
cd skala-vue-weather
npm ci
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

`.env`에 두 키를 설정합니다. 서버가 이 파일을 읽으며 키를 프런트엔드의 `VITE_*` 변수에 넣지 않습니다.

```dotenv
KMA_API_KEY=
AIR_KOREA_API_KEY=
```

가상환경을 활성화한 같은 터미널에서 실행합니다.

```bash
npm run dev
```

이 명령은 `python3 server/app.py`와 Vite를 함께 실행합니다. 브라우저 주소는 Vite 출력에서 확인합니다. Windows에서 `python3` 명령이 없다면 가상환경을 활성화하고 별도 터미널에서 `python server/app.py`, `npm run vite:dev`를 각각 실행하세요.

### 빌드와 배포

```bash
npm run build
npm run preview
```

build는 프런트엔드 산출물을 만들며, preview도 Python 서버를 함께 실행합니다. 정적 파일만 배포해서는 Python API가 동작하지 않습니다. Vercel 구성은 [vercel.json](vercel.json), API 진입점은 [api](api), 서버 구현은 [server/app.py](server/app.py)에 있습니다. 배포 환경에도 같은 이름의 키를 별도로 설정해야 합니다.

`npm run lint`는 현재 `--fix`가 포함되어 파일을 수정할 수 있습니다. 별도의 자동 테스트 명령은 package.json에 없습니다.

### 현재 데이터 범위

가까운 관측소는 서버에 등록한 기상청 좌표 13개 중에서 선택합니다. AirKorea도 코드에 등록된 측정소 목록을 사용합니다. 전국 모든 관측소를 실시간 검색하거나 행정구역 전체 평균을 계산하는 방식은 아닙니다.

UTCI 패키지가 없으면 날씨 API 서버 전체를 종료하는 대신 체감온도 계산을 사용할 수 없는 상태로 처리합니다. 키 권한·관측 시각·외부 API 응답에 따라 일부 정보가 제공되지 않을 수 있습니다.

## 7번 브랜치 대비 추가·변경한 기능

### 1. 기상청 단일 데이터 소스

7번 브랜치에서는 OpenWeather 현재 날씨와 기상청 관측 정보를 함께 사용했습니다.
현재 날씨와 예보는 기상청 데이터로 통일하고, 대기질은 국가 대기환경정보를 제공하는 AirKorea 관측값으로 표시합니다.

- 가까운 기상청 지상관측소를 좌표 기준으로 선택해 현재 기온·습도·풍속·강수를 표시합니다.
- 예보구역 API로 지역 코드를 검증한 후, 중기 육상예보와 중기 기온예보를 함께 요청합니다.
- 인증키를 브라우저에 보내지 않고 Python API 경로에서만 사용합니다.

### 2. 기상청 중기 예보 4~10일

지도 탭과 상세정보 탭 모두 같은 중기예보 응답을 사용합니다.
기상청 중기예보는 발표일 기준 **+4일(최대 +5일)부터 +10일**까지 제공됩니다.

- `fct_afs_wl.php`: 날씨, 강수확률
- `fct_afs_wc.php`: 최저·최고기온, 기온 범위
- `fct_medm_reg.php`: 예보값이 아니라 예보구역 코드를 확인하는 데 사용

날짜 카드는 총 7개(+4~+10일)입니다. +4~+7일은 `오전`과 `오후` 예보를 각각 줄바꿈해 표시하고, +8~+10일은 하루 예보로 표시합니다. 따라서 실제 기상청 제공 주기와 화면 표현이 맞습니다.


<img src="/screenshot/weekly.png" width="500" height="1000">

### 3. 지도 기반 도시 선택

Leaflet 지도에 국내 행정구역 레이어를 올리고, 시·도와 시·군·구를 선택할 수 있게 구성했습니다.
선택한 도시는 지도 아래의 현재 날씨와 세로형 중기예보 패널에 바로 반영됩니다. 상세 페이지로 이동하는 버튼은 현재 날씨 카드 아래에 배치했습니다.


<img src="/screenshot/map_do.png" width="500" height="1000">
<img src="/screenshot/map_city.png" width="500" height="1000">
<img src="/screenshot/map_info.png" width="500" height="1000">


### 4. 상세 페이지와 외출 판단

상세 페이지에는 현재 기상청 관측값, UTCI 체감온도, 외출 판단, 가로 스크롤 중기예보를 배치했습니다.

- UTCI는 기온·습도·풍속 입력값으로 서버에서 계산합니다.
- 대기질은 AirKorea의 PM10·PM2.5·통합대기환경지수로 표시합니다.
- 외출 판단은 UTCI, 대기질, 실제 관측 강수를 함께 반영합니다.
- 대기질 측정 등급이 API 응답에 없으면 PM10·PM2.5 수치로 등급을 보완 계산합니다.
- UTCI와 대기질 카드는 위험도에 따라 파랑·민트·노랑·빨강 계열로 달라집니다.
- 더위·추위 상태에 따라 외출 판단 카드의 강조색과 안내 문구를 바꿉니다.
- 예보 안내 문구는 `좌우로 스크롤하세요`로 통일했고, 스크롤 버튼과 분리해 겹치지 않게 했습니다.
- 긴 오전·오후 예보 문구는 말줄임표 대신 줄바꿈으로 보여 줍니다.


<img src="/screenshot/outbutton.png" width="500" height="1000">
<img src="/screenshot/outbutton_detail.png" width="500" height="1000">

## 트러블 슈팅

### 중기예보 API를 호출했는데 예보값이 없던 문제

처음에는 `fct_medm_reg.php`를 중기예보 데이터 API로 사용하려 했습니다. 실제로는 이 API가 예보구역 코드 목록을 반환하므로, 날씨와 기온이 비어 보였습니다.

예보구역 코드는 해당 API로 확인하고, 실제 예보값은 `fct_afs_wl.php`와 `fct_afs_wc.php`로 나누어 요청한 뒤 날짜별로 합쳤습니다. 이 과정으로 강수확률·날씨·최저/최고기온을 같은 카드에서 표시할 수 있게 됐습니다.

### 동네예보 요청이 403으로 실패한 문제

사용 중인 인증키로 동네예보 Open API 요청이 403을 반환했습니다. 다른 외부 날씨 제공자로 대체하면 화면마다 출처가 달라지므로, 우회하지 않고 같은 기상청 API 허브의 지상관측과 중기예보 구조로 통일했습니다. 실패 시에는 다른 제공자의 값으로 조용히 바꾸지 않고 오류를 사용자에게 안내합니다.

### 긴 예보 문구와 스크롤 버튼이 겹친 문제

중기예보의 오전·오후 문구가 한 줄로 유지되면서 카드 높이와 버튼 영역이 충돌했습니다. 날씨 설명에 줄바꿈을 보존하는 CSS를 적용하고, 스크롤 안내·이동 버튼을 예보 카드 영역과 분리했습니다. 지도에서는 세로, 상세 페이지에서는 가로 흐름을 유지했습니다.

### 대기질 등급이 비어 보이는 문제

AirKorea 실시간 응답은 측정소와 갱신 시점에 따라 통합대기환경지수 또는 등급 필드가 비어 있을 수 있습니다. 이 경우 카드 전체를 비우지 않고 PM10·PM2.5 농도를 기준으로 `좋음·보통·나쁨·매우 나쁨` 등급을 계산해 표시하도록 보완했습니다. 대기질 조회는 가까운 AirKorea 측정소를 기준으로 하므로, 선택한 행정구역의 평균값과는 다를 수 있습니다.

## AI 사용 범위

- 기상청 API 문서의 필드와 예보구역·육상·기온예보의 역할을 정리하는 데 도움을 받았습니다.
- API 응답을 날짜별 카드 데이터로 합치는 구조, UTCI 계산 흐름, 오류 문구를 검토할 때 도움을 받았습니다.
- 예보 타임라인의 줄바꿈·스크롤·반응형 CSS 초안과 README 문서 구조를 만드는 데 도움을 받았습니다.
- 지도 구현에 AI 도움을 받았습니다.
