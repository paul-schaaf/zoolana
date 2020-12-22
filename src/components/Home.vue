<template>
  <div
    class="h-screen w-screen relative bg-gray-900 flex justify-center text-white"
  >
    <div class="w-full md:w-1/2 flex flex-col">
      <h1 class="text-4xl text-center mt-64">Zoolana</h1>
      <p class="text-center mt-8">
        Click
        <span class="underline cursor-pointer" @click="showInstructions = true"
          >here</span
        >
        for instructions
      </p>
      <div class="flex justify-center mt-9">
        <div v-if="isConnected" class="flex">
          <div class="big-btn bg-blue-gradient mr-10">Start Call</div>
          <div class="big-btn bg-pink-gradient">Join Call</div>
        </div>
        <div
          v-else
          class="big-btn bg-blue-gradient"
          @click="isConnected = true"
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
    <teleport to="body">
      <div
        v-if="showInstructions"
        class="absolute top-0 right-0 bottom-0 left-0 z-50"
      >
        <div class="relative h-screen w-screen">
          <div
            class="transform-middle w-2/3 md:w-1/2 lg:w-1/2 xl:w-1/3 h-auto bg-gray-gradient rounded-lg shadow-main text-white"
          >
            <div class="relative flex flex-col items-center">
              <div class="w-2/3 flex flex-col items-center text-center mb-12">
                <p class="mt-12">
                  Welcome to Zoolana! A p2p meeting app built on Solana. For now
                  you can only do <strong> 2-person video calls</strong> but
                  more functionality is coming!
                </p>
                <p class="mt-3">1. Connect your wallet</p>
                <p class="mt-3">2. Start or join call</p>
                <p class="mt-3">
                  2a. If you've clicked 'Start Call', copy the secret room id
                  and send it to your friend
                </p>
                <p class="mt-3">
                  2b. If you've clicked 'Join Call', paste the secret room id
                  your friend sent you and click 'Join'
                </p>
                <p class="mt-3">
                  3. Do not close the modal. Wait for wallet confirmation
                  requests. There may be up to 20 (tip: use a wallet with only a
                  little sol (in case you don't trust the UI) and turn on auto
                  accept in the first confirmation popup). Accept them all and
                  you will be connected.
                </p>
              </div>
              <div
                class="absolute top-2 right-4 cursor-pointer select-none text-2xl"
                @click="showInstructions = false"
              >
                X
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
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
    const showInstructions = ref(false);
    const isConnected = ref(false);

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

    return {
      onCreateRoom,
      onJoinRoom,
      accountSecret,
      showInstructions,
      isConnected
    };
  }
});
</script>
