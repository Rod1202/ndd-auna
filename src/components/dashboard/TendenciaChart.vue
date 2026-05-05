<template>
  <section class="dashboard-card">
    <div class="dashboard-card__inner">
      <div class="card-header">
        <div>
          <h3 class="card-title">Tendencia de impresion</h3>
          <p class="card-subtitle">Volumen total y costo por dia.</p>
        </div>
        <div class="chart-legend">
          <span><i class="chart-legend__dot chart-legend__dot--blue" />Paginas</span>
          <span><i class="chart-legend__dot chart-legend__dot--teal" />Costo</span>
        </div>
      </div>
      <div class="chart-frame">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(LineElement, Filler, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

const props = defineProps({
  data: Array
})

const chartData = computed(() => ({
  labels: (props.data || []).map(d => d.dia),
  datasets: [
    {
      label: 'Paginas',
      data: (props.data || []).map(d => Number(d.total_paginas || 0)),
      borderColor: '#0050cb',
      backgroundColor: 'rgba(0, 80, 203, 0.08)',
      pointBackgroundColor: '#0050cb',
      pointRadius: 3,
      borderWidth: 3,
      tension: 0.36,
      fill: true
    },
    {
      label: 'Costo',
      data: (props.data || []).map(d => Number(d.total_costo || 0)),
      borderColor: '#14b8a6',
      pointBackgroundColor: '#14b8a6',
      pointRadius: 2,
      borderWidth: 2,
      borderDash: [5, 5],
      tension: 0.36,
      yAxisID: 'y1'
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      titleFont: { size: 12, weight: '700' },
      bodyFont: { size: 12 }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11, weight: '700' } }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { color: '#94a3b8', font: { size: 11 } }
    },
    y1: {
      beginAtZero: true,
      display: false
    }
  }
}
</script>

<style scoped>
.chart-frame {
  height: 320px;
}

.chart-legend {
  display: flex;
  gap: 16px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.chart-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.chart-legend__dot--blue {
  background: var(--primary);
}

.chart-legend__dot--teal {
  background: #14b8a6;
}
</style>
