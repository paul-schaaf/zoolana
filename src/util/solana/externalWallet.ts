import {
  Account,
  Connection,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
//@ts-expect-error
import Wallet from "@project-serum/sol-wallet-adapter";

const PROVIDER_URL = "https://www.sollet.io";
const wallet = new Wallet(PROVIDER_URL, "devnet");

export const sendTxUsingExternalSignature = async (
  instructions: TransactionInstruction[],
  connection: Connection,
  wallet: Wallet,
  ...otherSigners: Account[]
) => {
  const tx = new Transaction().add(...instructions);
  tx.setSigners(wallet.publicKey, ...otherSigners.map(s => s.publicKey));
  tx.recentBlockhash = (await connection.getRecentBlockhash("max")).blockhash;
  otherSigners.forEach(acc => {
    tx.partialSign(acc);
  });
  const signed = await wallet.signTransaction(tx);
  const txid = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: "singleGossip"
  });
  return connection.confirmTransaction(txid, "singleGossip");
};

export const connectToWallet = async () => {
  if (!wallet.connected) {
    return wallet.connect() as Promise<void>;
  } else {
    return Promise.resolve();
  }
};

export const useWallet = async (): Promise<Wallet> => {
  await connectToWallet();
  return wallet;
};
