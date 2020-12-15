<template>
  <div class="container bg-red-100 flex justify-center">
    <div class="mt-10 w-2/3 bg-blue-200 flex flex-col items-center">
      <h1 class="text-4xl">Zoolana</h1>
      <h2 class="text-xl mt-10 cursor-pointer" @click="copyRoomSecret">
        Copy Room Secret
      </h2>
      <div class="w-4/5 mt-10">
        <div
          style="height: 550px"
          class="flex flex-col items-center bg-red-400 w-full relative"
        >
          <video
            ref="theirVideo"
            class="w-full h-full bg-red-500"
            style="object-fit: cover;"
          ></video>
          <video
            ref="myVideo"
            class="w-48 absolute bg-blue-400 bottom-5 right-5"
            style="object-fit: cover;"
          ></video>
        </div>
      </div>
      <div class="w-1/3">
        <div class="mt-10 flex justify-around">
          <div
            class="h-20 w-20 bg-gray-400 rounded-full relative cursor-pointer transition-colors"
            :class="{ 'bg-gray-700': isMuted }"
            @click="toggleOutgoingMic"
          >
            <img
              v-if="isMuted"
              src="./assets/icons/mic-off.svg"
              alt="unmute"
              class="absolute top-7 left-7"
            />
            <img
              v-else
              src="./assets/icons/mic.svg"
              alt="mute"
              class="absolute top-7 left-7"
            />
          </div>
          <div
            class="h-20 w-20 bg-gray-400 rounded-full relative cursor-pointer"
            @click="endCall"
          >
            <img
              src="./assets/icons/phone-missed.svg"
              alt="end call"
              class="absolute"
              style="top: 1.85rem; left: 1.6rem"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <div @click="onCreateRoom" style="cursor:pointer">Create room</div>
  <input v-model="accountSecret" type="text" />
  <button @click="onJoinRoom" style="cursor:pointer">
    Join room
  </button>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import {
  room,
  createRoom,
  joinRoom,
  toggleOutgoingMic,
  endCall
} from "./util/room";
import copy from "copy-to-clipboard";

export default defineComponent({
  name: "App",
  setup() {
    const myVideo = ref();
    const theirVideo = ref();
    const accountSecret = ref("");

    const copyRoomSecret = () => {
      copy(room.roomId.value);
    };

    const playOwnVideo = async () => {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      const video = myVideo.value;
      video.srcObject = videoStream;
      video.play();
    };

    onMounted(async () => {
      await playOwnVideo();
    });

    const onCreateRoom = async () => {
      await createRoom(theirVideo);
    };

    const onJoinRoom = async () => {
      await joinRoom(accountSecret.value, theirVideo);
    };

    return {
      createRoom,
      joinRoom,
      accountSecret,
      myVideo,
      theirVideo,
      copyRoomSecret,
      endCall,
      toggleOutgoingMic,
      isMuted: room.isMuted
    };
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
