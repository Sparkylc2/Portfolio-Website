// src/composables/useDeviceDetection.js

import { ref, onMounted, onUnmounted } from 'vue'

export function useDeviceDetection() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(true)
  const isTouchDevice = ref(false)

  function detectDevice() {
    const hasTouch = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    )

    const width = window.innerWidth


    if (!hasTouch) {
      isDesktop.value = true
      isMobile.value = false
      isTablet.value = false
      isTouchDevice.value = false
    } else {
      isTouchDevice.value = true

      if (width <= 768) {
        isMobile.value = true
        isTablet.value = false
        isDesktop.value = false
      } else if (width <= 1024) {
        isMobile.value = false
        isTablet.value = true
        isDesktop.value = false
      } else {
        isMobile.value = false
        isTablet.value = false
        isDesktop.value = true
      }
    }
  }

  onMounted(() => {
    detectDevice()
    window.addEventListener('resize', detectDevice)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', detectDevice)
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice
  }
}
