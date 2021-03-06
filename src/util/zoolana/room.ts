import SimplePeer from "simple-peer";
import { SignalSender } from "./signalSender";
import { Account } from "@solana/web3.js";
import bs58 from "bs58";
import { getConnection } from "../solana/connection";
import { AccountDataParser } from "./accountDataParser";
import { Ref, ref } from "vue";

export interface Room {
  roomId: Ref<string>;
  isMuted: Ref<boolean>;
  isIncomingAudioMuted: Ref<boolean>;
  outgoingStream: null | MediaStream;
  incomingStream: null | MediaStream;
  peer: null | SimplePeer.Instance;
}

export const room: Room = {
  roomId: ref(""),
  isMuted: ref(false),
  isIncomingAudioMuted: ref(false),
  outgoingStream: null,
  incomingStream: null,
  peer: null
};

const initRoom = (
  roomId: string,
  peer: SimplePeer.Instance,
  outgoingStream: MediaStream
) => {
  room.roomId.value = roomId;
  room.isMuted.value = false;
  room.isIncomingAudioMuted.value = false;
  room.peer = peer;
  room.outgoingStream = outgoingStream;
};

let accountDataParser: null | AccountDataParser = null;

export const toggleIsIncomingAudioMuted = () =>
  (room.isIncomingAudioMuted.value = !room.isIncomingAudioMuted.value);

export const toggleOutgoingMic = () => {
  if (room.outgoingStream) {
    room.outgoingStream.getAudioTracks()[0].enabled = !room.outgoingStream.getAudioTracks()[0]
      .enabled;
    room.isMuted.value = !room.outgoingStream.getAudioTracks()[0].enabled;
  }
};

export const destroyRoom = () => {
  room.outgoingStream?.getTracks().forEach(track => track.stop());
  room.outgoingStream = null;
  room.incomingStream?.getTracks().forEach(track => track.stop());
  room.incomingStream = null;
  room.peer?.destroy();
  room.peer = null;
  room.roomId.value = "";
  room.isMuted.value = false;
  room.isIncomingAudioMuted.value = false;
  accountDataParser?.removeAccountListener();
  accountDataParser = null;
};

export const joinRoom = async (secret: string) => {
  const account = new Account(bs58.decode(secret));

  const signalSender = await SignalSender.newWithAccount(
    getConnection(),
    2,
    account
  );

  await signalSender.createConnectionAccount();

  accountDataParser = new AccountDataParser(getConnection(), account, 2);

  // get video/voice stream
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  const peer = new SimplePeer({ stream, initiator: true });

  accountDataParser.on("signal", data => peer.signal(JSON.parse(data)));

  const firstSignalReceived: Promise<void> = new Promise(resolve => {
    peer.on("signal", data => {
      resolve();
      signalSender.sendSignal(JSON.stringify(data));
    });
  });

  const streamReceived: Promise<void> = new Promise(resolve => {
    peer.on("stream", (stream: MediaStream) => {
      resolve();
      room.incomingStream = stream;
    });
  });

  initRoom(secret, peer, stream);

  return { firstSignalReceived, streamReceived };
};

export const createRoom = async () => {
  const account = new Account();

  const signalSender = await SignalSender.newWithAccount(
    getConnection(),
    1,
    account
  );

  accountDataParser = new AccountDataParser(getConnection(), account, 1);

  // get video/voice stream
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  const peer = new SimplePeer({ stream });

  accountDataParser.on("signal", data => peer.signal(JSON.parse(data)));

  const firstSignalReceived: Promise<void> = new Promise(resolve => {
    peer.on("signal", data => {
      resolve();
      signalSender.sendSignal(JSON.stringify(data));
    });
  });

  const streamReceived: Promise<void> = new Promise(resolve => {
    peer.on("stream", (stream: MediaStream) => {
      resolve();
      room.incomingStream = stream;
    });
  });

  initRoom(bs58.encode(account.secretKey), peer, stream);

  return { firstSignalReceived, streamReceived };
};
