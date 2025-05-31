<template>
    <div class="bem-simulator">
        <div class="controls-container">
            <form class="controls" @submit.prevent="runBEM">
                <div class="control-group">
                    <h3>Rotor Geometry</h3>
                    <label>
                        Radius (m):
                        <input v-model.number="radius" type="number" step="1" placeholder="50" />
                        <span class="underline"></span>
                    </label>
                    <label>
                        Hub Radius (m):
                        <input v-model.number="hubRadius" type="number" step="0.5" placeholder="2.5" />
                        <span class="underline"></span>
                    </label>
                    <label>
                        Blades:
                        <input v-model.number="numBlades" type="number" min="1" max="5" step="1" placeholder="3" />
                        <span class="underline"></span>
                    </label>
                </div>
                <div class="control-group">
                    <h3>Blade Profile</h3>
                    <label>
                        Chord Distribution:
                        <MathLiveEditor ref="chordField" v-model="chord_distribution"
                            :primaryColorKey="props.projectColor" />
                    </label>
                    <label>
                        Twist Distribution:
                        <MathLiveEditor ref="twistField" v-model="twist_distribution"
                            :primaryColorKey="props.projectColor" />
                    </label>
                </div>

                <div class="control-group">
                    <h3>Operating Conditions</h3>
                    <label>
                        Wind (m/s):
                        <input v-model.number="windSpeed" type="number" step="0.5" min="1" placeholder="10" />
                        <span class="underline"></span>
                    </label>
                    <label>
                        TSR:
                        <input v-model.number="tsr" type="number" step="0.5" min="0.5" max="15" placeholder="7" />
                        <span class="underline"></span>
                    </label>
                    <label>
                        Airfoil:
                        <select v-model="airfoil">
                            <option value="NACA2412">NACA 2412</option>
                            <option value="NACA0012">NACA 0012</option>
                        </select>
                    </label>
                </div>

                <div class="control-group buttons">
                    <button type="submit">Run BEM</button>
                    <button type="button" @click="runTSRSweep">TSR Sweep</button>
                </div>
            </form>
        </div>

        <div class="results-container" v-if="results">
            <div class="result-cards">
                <div class="result-card">
                    <div class="result-label">Thrust</div>
                    <div class="result-value">{{ airfoil.length !== 0 ? (results.thrust / 1000).toFixed(2) : 0 }} kN
                    </div>
                </div>
                <div class="result-card">
                    <div class="result-label">Torque</div>
                    <div class="result-value">{{ airfoil.length !== 0 ? (results.torque / 1000).toFixed(2) : 0 }} kNm
                    </div>
                </div>
                <div class="result-card">
                    <div class="result-label">Power</div>
                    <div class="result-value">{{ airfoil.length !== 0 ? (results.power / 1000000).toFixed(3) : 0 }} MW
                    </div>
                </div>
                <div class="result-card" :class="{ warning: results.cp > 0.593 }">
                    <div class="result-label">Cp</div>
                    <div class="result-value">{{ airfoil.length !== 0 ? results.cp.toFixed(4) : 0 }}</div>
                    <div v-if="results.cp > 0.593" class="result-warning">Exceeds Betz limit!</div>
                </div>
            </div>
        </div>

        <div class="plots-grid">
            <div class="plot-container blade-plot">
                <div class="plot-wrapper">
                    <div class="plot-title">3D Blade Geometry</div>
                    <div class="plot" ref="bladePlot"></div>
                </div>
            </div>

            <div class="plot-container">
                <div class="plot-wrapper">
                    <div class="plot-title">{{ plotTitle }}</div>
                    <div v-if="!error" class="plot" ref="bemPlot"></div>
                    <div v-else class="plot-error-wrapper" ref="bemPlot">
                        <h2>An error occurred</h2>
                    </div>
                </div>
            </div>

            <div class="plot-container" v-if="showSecondPlot">
                <div class="plot-wrapper">
                    <div class="plot-title">Angle of Attack & Lift Coefficient</div>
                    <div v-if="!error" class="plot" ref="secondPlot"></div>
                    <div v-else class="plot-error-wrapper" ref="secondPlot">
                        <h2>An error occurred</h2>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import * as echarts from 'echarts'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import init from '../wasm/wind_turbine.js'
import MathLiveEditor from './MathParsingField.vue'

