<template>
  <video ref="video" muted />
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from "vue";

export default defineComponent({
  name: "App",
  setup() {
    const constraints = { audio: true, video: { width: 450, height: 360 } };
    const video: Ref<null | HTMLVideoElement> = ref(null);

    onMounted(async () => {
      if (!video.value) {
        return;
      }
      video.value.srcObject = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      video.value.onloadedmetadata = function(e) {
        if (!video.value) {
          return;
        }
        video.value.play();
      };
    });

    return { video };
  }
});
</script>
