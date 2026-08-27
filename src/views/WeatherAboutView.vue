<template>
  <main class="about-page">
    <section class="about-card">
      <p class="about-card__eyebrow">서비스 소개</p>
      <h1>나가기 전, 필요한 날씨만 빠르게.</h1>
      <p>
        Outcast는 지도에서 지역을 고르고 기상청 현재 관측,
        4~10일 중기예보와 외출 환경을 한곳에서 확인하는 날씨 서비스입니다.
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
  width: min(1520px, calc(100% - 96px));
  margin: 0 auto;
}

.about-page {
  padding: 82px 0;
}

.about-card {
  padding: clamp(48px, 6vw, 92px);
  border: 1px solid var(--line-color);
  border-radius: 32px;
  background: #fff;
  box-shadow: var(--card-shadow);
}

.about-card__eyebrow {
  margin: 0 0 14px;
  color: var(--accent-color);
  font-size: 1rem;
  font-weight: 700;
}

h1 {
  max-width: 1120px;
  margin: 0;
  color: var(--heading-color);
  font-size: clamp(3.5rem, 6vw, 6rem);
  font-weight: 750;
  letter-spacing: -0.075em;
  line-height: 1;
}

h1 + p {
  max-width: 980px;
  margin: 26px 0 0;
  color: var(--secondary-color);
  font-size: 1.25rem;
  line-height: 1.8;
}

.about-card__features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 46px 0;
}

.about-card__features div {
  padding: 24px;
  border-radius: 22px;
  background: #f5f5f7;
}

dt {
  margin-bottom: 8px;
  color: var(--heading-color);
  font-size: 1.25rem;
  font-weight: 700;
}

dd {
  margin: 0;
  color: var(--secondary-color);
  font-size: 1rem;
  line-height: 1.55;
}

.about-card__link {
  display: inline-flex;
  min-height: 56px;
  padding: 17px 24px;
  border-radius: 999px;
  color: #fff;
  background: var(--accent-color);
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 700px) {
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