const props = defineProps({
    projectColor: {
        type: String,
        default: 'rgb(140, 172, 204)'
    }
})

const error = ref(false)
const radius = ref(50)
const hubRadius = ref(2.5)
const numBlades = ref(3)
const windSpeed = ref(10)
const tsr = ref(7)
const numSections = ref(20)
const airfoil = ref('')

const chord_distribution = ref("3.0 \\cdot (1.0 - \\frac{r}{50})")
const twist_distribution = ref("0.5 \\cdot (1.0 - \\frac{r}{50})")

const chordField = ref(null)
const twistField = ref(null)

const results = ref(null)
const showSecondPlot = ref(false)
const plotMode = ref('blade')

const wasm = ref(null)

const bemPlot = ref(null)
const secondPlot = ref(null)
const bladePlot = ref(null)
let bemChart = null
let secondChart = null
let threeRenderer = null
let threeScene = null
let bladeMesh = null
let threeCamera = null
let threeControls = null

const plotTitle = computed(() =>
    plotMode.value === 'sweep' ? 'TSR Sweep Results' : 'Blade Spanwise Distribution'
)

function resizeCharts() {
    bemChart?.resize()
    secondChart?.resize()
    if (threeRenderer && bladePlot.value) {
        const { clientWidth: w, clientHeight: h } = bladePlot.value
        threeCamera.aspect = w / h
        threeCamera.updateProjectionMatrix()
        threeRenderer.setSize(w, h)
    }
}

function getChordExpr() {
    return chordField.value?.getPlaintext() || ''
}

function getTwistExpr() {
    return twistField.value?.getPlaintext() || ''
}

function generateBladeGeometry() {
    if (!wasm.value) return { vertices: [], indices: [] }

    const rValues = Array.from({ length: numSections.value + 1 }, (_, i) =>
        hubRadius.value + i * (radius.value - hubRadius.value) / numSections.value
    )


    const geometry = wasm.value.generateBladeSurface(
        rValues,
        airfoil.value,
        getChordExpr(),
        getTwistExpr()
    )

    if (!geometry || !geometry.vertices || !geometry.indices) return { vertices: [], indices: [] }

    return { vertices: geometry.vertices, indices: geometry.indices }
}

onMounted(() => {
    try {
        if (bladePlot.value) initThree()

        bemChart = echarts.init(bemPlot.value, null, { renderer: 'canvas' })
        window.addEventListener('resize', resizeCharts)
    } catch (err) {
        error.value = true
        return
    }

    init()
        .then(mod => {
            wasm.value = mod
            runBEM()
        })
        .catch(() => (error.value = true))

})

onUnmounted(() => {
    window.removeEventListener('resize', resizeCharts)
    bemChart?.dispose()
    secondChart?.dispose()
    if (threeRenderer) {
        threeRenderer.dispose()
    }
})

watch([radius, hubRadius, numBlades, airfoil], () => {
    updateBladeGeometry()
})

watch([chord_distribution, twist_distribution], () => {
    updateBladeGeometry()
})

async function runBEM() {
    if (!wasm.value) return

    try {
        plotMode.value = 'blade'
        showSecondPlot.value = true

        const chordExpr = getChordExpr()
        const twistExpr = getTwistExpr()

        wasm.value.loadPolarData()
        wasm.value.initializeRotor(
            radius.value,
            hubRadius.value,
            numBlades.value,
            windSpeed.value,
            tsr.value
        )
        wasm.value.clearBladeSections()
        wasm.value.buildBladeSectionsWithExpressions(
            numSections.value,
            chordExpr,
            twistExpr,
            airfoil.value
        )

        results.value = wasm.value.runBEM()

        plotBladeDistribution()
    } catch (err) {
        error.value = true
    }
}

