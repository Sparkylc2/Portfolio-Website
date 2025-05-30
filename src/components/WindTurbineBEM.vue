<template>
    <div class="bem-simulator">
        <form class="controls" @submit.prevent="runBEM">
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

            <button type="submit">Run BEM</button>
            <button type="button" @click="runTSRSweep">TSR Sweep</button>
        </form>

        <div class="results-container" v-if="results">
            <div class="result-cards">
                <div class="result-card">
                    <div class="result-label">Thrust</div>
                    <div class="result-value">{{ (results.thrust / 1000).toFixed(2) }} kN</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Torque</div>
                    <div class="result-value">{{ (results.torque / 1000).toFixed(2) }} kNm</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Power</div>
                    <div class="result-value">{{ (results.power / 1000000).toFixed(3) }} MW</div>
                </div>
                <div class="result-card" :class="{ 'warning': results.cp > 0.593 }">
                    <div class="result-label">Cp</div>
                    <div class="result-value">{{ results.cp.toFixed(4) }}</div>
                    <div v-if="results.cp > 0.593" class="result-warning">Exceeds Betz limit!</div>
                </div>
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
                <div class="plot" ref="secondPlot"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import init from '../wasm/wind_turbine.js'

defineProps({
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
const airfoil = ref('2412')
const results = ref(null)
const showSecondPlot = ref(false)
const plotMode = ref('blade') 

const wasm = ref(null)

const bemPlot = ref(null)
const secondPlot = ref(null)
let bemChart = null
let secondChart = null

const plotTitle = computed(() => {
    if (plotMode.value === 'sweep') {
        return `TSR Sweep Results`
    }
    return `Blade Spanwise Distribution`
})

function resizeCharts() {
    bemChart?.resize()
    secondChart?.resize()
}

onMounted(() => {
    try {
        bemChart = echarts.init(bemPlot.value, null, { renderer: 'canvas' })
        window.addEventListener('resize', resizeCharts)
    } catch (err) {
        console.error('[BEMSimulator] Failed to initialize ECharts:', err)
        error.value = true
        return
    }

    init().then(mod => {
        wasm.value = mod
        // wasm.value.setDebugMode(true)
        runBEM()
    }).catch(err => {
        console.error('[BEMSimulator] Failed to load WASM module:', err)
        error.value = true
    })
})

onUnmounted(() => {
    window.removeEventListener('resize', resizeCharts)
    bemChart?.dispose()
    secondChart?.dispose()
})

async function runBEM() {
    if (!wasm.value) return
    
    try {
        plotMode.value = 'blade'
        showSecondPlot.value = true
        
        wasm.value.initializeRotor(radius.value, hubRadius.value, numBlades.value, windSpeed.value, tsr.value)
        wasm.value.clearBladeSections()
        
        for (let i = 0; i < numSections.value; i++) {
            const r = hubRadius.value + (i + 0.5) * (radius.value - hubRadius.value) / numSections.value
            const chord = 3.0 * (1.0 - r / radius.value) + 1.0 
            const twist = 15.0 * (1.0 - r / radius.value)      
            
            wasm.value.addBladeSection(r, chord, twist, airfoil.value)
        }
        
        results.value = wasm.value.runBEM()
        
        plotBladeDistribution()
        
    } catch (err) {
        error.value = true
        console.error('[BEMSimulator] BEM analysis failed:', err)
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
    
    bemChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(50, 50, 50, 0.9)',
            borderColor: '#333',
            textStyle: { color: '#fff' }
        },
        legend: {
            data: ['Axial Induction (a)', 'Tangential Induction (a\')'],
            textStyle: { color: '#ccc' },
            top: 10
        },
        grid: {
            left: '10%',
            right: '10%',
            top: '15%',
            bottom: '10%'
        },
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
                name: 'a\'',
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
                lineStyle: { color: 'rgb(140, 172, 204)', width: 2 },
                itemStyle: { color: 'rgb(140, 172, 204)' }
            },
            {
                name: 'Tangential Induction (a\')',
                type: 'line',
                yAxisIndex: 1,
                data: r.map((x, i) => [x, aPrime[i]]),
                smooth: true,
                lineStyle: { color: '#ff7875', width: 2 },
                itemStyle: { color: '#ff7875' }
            }
        ]
    }, true)
    
    if (secondChart) {
        secondChart.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(50, 50, 50, 0.9)',
                borderColor: '#333',
                textStyle: { color: '#fff' }
            },
            legend: {
                data: ['Angle of Attack (°)', 'Lift Coefficient'],
                textStyle: { color: '#ccc' },
                top: 10
            },
            grid: {
                left: '10%',
                right: '10%',
                top: '15%',
                bottom: '10%'
            },
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
                    lineStyle: { color: '#95de64', width: 2 },
                    itemStyle: { color: '#95de64' }
                },
                {
                    name: 'Lift Coefficient',
                    type: 'line',
                    yAxisIndex: 1,
                    data: r.map((x, i) => [x, cl[i]]),
                    smooth: true,
                    lineStyle: { color: '#ffd666', width: 2 },
                    itemStyle: { color: '#ffd666' }
                }
            ]
        }, true)
    }
}

