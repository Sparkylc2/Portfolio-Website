<template>
    <div class="papers-container">
        <h1 class="page-title">Papers</h1>
        <div class="content-layout" :class="{ 'has-expanded': expandedPaper !== null }">
            <div class="papers-grid-wrapper">
                <div class="papers-grid" :class="{ 'has-active': expandedPaper !== null }">
                    <div v-for="(paper, index) in papers" :key="index" class="paper-card" :class="{
                        'active': expandedPaper === index,
                        'inactive': expandedPaper !== null && expandedPaper !== index
                    }" :style="{
                        borderColor: getBorderColor(paper.color, expandedPaper === index),
                        '--paper-date-hover': getPaperTitleColor(paper.color)
                    }" @click="togglePaper(index)">
                        <div class="paper-content">
                            <h2 :style="{ color: getPaperTitleColor(paper.color) }">{{ paper.title }}</h2>
                            <p class="authors">{{ paper.authors }}</p>
                            <p class="venue">{{ paper.venue }}</p>
                            <p>{{ paper.description }}</p>
                            <div class="date">
                                <span>{{ paper.dateRange }}</span>
                            </div>
                            <div class="paper-indicator"
                                :style="{ backgroundColor: getPaperIndicatorColor(paper.color) }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="expandedPaper !== null" class="paper-details-section" id="paperDetailsSection">
                <div class="paper-details-content">
                    <div class="paper-sections">
                        <div class="section" :style="{ outlineColor: getBorderColor(currentPaper?.color, true) }">
                            <Transition name="fade" mode="out-in">
                                <div v-if="activeSection === 'Paper'" key="paper" class="section-content"
                                    ref="parentScroll" id="sectionContent">
                                    <h2>{{ currentPaper?.title }}</h2>
                                    <p class="authors">{{ currentPaper?.authors }}</p>
                                    <p class="venue">{{ currentPaper?.venue }}</p>
                                    <p>{{ currentPaper?.description }}</p>

                                    <div class="pdf-viewer" ref="pdfWrapper">
                                        <PDFViewer v-if="currentPaper?.pdf" :pdfFileName="currentPaper.pdf" />
                                    </div>
                                    <!-- <div class="paper-meta">
                                        <div class="keywords">
                                            <h3>Keywords</h3>
                                            <div class="keyword-tags">
                                                <span v-for="keyword in currentPaper?.keywords" :key="keyword"
                                                    class="keyword-tag">{{ keyword }}</span>
                                            </div>
                                        </div>
                                        <div class="paper-links">
                                            <a v-if="currentPaper?.pdf" :href="currentPaper.pdf" target="_blank"
                                                class="paper-link"
                                                :style="{ backgroundColor: getPaperColor(currentPaper.color) }">
                                                PDF
                                            </a>
                                            <a v-if="currentPaper?.arxiv" :href="currentPaper.arxiv" target="_blank"
                                                class="paper-link"
                                                :style="{ backgroundColor: getPaperColor(currentPaper.color) }">
                                                arXiv
                                            </a>
                                            <a v-if="currentPaper?.doi" :href="currentPaper.doi" target="_blank"
                                                class="paper-link"
                                                :style="{ backgroundColor: getPaperColor(currentPaper.color) }">
                                                DOI
                                            </a>
                                        </div>
                                    </div> -->
                                </div>
                                <div v-else-if="activeSection === 'Abstract'" key="abstract" class="section-content">
                                    <div class="paper-details" v-html="currentPaper?.detailedDescription"></div>
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import PDFViewer from '../components/PDFViewer.vue'

const props = defineProps({
    activeSection: String,
    selectedPaper: Number
})

const emit = defineEmits(['update:selectedPaper', 'update:selectedPaperColor'])

const expandedPaper = ref(null)
const pdfWrapper = ref(null)
const parentScroll = ref(null)


watch(() => props.selectedPaper, (newVal) => {
    expandedPaper.value = newVal
}, { immediate: true })

watch(expandedPaper, (newVal) => {
    emit('update:selectedPaper', newVal)
    if (newVal !== null) {
        emit('update:selectedPaperColor', papers[newVal]?.color)
        updatePDFOutlineColor(papers[newVal]?.color)
    }
})

