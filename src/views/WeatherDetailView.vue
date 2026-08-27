<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ForecastTimeline from "../components/ForecastTimeline.vue";
import { getOutdoorAssessment } from "../services/outdoorAssessment";
import { getCityById, getForecastForCity, getWeatherForCity } from "../services/weather";
import { useConfigStore } from "../stores/configStore";
import { useWeatherStore } from "../stores/weatherStore";
import outdoorCheckBadge from "../assets/outdoor-check-badge.png";

const route = useRoute();
const configStore = useConfigStore();
const weatherStore = useWeatherStore();
const city = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");
const outdoorAssessment = ref(null);
const outdoorErrorMessage = ref("");
const isOutdoorPanelOpen = ref(false);
const isOutdoorAssessmentLoading = ref(false);
const forecast = ref(null);
const forecastError = ref("");
const isForecastLoading = ref(false);
let loadSequence = 0;

const utciUnavailableMessage = computed(() => (
  outdoorAssessment.value?.thermal?.message
  || outdoorErrorMessage.value
  || "현재 UTCI 관측값을 받을 수 없습니다."
));

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

function getUtciTone(thermal){
  if (!thermal?.available) return "is-unavailable";

  const value = thermal.value;

  if (value <= 0) return "is-cold";
  if (value <= 9) return "is-cool";
  if (value <= 26) return "is-comfortable";
  if (value <= 32) return "is-warm";
  return "is-hot";
}

function getAirTone(air) {
  if (!air?.available) return "is-unavailable";
  return {
    1: "is-sky",
    2: "is-sky-light",
    3: "is-yellow",
    4: "is-orange",
  }[air.grade] || "is-sky-light";
}

function getDecisionIcon(type) {
  return {
    heat: "🌡️",
    cold: "🧣",
    radiation: "☀️",
    wind: "💨",
    rain: "🌧️",
    air: "😷",
  }[type] || "•";
}

