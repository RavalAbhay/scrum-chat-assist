import { api, API_BASE_URL } from "./api";
import { ChatSession, Message, SessionContext, UserContext } from "@/types";
import { useAuthStore } from "@/store/authStore";

/**
 * Backend HTTP contract. Set VITE_API_BASE_URL to point at your server
 * (defaults to "/api"). All requests include `Authorization: Bearer <jwt>`
 * via the axios interceptor in ./api.ts.
 *
 *   POST   /auth/register           body: { firstName, lastName, email, password, scrumToken }
 *                                   -> { token, name, companyName }
 *   POST   /auth/login              body: { email, password }
 *                                   -> { token }
 *   GET    /auth/me                 (Bearer token) validates JWT
 *                                   -> UserContext
 *   GET    /chat/sessions           (Bearer token)
 *                                   -> ChatSession[]
 *   GET    /chat/sessions/:id/messages
 *                                   -> Message[]
 *   POST   /chat/message            body: { sessionId|null, message, context }
 *                                   -> { sessionId, sessionName, userMessage, assistantMessage }
 *   PATCH  /chat/sessions/:id       body: { name }
 *   DELETE /chat/sessions/:id
 */

/* ------------------------------- Auth -------------------------------- */

export async function login(email: string, password: string): Promise<string> {
  const { data } = await api.post<{ token: string }>("/auth/login", { email, password });
  return data.token;
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  scrumToken: string;
}): Promise<{ token: string; name: string; companyName: string }> {
  const { data } = await api.post("/auth/register", input);
  return data;
}

/**
 * Validate the stored JWT and return the current user context.
 * Used on app boot to decide whether to route to login or chat.
 */
export async function fetchMe(): Promise<UserContext> {
  const { data } = await api.get<UserContext>("/auth/token_auth");
  return data;
}

/* ------------------------------ Sessions ----------------------------- */

export async function fetchSessions(): Promise<ChatSession[]> {
  const { data } = await api.get<ChatSession[]>("/chat/sessions");
  return data;
}

export async function fetchSessionMessages(sessionId: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/chat/sessions/${sessionId}/messages`);
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`/chat/sessions/${id}`);
}

export async function renameSession(id: string, name: string) {
  await api.patch(`/chat/sessions/${id}`, { name });
}

/* ------------------------------ Messages ----------------------------- */

/**
 * Send a chat message. If `sessionId` is null the backend creates a new
 * session and returns its id along with the assistant response.
 */
export async function sendChatMessage(payload: {
  sessionId: string | null;
  message: string;
  context: SessionContext;
}): Promise<{
  sessionId: string;
  sessionName: string;
  userMessage: Message;
  assistantMessage: Message;
}> {
  const { data } = await api.post("/chat/message", payload, {
    // AI/tool calls can legitimately exceed the default API timeout.
    timeout: 0,
  });
  return data;
}




/* ----------------------- Legacy / deprecated ------------------------- */
// Kept so older imports compile; not used by the new flow.

export async function fetchSession(id: string): Promise<ChatSession> {
  const messages = await fetchSessionMessages(id);
  const sessions = await fetchSessions();
  const s = sessions.find((x) => x.id === id);
  if (!s) throw new Error("Session not found");
  return { ...s, messages };
}

export async function createSession(name: string, context: SessionContext) {
  // No-op in the new flow: sessions are created server-side on first message.
  // Returned shape kept for backwards compatibility.
  return {
    id: "pending",
    name,
    updatedAt: new Date().toISOString(),
    context,
  } as ChatSession;
}

export interface StreamCallbacks {
  onToken: (chunk: string) => void;
  onDone: (final: { type?: string; data?: any }) => void;
  onError: (err: Error) => void;
}

/**
 * Streaming variant — kept around for the real backend.
 * The mock flow uses sendChatMessage instead.
 */
export async function streamMessage(
  sessionId: string,
  message: string,
  context: SessionContext,
  signal: AbortSignal,
  cb: StreamCallbacks
) {
  try {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, context }),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json || json === "[DONE]") continue;
        try {
          const evt = JSON.parse(json);
          if (evt.token) cb.onToken(evt.token);
          if (evt.done) {
            cb.onDone({ type: evt.type, data: evt.data });
            return;
          }
        } catch {
          /* ignore */
        }
      }
    }
    cb.onDone({});
  } catch (err) {
    if ((err as Error).name === "AbortError") return cb.onDone({});
    cb.onError(err as Error);
  }
}

export async function sendMessage(
  sessionId: string,
  message: string,
  context: SessionContext
) {
  const r = await sendChatMessage({ sessionId, message, context });
  return { message: r.assistantMessage.content };
}
