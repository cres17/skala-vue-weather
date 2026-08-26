<script setup>
import { computed, ref, watch, watchEffect } from "vue";

import BaseDashboardCard from "./BaseDashboardCard.vue";
import SearchBar from "./SearchBar.vue";
import WeatherCard from "./WeatherCard.vue";

// 여러 자식이 함께 사용하는 값은 부모 한 곳에서 관리한다.
const searchQuery = ref("");
const selectedCity = ref(null);
const temperatureUnit = ref("C");
const favoriteCityIds = ref([]);

const weatherList = ref([
  {
    id: "city-01",
    name: "서울",
    temp: 28,
    status: "맑음",
    icon: "☀️",
    humidity: 42,
    wind: 2.4,
    note: "가벼운 산책을 즐기기 좋은 날씨",
  },
  {
    id: "city-02",
    name: "수원",
    temp: 24,
    status: "비",
    icon: "🌧️",
    humidity: 76,
    wind: 3.1,
    note: "우산을 챙기는 것이 좋아요",
  },
  {
    id: "city-03",
    name: "부산",
    temp: 26,
    status: "구름",
    icon: "⛅",
    humidity: 61,
    wind: 4.2,
    note: "해안가에서는 바람이 조금 강해요",
  },
  {
    id: "city-04",
    name: "제주",
    temp: 27,
    status: "맑음",
    icon: "🌤️",
    humidity: 58,
    wind: 5.7,
    note: "자외선 차단제를 준비하세요",
  },
  {
    id: "city-05",
    name: "대전",
    temp: 22,
    status: "흐림",
    icon: "☁️",
    humidity: 68,
    wind: 1.8,
    note: "선선한 하루가 이어집니다",
  },
  {
    id: "city-06",
    name: "광주",
    temp: 29,
    status: "맑음",
    icon: "☀️",
    humidity: 39,
    wind: 2.1,
    note: "낮 동안 더위를 조심하세요",
  },
]);

// 앞뒤 공백만 입력했을 때는 전체 목록이 보이도록 검색어를 먼저 정리한다.
const normalizedSearchQuery = computed(() =>
  searchQuery.value.trim().toLowerCase(),
);

const filteredWeatherList = computed(() => {
  if (!normalizedSearchQuery.value) return weatherList.value;
  return weatherList.value.filter((city) =>
    city.name.toLowerCase().includes(normalizedSearchQuery.value),
  );
});

const favoriteCities = computed(() =>
  weatherList.value.filter((city) => favoriteCityIds.value.includes(city.id)),
);

const weatherSummary = computed(() => {
  const hottestCity = weatherList.value.reduce((hottest, city) =>
    city.temp > hottest.temp ? city : hottest,
  );
  return `오늘 가장 따뜻한 도시는 ${hottestCity.name}(${formatTemperature(hottestCity.temp)})입니다.`;
});

const selectedCityInfo = computed(() => {
  if (!selectedCity.value) {
    return "도시를 선택하면 이곳에 현재 날씨가 표시됩니다.";
  }
  return `${selectedCity.value.name}이 선택되었습니다. 현재 ${selectedCity.value.status}, ${formatTemperature(selectedCity.value.temp)}입니다.`;
});

watch(selectedCityInfo, (newMessage, oldMessage) => {
  console.log("[watch] 상태바 문구 변경:", {
    이전: oldMessage,
    현재: newMessage,
  });
});

watchEffect(() => {
  console.log(`[watchEffect] 현재 검색어: "${searchQuery.value}"`);
});

watch(temperatureUnit, (newUnit) => {
  console.log(
    `[watch] 온도 표시 단위가 ${newUnit === "C" ? "섭씨" : "화씨"}로 변경되었습니다.`,
  );
});

function formatTemperature(celsius) {
  return temperatureUnit.value === "C"
    ? `${celsius}°C`
    : `${Math.round((celsius * 9) / 5 + 32)}°F`;
}

function updateSearchQuery(query) {
  // SearchBar는 값을 직접 바꾸지 않고 이 함수를 통해 변경을 요청한다.
  searchQuery.value = query;
}

function selectCity(city) {
  selectedCity.value = city;
}

function showDetail(city) {
  window.alert(
    `${city.name}의 현재 날씨는 [${city.status}] 상태이며, 기온은 ${formatTemperature(city.temp)}입니다.\n${city.note}`,
  );
}

function toggleFavorite(city) {
  const index = favoriteCityIds.value.indexOf(city.id);
  if (index >= 0) {
    favoriteCityIds.value.splice(index, 1);
    return;
  }
  favoriteCityIds.value.push(city.id);
}

function isFavorite(city) {
  return favoriteCityIds.value.includes(city.id);
}
</script>

