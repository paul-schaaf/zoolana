<template>
  <button @click="onSetup">init</button>
  ME
  <video ref="video" muted />
  PEER
  <video ref="peerVideo" />
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from "vue";

const buildOnNegotiate = (pc: RTCPeerConnection) => {
  return async function() {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log(Buffer.from(pc.localDescription?.sdp as string));
    console.log(pc.localDescription?.sdp.toString());
  };
};

function handleAnswer(message: string, pc: Ref<RTCPeerConnection>) {
  const desc = new RTCSessionDescription({ sdp: message, type: "answer" });
  pc.value.setRemoteDescription(desc).catch(e => console.log(e));
}

const createPC = (
  myVideo: Ref<HTMLVideoElement>,
  peerVideo: Ref<HTMLVideoElement>
) => {
  const peer = new RTCPeerConnection();
  peer.ontrack = (event: RTCTrackEvent) => {
    peerVideo.value!.srcObject = event.streams[0];
  };
  peer.onnegotiationneeded = buildOnNegotiate(peer);
  (myVideo.value.srcObject as MediaStream).getTracks().forEach(t => {
    console.log(t);
    peer.addTrack(t, myVideo.value.srcObject as MediaStream);
  });
  return peer;
};

export default defineComponent({
  name: "App",
  setup() {
    const constraints = { audio: true, video: { width: 450, height: 360 } };
    const video: Ref<null | HTMLVideoElement> = ref(null);
    const peerVideo: Ref<null | HTMLVideoElement> = ref(null);

    onMounted(async () => {
      if (!video.value) {
        return;
      }
      video.value.srcObject = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      video.value.onloadedmetadata = function() {
        video.value!.play();
      };
    });

    const peerConnection: Ref<null | RTCPeerConnection> = ref(null);

    const onSetup = () => {
      if (!video.value) {
        return;
      }
      peerConnection.value = createPC(
        video as Ref<HTMLVideoElement>,
        peerVideo as Ref<HTMLVideoElement>
      );
    };

    return { video, onSetup, peerVideo };
  }
});
</script>
