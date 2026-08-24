declare global {
  interface Window {
    __lightread?: {
      openFile: () => Promise<void>;
      openFolder: () => Promise<void>;
    };
  }
}

export {};
