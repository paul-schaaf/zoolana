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
import { createAccount } from './account';
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
      const signalSender = new SignalSender(connection, senderId);
      signalSender.#connectionAccount = await createAccount(connectionAccountSecret);

      signalSender.#masterAcc = await newAccountWithLamports(
        connection,
        10 * LAMPORTS_PER_SOL
      );
      
      return signalSender;
    }

    private constructor(connection: Connection, senderId: number) {
        this.#signalCounter = -1;
        this.#connection = connection;
        this.#connectionAccount = new Account();
        this.#masterAcc = new Account();
        this.#senderId = senderId;
    }

    async sendSignal(signal: string) {
        this.#signalCounter += 1;
        const mySignalId = this.#signalCounter;
        console.log("Sending signal with id: ", mySignalId);
        const signalBuffer = Buffer.from(signal);

        if (signalBuffer.length < 901) {
            const data = Buffer.concat([
              Buffer.from([WRITE_MSG_TAG]),
              Buffer.from([this.#senderId, mySignalId, 1, 1]),
              Buffer.from(new BN(signalBuffer.length, 10).toArray("le", 2)),
              signalBuffer
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
            try {
              const splitSignalBuffer = chunk([...signalBuffer], 900);
              splitSignalBuffer.forEach(async (v, index) => {
                const data = Buffer.concat([
                  Buffer.from([WRITE_MSG_TAG]),
                  Buffer.from([this.#senderId, mySignalId, splitSignalBuffer.length, index]),
                  Buffer.from(new BN(v.length, 10).toArray("le", 2)),
                  Buffer.from(v)
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
            } catch (err) {
              console.log("Offer tx failed");
            }
          }
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
