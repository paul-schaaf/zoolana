import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction
} from "@solana/web3.js";
import { Encryption } from "./encryption";
import BN from "bn.js";
import { chunk } from "./chunk";
import { createAccount } from './account';
import { secretbox } from "tweetnacl";
import base58 from 'bs58';
import {sendTxUsingExternalSignature, useWallet} from "@/util/externalWallet";
//@ts-expect-error
import Wallet from "@project-serum/sol-wallet-adapter";

const WRITE_MSG_TAG = 0;
const PROGRAM_ID = new PublicKey(
    "62u3yVpZMjn1FebNuZxgvWnxDSVZLGUpCTFCV6zz8eig"
  );

export class SignalSender {
    #signalCounter: number;
    #connection: Connection;
    #connectionAccount: Account;
    #wallet: Wallet;
    #senderId: number;
    #encryption: Encryption;


    private constructor(connection: Connection, wallet: Wallet, senderId: number) {
      this.#signalCounter = -1;
      this.#connection = connection;
      this.#connectionAccount = new Account();
      this.#wallet = wallet;
      this.#senderId = senderId;
      this.#encryption = new Encryption(this.#connectionAccount.secretKey);
  }

    static async newWithAddress(connection: Connection, senderId: number, connectionAccountSecret: string) {
      const account = await createAccount(connectionAccountSecret);
      return this.newWithAccount(connection, senderId, account);
    }

    static async newWithAccount(connection: Connection, senderId: number, connectionAccount: Account) {
        const wallet = await useWallet();
        const signalSender = new SignalSender(connection,wallet, senderId);
        signalSender.setConnectionAccount(connectionAccount);

        return signalSender;
    }

    async createConnectionAccount() {
      const lamportsRequired = await this.#connection.getMinimumBalanceForRentExemption(20000, 'singleGossip');

      const connectionAccountIx = SystemProgram.createAccount({
        fromPubkey: this.#wallet.publicKey,
        newAccountPubkey: this.#connectionAccount.publicKey,
        lamports: lamportsRequired,
        space: 20000,
        programId: PROGRAM_ID
      });

      return sendTxUsingExternalSignature(
          [connectionAccountIx],
          this.#connection,
          this.#wallet,
          this.#connectionAccount)
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
        
            await sendTxUsingExternalSignature( [writeMessageIx],
                this.#connection,
                this.#wallet,
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

              await sendTxUsingExternalSignature( [writeMessageIx],
                  this.#connection,
                  this.#wallet,
                  this.#connectionAccount
              );
              });
          }
    }

    private setConnectionAccount(connectionAccount : Account) {
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
