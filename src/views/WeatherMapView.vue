<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import L from "leaflet";
import { feature as topoFeature } from "topojson-client";
import "leaflet/dist/leaflet.css";

import ForecastTimeline from "../components/ForecastTimeline.vue";
import { koreaAdministrativeCities } from "../data/koreaAdministrativeCities";
import { koreaRegions } from "../data/regionCities";
import { getForecastForCity, getWeatherForCity } from "../services/weather";
import { useWeatherStore } from "../stores/weatherStore";

const KOREA_PROVINCES_GEOJSON = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo_simple.json";
const KOREA_MUNICIPALITIES_TOPOJSON = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo-simple.json";
const KOREA_VIEW_BOUNDS = L.latLngBounds([32.8, 125.5], [38.9, 131.3]);
const REGION_CODE_PREFIXES = {
  // KOSTAT 2018 TopoJSON uses the legacy two-digit province prefix.
  seoul: "11", busan: "21", daegu: "22", incheon: "23", gwangju: "24", daejeon: "25", ulsan: "26",
  sejong: "29", gyeonggi: "31", gangwon: "32", chungbuk: "33", chungnam: "34", jeonbuk: "35",
  jeonnam: "36", gyeongbuk: "37", gyeongnam: "38", jeju: "39",
};

const router = useRouter();
const weatherStore = useWeatherStore();
const mapElement = ref(null);
const selectedRegion = ref(null);
const mapError = ref("");
const municipalityError = ref("");
const isMunicipalityLoading = ref(false);
const selectedCity = ref(null);
const selectedCityWeather = ref(null);
const cityWeatherError = ref("");
const selectedCityForecast = ref(null);
const cityForecastError = ref("");
const isCityForecastLoading = ref(false);
const isCityWeatherLoading = ref(false);

let map;
let provinceLayer;
let municipalityLayer;
let municipalities;
let citySelectionSequence = 0;

function getRegionForFeature(feature) {
  return koreaRegions.find((region) => region.mapNames.includes(feature.properties?.name));
}

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [longitude, latitude] = ring[index];
    const [previousLongitude, previousLatitude] = ring[previous];
    const intersects = ((latitude > point[1]) !== (previousLatitude > point[1]))
      && point[0] < ((previousLongitude - longitude) * (point[1] - latitude)) / (previousLatitude - latitude) + longitude;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInFeature(city, feature) {
  const point = [city.lon, city.lat];
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  return polygons.some(([outerRing, ...holes]) => pointInRing(point, outerRing) && holes.every((hole) => !pointInRing(point, hole)));
}

function getCityForMunicipality(feature, layer) {
  const name = feature.properties?.name || "선택한 도시";
  const matchingCity = koreaAdministrativeCities
    .filter((city) => city.name === name)
    .find((city) => pointInFeature(city, feature));
  if (matchingCity) return matchingCity;

  const center = layer.getBounds().getCenter();
  return {
    id: `municipality-${feature.properties?.code || name}`,
    name,
    lat: center.lat,
    lon: center.lng,
  };
}

function regionStyle(feature) {
  const region = getRegionForFeature(feature);
  const isSelected = region?.id === selectedRegion.value?.id;
  return {
    color: "#ffffff",
    weight: isSelected ? 2.8 : 1.2,
    fillColor: isSelected ? "#0071e3" : "#69aef2",
    fillOpacity: isSelected ? 0.42 : 0.62,
  };
}

function municipalityStyle() {
  return {
    color: "#ffffff",
    weight: 1.1,
    fillColor: "#2789ea",
    fillOpacity: 0.5,
  };
}

function moveToDetail(city = selectedCity.value) {
  if (!city) return;
  router.push({
    name: "weather-detail",
    params: { cityId: city.id },
    query: { name: city.name, lat: city.lat, lon: city.lon },
  });
}

async function selectCity(city) {
  const sequence = ++citySelectionSequence;
  selectedCity.value = city;
  selectedCityWeather.value = weatherStore.getWeather(city.id);
  cityWeatherError.value = "";
  selectedCityForecast.value = null;
  cityForecastError.value = "";
  isCityWeatherLoading.value = !selectedCityWeather.value;
  isCityForecastLoading.value = true;
  await nextTick();
  map?.invalidateSize({ animate: true });

  if (!selectedCityWeather.value) {
    getWeatherForCity(city)
      .then((weather) => {
        if (sequence === citySelectionSequence) selectedCityWeather.value = weather;
      })
      .catch((error) => {
        if (sequence === citySelectionSequence) cityWeatherError.value = error.message;
      })
      .finally(() => {
        if (sequence === citySelectionSequence) isCityWeatherLoading.value = false;
      });
  }

  getForecastForCity(city)
    .then((forecast) => {
      if (sequence === citySelectionSequence) selectedCityForecast.value = forecast;
    })
    .catch((error) => {
      if (sequence === citySelectionSequence) cityForecastError.value = error.message;
    })
    .finally(() => {
      if (sequence === citySelectionSequence) isCityForecastLoading.value = false;
    });
}

