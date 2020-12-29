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
            @click="joinModalState.showJoinRoomModal = true"
          >
            Join Call
          </div>
        </div>
        <div v-else class="big-btn bg-blue-gradient" @click="connectWallet">
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
          Welcome to Zoolana! A p2p meeting app built on Solana.
          <span class="text-yellow-600">
            For now you can only do 2-person video calls
          </span>
          but more functionality is coming! This app currently runs on
          <span class="text-yellow-600">devnet</span>.
        </p>
        <p class="mt-3">1. Connect your wallet</p>
        <p class="mt-3">2. Start or join call</p>
        <p class="mt-3">
          2a. If you've clicked 'Start Call', copy the secret room id and send
          it to your peer
        </p>
        <p class="mt-3">
          2b. If you've clicked 'Join Call', paste the secret room id your peer
          sent you and click 'Join'
        </p>
        <p class="mt-3">
          3. Do not close the modal. Wait for wallet confirmation requests.
          There may be up to 20 (unfortunately no whitelist auto-accept feature
          for sollet yet). Accept them all and you will be connected.
        </p>
        <p class="mt-3">
          Cost breakdown per call: ~0.0001 SOL for all tx fees, 0.15 SOL as
          account rent. Account rent will be recoverable once deployed on
          mainnet
        </p>
        <p class="mt-3">
          <span class="text-yellow-600"
            >If something doesn't work as it should, open up the console and
            report errors to me please! paulx#9059, find me in the Solana/Serum
            Discords</span
          >
        </p>
      </div>
    </modal>
    <modal
      :show="startModalState.showCreateRoomModal"
      :showClose="startModalState.isCreatingRoom"
      classes="w-72"
      @close="onStartModalCancel"
    >
      <div class="w-2/3 flex flex-col items-center text-center mb-5">
        <p class="mt-24" :class="{ 'mb-16': !startModalState.isCreatingRoom }">
          {{ startModalState.createRoomModalText }}
        </p>
        <div
          v-if="startModalState.isCreatingRoom"
          class="bg-blue-gradient relative mt-12 px-5 py-3 rounded-lg cursor-pointer select-none"
          @click="copyRoomSecret"
        >
          copy room id
        </div>
      </div>
    </modal>
    <modal
      :show="joinModalState.showJoinRoomModal"
      classes="w-96"
      @close="onJoinModalCancel"
    >
      <div class="w-2/3 mb-5">
        <div
          v-if="!joinModalState.joinRoomModalText"
          class="mt-16 flex flex-col items-center"
        >
          <form>
            <label for="secret-room-id-input" class="w-full"
              >Secret room id</label
            >
            <input
              v-model="joinModalState.secretRoomId"
              type="text"
              id="secret-room-id-input"
              class="w-full h-10 mt-2 px-2 bg-gray-800 inner-shadow-main rounded-lg"
              autocomplete="off"
            />
          </form>
          <div
            class="bg-blue-gradient mt-12 px-5 py-3 rounded-lg cursor-pointer select-none"
            @click="onJoinCall"
          >
            Join
          </div>
        </div>
        <div v-else class="mt-16 mb-10 text-center">
          {{ joinModalState.joinRoomModalText }}
        </div>
      </div>
    </modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from "vue";
import { Router, useRouter } from "vue-router";
import copy from "copy-to-clipboard";

import { createRoom, destroyRoom, joinRoom, room } from "@/util/zoolana/room";
import { connectToWallet } from "@/util/solana/externalWallet";
import Modal from "@/components/helper/Modal.vue";

const useJoinCall = (router: Router) => {
  const state = reactive({
    showJoinRoomModal: false,
    secretRoomId: "",
    joinRoomModalText: ""
  });

  const onJoinCall = async () => {
    if (!state.secretRoomId) {
      return;
    }
    state.joinRoomModalText = "Joining room...";
    const { firstSignalReceived, streamReceived } = await joinRoom(
      state.secretRoomId
    );
    state.joinRoomModalText = "Waiting for peer...";
    await firstSignalReceived;
    state.joinRoomModalText = "Found peer! Establishing connection...";
    await streamReceived;
    state.joinRoomModalText = "Loading video...";
    router.push({ name: "Room" });
  };

  const onCancel = () => {
    destroyRoom();
    state.showJoinRoomModal = false;
  };

  return { state, onJoinCall, onCancel };
};

const useStartCall = (router: Router) => {
  const state = reactive({
    showCreateRoomModal: false,
    createRoomModalText: "",
    isCreatingRoom: false
  });

  const onStartCall = async () => {
    state.showCreateRoomModal = true;
    state.createRoomModalText = "Creating room...";
    const { firstSignalReceived, streamReceived } = await createRoom();
    state.isCreatingRoom = true;
    state.createRoomModalText = "Waiting for peer...";
    await firstSignalReceived;
    state.createRoomModalText = "Found peer! Establishing connection...";
    await streamReceived;
    router.push({ name: "Room" });
  };

  const onCancel = () => {
    destroyRoom();
    state.showCreateRoomModal = false;
  };

  return { state, onStartCall, onCancel };
};

export default defineComponent({
  name: "Home",
  components: {
    Modal
  },
  setup() {
    const router = useRouter();
    const showInstructions = ref(false);
    const isConnected = ref(false);

    const connectWallet = async () => {
      await connectToWallet();
      isConnected.value = true;
    };

    const copyRoomSecret = () => copy(room.roomId.value);

    const {
      state: startModalState,
      onStartCall,
      onCancel: onStartModalCancel
    } = useStartCall(router);

    const {
      state: joinModalState,
      onJoinCall,
      onCancel: onJoinModalCancel
    } = useJoinCall(router);

    return {
      joinModalState,
      showInstructions,
      isConnected,
      copyRoomSecret,
      onJoinCall,
      onJoinModalCancel,
      onStartCall,
      startModalState,
      onStartModalCancel,
      connectWallet
    };
  }
});
</script>
