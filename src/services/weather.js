import axios from "axios";

const weatherApi = axios.create({
  baseURL: "https://api.openweathermap.org/data/2.5",
  timeout: 10_000,
});

const kmaForecastApi = axios.create({
  baseURL:
    "https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0",
  timeout: 10_000,
});

const KMA_FORECAST_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];

const cities = [
  { id: "seoul", name: "서울", lat: 37.5665, lon: 126.978 },
  { id: "suwon", name: "수원", lat: 37.2636, lon: 127.0286 },
  { id: "busan", name: "부산", lat: 35.1796, lon: 129.0756 },
  { id: "jeju", name: "제주", lat: 33.4996, lon: 126.5312 },
  { id: "daejeon", name: "대전", lat: 36.3504, lon: 127.3845 },
  { id: "gwangju", name: "광주", lat: 35.1595, lon: 126.8526 },
];

function getWeatherIcon(conditionId) {
  if (conditionId >= 200 && conditionId < 300) return "⛈️";
  if (conditionId >= 300 && conditionId < 600) return "🌧️";
  if (conditionId >= 600 && conditionId < 700) return "❄️";
  if (conditionId === 800) return "☀️";
  if (conditionId > 800) return "☁️";
  return "🌫️";
}

function getWeatherNote(conditionId) {
  if (conditionId >= 200 && conditionId < 600) return "외출 전 우산을 챙겨 주세요.";
  if (conditionId >= 600 && conditionId < 700) return "미끄러운 길을 조심해 주세요.";
  if (conditionId === 800) return "자외선 차단제를 준비하세요.";
  return "현재 날씨 정보를 확인해 보세요.";
}

function getApiKey() {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenWeather API 키가 설정되지 않았습니다.");
  }

  return apiKey;
}

function toWeatherCity(city, weather) {
  const condition = weather.weather?.[0] ?? {};

  return {
    id: city.id,
    name: city.name,
    lat: city.lat,
    lon: city.lon,
    temp: Math.round(weather.main.temp),
    status: condition.description || "날씨 정보 없음",
    icon: getWeatherIcon(condition.id),
    humidity: weather.main.humidity,
    wind: weather.wind.speed,
    note: getWeatherNote(condition.id),
  };
}

function toWeatherError(error) {
  const message = error.response?.data?.message;

  if (error.response?.status === 401) {
    return new Error("OpenWeather API 키를 확인해 주세요.");
  }

  if (error.response?.status === 429) {
    return new Error("요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.");
  }

  return new Error(message || "날씨 정보를 불러오지 못했습니다.");
}

function getKmaAuthKey() {
  const authKey =
    import.meta.env.VITE_KMA_AUTH_KEY || import.meta.env.VITE_KMA_API_KEY;

  if (!authKey) {
    throw new Error("기상청 API 인증키가 설정되지 않았습니다.");
  }

  return authKey;
}

function getKoreaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function formatDate({ year, month, day }) {
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

function getKmaBaseDateTime(now = new Date()) {
  const koreaNow = getKoreaDateParts(now);
  const minutes = koreaNow.hour * 60 + koreaNow.minute;
  const baseHour = [...KMA_FORECAST_BASE_HOURS]
    .reverse()
    .find((hour) => minutes >= hour * 60 + 10);

  if (baseHour !== undefined) {
    return {
      baseDate: formatDate(koreaNow),
      baseTime: `${String(baseHour).padStart(2, "0")}00`,
    };
  }

  const yesterday = new Date(
    Date.UTC(koreaNow.year, koreaNow.month - 1, koreaNow.day - 1),
  );
  const previousDate = {
    year: yesterday.getUTCFullYear(),
    month: yesterday.getUTCMonth() + 1,
    day: yesterday.getUTCDate(),
  };

  return { baseDate: formatDate(previousDate), baseTime: "2300" };
}

function toKmaGrid(lat, lon) {
  const radius = 6371.00877;
  const gridSpacing = 5;
  const standardLatitude1 = (30 * Math.PI) / 180;
  const standardLatitude2 = (60 * Math.PI) / 180;
  const originLongitude = (126 * Math.PI) / 180;
  const originLatitude = (38 * Math.PI) / 180;
  const originX = 43;
  const originY = 136;
  const earthRadius = radius / gridSpacing;
  const sn =
    Math.log(Math.cos(standardLatitude1) / Math.cos(standardLatitude2)) /
    Math.log(
      Math.tan(Math.PI * 0.25 + standardLatitude2 * 0.5) /
        Math.tan(Math.PI * 0.25 + standardLatitude1 * 0.5),
    );
  const sf =
    (Math.pow(Math.tan(Math.PI * 0.25 + standardLatitude1 * 0.5), sn) *
      Math.cos(standardLatitude1)) /
    sn;
  const ro =
    (earthRadius * sf) /
    Math.pow(Math.tan(Math.PI * 0.25 + originLatitude * 0.5), sn);
  const radiusAtPoint =
    (earthRadius * sf) /
    Math.pow(Math.tan(Math.PI * 0.25 + (lat * Math.PI) / 360), sn);
  let theta = (lon * Math.PI) / 180 - originLongitude;

  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(radiusAtPoint * Math.sin(theta) + originX + 0.5),
    ny: Math.floor(ro - radiusAtPoint * Math.cos(theta) + originY + 0.5),
  };
}

