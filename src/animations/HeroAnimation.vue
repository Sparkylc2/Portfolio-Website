<template>
  <div class="canvas-wrap" ref="canvasWrap">
    <canvas ref="canvas"></canvas>
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
let customOutline;
let resizeHandler;


const surfaceFinder = new FindSurfaces();
const loader = new GLTFLoader();




let f22_model = null;
let f22_model_animation = null;
let f22_model_action = null;
let f22_mixer = null;
let f22_done = false;

let ingenuity_model = null;
let ingenuity_model_animation = null;
let ingenuity_mixer = null;
let ingenuityBaseScale = 1;




const f22_timeline = gsap.timeline();
const ingenuity_model_timeline = gsap.timeline();

const masterTL = gsap.timeline({ paused: true });


function initF22Timeline() {
  const animation_duration = f22_model_animation.duration;
  const animationOffset = 16;

  f22_timeline
    .to(f22_model.rotation, {
      y: Math.PI / 2,
      duration: 0.05,
      ease: "power1.inOut",
    }, 0.0009)
    .to(f22_model.rotation, {
      z: -Math.PI / 2,
      duration: 0.05,
      ease: "power1.inOut",
    }, 0.0009)
    .to(f22_model.position, {
      y: 0.8,
      x: 3.4,
      duration: 0.04,
      ease: "power1.in",
      onComplete: () => {
        f22_done = true;
        console.log("F22 animation done");
      }
    }, 0.0009)
    .to({ t: 0 }, {
      t: animation_duration - animationOffset,
      duration: 0.05,
      ease: 'power1.out',
      onUpdate() {
        const t = this.targets()[0].t + animationOffset;
        f22_model_action.time = t;
        f22_model_action._updateTime(0);
        f22_mixer.update(0);
      }
    }, 0)

    masterTL.add(f22_timeline, "start")
}


function initIngenuityTimeline() {
  const rotorDuration = ingenuity_model_animation[0].duration;
  const rotorOffset = 0;

  ingenuity_model_timeline
    .to(ingenuity_model.scale, {
      x: ingenuityBaseScale,
      y: ingenuityBaseScale,
      z: ingenuityBaseScale,
      duration: 0.15,
      ease: "power2.out"
    }, 0)
    .call(() => {
        ingenuity_model_actionTop.paused    = false;
        ingenuity_model_actionBottom.paused = false;
      }, null, 0.0)
    .to({ t: 0 }, {
      t: rotorDuration,
      duration: 0.5,
      ease: "none",
      onUpdate() {
        const t = this.targets()[0].t + rotorOffset;
        ingenuity_
        ingenuity_model_actionTop.time = t;
        ingenuity_model_actionBottom.time = t;
        ingenuity_model_actionTop._updateTime(0);
        ingenuity_model_actionBottom._updateTime(0);
      }
    }, 0.15)
    .to(camera.position, {
      z: 1.1,
      y: 0.2,
      duration: 0.12,
      ease: "power1.inOut",
      onUpdate() { camera.lookAt(ingenuity_model.position); }
    }, ">")
    .to(ingenuity_model.rotation, {
      z: Math.PI * 0.12,
      duration: 0.1,
      ease: "power1.inOut"
    }, "<")
    .to(ingenuity_model.position, {
      x: 1.2,
      duration: 0.1,
      ease: "power1.inOut"
    }, "<");

    masterTL.add(ingenuity_model_timeline, ">");
}




async function loadIngenuityModel() {
  loader.load(
    "/models/HelicopterRotorRiggedAnimated.glb",
    (gltf) => {
      ingenuity_model = gltf.scene;
      ingenuity_mixer = new THREE.AnimationMixer(ingenuity_model);
      ingenuity_model_animation = [gltf.animations]
      ingenuity_model_animation.forEach((anim) => {
        const action = ingenuity_mixer.clipAction(anim);
        action.play();
        action.paused = true;
      });


      const bumpTexture = new THREE.TextureLoader().load('/models/textures/bump_rough.jpg');
      bumpTexture.wrapS = THREE.RepeatWrapping;
      bumpTexture.wrapT = THREE.RepeatWrapping;
      bumpTexture.repeat.set(4, 4);

      ingenuity_model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;

          const originalColor = node.material.color.clone();
          node.material.opacity = 0;
          node.material.transparent = true;
          node.material.bumpMap = bumpTexture;
          node.material.bumpScale = 0.05;

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

      const bumpTexture = new THREE.TextureLoader().load('/models/textures/bump_rough.jpg');
      bumpTexture.wrapS = THREE.RepeatWrapping;
      bumpTexture.wrapT = THREE.RepeatWrapping;
      bumpTexture.repeat.set(4, 4);

      f22_model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;

          const originalColor = node.material.color.clone();
          node.material.opacity = 0;
          node.material.transparent = true;
          node.material.bumpMap = bumpTexture;
          node.material.bumpScale = 0.05;

        }
      });

      const box = new THREE.Box3().setFromObject(f22_model);
      const center = box.getCenter(new THREE.Vector3());
      f22_model.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      f22_model.scale.setScalar(scale);

      addSurfaceIdAttributeToScene(f22_model, surfaceFinder);
      customOutline.updateMaxSurfaceId(surfaceFinder.surfaceId + 1);

      scene.add(f22_model);

      initF22Timeline();
    },
    undefined,
    (err) => console.error("GLTF load error:", err)
  );
}


onMounted(async () => {

  await initThree();

  await loadF22Model();
  // await loadIngenuityModel();







  const clock = new THREE.Clock();

  const tick = () => {
    requestAnimationFrame(tick);


    if (f22_timeline) {
      f22_timeline.progress(props.scrollProgress);
    }
    // if (ingenuity_model_timeline && f22_done) {
    //   ingenuity_model_timeline.progress(props.scrollProgress);
    // }
    // if (masterTL.getChildren().length > 0) {
    //   // masterTL.progress(props.scrollProgress);
    // }
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

  camera.up.set(0, 1, 0);
  camera.position.set(0, 0, 2.25);
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
</style>
