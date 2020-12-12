<template>
  <div class="container bg-red-100 flex justify-center">
    <div class="mt-10 w-2/3 bg-blue-200 flex flex-col items-center">
      <h1 class="text-4xl">Zoolana</h1>
      <h2 class="text-xl mt-10">RoomId: {{ roomId }}</h2>
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
            class="h-20 w-20 bg-gray-400 rounded-full relative cursor-pointer"
            @click="toggleMic"
          >
            <img
              src="./assets/icons/mic-off.svg"
              alt="end call"
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
  <div @click="createRoom" style="cursor:pointer">Create room</div>
  <input v-model="accountSecret" type="text" />
  <div @click="joinRoom(accountSecret)" style="cursor:pointer">Join room</div>
  <div>{{ info }}</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import SimplePeer from "simple-peer";
import { SignalSender } from "./util/signalSender";
import { AccountDataParser } from "./util/accountDataParser";
import { Account, clusterApiUrl, Connection } from "@solana/web3.js";
import bs58 from "bs58";

export default defineComponent({
  name: "App",
  setup() {
    const myVideo = ref();
    const theirVideo = ref();
    const info = ref("");
    const accountSecret = ref("");
    const roomId = ref("fsdlkfhjdsfhsadlkfhasdlfldhfs");
    let peer: SimplePeer.Instance;
    let stream: MediaStream;

    const endCall = () => {
      if (peer) {
        peer.destroy();
      }
    };

    const toggleMic = () => {
      if (stream) {
        stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0]
          .enabled;
      }
    };

    onMounted(async () => {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      const video = myVideo.value;
      video.srcObject = videoStream;
      video.play();
    });

    async function createRoom() {
      const connection = new Connection(
        clusterApiUrl("devnet"),
        "singleGossip"
      );
      const account = new Account();

      console.log(bs58.encode(account.secretKey));
      const signalSender = await SignalSender.newWithAccount(
        connection,
        1,
        account
      );

      const accountDataParser = new AccountDataParser(
        connection,
        account.publicKey,
        1
      );

      // get video/voice stream
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      peer = new SimplePeer({ stream });

      accountDataParser.on("signal", data => peer.signal(JSON.parse(data)));

      peer.on("signal", data => {
        signalSender.sendSignal(JSON.stringify(data));
      });

      peer.on("stream", stream => {
        const video = theirVideo.value;
        video.srcObject = stream;
        video.play();
      });
    }

    async function joinRoom(secret: string) {
      console.log("Join Room!");

      const connection = new Connection(
        clusterApiUrl("devnet"),
        "singleGossip"
      );

      const account = new Account(bs58.decode(secret));

      const signalSender = await SignalSender.newWithAccount(
        connection,
        2,
        account
      );

      await signalSender.createConnectionAccount();

      const accountDataParser = new AccountDataParser(
        connection,
        account.publicKey,
        2
      );

      // get video/voice stream
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      peer = new SimplePeer({ stream, initiator: true });

      accountDataParser.on("signal", data => peer.signal(JSON.parse(data)));

      peer.on("signal", data => {
        signalSender.sendSignal(JSON.stringify(data));
      });

      peer.on("stream", stream => {
        const video = theirVideo.value;
        video.srcObject = stream;
        video.play();
      });
    }

    return {
      info,
      createRoom,
      joinRoom,
      accountSecret,
      myVideo,
      theirVideo,
      roomId,
      endCall,
      toggleMic
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
