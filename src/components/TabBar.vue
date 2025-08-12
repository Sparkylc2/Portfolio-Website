<template>
  <div class="tab-bar">
    <ul class="tab-links" ref="navRef">
      <li v-for="tab in tabs" :key="tab.id" class="tab-item">
        <a href="#" :data-key="tab.id" :class="{ active: activeTab === tab.id }"
          @click.prevent="setActive(tab.id, $event)">
          {{ tab.label }}
        </a>
      </li>
      <div ref="barRef" class="bar"></div>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  tabs: { type: Array, required: true },
  activeTab: { type: String, required: true },
  indicatorColor: { type: String, default: 'rgb(140, 172, 204)' }
})
const emit = defineEmits(['update:activeTab'])

const navRef = ref(null)
const barRef = ref(null)

function moveBarTo(el) {
  if (!el || !navRef.value || !barRef.value) return
  const navBox = navRef.value.getBoundingClientRect()
  const box = el.getBoundingClientRect()
  barRef.value.style.left = `${box.left - navBox.left}px`
  barRef.value.style.top = `${box.bottom - navBox.top}px`
  barRef.value.style.width = `${box.width}px`
  barRef.value.style.backgroundColor = props.indicatorColor
}

function moveBar() {
  const active = navRef.value?.querySelector('a.active')
  moveBarTo(active)
}

function setActive(key, evt) {
  if (key === props.activeTab) return

  moveBarTo(evt.currentTarget)
  requestAnimationFrame(() => emit('update:activeTab', key))
}

onMounted(() => {
  moveBar()
  window.addEventListener('resize', moveBar)
})

watch(
  () => [props.activeTab, props.tabs.map(t => t.label).join(',')],
  async () => { await nextTick(); moveBar() },
  { deep: true }
)
</script>

<style scoped>
.tab-bar {
  width: 100%;
  margin-bottom: 1rem;
}

.tab-links {
  display: flex;
  gap: 1.25rem;
  list-style: none;
  position: relative;
  padding: 0;
  margin: 0;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
}

.tab-item {
  display: flex;
  align-items: center;
}

.tab-links a {
  color: #ccc;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 0;
  transition: color .25s;
  font-size: 1rem;
}

.tab-links a.active {
  color: #fff;
}

.tab-links a:hover {
  color: #fff;
}

.bar {
  position: absolute;
  background-color: var(--barColor, rgb(140, 172, 204));
  bottom: 0;
  height: 2px;
  border-radius: 9999px;
  transition: left .25s ease, width .25s ease, background-color .25s;
}
</style>
