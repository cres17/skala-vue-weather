import axios from "axios";

const weatherApi = axios.create({
  baseURL: "https://api.openweathermap.org/data/2.5",
  timeout: 10_000,
});

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
