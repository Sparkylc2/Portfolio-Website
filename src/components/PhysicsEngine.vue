<template>
    <div class="physics-container">
        <div class="controls-overlay">
            <div class="control-panel">
                <div class="panel-header">
                    <Dropdown v-model="activeTool" :options="toolDropdownItems" placeholder="Select Tool"
                        class="tool-dropdown" />
                </div>

                <Transition name="panel-content" mode="out-in">
                    <div v-if="activeTool !== 'None'" class="panel-content">
                        <div v-if="activeTool === 'Box'" class="tool-controls">
                            <div class="control-group">
                                <label>
                                    Width:
                                    <input v-model.number="toolProps.box.width" type="number" step="5" min="10"
                                        max="200" />
                                    <span class="underline"></span>
                                </label>
                                <label>
                                    Height:
                                    <input v-model.number="toolProps.box.height" type="number" step="5" min="10"
                                        max="200" />
                                    <span class="underline"></span>
                                </label>
                            </div>
                            <div class="control-group">
                                <label class="checkbox-label">
                                    <input v-model="toolProps.box.isStatic" type="checkbox" class="custom-checkbox" />
                                    <span class="checkbox-text">Static</span>
                                </label>
                                <label class="checkbox-label">
                                    <input v-model="toolProps.box.gravity" type="checkbox" class="custom-checkbox" />
                                    <span class="checkbox-text">Gravity</span>
                                </label>
                            </div>
                        </div>

                        <div v-else-if="activeTool === 'Circle'" class="tool-controls">
                            <div class="control-group">
                                <label>
                                    Radius:
                                    <input v-model.number="toolProps.circle.radius" type="number" step="5" min="5"
                                        max="100" />
                                    <span class="underline"></span>
                                </label>
                            </div>
                            <div class="control-group">
                                <label class="checkbox-label">
                                    <input v-model="toolProps.circle.isStatic" type="checkbox"
                                        class="custom-checkbox" />
                                    <span class="checkbox-text">Static</span>
                                </label>
                                <label class="checkbox-label">
                                    <input v-model="toolProps.circle.gravity" type="checkbox" class="custom-checkbox" />
                                    <span class="checkbox-text">Gravity</span>
                                </label>
                            </div>
                        </div>

                        <div v-else-if="activeTool === 'Spring'" class="tool-controls">
                            <div class="control-group">
                                <label>
                                    Stiffness:
                                    <input v-model.number="toolProps.spring.stiffness" type="number" step="50" min="50"
                                        max="1000" />
                                    <span class="underline"></span>
                                </label>
                                <label>
                                    Damping:
                                    <input v-model.number="toolProps.spring.damping" type="number" step="1" min="0"
                                        max="50" />
                                    <span class="underline"></span>
                                </label>
                            </div>
                        </div>

                        <div v-else-if="activeTool === 'Motor'" class="tool-controls">
                            <div class="control-group">
                                <label>
                                    Speed:
                                    <input v-model.number="toolProps.motor.speed" type="number" step="0.5" min="-20"
                                        max="20" />
                                    <span class="underline"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>

        <div ref="pixiContainer" class="pixi-container" />
    </div>
</template>

<script setup>
import { Application, Graphics } from 'pixi.js'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import PhysicsEngineModule from '../wasm/physics_engine.js'
import Dropdown from './Dropdown.vue'

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
const app = ref(null)
const engine = ref(null)

const tickerFunction = ref(null)
const resizeObserver = shallowRef(null)

const activeTool = ref('Box')
const toolMap = { None: 0, Circle: 1, Box: 2, Spring: 3, Motor: 4 }

const toolProps = ref({
    box: { width: 50, height: 50, isStatic: false, gravity: true },
    circle: { radius: 25, isStatic: false, gravity: true },
    spring: { stiffness: 300, damping: 10 },
    motor: { speed: 5 }
})