function plotBladeDistribution() {
    if (!results.value || !bemChart) return

    const sections = results.value.sections
    const r = sections.map(s => s.r)
    const a = sections.map(s => s.a)
    const aPrime = sections.map(s => s.a_prime)
    const alpha = sections.map(s => s.alpha)
    const cl = sections.map(s => s.cl)

    if (!secondChart && secondPlot.value) {
        secondChart = echarts.init(secondPlot.value, null, { renderer: 'canvas' })
    }

    bemChart.setOption(
        {
            tooltip: { trigger: 'axis', backgroundColor: 'rgba(50,50,50,0.9)', textStyle: { color: '#fff' } },
            legend: {
                data: ['Axial Induction (a)', "Tangential Induction (a')"],
                textStyle: { color: '#ccc' },
                top: 10
            },
            grid: { left: '10%', right: '10%', top: '15%', bottom: '10%' },
            xAxis: {
                type: 'value',
                name: 'Radius (m)',
                nameTextStyle: { color: '#ccc' },
                axisLine: { lineStyle: { color: '#666' } },
                axisLabel: { color: '#ccc' },
                splitLine: { lineStyle: { color: '#333' } }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'a',
                    nameTextStyle: { color: '#ccc' },
                    axisLine: { lineStyle: { color: '#666' } },
                    axisLabel: { color: '#ccc' },
                    splitLine: { lineStyle: { color: '#333' } }
                },
                {
                    type: 'value',
                    name: "a'",
                    nameTextStyle: { color: '#ccc' },
                    position: 'right',
                    axisLine: { lineStyle: { color: '#666' } },
                    axisLabel: { color: '#ccc' }
                }
            ],
            series: [
                {
                    name: 'Axial Induction (a)',
                    type: 'line',
                    data: r.map((x, i) => [x, a[i]]),
                    smooth: true,
                    lineStyle: { color: 'rgb(191, 223, 255)', width: 2 },
                    itemStyle: { color: 'rgb(191, 223, 255)' }
                },
                {
                    name: "Tangential Induction (a')",
                    type: 'line',
                    yAxisIndex: 1,
                    data: r.map((x, i) => [x, aPrime[i]]),
                    smooth: true,
                    lineStyle: { color: 'rgb(255, 191, 191)', width: 2 },
                    itemStyle: { color: 'rgb(255, 191, 191)' }
                }
            ]
        },
        true
    )

    if (secondChart) {
        secondChart.setOption(
            {
                tooltip: { trigger: 'axis', backgroundColor: 'rgba(50,50,50,0.9)', textStyle: { color: '#fff' } },
                legend: {
                    data: ['Angle of Attack (°)', 'Lift Coefficient'],
                    textStyle: { color: '#ccc' },
                    top: 10
                },
                grid: { left: '10%', right: '10%', top: '15%', bottom: '10%' },
                xAxis: {
                    type: 'value',
                    name: 'Radius (m)',
                    nameTextStyle: { color: '#ccc' },
                    axisLine: { lineStyle: { color: '#666' } },
                    axisLabel: { color: '#ccc' },
                    splitLine: { lineStyle: { color: '#333' } }
                },
                yAxis: [
                    {
                        type: 'value',
                        name: 'α (°)',
                        nameTextStyle: { color: '#ccc' },
                        axisLine: { lineStyle: { color: '#666' } },
                        axisLabel: { color: '#ccc' },
                        splitLine: { lineStyle: { color: '#333' } }
                    },
                    {
                        type: 'value',
                        name: 'Cl',
                        nameTextStyle: { color: '#ccc' },
                        position: 'right',
                        axisLine: { lineStyle: { color: '#666' } },
                        axisLabel: { color: '#ccc' }
                    }
                ],
                series: [
                    {
                        name: 'Angle of Attack (°)',
                        type: 'line',
                        data: r.map((x, i) => [x, alpha[i]]),
                        smooth: true,
                        lineStyle: { color: 'rgb(191, 255, 191)', width: 2 },
                        itemStyle: { color: 'rgb(191, 255, 191)' }
                    },
                    {
                        name: 'Lift Coefficient',
                        type: 'line',
                        yAxisIndex: 1,
                        data: r.map((x, i) => [x, cl[i]]),
                        smooth: true,
                        lineStyle: { color: 'rgb(255, 223, 191)', width: 2 },
                        itemStyle: { color: 'rgb(255, 223, 191)' }
                    }
                ]
            },
            true
        )
    }
}



