<template>
  <section>
    <div class="page-header">
      <div>
        <h1 class="page-title">Usuarios</h1>
        <p class="page-subtitle">Tabla dinamica de impresiones por usuario con filtros de inventario.</p>
      </div>
      <div class="page-actions">
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
            <h3 class="card-title">Filtros</h3>
            <p class="card-subtitle">Busca por serie, sede, area o unidad de negocio.</p>
          </div>
          <button class="soft-button" type="button" @click="clearFilters">
            <v-icon icon="mdi-filter-remove-outline" size="18" />
            Limpiar
          </button>
        </div>

        <div class="filters-grid">
          <v-text-field
            v-model="filters.serie"
            label="Impresora / serie"
            clearable
            density="compact"
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            hint="Escribe desde un caracter para buscar la serie"
            persistent-hint
          />
          <v-select
            v-model="filters.sede"
            :items="filterOptions.sedes"
            label="Sede"
            clearable
            density="compact"
            variant="outlined"
          />
          <v-select
            v-model="filters.area"
            :items="filterOptions.areas"
            label="Area"
            clearable
            density="compact"
            variant="outlined"
          />
          <v-select
            v-model="filters.unidadNegocio"
            :items="filterOptions.unidades"
            label="Unidad de negocio"
            clearable
            density="compact"
            variant="outlined"
          />
        </div>
      </div>
    </section>

    <section class="dashboard-card">
      <div class="dashboard-card__inner">
        <div class="card-header">
          <div>
            <h3 class="card-title">Resumen por usuario</h3>
            <p class="card-subtitle">Agrupado por total de impresiones, paginas y costos.</p>
          </div>
          <span class="status-chip">{{ groupedUsers.length }} usuarios</span>
        </div>
      </div>

      <div class="table-scroll">
        <table class="table-shell pivot-table">
          <thead>
            <tr>
              <th>Unidad de Negocio</th>
              <th>Sede</th>
              <th>Area</th>
              <th>Usuario</th>
              <th>Cant. Impresoras</th>
              <th>Trabajos Impresos</th>
              <th>Volumen Monocromatico</th>
              <th>Volumen Color</th>
              <th>Volumen Total</th>
              <th>Costo Monocromatico</th>
              <th>Costo color</th>
              <th>Costo total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in groupedUsers"
              :key="user.usuario"
              class="clickable-row"
              @click="goToUserJobs(user.usuario)"
            >
              <td>{{ joinList(user.unidades_negocio) }}</td>
              <td>{{ joinList(user.sedes) }}</td>
              <td>{{ joinList(user.areas) }}</td>
              <td><strong>{{ user.usuario }}</strong></td>
              <td><strong>{{ formatNumber(user.cantidad_interaccion_impresoras) }}</strong></td>
              <td>{{ formatNumber(user.impresiones) }}</td>
              <td>{{ formatNumber(user.paginas_mono) }}</td>
              <td>{{ formatNumber(user.paginas_color) }}</td>
              <td><strong>{{ formatNumber(user.paginas_total) }}</strong></td>
              <td>{{ formatCurrency(user.costo_mono) }}</td>
              <td>{{ formatCurrency(user.costo_color) }}</td>
              <td><strong>{{ formatCurrency(user.costo_total) }}</strong></td>
            </tr>
            <tr v-if="!groupedUsers.length && !loading">
              <td colspan="12">
                <div class="empty-state">No hay usuarios para los filtros seleccionados.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getEnrichedPrints } from '../services/api'

const router = useRouter()
const rows = ref([])
const loading = ref(false)
const error = ref('')
const filters = reactive({
  serie: '',
  sede: null,
  area: null,
  unidadNegocio: null
})

const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')
const formatCurrency = (value) => `$ ${Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`
const joinList = (items) => items?.length ? items.join(', ') : '-'

const unique = (items) => [...new Set(items.filter(Boolean))].sort()

const filterOptions = computed(() => ({
  sedes: unique(rows.value.map((row) => row.sede)),
  areas: unique(rows.value.map((row) => row.area)),
  unidades: unique(rows.value.map((row) => row.unidad_negocio))
}))

const filteredRows = computed(() => rows.value.filter((row) => {
  const serieSearch = filters.serie?.trim().toUpperCase()

  return (!serieSearch || String(row.impresora_serie || '').toUpperCase().includes(serieSearch))
    && (!filters.sede || row.sede === filters.sede)
    && (!filters.area || row.area === filters.area)
    && (!filters.unidadNegocio || row.unidad_negocio === filters.unidadNegocio)
}))

const groupedUsers = computed(() => {
  const map = new Map()

  for (const row of filteredRows.value) {
    const key = row.logon_nombre || row.nombre_completo || 'Sin usuario'
    const current = map.get(key) || {
      usuario: key,
      impresiones: 0,
      paginas_mono: 0,
      paginas_color: 0,
      paginas_total: 0,
      costo_mono: 0,
      costo_color: 0,
      costo_total: 0,
      impresoras: new Set(),
      sedes: new Set(),
      areas: new Set(),
      unidades_negocio: new Set()
    }

    current.impresiones += 1
    current.paginas_mono += Number(row.paginas_mono || 0)
    current.paginas_color += Number(row.paginas_color || 0)
    current.paginas_total += Number(row.paginas_total || 0)
    current.costo_mono += Number(row.costo_mono || 0)
    current.costo_color += Number(row.costo_color || 0)
    current.costo_total += Number(row.costo_total || 0)
    if (row.impresora_serie) current.impresoras.add(row.impresora_serie)
    if (row.sede) current.sedes.add(row.sede)
    if (row.area) current.areas.add(row.area)
    if (row.unidad_negocio) current.unidades_negocio.add(row.unidad_negocio)

    map.set(key, current)
  }

  return [...map.values()]
    .map((item) => ({
      ...item,
      impresoras: [...item.impresoras],
      cantidad_interaccion_impresoras: item.impresoras.size,
      sedes: [...item.sedes],
      areas: [...item.areas],
      unidades_negocio: [...item.unidades_negocio]
    }))
    .sort((a, b) => b.paginas_total - a.paginas_total)
})

const clearFilters = () => {
  filters.serie = ''
  filters.sede = null
  filters.area = null
  filters.unidadNegocio = null
}

const goToUserJobs = (usuario) => {
  router.push({
    name: 'usuario-trabajos',
    params: { usuario: encodeURIComponent(usuario) }
  })
}

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await getEnrichedPrints()
    rows.value = data.rows || []
  } catch (err) {
    console.error(err)
    error.value = err.message || 'No se pudo cargar usuarios'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.table-scroll {
  overflow-x: auto;
}

.pivot-table {
  min-width: 1280px;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover td {
  background: #eff6ff !important;
}

@media (max-width: 1180px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