async function closeCityPanel() {
  selectedCity.value = null;
  await nextTick();
  map?.invalidateSize({ animate: true });
}

async function loadMunicipalities() {
  if (municipalities) return municipalities;

  const response = await fetch(KOREA_MUNICIPALITIES_TOPOJSON);
  if (!response.ok) throw new Error("시·군·구 경계 데이터를 불러오지 못했습니다.");
  const topology = await response.json();
  const object = topology.objects.skorea_municipalities_2018_geo;
  if (!object) throw new Error("시·군·구 경계 형식이 올바르지 않습니다.");
  municipalities = topoFeature(topology, object);
  return municipalities;
}

async function showMunicipalities(region) {
  try {
    isMunicipalityLoading.value = true;
    municipalityError.value = "";
    const municipalityData = await loadMunicipalities();
    const prefix = REGION_CODE_PREFIXES[region.id];
    const features = municipalityData.features.filter((feature) => feature.properties?.code?.startsWith(prefix));
    municipalityLayer?.remove();

    const preloadCities = [];
    municipalityLayer = L.geoJSON(features, {
      style: municipalityStyle,
      onEachFeature(feature, layer) {
        const city = getCityForMunicipality(feature, layer);
        if (!city.id.startsWith("municipality-")) preloadCities.push(city);
        layer.bindTooltip(city.name, { sticky: true, direction: "top", className: "municipality-tooltip" });
        layer.on({
          mouseover: () => layer.setStyle({ fillColor: "#ff9f0a", fillOpacity: 0.74, weight: 2 }),
          mouseout: () => municipalityLayer?.resetStyle(layer),
          click: () => selectCity(city),
        });
      },
    }).addTo(map);
    provinceLayer?.bringToBack();

    // 선택한 도의 도시만 백그라운드로 캐시한다. 첫 지도 화면에서는 API를 호출하지 않는다.
    weatherStore.cacheCities(preloadCities);
  } catch (error) {
    municipalityError.value = error.message || "시·군·구 경계를 불러오지 못했습니다.";
  } finally {
    isMunicipalityLoading.value = false;
  }
}

function openRegion(region, bounds) {
  selectedRegion.value = region;
  provinceLayer?.setStyle(regionStyle);
  if (bounds?.isValid()) map.fitBounds(bounds, { padding: [56, 56], maxZoom: 9 });
  showMunicipalities(region);
}

function closeRegion() {
  selectedRegion.value = null;
  municipalityError.value = "";
  municipalityLayer?.remove();
  municipalityLayer = undefined;
  closeCityPanel();
  provinceLayer?.setStyle(regionStyle);
  map.fitBounds(KOREA_VIEW_BOUNDS, { padding: [22, 22], maxZoom: 7 });
}

async function initializeMap() {
  map = L.map(mapElement.value, {
    zoomControl: false,
    minZoom: 6,
    maxZoom: 12,
    maxBounds: KOREA_VIEW_BOUNDS.pad(0.08),
    maxBoundsViscosity: 1,
  });
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  map.fitBounds(KOREA_VIEW_BOUNDS, { padding: [22, 22], maxZoom: 7 });

  try {
    const response = await fetch(KOREA_PROVINCES_GEOJSON);
    if (!response.ok) throw new Error("행정경계 데이터를 불러오지 못했습니다.");
    const geoJson = await response.json();
    provinceLayer = L.geoJSON(geoJson, {
      style: regionStyle,
      onEachFeature(feature, layer) {
        const region = getRegionForFeature(feature);
        if (!region) return;
        layer.bindTooltip(region.name, { sticky: true, direction: "top" });
        layer.on({
          mouseover: () => layer.setStyle({ fillColor: "#0071e3", fillOpacity: 0.8 }),
          mouseout: () => provinceLayer?.resetStyle(layer),
          click: () => openRegion(region, layer.getBounds()),
        });
      },
    }).addTo(map);
  } catch {
    mapError.value = "지도를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.";
  }
}

onMounted(initializeMap);
onBeforeUnmount(() => map?.remove());
</script>

