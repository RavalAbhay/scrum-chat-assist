import { create } from "zustand";
import { ChatSession, Message, SessionContext } from "@/types";
import * as svc from "@/services/chatService";

interface SessionStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: Message[];
  loadingSessions: boolean;
  loadingMessages: boolean;
  streaming: boolean;

  loadSessions: () => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  newSession: () => void;
  removeSession: (id: string) => Promise<void>;
  renameSession: (id: string, name: string) => Promise<void>;

  sendUserMessage: (content: string, context: SessionContext) => Promise<void>;
  stopStreaming: () => void;
  retryLast: (context: SessionContext) => Promise<void>;
  reset: () => void;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  loadingSessions: false,
  loadingMessages: false,
  streaming: false,

  loadSessions: async () => {
    set({ loadingSessions: true });
    try {
      const sessions = await svc.fetchSessions();
      set({ sessions });
    } finally {
      set({ loadingSessions: false });
    }
  },

  selectSession: async (id) => {
    set({ activeSessionId: id, loadingMessages: true, messages: [] });
    try {
      const messages = await svc.fetchSessionMessages(id);
      set({ messages });
    } catch {
      set({ messages: [] });
    } finally {
      set({ loadingMessages: false });
    }
  },

  /** Start a fresh chat — backend will register it on first message. */
  newSession: () => {
    set({ activeSessionId: null, messages: [] });
  },

  removeSession: async (id) => {
    await svc.deleteSession(id);
    set((s) => ({
      sessions: s.sessions.filter((x) => x.id !== id),
      activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
      messages: s.activeSessionId === id ? [] : s.messages,
    }));
  },

  renameSession: async (id, name) => {
    await svc.renameSession(id, name);
    set((s) => ({
      sessions: s.sessions.map((x) => (x.id === id ? { ...x, name } : x)),
    }));
  },

  sendUserMessage: async (content, context) => {
    const { activeSessionId } = get();

    // Optimistic UI: show user message + assistant placeholder immediately
    const optimisticUser: Message = {
      id: "u_" + uid(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const placeholderId = "a_" + uid();
    const placeholder: Message = {
      id: placeholderId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      pending: true,
    };
    set((s) => ({
      messages: [...s.messages, optimisticUser, placeholder],
      streaming: true,
    }));

    try {
      const res = await svc.sendChatMessage({
        sessionId: activeSessionId,
        message: content,
        context,
      });

      set((s) => {
        // Replace the optimistic user + placeholder with backend ids
        const messages = s.messages.map((m) => {
          if (m.id === optimisticUser.id) return res.userMessage;
          if (m.id === placeholderId) return { ...res.assistantMessage, pending: false };
          return m;
        });

        // Insert new session into the list (or update name/updatedAt)
        const existing = s.sessions.find((x) => x.id === res.sessionId);
        const sessions = existing
          ? s.sessions.map((x) =>
              x.id === res.sessionId
                ? { ...x, name: res.sessionName, updatedAt: new Date().toISOString() }
                : x
            )
          : [
              {
                id: res.sessionId,
                name: res.sessionName,
                updatedAt: new Date().toISOString(),
                context,
              },
              ...s.sessions,
            ];

        return {
          messages,
          sessions,
          activeSessionId: res.sessionId,
          streaming: false,
        };
      });
    } catch (err: any) {
      set((s) => ({
        streaming: false,
        messages: s.messages.map((m) =>
          m.id === placeholderId
            ? { ...m, pending: false, error: err?.message || "Request failed" }
            : m
        ),
      }));
    }
  },

  stopStreaming: () => set({ streaming: false }),

  retryLast: async (context) => {
    const { messages } = get();
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const trimmed = [...messages];
    while (trimmed.length && trimmed[trimmed.length - 1].role === "assistant") trimmed.pop();
    if (trimmed[trimmed.length - 1]?.id === lastUser.id) trimmed.pop();
    set({ messages: trimmed });
    await get().sendUserMessage(lastUser.content, context);
  },

  reset: () =>
    set({
      sessions: [],
      activeSessionId: null,
      messages: [],
      loadingSessions: false,
      loadingMessages: false,
      streaming: false,
    }),
}));
