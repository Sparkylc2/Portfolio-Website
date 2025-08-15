<template>
  <label class="base-checkbox-label user-select-none">
    <span v-if="label" class="base-checkbox-text">{{ label }}</span>
    <div class="base-checkbox-container">
      <div class="base-checkbox" :class="{ 'base-checkbox--selected': modelValue }" :style="selectedStyle"
        @click="toggle">
        <svg v-if="modelValue" class="base-checkbox__check" width="12" height="12" viewBox="0 0 16 16">
          <path d="M2 8L6 12L14 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </div>
    </div>
  </label>
</template>

<script setup>
import { computed } from 'vue'
import { getSecondaryColor } from '../../composables/useGetColours.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  colorKey: {
    type: String,
    default: 'red'
  }
})

const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}

const selectedStyle = computed(() => {
  if (props.modelValue) {
    const color = getSecondaryColor(props.colorKey) || 'rgb(204, 140, 140)'
    return {
      backgroundColor: color,
      borderColor: color
    }
  }
  return {}
})
</script>

<style scoped>
.base-checkbox-label {
  position: relative;
  display: flex;
  flex-direction: column;
  font-weight: 600;
  font-size: 14px;
  color: #ccc;
  white-space: nowrap;
  cursor: pointer;
}

.base-checkbox-text {
  margin-bottom: 4px;
}

.base-checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid transparent;
}

.base-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.9rem;
  height: 0.9rem;
  background-color: rgb(50, 50, 50);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  transition: background-color 0.3s, border-color 0.3s;

  cursor: pointer;
}

.base-checkbox__check {
  position: absolute;
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  pointer-events: none;
  animation: checkIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes checkIn {
  from {
    transform: rotate(45deg) scale(0);
    opacity: 0;
  }

  50% {
    transform: rotate(45deg) scale(1.2);
  }

  to {
    transform: rotate(45deg) scale(1);
    opacity: 1;
  }
}

@media (hover: none) and (pointer: coarse) {
  .base-checkbox {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
