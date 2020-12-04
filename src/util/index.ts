import { Account, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { newAccountWithLamports } from "./new-account-with-lamports";
import { sendAndConfirmTransaction } from "./send-and-confirm-transaction";

const PROGRAM_ID = new PublicKey("7hL8hS5DToGa4oFeN39pzWWrPttTqdEoVHrFrUG2f1g7");

export const writeMessage = async () => {
    const connection = new Connection("http://localhost:8899", 'singleGossip');

    const masterAcc = await newAccountWithLamports(connection, 10 * LAMPORTS_PER_SOL);

    console.log((await connection.getMinimumBalanceForRentExemption(20000)) / LAMPORTS_PER_SOL);

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
            { pubkey: connectionAccount.publicKey, isSigner: true, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([0, 1, 1, 5, 0, 2, 4, 6, 8, 10])
    })

    const tx = new Transaction().add(connectionAccountIx, writeMessageIx);

    await sendAndConfirmTransaction(connection, tx, masterAcc, connectionAccount);

    console.log(connectionAccount.publicKey.toBase58());

    const writeMessageIx2 = new TransactionInstruction({
        keys: [
            { pubkey: connectionAccount.publicKey, isSigner: true, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([0, 2, 3, 7, 0, 1, 3, 5, 7, 9, 11, 13])
    })

    const tx2 = new Transaction().add(writeMessageIx2);

    await sendAndConfirmTransaction(connection, tx2, masterAcc, connectionAccount);

    return await connection.getParsedAccountInfo(connectionAccount.publicKey, 'singleGossip');
}

