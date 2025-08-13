<template>
  <div class="projects-container">
    <h1 class="page-title">Projects</h1>
    <div class="content-layout" :class="{ 'has-expanded': expandedProject !== null }">
      <div class="projects-grid-wrapper">
        <div class="projects-grid" :class="{ 'has-active': expandedProject !== null }">
          <div v-for="(project, index) in projects" :key="index" class="project-card" :class="{
            active: expandedProject === index,
            inactive: expandedProject !== null && expandedProject !== index,
          }" @click="toggleProject(index)" :style="{
            borderColor: getSecondaryOrTertiaryColor(
              project.color,
              expandedProject === index,
            ),
            '--project-date-hover': getPrimaryColor(project.color),
          }">
            <div class="project-content">
              <h2 :style="{ color: getPrimaryColor(project.color) }">
                {{ project.title }}
              </h2>
              <p>{{ project.description }}</p>
              <div class="date">
                <span :style="{
                  '--project-date-hover': getPrimaryColor(project.color),
                }">{{ project.dateRange }}</span>
              </div>
              <div class="project-indicator" :style="{ backgroundColor: getSecondaryColor(project.color) }"></div>
            </div>
          </div>
        </div>
      </div>

      <Transition name="slide-fade" mode="out-in" @after-leave="onViewGone" @after-enter="onViewReady">
        <div v-if="expandedProject !== null" key="panel" class="project-details-section">
          <button class="close-details-mobile" @click="closeProject" v-if="isMobile">
            <span>&times;</span>
          </button>
          <div class="project-details-content">
            <div class="project-sections">
              <div class="section" ref="overviewSection" :style="{
                outlineColor: getSecondaryOrTertiaryColor(
                  currentProject?.color,
                  true,
                ),
              }">
                <Transition name="fade" mode="out-in">
                  <div v-if="activeSection === 'Overview'" key="overview" class="section-content">
                    <h2>{{ currentProject?.title }}</h2>
                    <p>{{ currentProject?.description }}</p>

                    <component :is="currentProject?.interactiveComponent"
                      v-if="currentProject?.interactiveComponent && !isMobile && !isTablet" class="interactive-demo"
                      :element-data="elementData" :project-color="currentProject?.color" />
                    <div v-else-if="
                      currentProject?.interactiveComponent && (isMobile || isTablet)
                    " class="demo-placeholder mobile-notice">
                      <p>Interactive demo available on desktop</p>
                    </div>
                    <div v-else class="demo-placeholder">
                      <p>Interactive demo coming soon</p>
                    </div>

                    <div class="project-meta">
                      <div class="tech-stack">
                        <div>
                          <h3>Tech Stack</h3>
                          <div class="tech-tags">
                            <span v-for="tech in currentProject?.technologies" :key="tech" class="tech-tag">{{ tech
                              }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="project-links">
                        <a v-if="currentProject?.github" :href="currentProject.github" target="_blank"
                          class="project-link" :style="{
                            borderColor: getSecondaryColor(
                              currentProject.color,
                            ),
                          }">
                          GitHub
                        </a>
                        <a v-if="currentProject?.demo" :href="currentProject.demo" target="_blank" class="project-link"
                          :style="{
                            borderColor: getSecondaryColor(
                              currentProject.color,
                            ),
                          }">
                          Live Demo
                        </a>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="activeSection === 'Details'" key="details" class="section-content">
                    <!-- <div class="project-details" v-html="currentProject?.detailedDescription"></div> -->
                    <component :is="currentProject?.detailedDescription" v-if="currentProject?.detailedDescription" />
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
        <div v-else key="canvas" ref="scrollWrapper" class="scroll-wrapper">
          <section v-if="showHeroSection" class="animation-section" ref="animationSectionRef">
            <div class="animation-wrapper">
              <HeroAnimation ref="heroAnimRef" :scrollProgress="progress" :section="currentSection"
                @loaded="() => (animLoaded = true)" />
            </div>
          </section>

          <Transition name="fade">
            <div v-if="showScrollIndicator && showHeroSection" class="scroll-indicator" @click="scrollToHero">
              <span class="scroll-text">About Me</span>
              <div class="scroll-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
          </Transition>

          <section v-if="showHeroSection" class="hero-section-wrapper" ref="heroSectionRef">
            <HeroSection />
            <div class="scroll-to-top" @click="scrollToTop">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 19V5M5 12l7-7 7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </section>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import HeroAnimation from "../animations/HeroAnimation.vue";
