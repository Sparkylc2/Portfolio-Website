<template>
  <div class="physics-simulator" ref="simulatorContainer">
    <form class="controls" @submit.prevent>
      <label>
        Tool:
        <select v-model="activeTool">
          <option v-for="item in toolDropdownItems" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </label>

      <template v-if="activeTool === 'Box'">
        <label>
          Width:
          <input v-model.number="toolProps.box.width" type="number" step="5" min="10" max="200" />
          <span class="underline"></span>
        </label>
        <label>
          Height:
          <input v-model.number="toolProps.box.height" type="number" step="5" min="10" max="200" />
          <span class="underline"></span>
        </label>
        <label>
          Gravity:
          <div class="checkbox-container">
            <div class="checkbox" :class="{ 'checkbox--selected': toolProps.box.gravity }"
              @click="toolProps.box.gravity = !toolProps.box.gravity">
              <svg v-if="toolProps.box.gravity" class="checkbox__check" width="12" height="12" viewBox="0 0 16 16">
                <path d="M2 8L6 12L14 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <span class="underline"></span>
        </label>
      </template>

      <template v-else-if="activeTool === 'Circle'">
        <label>
          Radius:
          <input v-model.number="toolProps.circle.radius" type="number" step="5" min="5" max="100" />
          <span class="underline"></span>
        </label>
        <label>
          Static:
          <div class="checkbox-container">
            <div class="checkbox" :class="{ 'checkbox--selected': toolProps.circle.isStatic }"
              @click="toolProps.circle.isStatic = !toolProps.circle.isStatic">
              <svg v-if="toolProps.circle.isStatic" class="checkbox__check" width="12" height="12" viewBox="0 0 16 16">
                <path d="M2 8L6 12L14 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <span class="underline"></span>
        </label>

        <label>
          Gravity:
          <div class="checkbox-container">
            <div class="checkbox" :class="{ 'checkbox--selected': toolProps.circle.gravity }"
              @click="toolProps.circle.gravity = !toolProps.circle.gravity">
              <svg v-if="toolProps.circle.gravity" class="checkbox__check" width="12" height="12" viewBox="0 0 16 16">
                <path d="M2 8L6 12L14 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <span class="underline"></span>
        </label>
      </template>

      <template v-else-if="activeTool === 'Spring'">
        <label>
          Stiffness:
          <input v-model.number="toolProps.spring.stiffness" type="number" step="50" min="50" max="1000" />
          <span class="underline"></span>
        </label>
        <label>
          Damping:
          <input v-model.number="toolProps.spring.damping" type="number" step="1" min="0" max="50" />
          <span class="underline"></span>
        </label>
      </template>

      <template v-else-if="activeTool === 'Motor'">
        <label>
          Speed:
          <input v-model.number="toolProps.motor.speed" type="number" step="0.5" min="-20" max="20" />
          <span class="underline"></span>
        </label>
      </template>

      <div class="controls-info">
        <span class="info-text">Press <kbd>Space</kbd> to pause/unpause</span>
      </div>
    </form>



    <div ref="pixiContainer" class="pixi-container" />
  </div>
</template>

<script setup>
import { Application, Graphics } from 'pixi.js'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import PhysicsEngineModule from '../wasm/physics_engine.js'

const toolLabels = {
  None: 'Select',
  Circle: 'Add Circle',
  Box: 'Add Box',
  Spring: 'Add Spring',
  Motor: 'Add Motor'
}

const toolDropdownItems = computed(() => {
  return Object.entries(toolLabels).map(([key, label]) => ({
    value: key,
    label: label,
  }))
})

const props = defineProps({
  elementData: { type: Object, default: null },
  projectColor: { type: String, default: 'red' }
})

const pixiContainer = ref(null)
const simulatorContainer = ref(null)
const app = ref(null)
const engine = ref(null)

const tickerFunction = ref(null)
const resizeObserver = shallowRef(null)

let resizeTimeout = null;
function scheduleResize() {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    resizeTimeout = null;
    canvasOnResize();
  }, 100);
}

const activeTool = ref('Box')
const toolMap = { None: 0, Circle: 1, Box: 2, Spring: 3, Motor: 4 }

const mousePos = ref({ x: 0, y: 0 })

const toolProps = ref({
  box: { width: 50, height: 50, isStatic: false, gravity: true },
  circle: { radius: 25, isStatic: false, gravity: true },
  spring: { stiffness: 500, damping: 10 },
  motor: { speed: 1 }
})

