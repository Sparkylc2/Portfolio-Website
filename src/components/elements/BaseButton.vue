<template>
  <button :type="type" class="base-button" :class="[
    `base-button--${variant}`,
    { 'base-button--full': fullWidth }
  ]" :style="{
    '--button-border': borderColor,
    '--button-bg': bgColor
  }" @click="$emit('click', $event)">
    <slot></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import getColour, { getSecondaryColor } from '../../composables/useGetColours.js'

const props = defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'outline' }, // 'outline' | 'solid' | 'ghost'
  colorKey: { type: String, default: 'blue' },
  color: { type: String, default: '' },
  fullWidth: { type: Boolean, default: false },
})

defineEmits(['click'])

const resolved = computed(() => props.color || getSecondaryColor(props.colorKey) || 'rgb(140, 172, 204)')

const borderColor = computed(() => resolved.value)
const bgColor = computed(() => resolved.value)
</script>

<style scoped>
.base-button {
  appearance: none;
  -webkit-appearance: none;
  outline: none;

  padding: 0.4rem 0.8rem;
  color: #fff;
  border-radius: 0.4rem;
  text-decoration: none;
  white-space: nowrap;
  border: none;
  font-weight: 600;
  cursor: pointer;
  min-width: fit-content;

  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;


  background-color: transparent;

  --button-border: rgb(140, 172, 204);
  --button-bg: rgb(140, 172, 204);
}

.base-button--outline {
  border: 0.15rem solid var(--button-border);
  background-color: transparent;
}

.base-button--solid {
  border: 0.15rem solid transparent;
  background-color: var(--button-bg);
}

.base-button--ghost {
  border: 0.15rem solid transparent;
  background-color: transparent;
}

.base-button--full {
  width: 100%;
}

.base-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, .15);
}

.base-button:focus,
.base-button:active {
  color: #fff;
}

.base-button--outline:hover {
  border-color: var(--button-border);
}

.base-button--outline:active {
  filter: brightness(1.5);
}

.base-button--outline:focus,
.base-button--outline:active {
  background-color: transparent;
  border-color: var(--button-border);
}

.base-button--solid:focus,
.base-button--solid:active {
  background-color: var(--button-bg);
}

.base-button--solid:active {
  box-shadow: 0 2px 10px rgba(0, 0, 0, .2) inset;
}

.base-button--ghost:hover {
  border-color: var(--button-border);
}

.base-button--ghost:focus,
.base-button--ghost:active {
  background-color: transparent;
  border-color: var(--button-border);
}

.base-button:disabled {
  opacity: 0.6;
  cursor: default;
  transform: none;
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .base-button {
    transition: none;
  }

  .base-button:hover {
    transform: none;
    box-shadow: none;
  }
}
</style>