import AirfoilSimulator from "../components/AirfoilSimulator.vue";
import AirfoilSimulatorDetails from "../components/AirfoilSimulatorDetails.vue";
import HeroSection from "../components/HeroSection.vue";
import PhysicsDetails from "../components/PhysicsDetails.vue";
import PhysicsEngine from "../components/PhysicsEngine.vue";
import WindTurbineBEM from "../components/WindTurbineBEM.vue";
import WindTurbineBEMDetails from "../components/WindTurbineBEMDetails.vue";
import {
  getPrimaryColor,
  getSecondaryColor,
  getSecondaryOrTertiaryColor,
} from "../composables/useGetColours";
import { useElementTracker } from "../composables/usePhysicsEngine.js";

import { useHead } from '@unhead/vue'

const projects = [
  {
    title: "Physics Engine",
    description:
      "A real-time physics engine for simulating rigid body dynamics.",
    technologies: ["Processing", "Java"],
    github: "https://github.com/Sparkylc2/PhysicsEngine/tree/main",
    demo: null,
    interactiveComponent: PhysicsEngine,
    detailedDescription: PhysicsDetails,
    color: "red",
    dateRange: "December 2023 - March 2024",
  },
  {
    title: "Wind Turbine BEM",
    description:
      "Blade Element Momentum (BEM) theory implementation for wind turbine analysis.",
    technologies: ["C++", "Python"],
    github: "https://github.com/Sparkylc2/BEM_Turbine",
    demo: null,
    interactiveComponent: WindTurbineBEM,
    detailedDescription: WindTurbineBEMDetails,
    color: "blue",
    dateRange: "May 2025 - June 2025",
  },
  {
    title: "Panel Airfoil Simulator",
    description: "Small simulator for airfoil analysis using panel methods.",
    technologies: ["Matlab"],
    github: "https://github.com/Sparkylc2/PanelAirfoilSimulator",
    demo: null,
    interactiveComponent: AirfoilSimulator,
    detailedDescription: AirfoilSimulatorDetails,
    color: "blue",
    dateRange: "February 2025 - March 2025",
  },
];

const props = defineProps({
  activeSection: String,
  selectedProject: Number,
  activeSubtab: String,
  isMobile: Boolean,
  isTablet: Boolean

});

const emit = defineEmits([
  "update:selectedProject",
  "update:selectedProjectColor",
]);

const expandedProject = ref(null);
const scrollWrapper = ref(null);
const heroSectionRef = ref(null);
const showScrollIndicator = ref(true);
// const showHeroSection = computed(
//   () => expandedProject.value === null && !props.isMobile && !props.isTablet,
// );
// const isDesktop = computed(() => !props.isMobile&& !props.isTablet);

const showHeroSection = computed(
  () => expandedProject.value === null && !props.isMobile && !props.isTablet
);

const isDesktop = computed(() => !props.isMobile)

const capturing = ref(true);
const animLoaded = ref(false);
const progress = ref(0);
const progressTarget = ref(0);
const sensitivity = 0.0007;
const animationSectionRef = ref(null);
const heroAnimRef = ref(null);
let activeTouchId = null;
let lastTouchY = 0;


