declare interface EmscriptenModule {
  HEAPU8: Uint8Array;
  _malloc(size: number): number;
  _free(ptr: number): void;
  cwrap?: (...args: any[]) => any;
  ccall?: (...args: any[]) => any;
  UTF8ToString?: (ptr: number) => string;
}
