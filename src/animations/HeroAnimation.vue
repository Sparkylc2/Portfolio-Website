<template>
  <div class="canvas-wrap" ref="canvasWrap">
    <canvas ref="canvas"></canvas>
  </div>
  <div class="text-overlay">
    <div class="text-container right-side" ref="f22Text">
      <h2 class="model-title">
        <span class="text-content">—&nbsp;&nbsp;Aircraft</span>
        <div class="underline" ref="f22Underline"></div>
      </h2>
      <p class="model-subtitle">F22 Stealth Fighter</p>
    </div>

    <div class="text-container left-side" ref="ingenuityText">
      <h2 class="model-title">
        <span class="text-content">Rotorcraft &nbsp;&nbsp;—</span>
        <div class="underline" ref="ingenuityUnderline"></div>
      </h2>
      <p class="model-subtitle">Ingenuity Mars Helicopter</p>
    </div>

    <div class="text-container right-side" ref="jamesWebbText">
      <h2 class="model-title">
        <span class="text-content">—&nbsp;&nbsp;Spacecraft</span>
        <div class="underline" ref="jamesWebbUnderline"></div>
      </h2>
      <p class="model-subtitle">James Webb Telescope</p>
    </div>
  </div>
</template>

<script setup>
import gsap from "gsap";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { CustomOutlinePass } from "../composables/CustomOutlinePass.js";
import FindSurfaces from "../composables/FindSurfaces.js";

const props = defineProps({
  scrollProgress: {
    type: Number,
    default: 0,
  },
  expandedProject: {
    default: null,
  },
  section: {
    type: Object,
    default: {},
  }
});

const canvas = ref(null);
const canvasWrap = ref(null);

let scene, camera, renderer, composer;
let fullWidth, fullHeight;
let customOutline;
let resizeHandler;
let animationFrame;

const surfaceFinder = new FindSurfaces();
const loader = new GLTFLoader();


let f22_model = null;
let f22_model_animation = null;
let f22_model_action = null;
let f22_mixer = null;
let f22BaseScale = 1;

let ingenuity_model = null;
let ingenuity_model_animation = null;
let ingenuity_model_action = null;
let ingenuity_mixer = null;
let ingenuityBaseScale = 1;

let jamesWebb_model = null;
let jamesWebbBaseScale = 1;

const loadingState = {
  f22: false,
  ingenuity: false,
  jamesWebb: false,
  allLoaded: false
};



const emits = defineEmits(['loaded']);


const f22_timeline = gsap.timeline({ paused: true });
const ingenuity_model_timeline = gsap.timeline({ paused: true });
const jamesWebb_model_timeline = gsap.timeline({ paused: true });


const f22Text = ref(null);
const ingenuityText = ref(null);
const jamesWebbText = ref(null);
const f22Underline = ref(null);
const ingenuityUnderline = ref(null);
const jamesWebbUnderline = ref(null);


const progressProxy = { value: 0 };
const goToProgress = (target) => {
  const dist = Math.abs(target - progressProxy.value);
  const baseDur = 0.25 + dist * 0.35;
  const dur = baseDur * props.section.stickiness;

  gsap.to(progressProxy, {
    value: target,
    duration: dur,
    ease: "power3.out",
    overwrite: "auto"
  });
};

const scrollState = {
  currentProgress: 0,
  targetProgress: 0,
  velocity: 0,
  isScrolling: false,
  lastScrollTime: 0
};



const getTimelineConfig = () => {
  if (!fullWidth) return [];
  return [
    { timeline: f22_timeline, start: 0, end: 0.33, offset: fullWidth / 4 },
    { timeline: ingenuity_model_timeline, start: 0.33, end: 0.74, offset: -fullWidth / 4 },
    { timeline: jamesWebb_model_timeline, start: 0.74, end: 1, offset: fullWidth / 4 }
  ];
};

