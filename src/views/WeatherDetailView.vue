<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getCityById, getWeatherForCity } from "../services/weather";
import { useConfigStore } from "../stores/configStore";

const route = useRoute();
const configStore = useConfigStore();
const city = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");

const formattedTemperature = computed(() => {
  if (!city.value) return "";
  const temperature =
    configStore.unit === "celsius"
      ? city.value.temp
      : Math.round((city.value.temp * 9) / 5 + 32);
  return `${temperature}${configStore.unitSymbol}`;
});

function getRouteCity() {
  const defaultCity = getCityById(route.params.cityId);

  if (defaultCity) return defaultCity;

  const { name, lat, lon} = route.query;
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (
    typeof name !== "string" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  return {
    id : route.params.cityId,
    name,
    lat : latitude,
    lon : longitude,
  };
}

async function loadWeather() {
  const cityConfig = getRouteCity();

  if (!cityConfig) {
    city.value = null;
    errorMessage.value = "요청한 도시를 찾지 못했습니다.";
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    city.value = await getWeatherForCity(cityConfig);
  } catch (error) {
    city.value = null;
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

watch(() => route.params.cityId, loadWeather, { immediate: true });
</script>

<template>
  <main class="detail-page">
    <section v-if="isLoading" class="detail-card detail-card--empty" role="status">
      <p>현재 날씨 정보를 불러오는 중입니다.</p>
    </section>

    <section v-else-if="city" class="detail-card">
      <RouterLink class="detail-card__back" to="/weather">← 지역별 날씨</RouterLink>
      <div class="detail-card__heading">
        <div>
          <p>LOCAL WEATHER DETAIL</p>
          <h1>{{ city.name }}</h1>
          <span>{{ city.status }}</span>
        </div>
        <span class="detail-card__icon" aria-hidden="true">{{ city.icon }}</span>
      </div>

      <div class="detail-card__temperature">{{ formattedTemperature }}</div>
      <p class="detail-card__note">{{ city.note }}</p>

      <dl class="detail-card__metrics">
        <div>
          <dt>습도</dt>
          <dd>{{ city.humidity }}%</dd>
        </div>
        <div>
          <dt>풍속</dt>
          <dd>{{ city.wind }} m/s</dd>
        </div>
        <div>
          <dt>관측 상태</dt>
          <dd>{{ city.status }}</dd>
        </div>
      </dl>
    </section>

    <section v-else class="detail-card detail-card--empty">
      <p>{{ errorMessage }}</p>
      <RouterLink to="/weather">날씨 목록으로 돌아가기</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.detail-page {
  width: min(760px, calc(100% - 40px));
  margin: 0 auto;
  padding: 56px 0;
}

.detail-card {
  padding: clamp(28px, 7vw, 58px);
  border: 1px solid var(--line-color);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 16px 45px rgb(42 82 101 / 9%);
}

.detail-card__back {
  color: #39707d;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
}

.detail-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 46px;
}

.detail-card__heading p {
  margin: 0 0 8px;
  color: #238c9f;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.13em;
}

h1 {
  margin: 0;
  color: var(--heading-color);
  font-size: clamp(2.8rem, 8vw, 5rem);
  letter-spacing: -0.08em;
  line-height: 1;
}

.detail-card__heading span:not(.detail-card__icon) {
  display: inline-block;
  margin-top: 14px;
  padding: 5px 10px;
  border-radius: 99px;
  color: #18788a;
  background: #dff4f4;
  font-size: 0.85rem;
  font-weight: 700;
}

.detail-card__icon {
  font-size: clamp(4.5rem, 14vw, 8rem);
}

.detail-card__temperature {
  margin-top: 38px;
  color: #247c8d;
  font-size: clamp(3.5rem, 9vw, 5.5rem);
  font-weight: 700;
  letter-spacing: -0.09em;
  line-height: 1;
}

.detail-card__note {
  margin: 18px 0 32px;
  color: #66808b;
}

.detail-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 0;
}

.detail-card__metrics div {
  padding: 17px;
  border-radius: 15px;
  background: #f1f8f9;
}

dt {
  margin-bottom: 8px;
  color: #7a929c;
  font-size: 0.78rem;
}

dd {
  margin: 0;
  color: #173b4f;
  font-size: 1rem;
  font-weight: 700;
}

.detail-card--empty {
  color: #66808b;
  text-align: center;
}

.detail-card--empty a {
  display: inline-block;
  margin-top: 8px;
  color: #247c8d;
  font-weight: 700;
}

@media (max-width: 560px) {
  .detail-page {
    width: min(100% - 28px, 520px);
    padding: 32px 0;
  }

  .detail-card__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
