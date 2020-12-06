import {
  Account,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { newAccountWithLamports } from "./new-account-with-lamports";
import { sendAndConfirmTransaction } from "./send-and-confirm-transaction";
import BN from "bn.js";
import { chunk } from "./chunk";

const PROGRAM_ID = new PublicKey(
  "62u3yVpZMjn1FebNuZxgvWnxDSVZLGUpCTFCV6zz8eig"
);

let signalId = 0;
export const connectionAccount = new Account();
const WRITE_MSG_TAG = 0;

export const getAccInfo = () => {
  const connection = new Connection("http://localhost:8899", "singleGossip");
  console.log(connectionAccount.publicKey.toBase58());
  return connection.getParsedAccountInfo(
    connectionAccount.publicKey,
    "singleGossip"
  );
};

export const sendSignal = async (signal: string) => {
  signalId += 1;
  const mySignalId = signalId;
  const signalBuffer = Buffer.from(signal);
  const connection = new Connection("http://localhost:8899", "singleGossip");
  const masterAcc = await newAccountWithLamports(
    connection,
    10 * LAMPORTS_PER_SOL
  );

  if (mySignalId === 1) {
    const connectionAccountIx = SystemProgram.createAccount({
      fromPubkey: masterAcc.publicKey,
      newAccountPubkey: connectionAccount.publicKey,
      lamports: 2 * LAMPORTS_PER_SOL,
      space: 20000,
      programId: PROGRAM_ID
    });

    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(connectionAccountIx),
      masterAcc,
      connectionAccount
    );
  }

  if (signalBuffer.length < 901) {
    console.log("signalId: " + mySignalId);
    const data = Buffer.concat([
      Buffer.from([WRITE_MSG_TAG]),
      Buffer.from([1, mySignalId, 1, 1]),
      Buffer.from(new BN(signalBuffer.length, 10).toArray("le", 2)),
      signalBuffer
    ]);

    const writeMessageIx = new TransactionInstruction({
      keys: [
        {
          pubkey: connectionAccount.publicKey,
          isSigner: true,
          isWritable: true
        }
      ],
      programId: PROGRAM_ID,
      data
    });

    const tx = new Transaction().add(writeMessageIx);

    await sendAndConfirmTransaction(
      connection,
      tx,
      masterAcc,
      connectionAccount
    );
  } else {
    console.log("signalId: " + mySignalId);
    const splitSignalBuffer = chunk([...signalBuffer], 900);
    splitSignalBuffer.forEach(async (v, index) => {
      const data = Buffer.concat([
        Buffer.from([WRITE_MSG_TAG]),
        Buffer.from([1, mySignalId, splitSignalBuffer.length, index + 0]),
        Buffer.from(new BN(v.length, 10).toArray("le", 2)),
        Buffer.from(v)
      ]);

      const writeMessageIx = new TransactionInstruction({
        keys: [
          {
            pubkey: connectionAccount.publicKey,
            isSigner: true,
            isWritable: true
          }
        ],
        programId: PROGRAM_ID,
        data
      });

      const tx = new Transaction().add(writeMessageIx);

      await sendAndConfirmTransaction(
        connection,
        tx,
        masterAcc,
        connectionAccount
      );
    });
  }
};

export const writeMessage = async () => {
  const connection = new Connection("http://localhost:8899", "singleGossip");

  const masterAcc = await newAccountWithLamports(
    connection,
    10 * LAMPORTS_PER_SOL
  );

  console.log(
    (await connection.getMinimumBalanceForRentExemption(20000)) /
      LAMPORTS_PER_SOL
  );

  const connectionAccount = new Account();
  const connectionAccountIx = SystemProgram.createAccount({
    fromPubkey: masterAcc.publicKey,
    newAccountPubkey: connectionAccount.publicKey,
    lamports: 2 * LAMPORTS_PER_SOL,
    space: 20000,
    programId: PROGRAM_ID
  });

  const writeMessageIx = new TransactionInstruction({
    keys: [
      { pubkey: connectionAccount.publicKey, isSigner: true, isWritable: true }
    ],
    programId: PROGRAM_ID,
    data: Buffer.from([0, 1, 1, 1, 1, 5, 0, 2, 4, 6, 8, 10])
  });

  const tx = new Transaction().add(connectionAccountIx, writeMessageIx);

  await sendAndConfirmTransaction(connection, tx, masterAcc, connectionAccount);

  console.log(connectionAccount.publicKey.toBase58());

  const writeMessageIx2 = new TransactionInstruction({
    keys: [
      { pubkey: connectionAccount.publicKey, isSigner: true, isWritable: true }
    ],
    programId: PROGRAM_ID,
    data: Buffer.from([0, 2, 3, 1, 1, 7, 0, 1, 3, 5, 7, 9, 11, 13])
  });

  const tx2 = new Transaction().add(writeMessageIx2);

  await sendAndConfirmTransaction(
    connection,
    tx2,
    masterAcc,
    connectionAccount
  );

  return await connection.getParsedAccountInfo(
    connectionAccount.publicKey,
    "singleGossip"
  );
};
