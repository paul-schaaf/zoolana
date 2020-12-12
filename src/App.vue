<template>
  <video ref="myVideo"></video>
  <div @click="createRoom" style="cursor:pointer">Create room</div>
  <input v-model="accountSecret" type="text" />
  <button @click="joinRoom(accountSecret)" style="cursor:pointer">
    Join room
  </button>
  <div>{{ info }}</div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import SimplePeer from "simple-peer";
import { SignalSender } from "./util/signalSender";
import { AccountDataParser } from "./util/accountDataParser";
import { Account, clusterApiUrl, Connection } from "@solana/web3.js";
import bs58 from "bs58";

export default defineComponent({
  name: "App",
  setup() {
    const myVideo = ref();
    const info = ref("");
    const accountSecret = ref("");

    async function createRoom() {
      const connection = new Connection(
        "http://localhost:8899",
        "singleGossip"
      );
      const account = new Account();

      console.log(bs58.encode(account.secretKey));
      const signalSender = await SignalSender.newWithAccount(
        connection,
        1,
        account
      );

      const accountDataParser = new AccountDataParser(connection, account, 1);

      // get video/voice stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      const peer = new SimplePeer({ stream });

      accountDataParser.on("signal", data => peer.signal(JSON.parse(data)));

      peer.on("signal", data => {
        signalSender.sendSignal(JSON.stringify(data));
      });

      peer.on("stream", stream => {
        const video = myVideo.value;
        video.srcObject = stream;
        video.play();
      });
    }

    async function joinRoom(secret: string) {
      console.log("Join Room!");

      const connection = new Connection(
        "http://localhost:8899",
        "singleGossip"
      );

      const account = new Account(bs58.decode(secret));

      const signalSender = await SignalSender.newWithAccount(
        connection,
        2,
        account
      );

      await signalSender.createConnectionAccount();

      const accountDataParser = new AccountDataParser(connection, account, 2);

      // get video/voice stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      const peer = new SimplePeer({ stream, initiator: true });

      accountDataParser.on("signal", data => peer.signal(JSON.parse(data)));

      peer.on("signal", data => {
        signalSender.sendSignal(JSON.stringify(data));
      });

      peer.on("stream", stream => {
        const video = myVideo.value;
        video.srcObject = stream;
        video.play();
      });
    }

    return { info, createRoom, joinRoom, accountSecret, myVideo };
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
