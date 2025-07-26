<template>
  <div class="app-container">
    <Navbar
      :tabs="navbarTabs"
      :activeTab="activeNavbarTab"
      :indicatorColor="currentProjectColor"
      @update:activeTab="handleTabChange"
    />

    <div class="scroll-wrapper" ref="scrollWrapper" @scroll="handleScroll">
      <section class="main-section">
        <div class="content">
          <Projects
            v-if="currentTab === 'Projects'"
            :activeSection="projectSection"
            :selectedProject="selectedProject"
            @update:selectedProject="handleProjectChange"
            @update:selectedProjectColor="handleProjectPaperColorChange"
          />

          <Papers
            v-if="currentTab === 'Papers'"
            :activeSection="paperSection"
            :selectedPaper="selectedPaper"
            @update:selectedPaper="handlePaperChange"
            @update:selectedPaperColor="handleProjectPaperColorChange"
          />
        </div>

        <Transition name="fade">
          <div
            v-if="showScrollIndicator && showHeroSection"
            class="scroll-indicator"
            @click="scrollToHero"
          >
            <span class="scroll-text">About Me</span>
            <div class="scroll-arrow">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 5v14M19 12l-7 7-7-7"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </Transition>
      </section>

      <section
        v-if="showHeroSection"
        class="hero-section-wrapper"
        ref="heroSectionRef"
      >
        <HeroSection :scroll-progress="scrollProgress" />

        <div class="scroll-to-top" @click="scrollToTop">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M12 19V5M5 12l7-7 7 7"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from "vue";
import Navbar from "../components/Navbar.vue";
import Projects from "../views/Projects.vue";
import Papers from "../views/Papers.vue";
import HeroSection from "../components/HeroSection.vue";

const currentTab = ref("Projects");
const projectSection = ref("Overview");
const paperSection = ref("Paper");
const selectedProject = ref(null);
const selectedPaper = ref(null);
const activeColor = ref("#e63946");

const scrollWrapper = ref(null);
const heroSectionRef = ref(null);
const showScrollIndicator = ref(true);
const scrollProgress = ref(0);

function getProjectColour(color) {
  const map = {
    red: "rgb(204, 140, 140)",
    blue: "rgb(140, 172, 204)",
    green: "rgb(140, 204, 140)",
    yellow: "rgb(204, 172, 140)",
  };
  return map[color] || "#e63946";
}

const handleProjectPaperColorChange = (color) => {
  activeColor.value = color;
};

const currentProjectColor = computed(() => {
  if (activeColor.value !== null && currentTab.value === "Projects") {
    return getProjectColour(activeColor.value);
  } else if (activeColor.value !== null && currentTab.value === "Papers") {
    return getProjectColour(activeColor.value);
  }
  return "#e63946";
});

watch(selectedProject, (newVal) => {
  if (newVal === null) {
    activeColor.value = null;
  }
});

watch(selectedPaper, (newVal) => {
  if (newVal === null) {
    activeColor.value = null;
  }
});

const ALL_TABS = [
  { key: "Overview", label: "Overview", parent: "Projects" },
  { key: "Details", label: "Details", parent: "Projects" },
  { key: "Paper", label: "Paper", parent: "Papers" },
  { key: "Abstract", label: "Abstract", parent: "Papers" },
  { key: "_DIVIDER", divider: true },
  { key: "Projects", label: "Projects" },
  { key: "Papers", label: "Papers" },
  { key: "GitHub", label: "GitHub" },
];

const projectActive = computed(
  () => currentTab.value === "Projects" && selectedProject.value !== null,
);

const paperActive = computed(
  () => currentTab.value === "Papers" && selectedPaper.value !== null,
);

const navbarTabs = computed(() => {
  return ALL_TABS.map((t) => {
    let hidden = false;
    if (t.parent === "Projects") {
      hidden = !(
        currentTab.value === "Projects" && selectedProject.value !== null
      );
    } else if (t.parent === "Papers") {
      hidden = !(currentTab.value === "Papers" && selectedPaper.value !== null);
    }

    if (t.divider) {
      const showingProjectTabs =
        currentTab.value === "Projects" && selectedProject.value !== null;
      const showingPaperTabs =
        currentTab.value === "Papers" && selectedPaper.value !== null;
      hidden = !(showingProjectTabs || showingPaperTabs);
    }

    return { ...t, hidden };
  });
});

const activeNavbarTab = computed(() => {
  if (projectActive.value) return projectSection.value;
  if (paperActive.value) return paperSection.value;
  return currentTab.value;
});

const showHeroSection = computed(() => {
  const nothingSelected =
    (currentTab.value === "Projects" && selectedProject.value === null) ||
    (currentTab.value === "Papers" && selectedPaper.value === null);
  return nothingSelected;
});

function handleTabChange(key) {
  if (["Projects", "Papers", "GitHub"].includes(key)) {
    currentTab.value = key;
    if (key !== "Projects") {
      selectedProject.value = null;
      projectSection.value = ALL_TABS.find((t) => t.parent === "Projects").key;
    }
    if (key !== "Papers") {
      selectedPaper.value = null;
      paperSection.value = ALL_TABS.find((t) => t.parent === "Papers").key;
    }
  } else {
    if (currentTab.value === "Projects") {
      projectSection.value = key;
    } else if (currentTab.value === "Papers") {
      paperSection.value = key;
    }
  }
}

function handleProjectChange(idx) {
  selectedProject.value = idx;
  if (idx !== null)
    projectSection.value = ALL_TABS.find((t) => t.parent === "Projects").key;
}

function handlePaperChange(idx) {
  selectedPaper.value = idx;
  if (idx !== null)
    paperSection.value = ALL_TABS.find((t) => t.parent === "Papers").key;
}

const handleScroll = () => {
  if (!scrollWrapper.value) return;

  const scrollTop = scrollWrapper.value.scrollTop;
  const scrollHeight =
    scrollWrapper.value.scrollHeight - scrollWrapper.value.clientHeight;

  scrollProgress.value = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

  showScrollIndicator.value = scrollTop < 100;
};

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
    () => currentTab.value,
    () => selectedProject.value,
    () => selectedPaper.value,
  ],
  () => {
    nextTick(() => {
      if (scrollWrapper.value) {
        scrollWrapper.value.scrollTo({ top: 0, behavior: "instant" });
      }
    });
  },
);
</script>

<style scoped>
.app-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgb(36, 36, 36);
  color: #fff;
  overflow: hidden;
}

.scroll-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.main-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  width: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
}

.hero-section-wrapper {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: row;
  margin-left: auto;
  align-items: center;
  justify-content: right;
  padding: 2rem;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .scroll-indicator {
    bottom: 1rem;
  }

  .scroll-text {
    font-size: 0.8rem;
  }

  .scroll-arrow {
    width: 36px;
    height: 36px;
  }

  .hero-section-wrapper {
    padding: 1rem;
    padding-top: 4rem;
  }

  .scroll-to-top {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }
}

@supports (-webkit-overflow-scrolling: touch) {
  .scroll-wrapper {
    -webkit-overflow-scrolling: touch;
  }
}
</style>
/style>
