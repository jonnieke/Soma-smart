import '@testing-library/jest-dom';

// Polyfill global localStorage & sessionStorage for Node 22+ / JSDOM environment
if (typeof window !== 'undefined' && typeof Storage !== 'undefined') {
  const storageMap = new WeakMap<Storage, Map<string, string>>();

  function getStore(instance: Storage): Map<string, string> {
    let map = storageMap.get(instance);
    if (!map) {
      map = new Map<string, string>();
      storageMap.set(instance, map);
    }
    return map;
  }

  Storage.prototype.getItem = function (key: string) {
    const store = getStore(this);
    return store.has(String(key)) ? store.get(String(key))! : null;
  };

  Storage.prototype.setItem = function (key: string, value: string) {
    const store = getStore(this);
    store.set(String(key), String(value));
    (this as any)[key] = String(value);
  };

  Storage.prototype.removeItem = function (key: string) {
    const store = getStore(this);
    store.delete(String(key));
    delete (this as any)[key];
  };

  Storage.prototype.clear = function () {
    const store = getStore(this);
    for (const key of store.keys()) {
      delete (this as any)[key];
    }
    store.clear();
  };

  Storage.prototype.key = function (index: number) {
    const store = getStore(this);
    return Array.from(store.keys())[index] ?? null;
  };

  Object.defineProperty(Storage.prototype, 'length', {
    get() {
      return getStore(this).size;
    },
    configurable: true,
  });

  const mockLocalStorage: Storage = Object.create(Storage.prototype);
  const mockSessionStorage: Storage = Object.create(Storage.prototype);

  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });
}


