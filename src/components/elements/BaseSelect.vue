<template>
  <div class="base-select-root" :class="attrs.class" :style="attrs.style">
    <label class="base-select-label">
      <span v-if="label" class="base-select-text">{{ label }}</span>

      <div class="base-select-wrapper" :style="cssVars">
        <button ref="buttonEl" type="button" class="base-select-trigger"
          :class="{ 'base-select-field-base-underline': baseUnderline }" :aria-haspopup="'listbox'"
          :aria-expanded="open ? 'true' : 'false'" :aria-controls="open ? listboxId : undefined" @click="toggle"
          @keydown="onTriggerKeydown" v-bind="restAttrs">
          <span class="base-select-trigger__value">{{ selectedLabel }}</span>
          <span class="base-select-arrow">▼</span>
          <span v-if="dynamicUnderline" class="base-select-underline"></span>
        </button>

        <select class="sr-only-native" :value="modelValue" tabindex="-1" aria-hidden="true"
          @change="$emit('update:modelValue', $event.target.value)">
          <option v-for="opt in normalizedOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </label>

    <teleport to="body">
      <transition name="select-pop" @after-enter="onAfterEnter" @after-leave="onAfterLeave">
        <div v-if="open" ref="listboxEl" :id="listboxId" role="listbox" class="base-select-dropdown-portal"
          :style="floatingStyle" :aria-activedescendant="activeId" @keydown="onListboxKeydown" @mousedown.prevent>
          <div v-for="(opt, i) in normalizedOptions" :key="opt.value" :id="optionId(i)" role="option"
            class="base-select-option"
            :class="{ 'is-selected': opt.value === modelValue, 'is-active': i === activeIndex }"
            :aria-selected="opt.value === modelValue ? 'true' : 'false'" @mouseenter="activeIndex = i"
            @click="select(i)">
            {{ opt.label }}
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick, useAttrs } from 'vue'
import { getSecondaryColor, getTertiaryColor } from '../../composables/useGetColours.js'
import {
  computePosition,
  autoUpdate,
  offset,
  flip,
  shift,
  size
} from '@floating-ui/dom'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: {
    type: Array,
    required: true,
    validator: (opts) =>
      opts.every((o) => (typeof o === 'object' && 'value' in o && 'label' in o) || typeof o === 'string')
  },
  colorKey: { type: String, default: 'blue' },
  color: { type: String, default: '' },
  baseUnderline: { type: Boolean, default: false },
  dynamicUnderline: { type: Boolean, default: false },
  zIndex: { type: Number, default: 2000 },
  maxHeight: { type: Number, default: 300 }
})
const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const restAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})

const accentColor = computed(() => props.color || getSecondaryColor(props.colorKey) || 'rgb(140, 172, 204)')
const borderColor = computed(() => getTertiaryColor?.(props.colorKey) || 'rgba(255, 255, 255, 0.08)')
const cssVars = computed(() => ({
  '--select-accent': accentColor.value,
  '--select-border': borderColor.value
}))

const normalizedOptions = computed(() =>
  props.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
)
const selectedLabel = computed(() => {
  const f = normalizedOptions.value.find((o) => String(o.value) === String(props.modelValue))
  return f ? f.label : ''
})

const open = ref(false)
const activeIndex = ref(-1)
const buttonEl = ref(null)
const listboxEl = ref(null)
const listboxId = `blsx-${Math.random().toString(36).slice(2, 9)}`
const optionId = (i) => `${listboxId}-opt-${i}`
const activeId = computed(() => (activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined))

let cleanupAutoUpdate = null
const floatingStyle = ref({
  position: 'fixed',
  top: '0px',
  left: '0px',
  zIndex: String(props.zIndex),
  width: 'auto',
  maxHeight: `${props.maxHeight}px`,
  transformOrigin: 'top left',
  '--select-accent': accentColor.value,
  '--select-border': borderColor.value
})

