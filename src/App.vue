<template>
  <video ref="myVideo" muted></video>
  <video ref="theirVideo"></video>
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from "vue";
import SimplePeer from "simple-peer";

export default defineComponent({
  name: "App",
  setup() {
    const myVideo = ref();
    const theirVideo = ref();

    function gotMedia(stream: MediaStream) {
      const peer1 = new SimplePeer({ initiator: true, stream: stream });
      const peer2 = new SimplePeer({stream: stream});

      peer1.on("signal", data => {
        console.log("signal from P2:");
        console.log(Buffer.from(JSON.stringify(data)));
        peer2.signal(Buffer.from(JSON.stringify(data)).toString());
      });

      peer2.on("signal", data => {
        console.log("signal from P1:");
        console.log(Buffer.from(JSON.stringify(data)));
        peer1.signal(Buffer.from(JSON.stringify(data)).toString());
      });

      peer1.on("stream", stream => {
                const video = theirVideo.value;
        video.srcObject = stream;

        video.play();
      })

      peer2.on("stream", stream => {
        // got remote video stream, now let's show it in a video tag
        const video = myVideo.value;
        video.srcObject = stream;

        video.play();
      });
    }
    // get video/voice stream
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true
      })
      .then(gotMedia)
      .catch(err => {
        console.error(err);
      });

    return { myVideo, theirVideo };
  }
});
</script>

<style lang="scss" scoped>
#outgoing {
  width: 600px;
  word-wrap: break-word;
  white-space: normal;
}
</style>
