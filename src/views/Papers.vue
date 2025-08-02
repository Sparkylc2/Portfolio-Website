<template>
  <div class="papers-container">
    <h1 class="page-title">Papers</h1>
    <div
      class="content-layout"
      :class="{ 'has-expanded': expandedPaper !== null }"
    >
      <button
        v-if="expandedPaper !== null && isMobile"
        class="mobile-back-button-wrapper"
        @click="closePaper"
      >
        <div class="mobile-back-button"><span>←</span> Back</div>
      </button>

      <div
        class="papers-grid-wrapper"
        :class="{ 'is-hidden': isMobile && expandedPaper !== null }"
      >
        <div
          class="papers-grid"
          :class="{ 'has-active': expandedPaper !== null }"
        >
          <div
            v-for="(paper, index) in papers"
            :key="index"
            class="paper-card"
            :class="{
              active: expandedPaper === index,
              inactive: expandedPaper !== null && expandedPaper !== index,
            }"
            :style="{
              borderColor: getSecondaryOrTertiaryColor(
                paper.color,
                expandedPaper === index,
              ),
              '--paper-date-hover': getPrimaryColor(paper.color),
            }"
            @click="togglePaper(index)"
          >
            <div class="paper-content">
              <h2 :style="{ color: getPrimaryColor(paper.color) }">
                {{ paper.title }}
              </h2>
              <p class="authors">{{ paper.authors }}</p>
              <p class="venue line-clamp-2">{{ paper.venue }}</p>
              <p class="description line-clamp-3">{{ paper.description }}</p>
              <div class="date">
                <span>{{ paper.dateRange }}</span>
              </div>
              <div
                class="paper-indicator"
                :style="{ backgroundColor: getSecondaryColor(paper.color) }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="expandedPaper !== null && (!isMobile || expandedPaper !== null)"
        class="paper-details-section"
        :class="{ 'mobile-fullscreen': isMobile }"
        id="paperDetailsSection"
      >
        <div class="paper-details-content">
          <div class="paper-sections">
            <div
              class="section"
              :style="{
                outlineColor: getSecondaryOrTertiaryColor(
                  currentPaper?.color,
                  true,
                ),
              }"
            >
              <Transition name="fade" mode="out-in">
                <div
                  v-if="activeSection === 'Paper'"
                  key="paper"
                  class="section-content"
                  ref="parentScroll"
                  id="sectionContent"
                >
                  <div
                    v-if="!isMobile && currentPaper?.pdf"
                    class="pdf-viewer"
                    ref="pdfWrapper"
                  >
                    <PDFViewer
                      :pdfFileName="currentPaper.pdf"
                      :accentColor="getSecondaryColor(currentPaper?.color)"
                      :key="currentPaper?.pdf + currentPaper?.color"
                    />
                  </div>
                  <div v-else>
                    <PDFViewer
                      :pdfFileName="currentPaper.pdf"
                      :accentColor="getSecondaryColor(currentPaper?.color)"
                      :key="currentPaper?.pdf + currentPaper?.color"
                    />
                  </div>
                </div>
                <div
                  v-else-if="activeSection === 'Abstract'"
                  key="abstract"
                  class="section-content"
                >
                  <div
                    class="paper-details"
                    v-html="currentPaper?.detailedDescription"
                  ></div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import PDFViewer from "../components/PDFViewer.vue";
import {
  getPrimaryColor,
  getSecondaryColor,
  getSecondaryOrTertiaryColor,
} from "../composables/useGetColours";

const props = defineProps({
  activeSection: String,
  selectedPaper: Number,
});

const emit = defineEmits(["update:selectedPaper", "update:selectedPaperColor"]);

const expandedPaper = ref(null);
const pdfWrapper = ref(null);
const parentScroll = ref(null);
const isMobile = ref(false);
const isTablet = ref(false);

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
  isTablet.value = window.innerWidth > 768 && window.innerWidth <= 1024;
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});

