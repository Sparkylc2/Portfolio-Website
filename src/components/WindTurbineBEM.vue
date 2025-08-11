<template>
  <div class="bem-simulator">
    <div class="controls-container">
      <form class="controls" @submit.prevent="runBEM">
        <div class="tabs-header">
          <TabBar :tabs="tabs" v-model:activeTab="activeTab" :indicatorColor="getColour('blue')" />
        </div>

        <div class="tabs-content">
          <div class="tab-panel" v-show="activeTab === 'geometry'">
            <div class="control-group">
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
          </div>

          <div class="tab-panel" v-show="activeTab === 'profile'">
            <div class="control-group">
              <label>
                Chord Distribution:
                <MathLiveEditor ref="chordField" v-model="chord_distribution_latex" :primaryColorKey="'blue'"
                  @update:plaintext="val => chord_distribution_raw = val" />
              </label>
              <label>
                Twist Distribution:
                <MathLiveEditor ref="twistField" v-model="twist_distribution_latex" :primaryColorKey="'blue'"
                  @update:plaintext="val => twist_distribution_raw = val" />
              </label>
            </div>
          </div>

          <div class="tab-panel" v-show="activeTab === 'conditions'">
            <div class="control-group">
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
          </div>
          <div class="tab-panel" v-show="activeTab === 'help'">
            <div class="control-group"
              style="flex-direction: column; gap: 1rem; max-width: 800px; margin: 0 auto; color:#ccc; font-size:14px; line-height:1.6;">
              <p><strong>Expressions (Blade Profile)</strong></p>
              <p>
                The <em>Chord</em> and <em>Twist</em> fields accept math expressions parsed by ExprTK.
                You can use these variables and functions:
              </p>
              <ul class="control-ul">
                <li><code>r</code>: current section radius (m)</li>
                <li><code>R</code> or <code>radius</code>: rotor radius (m)</li>
                <li><code>R_h</code>: hub radius (m)</li>
                <li><code>TSR</code>: tip speed ratio</li>
                <li><code>B</code>: number of blades (for geometry mesh & expressions)</li>
                <li>Constants: <code>pi</code>, <code>e</code>; Functions: <code>sin</code>, <code>cos</code>,
                  <code>tan</code>, <code>sqrt</code>, <code>log</code>, <code>exp</code>, <code>pow</code>,
                  <code>min</code>, <code>max</code>, <code>abs</code>, etc.
                </li>
              </ul>

              <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:0.75rem;"></div>

              <p><strong>Units</strong></p>
              <ul class="control-ul">
                <li><strong>Chord</strong> expression returns <em>meters</em>.</li>
                <li><strong>Twist</strong> expression returns <em>radians</em> (it’s converted to degrees internally).
                </li>
                <li>Trig functions use <em>radians</em>.</li>
              </ul>

              <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:0.75rem;"></div>

              <p><strong>Tips</strong></p>
              <ul class="control-ul">
                <li>You can write operators using:
                  <code>*</code> → <code>×</code>, <code>/</code> → <code>÷</code>, <code>−</code> → <code>-</code>,
                  <code>+</code> → <code>+</code>
                </li>
                <li>Expressions are evaluated at section midpoints from <code>R_h</code> to <code>R</code>.</li>
              </ul>

              <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:0.75rem;"></div>

              <p><strong>Examples</strong></p>
              <ul class="control-ul">
                <li>
                  Tapered chord (linear to tip):<br>
                  <code>chord = 3.0 * (1 - r/R)</code>
                </li>
                <li>
                  Simple linear twist (10° at hub to 0° at tip):<br>
                  <code>twist = (10 * pi / 180) * (1 - r/R)</code>
                </li>
                <li>
                  “Ideal-ish” twist scaling with TSR:<br>
                  <code>twist = atan( (2/3) / (TSR * (r/R)) )</code>
                </li>
                <li>
                  Root cutoff to avoid huge chord near hub:<br>
                  <code>chord = max(0.2, 3.0 * (1 - r/R))</code>
                </li>
                <li>
                  Keep some twist near hub only:<br>
                  <code>twist = (r &lt; (R*0.3)) ? (12*pi/180) : (4*pi/180)</code>
                </li>
              </ul>

              <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:0.75rem;"></div>

              <p><strong>Common gotchas</strong></p>
              <ul class="control-ul">
                <li><em>Twist must be in radians</em> (e.g., use <code>deg*pi/180</code>).</li>
                <li>Make sure chord stays positive across the span.</li>
                <li>If an expression fails to parse, the section build is skipped—check syntax.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="control-actions">
          <button type="submit" id="run-bem">Run BEM</button>
          <button type="button" id="run-tsr-sweep" @click="runTSRSweep">TSR Sweep</button>
        </div>
      </form>
    </div>

    <div class="results-container" v-if="results">
      <div class="result-cards">
        <div class="result-card">
          <div class="result-label">Thrust</div>
          <div class="result-value">{{ formatWithDynamicUnit(results.thrust, 'N') }}</div>
        </div>
        <div class="result-card">
          <div class="result-label">Torque</div>
          <div class="result-value">{{ formatWithDynamicUnit(results.torque, 'Nm') }}</div>
        </div>
        <div class="result-card">
          <div class="result-label">Power</div>
          <div class="result-value">{{ formatWithDynamicUnit(results.power, 'W') }}</div>
        </div>
        <div class="result-card" :class="{ warning: results.cp > 0.593 }">
          <div class="result-label">Power Coefficient</div>
          <div class="result-value">{{ results.cp.toFixed(4) }}</div>
          <div v-if="results.cp > 0.593" class="result-warning">Exceeds Betz limit!</div>
        </div>
      </div>
    </div>

    <div class="plots-grid">
      <div class="plot-container" v-show="plotMode === 'blade'">
        <div class="plot-wrapper">
          <div class="plot-title">{{ plotTitle }}</div>
          <div v-if="!error" class="plot" ref="inductionPlot"></div>
          <div v-else class="plot-error-wrapper" ref="inductionPlot">
            <h2>An error occurred</h2>
          </div>
        </div>
      </div>

      <div class="plot-container" v-show="plotMode === 'blade'">
        <div class="plot-wrapper">
          <div class="plot-title">Angle of Attack & Lift Coefficient</div>
          <div v-if="!error" class="plot" ref="performancePlot"></div>
          <div v-else class="plot-error-wrapper" ref="performancePlot">
            <h2>An error occurred</h2>
          </div>
        </div>
      </div>
      <div class="plot-container" v-show="plotMode === 'sweep'">
        <div class="plot-wrapper">
          <div class="plot-title">TSR Sweep Results</div>
          <div v-if="!error" class="plot" ref="sweepPlot"></div>
          <div v-else class="plot-error-wrapper" ref="sweepPlot">
            <h2>An error occurred</h2>
          </div>
        </div>
      </div>

      <div class="plot-container blade-plot">
        <div class="plot-wrapper">
          <div class="plot-title">3D Blade Geometry</div>
          <div v-if="!error" class="plot geometry" ref="bladePlot"></div>
          <div v-else class="plot-error-wrapper" ref="bladePlot">
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
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import getColour from '../composables/useGetColours.js'
import init from '../wasm/wind_turbine.js'
import MathLiveEditor from './MathParsingField.vue'
import TabBar from './TabBar.vue'


