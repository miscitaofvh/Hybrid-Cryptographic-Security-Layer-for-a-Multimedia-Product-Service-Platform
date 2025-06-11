import kyberFactory from './lib/kyber.server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let wasmInstance = null;
let HEAPU8 = null;
let cwrap = null;

async function init() {
  if (wasmInstance) return wasmInstance;
  const wasmPath = path.join(__dirname, './lib/kyber.server.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);

  // Đây là factory function, dùng trực tiếp
  wasmInstance = await kyberFactory({ wasmBinary });

  HEAPU8 = wasmInstance.HEAPU8;
  cwrap = wasmInstance.cwrap;
  return wasmInstance;
}

// ... phần còn lại giữ nguyên như bạn đã viết!
function getBytes(ptr, length) {
  return Buffer.from(HEAPU8.subarray(ptr, ptr + length));
}

export async function generateKeypair() {
  await init();

  const PK_LEN = 1184;
  const SK_LEN = 2400;

  const pkPtr = wasmInstance._malloc(PK_LEN);
  const skPtr = wasmInstance._malloc(SK_LEN);

  cwrap('wasm_keypair', 'void', ['number', 'number'])(pkPtr, skPtr);

  const publicKey = getBytes(pkPtr, PK_LEN);
  const secretKey = getBytes(skPtr, SK_LEN);

  wasmInstance._free(pkPtr);
  wasmInstance._free(skPtr);

  return {
    publicKey: publicKey.toString('base64'),
    secretKey: secretKey.toString('base64'),
  };
}
export async function encapsulate(publicKeyB64) {
  await init();

  const pk = Buffer.from(publicKeyB64, 'base64');
  const pkPtr = wasmInstance._malloc(pk.length);
  HEAPU8.set(pk, pkPtr);

  const CT_LEN = 1088;
  const SS_LEN = 32;

  const ctPtr = wasmInstance._malloc(CT_LEN);
  const ssPtr = wasmInstance._malloc(SS_LEN);

  cwrap('wasm_encaps', 'void', ['number', 'number', 'number'])(
    ctPtr,
    ssPtr,
    pkPtr
  );

  const ciphertext = getBytes(ctPtr, CT_LEN);
  const sharedKey = getBytes(ssPtr, SS_LEN);

  wasmInstance._free(pkPtr);
  wasmInstance._free(ctPtr);
  wasmInstance._free(ssPtr);

  return {
    ciphertext: ciphertext.toString('base64'),
    sharedKey: sharedKey.toString('base64'),
  };
}


export async function decapsulate(secretKeyB64, ciphertextB64) {
  await init();

  const sk = Buffer.from(secretKeyB64, 'base64');
  const ct = Buffer.from(ciphertextB64, 'base64');

  const skPtr = wasmInstance._malloc(sk.length);
  const ctPtr = wasmInstance._malloc(ct.length);
  const ssPtr = wasmInstance._malloc(32);

  HEAPU8.set(sk, skPtr);
  HEAPU8.set(ct, ctPtr);

  cwrap('wasm_decaps', 'void', ['number', 'number', 'number'])(ssPtr, ctPtr, skPtr);

  const sharedKey = getBytes(ssPtr, 32);

  wasmInstance._free(skPtr);
  wasmInstance._free(ctPtr);
  wasmInstance._free(ssPtr);

  return sharedKey.toString('base64');
}
