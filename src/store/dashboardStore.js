import { defineStore } from 'pinia'
import { fetchDashboardData } from '../services/dashboardService'

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        usuarios: [],
        impresoras: [],
        tendencia: [],
        colorMono: {},
        trabajos: [],
        seriesNoEncontradas: [],
        calidadInventario: null,
        unidadNegocioDistribucion: [],
        topSedes: [],
        topAreas: [],
        papelDistribucion: [],
        tipoTrabajoDistribucion: [],
        duplexSimplex: null,
        error: '',
        loading: false
    }),

    actions: {
        async loadDashboard() {
            this.loading = true
            this.error = ''

            try {
                const data = await fetchDashboardData()

                this.$patch({
                    usuarios: data.usuarios || [],
                    impresoras: data.impresoras || [],
                    tendencia: data.tendencia || [],
                    colorMono: data.colorMono?.[0] || {},
                    trabajos: data.trabajos || [],
                    seriesNoEncontradas: data.seriesNoEncontradas || [],
                    calidadInventario: data.calidadInventario || null,
                    unidadNegocioDistribucion: data.unidadNegocioDistribucion || [],
                    topSedes: data.topSedes || [],
                    topAreas: data.topAreas || [],
                    papelDistribucion: data.papelDistribucion || [],
                    tipoTrabajoDistribucion: data.tipoTrabajoDistribucion || [],
                    duplexSimplex: data.duplexSimplex || null
                })
            } catch (error) {
                console.error(error)
                this.error = error.message || 'No se pudo cargar el dashboard'
            } finally {
                this.loading = false
            }
        }
    }
})
