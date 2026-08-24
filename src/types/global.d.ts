declare global {
  const __APP_VERSION__: string;

  interface Window {
    __lightread?: {
      openFile: () => Promise<void>;
      openFolder: () => Promise<void>;
    };
  }
}

export {};
