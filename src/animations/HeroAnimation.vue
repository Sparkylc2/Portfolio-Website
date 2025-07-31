<template>
  <div class="canvas-wrap" ref="canvasWrap">
    <canvas ref="canvas"></canvas>
  </div>
  <div class="text-overlay">
    <div class="text-container right-side" ref="f22Text">
      <h2 class="model-title">
        — Air
        <div class="underline" ref="f22Underline"></div>
      </h2>
      <p class="model-subtitle">F22 Stealth Fighter</p>
    </div>

    <div class="text-container left-side" ref="ingenuityText">
      <h2 class="model-title">
        Rotor —
        <div class="underline" ref="ingenuityUnderline"></div>
      </h2>
      <p class="model-subtitle">Ingenuity Mars Helicopter</p>
    </div>

    <div class="text-container right-side" ref="jamesWebbText">
      <h2 class="model-title">
        — Space
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
  }
});

const canvas = ref(null);
const canvasWrap = ref(null);

let scene, camera, renderer, composer;
let fullWidth, fullHeight
let customOutline;
let resizeHandler;


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

let loadComplete = false;


const f22_timeline = gsap.timeline({ paused: true });
const ingenuity_model_timeline = gsap.timeline({ paused: true });
const jamesWebb_model_timeline = gsap.timeline({ paused: true });

const timelineConfig = [
  { timeline: f22_timeline, start: 0, end: 0.33, offset: fullWidth / 4 },
  { timeline: ingenuity_model_timeline, start: 0.33, end: 0.66 + 0.08, offset: -fullWidth / 4 },
  { timeline: jamesWebb_model_timeline, start: 0.66 + 0.08, end: 1, offset: -fullWidth / 4 }

];

const f22Text = ref(null);
const ingenuityText = ref(null);
const jamesWebbText = ref(null);
const f22Underline = ref(null);
const ingenuityUnderline = ref(null);
const jamesWebbUnderline = ref(null);

function getWorldSpaceDimensions() {

  const distance = camera.position.z;
  const vFOV = THREE.MathUtils.degToRad(camera.fov);

  const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
  const visibleWidth = visibleHeight * camera.aspect;

  return { width: visibleWidth, height: visibleHeight };
}


function initF22Timeline() {
  const animation_duration = f22_model_animation.duration;
  const animationOffset = 16;

  const worldSpace = getWorldSpaceDimensions();
  const modelTargetSize = 2;

  const offScreenDistance = worldSpace.width * 1.2;
  const elevationDistance = modelTargetSize * 0.4;


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

  ingenuity_model.scale.setScalar(1);
  const worldBox = new THREE.Box3().setFromObject(ingenuity_model);
  ingenuity_model.scale.setScalar(0);

  const zoomInY = (p) => worldBox.min.y + (worldBox.max.y - worldBox.min.y) * p;
  const zoomInZ = (p) => worldBox.min.z + (worldBox.max.z - worldBox.min.z) * p;

  const worldSpace = getWorldSpaceDimensions();
  ingenuity_model.position.set(worldSpace.width * 1.2, 0, 0);


  const flyOutDuration = 2;

  gsap.set(ingenuityUnderline.value, { scaleX: 0, transformOrigin: "left center" });

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
    }, 0.63)
}



async function loadJamesWebbModel() {
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
      initJamesWebbTimeline();
    }
  )
}
async function loadIngenuityModel() {
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

      // ingenuity_model.position.sub(center);

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

      initIngenuityTimeline();
    },
    undefined,
    (err) => console.error("GLTF load error:", err)
  );
}

async function loadF22Model() {
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

      const timeline = gsap.timeline({ paused: true });
      timeline.to(f22_model.scale, {
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
          y: "50%",
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
          onComplete: () => {
            loadComplete = true;
          }
        }, 0)

      timeline.play();
      initF22Timeline();

    },
    undefined,
    (err) => console.error("GLTF load error:", err)
  );
}


onMounted(async () => {

  gsap.set(f22Text.value, { y: "-100%", opacity: 0 });
  gsap.set(ingenuityText.value, { x: "-100%", opacity: 0 });
  gsap.set(jamesWebbText.value, { x: "100%", opacity: 0 });

  gsap.set(f22Underline.value, { scaleX: 0, transformOrigin: "right center" });
  gsap.set(ingenuityUnderline.value, { scaleX: 0, transformOrigin: "left center" });
  gsap.set(jamesWebbUnderline.value, { scaleX: 0, transformOrigin: "right center" });


  await initThree();

  loadF22Model();
  loadIngenuityModel();
  loadJamesWebbModel();



  let currentViewOffset = fullWidth / 4;

  const tick = () => {
    requestAnimationFrame(tick);

    let newViewOffset = currentViewOffset;

    timelineConfig.forEach(({ timeline, start, end }, index) => {
      if (!timeline) return;
      if (!loadComplete) return;

      let progress = 0;

      if (props.scrollProgress >= start && props.scrollProgress <= end) {
        progress = (props.scrollProgress - start) / (end - start);
        progress = Math.max(0, Math.min(1, progress));

        if (index === 0) newViewOffset = fullWidth / 4;
        else if (index === 1) newViewOffset = -fullWidth / 4;
        else if (index === 2) newViewOffset = fullWidth / 4;
      } else if (props.scrollProgress > end) {
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
    // renderer.render(scene, camera);
  };
  tick();


  resizeHandler = () => {
    const w = canvasWrap.value.clientWidth;
    const h = canvasWrap.value.clientHeight;
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
  // surfaceFinder.surfaceId = 0;

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


  // camera = new THREE.OrthographicCamera
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
  // renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;


  renderer.physicallyCorrectLights = true;


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

  // const hemi = new THREE.HemisphereLight(0xb0c4ff, 0x242424, 0.7 * magMult);
  // scene.add(hemi);
  // const key = new THREE.DirectionalLight(0xffffff, 2.0 * magMult);
  // key.position.set(3, 4, 2);
  // key.castShadow = true;
  // key.shadow.mapSize.set(2048, 2048);
  // key.shadow.normalBias = 0.02;
  // key.shadow.bias = -0.0002;
  // key.shadow.camera.near = 0.1;
  // key.shadow.camera.far = 20;
  // key.shadow.camera.left = -5;
  // key.shadow.camera.right = 5;
  // key.shadow.camera.top = 5;
  // key.shadow.camera.bottom = -5;
  // scene.add(key);

  // const rim = new THREE.DirectionalLight(0xffffff, 1.2 * magMult);
  // rim.position.set(-3, 2, -2);
  // rim.castShadow = false; // usually no need
  // scene.add(rim);

  // const fill = new THREE.DirectionalLight(0xffffff, 0.5 * magMult);
  // fill.position.set(0, -1, 1);
  // scene.add(fill);

  // return { hemi, key, rim };
}




const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function mapScrollToProgress(scroll, start = 0.2, end = 0.8) {
  const clamped = clamp((scroll - start) / (end - start), 0, 1);
  return clamped;
}

</script>

<style scoped>
.canvas-wrap,
canvas {
  width: 100%;
  height: 100%;
  display: block;
  background-color: rgb(36, 36, 36);
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
  font-family: 'Arial', sans-serif;
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
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;
  position: relative;
  display: inline-block;
}

.underline {
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: white;
  transform-origin: left center;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.right-side .underline {
  transform-origin: right center;
}

.model-subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.8;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
  font-weight: 300;
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
