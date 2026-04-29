import { Sparkles } from "lucide-react";

export function InsightsPanel() {
  return (
    <div className="hidden xl:flex h-full w-72 flex-col border-l border-border bg-sidebar">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-semibold">Insights</div>
        <div className="text-xs text-muted-foreground">AI-generated context</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <div className="mx-auto h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Insights about your sprint, blockers and team will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
