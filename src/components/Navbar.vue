<template>
    <nav class="navbar">
        <ul class="links" ref="navRef" :style="{ '--barColor': indicatorColor }">
            <li v-for="t in tabs" :key="t.key" :class="[
                {
                    divider: t.divider,
                    collapsed: t.hidden && t.divider,
                    hidden: t.hidden && !t.divider
                }
            ]">

                <template v-if="!t.divider">
                    <a href="#" :data-key="t.key" :class="{ active: activeTab === t.key }"
                        @click.prevent="setActive(t.key, $event)">
                        {{ t.label }}
                    </a>
                </template>
            </li>


            <div ref="barRef" class="bar"></div>
        </ul>
    </nav>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'


const props = defineProps({
    tabs: { type: Array, required: true },
    activeTab: { type: String, required: true },
    indicatorColor: { type: String, default: '#e63946' }
})
const emit = defineEmits(['update:activeTab'])


const navRef = ref(null)
const barRef = ref(null)


function moveBarTo(el) {
    if (!el || !navRef.value || !barRef.value) return
    const navBox = navRef.value.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    barRef.value.style.left = `${box.left - navBox.left}px`
    barRef.value.style.width = `${box.width}px`
    barRef.value.style.backgroundColor = props.indicatorColor
}
function moveBar() {
    const active = navRef.value?.querySelector('a.active')
    moveBarTo(active)
}


function clickWouldHitParent(key) {
    const activeItem = props.tabs.find(t => t.key === props.activeTab)
    return (
        activeItem &&
        activeItem.parent &&
        key === activeItem.parent
    )
}

function setActive(key, evt) {
    if (clickWouldHitParent(key)) return

    if (key === props.activeTab) return

    moveBarTo(evt.currentTarget)
    requestAnimationFrame(() => emit('update:activeTab', key))
}


onMounted(() => {
    moveBar()
    window.addEventListener('resize', moveBar)
})
watch(
    () => [props.activeTab, props.tabs.map(t => t.hidden).join(',')],
    async () => { await nextTick(); moveBar() },
    { deep: true }
)
</script>

<style scoped>
.navbar {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 999
}


.links {
    display: flex;
    gap: 1.25rem;
    list-style: none;
    position: relative;
    padding-bottom: 4px
}

.links a {
    color: #ccc;
    text-decoration: none;
    font-weight: 500;
    padding: 4px 0;
    transition: color .25s
}

.links a.active {
    color: #fff
}

.bar {
    position: absolute;
    bottom: 0;
    height: 2px;
    border-radius: 9999px;
    transition: left .25s ease, width .25s ease, background-color .25s
}


.hidden {
    display: none
}


.divider {
    position: relative;
    margin-left: 1rem;
    margin-right: -1rem;
    width: 0
}

.divider::before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: var(--barColor);
    transform-origin: top;
    transform: scaleY(1);
    transition: transform .35s cubic-bezier(.4, 0, .2, 1),
        background-color .25s
}

.divider.collapsed::before {
    transform: scaleY(0)
}
</style>
