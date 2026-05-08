import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { useContextStore } from "@/store/contextStore";
import { fetchMe } from "@/services/chatService";
import { SessionList } from "@/components/chat/SessionList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ContextBar } from "@/components/chat/ContextBar";
import { InsightsPanel } from "@/components/chat/InsightsPanel";
import { LogOut, PanelLeft, Bot } from "lucide-react";

const Index = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const setUser = useAuthStore((s) => s.setUser);
  const setReady = useAuthStore((s) => s.setReady);
  const logout = useAuthStore((s) => s.logout);

  const loadSessions = useSessionStore((s) => s.loadSessions);
  const resetSessions = useSessionStore((s) => s.reset);
  const resetContext = useContextStore((s) => s.reset);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.title = "Scrum AI — Chat Assistant";
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      "Scrum AI chat assistant: sprint progress, blockers, velocity and tasks in one place.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  // Boot: if a JWT exists, validate it and load the user + sessions
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!token) {
        resetSessions();
        resetContext();
        setReady(true);
        return;
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        try {
          await loadSessions();
        } catch (sessionError) {
          console.warn("Failed to load chat sessions during boot:", sessionError);
        }
      } catch (e: any) {
        if (e?.response?.status === 401) {
          // JWT invalid/expired → back to login
          logout();
          resetContext();
        } else {
          console.warn("Failed to boot chat workspace:", e);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } shrink-0 border-r border-border overflow-hidden transition-[width] duration-200`}
      >
        <div className="w-64 h-full flex flex-col">
          <div className="flex items-center justify-between px-3 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="text-sm font-semibold">Scrum AI</div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <SessionList />
          </div>
          <div className="border-t border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">
                  {user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {user?.companyName || user?.companyId}
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  resetSessions();
                  resetContext();
                }}
                className="rounded-md p-1.5 hover:bg-secondary text-muted-foreground"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Center */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-md p-1.5 hover:bg-secondary text-muted-foreground"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium truncate">
            {activeSession?.name ?? "New chat"}
          </div>
        </header>
        <ContextBar />
        <ChatWindow />
      </main>

      {/* Right insights */}
      <InsightsPanel />
    </div>
  );
};

export default Index;
