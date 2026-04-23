import { get, set, del } from 'idb-keyval';
import { StateStorage, createJSONStorage } from 'zustand/middleware';

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const zustandIdbStorage = createJSONStorage(() => idbStorage);