const bodyGraphics = new Map()
const forceGraphics = ref(null)
const previewGraphics = ref(null)

function setupResizeObserver() {
    if (!props.elementData?.container || !app.value || !engine.value) return

    if (resizeObserver.value) resizeObserver.value.disconnect()

    resizeObserver.value = new ResizeObserver(() => {
        canvasOnResize()
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
        newContainer.y !== oldContainer.y) {
        canvasOnResize()
    }

    setupResizeObserver()
}, { immediate: true })

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

function onPointerDown(ev) {
    if (!app.value || !engine.value) return
    const { left, top } = app.value.canvas.getBoundingClientRect()
    const x = ev.clientX - left
    const y = ev.clientY - top

    engine.value.mouseDown(x, y)
}

function onPointerMove(ev) {
    if (!app.value || !engine.value) return
    const { left, top } = app.value.canvas.getBoundingClientRect()
    const x = ev.clientX - left
    const y = ev.clientY - top

    engine.value.mouseMove(x, y)
}

function onPointerUp(ev) {
    if (!app.value || !engine.value) return
    const { left, top } = app.value.canvas.getBoundingClientRect()
    const x = ev.clientX - left
    const y = ev.clientY - top

    engine.value.mouseUp(x, y)
}

function drawSpring(g, xa, ya, xb, yb, segments = 6, offset = 10) {
    const dx = xb - xa, dy = yb - ya
    const len = Math.hypot(dx, dy)
    if (!len) return

    const dir = [dx / len, dy / len]
    const perp = [-dir[1], dir[0]]
    const step = len / segments

    const zigzag = (thick, color) => {
        g.setStrokeStyle({ width: thick, color: color })
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

function drawRotationArrow(g, x, y, speed) {
    const radius = 20
    const direction = speed > 0 ? 1 : -1
    const arrowSize = 6

    g.setStrokeStyle({ width: 3, color: 0xFF0000 })
    g.arc(x, y, radius, 0, Math.PI * 1.5 * direction)
    g.stroke()

    const arrowAngle = Math.PI * 1.5 * direction
    const arrowX = x + Math.cos(arrowAngle) * radius
    const arrowY = y + Math.sin(arrowAngle) * radius

    g.moveTo(arrowX, arrowY)
    g.lineTo(
        arrowX + Math.cos(arrowAngle + Math.PI * 0.8) * arrowSize,
        arrowY + Math.sin(arrowAngle + Math.PI * 0.8) * arrowSize
    )
    g.moveTo(arrowX, arrowY)
    g.lineTo(
        arrowX + Math.cos(arrowAngle - Math.PI * 0.8) * arrowSize,
        arrowY + Math.sin(arrowAngle - Math.PI * 0.8) * arrowSize
    )
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
        g.beginFill(fillColor)

        if (body.type === 'circle') {
            g.drawCircle(0, 0, body.radius)
        } else {
            g.drawRect(-body.width / 2, -body.height / 2, body.width, body.height)
        }

        g.endFill()
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
                forceGraphics.value.beginFill(0xFF0000, 0.1)
                forceGraphics.value.drawCircle(body.x, body.y, 15)
                forceGraphics.value.endFill()

                drawRotationArrow(forceGraphics.value, body.x, body.y, force.speed)
            }
        } else if (force.type === 'spring_preview') {
            const rect = app.value.canvas.getBoundingClientRect()
            const mouseX = mousePos.x - rect.left
            const mouseY = mousePos.y - rect.top

            previewGraphics.value.setStrokeStyle({ width: 2, color: 0x888888, alpha: 0.5 })
            previewGraphics.value.moveTo(force.xa, force.ya)
            previewGraphics.value.lineTo(mouseX, mouseY)
            previewGraphics.value.stroke()
        }
    }
}

const mousePos = ref({ x: 0, y: 0 })
function trackMouse(ev) {
    mousePos.value = { x: ev.clientX, y: ev.clientY }
}

