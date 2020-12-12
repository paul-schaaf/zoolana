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
import { Encryption } from "./encryption";
import BN from "bn.js";
import { chunk } from "./chunk";
import { createAccount } from './account';
import { secretbox } from "tweetnacl";
import base58 from 'bs58';

const WRITE_MSG_TAG = 0;
const PROGRAM_ID = new PublicKey(
    "62u3yVpZMjn1FebNuZxgvWnxDSVZLGUpCTFCV6zz8eig"
  );

export class SignalSender {
    #signalCounter: number;
    #connection: Connection;
    #connectionAccount: Account;
    #masterAcc: Account;
    #senderId: number;
    #encryption: Encryption;

    static async new(connection: Connection, senderId: number) {
        const signalSender = new SignalSender(connection, senderId);

        signalSender.#masterAcc = await newAccountWithLamports(
            connection,
            10 * LAMPORTS_PER_SOL
          );

        const connectionAccountIx = SystemProgram.createAccount({
            fromPubkey: signalSender.#masterAcc.publicKey,
            newAccountPubkey: signalSender.#connectionAccount.publicKey,
            lamports: 2 * LAMPORTS_PER_SOL,
            space: 20000,
            programId: PROGRAM_ID
          });
      
          await sendAndConfirmTransaction(
            connection,
            new Transaction().add(connectionAccountIx),
            signalSender.#masterAcc,
            signalSender.#connectionAccount
          );

          return signalSender;
    }

    static async newWithAddress(connection: Connection, senderId: number, connectionAccountSecret: string) {
      const account = await createAccount(connectionAccountSecret);
      return this.newWithAccount(connection, senderId, account);
    }

    static async newWithAccount(connection: Connection, senderId: number, connectionAccount: Account) {
        const signalSender = new SignalSender(connection, senderId);
        signalSender.setConnectionAccount(connectionAccount);

        signalSender.#masterAcc = await newAccountWithLamports(
            connection,
            10 * LAMPORTS_PER_SOL
        );

        return signalSender;
    }

    createConnectionAccount() {
      const connectionAccountIx = SystemProgram.createAccount({
        fromPubkey: this.#masterAcc.publicKey,
        newAccountPubkey: this.#connectionAccount.publicKey,
        lamports: 2 * LAMPORTS_PER_SOL,
        space: 20000,
        programId: PROGRAM_ID
      });
  
       return sendAndConfirmTransaction(
        this.#connection,
        new Transaction().add(connectionAccountIx),
        this.#masterAcc,
        this.#connectionAccount
      );
    }

    private constructor(connection: Connection, senderId: number) {
        this.#signalCounter = -1;
        this.#connection = connection;
        this.#connectionAccount = new Account();
        this.#masterAcc = new Account();
        this.#senderId = senderId;
        this.#encryption = new Encryption(this.#connectionAccount.secretKey);
    }

    async sendSignal(signal: string) {
        this.#signalCounter += 1;
        const mySignalId = this.#signalCounter;
        const signalBuffer = Buffer.from(signal);

        if (signalBuffer.length + secretbox.nonceLength< 901) {
            const encrypted = this.#encryption.encrypt(Buffer.from(signalBuffer));
            const data = Buffer.concat([
                Buffer.from([WRITE_MSG_TAG]),
                Buffer.from([this.#senderId, mySignalId, 1, 1]),
                Buffer.from(new BN(encrypted.length, 10).toArray("le", 2)),
                Buffer.from(encrypted)
            ]);
        
            const writeMessageIx = new TransactionInstruction({
              keys: [
                {
                  pubkey: this.#connectionAccount.publicKey,
                  isSigner: true,
                  isWritable: true
                }
              ],
              programId: PROGRAM_ID,
              data
            });
        
            const tx = new Transaction().add(writeMessageIx);
        
            await sendAndConfirmTransaction(
              this.#connection,
              tx,
              this.#masterAcc,
              this.#connectionAccount
            );
          } else {
              const splitSignalBuffer = chunk([...signalBuffer], 900);
              splitSignalBuffer.forEach(async (v, index) => {
                  const encrypted = this.#encryption.encrypt(Buffer.from(v));
                const data = Buffer.concat([
                  Buffer.from([WRITE_MSG_TAG]),
                  Buffer.from([this.#senderId, mySignalId, splitSignalBuffer.length, index]),
                  Buffer.from(new BN(encrypted.length, 10).toArray("le", 2)),
                  Buffer.from(encrypted)
                ]);
          
                const writeMessageIx = new TransactionInstruction({
                  keys: [
                    {
                      pubkey: this.#connectionAccount.publicKey,
                      isSigner: true,
                      isWritable: true
                    }
                  ],
                  programId: PROGRAM_ID,
                  data
                });
          
                const tx = new Transaction().add(writeMessageIx);
          
                await sendAndConfirmTransaction(
                  this.#connection,
                  tx,
                  this.#masterAcc,
                  this.#connectionAccount
                );
              });
          }
    }

    setConnectionAccount(connectionAccount : Account) {
        this.#connectionAccount = connectionAccount;
        this.#encryption = new Encryption(connectionAccount.secretKey);
    }

    getAccInfo() {
      return this.#connection.getParsedAccountInfo(
        this.#connectionAccount.publicKey,
        "singleGossip"
      );
    }
    
    getAccKey() {
      return this.#connectionAccount.publicKey;
    }

    getSecret() {
      return base58.encode(this.#connectionAccount.secretKey);
    }
}
