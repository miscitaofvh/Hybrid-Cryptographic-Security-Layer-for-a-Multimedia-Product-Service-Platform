// src/types/kyber-js.d.ts
declare module '*.js' {
  export interface KyberModule {
    _wasm_keypair(): number;
    _wasm_decaps(skPtr: number, ctPtr: number): number;
    HEAPU8: Uint8Array;
    _malloc(size: number): number;
    _free(ptr: number): void;
  }

  const kyberFactory: () => Promise<KyberModule>;
  export default kyberFactory;
}
declare module '*.wasm' {
  const wasmModule: any;
  export default wasmModule;
}