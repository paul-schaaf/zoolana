<template>
  <div @click="onCreateRoom" style="cursor:pointer">Create room</div>
  <input
    v-model="accountSecret"
    class="block border border-black"
    type="text"
  />
  <button @click="onJoinRoom" style="cursor:pointer">
    Join room
  </button>
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