async function runTSRSweep() {
    if (!wasm.value) return
    
    try {
        plotMode.value = 'sweep'
        showSecondPlot.value = false
        
        const tsrMin = 1
        const tsrMax = 12
        const tsrStep = 0.5
        
        const tsrValues = []
        const cpValues = []
        const thrustValues = []
        const torqueValues = []
        
        for (let tsrVal = tsrMin; tsrVal <= tsrMax; tsrVal += tsrStep) {
            wasm.value.initializeRotor(radius.value, hubRadius.value, numBlades.value, windSpeed.value, tsrVal)
            wasm.value.clearBladeSections()
            
            for (let i = 0; i < numSections.value; i++) {
                const r = hubRadius.value + (i + 0.5) * (radius.value - hubRadius.value) / numSections.value
                const chord = 3.0 * (1.0 - r / radius.value) + 1.0
                const twist = 15.0 * (1.0 - r / radius.value)
                wasm.value.addBladeSection(r, chord, twist, airfoil.value)
            }
            
            const res = wasm.value.runBEM()
            
            tsrValues.push(tsrVal)
            cpValues.push(res.cp)
            thrustValues.push(res.thrust / 1000) 
            torqueValues.push(res.torque / 1000) 
        }
        
        const maxCp = Math.max(...cpValues)
        const maxCpIndex = cpValues.indexOf(maxCp)
        const optimalTsr = tsrValues[maxCpIndex]
        
        results.value = {
            thrust: thrustValues[maxCpIndex] * 1000,
            torque: torqueValues[maxCpIndex] * 1000,
            power: torqueValues[maxCpIndex] * 1000 * (optimalTsr * windSpeed.value / radius.value),
            cp: maxCp
        }
        
        bemChart.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(50, 50, 50, 0.9)',
                borderColor: '#333',
                textStyle: { color: '#fff' }
            },
            legend: {
                data: ['Power Coefficient (Cp)', 'Thrust (kN)'],
                textStyle: { color: '#ccc' },
                top: 10
            },
            grid: {
                left: '10%',
                right: '10%',
                top: '15%',
                bottom: '10%'
            },
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
                        data: [{
                            coord: [optimalTsr, maxCp],
                            value: `Max: ${maxCp.toFixed(4)}`,
                            itemStyle: { color: 'rgb(140, 172, 204)' }
                        }],
                        label: {
                            color: '#fff',
                            backgroundColor: 'rgba(50, 50, 50, 0.9)',
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
        }, true)
        
    } catch (err) {
        error.value = true
        console.error('[BEMSimulator] TSR sweep failed:', err)
    }
}
</script>

<style scoped>
.bem-simulator {
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

.controls input,
.controls select {
    all: unset;
    font-size: 14px;
    padding: 0.3rem 0;
    color: #fff;
    border-bottom: 1px solid transparent;
    transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 6rem;
    appearance: textfield;
}

.controls select {
    cursor: pointer;
    background-color: transparent;
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

.controls input:hover ~ .underline,
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

button[type="button"] {
    background-color: #95de64;
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
</style>
