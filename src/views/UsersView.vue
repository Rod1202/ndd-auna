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
            <p class="card-subtitle">Busca por usuario, serie, sede, area o unidad de negocio.</p>
          </div>
          <button class="soft-button" type="button" @click="clearFilters">
            <v-icon icon="mdi-filter-remove-outline" size="18" />
            Limpiar
          </button>
        </div>

        <div class="filters-grid">
          <v-text-field
            v-model="filters.usuario"
            label="Usuario / logon"
            clearable
            density="compact"
            variant="outlined"
            prepend-inner-icon="mdi-account-search-outline"
            hint="Busca por nombre de logon"
            persistent-hint
          />
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
              <th class="expand-column"></th>
              <th>Usuario</th>
              <th>Unidad de Negocio</th>
              <th>Sede</th>
              <th>Cant. Impresoras</th>
              <th>Trabajos Impresos</th>
              <th>Volumen Total</th>
              <th>Costo total</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="user in groupedUsers"
              :key="user.usuario"
            >
              <tr class="clickable-row" @click="toggleUser(user.usuario)">
                <td class="expand-column">
                  <button
                    class="icon-button"
                    type="button"
                    :aria-label="isExpanded(user.usuario) ? 'Contraer usuario' : 'Expandir usuario'"
                    @click.stop="toggleUser(user.usuario)"
                  >
                    <v-icon :icon="isExpanded(user.usuario) ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20" />
                  </button>
                </td>
                <td><strong>{{ user.usuario }}</strong></td>
                <td>{{ compactList(user.unidades_negocio) }}</td>
                <td>{{ compactList(user.sedes) }}</td>
                <td><strong>{{ formatNumber(user.cantidad_interaccion_impresoras) }}</strong></td>
                <td>{{ formatNumber(user.impresiones) }}</td>
                <td><strong>{{ formatNumber(user.paginas_total) }}</strong></td>
                <td><strong>{{ formatCurrency(user.costo_total) }}</strong></td>
                <td>
                  <button class="soft-button table-action" type="button" @click.stop="goToUserJobs(user.usuario)">
                    <v-icon icon="mdi-file-document-outline" size="16" />
                    Ver trabajos
                  </button>
                </td>
              </tr>
              <tr v-if="isExpanded(user.usuario)" class="expanded-row">
                <td colspan="9">
                  <div class="expanded-detail">
                    <div class="detail-section">
                      <span class="detail-label">Inventario asociado</span>
                      <div class="detail-grid">
                        <div>
                          <span>Unidad de negocio</span>
                          <strong>{{ joinList(user.unidades_negocio) }}</strong>
                        </div>
                        <div>
                          <span>Sede</span>
                          <strong>{{ joinList(user.sedes) }}</strong>
                        </div>
                        <div>
                          <span>Area</span>
                          <strong>{{ joinList(user.areas) }}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <span class="detail-label">Desglose de volumen</span>
                      <div class="detail-grid detail-grid--numbers">
                        <div>
                          <span>Volumen monocromatico</span>
                          <strong>{{ formatNumber(user.paginas_mono) }}</strong>
                        </div>
                        <div>
                          <span>Volumen color</span>
                          <strong>{{ formatNumber(user.paginas_color) }}</strong>
                        </div>
                        <div>
                          <span>Volumen total</span>
                          <strong>{{ formatNumber(user.paginas_total) }}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <span class="detail-label">Desglose de costos</span>
                      <div class="detail-grid detail-grid--numbers">
                        <div>
                          <span>Costo monocromatico</span>
                          <strong>{{ formatCurrency(user.costo_mono) }}</strong>
                        </div>
                        <div>
                          <span>Costo color</span>
                          <strong>{{ formatCurrency(user.costo_color) }}</strong>
                        </div>
                        <div>
                          <span>Costo total</span>
                          <strong>{{ formatCurrency(user.costo_total) }}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section detail-section--wide">
                      <span class="detail-label">Series usadas</span>
                      <div class="chip-list">
                        <span
                          v-for="serie in visibleSeries(user.impresoras)"
                          :key="serie"
                          class="detail-chip"
                        >
                          {{ serie }}
                        </span>
                        <span v-if="hiddenSeriesCount(user.impresoras)" class="detail-chip detail-chip--muted">
                          +{{ hiddenSeriesCount(user.impresoras) }} mas
                        </span>
                        <span v-if="!user.impresoras?.length" class="muted-text">Sin series registradas</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!groupedUsers.length && !loading">
              <td colspan="9">
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
const summaryUsers = ref([])
const loading = ref(false)
const error = ref('')
const expandedUsers = ref([])
const filters = reactive({
  usuario: '',
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
const compactList = (items) => {
  const list = items?.filter(Boolean) || []
  if (!list.length) return '-'
  if (list.length <= 2) return list.join(', ')
  return `${list.slice(0, 2).join(', ')} +${list.length - 2}`
}
const visibleSeries = (items) => (items || []).filter(Boolean).slice(0, 12)
const hiddenSeriesCount = (items) => Math.max((items || []).filter(Boolean).length - 12, 0)

const unique = (items) => [...new Set(items.filter(Boolean))].sort()

const filterOptions = computed(() => ({
  sedes: unique([
    ...rows.value.map((row) => row.sede),
    ...summaryUsers.value.flatMap((user) => user.sedes || [])
  ]),
  areas: unique([
    ...rows.value.map((row) => row.area),
    ...summaryUsers.value.flatMap((user) => user.areas || [])
  ]),
  unidades: unique([
    ...rows.value.map((row) => row.unidad_negocio),
    ...summaryUsers.value.flatMap((user) => user.unidades_negocio || [])
  ])
}))

const filteredSummaryUsers = computed(() => summaryUsers.value.filter((user) => {
  const userSearch = filters.usuario?.trim().toUpperCase()
  const serieSearch = filters.serie?.trim().toUpperCase()
  const usuario = `${user.usuario || ''} ${user.nombre_completo || ''}`.toUpperCase()
  const impresoras = (user.impresoras || []).map((item) => String(item || '').toUpperCase())

  return (!userSearch || usuario.includes(userSearch))
    && (!serieSearch || impresoras.some((serie) => serie.includes(serieSearch)))
    && (!filters.sede || (user.sedes || []).includes(filters.sede))
    && (!filters.area || (user.areas || []).includes(filters.area))
    && (!filters.unidadNegocio || (user.unidades_negocio || []).includes(filters.unidadNegocio))
}))

const filteredRows = computed(() => rows.value.filter((row) => {
  const userSearch = filters.usuario?.trim().toUpperCase()
  const serieSearch = filters.serie?.trim().toUpperCase()
  const usuario = `${row.logon_nombre || ''} ${row.nombre_completo || ''}`.toUpperCase()

  return (!userSearch || usuario.includes(userSearch))
    && (!serieSearch || String(row.impresora_serie || '').toUpperCase().includes(serieSearch))
    && (!filters.sede || row.sede === filters.sede)
    && (!filters.area || row.area === filters.area)
    && (!filters.unidadNegocio || row.unidad_negocio === filters.unidadNegocio)
}))

const groupedUsers = computed(() => {
  if (summaryUsers.value.length) {
    return [...filteredSummaryUsers.value]
      .sort((a, b) => Number(b.costo_total || 0) - Number(a.costo_total || 0))
  }

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
    .sort((a, b) => b.costo_total - a.costo_total)
})

const clearFilters = () => {
  filters.usuario = ''
  filters.serie = ''
  filters.sede = null
  filters.area = null
  filters.unidadNegocio = null
}

const isExpanded = (usuario) => expandedUsers.value.includes(usuario)
const toggleUser = (usuario) => {
  expandedUsers.value = isExpanded(usuario)
    ? expandedUsers.value.filter((item) => item !== usuario)
    : [...expandedUsers.value, usuario]
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
    summaryUsers.value = data.usuarios || []
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.table-scroll {
  overflow-x: auto;
}

.pivot-table {
  min-width: 1080px;
}

.expand-column {
  width: 48px;
  min-width: 48px;
}

.icon-button {
  align-items: center;
  background: #eef5ff;
  border: 0;
  border-radius: 8px;
  color: #0054d6;
  cursor: pointer;
  display: inline-flex;
  height: 32px;
  justify-content: center;
  transition: background 0.2s ease, color 0.2s ease;
  width: 32px;
}

.icon-button:hover {
  background: #dbeafe;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover td {
  background: #eff6ff !important;
}

.table-action {
  min-height: 32px;
  padding: 7px 12px;
  white-space: nowrap;
}

.expanded-row td {
  background: #f8fbff;
  padding: 0 !important;
}

.expanded-detail {
  border-top: 1px solid #e4edf8;
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 20px 24px 24px;
}

.detail-section {
  min-width: 0;
}

.detail-section--wide {
  grid-column: 1 / -1;
}

.detail-label {
  color: #0054d6;
  display: block;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.detail-grid {
  display: grid;
  gap: 10px;
}

.detail-grid > div {
  background: #ffffff;
  border: 1px solid #e7eef8;
  border-radius: 8px;
  min-height: 74px;
  padding: 12px 14px;
}

.detail-grid span {
  color: #64748b;
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.detail-grid strong {
  color: #1f2f46;
  display: block;
  font-size: 13px;
  line-height: 1.5;
}

.detail-grid--numbers {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-grid--numbers strong {
  font-size: 18px;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-chip {
  background: #eef5ff;
  border-radius: 7px;
  color: #0054d6;
  font-size: 12px;
  font-weight: 800;
  padding: 7px 10px;
}

.detail-chip--muted {
  background: #f1f5f9;
  color: #5f6f86;
}

.muted-text {
  color: #8392a8;
  font-size: 13px;
}

@media (max-width: 1180px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .expanded-detail {
    grid-template-columns: 1fr;
  }

  .detail-grid--numbers {
    grid-template-columns: 1fr;
  }
}
</style>