const headData = computed(() => {
  let data;

  if (expandedProject.value !== null) {
    const project = projects[expandedProject.value];
    if (project) {
      data = {
        title: `${project.title} — ${props.activeSection || 'Overview'}`,
        description: project.description,
        meta: [
          { name: 'description', content: project.description },
          { property: 'og:title', content: `${project.title} — ${props.activeSection || 'Overview'}` },
          { property: 'og:description', content: project.description },
        ],
      };
    } else {
      data = {
        title: "Projects — Lukas Campbell",
        description: "Engineering projects and interactive demos.",
        meta: [
          { name: 'description', content: 'Engineering projects and interactive demos.' },
          { property: 'og:title', content: 'Projects — Lukas Campbell' },
          { property: 'og:description', content: 'Engineering projects and interactive demos.' },
        ],
      };
    }
  } else {
    data = {
      title: "Projects — Lukas Campbell",
      description: "Engineering projects and interactive demos.",
      meta: [
        { name: 'description', content: 'Engineering projects and interactive demos.' },
        { property: 'og:title', content: 'Projects — Lukas Campbell' },
        { property: 'og:description', content: 'Engineering projects and interactive demos.' },
      ],
    };
  }

  return {
    ...data,
    link: [{ rel: 'canonical', href: 'https://lukascampbell.com/' }],
  };
});


useHead(headData);

const onViewGone = () => {
  if (expandedProject.value !== null) {
    detachWheel();
    if (showHeroSection.value) {
      releaseScrollControl();
    }
  }
};

const onViewReady = () => {
  if (expandedProject.value === null && showHeroSection.value) {
    attachWheel();
    takeScrollControl();
  }
};
let currentScrollEl = null;



function onTouchStart(e) {

  if (!showHeroSection.value) return;

  const t = e.changedTouches[0];
  activeTouchId = t.identifier;
  lastTouchY = t.clientY;

  if (capturing.value) {
    e.preventDefault();
    if (scrollWrapper.value) scrollWrapper.value.scrollTop = 0;
  }
}

function onTouchMove(e) {

  if (!showHeroSection.value || activeTouchId === null) return;
  const t = Array.from(e.changedTouches).find(
    (x) => x.identifier === activeTouchId
  );
  if (!t) return;

  const dy = lastTouchY - t.clientY;
  lastTouchY = t.clientY;

  lastWheelDir = Math.sign(dy || 0);

  if (capturing.value) {
    if (
      (progress.value <= 0.001 && lastWheelDir < 0) ||
      (progress.value >= 0.93 && lastWheelDir > 0)
    ) {
      releaseScrollControl();
      return;
    }

    e.preventDefault();

    const raw =
      dy * sensitivity * currentSection.value.speedMultiplier;
    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    progressTarget.value = clamp01(progressTarget.value + raw);
    return;
  }

  const el = scrollWrapper.value;
  if (!el) return;

  const thresholdPx = 120;
  if (lastWheelDir < 0) {
    const animTop = animationSectionRef.value?.offsetTop ?? 0;
    if (el.scrollTop <= animTop + thresholdPx) {
      const cameFromBottom =
        progress.value > 0.5 || progressTarget.value > 0.5;
      const startPos = cameFromBottom ? 1 : 0;
      progress.value = startPos;
      progressTarget.value = startPos;
      takeScrollControl();
      e.preventDefault();
    }
  }
}

function onTouchEnd(e) {
  if (!showHeroSection.value) return;

  const ended = Array.from(e.changedTouches).some(
    (x) => x.identifier === activeTouchId
  );
  if (ended) {
    activeTouchId = null;
  }
}


function attachTouch() {
  if (scrollWrapper.value && scrollWrapper.value !== currentScrollEl) {
    detachTouch();
  }
  const el = scrollWrapper.value;
  if (!el) return;
  el.addEventListener("touchstart", onTouchStart, { passive: false });
  el.addEventListener("touchmove", onTouchMove, { passive: false });
  el.addEventListener("touchend", onTouchEnd, { passive: false });
}

function detachTouch() {
  const el = scrollWrapper.value || currentScrollEl;
  if (!el) return;
  el.removeEventListener("touchstart", onTouchStart);
  el.removeEventListener("touchmove", onTouchMove);
  el.removeEventListener("touchend", onTouchEnd);
}
function attachWheel() {
  if (scrollWrapper.value && scrollWrapper.value !== currentScrollEl) {
    if (currentScrollEl) {
      currentScrollEl.removeEventListener("wheel", onWheel);
    }
    scrollWrapper.value.addEventListener("wheel", onWheel, { passive: false });
    currentScrollEl = scrollWrapper.value;

    attachTouch();
  }
}

