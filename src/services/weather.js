import axios from "axios";

const weatherApi = axios.create({
  baseURL: "/api",
  timeout: 20_000,
});

const cities = [
  { id: "seoul", name: "서울", lat: 37.5665, lon: 126.978 },
  { id: "busan", name: "부산", lat: 35.1796, lon: 129.0756 },
  { id: "incheon", name: "인천", lat: 37.4563, lon: 126.7052 },
  { id: "daegu", name: "대구", lat: 35.8714, lon: 128.6014 },
  { id: "daejeon", name: "대전", lat: 36.3504, lon: 127.3845 },
  { id: "gwangju", name: "광주", lat: 35.1595, lon: 126.8526 },
  { id: "suwon", name: "수원", lat: 37.2636, lon: 127.0286 },
  { id: "ulsan", name: "울산", lat: 35.5384, lon: 129.3114 },
  { id: "yongin", name: "용인", lat: 37.2411, lon: 127.1776 },
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

function isValidForecast(data) {
  const days = data?.midRange?.days;
  if (!Array.isArray(days) || days.length < 1 || days.length > 7) return false;

  const dates = days.map((day) => day?.date);
  return dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    && new Set(dates).size === dates.length;
}

function toWeatherCity(city, weather) {
  const temperature = Number(weather?.main?.temp);
  if (!Number.isFinite(temperature)) {
    throw new Error("현재 날씨 응답에 기온 정보가 없습니다.");
  }
  const condition = weather.weather?.[0] ?? {};

  return {
    id: city.id,
    name: city.name,
    lat: city.lat,
    lon: city.lon,
    temp: Math.round(temperature),
    status: condition.description || "날씨 정보 없음",
    icon: getWeatherIcon(condition.id),
    humidity: Number(weather.main.humidity) || 0,
    wind: Number(weather.wind?.speed) || 0,
    note: getWeatherNote(condition.id),
  };
}

function toWeatherError(error) {
  const message = error.response?.data?.message;

  if (!error.isAxiosError && error instanceof Error) return error;

  if (error.code === "ECONNABORTED") {
    return new Error("날씨 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
  }

  if (!error.response) {
    return new Error("날씨 서버에 연결하지 못했습니다. 네트워크 연결을 확인해 주세요.");
  }

  if (error.response?.status === 401) {
    return new Error("날씨 API 요청 권한을 확인해 주세요.");
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
      },
    });

    return toWeatherCity(city, response.data);
  } catch (error) {
    throw toWeatherError(error);
  }
}

export async function getWeatherForCities(citiesToLoad) {
  try {
    const { data } = await weatherApi.post("/weather", {
      cities: citiesToLoad.map(({ id, lat, lon }) => ({ id, lat, lon })),
    });

    return citiesToLoad
      .filter((city) => data[city.id])
      .map((city) => toWeatherCity(city, data[city.id]));
  } catch (error) {
    throw toWeatherError(error);
  }
}

export async function getForecastForCity(city) {
  try {
    const { data } = await weatherApi.get("/forecast", {
      params: {
        lat: city.lat,
        lon: city.lon,
      },
    });

    if (!isValidForecast(data)) throw new Error("일기예보 응답 형식이 올바르지 않습니다.");
    return data;
  } catch (error) {
    throw toWeatherError(error);
  }
}

export function getWeatherList() {
  return getWeatherForCities(cities);
}

export function getCityById(cityId) {
  return cities.find((city) => city.id === cityId);
}

export async function searchCities(query) {
  try {
    const { data: locations } = await weatherApi.get("/geocoding", {
      params : {
        q : query,
      },
    });

    if (!Array.isArray(locations)) throw new Error("도시 검색 응답 형식이 올바르지 않습니다.");

    return Promise.all(
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
  } catch (error) {
    throw toWeatherError(error);
  }
}