const error = ref(false)
const radius = ref(50)
const hubRadius = ref(2.5)
const numBlades = ref(3)
const windSpeed = ref(10)
const tsr = ref(7)
const numSections = ref(20)
const airfoil = ref('')

const chord_distribution_latex = ref("3.0 \\cdot (1.0 - \\frac{r}{50})")
const twist_distribution_latex = ref("0.5 \\cdot (1.0 - \\frac{r}{R})")

const chord_distribution_raw = ref("");
const twist_distribution_raw = ref("");

const chordField = ref(null)
const twistField = ref(null)

const results = ref(null)
const plotMode = ref('blade')

const wasm = ref(null)

const sweepPlot = ref(null)
const inductionPlot = ref(null)
const performancePlot = ref(null)

const bladePlot = ref(null)

const activeTab = ref('geometry')
const tabs = ref([
  { id: 'geometry', label: 'Rotor Geometry' },
  { id: 'profile', label: 'Blade Profile' },
  { id: 'conditions', label: 'Operating Conditions' },
  { id: 'help', label: 'Help' }
])

let inductionChart = null
let performanceChart = null
let sweepChart = null
let threeRenderer = null
let threeScene = null
let bladeMesh = null
let threeCamera = null
let threeControls = null

const plotTitle = computed(() =>
  plotMode.value === 'sweep' ? 'TSR Sweep Results' : 'Blade Spanwise Distribution'
)