function getWorldSpaceDimensions() {
  const distance = camera.position.z;
  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
  const visibleWidth = visibleHeight * camera.aspect;
  return { width: visibleWidth, height: visibleHeight };
}
function initializeAllTimelines() {
  if (!f22_model || !ingenuity_model || !jamesWebb_model) return;

  initF22Timeline();
  initIngenuityTimeline();
  initJamesWebbTimeline();

  const introTimeline = gsap.timeline();
  introTimeline
    .to(f22_model.scale, {
      x: f22BaseScale,
      y: f22BaseScale,
      z: f22BaseScale,
      duration: 1.2,
      ease: "power2.out"
    }, 0)
    .to(f22Underline.value, {
      scaleX: 1,
      duration: 1.2,
      ease: "power2.out"
    }, 0)
    .to(f22Text.value, {
      y: "0%",
      opacity: 1,
      duration: 1.2,
      ease: "power2.out"
    }, 0);
}

function initF22Timeline() {
  const animation_duration = f22_model_animation.duration;
  const animationOffset = 16;
  const worldSpace = getWorldSpaceDimensions();
  const modelTargetSize = 2;
  const offScreenDistance = worldSpace.width * 1.2;
  const elevationDistance = modelTargetSize * 0.4;

  f22_timeline.clear();
  f22_timeline
    .to(f22_model.rotation, {
      y: Math.PI / 2,
      duration: 1,
      ease: "power1.inOut",
    }, 0.1)
    .to(f22_model.rotation, {
      z: -Math.PI / 2,
      duration: 1,
      ease: "power1.inOut",
    }, 0.1)
    .to(f22_model.position, {
      y: elevationDistance,
      x: offScreenDistance,
      duration: 0.8,
      ease: "power1.in",
    }, 0.1)
    .to(f22Text.value, {
      x: "100%",
      opacity: 0,
      duration: 0.5,
      ease: "power2.in"
    }, "-=0.7")
    .to(f22Underline.value, {
      scaleX: 0,
      duration: 0.4,
      ease: "power2.in"
    }, "-=0.7")
    .to({ t: 0 }, {
      t: animation_duration - animationOffset,
      duration: 1,
      ease: 'power1.out',
      onUpdate() {
        const t = this.targets()[0].t + animationOffset;
        f22_model_action.time = t;
        f22_model_action._updateTime(0);
        f22_mixer.update(0);
      }
    }, 0)
    .to(f22_model.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.001,
      ease: "power2.out"
    }, "end");
}

function initIngenuityTimeline() {
  const rotorDuration = ingenuity_model_animation.duration;
  const rotorOffset = 0;
  const worldSpace = getWorldSpaceDimensions();

  ingenuity_model.scale.setScalar(1);
  const worldBox = new THREE.Box3().setFromObject(ingenuity_model);
  ingenuity_model.scale.setScalar(0);
  ingenuity_model.position.set(worldSpace.width * 1.2, 0, 0);

  const flyOutDuration = 2;
  gsap.set(ingenuityUnderline.value, { scaleX: 0, transformOrigin: "left center" });

  ingenuity_model_timeline.clear();
  ingenuity_model_timeline
    .fromTo(ingenuityText.value, {
      x: "-50%",
      opacity: 0
    }, {
      x: "0%",
      opacity: 1,
      duration: 3.7,
      ease: "power2.out"
    }, 0)
    .to(ingenuityUnderline.value, {
      scaleX: 1,
      duration: 3.7,
      ease: "power2.out"
    }, 0)
    .to(ingenuity_model.scale, {
      x: ingenuityBaseScale,
      y: ingenuityBaseScale,
      z: ingenuityBaseScale,
      duration: 1.8,
      ease: "power2.out"
    }, 0)
    .to(ingenuity_model.position, {
      x: 0,
      duration: 1.8,
      ease: "power2.out",
    }, 0)
    .to({ t: 0 }, {
      t: rotorDuration,
      duration: 10,
      ease: "none",
      onUpdate() {
        let t = this.targets()[0].t + rotorOffset;
        if (t < 3.33) t *= 0.15;
        ingenuity_model_action.time = t;
        ingenuity_model_action._updateTime(0);
        ingenuity_mixer.update(0);
      },
    }, 0)
    .to(ingenuity_model.rotation, {
      x: 0,
      y: -Math.PI / 4,
      duration: 2,
      ease: "power1.inOut"
    }, 2.2)
    .to(ingenuity_model.scale, {
      x: ingenuityBaseScale * 9,
      y: ingenuityBaseScale * 9,
      z: ingenuityBaseScale * 9,
      duration: 2,
      ease: "power1.inOut"
    }, 2.2)
    .to(ingenuity_model.position, {
      y: worldSpace.height * -1,
      duration: 2,
      ease: "power1.inOut"
    }, 2.2)
    .to(ingenuity_model.rotation, {
      x: Math.PI / 6 * Math.sin(Math.PI / 4),
      y: -Math.PI / 4,
      z: Math.PI / 6 * Math.cos(Math.PI / 4),
      duration: flyOutDuration,
      ease: "power1.in"
    }, 9)
    .to(ingenuity_model.position, {
      x: worldSpace.width * 6,
      duration: flyOutDuration,
      ease: "power1.in"
    }, 9)
    .to(ingenuityText.value, {
      x: "-50%",
      opacity: 0,
      duration: 3.7,
      ease: "power2.in"
    }, "-=3.7")
    .to(ingenuityUnderline.value, {
      scaleX: 0,
      duration: 3.7,
      ease: "power2.in"
    }, "-=3.7")
    .to(ingenuity_model.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.001,
      ease: "power2.out"
    }, "end")
    .to(camera.position, {
      x: 0,
      y: 0,
      z: 2.5,
      duration: 0.001,
      ease: "power2.out"
    }, "end");
}

