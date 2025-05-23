<script setup>
console.log('Navbar component mounted')

import { ref, onMounted, nextTick } from 'vue'
import { animate } from 'animejs'

const tabs = ['Projects', 'Papers', 'GitHub', 'Home']
const activeTab = ref('Home')
const tabRefs = ref([])

const registerTabRef = (el, i) => {
  if (el) tabRefs.value[i] = el
}
const indicatorRef = ref(null)
const indicatorReady = ref(false)

const animateIndicator = (targetEl) => {
  if (!targetEl || !indicatorRef.value) return
  const { offsetLeft, offsetWidth } = targetEl

  console.log('Animating to', offsetLeft, offsetWidth)

  try {
    animate({
      targets: indicatorRef.value,
      left: offsetLeft + 'px',
      width: offsetWidth + 'px',
      easing: 'easeOutExpo',
      duration: 500,
      complete: () => {
        indicatorReady.value = true
        console.log('Indicator animated')
      }
    })
  } catch (err) {
    console.error('Animation failed:', err)
  }
}

const setActive = (tab, i) => {
  console.log('Tab clicked:', tab)
  activeTab.value = tab
  nextTick(() => {
    const el = tabRefs.value[i]
    animateIndicator(el)
  })
}

onMounted(() => {
  nextTick(() => {
    console.log('tabRefs:', tabRefs.value)
    const index = tabs.findIndex(tab => tab === activeTab.value)
    const target = tabRefs.value[index]
    if (target) {
      animateIndicator(target)
    }
  })
})
</script>

<template>
  <nav class="navbar">
    <ul class="nav-links">
      <div class="indicator" ref="indicatorRef" :class="{ mounted: indicatorReady }"></div>
      <li v-for="(tab, i) in tabs" :key="tab" :ref="el => registerTabRef(el, i)">
        <a
          href="#"
          :class="{ active: activeTab === tab }"
          @click.prevent="setActive(tab, i)"
        >
          {{ tab }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.navbar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  position: relative;
  padding-bottom: 4px;
}

.nav-links a {
  color: #ccc;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
  padding: 4px 0;
  display: inline-block;
  position: relative;
}

.nav-links a.active {
  color: white;
}

.indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background-color: #e63946;
  border-radius: 1px;
  opacity: 1;
  left: 0;
  width: 0;
}
</style>
