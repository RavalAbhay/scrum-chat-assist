import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { useContextStore } from "@/store/contextStore";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { PromptSuggestions } from "./PromptSuggestions";
import { MessageSquare } from "lucide-react";

export function ChatWindow() {
  const messages = useSessionStore((s) => s.messages);
  const streaming = useSessionStore((s) => s.streaming);
  const loadingMessages = useSessionStore((s) => s.loadingMessages);
  const sendUserMessage = useSessionStore((s) => s.sendUserMessage);
  const stopStreaming = useSessionStore((s) => s.stopStreaming);
  const retryLast = useSessionStore((s) => s.retryLast);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const ctx = useContextStore();
  const projectSelected = !!ctx.projectId;
  // Project context is optional — users can chat freely without one.

  const scrollRef = useRef<HTMLDivElement>(null);
  const [prefill, setPrefill] = useState<string | undefined>();

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming]);

  // Stream-time soft scroll
  useEffect(() => {
    if (!streaming) return;
    const el = scrollRef.current;
    if (!el) return;
    const id = window.setInterval(() => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (nearBottom) el.scrollTop = el.scrollHeight;
    }, 200);
    return () => window.clearInterval(id);
  }, [streaming]);

  const handleSend = (text: string) => {
    sendUserMessage(text, {
      projectId: ctx.projectId,
      sprintId: ctx.sprintId,
      teamId: ctx.teamId,
    });
  };

  const isEmpty = messages.length === 0 && !loadingMessages;

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">Scrum AI Assistant</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask about sprints, tasks, blockers, or team velocity.
                {!projectSelected && " Select a project for richer context — optional."}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onRetry={
                  m.error
                    ? () =>
                        retryLast({
                          projectId: ctx.projectId,
                          sprintId: ctx.sprintId,
                          teamId: ctx.teamId,
                        })
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <PromptSuggestions
          onPick={(s) => setPrefill(s + " ")}
          disabled={streaming}
        />
      )}

      <ChatInput
        onSend={handleSend}
        onStop={stopStreaming}
        disabled={false}
        streaming={streaming}
        prefill={prefill}
      />
    </div>
  );
}
