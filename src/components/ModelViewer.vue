<template>
  <div ref="wrapper" class="viewer-wrapper">
    <canvas ref="canvas" class="viewer-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  src: string
  fov?: number
  background?: string
}>()

import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'

const canvas = ref<HTMLCanvasElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let mesh: THREE.Object3D | undefined
let raf = 0

function fitObject(obj: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(obj)
  const size = box.getSize(new THREE.Vector3()).length()
  const dist = size * 1.5
  const center = box.getCenter(new THREE.Vector3())
  obj.position.sub(center)
  camera.position.set(0, 0, dist)
  camera.near = dist / 100
  camera.far = dist * 100
  camera.updateProjectionMatrix()
  controls.target.set(0, 0, 0)
  controls.update()
}

function animate() {
  raf = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function dispose() {
  cancelAnimationFrame(raf)
  renderer.dispose()
  window.removeEventListener('resize', onResize)
}

function onResize() {
  if (!wrapper.value) return
  const { clientWidth: w, clientHeight: h } = wrapper.value
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  if (!canvas.value || !wrapper.value) return

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: true })
  renderer.setPixelRatio(devicePixelRatio)
  renderer.setClearColor(props.background ?? '#111', 1)

  scene = new THREE.Scene()
  const { clientWidth: w, clientHeight: h } = wrapper.value
  camera = new THREE.PerspectiveCamera(props.fov ?? 60, w / h, 0.1, 1000)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2))
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(5, 10, 7)
  scene.add(dir)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = false
  controls.enablePan = false

  loadModel(props.src)

  onResize()
  window.addEventListener('resize', onResize)
  animate()
})

onUnmounted(dispose)

watch(() => props.src, newSrc => loadModel(newSrc))

function loadModel(path: string) {
  if (mesh) {
    scene.remove(mesh)
    mesh.traverse(o => {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose()
      if ((o as THREE.Mesh).material) {
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[]
        Array.isArray(m) ? m.forEach(x => x.dispose()) : m.dispose()
      }
    })
  }

  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'stl') {
    new STLLoader().load(path, geo => {
      mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.1 })
      )
      scene.add(mesh)
      fitObject(mesh)
    })
  } else if (ext === 'obj') {
    const mtlPath = path.replace(/\.obj$/i, '.mtl')
    fetch(mtlPath, { method: 'HEAD' }).then(r => {
      if (r.ok) {
        new MTLLoader().load(mtlPath, mtl => {
          mtl.preload()
          new OBJLoader().setMaterials(mtl).load(path, obj => {
            mesh = obj
            scene.add(mesh)
            fitObject(mesh)
          })
        })
      } else {
        new OBJLoader().load(path, obj => {
          mesh = obj
          scene.add(mesh)
          fitObject(mesh)
        })
      }
    })
  } else {
    console.warn('Unsupported file type:', ext)
  }
}
</script>

<style scoped>
.viewer-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.viewer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
