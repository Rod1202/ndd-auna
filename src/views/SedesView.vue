<template>
  <section>
    <div class="page-header">
      <div>
        <h1 class="page-title">Sedes</h1>
        <p class="page-subtitle">Resumen por sede usando la relacion print_logs.impresora_serie = inventario.serie.</p>
      </div>
      <div class="page-actions">
        <button class="primary-button" type="button" @click="loadData">
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

    <div class="sedes-grid">
      <section
        v-for="sede in sortedSedes"
        :key="sede.sede"
        class="dashboard-card sede-card"
      >
        <div class="dashboard-card__inner">
          <div class="sede-card__top">
            <div>
              <span class="sede-card__label">{{ sede.unidad_negocio || '-' }}</span>
              <h3 class="card-title">{{ sede.sede }}</h3>
            </div>
            <v-icon icon="mdi-domain" color="#0050cb" size="28" />
          </div>

          <div class="sede-section">
            <div class="sede-section__header">
              <h4>Volumetria</h4>
              <span>{{ percentOf(sede.paginas_total, totals.paginas_total) }} del total general</span>
            </div>
            <div class="sede-card__metrics sede-card__metrics--three">
              <div>
                <span>Volumen monocromatico</span>
                <strong>{{ formatNumber(sede.paginas_mono) }}</strong>
              </div>
              <div>
                <span>Volumen color</span>
                <strong>{{ formatNumber(sede.paginas_color) }}</strong>
              </div>
              <div class="metric-highlight">
                <span>Volumen total</span>
                <strong>{{ formatNumber(sede.paginas_total) }}</strong>
              </div>
            </div>
          </div>

          <div class="sede-section">
            <div class="sede-section__header">
              <h4>Facturacion</h4>
              <span>{{ percentOf(sede.costo_total, totals.costo_total) }} del total general</span>
            </div>
            <div class="sede-card__metrics sede-card__metrics--three">
              <div>
                <span>Facturacion monocromatico</span>
                <strong>{{ formatCurrency(sede.costo_mono) }}</strong>
              </div>
              <div>
                <span>Facturacion color</span>
                <strong>{{ formatCurrency(sede.costo_color) }}</strong>
              </div>
              <div class="metric-highlight">
                <span>Facturacion total</span>
                <strong>{{ formatCurrency(sede.costo_total) }}</strong>
              </div>
            </div>
          </div>

          <div class="sede-card__footer">
            <span>{{ formatNumber(sede.impresoras) }} impresoras</span>
            <span>{{ formatNumber(sede.usuarios) }} usuarios</span>
            <span>{{ formatNumber(sede.registros) }} registros</span>
          </div>
        </div>
      </section>

      <section v-if="!sortedSedes.length && !loading" class="dashboard-card">
        <div class="dashboard-card__inner">
          <div class="empty-state">No hay sedes para mostrar.</div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getEnrichedPrints } from '../services/api'

const sedes = ref([])
const loading = ref(false)
const error = ref('')

const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')
const formatCurrency = (value) => `$ ${Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`

const sortedSedes = computed(() => {
  return [...sedes.value].sort((a, b) => Number(b.paginas_total || 0) - Number(a.paginas_total || 0))
})

const totals = computed(() => {
  return sedes.value.reduce((acc, sede) => {
    acc.paginas_total += Number(sede.paginas_total || 0)
    acc.costo_total += Number(sede.costo_total || 0)
    return acc
  }, {
    paginas_total: 0,
    costo_total: 0
  })
})

const percentOf = (value, total) => {
  if (!Number(total)) return '0.00%'
  return `${((Number(value || 0) / Number(total)) * 100).toFixed(2)}%`
}

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await getEnrichedPrints()
    sedes.value = data.sedes || []
  } catch (err) {
    console.error(err)
    error.value = err.message || 'No se pudo cargar sedes'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.sedes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.sede-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.sede-card__label {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.sede-section {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.sede-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.sede-section__header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 14px;
  font-weight: 800;
}

.sede-section__header span {
  color: #0050cb;
  font-size: 11px;
  font-weight: 800;
}

.sede-card__metrics {
  display: grid;
  gap: 14px;
}

.sede-card__metrics--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.sede-card__metrics div {
  min-height: 78px;
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
}

.sede-card__metrics span {
  display: block;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.sede-card__metrics strong {
  display: block;
  margin-top: 6px;
  color: #1a1c1c;
  font-size: 18px;
  font-weight: 800;
}

.metric-highlight {
  border: 1px solid #dbeafe;
  background: #eff6ff !important;
}

.sede-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.sede-card__footer span {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  color: #475569;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 800;
}

@media (max-width: 1180px) {
  .sedes-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .sede-card__metrics--three {
    grid-template-columns: 1fr;
  }
}
</style>
