<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  days: { type: Array, default: () => [] },
  source: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  layout: { type: String, default: "horizontal" },
});

const timeline = ref(null);
const isVertical = computed(() => props.layout === "vertical");

function getIcon(conditionId) {
  if (conditionId >= 200 && conditionId < 300) return "⛈️";
  if (conditionId >= 300 && conditionId < 600) return "🌧️";
  if (conditionId >= 600 && conditionId < 700) return "❄️";
  if (conditionId === 800) return "☀️";
  if (conditionId > 800) return "☁️";
  return "🌫️";
}

function formatDay(date) {
  const dateValue = new Date(`${date}T12:00:00+09:00`);
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }).format(dateValue);
}

function formatTemperature(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°` : "–";
}

function formatProbability(value) {
  return Number.isFinite(value) ? `${Math.round(value)}%` : "–";
}

function scrollTimeline(direction) {
  if (isVertical.value) {
    timeline.value?.scrollBy({ top: direction * 260, behavior: "smooth" });
    return;
  }
  timeline.value?.scrollBy({ left: direction * 420, behavior: "smooth" });
}
</script>

<template>
  <div class="forecast-timeline" :class="{ 'forecast-timeline--vertical': isVertical }">
    <div v-if="loading" class="forecast-timeline__state" role="status">예보를 불러오는 중이에요…</div>
    <div v-else-if="error" class="forecast-timeline__state forecast-timeline__state--error">{{ error }}</div>
    <template v-else>
      <div class="forecast-timeline__controls" :aria-label="isVertical ? '예보 세로 스크롤' : '예보 가로 스크롤'">
        <p>{{ isVertical ? "위아래로 스크롤하세요" : "좌우로 스크롤하세요" }}</p>
        <div class="forecast-timeline__buttons">
          <button type="button" aria-label="이전 예보 보기" @click="scrollTimeline(-1)">{{ isVertical ? "↑" : "←" }}</button>
          <button type="button" aria-label="다음 예보 보기" @click="scrollTimeline(1)">{{ isVertical ? "↓" : "→" }}</button>
        </div>
      </div>
      <div ref="timeline" class="forecast-timeline__track">
        <article v-for="day in days" :key="day.date" class="forecast-day">
          <p class="forecast-day__date">{{ formatDay(day.date) }}</p>
          <span class="forecast-day__icon" aria-hidden="true">{{ getIcon(day.conditionId) }}</span>
          <strong>{{ day.description }}</strong>
          <p v-if="Number.isFinite(day.temperatureMax) || Number.isFinite(day.temperatureMin)" class="forecast-day__temperature">
            <span>{{ formatTemperature(day.temperatureMax) }}</span>
            <small>{{ formatTemperature(day.temperatureMin) }}</small>
          </p>
          <p v-else class="forecast-day__unavailable-metric">중기 기온 자료 미제공</p>
          <dl>
            <div v-if="Number.isFinite(day.precipitationProbability)"><dt>강수확률</dt><dd>{{ formatProbability(day.precipitationProbability) }}</dd></div>
            <div v-if="Number.isFinite(day.precipitationSum)"><dt>강수량</dt><dd>{{ `${day.precipitationSum} mm` }}</dd></div>
          </dl>
        </article>
      </div>
      <p v-if="source" class="forecast-timeline__source">{{ source }}</p>
    </template>
  </div>
</template>

<style scoped>
.forecast-timeline { position: relative; }
.forecast-timeline__track { display: flex; gap: 14px; overflow-x: auto; padding: 2px 2px 16px; scroll-behavior: smooth; scroll-snap-type: x mandatory; scrollbar-color: #c7c7cc transparent; }
.forecast-day { display: grid; flex: 0 0 214px; gap: 12px; min-height: 242px; padding: 22px; border: 1px solid var(--line-color); border-radius: 20px; color: #3a3a3c; background: #fff; scroll-snap-align: start; box-shadow: 0 4px 14px rgb(0 0 0 / 4%); }
.forecast-day__date { margin: 0; color: var(--secondary-color); font-size: .9rem; font-weight: 650; }
.forecast-day__icon { font-size: 2.4rem; line-height: 1; }
.forecast-day strong { min-height: 2.7em; overflow-wrap: anywhere; color: var(--heading-color); font-size: 1.08rem; line-height: 1.35; white-space: pre-line; }
.forecast-day__temperature { margin: 0; color: var(--heading-color); font-size: 1.7rem; font-weight: 750; letter-spacing: -.05em; }
.forecast-day__temperature small { margin-left: 7px; color: #86868b; font-size: 1.05rem; font-weight: 650; }
.forecast-day__unavailable-metric { margin: 0; color: #8b9aa0; font-size: .82rem; font-weight: 700; }
.forecast-day dl { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: auto 0 0; }
.forecast-day dl div { padding-top: 7px; border-top: 1px solid #d9eaed; }
.forecast-day dt { color: #839aa0; font-size: .68rem; font-weight: 700; }
.forecast-day dd { margin: 3px 0 0; color: #4d6e77; font-size: .8rem; font-weight: 800; }
.forecast-timeline__controls { display: flex; align-items: center; justify-content: space-between; gap: 18px; min-height: 50px; margin: 0 0 14px; }
.forecast-timeline__controls p { flex: 1 1 auto; min-width: 0; margin: 0; color: var(--secondary-color); font-size: .96rem; font-weight: 650; }
.forecast-timeline__buttons { display: flex; flex: 0 0 auto; gap: 7px; }
.forecast-timeline__controls button { display: grid; width: 48px; height: 48px; place-items: center; border: 0; border-radius: 50%; color: var(--accent-color); background: #f2f2f7; font: inherit; font-size: 1.18rem; font-weight: 750; }
.forecast-timeline__controls button:hover, .forecast-timeline__controls button:focus-visible { background: #e8e8ed; outline: 0; }
.forecast-timeline__source { margin: 2px 0 0; color: #86868b; font-size: .84rem; font-weight: 600; }
.forecast-timeline__state { padding: 28px; border: 1px dashed #bed5da; border-radius: 18px; color: #5b7c84; background: #f8fcfc; font-size: 1rem; font-weight: 700; text-align: center; }
.forecast-timeline__state--error { border-color: #edc3b2; color: #aa6349; background: #fff8f4; }
.forecast-timeline--vertical { min-height: 0; }
.forecast-timeline--vertical .forecast-timeline__track { display: grid; max-height: 470px; overflow-y: auto; padding: 2px 2px 12px; scroll-snap-type: y mandatory; scrollbar-color: #c7c7cc transparent; }
.forecast-timeline--vertical .forecast-day { grid-template-columns: 88px 46px minmax(0, 1fr) auto; align-items: center; min-height: 82px; padding: 15px 16px; }
.forecast-timeline--vertical .forecast-day__icon { font-size: 1.6rem; }
.forecast-timeline--vertical .forecast-day__temperature { font-size: 1.3rem; white-space: nowrap; }
.forecast-timeline--vertical .forecast-day__temperature small { font-size: .88rem; }
.forecast-timeline--vertical .forecast-day dl { grid-column: 3 / -1; grid-template-columns: auto auto; justify-content: start; gap: 16px; width: auto; margin: 0; }
.forecast-timeline--vertical .forecast-day dl div { padding-top: 0; border-top: 0; }
@media (max-width: 700px) { .forecast-timeline__controls { align-items: flex-start; flex-direction: column; gap: 8px; } .forecast-timeline__buttons { align-self: flex-end; } .forecast-day { flex-basis: 180px; padding: 18px; } .forecast-timeline--vertical .forecast-day { grid-template-columns: 72px 38px minmax(0, 1fr); } .forecast-timeline--vertical .forecast-day__temperature { grid-column: 3; } .forecast-timeline--vertical .forecast-day dl { grid-column: 3; } }
</style>
