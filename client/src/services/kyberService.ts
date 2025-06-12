// src/services/kyberService.ts
import { initKyber } from "@/lib/kyberClient";
import type { KyberModule } from "@/lib/kyberClient";

// Sửa lại theo build của bạn nếu cần!
export const KYBER_PUBLICKEYBYTES = 1184;
export const KYBER_SECRETKEYBYTES = 2400;
export const KYBER_CIPHERTEXTBYTES = 1088;
export const KYBER_SSBYTES = 32;

/** Generate Kyber keypair, trả về { pk, sk } */
export async function genKey() {
  const kyber: KyberModule = await initKyber();
  const ptr = kyber._wasm_keypair();
  if (!ptr) throw new Error("wasm_keypair failed");

  const pk = kyber.HEAPU8.slice(ptr, ptr + KYBER_PUBLICKEYBYTES);
  const sk = kyber.HEAPU8.slice(ptr + KYBER_PUBLICKEYBYTES, ptr + KYBER_PUBLICKEYBYTES + KYBER_SECRETKEYBYTES);

  kyber._free(ptr);
  return { pk, sk };
}

/** Encapsulate: nhập publicKey Uint8Array, trả về { ct, ss } */
export async function encaps(pk: Uint8Array) {
  const kyber: KyberModule = await initKyber();
  const pkPtr = kyber._malloc(KYBER_PUBLICKEYBYTES);
  kyber.HEAPU8.set(pk, pkPtr);

  const outPtr = kyber._wasm_encaps(pkPtr);
  if (!outPtr) {
    kyber._free(pkPtr);
    throw new Error("wasm_encaps failed");
  }

  const ct = kyber.HEAPU8.slice(outPtr, outPtr + KYBER_CIPHERTEXTBYTES);
  const ss = kyber.HEAPU8.slice(outPtr + KYBER_CIPHERTEXTBYTES, outPtr + KYBER_CIPHERTEXTBYTES + KYBER_SSBYTES);

  kyber._free(pkPtr);
  kyber._free(outPtr);
  return { ct, ss };
}

/** Decapsulate: nhập sk Uint8Array, ct Uint8Array, trả về ss */
export async function decaps(sk: Uint8Array, ct: Uint8Array) {
  const kyber: KyberModule = await initKyber();

  const skPtr = kyber._malloc(KYBER_SECRETKEYBYTES);
  kyber.HEAPU8.set(sk, skPtr);

  const ctPtr = kyber._malloc(KYBER_CIPHERTEXTBYTES);
  kyber.HEAPU8.set(ct, ctPtr);

  const ssPtr = kyber._wasm_decaps(skPtr, ctPtr);
  if (!ssPtr) {
    kyber._free(skPtr);
    kyber._free(ctPtr);
    throw new Error("wasm_decaps failed");
  }

  const ss = kyber.HEAPU8.slice(ssPtr, ssPtr + KYBER_SSBYTES);

  kyber._free(skPtr);
  kyber._free(ctPtr);
  kyber._free(ssPtr);
  return ss;
}
