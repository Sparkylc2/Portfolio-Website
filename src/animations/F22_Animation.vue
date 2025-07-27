<template>
  <div class="canvas-wrap">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { CustomOutlinePass } from "../composables/CustomOutlinePass.js";
import FindSurfaces from "../composables/FindSurfaces.js";
import gsap from "gsap";


const props = defineProps({
  scrollProgress: {
    type: Number,
    default: 0,
  },
});
const canvas = ref(null);

let scene, camera, renderer, composer;
let customOutline;
let resizeHandler;

let model;

onMounted(() => {
  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(1, 1, 1);

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);


  // const light = new THREE.DirectionalLight(0xffffff, 2);
  // light.position.set(1.7, 1, -1);
  // scene.add(light);

  // const ambientLight = new THREE.AmbientLight(0x404040, 2);
  // scene.add(ambientLight);


  const depthTexture = new THREE.DepthTexture();
  const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    depthTexture,
    depthBuffer: true,
    samples: 1
  });
  composer = new EffectComposer(renderer, renderTarget);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  customOutline = new CustomOutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
  );
  composer.addPass(customOutline);


  const surfaceFinder = new FindSurfaces();
  const loader = new GLTFLoader();

  loader.load(
    "/models/F22-Raptor.glb",
    (gltf) => {
      const root = gltf.scene;
      model = root;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      camera.up.set(0, 1, 0);
      camera.position.set(0, 0, 2.25);

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.setScalar(scale);

      addSurfaceIdAttributeToScene(root, surfaceFinder);
      customOutline.updateMaxSurfaceId(surfaceFinder.surfaceId + 1);

      scene.add(root);
    },
    undefined,
    (err) => console.error("GLTF load error:", err)
  );


  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const tick = () => {
    requestAnimationFrame(tick);


    const targetRotationY = clamp(props.scrollProgress * Math.PI * 2, -Math.PI / 2, Math.PI / 2);
    const targetRotationZ = clamp(props.scrollProgress * Math.PI * 2, -Math.PI / 2, Math.PI / 2);

    if (model) {
      gsap.to(model.rotation, {
        y: -targetRotationY,
        z: -targetRotationZ,
        duration: 0.5,
        ease: "power2.out",
      });
    }
    // renderer.render(scene, camera);
    composer.render();
  };
  tick();


  resizeHandler = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    composer.setSize(w, h);
    customOutline.setSize(w, h);
  };
  window.addEventListener("resize", resizeHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeHandler);
  composer?.dispose?.();
  renderer?.dispose?.();
});


function addSurfaceIdAttributeToScene(root, surfaceFinder) {
  surfaceFinder.surfaceId = 0;

  root.traverse((node) => {
    if (node.isMesh && node.geometry) {
      if (!node.geometry.index) {
        node.geometry = mergeVertices(node.geometry);
      }
      const colorsTypedArray = surfaceFinder.getSurfaceIdAttribute(node);
      node.geometry.setAttribute("color", new THREE.BufferAttribute(colorsTypedArray, 4));
    }
  });
}


</script>

<style scoped>
.canvas-wrap,
canvas {
  width: 40vw;
  height: 100%;
  display: relative;
  background-color: rgb(36, 36, 36);
}
</style>
