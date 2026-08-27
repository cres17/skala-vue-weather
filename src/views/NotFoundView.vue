<template>
  <main class="not-found-page">
    <section class="not-found-card">
      <span aria-hidden="true">🌦️</span>
      <p>요청한 페이지를 찾을 수 없습니다</p>
      <h1>찾으시는 페이지가 없어요.</h1>
      <RouterLink to="/weather">날씨 목록으로 돌아가기</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.not-found-page {
  display: grid;
  min-height: calc(100vh - 85px);
  padding: 40px 20px;
  place-items: center;
}

.not-found-card {
  max-width: 680px;
  padding: 72px 54px;
  border: 1px solid var(--line-color);
  border-radius: 32px;
  background: #fff;
  box-shadow: var(--card-shadow);
  text-align: center;
}

.not-found-card > span {
  font-size: 4rem;
}

.not-found-card p {
  margin: 25px 0 8px;
  color: var(--accent-color);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.13em;
}

h1 {
  margin: 0 0 25px;
  color: var(--heading-color);
  font-size: clamp(2.7rem, 7vw, 4.4rem);
  letter-spacing: -0.06em;
}

a {
  display: inline-block;
  min-height: 56px;
  padding: 17px 24px;
  border-radius: 999px;
  color: #fff;
  background: var(--accent-color);
  font-weight: 700;
  text-decoration: none;
}
</style>
