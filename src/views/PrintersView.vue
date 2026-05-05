<template>
  <section>
    <div class="page-header">
      <div>
        <h1 class="page-title">Impresoras</h1>
        <p class="page-subtitle">Resumen por serie asociado a unidad de negocio, sede y area.</p>
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

    <section class="dashboard-card">
      <div class="dashboard-card__inner">
        <div class="card-header">
          <div>
            <h3 class="card-title">Inventario y consumo por impresora</h3>
            <p class="card-subtitle">Cruce entre print_logs.impresora_serie e inventario.serie.</p>
          </div>
          <span class="status-chip">{{ printers.length }} impresoras</span>
        </div>
      </div>

      <div class="table-scroll">
        <table class="table-shell printers-table">
          <thead>
            <tr>
              <th>Unidad negocio</th>
              <th>Sede</th>
              <th>Area</th>
              <th>Serie</th>
              <th>Cant. Usuarios</th>
              <th>Volumen Monocromatico</th>
              <th>Volumen Color</th>
              <th>Volumen Total</th>
              <th>Costo Monocromatico</th>
              <th>Costo color</th>
              <th>Costo total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="printer in printers" :key="printer.impresora_serie">
              <td>{{ printer.unidad_negocio || '-' }}</td>
              <td>{{ printer.sede || 'Sin inventario' }}</td>
              <td>{{ printer.area || '-' }}</td>
              <td><span class="status-chip">{{ printer.impresora_serie }}</span></td>
              <td>{{ formatNumber(printer.usuarios) }}</td>
              <td>{{ formatNumber(printer.paginas_mono) }}</td>
              <td>{{ formatNumber(printer.paginas_color) }}</td>
              <td><strong>{{ formatNumber(printer.paginas_total) }}</strong></td>
              <td>{{ formatCurrency(printer.costo_mono) }}</td>
              <td>{{ formatCurrency(printer.costo_color) }}</td>
              <td><strong>{{ formatCurrency(printer.costo_total) }}</strong></td>
            </tr>
            <tr v-if="!printers.length && !loading">
              <td colspan="11">
                <div class="empty-state">No hay impresoras para mostrar.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getEnrichedPrints } from '../services/api'

const printers = ref([])
const loading = ref(false)
const error = ref('')

const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')
const formatCurrency = (value) => `$ ${Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await getEnrichedPrints()
    printers.value = [...(data.impresoras || [])]
      .sort((a, b) => Number(b.costo_total || 0) - Number(a.costo_total || 0))
  } catch (err) {
    console.error(err)
    error.value = err.message || 'No se pudo cargar impresoras'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.table-scroll {
  overflow-x: auto;
}

.printers-table {
  min-width: 1240px;
}
</style>
