<template>
  <label class="base-input-label" ref="labelEl">
    <span v-if="label" class="base-input-text" ref="labelTextEl">{{ label }}</span>

    <div class="field-wrap" ref="fieldWrap">
      <input ref="inputEl" :type="type" :inputmode="inputMode" :value="internalValue" @input="onInput"
        @blur="touched = true" :placeholder="placeholder" :min="min" :max="max" :step="step" :maxlength="maxlength"
        class="base-input-field" :class="{ 'base-input-field-base-underline': baseUnderline, 'has-error': showTooltip }"
        v-bind="$attrs" :aria-invalid="showTooltip ? 'true' : 'false'"
        :aria-describedby="showTooltip ? tooltipId : undefined" autocomplete="off" autocapitalize="off"
        autocorrect="off" spellcheck="false" />

      <span v-if="dynamicUnderline" class="base-input-underline" :style="{ backgroundColor: accentColor }"></span>
    </div>
    <div style="width: 0; height: 0; position: relative; margin-top: 2px;">
      <div v-if="showTooltip && showTooltips" ref="tooltipEl" :id="tooltipId" class="input-tooltip"
        :style="{ '--accent': accentColor, '--frame': frameColor }" role="tooltip">
        {{ messageToShow }}
      </div>
    </div>
  </label>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { computePosition, autoUpdate, offset, flip, shift, size } from '@floating-ui/dom'
import { getSecondaryColor, getTertiaryColor } from '../../composables/useGetColours.js'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  modelModifiers: { type: Object, default: () => ({}) },
  label: { type: String, default: '' },
  type: { type: String, default: 'number' },
  placeholder: { type: String, default: '' },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  step: { type: [String, Number], default: 'any' },
  maxlength: { type: [String, Number], default: undefined },
  colorKey: { type: String, default: 'blue' },
  color: { type: String, default: '' },
  baseUnderline: { type: Boolean, default: false },
  dynamicUnderline: { type: Boolean, default: false },
  eager: { type: Boolean, default: true },
  showTooltips: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue'])

const labelEl = ref(null)
const labelTextEl = ref(null)
const fieldWrap = ref(null)
const inputEl = ref(null)
const tooltipEl = ref(null)

const internalValue = ref(String(props.modelValue ?? ''))
const touched = ref(false)

const accentColor = computed(() => props.color || getSecondaryColor(props.colorKey) || 'rgb(140, 172, 204)')
const frameColor = computed(() => getTertiaryColor?.(props.colorKey) || 'rgba(255, 255, 255, 0.08)')

const tooltipId = `tip-${Math.random().toString(36).slice(2, 8)}`
const inputMode = computed(() => {
  const s = String(props.step || '')
  return s.includes('.') ? 'decimal' : 'numeric'
})

const EPS = 1e-9
function isEmpty(val) { return val === '' || val == null }
function isNumeric(val) { return !isNaN(Number(val)) && isFinite(Number(val)) }

function stepValid(num) {
  if (props.type === 'text') return true
  if (props.step == null || props.step === '' || props.step === 'any') return true
  const step = Number(props.step)
  if (!isFinite(step) || step <= 0) return true
  const base = (props.min != null && isNumeric(props.min)) ? Number(props.min) : 0
  const rem = ((num - base) % step + step) % step
  return rem < EPS || Math.abs(rem - step) < EPS
}

function checkRange(val) {
  if (props.type === 'text') return { valid: true, message: '' }
  if (isEmpty(val)) return { valid: false, message: "This field can't be empty." }
  if (!isNumeric(val)) return { valid: false, message: 'Enter a number.' }
  const num = Number(val)

  if (props.min != null && isNumeric(props.min) && num < Number(props.min))
    return { valid: false, message: `Must be ≥ ${props.min}` }

  if (props.max != null && isNumeric(props.max) && num > Number(props.max))
    return { valid: false, message: `Must be ≤ ${props.max}` }

  if (!stepValid(num)) {
    const stepMsg = props.step === 'any' ? '' : `step must equal ${props.step}`
    return { valid: false, message: `Invalid step, ${stepMsg}` }
  }

  return { valid: true, message: '' }
}

const invalid = computed(() => !checkRange(internalValue.value).valid)
const messageToShow = computed(() => checkRange(internalValue.value).message)
const showTooltip = computed(() => invalid.value && (props.eager || touched.value))

