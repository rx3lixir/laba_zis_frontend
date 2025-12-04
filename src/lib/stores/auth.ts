import { writable } from "svelte/store";

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    accessToken: null,
    user: null,
  });

  return {
    subscribe,
    setAuth: (accessToken: string, user: User) => {
      set({ accessToken, user });
    },
    clearAuth: () => {
      set({ accessToken: null, user: null });
    },
    updateAccessToken: (accessToken: string) => {
      update((state) => ({ ...state, accessToken }));
    },
  };
}

export const auth = createAuthStore();
