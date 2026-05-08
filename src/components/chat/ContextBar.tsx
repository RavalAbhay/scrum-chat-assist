import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useContextStore } from "@/store/contextStore";
import { AsyncOption, AsyncSearchSelect } from "@/components/ui/async-search-select";
import { searchSprints, searchTeams } from "@/services/searchService";

export function ContextBar() {
  const user = useAuthStore((s) => s.user);
  const ctx = useContextStore();

  const [sprintOptions, setSprintOptions] = useState<AsyncOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<AsyncOption[]>([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const projectOptions = useMemo(
    () => (user?.projects ?? []).map((project) => ({ id: project.id, name: project.name })),
    [user?.projects]
  );
  const teams = user?.teams ?? [];
  const sprints = user?.sprints ?? [];

  const projectLabel = useMemo(
    () => projectOptions.find((p) => p.id === ctx.projectId)?.name,
    [projectOptions, ctx.projectId]
  );
  const sprintLabel = useMemo(
    () =>
      sprintOptions.find((s) => s.id === ctx.sprintId)?.name ??
      sprints.find((s) => s.id === ctx.sprintId)?.name,
    [sprintOptions, sprints, ctx.sprintId]
  );
  const teamLabel = useMemo(
    () =>
      teamOptions.find((t) => t.id === ctx.teamId)?.name ??
      teams.find((t) => t.id === ctx.teamId)?.name,
    [teamOptions, teams, ctx.teamId]
  );

  useEffect(() => {
    if (!ctx.projectId) {
      setSprintOptions([]);
      setTeamOptions([]);
      setSprintsLoading(false);
      setTeamsLoading(false);
      return;
    }

    const ctrl = new AbortController();
    let cancelled = false;

    setSprintsLoading(true);
    setTeamsLoading(true);
    setSprintOptions([]);
    setTeamOptions([]);

    Promise.all([searchSprints(ctx.projectId, ctrl.signal), searchTeams(ctx.projectId, ctrl.signal)])
      .then(([sprintsData, teamsData]) => {
        if (cancelled) return;
        setSprintOptions(sprintsData);
        setTeamOptions(teamsData);
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return;
        setSprintOptions([]);
        setTeamOptions([]);
      })
      .finally(() => {
        if (cancelled) return;
        setSprintsLoading(false);
        setTeamsLoading(false);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [ctx.projectId]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2.5">
      <AsyncSearchSelect
        value={ctx.projectId}
        selectedLabel={projectLabel}
        onChange={(v) =>
          ctx.setContext({
            projectId: v,
            sprintId: undefined,
            teamId: undefined,
          })
        }
        options={projectOptions}
        placeholder="Select project"
        ariaLabel="Project"
        className="min-w-[200px]"
        maxVisibleItems={5}
      />

      {ctx.projectId ? (
        <>
          <AsyncSearchSelect
            value={ctx.sprintId}
            selectedLabel={sprintLabel}
            onChange={(v) => ctx.setContext({ sprintId: v })}
            options={sprintOptions}
            placeholder="Sprint"
            ariaLabel="Sprint"
            className="min-w-[170px]"
            isLoading={sprintsLoading}
            maxVisibleItems={5}
          />
          <AsyncSearchSelect
            value={ctx.teamId}
            selectedLabel={teamLabel}
            onChange={(v) => ctx.setContext({ teamId: v })}
            options={teamOptions}
            placeholder="Team"
            ariaLabel="Team"
            className="min-w-[170px]"
            isLoading={teamsLoading}
            maxVisibleItems={5}
          />
        </>
      ) : null}
    </div>
  );
}
