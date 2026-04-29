import { useState } from "react";
import { Message } from "@/types";
import { Markdown } from "./Markdown";
import { StructuredRenderer } from "./StructuredRenderer";
import { Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Props {
  message: Message;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: Props) {
  const [copied, setCopied] = useState(false);
  const time = (() => {
    try {
      return format(new Date(message.createdAt), "HH:mm");
    } catch {
      return "";
    }
  })();

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (message.role === "system") {
    return (
      <div className="mx-auto my-2 max-w-2xl text-center text-xs text-muted-foreground">
        {message.content}
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end px-4 py-3 animate-fade-in">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-2xl bg-chat-user px-4 py-2.5 text-[15px] leading-6 whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <div className="mt-1 text-right text-[11px] text-muted-foreground">{time}</div>
        </div>
      </div>
    );
  }

  // assistant
  const isEmpty = !message.content && message.pending;
  return (
    <div className="group px-4 py-3 animate-fade-in">
      <div className="max-w-3xl">
        <div className="rounded-2xl bg-chat-assistant px-4 py-3">
          {isEmpty ? (
            <div className="flex items-center gap-1 py-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <>
              {message.content && <Markdown content={message.content} />}
              {!message.pending && (
                <StructuredRenderer type={message.type} data={message.data} />
              )}
            </>
          )}

          {message.error && (
            <div className="mt-2 flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{message.error}</span>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-destructive/10 font-medium"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              )}
            </div>
          )}
        </div>

        {!message.pending && message.content && (
          <div className="mt-1 flex items-center gap-3 px-1 text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">
            <span>{time}</span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1 hover:text-foreground transition"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
