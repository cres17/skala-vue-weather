<script setup>
import { ref } from 'vue'

const weatherList = ref([
  {
    id: 'city_01',
    name: '서울',
    temp: 31,
    status: '흐림',
    rainChance: 30,
    humidity: 71,
    wind: '북동풍 2.4m/s',
    showDetails: false,
  },
  {
    id: 'city_02',
    name: '부산',
    temp: 35,
    status: '흐림',
    rainChance: 20,
    humidity: 63,
    wind: '남풍 3.1m/s',
    showDetails: false,
  },
  {
    id: 'city_03',
    name: '도쿄',
    temp: 36,
    status: '맑음',
    rainChance: 0,
    humidity: 48,
    wind: '남서풍 1.8m/s',
    showDetails: false,
  },
  {
    id: 'city_04',
    name: '삿포로',
    temp: 21,
    status: '흐림',
    rainChance: 40,
    humidity: 78,
    wind: '북서풍 2.0m/s',
    showDetails: false,
  },
])

const searchedCity = ref('')
const selectedMessage = ref('카드를 클릭하거나 도시를 검색해 보세요.')

const updateSearchCity = (event) => {
  searchedCity.value = event.target.value
}

const selectCity = (cityName) => {
  selectedMessage.value = `${cityName}이 선택되었습니다.`
}

const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}

const toggleDetails = (city) => {
  city.showDetails = !city.showDetails
}
</script>

<template>
  <section class="weather-mockup">
    <header class="weather-header">
      <p class="weather-kicker">Vue Hands on</p>
      <h1>🌤️ 지역별 날씨 현황</h1>
      <p>오늘의 날씨를 도시별로 확인해 보세요.</p>
    </header>

    <div class="search-panel">
      <label for="city-search">🔎 도시 검색</label>
      <input
        id="city-search"
        type="text"
        :value="searchedCity"
        placeholder="검색할 도시 이름 입력"
        @input="updateSearchCity"
      />
      <p class="search-result">
        검색 중인 도시: <strong>{{ searchedCity || '입력한 도시가 여기에 표시됩니다.' }}</strong>
      </p>
    </div>

    <div class="weather-grid">
      <article
        v-for="city in weatherList"
        :key="city.id"
        class="weather-card"
        :class="{ 'sunny-card': city.status === '맑음', 'cloudy-card': city.status === '흐림' }"
        @click="selectCity(city.name)"
      >
        <div class="card-top">
          <div>
            <p class="city-name">{{ city.name }}</p>
            <p class="weather-status">{{ city.status }}</p>
          </div>
          <p class="temperature">{{ city.temp }}<span>°C</span></p>
        </div>

        <div class="weather-info">
          <span>강수확률 {{ city.rainChance }}%</span>
          <span v-if="city.temp >= 25" class="temperature-label hot">🔥 더움 (25도 이상)</span>
          <span v-else class="temperature-label cool">❄️ 선선함 (25도 미만)</span>
        </div>

        <div v-show="city.showDetails" class="detail-weather">
          <p>습도 {{ city.humidity }}%</p>
          <p>바람 {{ city.wind }}</p>
        </div>

        <div class="card-actions">
          <button type="button" class="toggle-button" @click.stop="toggleDetails(city)">
            <span v-if="city.showDetails">상세 닫기</span>
            <span v-else>상세 날씨 보기</span>
          </button>
          <button
            type="button"
            class="detail-button"
            @click.stop="showDetail(city.name, city.status)"
          >
            알림 보기
          </button>
        </div>
      </article>
    </div>

    <p class="status-bar">{{ selectedMessage }}</p>
  </section>
</template>

<style scoped>
.weather-mockup {
  width: min(100%, 920px);
  margin: 48px auto;
  padding: 36px;
  color: #17324d;
  background: linear-gradient(145deg, #edf7ff 0%, #f8fbff 55%, #eefaf4 100%);
  border: 1px solid #d9e8f3;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(41, 88, 128, 0.12);
}

.weather-header {
  margin-bottom: 28px;
}

.weather-kicker {
  margin-bottom: 6px;
  color: #2d9a72;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.weather-header h1 {
  margin: 0;
  color: #17324d;
  font-size: clamp(1.75rem, 5vw, 2.5rem);
}

.weather-header p:last-child {
  margin-top: 8px;
  color: #59738a;
}

.search-panel {
  display: grid;
  gap: 9px;
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #dce8f0;
  border-radius: 16px;
}

.search-panel label {
  font-weight: 700;
}

.search-panel input {
  width: 100%;
  padding: 12px 14px;
  font: inherit;
  border: 1px solid #b9cddd;
  border-radius: 10px;
}

.search-result {
  color: #59738a;
  font-size: 0.95rem;
}

.search-result strong {
  color: #1d496b;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.weather-card {
  position: relative;
  min-height: 190px;
  padding: 21px;
  background: #ffffff;
  border: 1px solid #dce8f0;
  border-radius: 16px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.weather-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(31, 75, 111, 0.12);
}

.sunny-card {
  background: linear-gradient(145deg, #fffdf1, #ffffff);
  border-color: #f2d98c;
}

.cloudy-card {
  background: linear-gradient(145deg, #f2f6fa, #ffffff);
  border-color: #cbd9e5;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.city-name {
  font-size: 1.2rem;
  font-weight: 800;
}

.weather-status {
  margin-top: 2px;
  color: #658095;
}

.temperature {
  color: #e76f51;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}

.temperature span {
  font-size: 1rem;
}

.weather-info {
  display: grid;
  gap: 9px;
  margin-top: 28px;
  color: #59738a;
  font-size: 0.9rem;
}

.detail-weather {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  color: #42627a;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
}

.temperature-label {
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.hot {
  color: #bd4d3a;
  background: #fff0ea;
}

.cool {
  color: #2876a7;
  background: #eaf6ff;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.detail-button,
.toggle-button {
  padding: 7px 11px;
  color: #226a54;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  background: #e7f6ed;
  border: 1px solid #bfe2cb;
  border-radius: 8px;
  cursor: pointer;
}

.detail-button:hover,
.toggle-button:hover {
  background: #d7f0e1;
}

.status-bar {
  margin-top: 24px;
  padding: 14px 18px;
  color: #226a54;
  font-weight: 700;
  text-align: center;
  background: #e5f5e9;
  border-radius: 12px;
}

@media (max-width: 640px) {
  .weather-mockup {
    margin: 20px auto;
    padding: 22px;
    border-radius: 18px;
  }

  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
