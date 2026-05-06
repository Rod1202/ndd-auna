<template>
  <section>
    <div class="page-header">
      <div>
        <h1 class="page-title">Trabajos impresos</h1>
        <p class="page-subtitle">Detalle de titulos impresos por {{ decodedUsuario }}.</p>
      </div>
      <div class="page-actions">
        <button class="soft-button" type="button" @click="router.push('/usuarios')">
          <v-icon icon="mdi-arrow-left" size="18" />
          Volver
        </button>
        <button class="primary-button" type="button" @click="loadData">
          <v-icon icon="mdi-refresh" size="18" />
          {{ loading ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-6">
      {{ error }}
    </v-alert>

    <section class="dashboard-card mb-6">
      <div class="dashboard-card__inner">
        <div class="card-header">
          <div>
            <h3 class="card-title">{{ decodedUsuario }}</h3>
            <p class="card-subtitle">Resumen del usuario seleccionado.</p>
          </div>
          <span class="status-chip">{{ filteredRows.length }} trabajos</span>
        </div>

        <div class="summary-grid">
          <div>
            <span>Volumen monocromatico</span>
            <strong>{{ formatNumber(summary.paginas_mono) }}</strong>
          </div>
          <div>
            <span>Volumen color</span>
            <strong>{{ formatNumber(summary.paginas_color) }}</strong>
          </div>
          <div>
            <span>Volumen total</span>
            <strong>{{ formatNumber(summary.paginas_total) }}</strong>
          </div>
          <div>
            <span>Costo total</span>
            <strong>{{ formatCurrency(summary.costo_total) }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-card">
      <div class="dashboard-card__inner">
        <div class="card-header">
          <div>
            <h3 class="card-title">Detalle de titulos</h3>
            <p class="card-subtitle">Cada fila representa un trabajo registrado para el usuario.</p>
          </div>
        </div>
      </div>

      <div class="table-scroll">
        <table class="table-shell jobs-table">
          <thead>
            <tr>
              <th>Fecha impresion</th>
              <th>Titulo trabajo</th>
              <th>Serie</th>
              <th>Unidad de Negocio</th>
              <th>Sede</th>
              <th>Area</th>
              <th>Mono</th>
              <th>Color</th>
              <th>Total</th>
              <th>Costo mono</th>
              <th>Costo color</th>
              <th>Costo total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id">
              <td>{{ formatDate(row.fecha_impresion) }}</td>
              <td><strong>{{ row.nombre_trabajo || 'Sin titulo' }}</strong></td>
              <td><span class="status-chip">{{ row.impresora_serie || 'Sin serie' }}</span></td>
              <td>{{ row.unidad_negocio || '-' }}</td>
              <td>{{ row.sede || 'Sin inventario' }}</td>
              <td>{{ row.area || '-' }}</td>
              <td>{{ formatNumber(row.paginas_mono) }}</td>
              <td>{{ formatNumber(row.paginas_color) }}</td>
              <td><strong>{{ formatNumber(row.paginas_total) }}</strong></td>
              <td>{{ formatCurrency(row.costo_mono) }}</td>
              <td>{{ formatCurrency(row.costo_color) }}</td>
              <td><strong>{{ formatCurrency(row.costo_total) }}</strong></td>
            </tr>
            <tr v-if="!filteredRows.length && !loading">
              <td colspan="12">
                <div class="empty-state">No hay trabajos impresos para este usuario.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserJobs } from '../services/api'

const route = useRoute()
const router = useRouter()
const rows = ref([])
const loading = ref(false)
const error = ref('')

const decodedUsuario = computed(() => decodeURIComponent(route.params.usuario || ''))

const filteredRows = computed(() => rows.value.filter((row) => {
  const usuario = row.logon_nombre || row.nombre_completo || 'Sin usuario'
  return usuario === decodedUsuario.value
}))

const summary = computed(() => filteredRows.value.reduce((acc, row) => {
  acc.paginas_mono += Number(row.paginas_mono || 0)
  acc.paginas_color += Number(row.paginas_color || 0)
  acc.paginas_total += Number(row.paginas_total || 0)
  acc.costo_total += Number(row.costo_total || 0)
  return acc
}, {
  paginas_mono: 0,
  paginas_color: 0,
  paginas_total: 0,
  costo_total: 0
}))

const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')
const formatCurrency = (value) => `$ ${Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`
const formatDate = (value) => value
  ? new Date(value).toLocaleString('es-PE')
  : '-'

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await getUserJobs(decodedUsuario.value)
    rows.value = data.rows || []
  } catch (err) {
    console.error(err)
    error.value = err.message || 'No se pudo cargar el detalle del usuario'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-grid div {
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
}

.summary-grid span {
  display: block;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.summary-grid strong {
  display: block;
  margin-top: 5px;
  color: #1a1c1c;
  font-size: 18px;
  font-weight: 800;
}

.table-scroll {
  overflow-x: auto;
}

.jobs-table {
  min-width: 1380px;
}

@media (max-width: 1180px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
