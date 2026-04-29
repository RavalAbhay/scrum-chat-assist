import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
  prefill?: string;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  onStop,
  disabled,
  streaming,
  placeholder,
  prefill,
  maxLength = 5000,
}: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefill !== undefined) {
      setText(prefill);
      ref.current?.focus();
    }
  }, [prefill]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [text]);

  const submit = () => {
    const v = text.trim();
    if (!v || disabled || streaming) return;
    onSend(v);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-surface-elevated px-3 py-2 focus-within:border-accent transition">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLength))}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={disabled}
            placeholder={
              disabled
                ? placeholder ?? "Select a project to continue"
                : placeholder ?? "Message Scrum AI..."
            }
            className="flex-1 resize-none bg-transparent px-1 py-1.5 text-[15px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed scroll-thin"
          />
          {streaming ? (
            <button
              onClick={onStop}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
              aria-label="Stop"
            >
              <Square className="h-3.5 w-3.5" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={disabled || !text.trim()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="mt-1.5 px-1 text-[11px] text-muted-foreground flex justify-between">
          <span>Press Enter to send · Shift+Enter for newline</span>
          {text.length > 0 && (
            <span>
              {text.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
