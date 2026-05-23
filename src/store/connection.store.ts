import { create } from "zustand";
import type { ConnectionStatus } from "@/types/domain";

interface ConnectionState {
  status: ConnectionStatus;
  retryAttempt: number;
  lastError?: string;
  setStatus: (status: ConnectionStatus) => void;
  setRetry: (n: number) => void;
  setError: (msg?: string) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "idle",
  retryAttempt: 0,
  setStatus: (status) => set({ status }),
  setRetry: (n) => set({ retryAttempt: n }),
  setError: (msg) => set({ lastError: msg }),
}));