const papers = [
    {
        title: 'Theoretical, Computational, and Experimental Approaches to Pipe Flow꞉ A Comparative Study',
        authors: 'Lukas Campbell',
        venue: 'Imperial College London, Department of Aeronautics',
        description: 'A novel approach to real-time physics simulation using constraint-based methods with improved stability.',
        keywords: ['Physics Simulation', 'Verlet Integration', 'Real-time', 'Constraints'],
        pdf: 'PipeFlowLabReport.pdf',
        arxiv: 'https://arxiv.org/abs/2024.12345',
        doi: 'https://doi.org/10.1145/1234567',
        detailedDescription: `
        <h3>Abstract</h3>
        <p>We present a novel constraint-based physics simulation method that combines the stability of Verlet integration with efficient constraint solving techniques...</p>
        
        <h3>Key Contributions</h3>
        <ul>
          <li>Novel constraint formulation for improved stability</li>
          <li>Efficient solver implementation</li>
          <li>Real-time performance on consumer hardware</li>
        </ul>
        
        <h3>Results</h3>
        <p>Our method demonstrates significant improvements in simulation stability and performance compared to traditional approaches...</p>
      `,
        color: 'red',
        dateRange: '2024-01-15 to 2024-02-15'
    },
    {
        title: 'Theoretical, Computational, and Experimental Approaches to Indeterminate Beams꞉ A Comparative Study',
        authors: 'Lukas Campbell',
        venue: 'Imperial College London, Department of Aeronautics',
        description: 'A comprehensive study on the analysis of indeterminate beams using theoretical, computational, and experimental methods.',
        keywords: ['Wind Energy', 'Machine Learning', 'Optimization', 'BEM Theory'],
        pdf: 'SimpleBeamsLabReport.pdf',
        arxiv: 'https://arxiv.org/abs/2024.23456',
        doi: 'https://doi.org/10.1016/j.renene.2024.01.123',
        detailedDescription: `
        <h3>Abstract</h3>
        <p>This paper presents a comprehensive machine learning framework for optimizing wind turbine performance through blade design and control optimization...</p>
        
        <h3>Methodology</h3>
        <ul>
          <li>Deep learning models for blade shape optimization</li>
          <li>Reinforcement learning for control strategies</li>
          <li>Integration with BEM theory</li>
        </ul>
      `,
        color: 'blue',
        dateRange: '2024-01-15 to 2024-02-15'
    },
    {
        title: 'Advances in Panel Method Aerodynamics',
        authors: 'Michael Brown, Sarah Davis, Thomas Wilson',
        venue: 'Journal of Computational Physics 2024',
        description: 'Recent developments in panel method implementations for aerodynamic analysis with applications to modern aircraft design.',
        keywords: ['Aerodynamics', 'Panel Methods', 'CFD', 'Aircraft Design'],
        pdf: 'https://example.com/paper3.pdf',
        arxiv: 'https://arxiv.org/abs/2024.34567',
        doi: 'https://doi.org/10.1016/j.jcp.2024.02.456',
        detailedDescription: `
        <h3>Abstract</h3>
        <p>We present recent advances in panel method implementations that significantly improve accuracy and computational efficiency for aerodynamic analysis...</p>
        
        <h3>Technical Innovations</h3>
        <ul>
          <li>Adaptive mesh refinement strategies</li>
          <li>High-order panel representations</li>
          <li>GPU acceleration techniques</li>
        </ul>
      `,
        color: 'green',
        dateRange: '2024-01-15 to 2024-02-15'
    },
    {
        title: 'Numerical Methods for Fluid-Structure Interaction',
        authors: 'Lisa Anderson, Robert Martin, Karen Thompson',
        venue: 'International Journal of Numerical Methods in Engineering 2024',
        description: 'Comprehensive review and new developments in numerical methods for solving fluid-structure interaction problems.',
        keywords: ['FSI', 'Numerical Methods', 'Computational Mechanics', 'FEM'],
        pdf: 'https://example.com/paper4.pdf',
        arxiv: 'https://arxiv.org/abs/2024.45678',
        doi: 'https://doi.org/10.1002/nme.2024.789',
        detailedDescription: `
        <h3>Abstract</h3>
        <p>This paper provides a comprehensive review of current numerical methods for fluid-structure interaction and introduces novel approaches...</p>
        
        <h3>Contributions</h3>
        <ul>
          <li>Unified framework for FSI problems</li>
          <li>Improved stability conditions</li>
          <li>Parallel implementation strategies</li>
        </ul>
      `,
        color: 'yellow',
        dateRange: '2024-01-15 to 2024-02-15'
    }
]

