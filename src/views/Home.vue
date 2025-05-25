<script setup>
import { computed, ref } from 'vue'
import Navbar from '../components/Navbar.vue'
import Projects from './Projects.vue'

const currentTab = ref('Projects')
const projectSection = ref('Overview')
const selectedProject = ref(null)


const getProjectColor = (projectIndex) => {
  const colors = ['red', 'blue', 'green', 'yellow']
  return colors[projectIndex % 4]
}


const currentProjectColor = computed(() => {
  if (selectedProject.value !== null) {
    const colorName = getProjectColor(selectedProject.value)
    const colorMap = {
      red: 'rgb(204, 140, 140)',
      blue: 'rgb(140, 172, 204)',
      green: 'rgb(140, 204, 140)',
      yellow: 'rgb(204, 172, 140)'
    }
    return colorMap[colorName]
  }
  return '#e63946'
})


const navbarTabs = computed(() => {
  const baseTabs = [
    { key: 'Projects', label: 'Projects', isDivider: false },
    { key: 'Papers', label: 'Papers', isDivider: false },
    { key: 'GitHub', label: 'GitHub', isDivider: false }
  ]


  if (currentTab.value === 'Projects' && selectedProject.value !== null) {
    return [
      { key: 'Overview', label: 'Overview', isDivider: false },
      { key: 'Details', label: 'Details', isDivider: false },
      { key: 'Projects', label: 'Projects', isDivider: true },
      { key: 'Papers', label: 'Papers', isDivider: false },
      { key: 'GitHub', label: 'GitHub', isDivider: false }
    ]
  }

  // You can add similar logic for Papers subsections
  // if (currentTab.value === 'Papers') {
  //   return [
  //     { key: 'Published', label: 'Published', isDivider: false },
  //     { key: 'InProgress', label: 'In Progress', isDivider: false },
  //     { key: 'Projects', label: 'Projects', isDivider: true },
  //     { key: 'Papers', label: 'Papers', isDivider: false },
  //     { key: 'GitHub', label: 'GitHub', isDivider: false }
  //   ]
  // }

  return baseTabs
})


const activeNavbarTab = computed(() => {

  if (currentTab.value === 'Projects' && selectedProject.value !== null) {
    return projectSection.value
  }

  return currentTab.value
})

const handleTabChange = (tabKey) => {
  if (['Home', 'Projects', 'Papers', 'GitHub'].includes(tabKey)) {
    currentTab.value = tabKey
    

    if (tabKey !== 'Projects') {
      selectedProject.value = null
      projectSection.value = 'Overview'
    }
  } else {
    projectSection.value = tabKey
  }
}


const handleProjectChange = (projectIndex) => {
  selectedProject.value = projectIndex
  if (projectIndex !== null) {
    projectSection.value = 'Overview'
  }
}
</script>

<template>
  <div class="app-container">
    <Navbar
      :tabs="navbarTabs"
      :activeTab="activeNavbarTab"
      :indicatorColor="currentProjectColor"
      @update:activeTab="handleTabChange"
    />

    <div class="content">

      <div v-if="currentTab === 'Home'" class="home-content">
        <h1>Welcome Home</h1>
        <p>This is the home page content</p>
      </div>

      <Projects
        v-if="currentTab === 'Projects'"
        :activeSection="projectSection"
        :selectedProject="selectedProject"
        @update:selectedProject="handleProjectChange"
      />

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

<style scoped>
.app-container {
  height: 100vh;
  background: #1a1a1a;
  color: white;
  overflow: hidden;
}

.content {
  height: 100%;
  position: relative;
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
  margin-bottom: 1rem;
}

.home-content p,
.papers-content p,
.github-content p {
  font-size: 1.2rem;
  color: #ccc;
}
</style>
