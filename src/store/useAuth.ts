import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type AuthState = {
  phone: string | null;
  balance: number;
  login: (phone: string) => void;
  logout: () => void;
  setBalance: (balance: number) => void;
  topUp: (amount: number) => void;
};

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      phone: null,
      balance: 0,
      login: (phone) => set({ phone }),
      logout: () => set({ phone: null, balance: 0 }),
      setBalance: (balance) => set({ balance }),
      topUp: (amount) => set((state) => ({ balance: state.balance + amount })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
    }
  )
);

export default useAuthStore;
