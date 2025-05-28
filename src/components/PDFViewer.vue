<template>
    <div class="pdf-wrapper" ref="pdfWrapper">
        <iframe ref="pdfIframe" :src="pdfViewerUrl" frameborder="0" ></iframe>
    </div>
</template>

<script setup>
import { defineProps, nextTick, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
    pdfFileName: {
        type: String,
        default: 'PipeFlowLabReport.pdf'
    },
});

const baseUrl = '/pdfjs/web/viewer.html?file=/docs/';
const pdfViewerUrl = baseUrl + props.pdfFileName + '#zoom=page-fit';

const pdfWrapper = ref(null);
const pdfIframe = ref(null);
let paperDetailsSection = null;

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
