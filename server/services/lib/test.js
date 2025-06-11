// test-kyber.js
import kyberFactory from './kyber.server.js';
import fs from 'fs';

// Hàm helper chuyển Uint8Array về hex string (in kết quả cho dễ nhìn)
const toHex = (buf) => Buffer.from(buf).toString('hex');

async function main() {
  // 1. Khởi tạo WASM Module
  const kyber = await kyberFactory();

  // 2. Chuẩn bị các hàm C đã export ra JS (qua cwrap)
  const keypair = kyber.cwrap('wasm_keypair', null, ['number', 'number']);
  const encaps = kyber.cwrap('wasm_encaps', null, ['number', 'number', 'number']);
  const decaps = kyber.cwrap('wasm_decaps', null, ['number', 'number', 'number']);

  // 3. Định nghĩa size (theo Kyber bản chuẩn, có thể là Kyber768)
  const PUBLIC_KEY_BYTES = 1184;
  const SECRET_KEY_BYTES = 2400;
  const CIPHERTEXT_BYTES = 1088;
  const SHARED_SECRET_BYTES = 32;

  // 4. Cấp phát bộ nhớ cho keypair
  const pubKeyPtr = kyber._malloc(PUBLIC_KEY_BYTES);
  const secKeyPtr = kyber._malloc(SECRET_KEY_BYTES);

  keypair(pubKeyPtr, secKeyPtr);

  // Đọc kết quả từ HEAP
  const pubKey = new Uint8Array(kyber.HEAPU8.buffer, pubKeyPtr, PUBLIC_KEY_BYTES);
  const secKey = new Uint8Array(kyber.HEAPU8.buffer, secKeyPtr, SECRET_KEY_BYTES);

  console.log('Public Key:', toHex(pubKey));
  console.log('Secret Key:', toHex(secKey));

  // 5. Encapsulation
  const cipherPtr = kyber._malloc(CIPHERTEXT_BYTES);
  const sharedSecretEncPtr = kyber._malloc(SHARED_SECRET_BYTES);

  encaps(cipherPtr, sharedSecretEncPtr, pubKeyPtr);

  const ciphertext = new Uint8Array(kyber.HEAPU8.buffer, cipherPtr, CIPHERTEXT_BYTES);
  const sharedSecretEnc = new Uint8Array(kyber.HEAPU8.buffer, sharedSecretEncPtr, SHARED_SECRET_BYTES);

  console.log('Ciphertext:', toHex(ciphertext));
  console.log('Encapsulated Shared Secret:', toHex(sharedSecretEnc));

  // 6. Decapsulation
  const sharedSecretDecPtr = kyber._malloc(SHARED_SECRET_BYTES);

  decaps(sharedSecretDecPtr, cipherPtr, secKeyPtr);

  const sharedSecretDec = new Uint8Array(kyber.HEAPU8.buffer, sharedSecretDecPtr, SHARED_SECRET_BYTES);

  console.log('Decapsulated Shared Secret:', toHex(sharedSecretDec));

  // 7. So sánh hai shared secret
  const isEqual = Buffer.compare(sharedSecretEnc, sharedSecretDec) === 0;
  console.log('Shared secret equal:', isEqual);

  // 8. Free memory
  kyber._free(pubKeyPtr);
  kyber._free(secKeyPtr);
  kyber._free(cipherPtr);
  kyber._free(sharedSecretEncPtr);
  kyber._free(sharedSecretDecPtr);
}

main().catch(console.error);
