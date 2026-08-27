import { defineStore } from "pinia";

import { getWeatherForCities } from "../services/weather";

export const useWeatherStore = defineStore("weather", {
  state: () => ({
    weatherById: {},
    isPreloading: false,
    preloadError: "",
  }),
  getters: {
    getWeather: (state) => (cityId) => state.weatherById[cityId] || null,
    loadedCount: (state) => Object.keys(state.weatherById).length,
  },
  actions: {
    async cacheCities(cities) {
      const missingCities = cities.filter((city) => !this.weatherById[city.id]);
      if (!missingCities.length || this.isPreloading) return;

      this.isPreloading = true;
      this.preloadError = "";
      try {
        const weatherCities = await getWeatherForCities(missingCities);
        this.weatherById = {
          ...this.weatherById,
          ...Object.fromEntries(weatherCities.map((city) => [city.id, city])),
        };
      } catch (error) {
        this.preloadError = error.message;
      } finally {
        this.isPreloading = false;
      }
    },
  },
});
