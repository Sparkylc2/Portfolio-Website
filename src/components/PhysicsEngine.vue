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


const activeTool = ref('Box')
const toolMap = { None: 0, Circle: 1, Box: 2, Spring: 3, Motor: 4 }

const elementBoxes = []
const bodyBoxes = []
let forceGraphics = null


const BOX_SIZE = 30
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



watch(() => activeTool, (t) => {
    if (engine.value) engine.value.setActiveTool(toolMap[t] ?? 0)
}, { immediate: true })


// watch(() => circleRadius, (r) => {
//     if (engine.value) engine.value.setCircleRadius(r)
// }, { immediate: true })




function onPointerDown(ev) {
    if (!app.value || !engine.value) return;
    const { left, top } = app.value.canvas.getBoundingClientRect()
    const x = ev.clientX - left
    const y = ev.clientY - top


    console.log('Pointer down at:', x, y)
    engine.value.mouseDown(x, y)
}


function onPointerMove(ev) {
    if (!app.value || !engine.value) return
    const { left, top } = app.value.canvas.getBoundingClientRect()
    engine.value.mouseMove(ev.clientX - left, ev.clientY - top)
}


function onPointerUp(ev) {
    if (!app.value || !engine.value) return
    const { left, top } = app.value.canvas.getBoundingClientRect()
    engine.value.mouseUp(ev.clientX - left, ev.clientY - top)
}

function syncElementBoxes() {
    // const container = props.elementData?.container;
    // const elements = props.elementData?.elements || [];
    // if (!container) return;

    // elementBoxes.length = 0;

    // for (const el of elements) {
    //     if (!el.textWidth || !el.textHeight) continue;
    //     if (el.element.nodeName === "DIV") continue;

    //     const id = engine.value.addBoxBody(
    //         el.textX + (el.textWidth / 2),
    //         el.textY + (el.textHeight / 2),
    //         el.textWidth,
    //         el.textHeight,
    //         true
    //     );

    //     elementBoxes.push({ id: id, g: null, type: "box" });
    // }
}