<template>
  <main class="map-page">
    <section class="map-page__intro">
      <h1>오늘, 어디로 나갈까요?</h1>
      <span>도를 고르고, 시·군·구 경계 위에서 도시를 직접 선택하세요.</span>
    </section>

    <section class="map-layout" :class="{ 'map-layout--panel-open': selectedCity }">
      <div class="map-explorer">
        <div ref="mapElement" class="map-canvas" aria-label="대한민국 행정경계 지도"></div>
        <p v-if="mapError" class="map-error">{{ mapError }}</p>
        <p v-else-if="!selectedRegion" class="map-canvas__hint">도를 선택해 시·군·구 지도 열기</p>
        <p v-else-if="isMunicipalityLoading" class="map-canvas__hint">{{ selectedRegion.name }} 시·군·구 경계를 여는 중이에요…</p>
        <p v-else class="map-canvas__hint">{{ selectedRegion.name }} · 경계 위에 커서를 올리면 도시명이 표시됩니다.</p>
        <button v-if="selectedRegion" class="map-reset" type="button" @click="closeRegion">← 전국 지도</button>
        <p v-if="municipalityError" class="map-error map-error--municipality">{{ municipalityError }}</p>
      </div>

      <aside v-if="selectedCity" class="map-city-panel" aria-label="선택한 도시의 날씨와 예보">
        <button class="map-city-panel__close" type="button" aria-label="도시 예보 패널 닫기" @click="closeCityPanel">×</button>
        <h2>{{ selectedCity.name }}</h2>

        <div v-if="isCityWeatherLoading" class="map-city-panel__current map-city-panel__current--loading">현재 날씨를 불러오는 중이에요…</div>
        <div v-else-if="selectedCityWeather" class="map-city-panel__current">
          <span aria-hidden="true">{{ selectedCityWeather.icon }}</span>
          <div>
            <strong>{{ selectedCityWeather.temp }}°C</strong>
            <p>{{ selectedCityWeather.status }}</p>
          </div>
          <dl>
            <div><dt>습도</dt><dd>{{ selectedCityWeather.humidity }}%</dd></div>
            <div><dt>풍속</dt><dd>{{ selectedCityWeather.wind }} m/s</dd></div>
          </dl>
        </div>
        <div v-else class="map-city-panel__current map-city-panel__current--loading">{{ cityWeatherError || "현재 날씨를 준비하지 못했어요." }}</div>

        <button class="map-city-panel__detail" type="button" @click="moveToDetail()">상세 정보 보기 <span aria-hidden="true">→</span></button>

        <div class="map-city-panel__forecast-heading">
          <div>
            <p>기상청 제공</p>
            <h3>중기 예보 · 4~10일</h3>
          </div>
        </div>
        <ForecastTimeline
          layout="vertical"
          :days="selectedCityForecast?.midRange?.days"
          :source="selectedCityForecast?.midRange?.source"
          :loading="isCityForecastLoading"
          :error="cityForecastError"
        />
      </aside>
    </section>
    <p class="map-source">행정경계: KOSTAT 2013(시도) · 2018(시군구), southkorea-maps / 배경지도: OpenStreetMap</p>
  </main>
</template>