<template>
  <main class="weather-page">
    <section class="hero">
      <p class="hero__eyebrow">VUE 3 · COMPONENT COMMUNICATION</p>
      <div class="hero__heading">
        <div>
          <h1>오늘의 지역별 날씨</h1>
          <p>도시를 검색하고, 카드를 선택해 현재 날씨를 확인하세요.</p>
        </div>
        <div class="unit-switch" aria-label="온도 단위 선택">
          <button
            type="button"
            :class="{ active: temperatureUnit === 'C' }"
            @click="temperatureUnit = 'C'"
          >
            °C
          </button>
          <button
            type="button"
            :class="{ active: temperatureUnit === 'F' }"
            @click="temperatureUnit = 'F'"
          >
            °F
          </button>
        </div>
      </div>
    </section>

    <BaseDashboardCard variant="search" aria-label="도시 날씨 검색">
      <SearchBar
        :query="searchQuery"
        :result-count="filteredWeatherList.length"
        :total-count="weatherList.length"
        @update-query="updateSearchQuery"
      />
    </BaseDashboardCard>

    <p class="status-bar" role="status">
      <span aria-hidden="true">●</span>{{ selectedCityInfo }}
    </p>

    <div class="summary-card">
      <span aria-hidden="true">✦</span>
      <p>{{ weatherSummary }}</p>
      <small>즐겨찾기 {{ favoriteCities.length }}개</small>
    </div>

    <BaseDashboardCard variant="content" aria-label="지역별 날씨 목록">
      <template #header>
        <div class="list-heading">
          <p>LOCAL FORECAST</p>
          <h2>지역별 날씨 현황</h2>
        </div>
        <span class="list-heading__count"
          >{{ filteredWeatherList.length }}개 도시</span
        >
      </template>

      <div v-if="filteredWeatherList.length" class="weather-grid">
        <WeatherCard
          v-for="city in filteredWeatherList"
          :key="city.id"
          :city="city"
          :temperature="formatTemperature(city.temp)"
          :favorite="isFavorite(city)"
          :selected="selectedCity?.id === city.id"
          @select-card="selectCity"
          @click-detail="showDetail"
          @toggle-favorite="toggleFavorite"
        />
      </div>

      <section v-else class="empty-state">
        <span aria-hidden="true">🌫️</span>
        <h2>일치하는 도시가 없어요</h2>
        <p>다른 도시 이름으로 다시 검색해 보세요.</p>
        <button type="button" @click="updateSearchQuery('')">
          전체 도시 보기
        </button>
      </section>

      <template #footer>
        <p class="component-note">
          SearchBar와 WeatherCard는 이 카드의 slot 안에 배치되며, 상태는
          WeatherParent가 props와 emits로 관리합니다.
        </p>
      </template>
    </BaseDashboardCard>
  </main>
</template>

<style scoped>
.weather-page {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 72px 0 56px;
}

.hero {
  margin-bottom: 30px;
}

.hero__eyebrow,
.list-heading p {
  margin: 0 0 10px;
  color: #238c9f;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.13em;
}

.hero__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.hero h1 {
  margin: 0;
  color: var(--heading-color);
  font-size: clamp(2rem, 5vw, 3.25rem);
  letter-spacing: -0.06em;
  line-height: 1.2;
}

.hero__heading p {
  margin: 12px 0 0;
  color: #6c818d;
}

.unit-switch {
  display: flex;
  padding: 4px;
  border-radius: 12px;
  background: #e4edf1;
}

.unit-switch button {
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  color: #6c818d;
  background: transparent;
  font-weight: 700;
}

.unit-switch button.active {
  color: #197d91;
  background: #fff;
  box-shadow: 0 2px 7px rgb(71 103 121 / 11%);
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 18px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #39707d;
  background: #e2f3f3;
  font-size: 0.9rem;
}

.status-bar span {
  color: #32aa9b;
  font-size: 0.7rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 13px 17px;
  border-radius: 13px;
  color: #e8fafb;
  background: #173b4f;
}

.summary-card > span {
  color: #f8d66c;
}

.summary-card p {
  flex: 1;
  margin: 0;
  font-size: 0.92rem;
}

.summary-card small {
  color: #a8ced6;
}

.list-heading p {
  margin-bottom: 5px;
}

.list-heading h2 {
  margin: 0;
  color: var(--heading-color);
  font-size: 1.45rem;
}

.list-heading__count {
  padding: 7px 11px;
  border-radius: 99px;
  color: #39707d;
  background: #edf6f7;
  font-size: 0.82rem;
  font-weight: 700;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.empty-state {
  padding: 65px 20px;
  border: 1px dashed #bfd6dc;
  border-radius: 18px;
  text-align: center;
}

.empty-state > span {
  font-size: 3rem;
}

.empty-state h2 {
  margin: 15px 0 6px;
  font-size: 1.25rem;
}

.empty-state p {
  margin: 0 0 18px;
  color: #78909a;
}

.empty-state button {
  padding: 10px 16px;
  border: 0;
  border-radius: 9px;
  color: #fff;
  background: #247c8d;
  font-weight: 700;
}

.component-note {
  margin: 0;
  color: #78909a;
  font-size: 0.8rem;
  text-align: center;
}

@media (max-width: 820px) {
  .weather-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .weather-page {
    width: min(100% - 28px, 520px);
    padding-top: 42px;
  }

  .hero__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .unit-switch {
    align-self: flex-end;
  }

  .summary-card small {
    display: none;
  }

  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