const canvasOnResize = async () => {
    if (!pixiContainer.value || !props.elementData?.container) return

    await nextTick()
    const { width, height } = props.elementData.container

    pixiContainer.value.style.position = 'absolute'
    pixiContainer.value.style.left = `${props.elementData.container.ref.offsetLeft}px`
    pixiContainer.value.style.top = `${props.elementData.container.ref.offsetTop}px`
    pixiContainer.value.style.width = `${width}px`
    pixiContainer.value.style.height = `${height}px`

    if (app.value?.renderer) {
        app.value.renderer.resize(width, height)
    }

    if (engine.value) {
        engine.value.setBounds(width, height)
    }
}

function initListeners() {
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('mousemove', trackMouse)
}

function removeListeners() {
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('mousemove', trackMouse)
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
    forceGraphics.value.zIndex = 1
    app.value.stage.addChild(forceGraphics.value)

    previewGraphics.value = new Graphics()
    previewGraphics.value.zIndex = 3
    app.value.stage.addChild(previewGraphics.value)
}

function initTicker() {
    let last = performance.now()

    tickerFunction.value = () => {
        const now = performance.now()
        engine.value.setDT((now - last) / 100)
        last = now

        engine.value.processEvents()
        engine.value.step()

        updateBodies()
        updateForces()
    }

    app.value.ticker.add(tickerFunction.value)
}

onMounted(async () => {
    engine.value = await PhysicsEngineModule()

    await initPixiContainer()
    initListeners()
    canvasOnResize()
    initTicker()
})

onUnmounted(() => {
    removeListeners()

    if (resizeObserver.value) {
        resizeObserver.value.disconnect()
        resizeObserver.value = null
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
    toolProps
})
</script>

<style scoped>
.physics-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.pixi-container {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    background: transparent;
    pointer-events: auto;
}

.controls-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 100;
    pointer-events: none;
}

.control-panel {
    background-color: rgb(36, 36, 36);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    min-width: 200px;
    max-width: 280px;
}

.panel-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tool-dropdown {
    width: 100%;
}

.panel-content {
    padding: 1rem;
}

.tool-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.control-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: space-between;
}

.control-group label {
    position: relative;
    display: flex;
    flex-direction: column;
    font-weight: 600;
    font-size: 14px;
    color: #ccc;
    cursor: text;
    flex: 1;
    min-width: 80px;
}

.control-group input[type="number"] {
    all: unset;
    font-size: 14px;
    padding: 0.3rem 0;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    appearance: textfield;
}

.control-group input[type="number"]::-webkit-inner-spin-button,
.control-group input[type="number"]::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
}

.control-group input:focus {
    outline: none;
}

.underline {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 0;
    background-color: rgb(140, 172, 204);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 9999px;
}

.control-group input:hover~.underline,
.control-group input:focus~.underline {
    width: 100%;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
    font-weight: 600;
    font-size: 14px;
    color: #ccc;
    padding: 0.3rem 0;
    transition: color 0.3s ease;
}

.checkbox-label:hover {
    color: #fff;
}

.custom-checkbox {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
}

.custom-checkbox:hover {
    border-color: rgba(140, 172, 204, 0.5);
}

.custom-checkbox:checked {
    background-color: rgb(140, 172, 204);
    border-color: rgb(140, 172, 204);
}

.custom-checkbox:checked::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 5px;
    width: 5px;
    height: 9px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    animation: checkIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.checkbox-text {
    font-weight: 600;
    font-size: 14px;
}

.panel-content-enter-active,
.panel-content-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-content-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.panel-content-leave-to {
    opacity: 0;
    transform: translateY(10px);
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
    .controls-overlay {
        top: 0.5rem;
        left: 0.5rem;
        right: 0.5rem;
    }

    .control-panel {
        max-width: none;
        width: 100%;
    }

    .panel-content {
        padding: 0.75rem;
    }
}
</style>