function getForecastTarget(items, now = new Date()) {
  const koreaNow = getKoreaDateParts(now);
  const nowKey = `${formatDate(koreaNow)}${String(koreaNow.hour)
    .padStart(2, "0")}00`;
  const targetKeys = [...new Set(items.map((item) => `${item.fcstDate}${item.fcstTime}`))]
    .filter((key) => key >= nowKey)
    .sort();

  return targetKeys[0] || null;
}

function getPrecipitationType(value) {
  return (
    {
      0: "강수 없음",
      1: "비",
      2: "비 또는 눈",
      3: "눈",
      4: "소나기",
    }[Number(value)] || "알 수 없음"
  );
}

function getSkyStatus(value) {
  return (
    {
      1: "맑음",
      3: "구름많음",
      4: "흐림",
    }[Number(value)] || "날씨 정보 없음"
  );
}

function formatKmaDateTime(date, time) {
  return `${date.slice(4, 6)}월 ${date.slice(6, 8)}일 ${time.slice(0, 2)}시`;
}

function toKmaForecast(items, baseDate, baseTime) {
  const target = getForecastTarget(items);

  if (!target) {
    throw new Error("기상청 예보 자료에서 다음 예보 시각을 찾지 못했습니다.");
  }

  const forecastItems = items.filter(
    (item) => `${item.fcstDate}${item.fcstTime}` === target,
  );
  const values = Object.fromEntries(
    forecastItems.map((item) => [item.category, item.fcstValue]),
  );

  return {
    announcedAt: formatKmaDateTime(baseDate, baseTime),
    forecastAt: formatKmaDateTime(target.slice(0, 8), target.slice(8)),
    temperature: values.TMP ? Number(values.TMP) : null,
    precipitationProbability: values.POP ? `${values.POP}%` : "-",
    precipitation: values.PCP || "강수 없음",
    snowfall: values.SNO || "적설 없음",
    humidity: values.REH ? `${values.REH}%` : "-",
    windSpeed: values.WSD ? `${values.WSD} m/s` : "-",
    sky: getSkyStatus(values.SKY),
    precipitationType: getPrecipitationType(values.PTY),
  };
}

async function getKmaForecastForCity(city) {
  const { baseDate, baseTime } = getKmaBaseDateTime();
  const { nx, ny } = toKmaGrid(city.lat, city.lon);

  try {
    const { data } = await kmaForecastApi.get("/getVilageFcst", {
      params: {
        pageNo: 1,
        numOfRows: 1000,
        dataType: "JSON",
        base_date: baseDate,
        base_time: baseTime,
        nx,
        ny,
        authKey: getKmaAuthKey(),
      },
    });
    const response = data?.response;

    if (response?.header?.resultCode !== "00") {
      throw new Error(response?.header?.resultMsg || "기상청 API 요청에 실패했습니다.");
    }

    return toKmaForecast(response.body?.items?.item || [], baseDate, baseTime);
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;
    throw new Error("기상청 단기예보를 불러오지 못했습니다.", {
      cause: error,
    });
  }
}

export async function getWeatherForCity(city) {
  try {
    const response = await weatherApi.get("/weather", {
      params: {
        lat: city.lat,
        lon: city.lon,
        appid: getApiKey(),
        units: "metric",
        lang: "kr",
      },
    });

    return toWeatherCity(city, response.data);
  } catch (error) {
    throw toWeatherError(error);
  }
}

export async function getWeatherDetailForCity(city) {
  const [weather, kmaResult] = await Promise.all([
    getWeatherForCity(city),
    getKmaForecastForCity(city).then(
      (forecast) => ({ forecast, error: "" }),
      (error) => ({ forecast: null, error: error.message }),
    ),
  ]);

  return {
    ...weather,
    forecast: kmaResult.forecast,
    kmaError: kmaResult.error,
  };
}

export function getWeatherList() {
  return Promise.all(cities.map(getWeatherForCity));
}

export function getCityById(cityId) {
  return cities.find((city) => city.id === cityId);
}

export async function searchCities(query) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  const { data: locations } = await weatherApi.get("/geo/1.0/direct", {baseURL:"https://api.openweathermap.org",
    params : {
      q : `${query}, KR`,
      limit : 5,
      appid : apiKey,
    },
});

  const weatherCities = await Promise.all(
    locations.map(async (location) => {
      const city = {
        id : `${location.lat}-${location.lon}`,
        name : location.local_names?.ko || location.name,
        lat : location.lat,
        lon : location.lon,
      };

      return getWeatherForCity(city);
    }),
  );
  return weatherCities;
}