async function updatePosition() {
  const referenceEl = buttonEl.value
  const floatingEl = listboxEl.value
  if (!referenceEl || !floatingEl) return

  await computePosition(referenceEl, floatingEl, {
    strategy: 'fixed',
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ rects, availableHeight, elements }) {
          elements.floating.style.minWidth = `${rects.reference.width}px`
          elements.floating.style.width = 'max-content'
          const cap = Math.min(props.maxHeight, Math.round(window.innerHeight * 0.5))
          elements.floating.style.maxHeight = `${Math.min(cap, availableHeight)}px`
        }
      })
    ]
  }).then(({ x, y, middlewareData }) => {
    const flipped = middlewareData.flip?.overflows?.some(Boolean) || false
    floatingStyle.value = {
      position: 'fixed',
      left: `${Math.round(x)}px`,
      top: `${Math.round(y)}px`,
      zIndex: String(props.zIndex),
      maxHeight: listboxEl.value?.style.maxHeight || `${props.maxHeight}px`,
      transformOrigin: flipped ? 'bottom left' : 'top left',
      '--select-accent': accentColor.value,
      '--select-border': borderColor.value
    }
  })
}

function mountAutoUpdate() {
  const referenceEl = buttonEl.value
  const floatingEl = listboxEl.value
  if (!referenceEl || !floatingEl) return
  cleanupAutoUpdate = autoUpdate(referenceEl, floatingEl, updatePosition, {
  })
}
function unmountAutoUpdate() {
  cleanupAutoUpdate?.()
  cleanupAutoUpdate = null
}

function openList() {
  if (open.value) return
  open.value = true
  const idx = normalizedOptions.value.findIndex((o) => String(o.value) === String(props.modelValue))
  activeIndex.value = idx >= 0 ? idx : 0
  nextTick(() => {
    updatePosition()
    mountAutoUpdate()
    listboxEl.value?.focus({ preventScroll: true })
    document.addEventListener('mousedown', onDocClick, { capture: true })
    document.addEventListener('touchstart ', onDocClick, { capture: true })
  })
}
function closeList({ focusTrigger = true } = {}) {
  if (!open.value) return
  open.value = false
  activeIndex.value = -1
  unmountAutoUpdate()
  document.removeEventListener('mousedown', onDocClick, { capture: true })
  document.removeEventListener('touchstart', onDocClick, { capture: true })
  if (focusTrigger) requestAnimationFrame(() => buttonEl.value?.focus({ preventScroll: true }))
}
function toggle() {
  open.value ? closeList() : openList()
}

function select(i) {
  const opt = normalizedOptions.value[i]
  if (!opt) return
  emit('update:modelValue', opt.value)
  closeList()
}

function onDocClick(e) {
  if (!open.value) return
  const inTrigger = buttonEl.value?.contains(e.target)
  const inDropdown = listboxEl.value?.contains(e.target)
  if (!inTrigger && !inDropdown) closeList({ focusTrigger: false })
}

function onTriggerKeydown(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    openList()
  }
}
function onListboxKeydown(e) {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    return closeList()
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    return select(activeIndex.value)
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, normalizedOptions.value.length - 1)
    scrollActiveIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollActiveIntoView()
  } else if (e.key === 'Home') {
    e.preventDefault()
    activeIndex.value = 0
    scrollActiveIntoView()
  } else if (e.key === 'End') {
    e.preventDefault()
    activeIndex.value = normalizedOptions.value.length - 1
    scrollActiveIntoView()
  }
}

function scrollActiveIntoView() {
  const el = document.getElementById(optionId(activeIndex.value))
  const box = listboxEl.value
  if (!el || !box) return
  const eb = el.getBoundingClientRect()
  const bb = box.getBoundingClientRect()
  if (eb.top < bb.top) box.scrollTop -= bb.top - eb.top
  else if (eb.bottom > bb.bottom) box.scrollTop += eb.bottom - bb.bottom
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick, { capture: true })
  document.addEventListener('touchstart', onDocClick, { capture: true })
})
onBeforeUnmount(() => {
  unmountAutoUpdate()
  document.removeEventListener('mousedown', onDocClick, { capture: true })
})

