<template>
    <div class="projects-container">
      <h1 class="page-title">Projects</h1>
      
      <div class="content-layout">
        <div class="projects-grid-wrapper">
            <div class="projects-grid" :class="{ 'has-active': expandedProject !== null }">
                <div v-for="(project, index) in projects" 
                    :key="index" 
                    class="project-card" 
                    :class="{ 
                        'active': expandedProject === index,
                        'inactive': expandedProject !== null && expandedProject !== index
                    }"
                    @click="toggleProject(index)">
                    <div class="project-content">
                    <h2>{{ project.title }}</h2>
                    <p>{{ project.description }}</p>
                        <div class="project-indicator"></div>
                    </div>
                </div>
            </div>
        </div>
  

        <Transition name="slide-fade">
          <div v-if="expandedProject !== null" class="project-details-section">
            <div class="project-details-content">
              <div class="project-sections">
                <Transition name="fade" mode="out-in">
                  <div v-if="activeSection === 'Overview'" key="overview" class="section overview-section">
                    <h2>{{ currentProject?.title }}</h2>
                    <p>{{ currentProject?.description }}</p>
                    <div class="project-meta">
                      <div class="tech-stack">
                        <h3>Technologies Used</h3>
                        <div class="tech-tags">
                          <span v-for="tech in currentProject?.technologies" 
                                :key="tech" 
                                class="tech-tag">{{ tech }}</span>
                        </div>
                      </div>
                      <div class="project-links">
                        <a v-if="currentProject?.github" 
                           :href="currentProject.github" 
                           target="_blank" 
                           class="project-link"
                           :style="{ backgroundColor: getProjectColor(currentProject.color) }">
                          GitHub
                        </a>
                        <a v-if="currentProject?.demo" 
                           :href="currentProject.demo" 
                           target="_blank" 
                           class="project-link"
                           :style="{ backgroundColor: getProjectColor(currentProject.color) }">
                          Live Demo
                        </a>
                      </div>
                    </div>
                  </div>
  
                  <div v-else-if="activeSection === 'Interactive'" key="interactive" class="section interactive-section">
                    <component 
                      :is="currentProject?.interactiveComponent" 
                      v-if="currentProject?.interactiveComponent"
                      class="interactive-demo"
                    />
                    <div v-else class="demo-placeholder">
                      <p>Interactive demo coming soon</p>
                    </div>
                  </div>
  
                  <div v-else-if="activeSection === 'Details'" key="details" class="section details-section">
                    <div class="project-details" v-html="currentProject?.detailedDescription"></div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, ref, watch } from 'vue'
  
  const props = defineProps({
    activeSection: String,
    selectedProject: Number
  })
  
  const emit = defineEmits(['update:selectedProject'])
  
  const expandedProject = ref(null)
  
  watch(() => props.selectedProject, (newVal) => {
    expandedProject.value = newVal
  }, { immediate: true })
  
  watch(expandedProject, (newVal) => {
    emit('update:selectedProject', newVal)
  })
  
  const projects = [
    {
      title: 'Physics Engine',
      description: 'A real-time physics engine with interactive demonstrations.',
      technologies: ['JavaScript', 'Canvas API', 'Matter.js'],
      github: 'https://github.com/yourusername/physics-engine',
      demo: 'https://demo-link.com',
      interactiveComponent: null,
      detailedDescription: `
        <h3>About the Project</h3>
        <p>Detailed description of the physics engine...</p>
        
        <h3>Features</h3>
        <ul>
          <li>Real-time physics simulation</li>
          <li>Interactive pendulum demonstration</li>
          <li>Collision detection</li>
        </ul>
      `,
      color: 'red'
    },
    {
      title: 'Wind Turbine Designer',
      description: 'Interactive tool for designing wind turbine blades.',
      technologies: ['Vue.js', 'Three.js', 'WebGL'],
      github: 'https://github.com/yourusername/turbine-designer',
      demo: 'https://demo-link.com',
      interactiveComponent: null, 
      detailedDescription: `
        <h3>About the Project</h3>
        <p>Description of the wind turbine designer...</p>
        
        <h3>Features</h3>
        <ul>
          <li>Real-time 3D visualization</li>
          <li>Customizable parameters</li>
          <li>Performance analysis</li>
        </ul>
      `,
      color: 'blue'
    },
    {
      title: 'Panel Airfoil Simulator',
      description: 'Advanced computational fluid dynamics simulator for airfoil analysis using panel methods.',
      technologies: ['Python', 'NumPy', 'Matplotlib', 'SciPy'],
      github: 'https://github.com/yourusername/panel-airfoil',
      demo: 'https://demo-link.com',
      interactiveComponent: null,
      detailedDescription: `
        <h3>About the Project</h3>
        <p>A sophisticated panel method implementation for analyzing airfoil performance in potential flow conditions.</p>
        
        <h3>Features</h3>
        <ul>
          <li>Real-time pressure distribution calculation</li>
          <li>Lift and drag coefficient analysis</li>
          <li>Interactive airfoil geometry modification</li>
          <li>Streamline visualization</li>
        </ul>
        
        <h3>Technical Details</h3>
        <ul>
          <li>Source and vortex panel method implementation</li>
          <li>Kutta condition enforcement</li>
          <li>Automated mesh generation</li>
          <li>Performance optimization for real-time analysis</li>
        </ul>
      `,
      color: 'green'
    },
    {
      title: 'Numerical Methods Library',
      description: 'Comprehensive implementation of advanced numerical methods for engineering applications.',
      technologies: ['Python', 'NumPy', 'SymPy', 'Jupyter'],
      github: 'https://github.com/yourusername/numerical-methods',
      demo: 'https://demo-link.com',
      interactiveComponent: null,
      detailedDescription: `
        <h3>About the Project</h3>
        <p>A robust collection of numerical methods implementations developed during advanced engineering coursework.</p>
        
        <h3>Features</h3>
        <ul>
          <li>Root finding algorithms (Newton-Raphson, Secant, Bisection)</li>
          <li>Linear system solvers (Gauss-Seidel, SOR, Conjugate Gradient)</li>
          <li>ODE solvers (Runge-Kutta, Adams-Bashforth)</li>
          <li>Optimization algorithms (Gradient Descent, Conjugate Gradient)</li>
        </ul>
        
        <h3>Applications</h3>
        <ul>
          <li>Heat transfer simulations</li>
          <li>Structural analysis</li>
          <li>Fluid dynamics calculations</li>
          <li>Optimization problems</li>
        </ul>
      `,
      color: 'yellow'
    }
  ]
  
  const currentProject = computed(() => 
    expandedProject.value !== null ? projects[expandedProject.value] : null
  )
  
  const openProject = (index) => {
    expandedProject.value = index
  }
  
  const closeProject = () => {
    expandedProject.value = null
  }
  
  const toggleProject = (index) => {
    if (expandedProject.value === index) {
      closeProject()
    } else {
      openProject(index)
    }
  }
  
  const getProjectColor = (color) => {
    const colors = {
      red: 'rgb(204, 140, 140)',
      blue: 'rgb(140, 172, 204)',
      green: 'rgb(140, 204, 140)',
      yellow: 'rgb(204, 172, 140)'
    }
    return colors[color] || '#e63946'
  }
  </script>
  
  <style scoped>
  .content-layout {
    display: flex;
    gap: 2rem;
    padding: 6rem 2rem 2rem;
    min-height: calc(100vh - 8rem);
  }

  .projects-grid-wrapper {
    position: relative;
    width: 400px;
    min-width: 400px;
    height: calc(100vh - 8rem);
    overflow-y: auto;
    overflow-x: visible;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .projects-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    overflow: visible;
    padding: 2rem 1rem;
    width: calc(100% + 4rem);
    margin-left: -2rem;
  }
  
  .projects-grid.has-active {
    width: 350px;
    min-width: 350px;
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
    padding: 6rem 2rem 2rem;
    min-height: calc(100vh - 8rem);
  }
  
  .projects-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 400px;
    min-width: 400px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding-right: 2rem;
    padding-bottom: 2rem;
    padding-top: 2rem;
    overflow-y: visible;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    height: calc(100vh - 8rem);
  }
  
  .projects-grid::-webkit-scrollbar {
    display: none;
  }
  
  .projects-grid.has-active {
    width: 350px;
    min-width: 350px;
  }
  
  .project-card {
    background-color: rgb(36, 36, 36);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    border-radius: 0.5rem;
    width: calc(100% - 5rem);
    margin: 0rem 2rem;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    justify-content: center;
    overflow: visible;
    transform-origin: center left;
  }
  
  .project-card:hover .project-indicator {
    width: 100%;
  }
  
  .project-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.6);
    background-color: #252525;
  }
  
  .project-card:nth-child(4n+1) {
    border-color: rgba(204, 140, 140, 0.3);
  }
  
  .project-card:nth-child(4n+2) {
    border-color: rgba(140, 172, 204, 0.3);
  }
  
  .project-card:nth-child(4n+3) {
    border-color: rgba(140, 204, 140, 0.3);
  }
  
  .project-card:nth-child(4n) {
    border-color: rgba(204, 172, 140, 0.3);
  }
  
  .project-card.inactive {
    opacity: 0.5;
    transform: scale(0.95);
  }
  
  .project-card.active {
    background-color: rgb(36, 36, 36);
    transform: translateX(-5px);
    border: 1px solid #e63946;
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
  
  .project-card:nth-child(4n+1) .project-indicator {
    background-color: rgb(204, 140, 140);
  }
  
  .project-card:nth-child(4n+2) .project-indicator {
    background-color: rgb(140, 172, 204);
  }
  
  .project-card:nth-child(4n+3) .project-indicator {
    background-color: rgb(140, 204, 140);
  }
  
  .project-card:nth-child(4n) .project-indicator {
    background-color: rgb(204, 172, 140);
  }
  
  .project-card:nth-child(4n+1) .project-links a {
    background-color: rgb(204, 140, 140);
  }
  
  .project-card:nth-child(4n+2) .project-links a {
    background-color: rgb(140, 172, 204);
  }
  
  .project-card:nth-child(4n+3) .project-links a {
    background-color: rgb(140, 204, 140);
  }
  
  .project-card:nth-child(4n) .project-links a {
    background-color: rgb(204, 172, 140);
  }
  
  .project-card:nth-child(4n+1) .tech-tag {
    background-color: rgba(204, 140, 140, 0.2);
    color: rgb(255, 191, 191);
  }
  
  .project-card:nth-child(4n+2) .tech-tag {
    background-color: rgba(140, 172, 204, 0.2);
    color: rgb(191, 223, 255);
  }
  
  .project-card:nth-child(4n+3) .tech-tag {
    background-color: rgba(140, 204, 140, 0.2);
    color: rgb(191, 255, 191);
  }
  
  .project-card:nth-child(4n) .tech-tag {
    background-color: rgba(204, 172, 140, 0.2);
    color: rgb(255, 223, 191);
  }
  
  .project-card:nth-child(4n+1) h2 {
    color: rgb(255, 191, 191); /* Red */
  }
  
  .project-card:nth-child(4n+2) h2 {
    color: rgb(191, 223, 255); /* Blue */
  }
  
  .project-card:nth-child(4n+3) h2 {
    color: rgb(191, 255, 191); /* Green */
  }
  
  .project-card:nth-child(4n) h2 {
    color: rgb(255, 223, 191); /* Yellow */
  }
  
  .project-card:nth-child(4n+1).active {
    border-color: rgb(204, 140, 140); /* Darker Red */
  }
  
  .project-card:nth-child(4n+2).active {
    border-color: rgb(140, 172, 204); /* Darker Blue */
  }
  
  .project-card:nth-child(4n+3).active {
    border-color: rgb(140, 204, 140); /* Darker Green */
  }
  
  .project-card:nth-child(4n).active {
    border-color: rgb(204, 172, 140); /* Darker Yellow */
  }
  
  .project-details-section {
    flex: 1;
    background: rgb(36, 36, 36);
    overflow-y: visible;
    scrollbar-width: none;
    /* padding-right: 1rem; */
    padding-bottom: 2rem;
    /* border: 1px solid v-bind('getProjectColor(currentProject?.color)'); */
    border-radius: 0.5rem;
    max-height: calc(100vh - 8rem);
    min-width: 400px;

  }
  
  .project-details-section::-webkit-scrollbar {
    display: none;
  }
  
  .project-details-content {
    padding: 1rem;
    padding-top: 2rem;
    min-height: 100%;
  }
  

  .section {
    min-height: 400px;
    padding: 1.5rem;
    background: rgb(36, 36, 36);
    border-radius: 0.5rem;
    border: 1px solid v-bind('getProjectColor(currentProject?.color)');
  }
  

  .project-meta {
    margin-top: 2rem;
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr auto;
  }
  
  .tech-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .tech-tag {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    transition: all 0.3s ease;
  }
  
  .project-links {
    display: flex;
    gap: 1rem;
  }
  
  .project-link {
    display: inline-block;
    padding: 0.5rem 1rem;
    color: white;
    border-radius: 0.5rem;
    text-decoration: none;
    transition: all 0.3s ease;
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
  
</style>