function resizeCharts() {
  inductionChart?.resize()
  performanceChart?.resize()
  sweepChart?.resize()
  if (threeRenderer && bladePlot.value) {
    const { clientWidth: w, clientHeight: h } = bladePlot.value
    threeCamera.aspect = w / h
    threeCamera.updateProjectionMatrix()
    threeRenderer.setSize(w, h)
  }
}

async function generateBladeGeometry() {
  if (!wasm.value) return { vertices: [], indices: [] }

  const rValues = Array.from({ length: numSections.value + 1 }, (_, i) =>
    hubRadius.value + i * (radius.value - hubRadius.value) / numSections.value
  )

  const geometry = wasm.value.generateBladeSurface(
    rValues,
    airfoil.value,
    chord_distribution_raw.value,
    twist_distribution_raw.value
  )

  if (!geometry || !geometry.vertices || !geometry.indices) return { vertices: [], indices: [] }

  return { vertices: geometry.vertices, indices: geometry.indices }
}

onMounted(async () => {
  try {
    if (bladePlot.value) await initThree()
    plotMode.value = 'blade';
    inductionChart = echarts.init(inductionPlot.value, null, { renderer: 'canvas' })
    performanceChart = echarts.init(performancePlot.value, null, { renderer: 'canvas' })
    window.addEventListener('resize', resizeCharts)
  } catch (err) {
    error.value = true
    console.log('[WindTurbineBEM] Failed to initialize ECharts:', err)
    return
  }

  init().then(mod => {
    wasm.value = mod
    mod.onAbort = function (what) { error.value = true; }
    runBEM()
    airfoil.value = 'NACA2412'
    runBEM();
  }).catch(() => (error.value = true))

})

onUnmounted(async () => {
  window.removeEventListener('resize', resizeCharts)
  inductionChart?.dispose()
  performanceChart?.dispose()
  sweepChart?.dispose()
  if (threeRenderer) {
    threeRenderer.dispose()
  }
})

watch([radius, hubRadius, numBlades, airfoil], () => {
  updateBladeGeometry()
})

watch([chord_distribution_latex, twist_distribution_latex], () => {
  updateBladeGeometry()
})

async function runBEM() {
  if (!wasm.value) return


  try {
    plotMode.value = 'blade'

    wasm.value.initializeRotor(
      radius.value,
      hubRadius.value,
      numBlades.value,
      windSpeed.value,
      tsr.value
    )

    wasm.value.buildBladeSectionsWithExpressions(
      numSections.value,
      chord_distribution_raw.value,
      twist_distribution_raw.value,
      airfoil.value
    )

    results.value = wasm.value.runBEM()

    await plotBladeDistribution()
  } catch (err) {
    error.value = true
  }
}