function detachWheel() {
  if (currentScrollEl) {
    currentScrollEl.removeEventListener("wheel", onWheel);
    currentScrollEl = null;
  }

  detachTouch();
}

function updateDisplay() {
  if (isDesktop.value) {
    releaseScrollControl();
    detachWheel();
  } else if (isDesktop && expandedProject.value === null) {
    takeScrollControl();
    attachWheel();
  }
}

onMounted(() => {
  updateDisplay();
  window.addEventListener("resize", updateDisplay);
  window.addEventListener("wheel", (e) => {
    if (!animLoaded.value && showHeroSection.value) e.preventDefault();
  });

  if (isDesktop.value) {
    takeScrollControl();
    const el = scrollWrapper.value;
    if (el) {
      el.addEventListener("wheel", onWheel, { passive: false });
      attachTouch()
    }
  }

  stepInertia();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateDisplay);
  window.removeEventListener("wheel", (e) => {
    if (!animLoaded.value && showHeroSection.value) e.preventDefault();
  });

  releaseScrollControl();
  detachWheel();

});

watch(showHeroSection, (newVal, oldVal) => {
  if (newVal && !oldVal && expandedProject.value === null) {
    takeScrollControl();
    attachWheel();
  } else if (!newVal && oldVal) {
    releaseScrollControl();
    detachWheel();
  }
});

watch(
  () => props.selectedProject,
  (newVal) => {
    expandedProject.value = newVal;
  },
  { immediate: true },
);

watch(expandedProject, (newVal) => {
  emit("update:selectedProject", newVal);
  if (newVal !== null) {
    emit("update:selectedProjectColor", projects[newVal]?.color);
  }
});

const currentProject = computed(() =>
  expandedProject.value !== null ? projects[expandedProject.value] : null,
);

const openProject = (index) => {
  expandedProject.value = index;
};

const closeProject = () => {
  expandedProject.value = null;
};

const toggleProject = (index) => {
  if (expandedProject.value === index) {
    closeProject();
  } else {
    openProject(index);
  }
};

const overviewSection = ref(null);
const { elementData } = useElementTracker(overviewSection, {
  excludeClasses: ["interactive-demo", "demo-placeholder"],
  includeContainer: true,
  relative: true,
});

const INERTIA = 0.88;
const MAX_SPEED = 0.008;
const EXP_DECAY = 8;

let lastWheelDir = 0;


function onWheel(e) {
  lastWheelDir = Math.sign(e.deltaY);
  if (capturing.value && showHeroSection.value) {
    if (
      (progress.value <= 0.001 && lastWheelDir < 0) ||
      (progress.value >= 0.93 && lastWheelDir > 0)
    ) {
      releaseScrollControl();
      return;
    }

    e.preventDefault();

    const raw = e.deltaY * sensitivity * currentSection.value.speedMultiplier;
    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    progressTarget.value = clamp01(progressTarget.value + raw);
    return;
  }

  if (!showHeroSection.value) return;

  const el = scrollWrapper.value;
  if (!el) return;

  const thresholdPx = 120;
  if (lastWheelDir < 0) {
    const animTop = animationSectionRef.value?.offsetTop ?? 0;
    if (el.scrollTop <= animTop + thresholdPx) {
      const cameFromBottom = progress.value > 0.5 || progressTarget.value > 0.5;
      const startPos = cameFromBottom ? 1 : 0;
      progress.value = startPos;
      progressTarget.value = startPos;
      takeScrollControl();
    }
  }
}

