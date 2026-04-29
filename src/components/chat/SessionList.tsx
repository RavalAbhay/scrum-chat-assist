import { useState } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { useContextStore } from "@/store/contextStore";
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SessionList() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeId = useSessionStore((s) => s.activeSessionId);
  const select = useSessionStore((s) => s.selectSession);
  const newSession = useSessionStore((s) => s.newSession);
  const remove = useSessionStore((s) => s.removeSession);
  const rename = useSessionStore((s) => s.renameSession);
  const ctx = useContextStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setDraft(name);
  };

  const saveEdit = async () => {
    if (editingId && draft.trim()) {
      await rename(editingId, draft.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="p-3">
        <button
          onClick={() => newSession()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm font-medium hover:border-accent/50 transition"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-2">
        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <ul className="space-y-0.5">
            {sessions.map((s) => {
              const active = s.id === activeId;
              const editing = editingId === s.id;
              return (
                <li key={s.id}>
                  <div
                    className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition cursor-pointer ${
                      active
                        ? "bg-secondary"
                        : "hover:bg-secondary/60"
                    }`}
                    onClick={() => !editing && select(s.id)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {editing ? (
                      <div className="flex flex-1 items-center gap-1">
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 min-w-0 rounded bg-background border border-border px-2 py-0.5 text-sm outline-none focus:border-accent"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEdit();
                          }}
                          className="rounded p-1 hover:bg-background"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="rounded p-1 hover:bg-background"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{s.name}</div>
                          {s.updatedAt && (
                            <div className="truncate text-[11px] text-muted-foreground">
                              {(() => {
                                try {
                                  return formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true });
                                } catch {
                                  return "";
                                }
                              })()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(s.id, s.name);
                            }}
                            className="rounded p-1 hover:bg-background"
                            aria-label="Rename"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this conversation?")) remove(s.id);
                            }}
                            className="rounded p-1 hover:bg-background"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
