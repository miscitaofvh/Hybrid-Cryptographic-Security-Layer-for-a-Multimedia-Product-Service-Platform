import API from "@/config/api";
import type { Track } from "@/types/track";
import { useAuth } from "@/context/AuthContext";
import { useKey } from "@/context/KeyContext";

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let length = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (let arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Nối ciphertext + tag (chuẩn cho AES-GCM WebCrypto)
function concatBuffer(enc: Uint8Array, tag: Uint8Array): Uint8Array {
  const buf = new Uint8Array(enc.length + tag.length);
  buf.set(enc, 0);
  buf.set(tag, enc.length);
  return buf;
}

async function deriveSegmentKey(sharedSecret: Uint8Array, segmentIndex: number): Promise<CryptoKey> {
  // sharedSecret (string, thường là base64 hoặc random bytes -> truyền dưới dạng string)
  // segmentIndex (UInt32BE)
  const idxBuf = new Uint8Array(4);
  idxBuf[0] = (segmentIndex >> 24) & 0xFF;
  idxBuf[1] = (segmentIndex >> 16) & 0xFF;
  idxBuf[2] = (segmentIndex >> 8) & 0xFF;
  idxBuf[3] = segmentIndex & 0xFF;

  // Ghép secretBytes + idxBuf
  const base = new Uint8Array(sharedSecret.length + 4);
  base.set(sharedSecret, 0);
  base.set(idxBuf, sharedSecret.length);

  // Hash SHA-256 rồi lấy 16 bytes đầu (AES-128)
  const hash = await window.crypto.subtle.digest("SHA-256", base);
  return window.crypto.subtle.importKey(
    "raw",
    hash.slice(0, 16),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}
function uint8ToBase64(uint8: Uint8Array): string {
    // Tối ưu cho browser
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
}

export const useTrackService = () => {
  const { accessToken } = useAuth();
  const { sharedSecret } = useKey();

  const getTracks = async (): Promise<Track[]> => {
    const res = await API.get("/tracks/get-tracks", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  };

  const getTrackById = async (trackId: string): Promise<Track> => {
    const res = await API.get(`/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  };

  // Lấy ArrayBuffer stream đã mã hóa (binary)
  const fetchTrackStream = async (trackId: string): Promise<ArrayBuffer> => {
    const res = await API.get(`/tracks/${trackId}/stream`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: "arraybuffer",
    });
    return res.data;
  };

  // Giải mã toàn bộ stream nhận về
  const fetchAndDecryptTrackStream = async (trackId: string): Promise<Uint8Array> => {
    if (!sharedSecret) throw new Error("Missing shared secret");
    const encBuffer = await fetchTrackStream(trackId);

    // Cấu trúc: [4 idx][12 iv][16 tag][4 len][enc]
    const data = new Uint8Array(encBuffer);
    let offset = 0;
    const decodedParts: Uint8Array[] = [];

    while (offset + 36 <= data.length) {
      const idx =
        ((data[offset + 0] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]) >>> 0;
      const iv = data.slice(offset + 4, offset + 16);
      const tag = data.slice(offset + 16, offset + 32);
      const encLength =
        ((data[offset + 32] << 24) | (data[offset + 33] << 16) | (data[offset + 34] << 8) | data[offset + 35]) >>> 0;

      const encStart = offset + 36;
      const encEnd = encStart + encLength;
      if (encEnd > data.length) break;

      const encSegment = data.slice(encStart, encEnd);

      console.log("Shared secret:", uint8ToBase64(sharedSecret));

      // Derive segment key đồng bộ backend
      const segmentKey = await deriveSegmentKey(sharedSecret, idx);
      
      console.log(`Decrypting segment ${idx} with key`, segmentKey); 
      const rawKey = await window.crypto.subtle.exportKey("raw", segmentKey);
      const keyHex = Array.from(new Uint8Array(rawKey)).map(x => x.toString(16).padStart(2, '0')).join('');
      console.log(`Decrypting segment ${idx} with key (hex): ${keyHex}`);
      // Giải mã AES-GCM
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128,
        },
        segmentKey,
        concatBuffer(encSegment, tag)
      );

      decodedParts.push(new Uint8Array(decrypted));
      offset = encEnd;
    }

    return concatUint8Arrays(decodedParts);
  };

  return {
    getTracks,
    getTrackById,
    fetchTrackStream,
    fetchAndDecryptTrackStream,
  };
};