const currentPaper = computed(() =>
    expandedPaper.value !== null ? papers[expandedPaper.value] : null
)

const openPaper = (index) => {
    expandedPaper.value = index
}

const closePaper = () => {
    expandedPaper.value = null
}

const togglePaper = (index) => {
    if (expandedPaper.value !== index) {
        openPaper(index)
    }
}

const getPaperColor = (color) => {
    const colors = {
        red: 'rgb(204, 140, 140)',
        blue: 'rgb(140, 172, 204)',
        green: 'rgb(140, 204, 140)',
        yellow: 'rgb(204, 172, 140)'
    }
    return colors[color] || '#e63946'
}

const getInactiveBorderColor = (color) => {
    const colors = {
        red: 'rgba(204, 140, 140, 0.3)',
        blue: 'rgba(140, 172, 204, 0.3)',
        green: 'rgba(140, 204, 140, 0.3)',
        yellow: 'rgba(204, 172, 140, 0.3)',
    }

    return colors[color] || 'rgba(230, 57, 70, 0.3)'
}

const getActiveBorderColor = (color) => {
    const colors = {
        red: 'rgb(204, 140, 140)',
        blue: 'rgb(140, 172, 204)',
        green: 'rgb(140, 204, 140)',
        yellow: 'rgb(204, 172, 140)',
    }

    return colors[color] || '#e63946'
}

const getBorderColor = (color, isActive) => {
    return isActive ? getActiveBorderColor(color) : getInactiveBorderColor(color)
}

const getPaperIndicatorColor = (color) => {
    const colors = {
        red: 'rgb(204, 140, 140)',
        blue: 'rgb(140, 172, 204)',
        green: 'rgb(140, 204, 140)',
        yellow: 'rgb(204, 172, 140)',
    }

    return colors[color] || '#e63946'
}

const getPaperTitleColor = (color) => {
    const colors = {
        red: 'rgb(255, 191, 191)',
        blue: 'rgb(191, 223, 255)',
        green: 'rgb(191, 255, 191)',
        yellow: 'rgb(255, 223, 191)',
    }

    return colors[color] || '#e63946'
}

const updatePDFOutlineColor = async (color) => {
    const { parent, wrapper } = await waitForElements();
    const iframe = wrapper.querySelector('iframe')
    if (iframe && iframe.contentWindow) {
        const colorMap = {
            red: 'rgb(204, 140, 140)',
            blue: 'rgb(140, 172, 204)',
            green: 'rgb(140, 204, 140)',
            yellow: 'rgb(204, 172, 140)'
        }

        const outlineColor = colorMap[color] || 'rgb(140, 172, 204)'

        try {
            iframe.contentWindow.document.documentElement.style.setProperty('--paper-color', outlineColor)
        } catch (e) {
            console.log('Could not access iframe content:', e)
        }
    }
}

const waitForElements = () => {
        return new Promise((resolve) => {
            const checkElements = () => {
                const parent = parentScroll.value
                const wrapper = pdfWrapper.value

                if (!parent || !wrapper) {
                    setTimeout(checkElements, 100)
                    return
                }

                resolve({ parent, wrapper })
            }

            checkElements()
        })
    }


