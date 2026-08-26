<template>
  <main class="about-page">
    <section class="about-card">
      <p class="about-card__eyebrow">ABOUT WEATHER ROUTE</p>
      <h1>도시별 날씨를 한눈에 확인하는 연습 서비스입니다.</h1>
      <p>
        검색, 카드 선택, 상세 페이지 이동을 통해 Vue의 컴포넌트 통신과
        Vue Router의 동적 경로를 함께 익힐 수 있도록 구성했습니다.
      </p>

      <dl class="about-card__features">
        <div>
          <dt>지역 검색</dt>
          <dd>원하는 도시의 날씨 카드만 빠르게 확인합니다.</dd>
        </div>
        <div>
          <dt>상세 날씨</dt>
          <dd>카드에서 선택한 도시의 정보를 별도 URL로 보여 줍니다.</dd>
        </div>
        <div>
          <dt>반응형 화면</dt>
          <dd>작은 화면에서도 카드와 메뉴를 편하게 사용할 수 있습니다.</dd>
        </div>
      </dl>

      <RouterLink class="about-card__link" to="/weather">날씨 보러 가기</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.about-page,
.about-card {
  width: min(760px, calc(100% - 40px));
  margin: 0 auto;
}

.about-page {
  padding: 64px 0;
}

.about-card {
  padding: clamp(28px, 7vw, 64px);
  border: 1px solid var(--line-color);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 16px 45px rgb(42 82 101 / 9%);
}

.about-card__eyebrow {
  margin: 0 0 14px;
  color: #238c9f;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.13em;
}

h1 {
  max-width: 560px;
  margin: 0;
  color: var(--heading-color);
  font-size: clamp(2rem, 5vw, 3.1rem);
  letter-spacing: -0.06em;
  line-height: 1.2;
}

h1 + p {
  max-width: 570px;
  margin: 20px 0 0;
  color: #66808b;
  line-height: 1.8;
}

.about-card__features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 34px 0;
}

.about-card__features div {
  padding: 17px;
  border-radius: 15px;
  background: #f1f8f9;
}

dt {
  margin-bottom: 8px;
  color: #18788a;
  font-size: 0.9rem;
  font-weight: 700;
}

dd {
  margin: 0;
  color: #66808b;
  font-size: 0.82rem;
  line-height: 1.55;
}

.about-card__link {
  display: inline-flex;
  padding: 12px 17px;
  border-radius: 10px;
  color: #fff;
  background: #247c8d;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 620px) {
  .about-page,
  .about-card {
    width: min(100% - 28px, 520px);
  }

  .about-page {
    padding: 32px 0;
  }

  .about-card__features {
    grid-template-columns: 1fr;
  }
}
</style>
