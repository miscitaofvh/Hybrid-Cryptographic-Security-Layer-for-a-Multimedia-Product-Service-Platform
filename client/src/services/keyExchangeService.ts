import { genKey, decaps } from "@/services/kyberService";
import API from "@/config/api";

function uint8ToBase64(uint8: Uint8Array): string {
    // Tối ưu cho browser
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

export async function keyExchange(accessToken: string) {
    const { pk, sk } = await genKey();
    const publicKeyBase64 = uint8ToBase64(pk);

    const { data } = await API.post(
        "/key-exchange",
        { publicKey: publicKeyBase64 },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const ciphertextBase64 = data.ciphertext;
    const ct = base64ToUint8(ciphertextBase64);
    const sharedSecret = await decaps(sk, ct);

    console.log('Shared secret:', uint8ToBase64(sharedSecret));
    
    return {
        publicKey: pk,
        privateKey: sk,
        sharedSecret,
    };
}
