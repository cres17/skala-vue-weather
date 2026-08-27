<script setup>
defineProps({
  as: { type: String, default: "section" },
  variant: { type: String, default: "content" },
  ariaLabel: { type: String, default: undefined },
});
</script>

<template>
  <component
    :is="as"
    class="dashboard-card"
    :class="`dashboard-card--${variant}`"
    :aria-label="ariaLabel"
  >
    <header v-if="$slots.header" class="dashboard-card__header">
      <slot name="header" />
    </header>
    <div class="dashboard-card__content"><slot /></div>
    <footer v-if="$slots.footer" class="dashboard-card__footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<style scoped>
.dashboard-card {
  border: 1px solid var(--line-color);
  background: var(--surface-color);
  box-shadow: var(--card-shadow);
}

.dashboard-card--search {
  padding: 20px 26px;
  border-radius: 22px;
}

.dashboard-card--content {
  padding: 38px;
  border-radius: 30px;
}

.dashboard-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.dashboard-card__footer {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--line-color);
}

@media (max-width: 700px) {
  .dashboard-card--content { padding: 18px; }
  .dashboard-card__header { align-items: flex-start; flex-direction: column; }
}
</style>
