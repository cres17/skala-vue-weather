<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import BaseDashboardCard from "./exercise/BaseDashboardCard.vue";
import SearchBar from "./exercise/SearchBar.vue";
import WeatherCard from "./exercise/WeatherCard.vue";
import { getWeatherList, searchCities } from "../services/weather";
import { useConfigStore } from "../stores/configStore";
import { useFavoriteStore } from "../stores/favoriteStore";

const router = useRouter();
const configStore = useConfigStore();
const favoriteStore = useFavoriteStore();
const searchQuery = ref("");
const selectedCity = ref(null);
const weatherList = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");

async function updateSearchQuery(query) {
  searchQuery.value = query;
  errorMessage.value = "";

  try {
    if (!query.trim()) {
      weatherList.value = await getWeatherList();
      return;
    }

    weatherList.value = await searchCities(query.trim());
  } catch (error) {
    errorMessage.value = error.message;
  }
}

const weatherSummary = computed(() => {
  if (!weatherList.value.length) {
    return "날씨 정보를 불러오는 중입니다.";
  }

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

function formatTemperature(celsius) {
  const temperature =
    configStore.unit === "celsius"
      ? celsius
      : Math.round((celsius * 9) / 5 + 32);
  return `${temperature}${configStore.unitSymbol}`;
}

function selectCity(city) {
  selectedCity.value = city;
}

function showDetail(city) {
  router.push({
    name : "weather-detail",
    params : {cityId: city.id},
    query: {
      name : city.name,
      lat : city.lat,
      lon : city.lon,
    },
  });
}

function toggleFavorite(city) {
  favoriteStore.toggleFavorite(city.id);
}

function isFavorite(city) {
  return favoriteStore.isFavorite(city.id);
}

async function loadWeather() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    weatherList.value = await getWeatherList();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadWeather);
</script>

<template>
  <main class="weather-page">
    <section class="hero">
      <div class="hero__heading">
        <div>
          <h1>오늘의 지역별 날씨</h1>
          <p>도시를 검색하고, 카드를 선택해 현재 날씨를 확인하세요.</p>
        </div>
      </div>
    </section>

    <BaseDashboardCard variant="search" aria-label="도시 날씨 검색">
      <SearchBar
        :query="searchQuery"
        :result-count="weatherList.length"
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
      <small>즐겨찾기 {{ favoriteStore.favoriteCount }}개</small>
    </div>

    <BaseDashboardCard variant="content" aria-label="지역별 날씨 목록">
      <template #header>
        <div class="list-heading">
          <h2>지역별 날씨 현황</h2>
        </div>
        <span class="list-heading__count"
          >{{ weatherList.length }}개 도시</span
        >
      </template>

      <div v-if="isLoading" class="weather-message" role="status">
        현재 날씨 정보를 불러오는 중입니다.
      </div>

      <section v-else-if="errorMessage" class="weather-message weather-message--error" role="alert">
        <p>{{ errorMessage }}</p>
        <button type="button" @click="loadWeather">다시 시도</button>
      </section>

      <div v-else-if="weatherList.length" class="weather-grid">
        <WeatherCard
          v-for="city in weatherList"
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

    </BaseDashboardCard>
  </main>
</template>

<style scoped>
.weather-page {
  width: min(1500px, calc(100% - 64px));
  margin: 0 auto;
  padding: 78px 0 90px;
}

.hero {
  margin-bottom: 46px;
}

.hero__eyebrow,
.list-heading p {
  margin: 0 0 10px;
  color: #238c9f;
  font-size: .95rem;
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
  max-width: 1100px;
  font-size: clamp(3.5rem, 6vw, 6rem);
  font-weight: 750;
  letter-spacing: -0.075em;
  line-height: 1;
}

.hero__heading p {
  margin: 16px 0 0;
  color: var(--secondary-color);
  font-size: 1.25rem;
  line-height: 1.5;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 22px 0 18px;
  padding: 18px 22px;
  border-radius: 18px;
  color: #3a3a3c;
  background: #e8f2ff;
  font-size: 1.12rem;
  font-weight: 600;
}

.status-bar span {
  color: #34c759;
  font-size: .88rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
  padding: 22px 26px;
  border-radius: 20px;
  color: #f5f5f7;
  background: #1d1d1f;
}

.summary-card > span {
  color: #f8d66c;
}

.summary-card p {
  flex: 1;
  margin: 0;
  font-size: 1.04rem;
}

.summary-card small {
  color: #a1a1a6;
}

.list-heading p {
  margin-bottom: 5px;
}

.list-heading h2 {
  margin: 0;
  color: var(--heading-color);
  font-size: 2.25rem;
  letter-spacing: -.05em;
}

.list-heading__count {
  padding: 10px 14px;
  border-radius: 99px;
  color: #3a3a3c;
  background: #f2f2f7;
  font-size: 1.08rem;
  font-weight: 700;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.empty-state {
  padding: 65px 20px;
  border: 1px dashed #bfd6dc;
  border-radius: 18px;
  text-align: center;
}

.weather-message {
  padding: 48px 20px;
  color: #66808b;
  text-align: center;
}

.weather-message--error {
  color: #b64646;
}

.weather-message p {
  margin: 0 0 14px;
}

.weather-message button {
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  color: #fff;
  background: #247c8d;
  font-weight: 700;
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

@media (max-width: 820px) {
  .weather-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .weather-page {
    width: min(100% - 28px, 520px);
    padding-top: 46px;
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

  .hero h1 { font-size: clamp(3.15rem, 16vw, 4.5rem); }
}
</style>
