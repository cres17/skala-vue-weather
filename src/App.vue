<script setup>
import { computed, ref, watch, watchEffect } from 'vue'

const searchQuery = ref('')
const selectedCityInfo = ref('도시를 선택하면 이곳에 현재 날씨가 표시됩니다.')
const weatherList = ref([
  { id: 'city-01', name: '서울', temp: 28, status: '맑음', icon: '☀️', humidity: 42, wind: 2.4, note: '가벼운 산책을 즐기기 좋은 날씨' },
  { id: 'city-02', name: '수원', temp: 24, status: '비', icon: '🌧️', humidity: 76, wind: 3.1, note: '우산을 챙기는 것이 좋아요' },
  { id: 'city-03', name: '부산', temp: 26, status: '구름', icon: '⛅', humidity: 61, wind: 4.2, note: '해안가에서는 바람이 조금 강해요' },
  { id: 'city-04', name: '제주', temp: 27, status: '맑음', icon: '🌤️', humidity: 58, wind: 5.7, note: '자외선 차단제를 준비하세요' },
  { id: 'city-05', name: '대전', temp: 22, status: '흐림', icon: '☁️', humidity: 68, wind: 1.8, note: '선선한 하루가 이어집니다' },
  { id: 'city-06', name: '광주', temp: 29, status: '맑음', icon: '☀️', humidity: 39, wind: 2.1, note: '낮 동안 더위를 조심하세요' },
])

// 개인 확장 반응형 상태: 온도 단위와 즐겨찾기 목록
const temperatureUnit = ref('C')
const favoriteCityIds = ref([])

const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLowerCase())
const filteredWeatherList = computed(() => {
  if (!normalizedSearchQuery.value) return weatherList.value
  return weatherList.value.filter((city) => city.name.toLowerCase().includes(normalizedSearchQuery.value))
})
const favoriteCities = computed(() => weatherList.value.filter((city) => favoriteCityIds.value.includes(city.id)))
const weatherSummary = computed(() => {
  const hottestCity = [...weatherList.value].sort((a, b) => b.temp - a.temp)[0]
  return `오늘 가장 따뜻한 도시는 ${hottestCity.name}(${formatTemperature(hottestCity.temp)})입니다.`
})

watch(selectedCityInfo, (newMessage, oldMessage) => {
  console.log('[watch] 상태바 문구 변경:', { 이전: oldMessage, 현재: newMessage })
})

watchEffect(() => {
  console.log(`[watchEffect] 현재 검색어: "${searchQuery.value}"`)
})

// 개인 확장 Watcher: 단위가 변경되면 사용자에게 동작을 알립니다.
watch(temperatureUnit, (newUnit) => {
  console.log(`[watch] 온도 표시 단위가 ${newUnit === 'C' ? '섭씨' : '화씨'}로 변경되었습니다.`)
})

function formatTemperature(celsius) {
  return temperatureUnit.value === 'C' ? `${celsius}°C` : `${Math.round((celsius * 9) / 5 + 32)}°F`
}

function selectCity(city) {
  selectedCityInfo.value = `${city.name}이 선택되었습니다. 현재 ${city.status}, ${formatTemperature(city.temp)}입니다.`
}

function showDetail(city) {
  window.alert(`${city.name}의 현재 날씨는 [${city.status}] 상태이며, 기온은 ${formatTemperature(city.temp)}입니다.\n${city.note}`)
}

function toggleFavorite(city) {
  const index = favoriteCityIds.value.indexOf(city.id)
  if (index >= 0) favoriteCityIds.value.splice(index, 1)
  else favoriteCityIds.value.push(city.id)
}

function isFavorite(city) {
  return favoriteCityIds.value.includes(city.id)
}
</script>

<template>
  <main class="app-shell">
    <section class="hero">
      <p class="eyebrow">VUE 3 · COMPOSITION API</p>
      <div class="hero-heading">
        <div>
          <h1>오늘의 지역별 날씨</h1>
          <p>도시를 검색하고, 카드를 선택해 현재 날씨를 확인하세요.</p>
        </div>
        <div class="unit-switch" aria-label="온도 단위 선택">
          <button :class="{ active: temperatureUnit === 'C' }" @click="temperatureUnit = 'C'">°C</button>
          <button :class="{ active: temperatureUnit === 'F' }" @click="temperatureUnit = 'F'">°F</button>
        </div>
      </div>
    </section>

    <section class="toolbar" aria-label="날씨 검색">
      <label class="search-box">
        <span aria-hidden="true">⌕</span>
        <input v-model="searchQuery" type="search" placeholder="도시 이름을 입력하세요 (예: 서울)" />
        <button v-if="searchQuery" class="clear-button" type="button" aria-label="검색어 지우기" @click="searchQuery = ''">×</button>
      </label>
      <p class="result-count">{{ searchQuery ? `${filteredWeatherList.length}개 검색됨` : `전체 ${weatherList.length}개 도시` }}</p>
    </section>

    <p class="status-bar" role="status"><span>●</span>{{ selectedCityInfo }}</p>

    <section class="summary-card">
      <span>✦</span>
      <p>{{ weatherSummary }}</p>
      <small>즐겨찾기 {{ favoriteCities.length }}개</small>
    </section>

    <section v-if="filteredWeatherList.length" class="weather-grid" aria-label="지역별 날씨 목록">
      <article v-for="city in filteredWeatherList" :key="city.id" class="weather-card" tabindex="0" @click="selectCity(city)" @keydown.enter="selectCity(city)">
        <div class="card-topline">
          <span class="city-name">{{ city.name }}</span>
          <button class="favorite-button" type="button" :class="{ favorite: isFavorite(city) }" :aria-label="`${city.name} 즐겨찾기`" @click.stop="toggleFavorite(city)">{{ isFavorite(city) ? '★' : '☆' }}</button>
        </div>
        <div class="weather-main">
          <span class="weather-icon" aria-hidden="true">{{ city.icon }}</span>
          <div><strong>{{ formatTemperature(city.temp) }}</strong><p>{{ city.status }}</p></div>
        </div>
        <dl class="weather-meta"><div><dt>습도</dt><dd>{{ city.humidity }}%</dd></div><div><dt>바람</dt><dd>{{ city.wind }} m/s</dd></div></dl>
        <button class="detail-button" type="button" @click.stop="showDetail(city)">상세보기 <span>→</span></button>
      </article>
    </section>

    <section v-else class="empty-state">
      <span>🌫️</span><h2>일치하는 도시가 없어요</h2><p>다른 도시 이름으로 다시 검색해 보세요.</p>
      <button type="button" @click="searchQuery = ''">전체 도시 보기</button>
    </section>
  </main>
</template>
