import { createRouter, createWebHashHistory } from "vue-router";

const Home = () => import("@/components/Home.vue");
const Room = () => import("@/components/Room.vue");

const routes = [
  { name: "Home", path: "/", component: Home },
  { name: "Room", path: "/room", component: Room }
];

export default createRouter({
  history: createWebHashHistory(),
  routes
});