watch(
  () => props.selectedPaper,
  (newVal) => {
    expandedPaper.value = newVal;
  },
  { immediate: true },
);

watch(expandedPaper, (newVal) => {
  emit("update:selectedPaper", newVal);
  if (newVal !== null) {
    emit("update:selectedPaperColor", papers[newVal]?.color);
  }
});

const papers = [
  {
    title:
      "Theoretical, Computational, and Experimental Approaches to Pipe Flow꞉ A Comparative Study",
    authors: "Lukas Campbell",
    venue: "Imperial College London, Department of Aeronautics",
    description:
      "A comprehensive study on the analysis of pipe flow using theoretical, computational, and experimental methods.",
    keywords: [
      "Physics Simulation",
      "Verlet Integration",
      "Real-time",
      "Constraints",
    ],
    pdf: "PipeFlowLabReport.pdf",
    arxiv: "https://arxiv.org/abs/2024.12345",
    doi: "https://doi.org/10.1145/1234567",
    detailedDescription: `<h3>WIP</h3>
        `,
    color: "red",
    dateRange: "2024-01-15 to 2024-02-15",
  },
  {
    title:
      "Theoretical, Computational, and Experimental Approaches to Indeterminate Beams꞉ A Comparative Study",
    authors: "Lukas Campbell",
    venue: "Imperial College London, Department of Aeronautics",
    description:
      "A comprehensive study on the analysis of indeterminate beams using theoretical, computational, and experimental methods.",
    keywords: ["Wind Energy", "Machine Learning", "Optimization", "BEM Theory"],
    pdf: "SimpleBeamsLabReport.pdf",
    arxiv: "https://arxiv.org/abs/2024.23456",
    doi: "https://doi.org/10.1016/j.renene.2024.01.123",
    detailedDescription: `
        <h3>WIP</h3>`,
    color: "blue",
    dateRange: "2024-01-15 to 2024-02-15",
  },
];

const currentPaper = computed(() =>
  expandedPaper.value !== null ? papers[expandedPaper.value] : null,
);

const openPaper = (index) => {
  expandedPaper.value = index;
};

const closePaper = () => {
  expandedPaper.value = null;
};

const togglePaper = (index) => {
  if (expandedPaper.value !== index) {
    openPaper(index);
  }
};

onMounted(async () => {
  await nextTick();

  if (!isMobile.value) {
    openPaper(0);
  }
});
</script>

<style scoped>
.papers-container,
.papers-grid-wrapper,
.paper-details-section,
.section-content {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.papers-container::-webkit-scrollbar,
.papers-grid-wrapper::-webkit-scrollbar,
.paper-details-section::-webkit-scrollbar,
.section-content::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.papers-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.paper-sections {
  flex-grow: 1;
}

.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: bold;
  position: fixed;
  top: clamp(1rem, 3vw, 2rem);
  left: clamp(1rem, 3vw, 2rem);
  margin: 0;
  z-index: 5;
}

.content-layout {
  display: flex;
  gap: 2rem;
  padding: 6rem 2rem 2rem;
  height: 100vh;
  min-height: 100vh;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-layout.has-expanded {
  justify-content: flex-start;
}

.mobile-back-button-wrapper {
  display: none;
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  background: rgb(36, 36, 36);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 44px;
  cursor: pointer;
}

.mobile-back-button-wrapper .mobile-back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 0.25rem;
  padding: 0.5rem;
  border: 0.1rem solid v-bind("getSecondaryColor(currentPaper?.color)");
}

.mobile-back-button:hover {
  filter: brightness(1.1);
}

.papers-grid-wrapper {
  position: relative;
  width: 600px;
  max-width: 90%;
  height: calc(100vh - 8rem);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overscroll-behavior: contain;
}

.papers-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  padding: 2rem 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-layout.has-expanded .papers-grid-wrapper {
  width: 350px;
  max-width: 350px;
}

.paper-card {
  background-color: rgb(36, 36, 36);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transform: translateX(0) translateY(0) scale(1);
  opacity: 1;
}