onMounted(async () => {
    await nextTick()


    const { parent, wrapper } = await waitForElements()

    if (!parent || !wrapper) return


    const iframe = wrapper.querySelector('iframe')
    if (!iframe) return


    // iframe.addEventListener('load', () => {
    //     const win = iframe.contentWindow
    //     if (!win) return
    //     if (currentPaper.value?.color) {
    //         updatePDFOutlineColor(currentPaper.value.color)
    //     }
    // })

    let isScrollingPDF = false


    const isParentAtBottom = () => {
        const tolerance = 0
        return parent.scrollTop + parent.clientHeight >= parent.scrollHeight - tolerance
    }


    const canPDFScroll = (direction) => {
        const win = iframe.contentWindow
        if (!win) return false

        const pdfContainer = win.document.querySelector('#viewerContainer')
        if (!pdfContainer) return false

        if (direction > 0) {
            return pdfContainer.scrollTop + pdfContainer.clientHeight < pdfContainer.scrollHeight
        } else {
            return pdfContainer.scrollTop > 0
        }
    }


    parent.addEventListener('wheel', (e) => {
        const win = iframe.contentWindow
        if (!win) return

        const pdfContainer = win.document.querySelector('#viewerContainer')
        if (!pdfContainer) return

        const deltaY = e.deltaY
        const scrollingDown = deltaY > 0


        if (isParentAtBottom() && scrollingDown && canPDFScroll(deltaY)) {
            e.preventDefault()
            pdfContainer.scrollTop += deltaY
            isScrollingPDF = true
        }

        else if (!scrollingDown && isScrollingPDF) {
            if (pdfContainer.scrollTop > 0) {
                e.preventDefault()
                pdfContainer.scrollTop += deltaY
            } else {
                isScrollingPDF = false
            }
        }

    }, { passive: false })

    iframe.addEventListener('load', () => {
        const win = iframe.contentWindow
        if (!win) return

        win.document.addEventListener('wheel', (e) => {
            const pdfContainer = win.document.querySelector('#viewerContainer')
            if (!pdfContainer) return

            const deltaY = e.deltaY
            const scrollingDown = deltaY > 0

            if (!isParentAtBottom() && scrollingDown) {
                e.preventDefault()
                parent.scrollTop += deltaY
                isScrollingPDF = false
            }
            else if (!scrollingDown && pdfContainer.scrollTop <= 0) {
                e.preventDefault()
                parent.scrollTop += deltaY
                isScrollingPDF = false
            }
            else {
                isScrollingPDF = true
            }
        }, { passive: false })

        win.document.addEventListener('keydown', (e) => {
            const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']
            if (keys.includes(e.key)) {
                const pdfContainer = win.document.querySelector('#viewerContainer')
                if (!pdfContainer) return

                if (!isParentAtBottom() && ['ArrowDown', 'PageDown', ' '].includes(e.key)) {
                    e.preventDefault()
                    parent.scrollTop += e.key === 'PageDown' ? parent.clientHeight : 40
                } else if (pdfContainer.scrollTop <= 0 && ['ArrowUp', 'PageUp'].includes(e.key)) {
                    e.preventDefault()
                    parent.scrollTop -= e.key === 'PageUp' ? parent.clientHeight : 40
                }
            }
        })
    })

    parent.addEventListener('scroll', () => {
        if (!isParentAtBottom()) {
            isScrollingPDF = false
        }
    })
})













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

.pdf-viewer {
    width: 100%;
    height: 100%;
    overflow: visible;
    display: block;
    position: relative;
}

.date {
    font-size: 0.9rem;
    color: rgb(225, 225, 225);
    display: flex;
    justify-content: end;
    padding-bottom: 0.1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.paper-card:hover .date {
    color: var(--paper-date-hover);
}

.papers-container {
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
    padding: 6rem 2rem 2rem;
    height: 100vh;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.content-layout.has-expanded {
    justify-content: flex-start;
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

.papers-grid-wrapper::-webkit-scrollbar {
    display: none;
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

.paper-card:hover .paper-indicator {
    width: 100%;
}

.paper-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
    background-color: #252525;
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
}

.paper-content .authors {
    font-size: 0.9rem;
    color: #999;
    margin-bottom: 0.25rem;
}

.paper-content .venue {
    font-size: 0.9rem;
    color: #bbb;
    margin-bottom: 0.75rem;
    font-style: italic;
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

.paper-details-section::-webkit-scrollbar {
    display: none;
}


.paper-details-content {
    padding: 1rem;
    padding-top: 2rem;
    min-height: 100%;
    background: transparent;
}

.section {
    display: flex;
    flex-direction: column;
    min-height: 500px;
    max-height: calc(100vh - 12rem);
    background: rgb(36, 36, 36);
    border-radius: 0.5rem;
    outline: 1px solid v-bind('getPaperColor(currentPaper?.color)');
    outline-offset: 1px;
    overflow: hidden;
}

.section-content {
    padding: 2rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 100%;
}

.section-content::-webkit-scrollbar {
    width: 6px;
}

.section-content::-webkit-scrollbar-track {
    background: transparent;
}

.section-content::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

.section-content::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.section-content .authors {
    font-size: 1.1rem;
    color: #ccc;
    margin-bottom: 0.5rem;
}

.section-content .venue {
    font-size: 1rem;
    color: #aaa;
    margin-bottom: 1.5rem;
    font-style: italic;
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
    font-size: 0.9rem;
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
}

.paper-link:hover {
    transform: translateY(-2px);
    filter: brightness(1.2);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
