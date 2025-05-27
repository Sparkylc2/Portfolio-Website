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
                <input v-model.number="Ufs" type="number" step="0.5" min="1" placeholder="15" />
                <span class="underline"></span>
            </label>

            <button type="submit">Update&nbsp;Plot</button>
        </form>
        <div class="plot-container">
            <div class="plot-wrapper">
                <div class="plot-title">Streamlines around NACA {{ naca }} | Cₗ = {{ CL.toFixed(3) }}</div>
                <div class="plot" ref="streamlinePlot"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import * as afoil from '../composables/useAirfoilSimulator.js'


const props = defineProps({
    projectColor: {
        type: String,
        default: '#007bff'
    }
})

const naca = ref('2412')
const aoaDeg = ref(10)
const nPanels = ref(200)
const Ufs = ref(15)
const CL = ref(0)

const streamlinePlot = ref(null)
let streamlineChart = null

onMounted(() => {
    streamlineChart = echarts.init(streamlinePlot.value, null, { renderer: 'canvas' })
    window.addEventListener('resize', resizeCharts)
    updatePlot()
})

onUnmounted(() => {
    window.removeEventListener('resize', resizeCharts)
    streamlineChart?.dispose()
})

function resizeCharts() {
    streamlineChart?.resize()
}




async function updatePlot() {
    try {

        const { x, z } = afoil.panelGen(naca.value, nPanels.value, aoaDeg.value)
        const panelCoords = x.map((xi, i) => [xi, z[i]])
        const mu = afoil.solveSystem(panelCoords, Ufs.value, aoaDeg.value)
        CL.value = afoil.liftCoefficient(mu, Ufs.value)


        const [X, Z] = afoil.meshgrid(
            afoil.linspace(-0.2, 1.2, 200),
            afoil.linspace(-0.7, 0.7, 200)
        )


        const streamVel = afoil.velocityField(X, Z, mu, panelCoords, Ufs.value, aoaDeg.value)

        const airfoilLine = {
            type: 'line',
            data: x.slice(0, -1).map((xi, i) => [xi, z[i]]),
            lineStyle: { color: '#fff', width: 2 },
            showSymbol: false
        }


        const streamSeries = generateStreamlines(
            streamVel.u, streamVel.v, X, Z, panelCoords.slice(0, -1)
        ).map(seg => ({
            type: 'line',
            data: seg.x.map((xs, k) => [xs, seg.y[k]]),
            lineStyle: { color: 'red', width: 1 },
            showSymbol: false
        }))



        streamlineChart.setOption({
            tooltip: { show: false },
            xAxis: {
                min: -0.2,
                max: 1.2,
                name: 'x/c',
                splitLine: { show: false },
                axisLine: {
                    onZero: false,
                    lineStyle: { color: 'rgba(0, 0, 0, 0)' }
                },
                axisTick: { show: false },
                axisLabel: { show: false, color: '#fff' }
            },
            yAxis: {
                min: -0.7,
                max: 0.7,
                scale: true,
                name: 'z/c',
                splitLine: { show: false },
                axisLine: { lineStyle: { color: 'rgba(0, 0, 0, 0)' } },
                axisLabel: { show: false, color: '#fff' }
            },
            grid: {show: false,},
            animation: false,
            aria: { enabled: true },
            series: [airfoilLine, ...streamSeries]
        }, true);

    } catch (err) {
        console.error('[AirfoilSimulator] update failed:', err)
    }
}


function generateStreamlines(u, v, X, Z, foilVerts) {
    const streamlines = []
    const nStream = 20
    const domain = { xMin: -0.2, xMax: 1.2, zMin: -0.7, zMax: 0.7 }

    const starts = []
    for (let i = 0; i < nStream; i++) {
        const z = domain.zMin + (domain.zMax - domain.zMin) * i / (nStream - 1)
        starts.push([domain.xMin, z])
    }
    for (let i = 1; i < nStream / 2; i++) {
        const x = domain.xMin + (domain.xMax - domain.xMin) * i / (nStream / 2)
        starts.push([x, domain.zMax])
        starts.push([x, domain.zMin])
    }

    for (const s of starts) {
        const line = integrateStreamline(s, u, v, X, Z, foilVerts)
        if (line.x.length > 5) streamlines.push(line)
    }
    return streamlines
}

function integrateStreamline(start, u, v, X, Z, foilVerts, maxSteps = 600) {
    const dx = X[0][1] - X[0][0]
    const dz = Z[1][0] - Z[0][0]
    const dt = 0.01

    const xs = [start[0]]
    const zs = [start[1]]

    let [x, z] = start

    for (let step = 0; step < maxSteps; step++) {
        const i = Math.floor((x - X[0][0]) / dx)
        const j = Math.floor((z - Z[0][0]) / dz)
        if (i < 0 || i >= X[0].length - 1 || j < 0 || j >= Z.length - 1) break

        const fx = (x - X[0][i]) / dx
        const fz = (z - Z[j][0]) / dz

        const uInterp = bilerp(u, i, j, fx, fz)
        const vInterp = bilerp(v, i, j, fx, fz)
        if (Number.isNaN(uInterp)) break

        x += uInterp * dt
        z += vInterp * dt
        if (afoil.isInsidePolygon([x, z], foilVerts)) break

        xs.push(x); zs.push(z)
        if (Math.hypot(uInterp, vInterp) < 0.05) break
    }

    return { x: xs, y: zs }
}

function bilerp(field, i, j, fx, fz) {
    const f00 = field[j][i]
    const f10 = field[j][i + 1]
    const f01 = field[j + 1][i]
    const f11 = field[j + 1][i + 1]
    if ([f00, f10, f01, f11].some(Number.isNaN)) return NaN
    return (1 - fx) * (1 - fz) * f00 +
        fx * (1 - fz) * f10 +
        (1 - fx) * fz * f01 +
        fx * fz * f11
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
    gap: 2rem;
    align-items: center;
}

.plot-wrapper {
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
