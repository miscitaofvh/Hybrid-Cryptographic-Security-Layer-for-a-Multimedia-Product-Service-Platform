import { createContext, useContext, useState } from "react";
import type { KeyContextValue } from "@/types/keyContext";

const KeyContext = createContext<KeyContextValue>({
  setKeyData: () => {},
});

export function KeyProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<Uint8Array>();
  const [privateKey, setPrivateKey] = useState<Uint8Array>();
  const [sharedSecret, setSharedSecret] = useState<Uint8Array>();

  function setKeyData(data: { publicKey: Uint8Array; privateKey: Uint8Array; sharedSecret: Uint8Array }) {
    setPublicKey(data.publicKey);
    setPrivateKey(data.privateKey);
    setSharedSecret(data.sharedSecret);
  }

  return (
    <KeyContext.Provider value={{ publicKey, privateKey, sharedSecret, setKeyData }}>
      {children}
    </KeyContext.Provider>
  );
}

export function useKey() {
  return useContext(KeyContext);
}
