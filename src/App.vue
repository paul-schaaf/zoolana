<template>
  <video ref="myVideo" muted></video>
  <video ref="theirVideo"></video>
  <div @click="onClick" style="cursor:pointer">establish connection</div>
  <div>{{ info }}</div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import SimplePeer from "simple-peer";
import { SignalSender } from "./util/signalSender";
import { AccountDataParser } from "./util/accountDataParser";
import { Connection } from "@solana/web3.js";

export default defineComponent({
  name: "App",
  setup() {
    const myVideo = ref();
    const theirVideo = ref();
    const info = ref("");

    function gotMedia(
      stream: MediaStream,
      signalSender: SignalSender,
      theirSignalSender: SignalSender,
      accountDataParser: AccountDataParser,
      theirAccountDataParser: AccountDataParser
    ) {
      const peer1 = new SimplePeer({ initiator: true, stream });
      const peer2 = new SimplePeer({ stream });

      accountDataParser.on("signal", data => peer1.signal(JSON.parse(data)));
      theirAccountDataParser.on("signal", data =>
        peer2.signal(JSON.parse(data))
      );

      peer1.on("signal", data => {
        signalSender.sendSignal(JSON.stringify(data));
      });

      peer1.on("connect", async () => {
        console.log("connected");
        //@ts-expect-error
        info.value = await signalSender.getAccInfo();
      });

      peer2.on("signal", data => {
        theirSignalSender.sendSignal(JSON.stringify(data));
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
      const theirSignalSender = await SignalSender.newWithAddress(
        connection,
        2,
        signalSender.getSecret()
      );

      const accountDataParser = new AccountDataParser(
        connection,
        signalSender.getAccKey(),
        1
      );

      const theirAccountDataParser = new AccountDataParser(
        connection,
        signalSender.getAccKey(),
        2
      );

      // get video/voice stream
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true
        })
        .then(stream =>
          gotMedia(
            stream,
            signalSender,
            theirSignalSender,
            accountDataParser,
            theirAccountDataParser
          )
        )
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
