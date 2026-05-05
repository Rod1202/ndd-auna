import { createRouter, createWebHistory } from 'vue-router'

// Vistas
import DashboardView from '../views/DashboardView.vue'
import UploadView from '../views/UploadView.vue'
import UsersView from '../views/UsersView.vue'
import UserJobsView from '../views/UserJobsView.vue'
import SedesView from '../views/SedesView.vue'
import PrintersView from '../views/PrintersView.vue'

// Rutas
const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: DashboardView
    },
    {
        path: '/upload',
        name: 'upload',
        component: UploadView
    },
    {
        path: '/usuarios',
        name: 'usuarios',
        component: UsersView
    },
    {
        path: '/usuarios/:usuario/trabajos',
        name: 'usuario-trabajos',
        component: UserJobsView
    },
    {
        path: '/sedes',
        name: 'sedes',
        component: SedesView
    },
    {
        path: '/impresoras',
        name: 'impresoras',
        component: PrintersView
    },

    // fallback (por si alguien entra a una ruta inexistente)
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

// Router
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
