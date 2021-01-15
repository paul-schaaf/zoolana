<template>
  <div class="h-screen w-screen bg-gray-900 flex justify-center">
    <div class="mt-12 flex flex-col text-white items-center">
      <h1 class="text-4xl select-none">Zoolana</h1>
      <div class="relative mt-12 their-video">
        <video
          ref="theirVideo"
          :muted="isIncomingAudioMuted"
          class="w-full h-full bg-gray-800"
          style="object-fit: cover;"
        ></video>
        <video
          ref="myVideo"
          class="w-48 absolute bg-gray-700 bottom-5 right-5"
          style="object-fit: cover;"
          muted
        ></video>
      </div>
      <div class="mt-10 w-96 h-20 flex justify-between">
        <div
          class="relative little-round-btn"
          @click="toggleIsIncomingAudioMuted"
        >
          <svg
            v-if="isIncomingAudioMuted"
            alt="unmute incoming audio"
            class="absolute top-7 left-7 select-none"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path
              d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
            ></path>
            <line x1="1" y1="1" x2="24" y2="24" stroke="red" />
          </svg>
          <svg
            v-else
            alt="mute incoming audio"
            class="absolute top-7 left-7 select-none"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path
              d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
            ></path>
          </svg>
        </div>
        <div class="relative little-round-btn" @click="toggleOutgoingMic">
          <svg
            v-if="isMuted"
            alt="unmute"
            class="absolute top-7 left-7 select-none"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
            <line x1="1" y1="1" x2="23" y2="23" stroke="red" />
          </svg>
          <svg
            v-else
            class="absolute top-7 left-7 select-none"
            alt="mute"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
        <div class="relative little-round-btn" @click="onEndCall">
          <svg
            alt="end call"
            class="absolute"
            style="top: 1.85rem; left: 1.6rem"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="23" y1="1" x2="17" y2="7" />
            <line x1="17" y1="1" x2="23" y2="7" />
            <path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import {
  room,
  toggleOutgoingMic,
  destroyRoom,
  toggleIsIncomingAudioMuted
} from "@/util/zoolana/room";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "Room",
  setup() {
    const myVideo = ref();
    const theirVideo = ref();
    const router = useRouter();

    const playOwnVideo = async () => {
      const video = myVideo.value;
      video.srcObject = room.outgoingStream;
      video.play();
    };

    onMounted(async () => {
      theirVideo.value.srcObject = room.incomingStream;
      theirVideo.value.play();
      await playOwnVideo();
    });

    const onEndCall = () => {
      destroyRoom();
      router.push({ name: "Home" });
    };

    return {
      myVideo,
      theirVideo,
      toggleOutgoingMic,
      onEndCall,
      isMuted: room.isMuted,
      isIncomingAudioMuted: room.isIncomingAudioMuted,
      toggleIsIncomingAudioMuted
    };
  }
});
</script>

<style lang="scss" scoped>
.their-video {
  width: 800px;
  height: 500px;

  @media (min-width: 300px) {
    width: 300px;
  }

  @media (min-width: 400px) {
    width: 400px;
  }

  @media (min-width: 600px) {
    width: 600px;
  }

  @media (min-height: 850px) and (min-width: 1000px) {
    width: 1000px;
    height: 600px;
  }
}
</style>