function initJamesWebbTimeline() {
  const worldSpace = getWorldSpaceDimensions();
  jamesWebb_model.position.set(0, 0, 0);
  jamesWebb_model.rotation.set(0, Math.PI / 2, 0);

  jamesWebb_model_timeline.clear();
  jamesWebb_model_timeline
    .fromTo(jamesWebbText.value, {
      x: "100%",
      opacity: 0
    }, {
      x: "0%",
      opacity: 1,
      duration: 0.37,
      ease: "power2.out"
    }, 0)
    .to(jamesWebbUnderline.value, {
      scaleX: 1,
      duration: 0.37,
      ease: "power2.out"
    }, 0)
    .fromTo(
      jamesWebb_model.scale,
      { x: 0, y: 0, z: 0 },
      { x: 0.5, y: 0.5, z: 0.5, duration: 0.37, ease: "power2.out" }, 0
    )
    .to(jamesWebb_model.rotation, {
      x: Math.PI / 2,
      y: 0,
      z: 0,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0.3)
    .to(jamesWebb_model.position, {
      x: 0,
      y: worldSpace.height * 1.5,
      z: 0,
      duration: 0.4,
      ease: "power2.in"
    }, 0.8)
    .to(jamesWebbText.value, {
      x: "100%",
      opacity: 0,
      duration: 0.37,
      ease: "power2.in"
    }, 0.63)
    .to(jamesWebbUnderline.value, {
      scaleX: 0,
      duration: 0.37,
      ease: "power2.in"
    }, 0.63);
}

async function loadAllModels() {
  const loadPromises = [
    loadF22Model(),
    loadIngenuityModel(),
    loadJamesWebbModel()
  ];

  await Promise.all(loadPromises);

  loadingState.allLoaded = true;
  emits('loaded');

  initializeAllTimelines();
}

async function loadF22Model() {
  return new Promise((resolve, reject) => {
    loader.load(
      "/models/F22-Raptor-Backup.glb",
      (gltf) => {
        f22_model = gltf.scene;
        f22_mixer = new THREE.AnimationMixer(f22_model);
        f22_model_animation = gltf.animations[0];
        f22_model_action = f22_mixer.clipAction(f22_model_animation);
        f22_model_action.play();
        f22_model_action.paused = true;

        f22_model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            node.material.opacity = 0;
            node.material.transparent = true;
          }
        });

        const box = new THREE.Box3().setFromObject(f22_model);
        const center = box.getCenter(new THREE.Vector3());
        f22_model.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        f22BaseScale = scale;
        f22_model.scale.setScalar(0);

        addSurfaceIdAttributeToScene(f22_model, surfaceFinder);
        customOutline.updateMaxSurfaceId(surfaceFinder.surfaceId + 1);

        scene.add(f22_model);
        loadingState.f22 = true;
        resolve();
      },
      undefined,
      reject
    );
  });
}

