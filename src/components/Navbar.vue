<script setup>
import { defineEmits, defineProps, nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
    // Expected format: [{ key: 'overview', label: 'Overview', isDivider: false }, ...]
  },
  activeTab: {
    type: String,
    required: true
  },
  indicatorColor: {
    type: String,
    default: '#e63946'
  }
})

const emit = defineEmits(['update:activeTab'])

const tabRefs = ref([])
const indicatorRef = ref(null)
const isTransitioning = ref(false)

const registerTabRef = (el, i) => {
  if (el) tabRefs.value[i] = el
}

const updateIndicator = () => {
  const activeIndex = props.tabs.findIndex(tab => tab.key === props.activeTab)
  
  const indicator = indicatorRef.value
  const activeTabEl = tabRefs.value[activeIndex]
  
  if (indicator && activeTabEl && activeIndex !== -1) {
    indicator.style.left = activeTabEl.offsetLeft + 'px'
    indicator.style.width = activeTabEl.offsetWidth + 'px'
    indicator.style.backgroundColor = props.indicatorColor
  }
}

const setActive = async (tabKey) => {
  if (tabKey === props.activeTab) return
  
  isTransitioning.value = true
  emit('update:activeTab', tabKey)

  await nextTick()
  
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

watch([
  () => props.tabs, 
  () => props.activeTab,
  () => props.indicatorColor
], () => {
  nextTick(() => {
    updateIndicator()
  })
})

onMounted(() => {
  nextTick(() => {
    updateIndicator()
  })
})
</script>

<template>
  <nav class="navbar">
    <ul class="nav-links">
      <TransitionGroup 
        name="nav-item"
        @before-enter="isTransitioning = true"
        @after-enter="isTransitioning = false"
        @before-leave="isTransitioning = true"
        @after-leave="isTransitioning = false">
        <li v-for="(tab, i) in tabs" 
            :key="tab.key" 
            :ref="el => registerTabRef(el, i)"
            :class="{ 
              'divider': tab.isDivider,
              'transitioning': isTransitioning
            }">
          <a href="#"
             :class="{ active: activeTab === tab.key }"
             @click.prevent="setActive(tab.key)">
            {{ tab.label }}
          </a>
        </li>
      </TransitionGroup>
      <div class="indicator" ref="indicatorRef"></div>
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
  perspective: 1000px;
  transform-style: preserve-3d;
  min-height: 2rem;
}

.nav-links a {
  color: #ccc;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
  padding: 4px 0;
  display: inline-block;
  position: relative;
  backface-visibility: hidden;
}

.nav-links a.active {
  color: white;
}

.divider {
  position: relative;
  margin-left: 1.5rem;
}

.divider::before {
  content: '';
  position: absolute;
  left: -1.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: v-bind(indicatorColor);
  transform-origin: top;
  height: 100%;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
  transform: scaleY(0);
  will-change: transform;
}

.divider:not(.transitioning)::before {
  transform: scaleY(1);
}

.nav-links li {
  position: relative;
  transform-style: preserve-3d;
}

.nav-item-move,
.nav-item-enter-active,
.nav-item-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top center;
  position: relative;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  pointer-events: none;
}

.nav-item-leave-active {
  position: absolute;
  width: 100%;
  transform-origin: top center;
  left: 0;
  top: 0;
}

.nav-item-enter-from,
.nav-item-leave-to {
  opacity: 0;
  transform: rotateX(-90deg);
}

.nav-item-enter-to,
.nav-item-leave-from {
  opacity: 1;
  transform: rotateX(0);
}

.indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
  border-radius: 9999px;
  transform-origin: center;
}
</style>
