<template>
  <div class="physics-simulator" ref="simulatorContainer">
    <form class="controls" @submit.prevent>
      <BaseSelect v-model="activeTool" :options="toolDropdownItems" label="Tool" color-key="red" :baseUnderline="true"
        class="control-element" />
      <!-- <label> -->
      <!--   Tool: -->
      <!--   <select v-model="activeTool"> -->
      <!--     <option v-for="item in toolDropdownItems" :key="item.value" :value="item.value"> -->
      <!--       {{ item.label }} -->
      <!--     </option> -->
      <!--   </select> -->
      <!-- </label> -->

      <template v-if="activeTool === 'Box'" class="control-element">
        <BaseInput v-model.number="toolProps.box.width" type="number" min="1" max="500" label="Width" color-key="red"
          :dynamicUnderline="true" class="control-element" :showTooltips="false" />
        <BaseInput v-model.number="toolProps.box.height" type="number" min="1" max="500" label="Height" color-key="red"
          :dynamicUnderline="true" class="control-element" :showTooltips="false" />
        <BaseCheckbox v-model="toolProps.box.gravity" label="Gravity" class="control-element" color-key="red" />
      </template>

      <template v-else-if="activeTool === 'Circle'" class="control-element">
        <BaseInput v-model.number="toolProps.circle.radius" type="number" min="1" max="500" label="Radius"
          color-key="red" :dynamicUnderline="true" class="control-element" :showTooltips="false" />
        <BaseCheckbox v-model="toolProps.circle.gravity" label="Gravity" class="control-element" color-key="red" />
      </template>

      <template v-else-if="activeTool === 'Spring'" class="control-element">
        <BaseInput v-model.number="toolProps.spring.stiffness" type="number" min="1" max="10000" label="Stiffness"
          color-key="red" :dynamicUnderline="true" class="control-element" :showTooltips="false" />
        <BaseInput v-model.number="toolProps.spring.damping" type="number" min="0" max="100" label="Damping"
          color-key="red" :dynamicUnderline="true" class="control-element" :showTooltips="false" />
      </template>
      <template v-else-if="activeTool === 'Motor'" class="control-element">
        <BaseInput v-model.number="toolProps.motor.speed" type="number" min="-50" max="50" label="Speed" color-key="red"
          :dynamicUnderline="true" class="control-element" :showTooltips="false" />
      </template>

      <div class="controls-info">
        <span class="info-text desktop-only">Press <kbd>Space</kbd> to pause/unpause</span>
        <span class="info-text touch-only">Tap to add objects • Tap and hold to pause/unpause</span>
      </div>
      <label class="touch-only-flex control-element">
        <span class="touch-only-flex">Pause:</span>
        <div class="checkbox-container touch-only-flex" style="z-index: 0;">
          <button v-if="engine" @click="togglePause" class="pause-button touch-only" :class="{ 'is-paused': isPaused }">
            <svg v-if="!isPaused" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="4" width="4" height="16" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" fill="currentColor" />
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polygon points="8,5 19,12 8,19" fill="currentColor" />
            </svg>
          </button>
        </div>
      </label>


    </form>




    <div ref="pixiContainer" class="pixi-container" />
  </div>
</template>

<script setup>
import { Application, Graphics } from 'pixi.js'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import PhysicsEngineModule from '../wasm/physics_engine.js'
import BaseCheckbox from './elements/BaseCheckbox.vue'
import BaseSelect from './elements/BaseSelect.vue'
import BaseInput from './elements/BaseInput.vue'
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

const isPaused = ref(false)

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
    engine.value.setBoxProperties(props.width, props.height, false, props.gravity)
  }
}, { deep: true, immediate: true })

