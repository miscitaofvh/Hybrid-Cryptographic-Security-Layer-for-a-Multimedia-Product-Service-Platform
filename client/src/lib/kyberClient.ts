export interface KyberModule extends EmscriptenModule {
  _wasm_keypair(): number;
  _wasm_encaps(pkPtr: number): number;
  _wasm_decaps(skPtr: number, ctPtr: number): number;
  HEAPU8: Uint8Array;
  _malloc(size: number): number;
  _free(ptr: number): void;
}

// Global kyber WASM module instance
let kyber: KyberModule | null = null;

/**
 * Khởi tạo Kyber WASM. Chỉ gọi 1 lần, các lần sau dùng lại instance cũ.
 */
export async function initKyber(): Promise<KyberModule> {
  if (kyber) return kyber;

  // Nếu chưa có kyberFactory trên window, inject script
  if (!(window as any).kyberFactory) {
    const oldScript = document.getElementById('kyber-wasm-script');
    if (oldScript) oldScript.remove();

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'kyber-wasm-script';
      script.src = '/wasm/kyber.js';
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load kyber.js'));
      document.body.appendChild(script);
    });
  }

  // Lấy factory từ window
  const factory = (window as any).kyberFactory;
  if (typeof factory !== "function") {
    throw new Error("Global kyberFactory not found after loading kyber.js");
  }

  // Gọi factory để lấy instance module (kiểu EmscriptenModule)
  kyber = await factory();
  return kyber as KyberModule;
}
