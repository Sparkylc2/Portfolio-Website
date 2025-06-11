<template>
  <div class="video-container">
    <video width="640" height="360" controls>
      <source :src="props.videoSrc" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const videoRef = ref(null);
onMounted(() => {
  if (videoRef.value) {
    videoRef.value.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded');
    });
  }
});
const props = defineProps({
  videoSrc: {
    type: String,
    default: '/videos/my-video.mp4'
  }
});
</script>

<style scoped>
.video-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.video-container video {
  max-width: 100%;
  max-height: 100%;
}
.video-container video::-webkit-media-controls {
  background-color: #f0f0f0;
  color: #333;
}
.video-container video::-webkit-media-controls-enclosure {
  border-radius: 8px;
}
.video-container video::-webkit-media-controls-panel {
  background-color: #f0f0f0;
  color: #333;
}
</style>
