<template>
  <canvas 
    ref="canvas" 
    width="700"
    height="400"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import initWasm, { ConstraintPhysicsEngine } from '../../rust/physics_engine/pkg/physics_engine.js'

const canvas = ref(null)
const engine = ref(null)
const isDragging = ref(false)
const mousePos = ref({ x: 0, y: 0 })
const dragStartPos = ref({ x: 0, y: 0 })
const dragIndex = ref(-1)

const onMouseDown = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const index = engine.value.start_mouse_drag(x, y)
  if (index !== -1) {
    isDragging.value = true
    dragStartPos.value = { x, y }
    mousePos.value = { x, y }
    dragIndex.value = index
  }
}

const onMouseMove = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  mousePos.value = { x, y }
  
  if (isDragging.value) {
    engine.value.update_mouse_position(x, y)
  }
}

const onMouseUp = () => {
  if (isDragging.value) {
    engine.value.end_mouse_drag()
    isDragging.value = false
  }
}

onMounted(async () => {
  console.log('Initializing WASM...')
  await initWasm()
  console.log('WASM loaded')
  
  engine.value = new ConstraintPhysicsEngine()
  
  engine.value.set_gravity(0.0, 981) 
  
  const box_size = 20
  const num_boxes = 3
  const spacing = 60
  const start_x = 400
  const start_y = 100
  
  const boxes = []
  
  
  for (let i = 0; i < num_boxes; i++) {
    const box_id = engine.value.add_body(
      start_x + i * spacing,
      start_y,
      box_size,
      box_size,
      1.0
    )
    boxes.push(box_id)
  }
  
  
  engine.value.add_fixed_distance_constraint(
    start_x - spacing,
    start_y,
    boxes[0],
    spacing,
    0.9
  )
  
  
  for (let i = 0; i < boxes.length - 1; i++) {
    engine.value.add_distance_constraint(
      boxes[i],
      boxes[i + 1],
      spacing,
      0.9
    )
  }

  
  const ctx = canvas.value.getContext('2d')
  let last_time = performance.now()
  
  function draw() {
    const current_time = performance.now()
    const dt = Math.min(current_time - last_time, 50) 
    
    engine.value.update(dt)
    
    ctx.fillStyle = 'rgba(36, 36, 36, 1)'
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    

    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(start_x - spacing, start_y, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(start_x - spacing, start_y, 7, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = 'gray'
    ctx.lineWidth = 2
    
    const first_pos = engine.value.body_position(boxes[0])
    drawSpring(ctx, [start_x - spacing, start_y], first_pos, 10, 5)
    

    for (let i = 0; i < boxes.length - 1; i++) {
      const pos_a = engine.value.body_position(boxes[i])
      const pos_b = engine.value.body_position(boxes[i + 1])
      drawSpring(ctx, pos_a, pos_b, 10, 5)
    }
    

    if (isDragging.value) {
      const pos_b = engine.value.body_position(boxes[dragIndex.value])
      drawSpring(ctx, pos_b, [mousePos.value.x, mousePos.value.y], 10, 5)
    
    }
    

    const draw_box = (box_id, color) => {
      const pos = engine.value.body_position(box_id)
      const angle = engine.value.body_angle(box_id)
      const velocity = engine.value.body_velocity(box_id)
      const angular_velocity = engine.value.body_angular_velocity(box_id)
      
      ctx.save()
      ctx.translate(pos[0], pos[1])
      ctx.rotate(angle)
      
      ctx.fillStyle = 'rgb(255, 255, 255)'
      ctx.fillRect(-box_size, -box_size, box_size * 2, box_size * 2)
      
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 2
      ctx.strokeRect(-box_size, -box_size, box_size * 2, box_size * 2)
      ctx.restore()

    }
    

    for (const box_id of boxes) {
      draw_box(box_id, '#ff4444')
    }
    
    
    ctx.fillStyle = 'white'
    
    last_time = current_time
    requestAnimationFrame(draw)
  }
  
  draw()
})



function drawSpring(ctx, a, b, segments = 5, offsetMagnitude = 10) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const length = Math.sqrt(dx * dx + dy * dy)

  const direction = [dx / length, dy / length]
  const segmentLength = length / segments

  const perp = [-direction[1], direction[0]]

  let start = [...a]

  ctx.strokeStyle = 'black'
  ctx.lineWidth = 6

  for (let i = 0; i < segments; i++) {
    const t = (i + 1) / segments
    const end = [
      a[0] + direction[0] * segmentLength * (i + 1),
      a[1] + direction[1] * segmentLength * (i + 1),
    ]

    const mid = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
    ]

    const offsetDir = i % 2 === 0 ? 1 : -1
    const offset = [
      perp[0] * offsetMagnitude * offsetDir,
      perp[1] * offsetMagnitude * offsetDir,
    ]

    const midOffset = [
      mid[0] + offset[0],
      mid[1] + offset[1],
    ]

    ctx.beginPath()
    ctx.moveTo(start[0], start[1])
    ctx.lineTo(midOffset[0], midOffset[1])
    ctx.lineTo(end[0], end[1])
    ctx.stroke()

    start = end
  }

  start = [...a]
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2

  for (let i = 0; i < segments; i++) {
    const t = (i + 1) / segments
    const end = [
      a[0] + direction[0] * segmentLength * (i + 1),
      a[1] + direction[1] * segmentLength * (i + 1),
    ]

    const mid = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
    ]

    const offsetDir = i % 2 === 0 ? 1 : -1
    const offset = [
      perp[0] * offsetMagnitude * offsetDir,
      perp[1] * offsetMagnitude * offsetDir,
    ]

    const midOffset = [
      mid[0] + offset[0],
      mid[1] + offset[1],
    ]

    ctx.beginPath()
    ctx.moveTo(start[0], start[1])
    ctx.lineTo(midOffset[0], midOffset[1])
    ctx.lineTo(end[0], end[1])
    ctx.stroke()

    start = end
  }

  ctx.strokeStyle = 'black'
  ctx.lineWidth = 6

  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.stroke();
  

  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.stroke();
}


</script>

<style scoped>
canvas {
  /* border: 1px solid #ccc;a */
  display: block;
  margin: 20px auto;
  cursor: pointer;
}
</style>