async function runTSRSweep() {
    if (!wasm.value) return

    try {
        plotMode.value = 'sweep'
        showSecondPlot.value = false

        const chordExpr = getChordExpr()
        const twistExpr = getTwistExpr()

        const tsrMin = 1
        const tsrMax = 12
        const tsrStep = 0.5

        const tsrValues = []
        const cpValues = []
        const torqueValues = []
        const powerValues = []
        const thrustValues = []

        for (let tsrVal = tsrMin; tsrVal <= tsrMax; tsrVal += tsrStep) {
            wasm.value.initializeRotor(radius.value, hubRadius.value, numBlades.value, windSpeed.value, tsrVal)
            wasm.value.clearBladeSections()
            wasm.value.buildBladeSectionsWithExpressions(numSections.value, chordExpr, twistExpr, airfoil.value)

            const res = wasm.value.runBEM()

            tsrValues.push(tsrVal)
            cpValues.push(res.cp)
            thrustValues.push(res.thrust / 1000)
            torqueValues.push(res.torque / 1000)
            powerValues.push(res.power / 1000000)
        }

        const maxCp = Math.max(...cpValues)
        const maxIdx = cpValues.indexOf(maxCp)
        const optimalTsr = tsrValues[maxIdx]

        results.value = {
            thrust: thrustValues[maxIdx] * 1000,
            torque: torqueValues[maxIdx] * 1000,
            power: powerValues[maxIdx] * 1000000,
            cp: maxCp
        }

        bemChart.setOption(
            {
                tooltip: { trigger: 'axis', backgroundColor: 'rgba(50,50,50,0.9)', textStyle: { color: '#fff' } },
                legend: {
                    data: ['Power Coefficient (Cp)', 'Thrust (kN)'],
                    textStyle: { color: '#ccc' },
                    top: 10
                },
                grid: { left: '10%', right: '10%', top: '15%', bottom: '10%' },
                xAxis: {
                    type: 'value',
                    name: 'Tip Speed Ratio',
                    nameTextStyle: { color: '#ccc' },
                    axisLine: { lineStyle: { color: '#666' } },
                    axisLabel: { color: '#ccc' },
                    splitLine: { lineStyle: { color: '#333' } }
                },
                yAxis: [
                    {
                        type: 'value',
                        name: 'Cp',
                        nameTextStyle: { color: '#ccc' },
                        axisLine: { lineStyle: { color: '#666' } },
                        axisLabel: { color: '#ccc' },
                        splitLine: { lineStyle: { color: '#333' } }
                    },
                    {
                        type: 'value',
                        name: 'Thrust (kN)',
                        nameTextStyle: { color: '#ccc' },
                        position: 'right',
                        axisLine: { lineStyle: { color: '#666' } },
                        axisLabel: { color: '#ccc' }
                    }
                ],
                series: [
                    {
                        name: 'Power Coefficient (Cp)',
                        type: 'line',
                        data: tsrValues.map((x, i) => [x, cpValues[i]]),
                        smooth: true,
                        lineStyle: { color: 'rgb(140, 172, 204)', width: 2 },
                        itemStyle: { color: 'rgb(140, 172, 204)' },
                        markPoint: {
                            data: [
                                {
                                    coord: [optimalTsr, maxCp],
                                    value: `Max: ${maxCp.toFixed(4)}`,
                                    itemStyle: { color: 'rgb(140, 172, 204)' }
                                }
                            ],
                            label: {
                                color: '#fff',
                                backgroundColor: 'rgba(50,50,50,0.9)',
                                padding: [5, 10],
                                borderRadius: 4
                            }
                        }
                    },
                    {
                        name: 'Thrust (kN)',
                        type: 'line',
                        yAxisIndex: 1,
                        data: tsrValues.map((x, i) => [x, thrustValues[i]]),
                        smooth: true,
                        lineStyle: { color: '#ff7875', width: 2 },
                        itemStyle: { color: '#ff7875' }
                    }
                ]
            },
            true
        )
    } catch (err) {
        console.error('Error during TSR sweep:', err)
        error.value = true
    }
}
function initThree() {
    const el = bladePlot.value
    const { clientWidth: w, clientHeight: h } = el

    threeScene = new THREE.Scene()
    threeCamera = new THREE.PerspectiveCamera(30, w / h, 0.1, 1000)
    threeCamera.position.set(0, -radius.value * 1.2, radius.value * 0.6)

    threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    threeRenderer.setClearColor(0x000000, 0)
    threeRenderer.setSize(w, h)
    threeRenderer.setPixelRatio(window.devicePixelRatio)
    el.appendChild(threeRenderer.domElement)

    threeControls = new OrbitControls(threeCamera, threeRenderer.domElement)
    threeControls.enableDamping = true

    const light = new THREE.DirectionalLight(0xffffff, 1.1)
    light.position.set(1, -1, 2)
    threeScene.add(light)
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.3))

    updateBladeGeometry()

        ; (function animate() {
            requestAnimationFrame(animate)
            threeControls.update()
            threeRenderer.render(threeScene, threeCamera)
        })()
}

