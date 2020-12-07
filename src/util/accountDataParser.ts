import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import BN from 'bn.js';
import { EventEmitter } from 'events';

interface Message {
    senderId: number,
    signalId: number,
    messageParts: number,
    messagePartId: number,
    messageLength: number,
    message: number[]
}

interface Signal {
    signalId: number,
    requiredParts: number,
    messages: Message[]
}

export class AccountDataParser extends EventEmitter{
    #signalCounter: 0;
    #processedSignals: Signal[];
    #bufferedSignals: Signal[];
    #ongoingSignals: Signal[];
    #connection: Connection;
    #accountPubkey: PublicKey;
    #senderId: number;

    constructor(connection: Connection, accountPubkey: PublicKey, senderId: number) {
        super();
        this.#ongoingSignals = [];
        this.#connection = connection;
        this.#accountPubkey = accountPubkey;
        this.#connection.onAccountChange(this.#accountPubkey, this.handleAccountChange.bind(this), 'singleGossip');
        this.#senderId = senderId;
        this.#signalCounter = 0;
        this.#bufferedSignals = [];
        this.#processedSignals = [];
    }

    private handleAccountChange(accountInfo: AccountInfo<Buffer>) {
        const accountData = accountInfo.data;

        let i = 0;
        while (accountData[i] !== 0) {
                const currentMessageLength = new BN([accountData[i + 4], accountData[i + 5]], "le").toNumber();

                if (accountData[i] !== this.#senderId) {
                    const message: Message = {
                        senderId: accountData[i],
                        signalId: accountData[i + 1],
                        messageParts: accountData[i + 2],
                        messagePartId: accountData[i + 3],
                        messageLength: currentMessageLength,
                        message: [...accountData].slice(i + 6, currentMessageLength + 6 + i)
                    };

                    if (!this.#processedSignals.find(s => s.signalId === message.signalId)) {
                        let signal = this.#ongoingSignals.find(s => s.signalId === message.signalId);
                        if (!signal) {
                            signal = {signalId: message.signalId, messages: [message], requiredParts: message.messageParts};
                            this.#ongoingSignals.push(signal);
                        } else {
                            if (!signal.messages.find(m => m.messagePartId === message.messagePartId)) {
                                signal.messages.push(message);
                            }
                        }
    
                        if (signal.requiredParts === signal.messages.length) {
                            signal.messages.sort((m1,m2) => m1.messagePartId < m2.messagePartId ? -1 : 1);
                            this.#ongoingSignals = this.#ongoingSignals.filter(s => s.signalId !== signal?.signalId);
    
                           if (this.#signalCounter < signal.signalId) {
                                this.#bufferedSignals.push(signal);
                           } else {
                            this.emitSignal(signal);
                            this.#signalCounter += 1;
                            const signalsToEmit = this.#bufferedSignals.filter(s => s.signalId < this.#signalCounter)
                            signalsToEmit.sort((s1, s2) => s1.signalId < s2.signalId ? -1 : 1);
                            signalsToEmit.forEach(s => s.messages.sort((m1,m2) => m1.messagePartId < m2.messagePartId ? -1 : 1));
                            signalsToEmit.forEach(this.emitSignal);
                            this.#bufferedSignals = this.#bufferedSignals.filter(s => s.signalId > this.#signalCounter);
                           }
                           
                        } 
                    }
                }
                i += currentMessageLength + 6;
        }
    }

    private emitSignal(signal: Signal) {
        this.#processedSignals.push(signal);
        this.emit("signal", Buffer.concat(signal.messages.map(m => Buffer.from(m.message))).toString());
    }
}
