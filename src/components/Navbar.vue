<template>
    <nav class="navbar" :class="{ 'mobile-menu-open': mobileMenuOpen }">
        <button class="mobile-menu-toggle" @click="toggleMobileMenu" v-if="isMobile">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        </button>

        <ul class="links" ref="navRef" :style="{ '--barColor': indicatorColor }"
            :class="{ 'mobile-open': mobileMenuOpen }">
            <li v-for="t in visibleTabs" :key="t.key" :class="[
                {
                    divider: t.divider,
                    collapsed: t.hidden && t.divider,
                    hidden: t.hidden && !t.divider
                }
            ]">
                <template v-if="!t.divider">
                    <a href="#" :data-key="t.key" :class="{ active: activeTab === t.key }"
                        @click.prevent="handleClick(t.key, $event)">
                        {{ t.label }}
                    </a>
                </template>
            </li>
            <div ref="barRef" class="bar"></div>
        </ul>
    </nav>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
    tabs: { type: Array, required: true },
    activeTab: { type: String, required: true },
    indicatorColor: { type: String, default: '#e63946' }
})
const emit = defineEmits(['update:activeTab'])

const navRef = ref(null)
const barRef = ref(null)
const mobileMenuOpen = ref(false)
const isMobile = ref(false)

const visibleTabs = computed(() => {
    if (!isMobile.value) return props.tabs

    return props.tabs.filter(t => {
        if (t.parent === 'Projects' && props.activeTab !== 'Overview' && props.activeTab !== 'Details') {
            return false
        }
        if (t.parent === 'Papers' && props.activeTab !== 'Paper' && props.activeTab !== 'Abstract') {
            return false
        }
        return !t.hidden || t.divider
    })
})

function checkMobile() {
    isMobile.value = window.innerWidth <= 768
    if (!isMobile.value) {
        mobileMenuOpen.value = false
    }
}

function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value
}

function moveBarTo(el) {
    if (!el || !navRef.value || !barRef.value) return

    if (isMobile.value && !mobileMenuOpen.value) return

    const navBox = navRef.value.getBoundingClientRect()
    const box = el.getBoundingClientRect()

    if (isMobile.value) {
        barRef.value.style.top = `${box.top - navBox.top}px`
        barRef.value.style.height = `${box.height}px`
        barRef.value.style.left = '0'
        barRef.value.style.width = '3px'
    } else {
        barRef.value.style.left = `${box.left - navBox.left}px`
        barRef.value.style.width = `${box.width}px`
        barRef.value.style.top = 'auto'
        barRef.value.style.height = '2px'
    }

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

function handleClick(key, evt) {
    setActive(key, evt)
    if (isMobile.value) {
        mobileMenuOpen.value = false
    }
}

function setActive(key, evt) {
    if (clickWouldHitParent(key)) return
    if (key === props.activeTab) return

    moveBarTo(evt.currentTarget)
    requestAnimationFrame(() => emit('update:activeTab', key))
}

onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    moveBar()
    window.addEventListener('resize', moveBar)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('resize', moveBar)
})

watch(
    () => [props.activeTab, props.tabs.map(t => t.hidden).join(','), isMobile.value, mobileMenuOpen.value],
    async () => {
        await nextTick()
        moveBar()
    },
    { deep: true }
)
</script>

<style scoped>
.navbar {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 999;
}

.mobile-menu-toggle {
    display: none;
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 48px;
    height: 48px;
    background: rgb(36, 36, 36);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-color: v-bind('props.indicatorColor');
    border-radius: 0.5rem;
    cursor: pointer;
    z-index: 1001;
    padding: 0;
    transition: all 0.3s ease;
}

.mobile-menu-toggle:hover {
    background: rgb(50, 50, 50);
}

.hamburger-line {
    display: block;
    width: 24px;
    height: 2px;
    background: #fff;
    margin: 5px auto;
    transition: all 0.3s ease;
    border-radius: 2px;
}

.mobile-menu-open .hamburger-line:nth-child(1) {
    transform: rotate(45deg) translate(5px, 6px);
}

.mobile-menu-open .hamburger-line:nth-child(2) {
    opacity: 0;
}

.mobile-menu-open .hamburger-line:nth-child(3) {
    transform: rotate(-45deg) translate(5px, -6px); 
}

.links {
    display: flex;
    gap: 1.25rem;
    list-style: none;
    position: relative;
    padding-bottom: 4px;
    background: transparent;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.links a {
    color: #ccc;
    text-decoration: none;
    font-weight: 500;
    padding: 4px 0;
    transition: color .25s;
}

.links a.active {
    color: #fff;
}

.links a:hover {
    color: #fff;
}

.bar {
    position: absolute;
    bottom: 0;
    height: 2px;
    border-radius: 9999px;
    transition: all .25s ease;
}

.hidden {
    display: none;
}

.divider {
    position: relative;
    margin-left: 1rem;
    margin-right: -1rem;
    width: 0;
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
        background-color .25s;
}

.divider.collapsed::before {
    transform: scaleY(0);
}


@media (max-width: 768px) {
    .navbar {
        top: 0;
        right: 0;
        left: 0;
        background: transparent;
    }

    .mobile-menu-toggle {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .links {
        position: fixed;
        top: 0;
        right: -100%;
        width: 80%;
        max-width: 300px;
        height: 100vh;
        background: rgb(28, 28, 28);
        flex-direction: column;
        padding: 5rem 2rem 2rem;
        gap: 0.5rem;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.5);
        overflow-y: auto;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .links.mobile-open {
        right: 0;
    }

    .links a {
        display: block;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
    }

    .links a:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .links a.active {
        background: rgba(255, 255, 255, 0.1);
    }

    .bar {
        left: 0;
        width: 3px !important;
        height: auto;
        top: 0;
        bottom: auto;
        border-radius: 0 9999px 9999px 0;
    }

    .divider {
        margin: 1rem 0;
        width: 100%;
        height: 0;
    }

    .divider::before {
        left: 20%;
        right: 20%;
        top: 0;
        width: 60%;
        height: 1px;
        background-color: rgba(255, 255, 255, 0.1);
    }
}


@media (min-width: 769px) and (max-width: 1024px) {
    .navbar {
        top: 0.5rem;
        right: 0.5rem;
    }

    .links {
        gap: 1rem;
        padding: 0.5rem;
        background: rgba(36, 36, 36, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 0.5rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .links a {
        padding: 8px 12px;
        font-size: 0.95rem;
    }
}


@media (min-width: 1920px) {
    .navbar {
        top: 1.5rem;
        right: 1.5rem;
    }

    .links {
        gap: 1.5rem;
        padding-bottom: 6px;
    }

    .links a {
        font-size: 1.1rem;
        padding: 6px 0;
    }

    .bar {
        height: 3px;
    }
}
</style>
