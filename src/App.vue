<script setup>
import UnitToggler from "./components/UnitToggler.vue";
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink class="app-header__brand" to="/map" aria-label="Outcast 홈">Outcast</RouterLink>
      <nav class="app-header__nav" aria-label="주요 메뉴">
        <RouterLink to="/map">지도</RouterLink>
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
  position: sticky;
  z-index: 1000;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 76px;
  padding: 12px max(32px, calc((100vw - 1600px) / 2));
  border-bottom: 1px solid rgb(0 0 0 / 7%);
  background: rgb(245 245 247 / 82%);
  backdrop-filter: saturate(180%) blur(22px);
  -webkit-backdrop-filter: saturate(180%) blur(22px);
}

.app-header__brand {
  color: var(--heading-color);
  font-size: 1.7rem;
  font-weight: 750;
  letter-spacing: -0.055em;
  text-decoration: none;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header__nav a {
  min-height: 48px;
  padding: 12px 18px;
  border-radius: 999px;
  color: var(--secondary-color);
  font-size: 1.02rem;
  font-weight: 650;
  text-decoration: none;
}

.app-header__nav a.router-link-active {
  color: var(--heading-color);
  background: rgb(0 0 0 / 6%);
}

.app-header__nav a:hover {
  color: var(--heading-color);
  background: rgb(0 0 0 / 4%);
}

@media (max-width: 700px) {
  .app-header {
    align-items: stretch;
    flex-direction: column;
    gap: 4px;
    min-height: 0;
    padding: 12px 14px 10px;
  }

  .app-header__brand { align-self: flex-start; padding: 4px 8px; font-size: 1.5rem; }
  .app-header__nav { gap: 2px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
  .app-header__nav::-webkit-scrollbar { display: none; }
  .app-header__nav a {
    padding-inline: 12px;
    white-space: nowrap;
  }
}
</style>
