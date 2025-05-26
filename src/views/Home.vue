<template>
    <div class="app-container">
        <Navbar :tabs="navbarTabs" :activeTab="activeNavbarTab" :indicatorColor="currentProjectColor"
            @update:activeTab="handleTabChange" />

        <div class="content">
            <div v-if="currentTab === 'Home'" class="home-content">
                <h1>Welcome Home</h1>
                <p>This is the home page content</p>
            </div>

            <Projects v-if="currentTab === 'Projects'" :activeSection="projectSection"
                :selectedProject="selectedProject" @update:selectedProject="handleProjectChange" />

            <div v-if="currentTab === 'Papers'" class="papers-content">
                <h1>Papers</h1>
                <p>wewodoodowoowow</p>
            </div>

            <div v-if="currentTab === 'GitHub'" class="github-content">
                <h1>GitHub</h1>
                <p>yeyueuyeeuye</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Navbar from '../components/Navbar.vue'
import Projects from '../views/Projects.vue'


const currentTab = ref('Projects')
const projectSection = ref('Overview')
const selectedProject = ref(null)


const colourNames = ['red', 'blue', 'green', 'yellow']
function getProjectColour(idx) {
    const map = {
        red: 'rgb(204, 140, 140)',
        blue: 'rgb(140, 172, 204)',
        green: 'rgb(140, 204, 140)',
        yellow: 'rgb(204, 172, 140)'
    }
    return map[colourNames[idx % 4]]
}
const currentProjectColor = computed(() =>
    selectedProject.value !== null ? getProjectColour(selectedProject.value)
        : '#e63946'
)


const ALL_TABS = [
    { key: 'Overview', label: 'Overview', parent: 'Projects' },
    { key: 'Details', label: 'Details', parent: 'Projects' },
    { key: '_DIVIDER', divider: true },
    { key: 'Projects', label: 'Projects' },
    { key: 'Papers', label: 'Papers' },
    { key: 'GitHub', label: 'GitHub' }
]

const projectActive = computed(() =>
    currentTab.value === 'Projects' && selectedProject.value !== null
)

const navbarTabs = computed(() =>
    ALL_TABS.map(t => {
        let hidden = false
        if (t.parent === 'Projects') hidden = !projectActive.value
        if (t.divider) hidden = !projectActive.value
        return { ...t, hidden }
    })
)

const activeNavbarTab = computed(() =>
    projectActive.value ? projectSection.value : currentTab.value
)


function handleTabChange(key) {
    if (['Projects', 'Papers', 'GitHub'].includes(key)) {
        currentTab.value = key
        if (key !== 'Projects') {
            selectedProject.value = null
            projectSection.value = 'Overview'
        }
    } else {
        projectSection.value = key
    }
}
function handleProjectChange(idx) {
    selectedProject.value = idx
    if (idx !== null) projectSection.value = 'Overview'
}
</script>

<style scoped>
.app-container {
    height: 100vh;
    background: #1a1a1a;
    color: #fff;
    overflow: hidden
}

.content {
    height: 100%;
    position: relative
}

.home-content,
.papers-content,
.github-content {
    padding: 6rem 2rem 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.home-content h1,
.papers-content h1,
.github-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem
}

.home-content p,
.papers-content p,
.github-content p {
    font-size: 1.2rem;
    color: #ccc
}
</style>
