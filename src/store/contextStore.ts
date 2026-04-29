import { create } from "zustand";
import { SessionContext } from "@/types";

interface ContextState extends SessionContext {
  setContext: (ctx: Partial<SessionContext>) => void;
  reset: () => void;
}

export const useContextStore = create<ContextState>((set) => ({
  projectId: undefined,
  sprintId: undefined,
  teamId: undefined,
  setContext: (ctx) => set((s) => ({ ...s, ...ctx })),
  reset: () => set({ projectId: undefined, sprintId: undefined, teamId: undefined }),
}));