watch(() => props.modelValue, (nv) => {
  const idx = normalizedOptions.value.findIndex((o) => String(o.value) === String(nv))
  if (idx >= 0) activeIndex.value = idx
})

function onAfterEnter() { }
function onAfterLeave() { }
</script>

<style scoped>
.base-select-root {
  display: inline-block;
}

.base-select-label {
  position: relative;
  display: flex;
  flex-direction: column;
  font-weight: 600;
  font-size: 14px;
  color: #ccc;
  white-space: nowrap;
  cursor: pointer;
}

.base-select-text {
  margin-bottom: 4px;
}

.base-select-dropdown,
.base-select-options {
  position: absolute;
  z-index: 9999 !important;
  /* Very high z-index to ensure it's above everything */
  pointer-events: auto !important;
}

.base-select-wrapper {
  position: relative;
  display: inline-block;
  --select-accent: rgb(140, 172, 204);
  --select-border: rgba(255, 255, 255, 0.08);
}

.base-select-trigger {
  all: unset;
  font-size: 14px;
  padding: 0.3rem 1.5rem 0.3rem 1.5rem;

  color: #fff;
  min-width: 6rem;
  width: auto;

  cursor: pointer;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid transparent;
}

.base-select-field-base-underline {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.base-select-trigger__value {
  overflow: hidden;
  text-overflow: ellipsis;
}

.base-select-arrow {
  position: absolute;
  right: 0;
  bottom: 8px;
  font-size: 10px;
  color: #ccc;
  pointer-events: none;
}

.base-select-underline {
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 2px;
  width: 0;
  border-radius: 9999px;
  background-color: var(--select-accent);
  transition: width .25s cubic-bezier(.4, 0, .2, 1);
}

.base-select-label:hover .base-select-underline,
.base-select-trigger:focus~.base-select-underline {
  width: 100%;
}

.sr-only-native {
  position: absolute !important;
  inset: 0 auto auto 0;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  border: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>

<style>
.base-select-dropdown-portal {
  position: fixed;
  background: rgb(36, 36, 36);
  color: #fff;
  border-radius: 8px;
  border: 1px solid var(--select-border, rgba(255, 255, 255, 0.08));
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  overflow: auto;
  padding: 6px;
  z-index: var(--zidx, 2000);
}

.base-select-option {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  line-height: 1.2;
  user-select: none;
}

.base-select-option.is-active:not(.is-selected) {
  background: color-mix(in oklab, var(--select-accent, rgb(140, 172, 204)) 18%, transparent);
}

.base-select-option.is-selected {
  background: color-mix(in oklab, var(--select-accent, rgb(140, 172, 204)) 32%, transparent);
  outline: 1px solid color-mix(in oklab, var(--select-accent, rgb(140, 172, 204)) 65%, transparent);
}

.base-select-option:hover {
  background: color-mix(in oklab, var(--select-accent, rgb(140, 172, 204)) 24%, transparent);
}

.select-pop-enter-from,
.select-pop-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.select-pop-enter-active,
.select-pop-leave-active {
  transition: opacity .14s ease, transform .14s ease;
}

@media (prefers-reduced-motion: reduce) {

  .select-pop-enter-active,
  .select-pop-leave-active {
    transition: none;
  }

  .select-pop-enter-from,
  .select-pop-leave-to {
    transform: none;
  }
}


.base-select-dropdown-portal {
  width: auto;
}

@media (hover: none) and (pointer: coarse) {
  .base-select-trigger {
    min-height: 44px;
    font-size: 16px;
  }

  .base-select-option {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-size: 16px;
    padding: 10px 12px;
  }

  .base-select-arrow {
    bottom: 10px;
  }
}
</style>
