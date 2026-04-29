import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Show sprint progress",
  "List blocked tasks",
  "Team velocity report",
  "Summarize current sprint",
];

interface Props {
  onPick: (text: string) => void;
  disabled?: boolean;
}

export function PromptSuggestions({ onPick, disabled }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-2">
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            disabled={disabled}
            onClick={() => onPick(s)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-accent/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-3 w-3" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
