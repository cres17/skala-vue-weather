<script setup>
import { computed } from "vue";

const props = defineProps({
  query: {
    type: String,
    required: true,
  },
  resultCount: {
    type: Number,
    required: true,
  },
  totalCount: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["update-query"]);

const resultLabel = computed(() =>
  props.query
    ? `${props.resultCount}개 검색됨`
    : `전체 ${props.totalCount}개 도시`,
);

function updateQuery(event) {
  // prop은 읽기 전용이므로 입력값을 부모에게 이벤트로 전달한다.
  emit("update-query", event.target.value);
}

function clearQuery() {
  emit("update-query", "");
}
</script>

<template>
  <div class="search-bar">
    <label class="search-bar__field">
      <span class="search-bar__icon" aria-hidden="true">⌕</span>
      <span class="sr-only">도시 검색</span>
      <input
        :value="query"
        type="search"
        placeholder="도시 이름을 입력하세요 (예: 서울)"
        @input="updateQuery"
      />
      <button
        v-if="query"
        class="search-bar__clear"
        type="button"
        aria-label="검색어 지우기"
        @click="clearQuery"
      >
        ×
      </button>
    </label>
    <p class="search-bar__count" aria-live="polite">{{ resultLabel }}</p>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.search-bar__field {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.search-bar__icon {
  color: #5c8a98;
  font-size: 1.75rem;
  line-height: 1;
  transform: rotate(-20deg);
}

.search-bar input {
  width: 100%;
  min-width: 0;
  padding: 7px 0;
  border: 0;
  outline: 0;
  color: var(--text-color);
  background: transparent;
}

.search-bar input::placeholder {
  color: #9aabb3;
}

.search-bar__clear {
  display: grid;
  width: 26px;
  height: 26px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #59717d;
  background: #e8eff2;
}

.search-bar__count {
  margin: 0;
  color: #6e858f;
  font-size: 0.9rem;
  white-space: nowrap;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 560px) {
  .search-bar {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .search-bar__count {
    padding-left: 38px;
  }
}
</style>
