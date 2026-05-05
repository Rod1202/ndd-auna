<template>
  <section class="dashboard-card">
    <div class="dashboard-card__inner">
      <h3 class="card-title">Top trabajos de impresion</h3>
    </div>

    <table class="table-shell">
      <thead>
        <tr>
          <th>Documento</th>
          <th>Paginas</th>
          <th>Frecuencia</th>
          <th>Cant. Impresoras</th>
          <th>Cant. Usuarios</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in rows" :key="item.nombre_trabajo">
          <td><strong>{{ item.nombre_trabajo || 'Sin titulo' }}</strong></td>
          <td>{{ formatNumber(item.total_paginas) }}</td>
          <td>{{ formatNumber(item.frecuencia) }} veces</td>
          <td>{{ formatNumber(item.impresoras) }}</td>
          <td>{{ formatNumber(item.usuarios) }}</td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="5">
            <div class="empty-state">No hay trabajos para mostrar.</div>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: Array })

const rows = computed(() => (props.data || []).slice(0, 5))
const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')
</script>