function onInput(e) {
  internalValue.value = e.target.value
  const { valid } = checkRange(internalValue.value)
  if (valid) {
    let out = internalValue.value
    const useNumber = props.modelModifiers?.number || props.type === 'number'
    if (useNumber) out = Number(out)
    emit('update:modelValue', out)
  }
}

watch(() => props.modelValue, (nv) => {
  const next = nv == null ? '' : String(nv)
  if (next !== internalValue.value) internalValue.value = next
})

let cleanupAutoUpdate = null
async function updatePosition() {
  if (!inputEl.value || !tooltipEl.value) return
  await computePosition(inputEl.value, tooltipEl.value, {
    placement: 'top-start',
    middleware: [
      offset(6),
      flip({ fallbackPlacements: ['top-start'], padding: 16 }),
      shift({ padding: 16 }),
      size({
        apply: ({ rects, elements }) => {
          elements.floating.style.minWidth = rects.reference.width + 'px'
          elements.floating.style.maxWidth = Math.max(220, rects.reference.width) + 'px'
        }
      })
    ]
  }).then(({ x, y }) => {
    Object.assign(tooltipEl.value.style, {
      position: 'absolute',
      left: `${Math.round(x)}px`,
      top: `${Math.round(y)}px`,
      zIndex: 1000
    })
  })
}

watch(showTooltip, (open) => {
  if (cleanupAutoUpdate) { cleanupAutoUpdate(); cleanupAutoUpdate = null }
  if (open && inputEl.value && tooltipEl.value) {
    cleanupAutoUpdate = autoUpdate(inputEl.value, tooltipEl.value, updatePosition, { animationFrame: true })
    updatePosition()
  }
})

let ro
function setFieldWidth() {
  if (!labelTextEl.value || !fieldWrap.value) return
  const w = Math.ceil(labelTextEl.value.getBoundingClientRect().width)
  const min = 96 // 6rem in px assuming base 16px
  fieldWrap.value.style.width = w ? `${Math.max(w, min)}px` : `${min}px`
}

onMounted(async () => {
  await nextTick()
  setFieldWidth()
  ro = new ResizeObserver(setFieldWidth)
  if (labelTextEl.value) ro.observe(labelTextEl.value)
  window.addEventListener('resize', setFieldWidth, { passive: true })

  if (showTooltip.value) {
    cleanupAutoUpdate = autoUpdate(inputEl.value, tooltipEl.value, updatePosition, { animationFrame: true })
    updatePosition()
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', setFieldWidth)
  if (cleanupAutoUpdate) cleanupAutoUpdate()
})
</script>

<style scoped>
.base-input-label {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 0 0 auto;
  font-weight: 600;
  font-size: 14px;
  color: #ccc;
  justify-content: center;
}

.base-input-text {
  margin-bottom: 4px;
  justify-self: center;
  align-self: center;
}

.field-wrap {
  position: relative;
  width: auto;
  min-width: 6rem;
  justify-content: center;
}

.base-input-field {
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  padding: 0.3rem 0;
  color: #fff;
  width: 100%;
  -moz-appearance: textfield;
  appearance: textfield;
  -webkit-appearance: textfield;
  position: relative;
  z-index: 1;
  transform: translate3d(0, 0, 0);

  text-align: center;
}

.base-input-field::-webkit-outer-spin-button,
.base-input-field::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.base-input-field-base-underline {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.base-input-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  margin-bottom: 1px;
  border-radius: 9999px;
  background-color: var(--accent, rgb(140, 172, 204));
  transition: width .3s ease;
}

.base-input-label:hover .base-input-underline,
.base-input-field:focus~.base-input-underline {
  width: 100%;
}

.input-tooltip {
  background: rgb(36, 36, 36);
  color: #fff;
  font-size: 13px;
  line-height: 1.35;
  padding: 8px 12px;
  border-radius: 8px;
  position: absolute;
  border: 1px solid var(--frame, rgba(255, 255, 255, 0.08));
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  text-align: center;
  transition: opacity .14s ease, transform .14s ease;
  z-index: 1000;
}

@media (hover: none) and (pointer: coarse) {
  .base-input-field {
    min-height: 44px;
    font-size: 16px;
  }

  .input-tooltip {
    font-size: 15px;
  }
}
</style>
