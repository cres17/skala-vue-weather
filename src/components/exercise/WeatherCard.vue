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
.weather-card { min-height: 248px; padding: 21px; border: 1px solid var(--line-color); border-radius: 18px; outline: none; background: #fff; box-shadow: 0 8px 25px rgb(56 92 108 / 5%); transition: transform .2s, box-shadow .2s, border-color .2s; }
.weather-card:hover, .weather-card:focus-visible, .weather-card--selected { border-color: #72bcc8; box-shadow: 0 14px 28px rgb(28 98 119 / 13%); transform: translateY(-4px); }
.weather-card--selected { background: linear-gradient(155deg, #fff 55%, #eefafa); }
.weather-card__topline, .weather-card__main, .weather-card__meta div, .weather-card__detail { display: flex; align-items: center; }
.weather-card__topline, .weather-card__detail { justify-content: space-between; }
.weather-card__city { font-size: 1.1rem; font-weight: 700; }
.weather-card__selected-label { margin-left: 8px; padding: 3px 7px; border-radius: 99px; color: #18788a; background: #dff4f4; font-size: .68rem; font-weight: 700; }
.weather-card__favorite { padding: 0; border: 0; color: #91a9b2; background: transparent; font-size: 1.35rem; }
.weather-card__favorite--active { color: #f2b635; }
.weather-card__main { gap: 16px; margin: 21px 0; }
.weather-card__icon { font-size: 3.5rem; filter: drop-shadow(0 5px 4px rgb(94 152 168 / 13%)); }
.weather-card__main strong { color: var(--text-color); font-size: 2rem; letter-spacing: -.07em; }
.weather-card__main p { margin: 4px 0 0; color: #5c9ba5; font-weight: 600; }
.weather-card__meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 19px; padding: 11px 0; border-top: 1px solid #e9eff1; border-bottom: 1px solid #e9eff1; }
.weather-card__meta div { gap: 6px; }
.weather-card__meta dt { color: #8b9da5; font-size: .78rem; }
.weather-card__meta dd { margin: 0; color: #52717e; font-size: .78rem; font-weight: 700; }
.weather-card__detail { width: 100%; padding: 0; border: 0; color: #247c8d; background: transparent; font-size: .9rem; font-weight: 700; }
.weather-card__detail span { font-size: 1.15rem; }
</style>