const stepInertia = () => {
  requestAnimationFrame(stepInertia);

  const diff = progressTarget.value - progress.value;

  const cap = MAX_SPEED * (1 - Math.exp(-Math.abs(diff) * EXP_DECAY));

  let delta = diff * INERTIA;
  if (Math.abs(delta) > cap) {
    delta = Math.sign(delta) * cap;
  }

  if (Math.abs(delta) < 1e-7) return;

  progress.value = Math.min(Math.max(progress.value + delta, 0), 1);
};

function takeScrollControl() {
  if (!showHeroSection.value) return;
  capturing.value = true;
  if (scrollWrapper.value) {
    scrollWrapper.value.scrollTop = 0;
  }
  document.body.style.overflow = "hidden";
}

function releaseScrollControl() {
  if (!showHeroSection.value) return;
  capturing.value = false;
  document.body.style.overflow = "";
}

const scrollToHero = () => {
  if (heroSectionRef.value) {
    heroSectionRef.value.scrollIntoView({ behavior: "smooth" });
  }
};

const scrollToTop = () => {
  if (scrollWrapper.value) {
    scrollWrapper.value.scrollTo({ top: 0, behavior: "smooth" });
  }
};

watch(
  [
    () => expandedProject.value,
    () => props.selectedProject,
    () => props.activeSection,
  ],
  () => {
    nextTick(() => {
      if (scrollWrapper.value) {
        scrollWrapper.value.scrollTo({ top: 0, behavior: "instant" });
      }
    });
  },
);

const sections = [
  {
    start: 0,
    end: 0.33,
    easeIn: 0.15,
    easeOut: 0.15,
    stickiness: 0.9,
    speedMultiplier: 1.1,
  },
  {
    start: 0.33,
    end: 0.74,
    easeIn: 0.1,
    easeOut: 0.1,
    stickiness: 0.9,
    speedMultiplier: 0.5,
  },
  {
    start: 0.74,
    end: 1,
    easeIn: 0.12,
    easeOut: 0.12,
    stickiness: 0.9,
    speedMultiplier: 1,
  },
];

const currentSection = computed(() => {
  return (
    sections.find(
      (s) => progress.value >= s.start && progress.value <= s.end,
    ) || sections[0]
  );
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.animation-section {
  position: relative;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.animation-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.scroll-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: contain;
}

.scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.hero-section-wrapper {
  height: 100%;
  width: 100%;
  max-width: 100%;
  position: relative;
  display: flex;
  padding: 3rem;
  /* background: linear-gradient(to bottom, rgb(36, 36, 36), rgb(28, 28, 28)); */
}

.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  z-index: 10;
  animation: bounce 2s infinite;
  transition: opacity 0.3s ease;
}

.scroll-indicator:hover {
  animation-play-state: paused;
}

.scroll-text {
  font-size: 0.9rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
}

.scroll-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.scroll-indicator:hover .scroll-arrow {
  border-color: rgba(140, 172, 204, 0.5);
  transform: translateY(3px);
}

.scroll-arrow svg {
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;
}

.scroll-indicator:hover .scroll-arrow svg {
  color: rgb(140, 172, 204);
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateX(-50%) translateY(0);
  }

  40% {
    transform: translateX(-50%) translateY(-10px);
  }

  60% {
    transform: translateX(-50%) translateY(-5px);
  }
}

