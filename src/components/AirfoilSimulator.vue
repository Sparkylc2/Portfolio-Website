<template>
    <div class="airfoil-simulator">
        <form class="controls" @submit.prevent="updatePlot">
            <label>
                NACA Code:
                <input v-model="naca" pattern="\d{4}" maxlength="4" placeholder="2412" />
                <span class="underline"></span>
            </label>

            <label>
                AoA (°):
                <input v-model.number="aoaDeg" type="number" step="0.5" placeholder="10" />
                <span class="underline"></span>
            </label>

            <label>
                Panels:
                <input v-model.number="nPanels" type="number" min="50" max="500" step="10" placeholder="200" />
                <span class="underline"></span>
            </label>

            <label>
                U (m/s):
                <input v-model.number="uFs" type="number" step="0.5" min="1" placeholder="15" />
                <span class="underline"></span>
            </label>

            <button type="submit">Update&nbsp;Plot</button>
        </form>
        <div class="plot-container">
            <div class="plot-wrapper">
                <div class="plot-title">Streamlines around NACA {{ naca }} | Cₗ = {{ CL.toFixed(3) }}</div>
                <div v-if="!error" class="plot" ref="streamlinePlot"></div>
                <div v-else class="plot-error-wrapper" ref="streamlinePlot">
                    <h2> An error occured </h2>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import init from '../../public/wasm/airfoil_simulator.js'

defineProps({
    projectColor: {
        type: String,
        default: '#007bff'
    }
})

const error = ref(false)
const naca = ref('2412')
const aoaDeg = ref(10)
const nPanels = ref(200)
const uFs = ref(15)
const CL = ref(0)

const wasm = ref(null)

const streamlinePlot = ref(null)
let streamlineChart = null

function resizeCharts() {
    streamlineChart?.resize()
}

function matToJs(mat, wasm) {
  const r = wasm.matrix_rows(mat), c = wasm.matrix_cols(mat)
  const arr = Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => wasm.matrix_coeff(mat, i, j)))
  mat.delete()                     
  return arr
}

function disposeStreamData(res) {
  if (!res) return
  
  res.mu?.delete()
  
  res.stream_field?.u?.delete()
  res.stream_field?.v?.delete()
  
  res.stream_grid?.x?.delete()
  res.stream_grid?.z?.delete()
  
  if (res.streamlines) {
    const n = res.streamlines.size()
    for (let i = 0; i < n; i++) {
      res.streamlines.get(i)?.delete()
    }
    res.streamlines.delete()
  }
  
  res.delete?.()
}

onMounted(() => {
    try {
        streamlineChart = echarts.init(streamlinePlot.value, null, { renderer: 'canvas' })
        window.addEventListener('resize', resizeCharts)
    } catch (err) {
        console.error('[AirfoilSimulator] Failed to initialize ECharts:', err)
        error.value = true
        return
    }

    init().then(mod => {
        wasm.value = mod
        updatePlot()
    }).catch(err => {
        console.error('[AirfoilSimulator] Failed to load WASM module:', err)
        error.value = true
    })
})

onUnmounted(() => {
    window.removeEventListener('resize', resizeCharts)
    streamlineChart?.dispose()
})

async function updatePlot() {
    if (!wasm.value) return
    try {
        const res = wasm.value.analyze_airfoil(
            naca.value,
            uFs.value,
            aoaDeg.value,
            nPanels.value,
            40
        )

        CL.value = res.cl

        const foil = matToJs(res.airfoil_coords, wasm.value).slice(0, -1) 

        const streamSeries = []
        const nLines = res.streamlines.size()
        for (let k = 0; k < nLines; k++) {
            streamSeries.push({
            type: 'line',
            data: matToJs(res.streamlines.get(k), wasm.value),
            lineStyle: { color: 'rgb(140, 172, 204)', width: 1 },
            showSymbol: false
            })
        }

        disposeStreamData(res)

        streamlineChart.setOption({
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
                    showSymbol: false
                },
                ...streamSeries
            ]
        }, true)
    } catch (err) {
        error.value = true
        console.error('[AirfoilSimulator] update failed:', err)
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
    flex-wrap: nowrap;
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

.controls input:hover ~ .underline {
    width: 100%;
}

.controls input:focus ~ .underline {
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
    background-color: rgb(140, 172, 204);
    transition: all 0.3s ease;
}

button:hover {
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
