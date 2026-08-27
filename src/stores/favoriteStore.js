import { defineStore } from "pinia";

export const useFavoriteStore = defineStore("favorite", {
  state: () => ({
    favoriteCityIds: [],
  }),
  getters: {
    favoriteCount: (state) => state.favoriteCityIds.length,
    isFavorite: (state) => (cityId) => state.favoriteCityIds.includes(cityId),
  },
  actions: {
    toggleFavorite(cityId) {
      const index = this.favoriteCityIds.indexOf(cityId);

      if (index >= 0) {
        this.favoriteCityIds.splice(index, 1);
        return;
      }

      this.favoriteCityIds.push(cityId);
    },
  },
});