async function loadIngenuityModel() {
  return new Promise((resolve, reject) => {
    loader.load(
      "/models/HelicopterRotorRiggedAnimated1.glb",
      (gltf) => {
        ingenuity_model = gltf.scene;
        ingenuity_mixer = new THREE.AnimationMixer(ingenuity_model);
        ingenuity_model_animation = gltf.animations[0];
        ingenuity_model_action = ingenuity_mixer.clipAction(ingenuity_model_animation);
        ingenuity_model_action.play();
        ingenuity_model_action.paused = true;

        ingenuity_model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            node.material.opacity = 0;
            node.material.transparent = true;
          }
        });

        const box = new THREE.Box3().setFromObject(ingenuity_model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        ingenuityBaseScale = scale;
        ingenuity_model.scale.setScalar(0);
        ingenuity_model.position.set(0, 0, 0);
        ingenuity_model.rotation.set(Math.PI / 2, 0, 0);

        addSurfaceIdAttributeToScene(ingenuity_model, surfaceFinder);
        customOutline.updateMaxSurfaceId(surfaceFinder.surfaceId + 1);

        scene.add(ingenuity_model);
        loadingState.ingenuity = true;
        resolve();
      },
      undefined,
      reject
    );
  });
}

async function loadJamesWebbModel() {
  return new Promise((resolve, reject) => {
    loader.load("/models/JamesWebb.glb",
      (gltf) => {
        jamesWebb_model = gltf.scene;

        jamesWebb_model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            node.material.opacity = 0;
            node.material.transparent = true;
          }
        });

        const box = new THREE.Box3().setFromObject(jamesWebb_model);
        const center = box.getCenter(new THREE.Vector3());
        jamesWebb_model.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        jamesWebb_model.scale.setScalar(0);
        jamesWebbBaseScale = scale;

        addSurfaceIdAttributeToScene(jamesWebb_model, surfaceFinder);
        customOutline.updateMaxSurfaceId(surfaceFinder.surfaceId + 1);

        scene.add(jamesWebb_model);
        loadingState.jamesWebb = true;
        resolve();
      },
      undefined,
      reject
    );
  });
}

