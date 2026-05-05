<template>
  <section>
    <div class="page-header">
      <div>
        <h1 class="page-title">Auna NDD</h1>
        <p class="page-subtitle">Metricas de impresion, costos e inventario desde Supabase.</p>
      </div>
      <div class="page-actions">
        <button class="primary-button" type="button" @click="store.loadDashboard()">
          <v-icon icon="mdi-refresh" size="18" />
          {{ loading ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      {{ error }}
    </v-alert>

    <div class="dashboard-grid">
      <div class="kpi-grid">
        <KpiCard
          title="Paginas totales"
          :value="formatNumber(totalPaginas)"
          icon="mdi-file-document-multiple-outline"
          tone="blue"
        />
        <KpiCard
          title="Costo total"
          :value="totalCosto"
          icon="mdi-cash-multiple"
          tone="slate"
        />
        <KpiCard
          title="Usuarios activos"
          :value="formatNumber(usuarios.length)"
          icon="mdi-account-outline"
          tone="teal"
        />
        <KpiCard
          title="Impresoras"
          :value="formatNumber(impresoras.length)"
          icon="mdi-printer-outline"
          tone="amber"
        />
        <KpiCard
          title="Paginas color"
          :value="formatNumber(totalColor)"
          icon="mdi-palette-outline"
          tone="blue"
        />
        <KpiCard
          title="Paginas mono"
          :value="formatNumber(totalMono)"
          icon="mdi-circle-outline"
          tone="slate"
        />
      </div>

      <div class="panel-grid">
        <TendenciaChart :data="tendencia" />
        <ColorVsMono :data="colorMono" />
      </div>

      <div class="panel-grid">
        <DistributionBars
          title="Volumen por unidad de negocio"
          subtitle="Distribucion de paginas por unidad presente en inventario."
          :data="unidadNegocioDistribucion"
          tone="blue"
        />
        <RatioCard :data="duplexSimplex" />
      </div>

      <div class="ranking-grid">
        <DistributionBars
          title="Top sedes"
          subtitle="Sedes con mayor volumen impreso."
          :data="topSedes"
          tone="teal"
        />
        <DistributionBars
          title="Top areas"
          subtitle="Areas con mayor volumen impreso."
          :data="topAreas"
          tone="amber"
        />
      </div>

      <div class="ranking-grid">
        <DistributionBars
          title="Distribucion de tamano de papel"
          subtitle="Volumen por valor del campo papel."
          :data="papelDistribucion"
          tone="slate"
        />
        <DistributionBars
          title="Impresion vs copias"
          subtitle="Porcentaje por tipo de trabajo."
          :data="tipoTrabajoDistribucion"
          tone="blue"
        />
      </div>

      <div class="ranking-grid">
        <TopUsuarios :data="usuarios" />
        <TopImpresoras :data="impresoras" />
      </div>

      <TopTrabajos :data="trabajos" />

      <div class="detail-grid">
        <section class="dashboard-card">
          <div class="dashboard-card__inner">
            <div class="card-header">
              <div>
                <h3 class="card-title">Calidad de inventario</h3>
                <p class="card-subtitle">Cruce entre series NDD e inventario.</p>
              </div>
            </div>

            <div class="metric-stack">
              <div class="metric-stack__item metric-stack__item--emerald">
                <p>Total registros</p>
                <strong>{{ formatNumber(calidadInventario?.total_registros || 0) }}</strong>
              </div>
              <div class="metric-stack__item metric-stack__item--amber">
                <p>Sin inventario</p>
                <strong>{{ formatNumber(calidadInventario?.sin_inventario || 0) }}</strong>
              </div>
              <div class="metric-stack__item metric-stack__item--blue">
                <p>% sin inventario</p>
                <strong>{{ porcentajeSinInventario }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="dashboard-card">
          <div class="dashboard-card__inner">
            <div class="card-header">
              <div>
                <h3 class="card-title">Series no encontradas</h3>
                <p class="card-subtitle">Pendientes para actualizar inventario.</p>
              </div>
              <span class="status-chip">{{ seriesNoEncontradas.length }}</span>
            </div>

            <div v-if="seriesNoEncontradas.length" class="series-list">
              <span
                v-for="serie in seriesNoEncontradas"
                :key="serie.impresora_serie"
                class="series-chip"
              >
                {{ serie.impresora_serie || 'Sin serie' }}
              </span>
            </div>

            <div v-else class="empty-state">No hay series pendientes de inventario.</div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../store/dashboardStore'

import KpiCard from '../components/dashboard/KpiCard.vue'
import TendenciaChart from '../components/dashboard/TendenciaChart.vue'
import TopUsuarios from '../components/dashboard/TopUsuarios.vue'
import TopImpresoras from '../components/dashboard/TopImpresoras.vue'
import TopTrabajos from '../components/dashboard/TopTrabajos.vue'
import ColorVsMono from '../components/dashboard/ColorVsMono.vue'
import DistributionBars from '../components/dashboard/DistributionBars.vue'
import RatioCard from '../components/dashboard/RatioCard.vue'

const store = useDashboardStore()
const {
  usuarios,
  impresoras,
  tendencia,
  colorMono,
  trabajos,
  seriesNoEncontradas,
  calidadInventario,
  unidadNegocioDistribucion,
  topSedes,
  topAreas,
  papelDistribucion,
  tipoTrabajoDistribucion,
  duplexSimplex,
  loading,
  error
} = storeToRefs(store)

onMounted(() => {
  store.loadDashboard()
})

const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')

const totalPaginas = computed(() => {
  return tendencia.value.reduce((sum, item) => sum + Number(item.total_paginas || 0), 0)
})

const totalCosto = computed(() => {
  const total = tendencia.value.reduce((sum, item) => sum + Number(item.total_costo || 0), 0)
  return `$ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
})

const totalColor = computed(() => Number(colorMono.value?.total_color || 0))
const totalMono = computed(() => Number(colorMono.value?.total_mono || 0))

const porcentajeSinInventario = computed(() => {
  const value = Number(calidadInventario.value?.porcentaje_sin_inventario || 0)
  return `${value.toFixed(2)}%`
})
</script>

<style scoped>
.metric-stack {
  display: grid;
  gap: 16px;
}

.metric-stack__item {
  padding: 20px;
  border-left: 4px solid;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.metric-stack__item p {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.metric-stack__item strong {
  color: #1a1c1c;
  font-size: 24px;
  font-weight: 800;
}

.metric-stack__item--emerald {
  border-color: #10b981;
}

.metric-stack__item--amber {
  border-color: #d97706;
}

.metric-stack__item--blue {
  border-color: var(--primary);
}

.series-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.series-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  color: #92400e;
  background: #fffbeb;
  font-size: 11px;
  font-weight: 800;
}
</style>
