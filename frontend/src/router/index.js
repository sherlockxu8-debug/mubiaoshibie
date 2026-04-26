import { createRouter, createWebHistory } from 'vue-router'
import Index from '../views/Index.vue'
import History from '../views/History.vue'
import Search from '../views/Search.vue'
import Camera from '../views/Camera.vue'

const routes = [
  { path: '/', name: 'Index', component: Index },
  { path: '/history', name: 'History', component: History },
  { path: '/search', name: 'Search', component: Search },
  { path: '/camera', name: 'Camera', component: Camera }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
