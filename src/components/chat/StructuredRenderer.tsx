import { TaskItem, StoryItem, SprintSummary, MetricsData } from "@/types";

/* Renderer registry — extensible. Add new types by registering here. */

interface RendererProps {
  data: any;
}

const TasksRenderer = ({ data }: RendererProps) => {
  const tasks: TaskItem[] = Array.isArray(data) ? data : data?.tasks ?? [];
  if (!tasks.length) return null;
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">ID</th>
            <th className="px-3 py-2 text-left font-semibold">Title</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{t.id}</td>
              <td className="px-3 py-2">{t.title}</td>
              <td className="px-3 py-2">
                <StatusPill status={t.status} />
              </td>
              <td className="px-3 py-2 text-muted-foreground">{t.assignee ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StoriesRenderer = ({ data }: RendererProps) => {
  const stories: StoryItem[] = Array.isArray(data) ? data : data?.stories ?? [];
  if (!stories.length) return null;
  return (
    <div className="mt-3 grid gap-2">
      {stories.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border border-border bg-surface-elevated p-3 flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{s.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">#{s.id}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PriorityPill priority={s.priority} />
            <StatusPill status={s.status} />
          </div>
        </div>
      ))}
    </div>
  );
};

const SprintRenderer = ({ data }: RendererProps) => {
  const sprint: SprintSummary = data;
  if (!sprint) return null;
  const pct = Math.max(0, Math.min(100, sprint.progress ?? 0));
  return (
    <div className="mt-3 rounded-lg border border-border bg-surface-elevated p-4">
      <div className="flex items-baseline justify-between">
        <div className="font-semibold">{sprint.name}</div>
        <div className="text-xs text-muted-foreground">{sprint.duration}</div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{pct}% complete</div>
    </div>
  );
};

const MetricsRenderer = ({ data }: RendererProps) => {
  const m: MetricsData = data ?? {};
  const items: { label: string; value: string | number }[] = [];
  if (m.velocity !== undefined) items.push({ label: "Velocity", value: m.velocity });
  if (m.completedTasks !== undefined) items.push({ label: "Completed", value: m.completedTasks });
  if (m.pendingTasks !== undefined) items.push({ label: "Pending", value: m.pendingTasks });
  Object.entries(m).forEach(([k, v]) => {
    if (["velocity", "completedTasks", "pendingTasks"].includes(k)) return;
    if (typeof v === "string" || typeof v === "number")
      items.push({ label: k, value: v });
  });
  if (!items.length) return null;
  return (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((i) => (
        <div
          key={i.label}
          className="rounded-lg border border-border bg-surface-elevated p-3"
        >
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {i.label}
          </div>
          <div className="mt-1 text-xl font-semibold">{i.value}</div>
        </div>
      ))}
    </div>
  );
};

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s.includes("done") || s.includes("complete")
      ? "bg-success/10 text-success"
      : s.includes("progress") || s.includes("doing")
      ? "bg-accent/10 text-accent"
      : s.includes("block")
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function PriorityPill({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  const cls =
    p === "high" || p === "critical"
      ? "bg-destructive/10 text-destructive"
      : p === "medium"
      ? "bg-warning/10 text-warning"
      : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {priority}
    </span>
  );
}

type RendererFn = (props: RendererProps) => JSX.Element | null;

const registry: Record<string, RendererFn> = {
  tasks: TasksRenderer,
  stories: StoriesRenderer,
  sprint: SprintRenderer,
  metrics: MetricsRenderer,
};

export function registerRenderer(type: string, fn: RendererFn) {
  registry[type] = fn;
}

interface Props {
  type?: string;
  data?: any;
}

export function StructuredRenderer({ type, data }: Props) {
  if (!type) return null;
  const Comp = registry[type];
  if (!Comp) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        Unsupported response type: <span className="font-mono">{type}</span>
      </div>
    );
  }
  return <Comp data={data} />;
}
