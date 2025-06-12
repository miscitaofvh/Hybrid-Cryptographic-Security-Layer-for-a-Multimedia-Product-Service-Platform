import { genKey, decaps } from "@/services/kyberService";
import API from "@/config/api";

/**
 * Chuyển Uint8Array sang base64 (dùng để gửi/nhận key/binary)
 */
function uint8ToBase64(uint8: Uint8Array): string {
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

/**
 * Thực hiện quy trình trao đổi key với server, qua CA ký public key.
 * @param accessToken access token của user
 * @param user object: { id, role }
 */
export async function keyExchange(accessToken: string, user: { id: string, role: string }) {
    // B1. Sinh keypair PQKEM (Kyber)
    const { pk, sk } = await genKey();
    const publicKeyBase64 = uint8ToBase64(pk);

    // B2. Chuẩn bị metadata
    const metadata = {
        id: user?.id,
        role: user?.role,
        timestamp: new Date().toISOString(),
    };

    // B3. Tạo payload để CA ký
    const payload = JSON.stringify({ publicKey: publicKeyBase64, metadata });

    // B4. Gửi lên CA server để ký (lấy chữ ký CA)
    const res = await fetch("https://localhost:4000/sign", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`, // nếu CA yêu cầu
        },
        body: JSON.stringify({ data: payload }),
    });

    if (!res.ok) {
        throw new Error("CA signing failed: " + (await res.text()));
    }

    const { signature } = await res.json();

    // B5. Gửi publicKey, metadata, signature lên app server
    const { data } = await API.post(
        "/key-exchange",
        {
            publicKey: publicKeyBase64,
            metadata,
            signature,
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    // B6. Nhận ciphertext, giải mã lấy sharedSecret
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