.paper-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  background-color: #252525;
}

.paper-card:hover .paper-indicator {
  width: 100%;
}

.paper-card.inactive {
  opacity: 0.5;
  transform: translateX(0) translateY(0) scale(0.95);
}

.paper-card.active {
  background-color: rgb(36, 36, 36);
  transform: translateX(-5px) translateY(0) scale(1);
}

.paper-content {
  position: relative;
  padding-bottom: 4px;
}

.paper-content h2 {
  margin-bottom: 0.5rem;
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
}

.paper-content .authors {
  font-size: clamp(0.85rem, 2vw, 0.9rem);
  color: #999;
  margin-bottom: 0.25rem;
}

.paper-content .venue {
  font-size: clamp(0.85rem, 2vw, 0.9rem);
  color: #bbb;
  margin-bottom: 0.75rem;
  font-style: italic;
}

.paper-content .description {
  font-size: clamp(0.9rem, 2vw, 1rem);
  line-height: 1.5;
}

.date {
  font-size: clamp(0.8rem, 1.8vw, 0.9rem);
  color: rgb(225, 225, 225);
  display: flex;
  justify-content: end;
  padding-bottom: 0.1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.paper-card:hover .date {
  color: var(--paper-date-hover);
}

.paper-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 9999px;
}

.paper-details-section {
  flex: 1;
  background: rgb(36, 36, 36);
  overflow-y: auto;
  scrollbar-width: none;
  padding-bottom: 2rem;
  border-radius: 0.5rem;
  max-height: calc(100vh - 8rem);
  min-width: 400px;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.content-layout.has-expanded .paper-details-section {
  opacity: 1;
  transform: scale(1);
}

.paper-details-content {
  padding: 1rem;
  padding-top: 2rem;
  min-height: 100%;
  background: transparent;
}

.paper-details {
  margin: 2rem;
}

.section {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  max-height: calc(100vh - 12rem);
  background: rgb(36, 36, 36);
  border-radius: 0.5rem;
  outline: 1px solid v-bind("getSecondaryColor(currentPaper?.color)");
  outline-offset: 1px;
  overflow: hidden;
  flex-grow: 1;
}

.section-content {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  flex-grow: 1;
}

.section-content h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin-bottom: 1rem;
}

.section-content .authors {
  font-size: clamp(1rem, 2vw, 1.1rem);
  color: #ccc;
  margin-bottom: 0.5rem;
}

