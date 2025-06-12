export interface KeyContextValue {
  publicKey?: Uint8Array;
  privateKey?: Uint8Array;
  sharedSecret?: Uint8Array;
  setKeyData: (data: { publicKey: Uint8Array; privateKey: Uint8Array; sharedSecret: Uint8Array }) => void;
}
