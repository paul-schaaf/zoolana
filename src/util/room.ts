import SimplePeer from "simple-peer";
import { SignalSender } from "./signalSender";
import { Account } from "@solana/web3.js";
import bs58 from "bs58";
import { getConnection } from "./connection";
import { AccountDataParser } from "./accountDataParser";
import { Ref, ref } from "vue";

interface Room {
  roomId: Ref<string>;
  isMuted: Ref<boolean>;
  stream: null | MediaStream;
  peer: null | SimplePeer.Instance;
}

export const room: Room = {
  roomId: ref(""),
  isMuted: ref(false),
  stream: null,
  peer: null
};

export const toggleOutgoingMic = () => {
  if (room.stream) {
    room.stream.getAudioTracks()[0].enabled = !room.stream.getAudioTracks()[0]
      .enabled;
    room.isMuted.value = !room.stream.getAudioTracks()[0].enabled;
  }
};

export const endCall = () => {
  if (room?.peer) {
    room.peer.destroy();
  }
};

export const joinRoom = async (secret: string, theirVideo: Ref<any>) => {
  const account = new Account(bs58.decode(secret));

  const signalSender = await SignalSender.newWithAccount(
    getConnection(),
    2,
    account
  );

  await signalSender.createConnectionAccount();

  const accountDataParser = new AccountDataParser(getConnection(), account, 2);

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
    const video = theirVideo.value;
    video.srcObject = stream;
    video.play();
  });

  room.isMuted.value = false;
  room.roomId.value = secret;
  room.stream = stream;
};

export const createRoom = async (theirVideo: Ref<any>) => {
  const account = new Account();

  const signalSender = await SignalSender.newWithAccount(
    getConnection(),
    1,
    account
  );

  const accountDataParser = new AccountDataParser(getConnection(), account, 1);

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
    const video = theirVideo.value;
    video.srcObject = stream;
    video.play();
  });

  room.isMuted.value = false;
  room.roomId.value = bs58.encode(account.secretKey);
  room.stream = stream;
};
