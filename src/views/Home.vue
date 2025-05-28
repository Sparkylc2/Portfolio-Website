<template>
    <div class="app-container">
        <Navbar :tabs="navbarTabs" :activeTab="activeNavbarTab" :indicatorColor="currentProjectColor"
            @update:activeTab="handleTabChange" />

        <div class="content">
            <Projects v-if="currentTab === 'Projects'" :activeSection="projectSection"
                :selectedProject="selectedProject" @update:selectedProject="handleProjectChange"
                @update:selectedProjectColor="handleProjectPaperColorChange" />

            <Papers v-if="currentTab === 'Papers'" :activeSection="paperSection" :selectedPaper="selectedPaper"
                @update:selectedPaper="handlePaperChange" @update:selectedPaperColor="handleProjectPaperColorChange" />

            <div v-if="currentTab === 'GitHub'" class="github-content">
                <h1>GitHub</h1>
                <p>yeyueuyeeuye</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Navbar from '../components/Navbar.vue'
import Projects from '../views/Projects.vue'
import Papers from '../views/Papers.vue'


const currentTab = ref('Projects')
const projectSection = ref('Overview')
const paperSection = ref('Paper')
const selectedProject = ref(null)
const selectedPaper = ref(null)
const activeColor = ref('#e63946')


function getProjectColour(color) {
    const map = {
        red: 'rgb(204, 140, 140)',
        blue: 'rgb(140, 172, 204)',
        green: 'rgb(140, 204, 140)',
        yellow: 'rgb(204, 172, 140)',
    }

    return map[color] || '#e63946'
}

const handleProjectPaperColorChange = (color) => {
    activeColor.value = color;
}
const currentProjectColor = computed(() => {
    if (activeColor.value !== null && currentTab.value === 'Projects') {
        return getProjectColour(activeColor.value)
    } else if (activeColor.value !== null && currentTab.value === 'Papers') {
        return getProjectColour(activeColor.value)
    }
    return '#e63946'
})

watch(selectedProject, (newVal) => {
    if (newVal === null) {
        activeColor.value = null;
    }
})
watch(selectedPaper, (newVal) => {
    if (newVal === null) {
        activeColor.value = null;
    }
})

const ALL_TABS = [
    { key: 'Overview', label: 'Overview', parent: 'Projects' },
    { key: 'Details', label: 'Details', parent: 'Projects' },
    { key: 'Paper', label: 'Paper', parent: 'Papers' },
    { key: 'Abstract', label: 'Abstract', parent: 'Papers' },
    { key: '_DIVIDER', divider: true },
    { key: 'Projects', label: 'Projects' },
    { key: 'Papers', label: 'Papers' },
    { key: 'GitHub', label: 'GitHub' }
]

const projectActive = computed(() =>
    currentTab.value === 'Projects' && selectedProject.value !== null
)

const paperActive = computed(() =>
    currentTab.value === 'Papers' && selectedPaper.value !== null
)
const navbarTabs = computed(() => {
    return ALL_TABS.map(t => {
        let hidden = false
        if (t.parent === 'Projects') {
            hidden = !(currentTab.value === 'Projects' && selectedProject.value !== null)
        } else if (t.parent === 'Papers') {
            hidden = !(currentTab.value === 'Papers' && selectedPaper.value !== null)
        }

        if (t.divider) {
            const showingProjectTabs = currentTab.value === 'Projects' && selectedProject.value !== null
            const showingPaperTabs = currentTab.value === 'Papers' && selectedPaper.value !== null
            hidden = !(showingProjectTabs || showingPaperTabs)
        }


        return { ...t, hidden }
    })
})

const activeNavbarTab = computed(() => {
    if (projectActive.value) return projectSection.value
    if (paperActive.value) return paperSection.value
    return currentTab.value
})


function handleTabChange(key) {
    if (['Projects', 'Papers', 'GitHub'].includes(key)) {
        currentTab.value = key
        if (key !== 'Projects') {
            selectedProject.value = null
            projectSection.value = ALL_TABS.find(t => t.parent === 'Projects').key
        }
        if (key !== 'Papers') {
            selectedPaper.value = null
            paperSection.value = ALL_TABS.find(t => t.parent === 'Papers').key
        }
    } else {
        if (currentTab.value === 'Projects') {
            projectSection.value = key
        } else if (currentTab.value === 'Papers') {
            paperSection.value = key
        }
    }
}

function handleProjectChange(idx) {
    selectedProject.value = idx
    if (idx !== null) projectSection.value = ALL_TABS.find(t => t.parent === 'Projects').key
}

function handlePaperChange(idx) {
    selectedPaper.value = idx
    if (idx !== null) paperSection.value = ALL_TABS.find(t => t.parent === 'Papers').key
}
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

.content {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.home-content,
.github-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
}

.home-content h1,
.github-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.home-content p,
.github-content p {
    font-size: 1.2rem;
    color: #ccc;
}
</style>