watch(() => toolProps.value.circle, (props) => {
  if (engine.value) {
    engine.value.setCircleProperties(props.radius, false, props.gravity)
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
  const isControlElement = target.classList.contains('control-element')
    || target.classList.contains('base-input-text')
    || target.classList.contains('base-select-option')
    || target.classList.contains('base-checkbox')
    || target.classList.contains('base-checkbox-text')
    || target.classList.contains('base-select-trigger')
    || target.classList.contains('base-select-option')
    || target.classList.contains('base-select-trigger__value')
    || target.classList.contains('pause-button')
    || target.classList.contains('controls')
    || target.classList.contains('controls-info')
    || target.classList.contains('touch-only-flex')
  return isControlElement;
}

function getEventCoordinates(ev) {
  if (ev.touches && ev.touches.length > 0) {
    return { clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY }
  } else if (ev.changedTouches && ev.changedTouches.length > 0) {
    return { clientX: ev.changedTouches[0].clientX, clientY: ev.changedTouches[0].clientY }
  }
  return { clientX: ev.clientX, clientY: ev.clientY }
}


function onPointerDown(ev) {
  if (overMenu(ev)) return
  if (!app.value || !engine.value) return

  if (ev.type === 'touchstart') {
    ev.preventDefault()
  }

  const coords = getEventCoordinates(ev)
  const { left, top } = app.value.canvas.getBoundingClientRect()
  const x = coords.clientX - left
  const y = coords.clientY - top

  engine.value.mouseDown(x, y)
}

let isDragging = false;

function onTouchStart(ev) {
  console.log('onTouchStart', ev)
  isDragging = false;
  onPointerDown(ev)
  trackTouch(ev)
}

function onTouchMove(ev) {
  isDragging = true;
  if (!overMenu(ev)) ev.preventDefault()
  trackTouch(ev)
}

function onTouchEnd(ev) {
  if (!overMenu(ev)) ev.preventDefault()

  if (isDragging) {
    onTouchStart(ev);
  }

}



const togglePause = () => {
  if (engine.value) {
    engine.value.toggleIsPaused()
    isPaused.value = !isPaused.value
  }
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

function trackTouch(ev) {
  if (ev.touches && ev.touches.length > 0) {
    mousePos.value = { x: ev.touches[0].clientX, y: ev.touches[0].clientY }
  }
}

function handleKeyDown(evt) {
  if (evt.code === 'Escape') {
    return;
  } else if (evt.code === 'Space') {
    evt.preventDefault()
    if (engine.value && app.value?.ticker) {
      togglePause()
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

      if (controls) {
        const controlsRect = controls.getBoundingClientRect();
        const pixiRect = pixiContainer.value.getBoundingClientRect();


        let offset = controlsRect.y + pixiRect.height * 0.05
        if (offset < 0) offset = 0;
        if (offset > height) offset = height;

        engine.value.setBounds(width, height, offset);
      } else {
        engine.value.setBounds(width, height, 0);
      }
    }
  } catch (err) {
    console.error('[PhysicsEngine] Error resizing canvas:', err)
  }
}

function initListeners() {
  if (pixiContainer.value) {

    pixiContainer.value.addEventListener('click', onPointerDown)

    pixiContainer.value.addEventListener('mousemove', trackMouse)

    pixiContainer.value.addEventListener('touchstart', onTouchStart, { passive: false })

    pixiContainer.value.addEventListener('touchmove', onTouchMove, { passive: false })
    pixiContainer.value.addEventListener('touchend', onTouchEnd, { passive: false })

    pixiContainer.value.addEventListener('contextmenu', (e) => e.preventDefault())
  }
  window.addEventListener('keydown', handleKeyDown)
}

function removeListeners() {
  if (pixiContainer.value) {
    pixiContainer.value.removeEventListener('click', onPointerDown)
    pixiContainer.value.removeEventListener('mousemove', trackMouse)

    pixiContainer.value.removeEventListener('touchstart', onTouchStart)
    pixiContainer.value.removeEventListener('touchmove', onTouchMove)
    pixiContainer.value.removeEventListener('touchend', onTouchEnd)
    pixiContainer.value.removeEventListener('contextmenu', (e) => e.preventDefault())

    pixiContainer.value.removeEventListener('contextmenu', (e) => e.preventDefault())
  }
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
svg {
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  pointer-events: none;
}

.physics-simulator {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  touch-action: pan-x pan-y;
  overscroll-behavior: contain;
}

.physics-simulator {
  overflow: visible !important;
}

.controls {
  display: flex;
  justify-content: flex-start;
  flex-wrap: nowrap;
  position: relative;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding-inline: 0;
  background-color: rgb(36, 36, 36);
  border-radius: 8px;
  overflow-x: auto;
  flex-shrink: 0;
  overflow-y: visible;


  touch-action: pan-x;
  -webkit-overflow-scrolling: touch;
}

.controls::before,
.controls::after {
  content: "";
  flex: 0 0 1.5rem;
}


.checkbox-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
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
  pointer-events: auto;
  z-index: 1;

  touch-action: auto;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}



.pause-button {
  padding: 0.3rem;
  width: 46px;
  height: 46px;
  background: rgba(36, 36, 36, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
  color: #fff;
  backdrop-filter: blur(10px);
}

.pause-button:focus,
.pause-button:active,
.pause-button.selected {
  background: var(--border-color, #3490dc);
  color: #fff;
  outline: none;
}

.pause-button:hover {
  background: rgba(36, 36, 36, 1);
  border-color: rgb(204, 140, 140);
  transform: scale(1.05);
}

.pause-button.is-paused {
  background: rgba(204, 140, 140, 1);
  border-color: rgb(204, 140, 140);
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


}

.checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid transparent;
}

.desktop-only {
  display: inline;
}

.touch-only {
  display: none;
}

.touch-only-flex {
  display: none;
}

@media (hover: none) and (pointer: coarse) {
  .controls {
    gap: 1.2rem;
    padding: 1.2rem;
  }

  .controls label {
    font-size: 15px;
  }

  .pause-button.touch-only {
    display: flex;
  }

  .desktop-only {
    display: none;
  }

  .touch-only {
    display: inline;
  }


  .touch-only-flex {
    display: flex;
    align-items: center;
  }

  .controls input,
  .controls select {
    padding: 0.5rem 0;
    font-size: 16px;
    min-height: 44px;
  }

  .checkbox {
    width: 1.2rem;
    height: 1.2rem;
    min-width: 44px;
    min-height: 44px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) and (hover: none) {
  .controls {
    gap: 1.8rem;
    padding: 1.5rem;
  }

  .controls label {
    font-size: 16px;
  }


}
</style>
