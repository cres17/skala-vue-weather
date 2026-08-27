import { defineStore } from "pinia";

export const useConfigStore = defineStore("config", {
  state: () => ({
    unit: "celsius",
  }),
  getters: {
    unitSymbol: (state) => (state.unit === "celsius" ? "°C" : "°F"),
  },
  actions: {
    toggleUnit() {
      this.unit = this.unit === "celsius" ? "fahrenheit" : "celsius";
    },
  },
});
