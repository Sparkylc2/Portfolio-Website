<template>
    <div ref="pixiContainer" class="pixi-container" />
</template>


<script setup>
import { Application, Graphics } from 'pixi.js'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import initWasm, { ConstraintPhysicsEngine } from '../../public/wasm/physics_engine.js'

const props = defineProps({
    elementData: { type: Object, default: null },
    projectColor: { type: String, default: 'red' }
})


const pixiContainer = ref(null)
const app = ref(null)
const engine = ref(null)

const isDragging = ref(false)
const mousePos = ref({ x: 0, y: 0 })
const dragIndex = ref(-1)
const tickerFunction = ref(null);




const elementBoxes = []
const bodyBoxes = []
let springG = null


const BOX_SIZE = 16.5
const NUM_BOXES = 3
const SPACING = 40
let START_X = 0
let START_Y = 0


function onPointerDown(ev) {
    const rect = app.value.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    
    const idx = engine.value.start_mouse_drag(x, y);

    if (idx === -1) return;
    if (!bodyBoxes[idx]) return;
    

    isDragging.value = true;
    dragIndex.value = idx
    mousePos.value = { x: x, y: y }
}


function onPointerMove(e) {
    if (!isDragging.value) return
    const rect = app.value.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mousePos.value = { x, y }
    engine.value.update_mouse_position(x, y)
}

function onPointerUp() {
    engine.value.end_mouse_drag()
    isDragging.value = false
    dragIndex.value = -1
}

function syncElementBoxes() {
    const container = props.elementData?.container;
    const elements = props.elementData?.elements || [];
    if (!container) return;

    elementBoxes.forEach(box => { if (box.g) app.value.stage.removeChild(box.g) });
    elementBoxes.length = 0;


    const wallThickness = 50;
    const halfWallThickness = wallThickness / 2;
    const halfWidth = container.width / 2;
    const halfHeight = container.height / 2;


    const leftWallID = engine.value.add_fixed_body(
        -halfWallThickness,
        halfHeight,
        halfWallThickness,
        halfHeight
    );


    const rightWallID = engine.value.add_fixed_body(
        container.width + halfWallThickness,
        halfHeight,
        halfWallThickness,
        halfHeight
    );



    const topWallID = engine.value.add_fixed_body(
        halfWidth,
        -halfWallThickness,
        halfWidth,
        halfWallThickness
    );


    const bottomWallID = engine.value.add_fixed_body(
        halfWidth,
        container.height + halfWallThickness,
        halfWidth,
        halfWallThickness
    );


    elementBoxes.push({ id: leftWallID, g: null });
    elementBoxes.push({ id: rightWallID, g: null });
    elementBoxes.push({ id: topWallID, g: null });
    elementBoxes.push({ id: bottomWallID, g: null });


    for (const el of elements) {
        if (!el.textWidth || !el.textHeight) continue;
        if (el.element.nodeName === "DIV") continue;

        // console.log(el);

        const id = engine.value.add_fixed_body(
            el.textX + (el.textWidth / 2),
            el.textY + (el.textHeight / 2),
            el.textWidth / 2,
            el.textHeight / 2
        );

        elementBoxes.push({ id: id, g: null });
    }
}

function initPendulumBlocks() {
    const container = props.elementData?.container;



    START_X = container.width / 2
    START_Y = container.height / 3


    for (let i = 0; i < NUM_BOXES; i++) {
        const id = engine.value.add_body(
            START_X + i * SPACING, START_Y,
            BOX_SIZE, BOX_SIZE, 1
        )

        const g = new Graphics()
        g.zIndex = 2
        g.rect(-BOX_SIZE, -BOX_SIZE, BOX_SIZE * 2, BOX_SIZE * 2)
        g.fill(0xffffff)
        g.setStrokeStyle({
            width: 3,
            color: 0x000000
        })
        g.stroke()

        app.value.stage.addChild(g)
        bodyBoxes.push({ id, g })
    }


    engine.value.add_fixed_distance_constraint(
        START_X - SPACING, START_Y,
        bodyBoxes[0].id, SPACING, 0.9
    )
    for (let i = 0; i < bodyBoxes.length - 1; i++) {
        engine.value.add_distance_constraint(
            bodyBoxes[i].id, bodyBoxes[i + 1].id, SPACING, 0.9
        )
    }


    const anchor = new Graphics()
    anchor.zIndex = 3
    anchor.circle(START_X - SPACING, START_Y, 10)
    anchor.fill(0xffffff)
    anchor.setStrokeStyle({
        width: 3, color: 0x000000
    });

    anchor.stroke()
    app.value.stage.addChild(anchor)
}

