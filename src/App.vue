<script setup>
import UnitToggler from "./components/UnitToggler.vue";
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink class="app-header__brand" to="/weather">Weather Route</RouterLink>
      <nav class="app-header__nav" aria-label="주요 메뉴">
        <RouterLink to="/weather">날씨</RouterLink>
        <RouterLink to="/about">서비스 소개</RouterLink>
        <UnitToggler />
      </nav>
    </header>

    <RouterView :key="$route.fullPath" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 24px 0;
}

.app-header__brand {
  color: var(--heading-color);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  text-decoration: none;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header__nav a {
  padding: 8px 12px;
  border-radius: 8px;
  color: #66808b;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

.app-header__nav a.router-link-active {
  color: #18788a;
  background: #e2f3f3;
}

@media (max-width: 560px) {
  .app-header {
    width: min(100% - 28px, 520px);
    padding: 18px 0;
  }

  .app-header__nav a {
    padding-inline: 8px;
  }
}
</style>
