<template>
  <div class="app-container">
    <Navbar :tabs="navbarTabs" :activeTab="activeNavbarTab" :indicatorColor="currentProjectColor"
      @update:activeTab="handleTabChange" />
    <section class="main-section">
      <div class="content" :class="{ 'allow-scroll': currentTab === 'About Me' && (isMobile || isTablet) }">
        <Projects v-if="currentTab === 'Projects'" :activeSection="projectSection" :selectedProject="selectedProject"
          @update:selectedProject="handleProjectChange" @update:selectedProjectColor="handleProjectPaperColorChange"
          :isMobile="isMobile" :isTablet="isTablet" />
        <Papers v-if="currentTab === 'Papers'" :activeSection="paperSection" :selectedPaper="selectedPaper"
          @update:selectedPaper="handlePaperChange" @update:selectedPaperColor="handleProjectPaperColorChange"
          :isMobile="isMobile" :isTablet="isTablet" />
        <div v-if="currentTab === 'About Me' && (isMobile || isTablet)" class="hero-section-wrapper">
          <HeroSection />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Navbar from "../components/Navbar.vue";
import Papers from "../views/Papers.vue";
import Projects from "../views/Projects.vue";
import HeroSection from "../components/HeroSection.vue";
import { useHead } from "@unhead/vue";

const currentTab = ref("Projects");
const projectSection = ref("Overview");
const paperSection = ref("Paper");
const selectedProject = ref(null);
const selectedPaper = ref(null);
const activeColor = ref("#e63946");
const isMobile = ref(false);
const isTablet = ref(false);

function updateDisplay() {
  isMobile.value = window.innerWidth <= 768;
  isTablet.value = window.innerWidth > 768 && window.innerWidth <= 1024;


}

onMounted(() => {
  updateDisplay();
  window.addEventListener("resize", updateDisplay);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateDisplay);
});

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

const ALL_TABS = computed(() => [
  { key: "Overview", label: "Overview", parent: "Projects", show: true },
  { key: "Details", label: "Details", parent: "Projects", show: true },
  { key: "Paper", label: "Paper", parent: "Papers", show: true },
  // { key: "Abstract", label: "Abstract", parent: "Papers", show: true },
  { key: "_DIVIDER", divider: true, show: true },
  { key: "Projects", label: "Projects", show: true },
  { key: "Papers", label: "Papers", show: true },
  { key: "About Me", label: "About Me", show: isMobile.value || isTablet.value },
  { key: "GitHub", label: "GitHub", show: true }
]);

const projectActive = computed(
  () => currentTab.value === "Projects" && selectedProject.value !== null,
);

const paperActive = computed(
  () => currentTab.value === "Papers" && selectedPaper.value !== null,
);

const navbarTabs = computed(() => {
  return ALL_TABS.value.map((t) => {
    let hidden = false;

    if (!t.show) {
      hidden = true;
    }
    else if (t.parent === "Projects") {
      hidden = !(
        currentTab.value === "Projects" && selectedProject.value !== null
      );
    } else if (t.parent === "Papers") {
      hidden = !(currentTab.value === "Papers" && selectedPaper.value !== null);
    }
    else if (t.divider) {
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

function handleTabChange(key) {
  if (["Projects", "Papers", "GitHub", "About Me"].includes(key)) {
    currentTab.value = key;
    if (key !== "Projects") {
      selectedProject.value = null;
      projectSection.value = ALL_TABS.value.find((t) => t.parent === "Projects")?.key;
    }
    if (key !== "Papers") {
      selectedPaper.value = null;
      paperSection.value = ALL_TABS.value.find((t) => t.parent === "Papers")?.key;
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
  if (idx !== null) {
    projectSection.value = ALL_TABS.value.find((t) => t.parent === "Projects")?.key;
  }
}

function handlePaperChange(idx) {
  selectedPaper.value = idx;
  if (idx !== null) {
    paperSection.value = ALL_TABS.value.find((t) => t.parent === "Papers")?.key;
  }
}
</script>

<style scoped>
.all-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

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

.content.allow-scroll {
  overflow-y: auto;
  overflow-x: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.hero-section-wrapper {
  padding: 2rem 2rem 2rem;
  min-height: 100vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .hero-section-wrapper {
    padding: 5rem 1rem 1rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .hero-section-wrapper {
    padding: 6rem 1.5rem 1.5rem;
  }
}
</style>
