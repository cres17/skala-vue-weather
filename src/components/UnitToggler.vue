<script setup>
import { useConfigStore } from "../stores/configStore";

const configStore = useConfigStore();
</script>

<template>
  <button
    class="unit-toggler"
    type="button"
    :aria-label="`온도 단위 변경: 현재 ${configStore.unitSymbol}`"
    @click="configStore.toggleUnit"
  >
    <span class="unit-toggler__label">온도</span>
    <strong>{{ configStore.unitSymbol }}</strong>
  </button>
</template>

<style scoped>
.unit-toggler {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 11px 16px;
  border: 0;
  border-radius: 999px;
  color: var(--secondary-color);
  background: rgb(0 0 0 / 5%);
  font-size: .98rem;
  font-weight: 650;
}

.unit-toggler:hover {
  background: rgb(0 0 0 / 9%);
}

.unit-toggler__label {
  color: var(--secondary-color);
}

.unit-toggler strong {
  color: var(--heading-color);
}
</style>
