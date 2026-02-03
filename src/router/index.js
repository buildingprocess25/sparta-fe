import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// Views
import LandingPage from '@/views/LandingPage.vue'
import LoginPage from '@/views/LoginPage.vue'
import Dashboard from '@/views/Dashboard.vue'
import FotoDokumen from '@/views/FotoDokumen.vue'
import SvDokumen from '@/views/SimpanDokumen.vue'
import Spk from '@/views/Spk.vue'
import Rab from '@/views/Rab.vue'
import Gantt from '@/views/Gantt.vue'
import InstruksiLapangan from '@/views/InstruksiLapangan.vue'
import Opname from '@/views/Opname.vue'

const routes = [
    {
        path: '/',
        name: 'Landing',
        component: LandingPage
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginPage
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/foto-dokumen',
        name: 'FotoDokumen',
        component: FotoDokumen,
        meta: { requiresAuth: true }
    },
    {
        path: '/sv-dokumen',
        name: 'SvDokumen',
        component: SvDokumen,
        meta: { requiresAuth: true }
    },
    {
        path: '/spk',
        name: 'Spk',
        component: Spk,
        meta: { requiresAuth: true }
    },
    {
        path: '/rab',
        name: 'Rab',
        component: Rab,
        meta: { requiresAuth: true }
    },
    {
        path: '/gantt',
        name: 'Gantt',
        component: Gantt,
        meta: { requiresAuth: true }
    },
    {
        path: '/instruksi-lapangan',
        name: 'InstruksiLapangan',
        component: InstruksiLapangan,
        meta: { requiresAuth: true }
    },
    {
        path: '/opname',
        name: 'Opname',
        component: Opname,
        meta: { requiresAuth: true }
    }
]
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})
// Navigation Guards
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router