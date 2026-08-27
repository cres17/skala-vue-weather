import axios from "axios";

const outdoorApi = axios.create({
  baseURL: "/api",
  timeout: 8_000,
});

function createDecisionFallback(thermal, air) {
  const reasons = [];
  const inputs = thermal?.inputs || {};

  if (thermal?.available) {
    if (thermal.value > 38) {
      reasons.push({ type: "heat", severity: "danger", title: "바깥이 너무 더워요", detail: `UTCI ${thermal.value}°C로 매우 강한 열 스트레스 구간입니다.` });
    } else if (thermal.value > 32) {
      reasons.push({ type: "heat", severity: "danger", title: "더위에 주의해 주세요", detail: `UTCI ${thermal.value}°C로 강한 열 스트레스 구간입니다.` });
    } else if (thermal.value <= -13) {
      reasons.push({ type: "cold", severity: "danger", title: "바깥이 매우 추워요", detail: `UTCI ${thermal.value}°C로 강한 한랭 스트레스 구간입니다.` });
    } else if (thermal.value <= 0) {
      reasons.push({ type: "cold", severity: "caution", title: "추위에 대비해 주세요", detail: `UTCI ${thermal.value}°C로 한랭 스트레스가 예상됩니다.` });
    }

    if (inputs.solarRadiation >= 2) reasons.push({ type: "radiation", severity: "danger", title: "복사열이 강해요", detail: "기상청 일사량 기준으로 체감 온도가 크게 올라갈 수 있어요." });
    if (inputs.windSpeed >= 10) reasons.push({ type: "wind", severity: "caution", title: "바람이 매우 많이 불어요", detail: `평균 풍속 ${inputs.windSpeed} m/s입니다.` });
    if (inputs.rainfall > 0) reasons.push({ type: "rain", severity: "caution", title: "비가 내리고 있어요", detail: `최근 관측 강수량은 ${inputs.rainfall} mm입니다.` });
  }

  if (air?.available && air.grade >= 4) reasons.push({ type: "air", severity: "danger", title: "대기질이 매우 나빠요", detail: `${air.stationName} 측정소 기준 매우 나쁨입니다.` });
  else if (air?.available && air.grade >= 3) reasons.push({ type: "air", severity: "caution", title: "대기질이 나빠요", detail: `${air.stationName} 측정소 기준 나쁨입니다.` });

  if (!thermal?.available) {
    if (reasons.some((reason) => reason.severity === "danger")) {
      return { available: true, verdict: "avoid", title: "대기질 때문에 외출을 미루는 편이 좋아요", summary: "UTCI는 확인하지 못했지만, 대기질에서 강한 주의 요인이 확인됐습니다.", reasons };
    }
    if (reasons.length) {
      return { available: true, verdict: "caution", title: "대기질을 확인하고 외출해 주세요", summary: "UTCI는 확인하지 못했지만, 대기질에 주의가 필요합니다.", reasons };
    }
    return {
      available: false,
      verdict: "unknown",
      title: "외출 판단 정보가 부족해요",
      summary: "기상청 UTCI 관측값을 받지 못해 안전하게 판별할 수 없습니다.",
      reasons,
    };
  }

  if (reasons.some((reason) => reason.severity === "danger")) {
    return { available: true, verdict: "avoid", title: "지금은 외출을 미루는 편이 좋아요", summary: "야외 환경에 강한 주의 요인이 확인됐습니다. 꼭 나가야 한다면 짧게 이동하고 보호 장비를 준비해 주세요.", reasons };
  }
  if (reasons.length) {
    return { available: true, verdict: "caution", title: "준비하면 외출할 수 있어요", summary: "주의할 환경 요인이 있어요. 아래 안내를 확인하고 활동 시간을 조절해 주세요.", reasons };
  }
  return { available: true, verdict: "good", title: "현재는 야외 활동하기 괜찮아요", summary: "기상청 UTCI 관측값에서 강한 주의 요인이 없습니다.", reasons };
}

function hasDecisionShape(decision) {
  return Boolean(
    decision &&
    typeof decision === "object" &&
    typeof decision.verdict === "string" &&
    typeof decision.title === "string" &&
    Array.isArray(decision.reasons),
  );
}

export async function getOutdoorAssessment(city) {
  const { data } = await outdoorApi.get("/outdoor-assessment", {
    params: {
      cityId: city.id,
      lat: city.lat,
      lon: city.lon,
    },
  });

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("외출 판단 API 응답 형식이 올바르지 않습니다.");
  }

  // An already-open browser can temporarily be connected to a previous API server.
  // Keep the UTCI decision usable when an already-open browser receives an older response.
  return {
    ...data,
    decision: hasDecisionShape(data.decision)
      ? data.decision
      : createDecisionFallback(data.thermal, data.air),
  };
}