function initPendulumBlocks() {
    // const container = props.elementData?.container;



    // START_X = container.width / 4
    // START_Y = container.height / 2.5

    // let first = null;

    // for (let i = 0; i < NUM_BOXES; i++) {
    //     const id = addBoxBody(START_X + i * SPACING, START_Y,
    //         BOX_SIZE, BOX_SIZE, false);
    //     if (i == 0) {
    //         // engine.value.addSpringToPoint(id, START_X - SPACING, START_Y, 10, 0);
    //         engine.value.addGravity(id);
    //         const anchor = new Graphics()
    //         anchor.zIndex = 3
    //         anchor.circle(START_X - SPACING, START_Y, 10)
    //         anchor.fill(0xffffff)
    //         anchor.setStrokeStyle({
    //             width: 3, color: 0x000000
    //         });

    //         anchor.stroke()
    //         app.value.stage.addChild(anchor)
    //     } else {
    //         engine.value.addSpringBetween(
    //             bodyBoxes[i - 1].id, id, 10, 0
    //         )
    //         engine.value.addGravity(id);
    //     }


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



// for (let i = 0; i < 3; i += 2) {
//     const id = engine.value.addBoxBody(
//         START_X / 2 * (i + 1), START_Y,
//         BOX_SIZE, BOX_SIZE, false
//     );
//     engine.value.addGravity(id);


//     const g = new Graphics()
//     g.zIndex = 2
//     g.rect(-BOX_SIZE, -BOX_SIZE, BOX_SIZE * 2, BOX_SIZE * 2)
//     g.fill(0xffffff)
//     g.setStrokeStyle({
//         width: 3,
//         color: 0x000000
//     })
//     g.stroke()
//     app.value.stage.addChild(g)
//     bodyBoxes.push({ id, g })

// }

// }

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



function addBoxBody(x, y, width, height, is_static) {
    const id = engine.value.addBoxBody(x, y,
        width, height, is_static);
    const g = new Graphics()
    g.zIndex = 2
    g.rect(-BOX_SIZE / 2, -BOX_SIZE / 2, BOX_SIZE, BOX_SIZE)
    g.fill(0xffffff)
    g.setStrokeStyle({
        width: 3,
        color: 0x000000
    })
    g.stroke()

    app.value.stage.addChild(g)
    bodyBoxes.push({ id: id, g: g, type: "box" })
    return id;
}

function drawSpring(g, a, b, segments = 6, offset = 10) {
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy); if (!len) return
    const dir = [dx / len, dy / len]
    const perp = [-dir[1], dir[0]]
    const step = len / segments
    let start = [a.x, a.y]



    const zigzag = (thick, color, g) => {
        g.setStrokeStyle({ width: thick, color: color })

        g.moveTo(a.x, a.y)
        g.lineTo(b.x, b.y)
        g.stroke()

        start = [a.x, a.y]
        for (let i = 0; i < segments; i++) {
            const end = [
                a.x + dir[0] * step * (i + 1),
                a.y + dir[1] * step * (i + 1)
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

function drawRotationArrow(graphics, x, y, angularVelocity) {
    const radius = 15;
    const direction = angularVelocity > 0 ? 1 : -1;
    const arrowSize = 5;

    graphics.arc(x, y, radius, 0, Math.PI * 1.5 * direction);


    const arrowAngle = Math.PI * 1.5 * direction;
    const arrowX = x + Math.cos(arrowAngle) * radius;
    const arrowY = y + Math.sin(arrowAngle) * radius;

    graphics.lineTo(
        arrowX + Math.cos(arrowAngle + Math.PI * 0.8) * arrowSize,
        arrowY + Math.sin(arrowAngle + Math.PI * 0.8) * arrowSize
    );
    graphics.moveTo(arrowX, arrowY);
    graphics.lineTo(
        arrowX + Math.cos(arrowAngle - Math.PI * 0.8) * arrowSize,
        arrowY + Math.sin(arrowAngle - Math.PI * 0.8) * arrowSize
    );
}

function drawForceGraphics() {
    if (!forceGraphics) return;

    const forces = engine.value.getAllForcesForVisualization();

    forceGraphics.clear();
    for (let i = 0; i < forces.length; i++) {
        const force = forces[i];
        if (force.type === "spring") {
            const pointA = force.pointA;
            const pointB = force.pointB;
            drawSpring(forceGraphics, pointA, pointB, 6, 10);
        } else if (force.type === "motor") {
            if (force.bodyIndex >= 0) {
                const body = bodyBoxes.find(b => b.id === force.bodyIndex);
                if (body) {
                    forceGraphics.lineStyle(1, 0xFF0000);
                    const x = engine.value.getBodyX(force.bodyIndex);
                    const y = engine.value.getBodyY(force.bodyIndex);

                    forceGraphics.beginFill(0xFF0000, 0.1);
                    forceGraphics.drawCircle(x, y, 10);
                    forceGraphics.endFill();

                    drawRotationArrow(forceGraphics, x, y, force.targetAngularVelocity);
                }
            }
        }
    }
}


function initListeners() {
    if (!pixiContainer.value) return;

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointerleave', onPointerUp);
}

function initForceGraphics() {
    if (!app.value) return;

    forceGraphics = new Graphics();
    forceGraphics.zIndex = 1;
    app.value.stage.addChild(forceGraphics);
}

async function initPixiContainer() {
    if (!pixiContainer.value) return;


    app.value = new Application()
    await app.value.init({
        resizeTo: pixiContainer.value,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
    });

    pixiContainer.value.appendChild(app.value.canvas)
    pixiContainer.value.classList.add('pixi-container');
    pixiContainer.value.style.position = 'absolute';
    pixiContainer.value.style.background = 'transparent';


}


function initTicker() {

    let last = performance.now()
    tickerFunction.value = () => {
        const now = performance.now()
        engine.value.setDT((now - last) / 100)
        last = now

        drawForceGraphics()

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

        engine.value.step();

        for (const { id, g, type } of bodyBoxes) {
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

}

onMounted(async () => {
    engine.value = await PhysicsEngineModule()


    await initPixiContainer()
    initListeners()
    initForceGraphics()
    canvasOnResize()
    syncElementBoxes()
    initPendulumBlocks()
    initTicker()


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

    if (forceGraphics) {
        app.value?.stage?.removeChild(forceGraphics);
        forceGraphics.destroy(true);
        forceGraphics = null;
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
    pointer-events: auto;
}

.outer-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}
</style>