.scroll-to-top {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(36, 36, 36, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.scroll-to-top:hover {
  background: rgb(36, 36, 36);
  border-color: rgb(140, 172, 204);
  transform: translateY(-2px);
}

.scroll-to-top svg {
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;
}

.scroll-to-top:hover svg {
  color: rgb(140, 172, 204);
}

.projects-container,
.projects-grid-wrapper,
.project-details-section,
.section-content {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.projects-container::-webkit-scrollbar,
.projects-grid-wrapper::-webkit-scrollbar,
.project-details-section::-webkit-scrollbar,
.section-content::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.date {
  font-size: 0.9rem;
  color: rgb(225, 225, 225);
  display: flex;
  justify-content: end;
  padding-bottom: 0.1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-card:hover .date {
  color: var(--project-date-hover);
}

.projects-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.page-title {
  font-size: 3rem;
  font-weight: bold;
  position: fixed;
  top: 2rem;
  left: 2rem;
  margin: 0;
  z-index: 5;
}

.content-layout {
  display: flex;
  gap: 2rem;
  padding: 6rem 2rem 0;

  height: 100vh;
  transition: justify-content 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-layout.has-expanded {
  justify-content: flex-start;
}

.projects-grid-wrapper {
  position: relative;
  width: 400px;
  min-width: 400px;
  /* height: calc(100vh - 8rem); */
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.projects-grid {
  width: 425px;
  min-width: 425px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  padding: 2rem 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.projects-grid.has-active {
  width: 350px;
  min-width: 350px;
}

.project-card {
  background-color: rgb(36, 36, 36);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.25rem;
  border-radius: 0.5rem;
  width: calc(100% - 2rem);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  position: relative;
  justify-content: center;
  overflow: visible;
  transform: scale(1);
  opacity: 1;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    border-color 0.3s ease;
}

.project-card.active {
  transform: translateX(-5px);
  opacity: 1;
}

.project-card.inactive {
  transform: scale(0.95);
  opacity: 0.5;
}

.project-card:hover .project-indicator {
  width: 100%;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  background-color: rgb(36, 36, 36);
}

.project-content {
  position: relative;
  padding-bottom: 4px;
}

.project-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 9999px;
}

.project-details-section {
  position: relative;
  flex: 1;
  background: rgb(36, 36, 36);
  overflow-y: hidden;
  padding-bottom: 2rem;
  border-radius: 0.5rem;
  max-height: calc(100vh - 8rem);
  min-width: 400px;
}

.close-details-mobile {
  display: none;
}

.project-details-content {
  padding: 1rem;
  padding-top: 2rem;
  min-height: 100%;
}

.section {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  height: calc(80vh);
  max-height: calc(100vh - 12rem);
  background: rgb(36, 36, 36);
  border-radius: 0.5rem;
  outline: 1px solid transparent;
  outline-offset: 1px;
  transition: all 0.3s ease;
  overflow: hidden;
  flex-grow: 1;
}

.section-content {
  padding: 2rem;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  justify-content: flex-start;
  flex: 1;
  gap: 1rem;
}

.demo-placeholder {
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 3rem;
  text-align: center;
  color: #999;
}

.demo-placeholder.mobile-notice {
  background: rgba(140, 172, 204, 0.1);
  border-color: rgba(140, 172, 204, 0.3);
}

.tech-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  pointer-events: none;
}

.tech-stack h3 {
  margin-bottom: 0.75rem;
  width: auto;
}

.project-meta {
  margin-top: auto;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr auto;
  align-items: flex-end;
  padding-top: 1rem;
  width: 100%;
}

.tech-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: flex-start;
}

.tech-tag {
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  z-index: 100;
}

.tech-tag:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.project-links {
  display: flex;
  gap: 0.8rem;
  align-self: center;
  align-items: last baseline;
  padding-bottom: 0.4rem;
  height: 100%;
}

.project-link {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  color: white;
  border-radius: 0.4rem;
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
  background-color: transparent;
  border: 0.15rem solid;
  z-index: 100;
}

.project-link:hover {
  transform: translateY(-2px);
  filter: brightness(1.2);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .scroll-wrapper {
    display: none;
  }

  .page-title {
    font-size: 2rem;
    top: 1rem;
    left: 1rem;
  }

  .content-layout {
    padding: 4rem 1rem 1rem;
    flex-direction: column;
    gap: 0;
  }

  .content-layout.has-expanded {
    overflow: hidden;
  }

  .projects-grid-wrapper {
    width: 100%;
    max-width: 100%;
    min-width: unset;
    height: auto;
    max-height: calc(100vh - 5rem);
  }

  .projects-grid {
    width: 100%;
    min-width: unset;
    padding: 1rem 0;
  }

  .projects-grid.has-active {
    width: 100%;
    min-width: unset;
  }

  .project-card {
    width: 100%;
    padding: 1.25rem;
  }

  .project-card h2 {
    font-size: 1.25rem;
  }

  .project-card p {
    font-size: 0.9rem;
  }

  .project-card.active {
    transform: none;
    display: none;
  }

  .project-card.inactive {
    display: none;
  }

  .project-details-section {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    max-height: 100vh;
    min-width: unset;
    border-radius: 0;
    z-index: 100;
    overflow-y: auto;
    padding-bottom: 0;
  }

  .close-details-mobile {
    display: block;
    position: fixed;
    top: 1rem;
    left: 1rem;
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0);
    border: 1px solid #ccc;
    border-color: v-bind("getSecondaryColor(currentProject?.color)");
    border-radius: 0.5rem;
    cursor: pointer;
    z-index: 101;
    font-size: 2rem;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .close-details-mobile:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .project-details-content {
    padding: 1rem;
    padding-top: 5rem;
    height: 100vh;
    overflow-y: auto;
  }

  .section {
    max-height: none;
    min-height: 100vh;
    outline: none;
  }

  .section-content {
    padding: 1.5rem;
  }

  .project-meta {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .project-links {
    align-self: flex-start;
    padding-bottom: 0;
  }

  .tech-tags {
    gap: 0.4rem;
  }

  .tech-tag {
    font-size: 0.85rem;
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(100%);
  }
}

@media (max-width: 769px) {
  .scroll-indicator {
    display: none;
  }

  .scroll-to-top {
    display: none;
  }

  .hero-section-wrapper {
    padding: 1rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {



  .scroll-indicator {
    bottom: 1.5rem;
  }

  .scroll-text {
    font-size: 0.85rem;
  }

  .scroll-arrow {
    width: 38px;
    height: 38px;
  }

  .hero-section-wrapper {
    padding: 2rem;
  }

  .scroll-to-top {
    top: 1.5rem;
    right: 1.5rem;
    width: 44px;
    height: 44px;
  }

  .page-title {
    font-size: 2.5rem;
    top: 1.5rem;
    left: 1.5rem;
  }



  .content-layout {
    padding: 5rem 1.5rem 1.5rem;
    gap: 1.5rem;
  }

  .projects-grid-wrapper {
    width: 350px;
    min-width: 350px;
  }

  .projects-grid {
    width: 350px;
    min-width: 350px;
  }

  .projects-grid.has-active {
    width: 300px;
    min-width: 300px;
  }

  .project-card {
    width: calc(100% - 3rem);
  }

  .project-details-section {
    min-width: 350px;
  }
}

@media (min-width: 1920px) {
  .page-title {
    font-size: 3.5rem;
  }

  .content-layout {
    gap: 2.5rem;
    padding: 7rem 3rem 3rem;
  }

  .projects-grid-wrapper {
    width: 500px;
    min-width: 500px;
  }

  .projects-grid {
    width: 500px;
    min-width: 500px;
  }

  .projects-grid.has-active {
    width: 450px;
    min-width: 450px;
  }

  .project-card {
    padding: 2rem;
  }

  .project-card h2 {
    font-size: 1.5rem;
  }

  .project-details-section {
    min-width: 500px;
  }
}

@media (min-width: 2560px) {
  .page-title {
    font-size: 4rem;
  }

  .projects-grid-wrapper {
    width: 600px;
    min-width: 600px;
  }

  .projects-grid {
    width: 600px;
    min-width: 600px;
  }

  .projects-grid.has-active {
    width: 550px;
    min-width: 550px;
  }

  .project-details-section {
    min-width: 600px;
  }
}

@media (max-width: 768px) {
  .scroll-indicator {
    display: none;
    bottom: 1rem;
  }

  .scroll-to-top {
    display: none;
  }

  .scroll-text {
    font-size: 0.8rem;
  }

  .scroll-arrow {

    width: 36px;
    height: 36px;
  }




}

@supports (-webkit-overflow-scrolling: touch) {
  .scroll-wrapper {
    -webkit-overflow-scrolling: touch;
  }
}
</style>
