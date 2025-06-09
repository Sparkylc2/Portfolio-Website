<template>
    <div ref="pixiContainer" class="pixi-container" />
</template>


<script setup>
import { Application, Graphics } from 'pixi.js'
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
// import initWasm, { PhysicsEngineModule } from '../wasm/physics_engine.js'
import PhysicsEngineModule from '../wasm/physics_engine.js'

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

const resizeObserver = shallowRef(null)



const elementBoxes = []
const bodyBoxes = []
let springG = null


const BOX_SIZE = 16.5
const NUM_BOXES = 3
const SPACING = 40
let START_X = 0
let START_Y = 0



function setupResizeObserver() {
    if (!props.elementData?.container || !app.value || !engine.value) return

    if (resizeObserver.value) resizeObserver.value.disconnect()

    resizeObserver.value = new ResizeObserver(() => {

        canvasOnResize()
        syncElementBoxes()
    });

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





function onPointerDown(ev) {
    if (!app.value) return;
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
    if (!app.value) return;
    if (!isDragging.value) return

    const rect = app.value.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mousePos.value = { x, y }
    engine.value.update_mouse_position(x, y)
}

function onPointerUp() {
    if (!app.value) return;

    engine.value.end_mouse_drag()
    isDragging.value = false
    dragIndex.value = -1
}

function syncElementBoxes() {
    const container = props.elementData?.container;
    const elements = props.elementData?.elements || [];
    if (!container) return;

    elementBoxes.length = 0;

    for (const el of elements) {
        if (!el.textWidth || !el.textHeight) continue;
        if (el.element.nodeName === "DIV") continue;

        const id = engine.value.addBoxBody(
            el.textX + (el.textWidth / 2),
            el.textY + (el.textHeight / 2),
            el.textWidth,
            el.textHeight,
            true
        );

        elementBoxes.push({ id: id, g: null });
    }
}

function initPendulumBlocks() {
    const container = props.elementData?.container;



    START_X = container.width / 4
    START_Y = container.height / 2.5


    for (let i = 0; i < NUM_BOXES; i++) {
        const id = engine.value.addBoxBody(
            START_X + i * SPACING, START_Y,
            BOX_SIZE, BOX_SIZE, false
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



    // engine.value.add_fixed_distance_constraint(
    //     START_X - SPACING, START_Y,
    //     bodyBoxes[0].id, SPACING, 0.9
    // )
    // for (let i = 0; i < bodyBoxes.length - 1; i++) {
    //     engine.value.add_distance_constraint(
    //         bodyBoxes[i].id, bodyBoxes[i + 1].id, SPACING, 0.9
    //     )
    // }



    for (let i = 0; i < 3; i+=2) {
        const id = engine.value.addBoxBody(
            START_X/2 * (i + 1), START_Y,
            BOX_SIZE, BOX_SIZE, false
        );
        engine.value.addGravity(id);


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

const canvasOnResize = async () => {
    if (!pixiContainer.value || !props.elementData?.container) return;

    await nextTick();
    const { x, y, width, height } = props.elementData.container;
    pixiContainer.value.style.position = 'absolute';

    pixiContainer.value.style.left = `${props.elementData.container.ref.offsetLeft}px`;
    pixiContainer.value.style.top = `${props.elementData.container.ref.offsetTop}px`;
    pixiContainer.value.style.width = `${width}px`;
    pixiContainer.value.style.height = `${height}px`;
    
    if (app.value && app.value.renderer) {
        app.value.renderer.resize(width, height);
    }

    if (engine.value) {
        engine.value.setBounds(width, height);  
    }
};


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
    // await initWasm()
    // engine.value = new PhysicsEngineModule()
    // engine.value.set_gravity(0, 981)

    engine.value = await PhysicsEngineModule()

    app.value = new Application()
    await app.value.init({
        resizeTo: pixiContainer.value,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
    })

    pixiContainer.value.appendChild(app.value.canvas)
    canvasOnResize()


    app.value.stage.eventMode = 'static'
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)
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
        engine.value.setDT((now - last)/100)
        last = now

        // springG.clear()
        // const p0 = engine.value.body_position(bodyBoxes[0].id)
        // drawSpring(springG, [START_X - SPACING, START_Y], p0)
        // for (let i = 0; i < 2; i++) {
        //     const a = engine.value.body_position(bodyBoxes[i].id)
        //     const b = engine.value.body_position(bodyBoxes[i + 1].id)
        //     drawSpring(springG, a, b)
        // }
        // if (isDragging.value) {
        //     const dragged = engine.value.body_position(bodyBoxes[dragIndex.value].id)
        //     drawSpring(springG, dragged, [mousePos.value.x, mousePos.value.y])
        // }

        console.log(engine.value.getWallBodyIndices())
        let st = performance.now();
        engine.value.step();
        let et = performance.now();
        // console.log('step time', et - st, 'ms')
        // console.log('step', engine.value.getDT())


        for (const { id, g } of bodyBoxes) {
            const pos = engine.value.getBodyPos(id);
            const angle = engine.value.getBodyAngle(id);

            g.position.set(pos.x, pos.y);
            g.rotation = angle;
        }



        // for (const { id, g } of bodyBoxes) {
        //     const pos = engine.value.body_position(id)
        //     const angle = engine.value.body_angle(id)
        //     g.position.set(pos[0], pos[1])
        //     g.rotation = angle
        // }

        // for (const { id, g } of elementBoxes) {
        //     if (!g) continue;
        //     const pos = engine.value.body_position(id)
        //     const angle = engine.value.body_angle(id)
        //     g.position.set(pos[0], pos[1])
        //     g.rotation = angle
        // }
    }

    app.value.ticker.add(tickerFunction.value);

});




onUnmounted(() => {
    window.removeEventListener('mousemove', onPointerMove)
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchend', onPointerUp)
    window.removeEventListener('touchcancel', onPointerUp)

    
    if (resizeObserver.value) {
        resizeObserver.value.disconnect()
        resizeObserver.value = null
    }
    if (app.value?.ticker) {
        app.value.ticker.stop()
        app.value.ticker.remove(tickerFunction)
    }

    if (springG) {
        app.value?.stage?.removeChild(springG);
        springG.destroy(true);
        springG = null;
    }

    // bodyBoxes.forEach(box => {
    //     if (box.g) {
    //         app.value?.stage?.removeChild(box.g)
    //         box.g.destroy(true)
    //     }
    // })

    // bodyBoxes.length = 0;


    // elementBoxes.forEach(box => {
    //     if (box.g) {
    //         app.value?.stage?.removeChild(box.g)
    //         box.g.destroy(true)
    //     }
    // })

    // elementBoxes.length = 0;

    if (app.value) {
        if (pixiContainer.value && pixiContainer.value.contains(app.value.canvas)) {
            pixiContainer.value.removeChild(app.value.canvas)
        }

        app.value.destroy(true, {
            children: true,
            texture: true,
            baseTexture: true
        })
    }

    if (engine.value) {
        // engine.value.destroy();
    }

    app.value = null
    engine.value = null;
    tickerFunction.value = null;
    pixiContainer.value = null;
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