const bodyGraphics = new Map()
const forceGraphics = ref(null)
const previewGraphics = ref(null)

function setupResizeObserver() {
  if (!props.elementData?.container || !app.value || !engine.value) return

  if (resizeObserver.value) resizeObserver.value.disconnect()

  resizeObserver.value = new ResizeObserver(() => {
    scheduleResize();
  })

  if (props.elementData.container.element) {
    resizeObserver.value.observe(props.elementData.container.element)
  }
}

watch(() => props.elementData?.container, (newContainer, oldContainer) => {
  if (!newContainer) return
  if (!app.value || !engine.value) return

  if (!oldContainer ||
    newContainer.x !== oldContainer.x ||
    newContainer.y !== oldContainer.y ||
    newContainer.width !== oldContainer.width ||
    newContainer.height !== oldContainer.height) {
    canvasOnResize()
  }

  setupResizeObserver()
}, { deep: true, immediate: true })


watch(() => activeTool.value, (tool) => {
  if (engine.value) {
    engine.value.setActiveTool(toolMap[tool])

  }
}, { immediate: true })

watch(() => toolProps.value.box, (props) => {
  if (engine.value) {
    engine.value.setBoxProperties(props.width, props.height, props.isStatic, props.gravity)
  }
}, { deep: true, immediate: true })

watch(() => toolProps.value.circle, (props) => {
  if (engine.value) {
    engine.value.setCircleProperties(props.radius, props.isStatic, props.gravity)
  }
}, { deep: true, immediate: true })

watch(() => toolProps.value.spring, (props) => {
  if (engine.value) {
    engine.value.setSpringProperties(props.stiffness, props.damping)
  }
}, { deep: true, immediate: true })

watch(() => toolProps.value.motor, (props) => {
  if (engine.value) {
    engine.value.setMotorProperties(props.speed)
  }
}, { deep: true, immediate: true })


function overMenu(ev) {
  const target = ev.target

  const isControlElement =
    target.tagName === 'SELECT' ||
    target.tagName === 'INPUT' ||
    target.tagName === 'LABEL' ||
    target.classList.contains('checkbox-container') ||
    target.classList.contains('checkbox') ||
    target.classList.contains('checkbox__check')
  return isControlElement;
}
function onPointerDown(ev) {
  if (overMenu(ev)) return
  if (!app.value || !engine.value) return
  const { left, top } = app.value.canvas.getBoundingClientRect()
  const x = ev.clientX - left
  const y = ev.clientY - top

  engine.value.mouseDown(x, y)
}





function drawSpring(g, xa, ya, xb, yb, segments = 6, offset = 10, opacity) {
  const dx = xb - xa, dy = yb - ya
  const len = Math.hypot(dx, dy)
  if (!len) return

  const dir = [dx / len, dy / len]
  const perp = [-dir[1], dir[0]]
  const step = len / segments

  const zigzag = (thick, color) => {
    g.setStrokeStyle({ width: thick, color: color, alpha: opacity || 1 })
    g.moveTo(xa, ya)
    g.lineTo(xb, yb)
    g.stroke()

    let start = [xa, ya]
    for (let i = 0; i < segments; i++) {
      const end = [
        xa + dir[0] * step * (i + 1),
        ya + dir[1] * step * (i + 1)
      ]
      const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
      const offsetDir = i % 2 ? -1 : 1
      const bend = [
        mid[0] + perp[0] * offset * offsetDir,
        mid[1] + perp[1] * offset * offsetDir
      ]

      g.moveTo(start[0], start[1])
      g.lineTo(bend[0], bend[1])
      g.lineTo(end[0], end[1])
      g.stroke()
      start = end
    }
  }

  zigzag(7, 0x000000)
  zigzag(2, 0xffffff)
}

function drawRotationArrow(g, x, y, opacity) {
  const radius = 20

  g.setStrokeStyle({ width: 3, color: 0xFF0000, alpha: opacity || 1 })
  g.arc(x, y, radius, 0, Math.PI * 2)
  g.stroke()
}

