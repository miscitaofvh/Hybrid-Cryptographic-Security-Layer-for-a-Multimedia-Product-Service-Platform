import { genKey, decaps } from "@/services/kyberService";
import API from "@/config/api";

function buf2hex(buf: Uint8Array): string {
    return Array.from(buf).map(x => x.toString(16).padStart(2, "0")).join("");
}

function hex2buf(hex: string): Uint8Array {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.slice(c, c + 2), 16));
    }
    return new Uint8Array(bytes);
}

export async function keyExchange(accessToken: string) {
    const { pk, sk } = await genKey();

    const { data } = await API.post(
        "/key-exchange",
        { publicKey: buf2hex(pk) },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const ct = hex2buf(data.ciphertext);
    const sharedSecret = await decaps(sk, ct);

    return {
        publicKey: pk,
        privateKey: sk,
        sharedSecret,
    };
}