<style scoped>
.map-page { width: min(1680px, calc(100% - 64px)); margin: 0 auto; padding: 64px 0 56px; }
.map-page__intro { margin: 0 0 34px 10px; }
.map-page__intro p { margin: 0 0 9px; color: #218a9f; font-size: 1rem; font-weight: 800; letter-spacing: .16em; }
.map-page h1 { margin: 0; color: var(--heading-color); font-size: clamp(3.4rem, 6vw, 6rem); font-weight: 750; letter-spacing: -.075em; line-height: .98; }
.map-page__intro span { display: inline-block; margin-top: 20px; color: var(--secondary-color); font-size: clamp(1.1rem, 1.6vw, 1.35rem); line-height: 1.5; }
.map-layout { display: flex; align-items: stretch; gap: 22px; height: max(760px, calc(100vh - 208px)); min-height: 760px; }
.map-explorer { position: relative; flex: 1 1 auto; min-width: 0; overflow: hidden; border: 1px solid var(--line-color); border-radius: 30px; background: #e9eef5; box-shadow: var(--card-shadow); }
.map-canvas { width: 100%; height: 100%; }
.map-canvas__hint, .map-error { position: absolute; z-index: 500; bottom: 28px; left: 50%; margin: 0; padding: 16px 22px; border: 1px solid rgb(0 0 0 / 5%); border-radius: 999px; color: #3a3a3c; background: rgb(255 255 255 / 86%); box-shadow: 0 8px 24px rgb(0 0 0 / 12%); backdrop-filter: blur(18px); font-size: 1rem; font-weight: 650; transform: translateX(-50%); white-space: nowrap; }
.map-error { color: #a84242; }
.map-error--municipality { bottom: 76px; }
.map-reset { position: absolute; z-index: 500; top: 22px; left: 22px; min-height: 50px; padding: 14px 20px; border: 1px solid rgb(0 0 0 / 6%); border-radius: 999px; color: var(--accent-color); background: rgb(255 255 255 / 90%); box-shadow: 0 8px 24px rgb(0 0 0 / 12%); backdrop-filter: blur(18px); font: inherit; font-size: 1rem; font-weight: 700; }
.map-reset:hover, .map-reset:focus-visible { background: #fff; outline: 0; }
.map-source { margin: 14px 8px 0; color: #86868b; font-size: .84rem; }
.map-canvas :deep(.leaflet-control-attribution) { font-size: 9px; }
.map-canvas :deep(.leaflet-container) { font-family: inherit; background: #e9eef5; }
.map-canvas :deep(.municipality-tooltip) { border: 0; border-radius: 10px; color: #fff; background: #1d1d1f; box-shadow: 0 8px 20px rgb(0 0 0 / 20%); font-family: inherit; font-size: 1.06rem; font-weight: 700; }
.map-canvas :deep(.municipality-tooltip::before) { border-top-color: #1d1d1f; }
.map-city-panel { position: relative; flex: 0 0 510px; overflow-y: auto; padding: 42px 34px 34px; border: 1px solid var(--line-color); border-radius: 28px; background: #fff; box-shadow: var(--card-shadow); animation: city-panel-in .24s ease both; }
@keyframes city-panel-in { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
.map-city-panel__close { position: absolute; top: 18px; right: 18px; display: grid; width: 44px; height: 44px; place-items: center; border: 0; border-radius: 50%; color: #6e6e73; background: #f2f2f7; font: inherit; font-size: 1.4rem; line-height: 1; }
.map-city-panel__close:hover, .map-city-panel__close:focus-visible { color: #1d1d1f; background: #e8e8ed; outline: 0; }
.map-city-panel__eyebrow { margin: 0 0 9px; color: #278da2; font-size: .8rem; font-weight: 800; letter-spacing: .15em; }
.map-city-panel h2 { margin: 0; color: var(--heading-color); font-size: 3.4rem; font-weight: 750; letter-spacing: -.07em; }
.map-city-panel__current { display: grid; grid-template-columns: 82px 1fr; gap: 12px 20px; align-items: center; margin: 26px 0 18px; padding: 28px; border: 0; border-radius: 22px; background: #f5f5f7; }
.map-city-panel__current > span { font-size: 4rem; }
.map-city-panel__current strong { display: block; color: var(--heading-color); font-size: 3.3rem; letter-spacing: -.08em; line-height: 1; }
.map-city-panel__current p { margin: 8px 0 0; color: var(--secondary-color); font-size: 1.08rem; font-weight: 650; }
.map-city-panel__current dl { display: flex; grid-column: 1 / -1; gap: 28px; margin: 4px 0 0; padding-top: 16px; border-top: 1px solid rgb(0 0 0 / 7%); }
.map-city-panel__current dt { color: #829ba2; font-size: .78rem; font-weight: 700; }
.map-city-panel__current dd { margin: 3px 0 0; color: #3d616a; font-size: .9rem; font-weight: 800; }
.map-city-panel__current--loading { display: block; color: #668089; font-size: 1.02rem; font-weight: 700; }
.map-city-panel__forecast-heading { display: flex; align-items: end; justify-content: space-between; margin: 0 0 15px; }
.map-city-panel__forecast-heading p { margin: 0 0 6px; color: var(--secondary-color); font-size: .8rem; font-weight: 650; }
.map-city-panel__forecast-heading h3 { margin: 0; color: var(--heading-color); font-size: 1.9rem; letter-spacing: -.05em; }
.map-city-panel__forecast-heading > span { color: #89a0a6; font-size: .8rem; font-weight: 700; }
.map-city-panel__detail { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 60px; margin: 0 0 38px; padding: 18px 24px; border: 0; border-radius: 999px; color: #fff; background: var(--accent-color); box-shadow: 0 8px 18px rgb(0 113 227 / 18%); font: inherit; font-size: 1.12rem; font-weight: 700; }
.map-city-panel__detail:hover, .map-city-panel__detail:focus-visible { background: #0077ed; outline: 0; }
@media (max-width: 1050px) { .map-layout { height: auto; min-height: 0; flex-direction: column; } .map-explorer { height: 720px; min-height: 720px; } .map-city-panel { flex-basis: auto; max-height: 680px; } }
@media (max-width: 760px) { .map-page { width: min(100% - 24px, 720px); padding-top: 42px; } .map-explorer { height: 680px; min-height: 680px; border-radius: 24px; } .map-page h1 { font-size: clamp(3rem, 15vw, 4.4rem); } .map-page__intro { margin-left: 4px; } .map-canvas__hint { max-width: calc(100% - 28px); overflow: hidden; text-overflow: ellipsis; } .map-city-panel { padding: 32px 22px; border-radius: 24px; } }
</style>