async function loadWeather() {
  const sequence = ++loadSequence;
  const cityConfig = getRouteCity();

  if (!cityConfig) {
    city.value = null;
    errorMessage.value = "요청한 도시를 찾지 못했습니다.";
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";
  outdoorAssessment.value = null;
  outdoorErrorMessage.value = "";
  isOutdoorPanelOpen.value = false;
  isOutdoorAssessmentLoading.value = false;
  forecast.value = null;
  forecastError.value = "";
  isForecastLoading.value = false;

  try {
    city.value = weatherStore.getWeather(cityConfig.id) || await getWeatherForCity(cityConfig);
  } catch (error) {
    city.value = null;
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }

  if (!city.value) return;

  isOutdoorAssessmentLoading.value = true;
  getOutdoorAssessment(cityConfig)
    .then((assessment) => {
      if (sequence === loadSequence) outdoorAssessment.value = assessment;
    })
    .catch((error) => {
      if (sequence === loadSequence) outdoorErrorMessage.value = error.message;
    })
    .finally(() => {
      if (sequence === loadSequence) isOutdoorAssessmentLoading.value = false;
    });

  isForecastLoading.value = true;
  getForecastForCity(cityConfig)
    .then((data) => {
      if (sequence === loadSequence) forecast.value = data;
    })
    .catch((error) => {
      if (sequence === loadSequence) forecastError.value = error.message;
    })
    .finally(() => {
      if (sequence === loadSequence) isForecastLoading.value = false;
    });
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

      <section class="detail-card__indices" aria-label="야외 환경 지수">
        <article class="index-card index-card--utci" :class="getUtciTone(outdoorAssessment?.thermal)">
          <template v-if="outdoorAssessment?.thermal?.available">
            <p class="index-card__eyebrow">체감 온도 (UTCI)</p>
            <strong>{{ outdoorAssessment.thermal.value }}°C</strong>
            <span class="index-card__status">{{ outdoorAssessment.thermal.stress }}</span>
            <p>기상청 관측값 기반 추정 · 관측소 {{ outdoorAssessment.thermal.stationId }} · 최근 1시간 이내</p>
            <dl class="index-card__inputs">
              <div><dt>기온</dt><dd>{{ outdoorAssessment.thermal.inputs.temperature }}°C</dd></div>
              <div><dt>풍속</dt><dd>{{ outdoorAssessment.thermal.inputs.windSpeed }} m/s</dd></div>
            </dl>
          </template>
          <div v-else class="index-card__unavailable index-card__unavailable--utci" role="status">
            <span class="index-card__unavailable-icon" aria-hidden="true">—</span>
            <div class="index-card__unavailable-copy">
              <p class="index-card__unavailable-kicker">UTCI 관측 상태</p>
              <strong>UTCI 정보가 없습니다.</strong>
              <p>{{ utciUnavailableMessage }}</p>
              <small>기상청 관측이 갱신되면 자동으로 다시 반영됩니다.</small>
            </div>
          </div>
        </article>

        <article class="index-card index-card--air" :class="getAirTone(outdoorAssessment?.air)">
          <template v-if="outdoorAssessment?.air?.available">
            <p class="index-card__eyebrow">대기질 · AIRKOREA</p>
            <strong>{{ outdoorAssessment.air.label }}</strong>
            <span class="index-card__status">통합대기환경지수 {{ outdoorAssessment.air.khaiValue ?? "—" }}</span>
            <p>{{ outdoorAssessment.air.stationName }} 측정소 · {{ outdoorAssessment.air.observedAt }}</p>
            <dl class="index-card__inputs">
              <div><dt>미세먼지</dt><dd>{{ outdoorAssessment.air.pm10 ?? "—" }} ㎍/㎥</dd></div>
              <div><dt>초미세먼지</dt><dd>{{ outdoorAssessment.air.pm25 ?? "—" }} ㎍/㎥</dd></div>
            </dl>
          </template>
          <div v-else class="index-card__unavailable" role="status">
            <span class="index-card__unavailable-icon" aria-hidden="true">—</span>
            <div>
              <p class="index-card__unavailable-kicker">대기질 관측 상태</p>
              <strong>대기질 정보가 없습니다.</strong>
              <p>{{ outdoorAssessment?.air?.message || "대기질 정보를 불러오는 중입니다." }}</p>
              <small>대기환경정보 API 연결 후 자동으로 표시됩니다.</small>
            </div>
          </div>
        </article>

      </section>

      <section class="detail-card__forecast" aria-label="일기 예보">
        <div class="detail-card__forecast-heading">
          <div>
            <p>기상청 중기예보</p>
            <h2>기상청 중기 예보 · 4~10일</h2>
          </div>
        </div>
        <ForecastTimeline
          :days="forecast?.midRange?.days"
          :source="forecast?.midRange?.source"
          :loading="isForecastLoading"
          :error="forecastError"
        />
      </section>
    </section>

    <section v-else class="detail-card detail-card--empty">
      <p>{{ errorMessage }}</p>
      <RouterLink to="/weather">날씨 목록으로 돌아가기</RouterLink>
    </section>

    <button
      v-if="!isLoading && city"
      type="button"
      class="outdoor-check-trigger"
      aria-label="외출 가능 여부 판단 보기"
      :aria-expanded="isOutdoorPanelOpen"
      @click="isOutdoorPanelOpen = !isOutdoorPanelOpen"
    >
      <img :src="outdoorCheckBadge" alt="" />
      <span>외출 판단</span>
    </button>

    <aside
      v-if="isOutdoorPanelOpen"
      class="outdoor-decision-panel"
      :class="`outdoor-decision-panel--${outdoorAssessment?.decision?.verdict || 'unknown'}`"
      role="dialog"
      aria-label="야외 활동 판단"
    >
      <button class="outdoor-decision-panel__close" type="button" aria-label="외출 판단 닫기" @click="isOutdoorPanelOpen = false">×</button>
      <template v-if="outdoorAssessment?.decision">
        <p class="outdoor-decision-panel__eyebrow">외출 판단</p>
        <h2>{{ outdoorAssessment.decision.title }}</h2>
        <p class="outdoor-decision-panel__summary">{{ outdoorAssessment.decision.summary }}</p>

        <ul v-if="outdoorAssessment.decision.reasons.length" class="outdoor-reasons">
          <li v-for="reason in outdoorAssessment.decision.reasons" :key="`${reason.type}-${reason.title}`" :class="`outdoor-reasons__item--${reason.severity}`">
            <span class="outdoor-reasons__icon" aria-hidden="true">{{ getDecisionIcon(reason.type) }}</span>
            <div>
              <strong>{{ reason.title }}</strong>
              <p>{{ reason.detail }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="outdoor-decision-panel__clear">✓ 현재 확인 가능한 지표에서 강한 주의 요인이 없습니다.</p>

        <p class="outdoor-decision-panel__source">기상청 관측 UTCI·일사량·풍속·강수량과 AirKorea 대기질 기준</p>
      </template>
      <div v-else-if="isOutdoorAssessmentLoading" class="outdoor-decision-panel__loading">
        <span aria-hidden="true">⌁</span>
        <div>
          <strong>외출 환경을 확인하고 있어요</strong>
          <p>기상청 UTCI 관측값을 받는 중입니다.</p>
        </div>
      </div>
      <div v-else class="outdoor-decision-panel__loading outdoor-decision-panel__loading--error" role="alert">
        <span aria-hidden="true">!</span>
        <div>
          <strong>외출 판단 정보를 준비하지 못했어요</strong>
          <p>{{ outdoorErrorMessage || "판정 데이터가 없는 응답을 받았습니다. 잠시 후 다시 시도해 주세요." }}</p>
        </div>
      </div>
    </aside>
  </main>
</template>

<style scoped>
.detail-page {
  position: relative;
  width: min(1180px, calc(100% - 96px));
  margin: 0 auto;
  padding: 72px 0 86px;
}

.detail-card {
  padding: clamp(42px, 5vw, 70px);
  border: 1px solid var(--line-color);
  border-radius: 32px;
  background: #fff;
  box-shadow: var(--card-shadow);
}

.detail-card__back {
  color: var(--accent-color);
  font-size: 1.05rem;
  font-weight: 700;
  text-decoration: none;
}

.detail-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 58px;
}

.detail-card__heading p {
  margin: 0 0 8px;
  color: #238c9f;
  font-size: .98rem;
  font-weight: 700;
  letter-spacing: 0.13em;
}

h1 {
  margin: 0;
  color: var(--heading-color);
  font-size: clamp(4rem, 8vw, 7rem);
  font-weight: 750;
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
  font-size: 1.04rem;
  font-weight: 700;
}

.detail-card__icon {
  font-size: clamp(4.5rem, 14vw, 8rem);
}

.detail-card__temperature {
  margin-top: 48px;
  color: var(--heading-color);
  font-size: clamp(5rem, 9vw, 7.5rem);
  font-weight: 750;
  letter-spacing: -0.09em;
  line-height: 1;
}

.detail-card__note {
  margin: 20px 0 42px;
  font-size: 1.15rem;
  color: var(--secondary-color);
}

.detail-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 0;
}

.detail-card__metrics div {
  padding: 26px;
  border-radius: 20px;
  background: #f5f5f7;
}

.detail-card__indices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 920px;
  gap: 22px;
  margin-top: 42px;
}