function addSurfaceIdAttributeToScene(root, surfaceFinder) {
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

async function initThree() {
  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(50, canvasWrap.value.clientWidth / canvasWrap.value.clientHeight, 0.1, 100);
  camera.position.set(1, 1, 1);
  camera.up.set(0, 1, 0);
  camera.position.set(0, 0, 2.25);
  fullWidth = canvasWrap.value.clientWidth;
  fullHeight = canvasWrap.value.clientHeight;
  camera.setViewOffset(fullWidth, fullHeight, fullWidth / 4, 0, fullWidth, fullHeight);

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvasWrap.value.clientWidth, canvasWrap.value.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearAlpha(0);

  setupLights(scene);

  const depthTexture = new THREE.DepthTexture();
  const renderTarget = new THREE.WebGLRenderTarget(canvasWrap.value.clientWidth, canvasWrap.value.clientHeight, {
    depthTexture,
    depthBuffer: true,
    samples: 3
  });
  composer = new EffectComposer(renderer, renderTarget);

  const renderPass = new RenderPass(scene, camera);
  renderPass.clear = true;
  composer.addPass(renderPass);

  customOutline = new CustomOutlinePass(
    new THREE.Vector2(canvasWrap.value.clientWidth, canvasWrap.value.clientHeight),
    scene,
    camera,
    new THREE.Color(0xE1E1E1)
  );
  customOutline.clear = false;
  customOutline.renderToScreen = true;
  composer.addPass(customOutline);
}

function setupLights(scene) {
  const magMult = 5;
  const ambient = new THREE.AmbientLight(0xffffff, 0.2 * magMult);
  scene.add(ambient);
}

onMounted(async () => {
  gsap.set(f22Text.value, { y: "-50%", opacity: 0 });
  gsap.set(ingenuityText.value, { x: "-100%", opacity: 0 });
  gsap.set(jamesWebbText.value, { x: "100%", opacity: 0 });
  gsap.set(f22Underline.value, { scaleX: 0, transformOrigin: "right center" });
  gsap.set(ingenuityUnderline.value, { scaleX: 0, transformOrigin: "left center" });
  gsap.set(jamesWebbUnderline.value, { scaleX: 0, transformOrigin: "right center" });

  await initThree();
  await loadAllModels();

  let currentViewOffset = fullWidth / 4;

  const tick = () => {
    animationFrame = requestAnimationFrame(tick);

    if (!loadingState.allLoaded) return;

    scrollState.targetProgress = props.scrollProgress;
    goToProgress(props.scrollProgress);
    const smoothedProgress = progressProxy.value;

    let newViewOffset = currentViewOffset;
    const timelineConfig = getTimelineConfig();

    timelineConfig.forEach(({ timeline, start, end, offset }, index) => {
      if (!timeline) return;

      let progress = 0;

      if (smoothedProgress >= start && smoothedProgress <= end) {
        progress = (smoothedProgress - start) / (end - start);
        progress = Math.max(0, Math.min(1, progress));
        newViewOffset = offset;
      } else if (smoothedProgress > end) {
        progress = 1;
      } else {
        progress = 0;
      }

      timeline.progress(progress);
    });

    if (newViewOffset !== currentViewOffset) {
      currentViewOffset = newViewOffset;
      camera.setViewOffset(fullWidth, fullHeight, currentViewOffset, 0, fullWidth, fullHeight);
    }

    composer.render();
  };
  tick();

  resizeHandler = () => {
    const w = canvasWrap.value.clientWidth;
    const h = canvasWrap.value.clientHeight;
    fullWidth = w;
    fullHeight = h;
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

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  gsap.killTweensOf([
    f22_model?.scale,
    f22_model?.position,
    f22_model?.rotation,
    ingenuity_model?.scale,
    ingenuity_model?.position,
    ingenuity_model?.rotation,
    jamesWebb_model?.scale,
    jamesWebb_model?.position,
    jamesWebb_model?.rotation,
    f22Text.value,
    ingenuityText.value,
    jamesWebbText.value,
    f22Underline.value,
    ingenuityUnderline.value,
    jamesWebbUnderline.value
  ]);

  composer?.dispose?.();
  renderer?.dispose?.();
  scene?.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
});
</script>

<style scoped>
.canvas-wrap,
canvas {
  width: 100%;
  height: 100%;
  display: block;
  background-color: rgb(36, 36, 36);
  background: rgb(36, 36, 36);
  mask-image: linear-gradient(to top, transparent 0%, black 4%, black 96%, transparent 100%),
    linear-gradient(to left, transparent 0%, black 4%, black 96%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-image: linear-gradient(to top, transparent 0%, black 4%, black 96%, transparent 100%),
    linear-gradient(to left, transparent 0%, black 4%, black 96%, transparent 100%);
  -webkit-mask-composite: source-in;
}



.text-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.text-container {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 2rem;
  color: white;
}

.right-side {
  right: 5%;
  text-align: right;
}

.left-side {
  left: 5%;
  text-align: left;
}

.model-title {
  font-size: 3rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
  position: relative;
  display: inline-block;
}

.text-content {
  display: inline-block;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.underline {
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  /* background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.8) 20%, 
    rgba(255, 255, 255, 1) 50%, 
    rgba(255, 255, 255, 0.8) 80%, 
    transparent 100%
  ); */
  transform-origin: left center;
  /* box-shadow: 0 0 12px rgba(255, 255, 255, 0.4); */
}

.right-side .underline {
  transform-origin: right center;
}

.model-subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.7;
  font-weight: 300;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.4);
}

@media (max-width: 768px) {
  .model-title {
    font-size: 2rem;
  }

  .model-subtitle {
    font-size: 1rem;
  }

  .text-container {
    padding: 1rem;
  }
}
</style>
