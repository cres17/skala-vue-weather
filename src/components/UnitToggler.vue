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
  gap: 7px;
  padding: 7px 10px;
  border: 1px solid #cfe2e6;
  border-radius: 8px;
  color: #39707d;
  background: #fff;
  font-size: 0.82rem;
  font-weight: 600;
}

.unit-toggler:hover {
  border-color: #72bcc8;
  background: #f0fafa;
}

.unit-toggler__label {
  color: #6c818d;
}

.unit-toggler strong {
  color: #18788a;
}
</style>