watch(() => props.elementData, (newData) => {
    if (!engine.value || !newData || !props.elementData.value) return;
    syncElementBoxes();
}, { immediate: true });


const updateCanvasPosition = () => {
    if (!pixiContainer.value || !props.elementData?.container) return;

    const { x, y, width, height } = props.elementData.container;

    pixiContainer.value.style.position = 'absolute';
    pixiContainer.value.style.left = `${x}px`;
    pixiContainer.value.style.top = `${y}px`;
    pixiContainer.value.style.width = `${width}px`;
    pixiContainer.value.style.height = `${height}px`;

    if (app.value && app.value.renderer) {
        app.value.renderer.resize(width, height);
    }
};

watch(() => props.elementData, (newData) => {
    if (!newData?.container) return;
    if (!app.value || !engine.value) return;
    updateCanvasPosition();
    syncElementBoxes();
}, { immediate: true });



function drawSpring(g, a, b, segments = 6, offset = 10) {
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const len = Math.hypot(dx, dy); if (!len) return
    const dir = [dx / len, dy / len]
    const perp = [-dir[1], dir[0]]
    const step = len / segments
    let start = [...a]



    const zigzag = (thick, color, g) => {
        g.setStrokeStyle({ width: thick, color: color })

        g.moveTo(a[0], a[1])
        g.lineTo(b[0], b[1])
        g.stroke()

        start = [...a]
        for (let i = 0; i < segments; i++) {
            const end = [
                a[0] + dir[0] * step * (i + 1),
                a[1] + dir[1] * step * (i + 1)
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

    zigzag(7, 0x000000, g)
    zigzag(2, 0xffffff, g)
}



onMounted(async () => {
    await initWasm()
    engine.value = new ConstraintPhysicsEngine()
    engine.value.set_gravity(0, 981)

    app.value = new Application()
    await app.value.init({
        resizeTo: pixiContainer.value,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
    })



    pixiContainer.value.appendChild(app.value.canvas)
    updateCanvasPosition()


    app.value.stage.eventMode = 'static'
    app.value.stage.on('pointerdown', onPointerDown)

    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)
    // window.addEventListener('touchmove', onGlobalTouchMove, { passive: false })
    window.addEventListener('touchend', onPointerUp)
    window.addEventListener('touchcancel', onPointerUp)


    initPendulumBlocks()
    syncElementBoxes()


    springG = new Graphics()
    springG.zIndex = 1
    app.value.stage.addChild(springG)

    let last = performance.now()
    tickerFunction.value = () => {
        const now = performance.now()
        engine.value.update(Math.min(now - last, 50))
        last = now

        springG.clear()
        const p0 = engine.value.body_position(bodyBoxes[0].id)
        drawSpring(springG, [START_X - SPACING, START_Y], p0)
        for (let i = 0; i < bodyBoxes.length - 1; i++) {
            const a = engine.value.body_position(bodyBoxes[i].id)
            const b = engine.value.body_position(bodyBoxes[i + 1].id)
            drawSpring(springG, a, b)
        }
        if (isDragging.value) {
            const dragged = engine.value.body_position(bodyBoxes[dragIndex.value].id)
            drawSpring(springG, dragged, [mousePos.value.x, mousePos.value.y])
        }


        for (const { id, g } of bodyBoxes) {
            const pos = engine.value.body_position(id)
            const angle = engine.value.body_angle(id)
            g.position.set(pos[0], pos[1])
            g.rotation = angle
        }

        for (const { id, g } of elementBoxes) {
            if (!g) continue;
            const pos = engine.value.body_position(id)
            const angle = engine.value.body_angle(id)
            g.position.set(pos[0], pos[1])
            g.rotation = angle
        }
    }
    
    app.value.ticker.add(tickerFunction.value);
});


onUnmounted(() => {
    window.removeEventListener('mousemove', onPointerMove)
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchend', onPointerUp)
    window.removeEventListener('touchcancel', onPointerUp)
    
    if (app.value?.ticker) {
        app.value.ticker.stop()
        app.value.ticker.remove(tickerFunction) 
    }
    
    if (app.value) {
        app.value.destroy(true, { children: true, texture: true, baseTexture: true })
        app.value = null
    }
    
    if (springG) {
        springG = null
    }
    
    bodyBoxes.forEach(box => {
        if (box.g) box.g.destroy()
    })
    bodyBoxes.length = 0
    
    elementBoxes.forEach(box => {
        if (box.g) box.g.destroy()
    })
    elementBoxes.length = 0
    
    if (engine.value) {
        engine.value = null
    }

    app.value = null
    engine.value = null
    tickerFunction.value = null
});


</script>

<style scoped>
.pixi-container {
    display: block;
    position: absolute;
    cursor: pointer;
    background: transparent;
}

.outer-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}
</style>
