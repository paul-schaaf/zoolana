<template>
  <video ref="myVideo" muted></video>
  <video ref="theirVideo"></video>
  <div @click="onClick" style="cursor:pointer">establish connection</div>
  <div @click="onGetInfo">get info</div>
  <div>{{ info }}</div>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from "vue";
import SimplePeer from "simple-peer";
import { getAccInfo, sendSignal, writeMessage } from "./util";
import { sleep } from "./util/sleep";

export default defineComponent({
  name: "App",
  setup() {
    const myVideo = ref();
    const theirVideo = ref();
    const info = ref("");

    const onGetInfo = async () => {
      //@ts-expect-error
      info.value = await getAccInfo();
    };

    function gotMedia(stream: MediaStream) {
      const peer1 = new SimplePeer({ initiator: true, stream });
      const peer2 = new SimplePeer({ stream });

      peer1.on("signal", data => {
        sendSignal(JSON.stringify(data));
        peer2.signal(Buffer.from(JSON.stringify(data)).toString());
      });

      peer1.on("connect", async () => {
        await sleep(5000);
        //@ts-expect-error
        info.value = await getAccInfo();
      });

      peer2.on("signal", data => {
        peer1.signal(Buffer.from(JSON.stringify(data)).toString());
      });

      peer1.on("stream", stream => {
        const video = theirVideo.value;
        video.srcObject = stream;
        console.log(stream);
        video.play();
      });

      peer2.on("stream", stream => {
        // got remote video stream, now let's show it in a video tag
        const video = myVideo.value;
        video.srcObject = stream;
        console.log(stream);
        video.play();
      });
    }

    const onClick = async () => {
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
      //info.value = await writeMessage();
    };

    return { info, onClick, theirVideo, myVideo, onGetInfo };
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
