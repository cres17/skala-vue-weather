import axios from "axios";

const weatherApi = axios.create({
  baseURL: "https://api.openweathermap.org/data/2.5",
  timeout: 10_000,
});

const kmaObservationApi = axios.create({
  // 기상청 API 허브는 CORS 헤더를 제공하지 않아 개발 중 Vite 프록시를 사용한다.
  baseURL: import.meta.env.VITE_KMA_API_BASE_URL || "/api/kma/typ01/url",
  timeout: 10_000,
});

const cities = [
  { id: "seoul", name: "서울", lat: 37.5665, lon: 126.978, stationId: "108" },
  { id: "suwon", name: "수원", lat: 37.2636, lon: 127.0286, stationId: "119" },
  { id: "busan", name: "부산", lat: 35.1796, lon: 129.0756, stationId: "159" },
  { id: "jeju", name: "제주", lat: 33.4996, lon: 126.5312, stationId: "184" },
  { id: "daejeon", name: "대전", lat: 36.3504, lon: 127.3845, stationId: "133" },
  { id: "gwangju", name: "광주", lat: 35.1595, lon: 126.8526, stationId: "156" },
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

function getKmaAuthKey() {
  const authKey =
    import.meta.env.VITE_KMA_AUTH_KEY || import.meta.env.VITE_KMA_API_KEY;

  if (!authKey) {
    throw new Error("기상청 API 인증키가 설정되지 않았습니다.");
  }

  return authKey;
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

function getNearestKmaStation(city) {
  if (city.stationId) return city;

  return cities.reduce((nearest, candidate) => {
    const nearestDistance =
      (city.lat - nearest.lat) ** 2 + (city.lon - nearest.lon) ** 2;
    const candidateDistance =
      (city.lat - candidate.lat) ** 2 + (city.lon - candidate.lon) ** 2;

    return candidateDistance < nearestDistance ? candidate : nearest;
  });
}

function isMissingKmaValue(value) {
  return value === undefined || value === "" || Number(value) === -9;
}

function getKmaText(value, unit = "") {
  return isMissingKmaValue(value) ? "-" : `${value}${unit}`;
}

function getKmaNumber(value) {
  return isMissingKmaValue(value) ? null : Number(value);
}

function formatKmaObservationTime(value) {
  if (!/^\d{12}$/.test(value)) return value || "관측 시각 정보 없음";

  return `${value.slice(4, 6)}월 ${value.slice(6, 8)}일 ${value.slice(8, 10)}:${value.slice(10, 12)}`;
}

function parseKmaObservation(raw, station) {
  const observationLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));

  if (!observationLine) {
    throw new Error("기상청 지상 관측 자료가 아직 준비되지 않았습니다.");
  }

  const values = observationLine.split(/\s+/);

  if (values.length < 22) {
    throw new Error("기상청 지상 관측 응답 형식을 확인하지 못했습니다.");
  }

  return {
    stationName: station.name,
    stationId: values[1],
    observedAt: formatKmaObservationTime(values[0]),
    temperature: getKmaNumber(values[11]),
    dewPoint: getKmaText(values[12], "°C"),
    humidity: getKmaText(values[13], "%"),
    windDirection: getKmaText(values[2], " 방향"),
    windSpeed: getKmaText(values[3], " m/s"),
    gustSpeed: getKmaText(values[5], " m/s"),
    localPressure: getKmaText(values[7], " hPa"),
    seaLevelPressure: getKmaText(values[8], " hPa"),
    precipitation: getKmaText(values[15], " mm"),
    dailyPrecipitation: getKmaText(values[16], " mm"),
    precipitationIntensity: getKmaText(values[18], " mm/h"),
    snowfall: getKmaText(values[19], " cm"),
    dailySnowfall: getKmaText(values[20], " cm"),
    snowDepth: getKmaText(values[21], " cm"),
  };
}

async function getKmaObservationForCity(city) {
  const station = getNearestKmaStation(city);

  try {
    const { data } = await kmaObservationApi.get("/kma_sfctm2.php", {
      params: {
        stn: station.stationId,
        help: 0,
        authKey: getKmaAuthKey(),
      },
      responseType: "text",
    });

    return parseKmaObservation(data, station);
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;

    throw new Error("기상청 지상 관측 자료를 불러오지 못했습니다.", {
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
    getKmaObservationForCity(city).then(
      (observation) => ({ observation, error: "" }),
      (error) => ({ observation: null, error: error.message }),
    ),
  ]);

  return {
    ...weather,
    observation: kmaResult.observation,
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

  const { data: locations } = await weatherApi.get("/geo/1.0/direct", {
    baseURL: "https://api.openweathermap.org",
    params: {
      q: `${query}, KR`,
      limit: 5,
      appid: apiKey,
    },
  });

  return Promise.all(
    locations.map((location) =>
      getWeatherForCity({
        id: `${location.lat}-${location.lon}`,
        name: location.local_names?.ko || location.name,
        lat: location.lat,
        lon: location.lon,
      }),
    ),
  );
}
