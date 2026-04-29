import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useContextStore } from "@/store/contextStore";
import { AsyncSearchSelect } from "@/components/ui/async-search-select";
import {
  searchProjects,
  searchSprints,
  searchTeams,
} from "@/services/searchService";

export function ContextBar() {
  const user = useAuthStore((s) => s.user);
  const ctx = useContextStore();

  const projects = user?.projects ?? [];
  const teams = user?.teams ?? [];
  const sprints = user?.sprints ?? [];

  // Trigger labels (lookup against current user context for instant render)
  const projectLabel = useMemo(
    () => projects.find((p) => p.id === ctx.projectId)?.name,
    [projects, ctx.projectId]
  );
  const sprintLabel = useMemo(
    () => sprints.find((s) => s.id === ctx.sprintId)?.name,
    [sprints, ctx.sprintId]
  );
  const teamLabel = useMemo(
    () => teams.find((t) => t.id === ctx.teamId)?.name,
    [teams, ctx.teamId]
  );

  // Bind sprint search to current project
  const sprintFetcher = useCallback(
    (q: string, signal: AbortSignal) => searchSprints(q, ctx.projectId, signal),
    [ctx.projectId]
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2.5">
      <AsyncSearchSelect
        value={ctx.projectId}
        selectedLabel={projectLabel}
        onChange={(v) => ctx.setContext({ projectId: v, sprintId: undefined })}
        fetchOptions={searchProjects}
        placeholder="Select project *"
        ariaLabel="Project"
        required
        className="min-w-[180px]"
      />
      <AsyncSearchSelect
        value={ctx.sprintId}
        selectedLabel={sprintLabel}
        onChange={(v) => ctx.setContext({ sprintId: v })}
        fetchOptions={sprintFetcher}
        placeholder="Sprint"
        ariaLabel="Sprint"
        className="min-w-[160px]"
      />
      <AsyncSearchSelect
        value={ctx.teamId}
        selectedLabel={teamLabel}
        onChange={(v) => ctx.setContext({ teamId: v })}
        fetchOptions={searchTeams}
        placeholder="Team"
        ariaLabel="Team"
        className="min-w-[160px]"
      />
    </div>
  );
}