function buildBladeMesh(vertices, indices) {
    const pos = new Float32Array(vertices.flat())
    const index = new Uint32Array(indices.flat())

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setIndex(new THREE.BufferAttribute(index, 1))
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({ color: 0x8caccc, flatShading: false, side: THREE.DoubleSide })
    return new THREE.Mesh(geo, mat)
}

function updateBladeGeometry() {
    if (!threeScene) return
    const { vertices, indices } = generateBladeGeometry()
    if (!vertices.length) return

    if (bladeMesh) {
        threeScene.remove(bladeMesh)
        bladeMesh.geometry.dispose()
    }
    bladeMesh = buildBladeMesh(vertices, indices)
    threeScene.add(bladeMesh)
}

</script>

<style scoped>
.bem-simulator {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
}

.controls-container {
    margin-bottom: 1.5rem;
}

.controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    padding: 1.5rem;
    background-color: rgb(36, 36, 36);
    border-radius: 8px;
}

.control-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-start;
    justify-content: center;
}

.control-group.main-group {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    width: 100%;
    justify-content: space-between;
}

.control-group h3 {
    width: 100%;
    margin: 0 0 0.1rem 0;
    color: #ccc;
    font-size: 16px;
    font-weight: 600;
}

.control-group.buttons {
    justify-content: center;
    margin-top: 0.5rem;
}

.controls-row {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    flex-wrap: wrap;
    width: 100%;
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

.controls input,
.controls select {
    all: unset;
    font-size: 14px;
    padding: 0.3rem 0;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 8rem;
    appearance: none;
    background-color: transparent;
    cursor: pointer;
    position: relative;
}

.controls label:has(select)::after {
    content: '▼';
    position: absolute;
    right: 0;
    bottom: 8px;
    font-size: 10px;
    color: #ccc;
    pointer-events: none;
}

.controls select option {
    background-color: rgb(50, 50, 50);
    color: #fff;
    padding: 0.5rem;
}

.controls select:hover~.underline,
.controls select:focus~.underline {
    width: 100%;
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

.controls input:focus,
.controls select:focus {
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
    background-color: rgb(140, 172, 204);
    transition: all 0.3s ease;
}

button:hover {
    transform: translateY(-2px);
    filter: brightness(1.2);
}

button[type="button"] {
    background-color: rgb(204, 140, 140);
}

.results-container {
    margin-bottom: 2rem;
}

.result-cards {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.result-card {
    background-color: rgb(36, 36, 36);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    min-width: 150px;
    transition: transform 0.3s ease;
}

.result-card:hover {
    transform: translateY(-4px);
}

.result-card.warning {
    border: 2px solid #ff7875;
}

.result-label {
    color: #999;
    font-size: 14px;
    margin-bottom: 0.5rem;
}

.result-value {
    color: #fff;
    font-size: 24px;
    font-weight: 600;
}

.result-warning {
    color: #ff7875;
    font-size: 12px;
    margin-top: 0.5rem;
}

.plots-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
}

@media (min-width: 1200px) {
    .plots-grid {
        grid-template-columns: 1fr 1fr;
    }

    .plot-container.blade-plot {
        grid-column: span 2;
    }
}

.plot-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
}

.plot-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 800px;
    width: 100%;
}

.plot-error-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 800px;
    width: 100%;
    min-height: 400px;
    color: #fff;
}

.plot-title {
    color: #fff;
    font-size: 18px;
    font-weight: normal;
    text-align: center;
    margin-bottom: 0.5rem;
    white-space: nowrap;
}

.plot {
    width: 100%;
    height: 400px;
    border-radius: 8px;
    background: rgb(36, 36, 36);
}



@media (max-width: 768px) {
    .main-group {
        flex-direction: column;
    }

    .rotor-group,
    .expressions-group {
        width: 100%;
    }

    .controls-row {
        flex-direction: column;
    }
}
</style>
