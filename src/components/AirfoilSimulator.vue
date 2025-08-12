<template>
  <div class="airfoil-simulator">
    <form class="form-controls" @submit.prevent="updatePlot">
      <BaseInput v-model="naca" label="NACA Code" type="text" pattern="\d{4}" maxlength="4" placeholder="2412"
        colorKey="blue" :dynamicUnderline="true" />

      <BaseInput v-model.number="aoaDeg" label="AoA (°)" type="number" min="-90" max="90" placeholder="10"
        colorKey="blue" :dynamicUnderline="true" />
      <BaseInput v-model.number="nPanels" label="Panels" type="number" min="2" max="1000" placeholder="200"
        colorKey="blue" :dynamicUnderline="true" />
      <BaseInput v-model.number="uFs" label="U (m/s)" type="number" min="1" max="100" placeholder="15" colorKey="blue"
        :dynamicUnderline="true" />
      <BaseButton type="submit" colorKey="blue" :disabled="isComputing">
        <template v-if="!isComputing">Update Plot</template>
        <template v-else>Computing…</template>
      </BaseButton>
    </form>

    <div class="plot-container">
      <div class="plot-wrapper">
        <div class="plot-title">Streamlines around NACA {{ naca }} | Cₗ = {{ clDisplay }}</div>
        <div v-if="!error" class="plot extreme-mask" ref="streamlinePlot"></div>
        <div v-else class="plot-error-wrapper" ref="streamlinePlot">
          <h2> An error occured </h2>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import BaseInput from './elements/BaseInput.vue'
import BaseButton from './elements/BaseButton.vue'
const props = defineProps({
  projectColor: {
    type: String,
    default: '#007bff'
  }
})


const error = ref(false)
const errorMessage = ref('')
const isComputing = ref(false)

const naca = ref('2412')
const aoaDeg = ref(0)
const nPanels = ref(200)
const uFs = ref(15)
const CL = ref(0)
const clDisplay = computed(() => (Number.isFinite(CL.value) ? CL.value.toFixed(3) : '—'))

const streamlinePlot = ref(null)
let streamlineChart = null

function resizeCharts() {
  streamlineChart?.resize()
}


let worker = null
function ensureWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/airfoil.worker.js', import.meta.url), { type: 'module' })
    worker.addEventListener('message', onWorkerMessage)
    worker.addEventListener('error', (e) => {
      error.value = true
      errorMessage.value = `Worker error: ${e.message || 'unknown'}`
      isComputing.value = false
    })
  }
}

function disposeWorker() {
  if (worker) {
    worker.removeEventListener('message', onWorkerMessage)
    worker.terminate()
    worker = null
  }
}

function onWorkerMessage(e) {
  const data = e.data
  if (!data) return

  if (data.error) {
    error.value = true
    errorMessage.value = data.error
    isComputing.value = false
    return
  }

  try {
    CL.value = data.cl

    const foil = []
    for (let i = 0; i < data.foil.length - 2; i += 2) {
      foil.push([data.foil[i], data.foil[i + 1]])
    }

    const streamSeries = []
    for (let k = 0; k < data.nLines; k++) {
      const buf = new Float32Array(data.streamBuffers[k])
      const line = []
      for (let i = 0; i < buf.length; i += 2) {
        line.push([buf[i], buf[i + 1]])
      }
      streamSeries.push({
        type: 'line',
        data: line,
        lineStyle: { color: 'rgb(140, 172, 204)', width: 1 },
        showSymbol: false,
        silent: true
      })
    }

    streamlineChart.setOption(
      {
        tooltip: { show: false },
        xAxis: {
          min: -0.2,
          max: 1.2,
          name: 'x/c',
          splitLine: { show: false },
          axisLine: { onZero: false, lineStyle: { color: 'rgba(0,0,0,0)' } },
          axisTick: { show: false },
          axisLabel: { show: false }
        },
        yAxis: {
          min: -0.7,
          max: 0.7,
          scale: true,
          name: 'z/c',
          splitLine: { show: false },
          axisLine: { lineStyle: { color: 'rgba(0,0,0,0)' } },
          axisLabel: { show: false }
        },
        grid: { show: false },
        animation: false,
        aria: { enabled: true },
        series: [
          {
            type: 'line',
            data: foil,
            lineStyle: { color: '#fff', width: 2 },
            showSymbol: false,
            silent: true
          },
          ...streamSeries
        ]
      },
      { notMerge: true, lazyUpdate: true }
    )
  } catch (err) {
    error.value = true
    errorMessage.value = String(err)
  } finally {
    isComputing.value = false
  }
}


