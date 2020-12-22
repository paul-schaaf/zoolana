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
          <div class="big-btn bg-blue-gradient mr-10" @click="onStartCall">
            Start Call
          </div>
          <div
            class="big-btn bg-pink-gradient"
            @click="showJoinRoomModal = true"
          >
            Join Call
          </div>
        </div>
        <div
          v-else
          class="big-btn bg-blue-gradient"
          @click="isConnected = true"
        >
          Connect Wallet
        </div>
      </div>
    </div>
    <modal
      :show="showInstructions"
      classes="w-2/3 md:w-1/2 lg:w-1/2 xl:w-1/3"
      @close="showInstructions = false"
    >
      <div class="w-2/3 flex flex-col items-center text-center mb-12">
        <p class="mt-12">
          Welcome to Zoolana! A p2p meeting app built on Solana. For now you can
          only do <strong> 2-person video calls</strong> but more functionality
          is coming! This app currently runs on <span class="text-yellow-600">testnet</span>.
        </p>
        <p class="mt-3">1. Connect your wallet</p>
        <p class="mt-3">2. Start or join call</p>
        <p class="mt-3">
          2a. If you've clicked 'Start Call', copy the secret room id and send
          it to your friend
        </p>
        <p class="mt-3">
          2b. If you've clicked 'Join Call', paste the secret room id your
          friend sent you and click 'Join'
        </p>
        <p class="mt-3">
          3. Do not close the modal. Wait for wallet confirmation requests.
          There may be up to 20 (tip: use a wallet with only a little sol (in
          case you don't trust the UI) and turn on auto accept in the first
          confirmation popup). Accept them all and you will be connected.
        </p>
      </div>
    </modal>
    <modal :show="showCreateRoomModal" classes="w-72" @close="cancelCall">
      <div class="w-2/3 flex flex-col items-center text-center mb-5">
        <p class="mt-24" :class="{ 'mb-16': !showCopyButton }">
          {{ createRoomModalText }}
        </p>
        <div
          v-if="showCopyButton"
          class="bg-blue-gradient relative mt-12 px-5 py-3 rounded-lg cursor-pointer select-none"
          @click="copyRoomSecret"
        >
          copy room id
        </div>
      </div>
    </modal>
    <modal :show="showJoinRoomModal" classes="w-96" @close="cancelCall">
      <div class="w-2/3 mb-5">
        <div v-if="!joinRoomModalText" class="mt-16 flex flex-col items-center">
          <label for="secret-room-id-input" class="w-full"
            >Secret room id</label
          >
          <input
            v-model="secretRoomId"
            type="text"
            id="secret-room-id-input"
            class="w-full h-10 mt-2 px-2 bg-gray-800 inner-shadow-main rounded-lg"
          />
          <div
            class="bg-blue-gradient mt-12 px-5 py-3 rounded-lg cursor-pointer select-none"
            @click="onJoinCall"
          >
            Join
          </div>
        </div>
        <div v-else class="mt-16 mb-10 text-center">
          {{ joinRoomModalText }}
        </div>
      </div>
    </modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import copy from "copy-to-clipboard";

import { createRoom, destroyRoom, joinRoom, room } from "@/util/room";
import Modal from "@/components/helper/Modal.vue";

export default defineComponent({
  name: "Home",
  components: {
    Modal
  },
  setup() {
    const router = useRouter();
    const showInstructions = ref(false);
    const showCreateRoomModal = ref(false);
    const createRoomModalText = ref("");
    const showCopyButton = ref(false);
    const showJoinRoomModal = ref(false);
    const secretRoomId = ref("");
    const joinRoomModalText = ref("");
    const isConnected = ref(false);

    const onStartCall = async () => {
      showCreateRoomModal.value = true;
      createRoomModalText.value = "Creating room...";
      const { firstSignalReceived, streamReceived } = await createRoom();
      showCopyButton.value = true;
      createRoomModalText.value = "Waiting for peer...";
      await firstSignalReceived;
      createRoomModalText.value = "Found peer! Establishing connection...";
      await streamReceived;
      router.push({ name: "Room" });
    };

    const copyRoomSecret = () => {
      copy(room.roomId.value);
    };

    const onJoinCall = async () => {
      if (!secretRoomId.value) {
        return;
      }
      joinRoomModalText.value = "Joining room...";
      const { firstSignalReceived, streamReceived } = await joinRoom(
        secretRoomId.value
      );
      joinRoomModalText.value = "Waiting for peer...";
      await firstSignalReceived;
      joinRoomModalText.value = "Found peer! Establishing connection...";
      await streamReceived;
      router.push({ name: "Room" });
    };

    const cancelCall = async () => {
      destroyRoom();
      showCreateRoomModal.value = false;
      showJoinRoomModal.value = false;
      showCopyButton.value = false;
    };

    return {
      secretRoomId,
      showInstructions,
      isConnected,
      showCreateRoomModal,
      createRoomModalText,
      copyRoomSecret,
      onStartCall,
      cancelCall,
      showJoinRoomModal,
      onJoinCall,
      joinRoomModalText,
      showCopyButton
    };
  }
});
</script>
