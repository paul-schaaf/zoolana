import {
  Account,
  Connection,
  sendAndConfirmTransaction as realSendAndConfirmTransaction,
  Transaction
} from "@solana/web3.js";

export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  ...signers: Account[]
) {
  await realSendAndConfirmTransaction(connection, transaction, signers, {
    skipPreflight: true
  });
}
