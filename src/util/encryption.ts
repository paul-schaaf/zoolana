import nacl from "tweetnacl";

export class Encryption {
    #secretKey: Buffer;

    constructor(secretKey: Buffer) {
        this.#secretKey = secretKey.slice(0,32);
    }

    encrypt(data: Buffer) {
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const box = nacl.secretbox(data, nonce, this.#secretKey);

        const encryptedWithNonce = new Uint8Array(nonce.length + box.length)
        encryptedWithNonce.set(nonce);
        encryptedWithNonce.set(box, nonce.length);

        return encryptedWithNonce;
    }

    decrypt(dataWithNonce: Buffer) {
        const nonce = dataWithNonce.slice(0, nacl.secretbox.nonceLength);
        const encrypted = dataWithNonce.slice(nacl.secretbox.nonceLength, dataWithNonce.length);

        return nacl.secretbox.open(encrypted, nonce, this.#secretKey) ?? Buffer.of();
    }

}