function updateBodies() {
  if (!engine.value) return

  const bodies = engine.value.getBodiesForRender()

  const existingIds = new Set(bodies.map(b => b.id))
  for (const [id, g] of bodyGraphics) {
    if (!existingIds.has(id)) {
      app.value.stage.removeChild(g)
      g.destroy()
      bodyGraphics.delete(id)
    }
  }

  for (const body of bodies) {
    let g = bodyGraphics.get(body.id)

    if (!g) {
      g = new Graphics()
      g.zIndex = 2
      app.value.stage.addChild(g)
      bodyGraphics.set(body.id, g)
    }

    g.position.set(body.x, body.y)
    g.rotation = body.angle

    g.clear()

    const fillColor = body.isSelected ? 0xFFAAAA : 0xFFFFFF
    const strokeColor = body.isStatic ? 0x666666 : 0x000000
    const strokeWidth = body.isSelected ? 4 : 3

    g.setStrokeStyle({ width: strokeWidth, color: strokeColor })
    g.fill(fillColor)

    if (body.type === 'circle') {
      g.drawCircle(0, 0, body.radius)
    } else {
      g.rect(-body.width / 2, -body.height / 2, body.width, body.height)
    }
    g.fill()
    g.stroke()
  }
}

function updateForces() {
  if (!engine.value || !forceGraphics.value) return

  const forces = engine.value.getForcesForRender()

  forceGraphics.value.clear()
  previewGraphics.value.clear()

  for (const force of forces) {
    if (force.type === 'spring') {
      drawSpring(forceGraphics.value, force.xa, force.ya, force.xb, force.yb)
    } else if (force.type === 'motor') {
      const body = engine.value.getBodiesForRender().find(b => b.id === force.bodyId)
      if (body) {
        forceGraphics.value.fill(0xFF0000, 0.1)
        forceGraphics.value.drawCircle(body.x, body.y, 15)

        drawRotationArrow(forceGraphics.value, body.x, body.y, force.speed)
      }
    } else if (force.type === 'spring_preview') {
      if (activeTool.value !== 'Spring') continue
      const rect = app.value.canvas.getBoundingClientRect()
      const mouseX = mousePos.value.x - rect.left
      const mouseY = mousePos.value.y - rect.top

      drawSpring(previewGraphics.value, force.xa, force.ya, mouseX, mouseY, 6, 10, 0.5)
    }
  }
}

function trackMouse(ev) {
  mousePos.value = { x: ev.clientX, y: ev.clientY }
}

function handleKeyDown(evt) {
  if (evt.code === 'Escape') {
    return;
  } else if (evt.code === 'Space') {
    evt.preventDefault()
    if (engine.value && app.value?.ticker) {
      engine.value.toggleIsPaused()
    }
  }
}

const canvasOnResize = async () => {
  try {
    if (!pixiContainer.value || !props.elementData?.container) return

    await nextTick()

    const container = props.elementData.container;
    const { width, height, x, y } = container;




    pixiContainer.value.style.position = 'fixed'
    pixiContainer.value.style.left = `${x}px`
    pixiContainer.value.style.top = `${y}px`
    pixiContainer.value.style.width = `${width}px`
    pixiContainer.value.style.height = `${height}px`

    if (app.value?.renderer) {
      app.value.renderer.resize(width, height)
    }

    if (engine.value) {
      const controls = simulatorContainer.value?.querySelector('.controls');
      const controlsRect = controls.getBoundingClientRect();
      engine.value.setBounds(width, height, controlsRect.y)
    }
  } catch (err) {
    console.error('[PhysicsEngine] Error resizing canvas:', err)
  }
}

function initListeners() {
  if (pixiContainer.value) {
    window.addEventListener('click', onPointerDown)
  }
  window.addEventListener('mousemove', trackMouse)
  window.addEventListener('keydown', handleKeyDown)
}

function removeListeners() {
  if (pixiContainer.value) {
    window.removeEventListener('click', onPointerDown)
  }
  window.removeEventListener('mousemove', trackMouse)
  window.removeEventListener('keydown', handleKeyDown)
}

async function initPixiContainer() {
  if (!pixiContainer.value) return

  app.value = new Application()
  await app.value.init({
    resizeTo: pixiContainer.value,
    backgroundAlpha: 0,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true
  })

  pixiContainer.value.appendChild(app.value.canvas)

  forceGraphics.value = new Graphics()
  forceGraphics.value.zIndex = 4
  app.value.stage.addChild(forceGraphics.value)

  previewGraphics.value = new Graphics()
  previewGraphics.value.zIndex = 5
  app.value.stage.addChild(previewGraphics.value)
}

