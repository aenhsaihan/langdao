// Polyfill for localStorage in SSR environment
if (typeof window === "undefined") {
  // Create a simple in-memory storage for SSR
  const storage: Record<string, string> = {};
  
  global.localStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
    key: (index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(storage).length;
    },
  } as Storage;
  
  global.sessionStorage = global.localStorage;
}

export {};
