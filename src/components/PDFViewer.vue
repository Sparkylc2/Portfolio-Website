<template>
  <div class="pdf-wrapper" ref="pdfWrapper">
    <iframe ref="pdfIframe" :src="pdfViewerUrl" frameborder="0" @load="applyAccentColor"></iframe>
  </div>
</template>

<script setup>
import { computed, defineProps, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  pdfFileName: {
    type: String,
    default: 'PipeFlowLabReport.pdf'
  },
  accentColor: {
    type: String,
    default: 'rgb(140, 172, 204)'
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isTablet: {
    type: Boolean,
    default: false
  }
});



const pdfViewerUrl = computed(() => {
  const baseUrl = !(props.isMobile || props.isTablet) ? '/pdfjs/web/viewer.html?file=/docs/' : '/pdfjs/web/viewerNoBar.html?file=/docs/'
  return `${baseUrl}${props.pdfFileName}#zoom=${props.isMobile ? '30' : 'page-fit'}`;
});


const pdfWrapper = ref(null);
const pdfIframe = ref(null);
let paperDetailsSection = null;

watch(() => props.pdfFileName, () => {
  if (pdfIframe.value) {
    pdfIframe.value.src = pdfViewerUrl.value;
  }
});


const applyAccentColor = () => {
  if (!pdfIframe.value) return;

  try {
    const iframe = pdfIframe.value;
    const iframeWindow = iframe.contentWindow;

    if (!iframeWindow || !iframeWindow.document) {
      setTimeout(() => applyAccentColor(), 200);
      return;
    }
    iframeWindow.document.documentElement.style.setProperty('--paper-color', props.accentColor);

    if (iframeWindow.document.body) {
      iframeWindow.document.body.style.setProperty('--paper-color', props.accentColor);
    }
  } catch (e) {
  }
};

const syncIframeSize = () => {
  if (!pdfWrapper.value || !pdfIframe.value) return;

  if (paperDetailsSection) {
    const rect = paperDetailsSection.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(paperDetailsSection);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);

    const contentWidth = (rect.width - paddingLeft - paddingRight);
    const contentHeight = (rect.height - paddingTop - paddingBottom);

    pdfIframe.value.style.width = `${contentWidth}px`;
    pdfIframe.value.style.height = `${contentHeight}px`;

    pdfWrapper.value.style.width = `${contentWidth}px`;
    pdfWrapper.value.style.height = `${contentHeight}px`;


    pdfWrapper.value.style.marginBottom = '0';
    pdfIframe.value.style.marginBottom = '0';
  }
};

let resizeObserver = null;

onMounted(() => {
  nextTick(() => {
    paperDetailsSection = document.getElementById('sectionContent');
    if (!paperDetailsSection) {
      return;
    }


    syncIframeSize();

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        syncIframeSize();
      });

      resizeObserver.observe(paperDetailsSection);
    }

    window.addEventListener('resize', syncIframeSize);
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', syncIframeSize);
});


</script>

<style scoped>
.pdf-wrapper {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
}

iframe {
  border: none;
  overflow: hidden;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  max-height: 100%;
}

.pdf-viewer iframe {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.pdf-viewer iframe::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
</style>
