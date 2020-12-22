<template>
  <div class="h-screen w-screen bg-gray-900 flex justify-center text-white">
    <div class="w-full md:w-1/2 flex flex-col">
      <h1 class="text-4xl text-center mt-64">Zoolana</h1>
      <p class="text-center mt-8">
        Click <span class="underline cursor-pointer">here</span> for
        instructions
      </p>
      <div class="flex justify-center mt-9">
        <div
          class="bg-blue-gradient rounded-lg flex items-center w-48 h-24 justify-center align-center cursor-pointer"
        >
          Connect Wallet
        </div>
      </div>
      <!-- <div @click="onCreateRoom" style="cursor:pointer">Create room</div>
      <input
        v-model="accountSecret"
        class="block border border-black"
        type="text"
      />
      <button @click="onJoinRoom" style="cursor:pointer">
        Join room
      </button> -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { createRoom, joinRoom, room } from "@/util/room";
import copy from "copy-to-clipboard";

export default defineComponent({
  name: "Home",
  setup() {
    const router = useRouter();
    const accountSecret = ref("");

    const copyRoomSecret = () => {
      copy(room.roomId.value);
    };

    const onCreateRoom = async () => {
      const { firstSignalReceived, streamReceived } = await createRoom();
      console.log(room.roomId.value);
      console.log("Waiting for peer...");
      await firstSignalReceived;
      console.log("Found peer! Establishing connection...");
      await streamReceived;
      router.push({ name: "Room" });
    };

    const onJoinRoom = async () => {
      const { firstSignalReceived, streamReceived } = await joinRoom(
        accountSecret.value
      );
      console.log("Waiting for peer...");
      await firstSignalReceived;
      console.log("Found peer! Establishing connection...");
      await streamReceived;
      router.push({ name: "Room" });
    };

    return { onCreateRoom, onJoinRoom, accountSecret };
  }
});
</script>
