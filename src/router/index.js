import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/weather",
    },
    {
      path: "/weather",
      name: "weather-home",
      component: () => import("../views/WeatherHomeView.vue"),
    },
    {
      path: "/weather/:cityId",
      name: "weather-detail",
      component: () => import("../views/WeatherDetailView.vue"),
    },
    {
      path: "/about",
      name: "weather-about",
      component: () => import("../views/WeatherAboutView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
