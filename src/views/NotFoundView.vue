<template>
  <main class="not-found-page">
    <section class="not-found-card">
      <span aria-hidden="true">🌦️</span>
      <p>404 · NOT FOUND</p>
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
  max-width: 500px;
  padding: 50px 40px;
  border: 1px solid var(--line-color);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 16px 45px rgb(42 82 101 / 9%);
  text-align: center;
}

.not-found-card > span {
  font-size: 4rem;
}

.not-found-card p {
  margin: 25px 0 8px;
  color: #238c9f;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.13em;
}

h1 {
  margin: 0 0 25px;
  color: var(--heading-color);
  font-size: clamp(1.8rem, 6vw, 2.6rem);
  letter-spacing: -0.06em;
}

a {
  display: inline-block;
  padding: 12px 17px;
  border-radius: 10px;
  color: #fff;
  background: #247c8d;
  font-weight: 700;
  text-decoration: none;
}
</style>