onMounted(() => {
  try {
    streamlineChart = echarts.init(streamlinePlot.value, null, { renderer: 'canvas' })
    window.addEventListener('resize', resizeCharts)
  } catch (err) {
    console.error('[AirfoilSimulator] Failed to initialize ECharts:', err)
    error.value = true
    errorMessage.value = 'Failed to initialize chart'
    return
  }

  updatePlot()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  streamlineChart?.dispose()
  disposeWorker()
})


async function updatePlot() {
  ensureWorker()

  if (isComputing.value) return
  isComputing.value = true
  error.value = false
  errorMessage.value = ''

  const payload = {
    naca: String(naca.value || ''),
    uFs: Number(uFs.value || 0),
    aoaDeg: Number(aoaDeg.value || 0),
    nPanels: Number(nPanels.value || 0),
    nStreams: 40
  }

  try {
    worker.postMessage(payload)
  } catch (err) {
    isComputing.value = false
    error.value = true
    errorMessage.value = `Failed to post to worker: ${String(err)}`
  }
}
</script>

<style scoped>
.airfoil-simulator {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  background-color: rgb(36, 36, 36);
  border-radius: 8px;
  overflow-x: auto;
}

.controls label {
  position: relative;
  display: flex;
  flex-direction: column;
  font-weight: 600;
  font-size: 14px;
  color: #ccc;
  white-space: nowrap;
  cursor: text;
}

.controls input {
  all: unset;
  font-size: 14px;
  padding: 0.3rem 0;
  color: #fff;
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 6rem;
  appearance: textfield;
}

.controls input[type='number'] {
  appearance: textfield;
}

.controls input::-webkit-inner-spin-button,
.controls input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.controls input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.controls input:focus {
  outline: none;
}

.controls .underline {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background-color: rgb(140, 172, 204);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 9999px;
}

.controls input:hover~.underline,
.controls input:focus~.underline {
  width: 100%;
}

button {
  padding: 0.4rem 0.8rem;
  color: white;
  border-radius: 0.4rem;
  text-decoration: none;
  white-space: nowrap;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  border-radius: 0.4rem;
  border: 0.15rem solid rgb(140, 172, 204);
  min-width: fit-content;
}

button:disabled {
  opacity: 0.65;
  cursor: default;
}

button:hover:enabled {
  border-color: rgb(140, 172, 204);
  transform: translateY(-2px);
  filter: brightness(1.2);
}

.plot-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.plot-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  width: 100%;
}

.plot-error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  width: 100%;
}

.plot-title {
  color: #fff;
  font-size: 18px;
  font-weight: normal;
  text-align: center;
  margin-bottom: 0.2rem;
  white-space: nowrap;
}

.plot {
  aspect-ratio: 1 / 1;
  max-width: 600px;
  max-height: 600px;
  width: 100%;
  height: auto;
  border-radius: 4px;
  background: rgb(36, 36, 36);
  mask-image: linear-gradient(to top, transparent 0%, black 35%, black 65%, transparent 100%),
    linear-gradient(to left, transparent 0%, black 35%, black 65%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-image: linear-gradient(to top, transparent 0%, black 35%, black 65%, transparent 100%),
    linear-gradient(to left, transparent 0%, black 35%, black 65%, transparent 100%);
  -webkit-mask-composite: source-in;
}
</style>