.section-content .venue {
  font-size: clamp(0.95rem, 2vw, 1rem);
  color: #aaa;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.paper-description {
  font-size: clamp(0.95rem, 2vw, 1.05rem);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.is-hidden {
  visibility: hidden;
}

.pdf-viewer {
  width: 100%;
  height: 100vh;
  overflow: visible;
  display: block;
  position: relative;
}

:deep(.pdf-viewer > *) {
  flex: 1;
  height: 100%;
  min-height: 100%;
}

.mobile-pdf-section {
  margin: 2rem 0;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  text-align: center;
}

.mobile-pdf-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: transparent;
  color: white;
  border: 2px solid;
  border-radius: 8px;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.mobile-pdf-link:hover {
  transform: translateY(-2px);
  filter: brightness(1.2);
}

.pdf-icon {
  font-size: 1.5rem;
}

.mobile-pdf-note {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #999;
}

.paper-meta {
  margin-top: auto;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr auto;
  align-items: flex-end;
  padding-top: 2rem;
}

.keywords {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.keywords h3 {
  margin-bottom: 0.75rem;
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
}

.keyword-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.keyword-tag {
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.keyword-tag:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.paper-links {
  display: flex;
  gap: 0.8rem;
  align-self: center;
  align-items: last baseline;
  padding-bottom: 0.4rem;
  height: 100%;
}

.paper-link {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  color: white;
  border-radius: 0.4rem;
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
  border: 0.15rem solid;
  background-color: transparent;
  font-size: clamp(0.9rem, 2vw, 1rem);
}

.paper-link:hover {
  transform: translateY(-2px);
  filter: brightness(1.2);
}

.paper-details h3 {
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.paper-details p,
.paper-details li {
  font-size: clamp(0.95rem, 2vw, 1.05rem);
  line-height: 1.6;
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
  .page-title {
    font-size: 2rem;
    top: 1rem;
    left: 1rem;
    z-index: 6;
  }

  .content-layout {
    flex-direction: column;
    padding: 4rem 1rem 1rem;
    gap: 0;
    height: 100vh;
  }

  .mobile-back-button-wrapper {
    display: block;
  }

  .papers-grid-wrapper {
    width: 100%;
    max-width: 100%;
    height: calc(100vh - 5rem);
    padding: 0;
  }

  .papers-grid {
    padding: 1rem 0;
    gap: 0.75rem;
    width: 100%;
  }

  .paper-card {
    padding: 1.25rem;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
  }

  .paper-details-section.mobile-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    min-width: unset;
    border-radius: 0;
    z-index: 10;
    opacity: 1;
    transform: scale(1);
    padding-bottom: 0;
  }

  .paper-details-content {
    padding: 1rem;
    padding-top: 4rem;
    height: 100vh;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
    top: 1rem;
    left: 1rem;
    z-index: 6;
  }

  .content-layout {
    flex-direction: column;
    padding: 4rem 1rem 1rem;
    gap: 0;
    height: 100vh;
  }

  .mobile-back-button-wrapper {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    position: fixed;
    top: 1rem;
    left: 1rem;
    background: rgb(36, 36, 36);
    font-size: 1rem;
    padding: 0 0.9rem;
    min-height: 44px;
    z-index: 100;
  }

  .papers-grid-wrapper {
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: calc(100vh - 5rem);
    padding: 0;
  }

  .papers-grid {
    padding: 1rem 0;
    width: 100%;
    min-width: 0;
  }

  .paper-card {
    padding: 1.25rem;
    width: 100%;
  }

  .paper-card.active,
  .paper-card.inactive {
    display: none;
  }

  .paper-details-section {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-height: 100vh;
    min-width: 0;
    border-radius: 0;
    z-index: 99;
    overflow-y: auto;
    padding-bottom: 0;
    background: rgb(36, 36, 36);
    animation: slideUp 0.25s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }

    to {
      transform: translateY(0);
    }
  }

  .section {
    max-height: none;
    min-height: 100vh;
    outline: none;
  }

  .section-content {
    padding: 1.5rem;
  }

  .paper-meta {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .paper-links {
    align-self: flex-start;
    padding-bottom: 0;
  }

  .keyword-tags {
    gap: 0.4rem;
  }

  .keyword-tag {
    font-size: 0.85rem;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .page-title {
    font-size: 2.5rem;
    top: 1.5rem;
    left: 1.5rem;
  }

  .content-layout {
    padding: 5rem 1.5rem 1.5rem;
    gap: 1.5rem;
  }

  .papers-grid-wrapper,
  .papers-grid {
    width: 350px;
    min-width: 350px;
  }

  .papers-grid.has-active {
    width: 300px;
    min-width: 300px;
  }

  .paper-details-section {
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

  .papers-grid-wrapper,
  .papers-grid {
    width: 500px;
    min-width: 500px;
  }

  .papers-grid.has-active {
    width: 450px;
    min-width: 450px;
  }

  .paper-card {
    padding: 2rem;
  }

  .paper-card h2 {
    font-size: 1.5rem;
  }

  .paper-details-section {
    min-width: 500px;
  }
}

@media (min-width: 2560px) {
  .page-title {
    font-size: 4rem;
  }

  .papers-grid-wrapper,
  .papers-grid {
    width: 600px;
    min-width: 600px;
  }

  .papers-grid.has-active {
    width: 550px;
    min-width: 550px;
  }

  .paper-details-section {
    min-width: 600px;
  }
}
</style>