.detail-card__forecast {
  margin-top: 46px;
  padding-top: 42px;
  border-top: 1px solid var(--line-color);
}

.detail-card__forecast-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin: 0 0 22px;
}

.detail-card__forecast-heading p {
  margin: 0 0 7px;
  color: var(--secondary-color);
  font-size: .9rem;
  font-weight: 650;
}

.detail-card__forecast-heading h2 {
  margin: 0;
  color: var(--heading-color);
  font-size: 2.35rem;
  letter-spacing: -.055em;
}

.detail-card__forecast-heading > span {
  color: #799299;
  font-size: .96rem;
  font-weight: 700;
}

.detail-card__forecast-heading--extended {
  margin-top: 42px;
}

.index-card {
  position: relative;
  min-height: 276px;
  overflow: hidden;
  padding: 30px;
  border: 1px solid #a9d8eb;
  border-radius: 26px;
  background:
    radial-gradient(circle at 100% 0%, rgb(139 211 241 / 38%), transparent 42%),
    linear-gradient(145deg, #eaf8ff, #fff 72%);
  box-shadow: 0 12px 28px rgb(43 130 168 / 8%);
}

.index-card--air {
  border-color: #c8dceb;
  background:
    radial-gradient(circle at 100% 0%, rgb(170 221 245 / 42%), transparent 42%),
    linear-gradient(145deg, #eefaff, #fff 72%);
  box-shadow: 0 12px 28px rgb(58 131 169 / 8%);
}

.index-card::after {
  position: absolute;
  top: -42px;
  right: -32px;
  width: 120px;
  height: 120px;
  border: 1px solid rgb(70 158 198 / 15%);
  border-radius: 50%;
  content: "";
  pointer-events: none;
}

.index-card--air::after {
  border-color: rgb(86 168 210 / 18%);
}

/* UTCI: 차가움(파랑) → 쾌적(민트) → 더움(빨강) */
.index-card.is-cold {
  border-color: #75bde6;
  background: linear-gradient(145deg, #dff4ff, #fff 72%);
}

.index-card.is-cold strong { color: #1979b0; }

.index-card.is-cool {
  border-color: #9ccfe2;
  background: linear-gradient(145deg, #e9f8ff, #fff 72%);
}

.index-card.is-comfortable {
  border-color: #99d6bd;
  background: linear-gradient(145deg, #e9faf2, #fff 72%);
}

.index-card.is-comfortable strong { color: #218265; }

.index-card.is-warm {
  border-color: #edc06e;
  background: linear-gradient(145deg, #fff7e6, #fff 72%);
}

.index-card.is-warm strong { color: #ad7600; }

.index-card.is-hot {
  border-color: #ef9898;
  background: linear-gradient(145deg, #fff0f0, #fff 72%);
}

.index-card.is-hot strong { color: #c64d4d; }

/* 상태별 강조색 */
.index-card--air.is-sky {
  border-color: #7dc9ea;
  background: linear-gradient(145deg, #e3f7ff, #fff 72%);
}

.index-card--air.is-sky-light {
  border-color: #acd9ed;
  background: linear-gradient(145deg, #effaff, #fff 72%);
}

.index-card--air.is-yellow {
  border-color: #e6cf72;
  background: linear-gradient(145deg, #fffbe4, #fff 72%);
}

.index-card--air.is-yellow strong { color: #a77900; }

.index-card--air.is-orange {
  border-color: #efa66d;
  background: linear-gradient(145deg, #fff1e7, #fff 72%);
}

.index-card--air.is-orange strong { color: #c55d30; }

.index-card__eyebrow {
  position: relative;
  z-index: 1;
  margin: 0 0 22px;
  color: #247d9f;
  font-size: .9rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.index-card--air .index-card__eyebrow {
  color: #277ba9;
}

.index-card strong {
  position: relative;
  z-index: 1;
  display: block;
  color: #1479a8;
  font-size: clamp(2.4rem, 6vw, 3.35rem);
  letter-spacing: -0.07em;
  line-height: 1;
}

.index-card--air strong {
  color: #2981ae;
}

.index-card__status {
  position: relative;
  z-index: 1;
  display: inline-block;
  margin-top: 13px;
  padding: 6px 10px;
  border-radius: 999px;
  color: #116e93;
  background: #d8f2fc;
  font-size: .96rem;
  font-weight: 700;
}

.index-card--air .index-card__status {
  color: #14739e;
  background: #daf1fc;
}

.index-card > p:not(.index-card__eyebrow):not(.index-card__unavailable) {
  position: relative;
  z-index: 1;
  margin: 13px 0 18px;
  color: #66808b;
  font-size: .98rem;
}

.index-card__inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0;
}

.index-card__inputs div {
  position: relative;
  z-index: 1;
  padding-top: 12px;
  border-top: 1px solid rgb(58 146 185 / 18%);
}

.index-card__inputs dt {
  margin-bottom: 4px;
  color: #7a929c;
  font-size: .9rem;
}

.index-card__inputs dd {
  color: #173b4f;
  font-size: .98rem;
}

.index-card__unavailable--utci {
  position: relative;
  z-index: 1;
  display: block;
  min-width: 0;
  padding: 2px 0 0;
  color: #52666e;
  line-height: 1.5;
}

.index-card__unavailable-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 122px;
  height: 98px;
  overflow: hidden;
  border: 1px solid #f0cfc3;
  border-radius: 28px;
  color: #dc765c;
  background:
    radial-gradient(circle at 20% 18%, #fff 0 5px, transparent 5.5px),
    radial-gradient(circle at 80% 75%, #fff 0 4px, transparent 4.5px),
    linear-gradient(145deg, #ffece5, #fff9f5);
  box-shadow: inset 0 0 0 7px rgb(255 255 255 / 65%), 0 14px 28px rgb(197 107 75 / 13%);
  font-family: ui-rounded, "Arial Rounded MT Bold", sans-serif;
  font-size: 3.1rem;
  font-weight: 900;
  letter-spacing: -.2em;
  line-height: 1;
}

.index-card__unavailable-hero::before,
.index-card__unavailable-hero::after {
  position: absolute;
  width: 44px;
  height: 44px;
  border: 8px solid rgb(255 255 255 / 60%);
  border-radius: 999px;
  content: "";
}

.index-card__unavailable-hero::before {
  top: -24px;
  left: -20px;
}

.index-card__unavailable-hero::after {
  right: -22px;
  bottom: -26px;
}

.index-card__unavailable-hero span,
.index-card__unavailable-hero i {
  position: relative;
  z-index: 1;
  font-style: normal;
}

.index-card__unavailable-hero i {
  display: grid;
  width: 31px;
  height: 31px;
  margin: 0 4px;
  place-items: center;
  border-radius: 11px;
  color: #e79c52;
  background: #fff;
  box-shadow: 0 7px 12px rgb(202 111 75 / 16%);
  font-size: 1.45rem;
  letter-spacing: 0;
  transform: rotate(-10deg);
}

.index-card__unavailable-copy {
  min-width: 0;
  margin-top: 17px;
}

.index-card__unavailable-kicker {
  margin: 0 0 10px !important;
  color: #c26a52 !important;
  font-size: .68rem !important;
  font-weight: 800;
  letter-spacing: .13em;
  overflow-wrap: anywhere;
}

.index-card__unavailable--utci strong {
  display: block;
  color: #254d59;
  font-size: clamp(1.26rem, 2vw, 1.44rem);
  letter-spacing: -.045em;
  line-height: 1.15;
}

.index-card__unavailable-copy > p:not(.index-card__unavailable-kicker) {
  margin: 12px 0 8px;
  color: #5c6f76;
  font-size: 1.02rem;
  font-weight: 600;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

.index-card__unavailable--utci small {
  display: block;
  color: #8c7770;
  font-size: .92rem;
  font-weight: 600;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

.index-card--utci:has(.index-card__unavailable) {
  min-height: 338px;
  border: 1px solid #ebc6b7;
  background:
    linear-gradient(90deg, rgb(239 162 135 / 13%) 1px, transparent 1px),
    linear-gradient(rgb(239 162 135 / 13%) 1px, transparent 1px),
    linear-gradient(145deg, #fff3ed, #fff 72%);
  background-size: 20px 20px, 20px 20px, auto;
  box-shadow: 0 18px 38px rgb(139 78 54 / 12%);
}

.index-card--utci:has(.index-card__unavailable)::after {
  top: -48px;
  right: -48px;
  width: 138px;
  height: 138px;
  border: 18px solid rgb(232 149 120 / 15%);
}

.index-card__unavailable:not(.index-card__unavailable--utci) {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 10px 0 0;
  color: #71828a;
  line-height: 1.45;
}

.index-card__unavailable-icon {
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 11px;
  color: #387a9c;
  background: #e1f2fa;
  font-size: 1.25rem;
  font-weight: 700;
}

.index-card__unavailable:not(.index-card__unavailable--utci) strong {
  display: block;
  color: #42636c;
  font-size: 1.08rem;
  letter-spacing: -.02em;
}

.index-card__unavailable:not(.index-card__unavailable--utci) p {
  margin: 5px 0 4px;
  font-size: .95rem;
}

.index-card__unavailable:not(.index-card__unavailable--utci) small {
  display: block;
  color: #8a9ba1;
  font-size: .84rem;
}

dt {
  margin-bottom: 8px;
  color: #7a929c;
  font-size: .98rem;
}

dd {
  margin: 0;
  color: #173b4f;
  font-size: 1.22rem;
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

.outdoor-check-trigger {
  position: absolute;
  top: 154px;
  left: calc(100% + 24px);
  display: grid;
  justify-items: center;
  gap: 5px;
  width: 152px;
  padding: 0;
  border: 0;
  color: #286f83;
  background: transparent;
  font: inherit;
  font-size: 1.04rem;
  font-weight: 800;
  line-height: 1.1;
}

.outdoor-check-trigger img {
  width: 132px;
  height: 132px;
  border-radius: 50%;
  box-shadow: 0 10px 22px rgb(27 118 170 / 28%);
  transition: transform .2s, box-shadow .2s;
}

.outdoor-check-trigger:hover img,
.outdoor-check-trigger:focus-visible img {
  box-shadow: 0 14px 28px rgb(27 118 170 / 36%);
  transform: translateY(-3px) scale(1.04);
}

.outdoor-check-trigger:focus-visible { outline: 2px solid #278fa6; outline-offset: 5px; border-radius: 12px; }

.outdoor-decision-panel {
  position: fixed;
  z-index: 20;
  top: 88px;
  right: 30px;
  width: min(450px, calc(100vw - 42px));
  max-height: calc(100vh - 112px);
  overflow: auto;
  padding: 34px;
  border: 1px solid #f0d2b9;
  border-radius: 24px;
  background: #fffaf6;
  box-shadow: 0 22px 52px rgb(91 53 28 / 22%);
  animation: decision-panel-in .22s ease both;
}

@keyframes decision-panel-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }

.outdoor-decision-panel--avoid { border-color: #efa5a0; background: linear-gradient(150deg, #fff0ef, #fff 55%); }
.outdoor-decision-panel--caution { border-color: #edcf82; background: linear-gradient(150deg, #fff9e7, #fff 55%); }
.outdoor-decision-panel--good { border-color: #9dd6be; background: linear-gradient(150deg, #edfaf3, #fff 55%); }
.outdoor-decision-panel--unknown { border-color: #cbd9de; background: #f8fbfc; }

.outdoor-decision-panel__close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  color: #6f858c;
  background: rgb(255 255 255 / 72%);
  font-size: 1.35rem;
  line-height: 1;
}

.outdoor-decision-panel__eyebrow { margin: 0 0 9px; color: #cc6848; font-size: .86rem; font-weight: 800; letter-spacing: .15em; }
.outdoor-decision-panel--caution .outdoor-decision-panel__eyebrow { color: #aa7c13; }
.outdoor-decision-panel--good .outdoor-decision-panel__eyebrow { color: #268461; }
.outdoor-decision-panel h2 { max-width: calc(100% - 30px); margin: 0; color: #3c4142; font-size: 1.75rem; letter-spacing: -.055em; line-height: 1.18; }
.outdoor-decision-panel__summary { margin: 14px 0 22px; color: #65777c; font-size: .96rem; line-height: 1.58; }
.outdoor-reasons { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.outdoor-reasons li { display: flex; align-items: flex-start; gap: 12px; padding: 15px; border: 1px solid #efd0c7; border-radius: 16px; background: rgb(255 255 255 / 74%); }
.outdoor-reasons__item--caution { border-color: #ead89d !important; }
.outdoor-reasons__icon { display: grid; flex: 0 0 auto; width: 36px; height: 36px; place-items: center; border-radius: 12px; background: #ffe2d9; font-size: 1.12rem; }
.outdoor-reasons__item--caution .outdoor-reasons__icon { background: #fff2c9; }
.outdoor-reasons strong { color: #504b49; font-size: .96rem; }
.outdoor-reasons p { margin: 5px 0 0; color: #738186; font-size: .84rem; line-height: 1.48; }
.outdoor-decision-panel__clear { margin: 0; padding: 13px; border-radius: 13px; color: #28765b; background: #def5e8; font-size: .82rem; line-height: 1.5; }
.outdoor-decision-panel__source { margin: 17px 0 0; color: #91a0a3; font-size: .82rem; line-height: 1.45; }
.outdoor-decision-panel__loading { display: flex; align-items: flex-start; gap: 12px; color: #71828a; }
.outdoor-decision-panel__loading > span { display: grid; flex: 0 0 auto; width: 36px; height: 36px; place-items: center; border-radius: 12px; background: #e7eff1; font-size: 1.35rem; }
.outdoor-decision-panel__loading strong { display: block; color: #4f6870; font-size: 1.08rem; }
.outdoor-decision-panel__loading p { margin: 5px 0 0; font-size: .95rem; }
.outdoor-decision-panel__loading--error { color: #9a4d3a; }
.outdoor-decision-panel__loading--error > span { color: #b44e38; background: #ffe5dc; font-weight: 800; }

.detail-card { border-radius: 32px; box-shadow: var(--card-shadow); }
.detail-card__heading { margin-top: 42px; }
.detail-card__temperature { margin-top: 34px; }
.detail-card__metrics div { border: 0; border-radius: 20px; background: #f5f5f7; }
.index-card,
.index-card--air,
.index-card--utci:has(.index-card__unavailable) {
  min-height: 250px;
  border: 1px solid #dce7ea;
  border-top: 3px solid #5aafbf;
  border-radius: 22px;
  background: #fff;
  box-shadow: none;
}
.index-card::after,
.index-card--utci:has(.index-card__unavailable)::after { display: none; }
.index-card.is-cold { border-top-color: #5b9fca; }
.index-card.is-comfortable { border-top-color: #55a77f; }
.index-card.is-warm { border-top-color: #c69740; }
.index-card.is-hot { border-top-color: #c96b62; }
.index-card--air.is-yellow { border-top-color: #c39b3d; }
.index-card--air.is-orange { border-top-color: #c87848; }
.index-card__eyebrow { margin-bottom: 18px; color: #58727b; font-size: .76rem; }
.index-card strong { color: #1d6479; }
.index-card__status { border-radius: 8px; background: #edf6f7; }
.index-card__unavailable--utci { display: flex; align-items: flex-start; gap: 12px; padding-top: 24px; }
.index-card__unavailable-copy { margin-top: 0; }
.index-card__unavailable-kicker { color: #657b83 !important; }
.index-card__unavailable-copy > p:not(.index-card__unavailable-kicker) { margin-top: 8px; font-weight: 400; }
.index-card__unavailable--utci small { color: #7b8b90; }
.outdoor-check-trigger { left: calc(100% + 20px); width: 174px; padding: 18px 14px; border: 1px solid var(--line-color); border-radius: 26px; color: var(--heading-color); background: #fff; box-shadow: var(--card-shadow); font-size: 1.12rem; }
.outdoor-check-trigger img { width: 118px; height: 118px; border-radius: 22px; box-shadow: none; }
.outdoor-check-trigger:hover img, .outdoor-check-trigger:focus-visible img { box-shadow: none; transform: none; }
.outdoor-decision-panel { border-color: var(--line-color); border-radius: 24px; background: #fff; box-shadow: 0 22px 52px rgb(0 0 0 / 16%); }
.outdoor-decision-panel--avoid, .outdoor-decision-panel--caution, .outdoor-decision-panel--good, .outdoor-decision-panel--unknown { background: #fff; }

@media (max-width: 1000px) {
  .detail-page { width: min(760px, calc(100% - 40px)); padding-top: 56px; }
  .outdoor-check-trigger { top: 14px; left: auto; right: 14px; }
}

@media (max-width: 700px) {
  .detail-page {
    width: min(100% - 28px, 520px);
    padding: 32px 0;
  }

  .detail-card__metrics {
    grid-template-columns: 1fr;
  }

  .detail-card__indices {
    grid-template-columns: 1fr;
  }

  .detail-card__forecast-heading { align-items: flex-start; flex-direction: column; gap: 8px; }

  .outdoor-check-trigger { top: 8px; right: 4px; width: 104px; padding: 10px 8px; font-size: .78rem; }
  .outdoor-check-trigger img { width: 76px; height: 76px; }
  .outdoor-decision-panel { top: auto; right: 12px; bottom: 12px; width: calc(100vw - 24px); max-height: min(610px, calc(100vh - 24px)); padding: 23px; }
}
</style>