async function runTSRSweep() {
  if (!wasm.value) return

  try {
    plotMode.value = 'sweep'


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
      wasm.value.buildBladeSectionsWithExpressions(numSections.value, chord_distribution_raw.value, twist_distribution_raw.value, airfoil.value)

      const res = wasm.value.runBEM()

      tsrValues.push(tsrVal)
      cpValues.push(res.cp)
      thrustValues.push(res.thrust)
      torqueValues.push(res.torque)
      powerValues.push(res.power)
    }

    const maxCp = Math.max(...cpValues)
    const maxIdx = cpValues.indexOf(maxCp)
    const optimalTsr = tsrValues[maxIdx]

    results.value = {
      thrust: thrustValues[maxIdx],
      torque: torqueValues[maxIdx],
      power: powerValues[maxIdx],
      cp: maxCp
    }

    await nextTick();
    if (!sweepChart) {
      sweepChart = echarts.init(sweepPlot.value, null, { renderer: 'canvas' })
    }


    sweepChart.setOption(
      {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(50,50,50,0.9)',
          textStyle: { color: '#fff' },
          formatter: function (params) {
            let result = `TSR: ${params[0].value[0].toFixed(2)}<br/>`;

            params.forEach(param => {
              const colorSpan = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`;

              if (param.seriesName.includes('Power Coefficient')) {
                result += `${colorSpan}${param.seriesName}: ${param.value[1].toFixed(4)}<br/>`;
              } else if (param.seriesName.includes('Thrust')) {
                result += `${colorSpan}${param.seriesName}: ${param.value[1].toFixed(2)} kN<br/>`;
              }
            });

            return result;
          }
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
          bottom: '15%'
        },
        xAxis: {
          type: 'value',
          name: 'Tip Speed Ratio',
          nameLocation: 'middle',
          nameGap: 35,
          nameTextStyle: {
            color: '#ccc',
            padding: [10, 0, 0, 0]
          },
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
            nameTextStyle: { color: '#fff' },
            position: 'right',
            axisLine: { lineStyle: { color: '#666' } },
            axisLabel: { color: '#fff' }
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
            data: tsrValues.map((x, i) => [x, powerValues[i]]),
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



async function renderInductionFactorsPlot(r, a, aPrime) {

  if (!inductionChart && inductionPlot.value) {
    inductionChart = echarts.init(inductionPlot.value, null, { renderer: 'canvas' })
  }
  inductionChart.setOption(
    {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(50,50,50,0.9)',
        textStyle: { color: '#fff' },
        formatter: function (params) {
          let result = `Radius: ${params[0].value[0].toFixed(2)} m<br/>`;

          params.forEach(param => {
            const colorSpan = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`;

            if (param.seriesName.includes('Induction')) {
              result += `${colorSpan}${param.seriesName}: ${param.value[1].toFixed(4)}<br/>`;
            } else {
              result += `${colorSpan}${param.seriesName}: ${param.value[1].toFixed(2)}<br/>`;
            }
          });

          return result;
        }
      },
      legend: {
        data: ['Axial Induction (a)', "Tangential Induction (a')"],
        textStyle: { color: '#ccc' },
        top: 10
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '15%'
      },
      xAxis: {
        type: 'value',
        name: 'Radius (m)',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          color: '#ccc',
          padding: [10, 0, 0, 0]
        },
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
          nameTextStyle: { color: '#fff' },
          position: 'right',
          axisLine: { lineStyle: { color: '#fff' } },
          axisLabel: { color: '#fff' }
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
}

async function renderPerformanceValuesPlot(r, alpha, cl) {
  if (!performanceChart && performancePlot.value) {
    performanceChart = echarts.init(performancePlot.value, null, { renderer: 'canvas' })
  }

  performanceChart.setOption(
    {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(50,50,50,0.9)',
        textStyle: { color: '#fff' },
        formatter: function (params) {
          let result = `Radius: ${params[0].value[0].toFixed(2)} m<br/>`;

          params.forEach(param => {
            const colorSpan = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`;

            if (param.seriesName.includes('Angle of Attack')) {
              result += `${colorSpan}${param.seriesName}: ${param.value[1].toFixed(2)}°<br/>`;
            } else if (param.seriesName.includes('Lift')) {
              result += `${colorSpan}${param.seriesName}: ${param.value[1].toFixed(3)}<br/>`;
            }
          });

          return result;
        }
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
        bottom: '15%'
      },
      xAxis: {
        type: 'value',
        name: 'Radius (m)',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          color: '#ccc',
          padding: [10, 0, 0, 0]
        },
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
          nameTextStyle: { color: '#fff' },
          position: 'right',
          axisLine: { lineStyle: { color: '#fff' } },
          axisLabel: { color: '#fff' }
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

async function plotBladeDistribution() {
  if (!results.value || !inductionChart || !performanceChart) return

  const sections = results.value.sections
  const r = sections.map(s => s.r)
  const a = sections.map(s => s.a)
  const aPrime = sections.map(s => s.a_prime)
  const alpha = sections.map(s => s.alpha)
  const cl = sections.map(s => s.cl)

  renderInductionFactorsPlot(r, a, aPrime)

  renderPerformanceValuesPlot(r, alpha, cl)


}



async function initThree() {
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

  await updateBladeGeometry()

    ; (function animate() {
      requestAnimationFrame(animate)
      threeControls.update()
      threeRenderer.render(threeScene, threeCamera)
    })()
}

async function buildBladeMesh(vertices, indices) {
  const pos = new Float32Array(vertices.flat())
  const index = new Uint32Array(indices.flat())

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(new THREE.BufferAttribute(index, 1))
  geo.computeVertexNormals()

  const mat = new THREE.MeshStandardMaterial({ color: 0x8caccc, flatShading: false, side: THREE.DoubleSide })
  return new THREE.Mesh(geo, mat)
}

async function updateBladeGeometry() {
  if (!threeScene) return
  const { vertices, indices } = await generateBladeGeometry()
  if (!vertices.length) return

  if (bladeMesh) {
    threeScene.remove(bladeMesh)
    bladeMesh.geometry.dispose()
  }
  bladeMesh = await buildBladeMesh(vertices, indices)
  threeScene.add(bladeMesh)
}

function formatWithDynamicUnit(value, baseUnit) {
  const units = {
    'N': ['N', 'kN', 'MN', 'GN'],
    'W': ['W', 'kW', 'MW', 'GW'],
    'Nm': ['Nm', 'kNm', 'MNm', 'GNm']
  };

  const unitScales = [1, 1e3, 1e6, 1e9];
  const unitGroup = units[baseUnit] || [];

  if (Math.abs(value) < 1) {
    return `${value.toFixed(3)} ${unitGroup[0]}`;
  }

  let scale = 0;
  let scaledValue = value;

  while (Math.abs(scaledValue) >= 1000 && scale < unitGroup.length - 1) {
    scaledValue /= 1000;
    scale++;
  }

  const decimalPlaces = Math.abs(scaledValue) >= 100 ? 1 :
    Math.abs(scaledValue) >= 10 ? 2 : 3;

  return `${scaledValue.toFixed(decimalPlaces)} ${unitGroup[scale]}`;
}
</script>

<style scoped>
.bem-simulator {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.controls-container {
  width: 100%;
  margin-bottom: 1.5rem;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background-color: rgb(36, 36, 36);
  border-radius: 8px;
  width: auto;
  /* max-width: 95%; */
}

.tabs-header {
  display: flex;
  width: 100%;
  margin-bottom: 0.5rem;
}

.tabs-content {
  width: 100%;
  padding: 1rem 0;
}

.tab-panel {
  width: 100%;
  animation: fadeIn 0.3s ease;
}

.control-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  width: 100%;
}

.control-ul {
  align-self: flex-start !important;
  padding-left: 5rem;
  margin: 0;
}

.control-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  width: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}


.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background-color: rgb(36, 36, 36);
  border-radius: 8px;
  width: 95;
}

.control-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  width: 100%;
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
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
  filter: brightness(1.2);
}

#run-bem {
  background-color: transparent;
  border-radius: 0.4rem;
  border: 0.15rem solid rgb(140, 172, 204);
}

#run-tsr-sweep {
  background-color: transparent;
  border-radius: 0.4rem;
  border: 0.15rem solid rgb(204, 140, 140);
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

.geometry {
  mask-image: linear-gradient(to top, transparent 0%, black 35%, black 65%, transparent 100%),
    linear-gradient(to left, transparent 0%, black 35%, black 65%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-image: linear-gradient(to top, transparent 0%, black 35%, black 65%, transparent 100%),
    linear-gradient(to left, transparent 0%, black 35%, black 65%, transparent 100%);
  -webkit-mask-composite: source-in;
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
