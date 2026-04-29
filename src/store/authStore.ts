import { create } from "zustand";
import { UserContext } from "@/types";

const TOKEN_KEY = "scrum_ai_token";

interface AuthState {
  token: string | null;
  user: UserContext | null;
  ready: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: UserContext | null) => void;
  setReady: (ready: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  user: null,
  ready: false,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready }),
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, ready: true });
  },
}));

export const IS_DEV_BYPASS = false;
