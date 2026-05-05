<template>
  <section class="dashboard-card">
    <div class="dashboard-card__inner">
      <div class="card-header">
        <div>
          <h3 class="card-title">Color vs Mono</h3>
          <p class="card-subtitle">Distribucion de paginas procesadas.</p>
        </div>
      </div>
      <div class="donut-summary">
        <div class="donut-summary__ring" :style="{ '--color-percent': colorPercent }">
          <div>
            <strong>{{ colorPercent }}%</strong>
            <span>Color</span>
          </div>
        </div>
        <div class="donut-summary__legend">
          <div>
            <span><i class="dot dot--blue" /> Color</span>
            <strong>{{ formatNumber(totalColor) }}</strong>
          </div>
          <div>
            <span><i class="dot dot--slate" /> Mono</span>
            <strong>{{ formatNumber(totalMono) }}</strong>
          </div>
        </div>
      </div>
      <div class="bar-frame">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  data: Object
})

const totalColor = computed(() => Number(props.data?.total_color || 0))
const totalMono = computed(() => Number(props.data?.total_mono || 0))
const total = computed(() => totalColor.value + totalMono.value)
const colorPercent = computed(() => {
  if (!total.value) return 0
  return Math.round((totalColor.value / total.value) * 100)
})

const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')

const chartData = computed(() => ({
  labels: ['Color', 'Mono'],
  datasets: [
    {
      label: 'Paginas',
      data: [
        totalColor.value,
        totalMono.value
      ],
      backgroundColor: ['#0050cb', '#cbd5e1'],
      borderRadius: 8
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 11, weight: '700' } }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { color: '#94a3b8' }
    }
  }
}
</script>

<style scoped>
.donut-summary {
  display: grid;
  justify-items: center;
  gap: 22px;
  margin-bottom: 22px;
}

.donut-summary__ring {
  display: grid;
  width: 154px;
  height: 154px;
  place-items: center;
  border-radius: 999px;
  background: conic-gradient(var(--primary) calc(var(--color-percent) * 1%), #e2e8f0 0);
}

.donut-summary__ring > div {
  display: grid;
  width: 116px;
  height: 116px;
  place-items: center;
  align-content: center;
  border-radius: inherit;
  background: #fff;
}

.donut-summary__ring strong {
  color: #1a1c1c;
  font-size: 26px;
  font-weight: 800;
}

.donut-summary__ring span {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.donut-summary__legend {
  display: grid;
  width: 100%;
  gap: 10px;
}

.donut-summary__legend div {
  display: flex;
  justify-content: space-between;
  color: #334155;
  font-size: 13px;
}

.donut-summary__legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.dot--blue {
  background: var(--primary);
}

.dot--slate {
  background: #cbd5e1;
}

.bar-frame {
  height: 190px;
}
</style>