function initTicker() {
  let last = performance.now()

  tickerFunction.value = () => {
    const now = performance.now()
    if (!engine.value.isPaused()) {
      engine.value.setDT((now - last) / 100)
      engine.value.step()
    }
    last = now

    engine.value.processEvents()

    updateBodies()
    updateForces()
  }

  app.value.ticker.add(tickerFunction.value)
}

function initPhysicsParams() {
  engine.value.setBoxProperties(
    toolProps.value.box.width,
    toolProps.value.box.height,
    toolProps.value.box.isStatic,
    toolProps.value.box.gravity
  )

  engine.value.setCircleProperties(
    toolProps.value.circle.radius,
    toolProps.value.circle.isStatic,
    toolProps.value.circle.gravity
  )

  engine.value.setSpringProperties(
    toolProps.value.spring.stiffness,
    toolProps.value.spring.damping
  )

  engine.value.setMotorProperties(toolProps.value.motor.speed)
  engine.value.setActiveTool(toolMap[activeTool.value])
}



onMounted(async () => {
  engine.value = await PhysicsEngineModule()

  await initPixiContainer()
  initListeners()
  setTimeout(() => {
    initTicker()
  }, 300)


  initPhysicsParams()

  if (props.elementData?.container) {
    setupResizeObserver()
    canvasOnResize()
  }

})

onUnmounted(() => {
  removeListeners()

  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = null
  }

  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }

  if (app.value?.ticker && tickerFunction.value) {
    app.value.ticker.stop()
    app.value.ticker.remove(tickerFunction.value)
  }

  for (const [_, g] of bodyGraphics) {
    app.value?.stage?.removeChild(g)
    g.destroy(true)
  }
  bodyGraphics.clear()

  if (forceGraphics.value) {
    app.value?.stage?.removeChild(forceGraphics.value)
    forceGraphics.value.destroy(true)
  }

  if (previewGraphics.value) {
    app.value?.stage?.removeChild(previewGraphics.value)
    previewGraphics.value.destroy(true)
  }

  if (app.value) {
    if (pixiContainer.value?.contains(app.value.canvas)) {
      pixiContainer.value.removeChild(app.value.canvas)
    }
    app.value.destroy(true, { children: true, texture: true, baseTexture: true })
  }

  app.value = null
  engine.value = null
  tickerFunction.value = null
})

defineExpose({
  activeTool,
  toolProps,
})
</script>

<style scoped>
.physics-simulator {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.controls {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  background-color: rgb(36, 36, 36);
  border-radius: 8px;
  overflow-x: auto;
  flex-shrink: 0;
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

.controls select {
  all: unset;
  font-size: 14px;
  padding: 0.3rem 0;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 10rem;
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
  background-color: rgb(204, 140, 140);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 9999px;
}

.controls input:hover~.underline {
  width: 100%;
}

.controls input:focus~.underline {
  width: 100%;
}

.checkbox-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.9rem;
  height: 0.9rem;
  background-color: rgb(50, 50, 50);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  transition: background-color 0.3s, border-color 0.3s;
}

.checkbox--selected {
  background-color: rgb(204, 140, 140);
  border-color: rgb(204, 140, 140);
}

.checkbox__text {
  font-weight: 600;
  font-size: 14px;
  color: #ccc;
}

.checkbox__check {
  position: absolute;
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  pointer-events: none;
}

.checkbox__label {
  font-weight: 600;
  font-size: 14px;
  color: #ccc;
  user-select: none;
  min-width: 60px;
  text-align: right;
}

.controls-info {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

.info-text {
  color: #999;
  font-size: 13px;
}



.pixi-container {
  position: absolute;
  background: rgba(36, 36, 36, 0.0);
  border-radius: 8px;
  pointer-events: none;
  z-index: 0;
}

@keyframes checkIn {
  from {
    transform: rotate(45deg) scale(0);
    opacity: 0;
  }

  50% {
    transform: rotate(45deg) scale(1.2);
  }

  to {
    transform: rotate(45deg) scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .controls {
    gap: 1rem;
    padding: 0.75rem;
    justify-content: flex-start;
  }

  .controls label {
    font-size: 13px;
  }

  .controls input,
  .controls select {
    width: 5rem;
    font-size: 13px;
  }

  .controls-info {
    display: none;
  }
}

.checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid transparent;
}
</style>
