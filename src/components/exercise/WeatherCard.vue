<script setup>
defineProps({
  city: { type: Object, required: true },
  temperature: { type: String, required: true },
  favorite: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
});

const emit = defineEmits(["select-card", "click-detail", "toggle-favorite"]);
</script>

<template>
  <article
    class="weather-card"
    :class="{ 'weather-card--selected': selected }"
    tabindex="0"
    :aria-label="`${city.name} 날씨 카드`"
    @click="emit('select-card', city)"
    @keydown.enter="emit('select-card', city)"
  >
    <div class="weather-card__topline">
      <div>
        <span class="weather-card__city">{{ city.name }}</span>
        <span v-if="selected" class="weather-card__selected-label">선택됨</span>
      </div>
      <button
        class="weather-card__favorite"
        :class="{ 'weather-card__favorite--active': favorite }"
        type="button"
        :aria-label="`${city.name} 즐겨찾기 ${favorite ? '해제' : '추가'}`"
        @click.stop="emit('toggle-favorite', city)"
      >
        {{ favorite ? "★" : "☆" }}
      </button>
    </div>
    <div class="weather-card__main">
      <span class="weather-card__icon" aria-hidden="true">{{ city.icon }}</span>
      <div><strong>{{ temperature }}</strong><p>{{ city.status }}</p></div>
    </div>
    <dl class="weather-card__meta">
      <div><dt>습도</dt><dd>{{ city.humidity }}%</dd></div>
      <div><dt>바람</dt><dd>{{ city.wind }} m/s</dd></div>
    </dl>
    <button class="weather-card__detail" type="button" @click.stop="emit('click-detail', city)">
      상세보기 <span aria-hidden="true">→</span>
    </button>
  </article>
</template>

<style scoped>
.weather-card { min-height: 330px; padding: 30px; border: 1px solid var(--line-color); border-radius: 24px; outline: none; background: #fff; box-shadow: 0 8px 22px rgb(0 0 0 / 4%); transition: transform .2s, box-shadow .2s, border-color .2s; }
.weather-card:hover, .weather-card:focus-visible, .weather-card--selected { border-color: rgb(0 113 227 / 38%); box-shadow: 0 16px 32px rgb(0 0 0 / 9%); transform: translateY(-4px); }
.weather-card--selected { background: #f5f9ff; }
.weather-card__topline, .weather-card__main, .weather-card__meta div, .weather-card__detail { display: flex; align-items: center; }
.weather-card__topline, .weather-card__detail { justify-content: space-between; }
.weather-card__city { color: var(--heading-color); font-size: 1.45rem; font-weight: 700; letter-spacing: -.035em; }
.weather-card__selected-label { margin-left: 8px; padding: 5px 9px; border-radius: 99px; color: #0066cc; background: #e8f2ff; font-size: .84rem; font-weight: 700; }
.weather-card__favorite { padding: 0; border: 0; color: #91a9b2; background: transparent; font-size: 1.65rem; }
.weather-card__favorite--active { color: #f2b635; }
.weather-card__main { gap: 22px; margin: 30px 0; }
.weather-card__icon { font-size: 4.7rem; filter: drop-shadow(0 5px 4px rgb(0 0 0 / 8%)); }
.weather-card__main strong { color: var(--text-color); font-size: 3rem; letter-spacing: -.075em; }
.weather-card__main p { margin: 5px 0 0; color: var(--secondary-color); font-size: 1.08rem; font-weight: 600; }
.weather-card__meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 22px; padding: 15px 0; border-top: 1px solid #e9eff1; border-bottom: 1px solid #e9eff1; }
.weather-card__meta div { gap: 6px; }
.weather-card__meta dt { color: #8b9da5; font-size: 1.02rem; }
.weather-card__meta dd { margin: 0; color: #52717e; font-size: 1.02rem; font-weight: 700; }
.weather-card__detail { width: 100%; min-height: 46px; padding: 0; border: 0; color: var(--accent-color); background: transparent; font-size: 1.15rem; font-weight: 700; }
.weather-card__detail span { font-size: 1.15rem; }
</style>
