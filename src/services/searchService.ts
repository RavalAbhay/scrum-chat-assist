import { api } from "./api";
import { AsyncOption } from "@/components/ui/async-search-select";

/**
 * Option loaders — pull the full datasets from the backend.
 *
 *   GET /projects                      -> AsyncOption[]
 *   GET /sprints?projectId=...         -> AsyncOption[]
 *   GET /teams?projectId=...           -> AsyncOption[]
 */

export async function searchProjects(signal: AbortSignal): Promise<AsyncOption[]> {
  const { data } = await api.get<AsyncOption[]>("/projects", {
    signal,
  });
  return data;
}

export async function searchSprints(
  projectId: string | undefined,
  signal: AbortSignal
): Promise<AsyncOption[]> {
  const { data } = await api.get<AsyncOption[]>("/sprints", {
    params: { projectId },
    signal,
  });
  return data;
}

export async function searchTeams(
  projectId: string | undefined,
  signal: AbortSignal
): Promise<AsyncOption[]> {
  const { data } = await api.get<AsyncOption[]>("/teams", {
    params: { projectId },
    signal,
  });
  return data;
}
