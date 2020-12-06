<template>
  <video ref="myVideo" muted></video>
  <video ref="theirVideo"></video>
  <div @click="onClick" style="cursor:pointer">establish connection</div>
  <div>{{ info }}</div>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from "vue";
import SimplePeer from "simple-peer";
import { SignalSender } from "./util/signalSender";
import { sleep } from "./util/sleep";
import { Connection } from "@solana/web3.js";

export default defineComponent({
  name: "App",
  setup() {
    const myVideo = ref();
    const theirVideo = ref();
    const info = ref("");

    function gotMedia(stream: MediaStream, signalSender: SignalSender) {
      const peer1 = new SimplePeer({ initiator: true, stream });
      const peer2 = new SimplePeer({ stream });

      peer1.on("signal", data => {
        signalSender.sendSignal(JSON.stringify(data));
        peer2.signal(Buffer.from(JSON.stringify(data)).toString());
      });

      peer1.on("connect", async () => {
        console.log("connected");
        //@ts-expect-error
        info.value = await signalSender.getAccInfo();
      });

      peer2.on("signal", data => {
        peer1.signal(Buffer.from(JSON.stringify(data)).toString());
      });

      peer1.on("stream", stream => {
        const video = theirVideo.value;
        video.srcObject = stream;
        video.play();
      });

      peer2.on("stream", stream => {
        // got remote video stream, now let's show it in a video tag
        const video = myVideo.value;
        video.srcObject = stream;
        video.play();
      });
    }

    const onClick = async () => {
      const connection = new Connection(
        "http://localhost:8899",
        "singleGossip"
      );
      const signalSender = await SignalSender.new(connection, 1);

      // get video/voice stream
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true
        })
        .then(stream => gotMedia(stream, signalSender))
        .catch(err => {
          console.error(err);
        });
    };

    return { info, onClick, theirVideo, myVideo };
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
