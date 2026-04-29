import { api } from "./api";
import { AsyncOption } from "@/components/ui/async-search-select";

/**
 * Async search providers — call the real backend.
 *
 *   GET /projects?q=...                 -> AsyncOption[]
 *   GET /sprints?q=...&projectId=...    -> AsyncOption[]
 *   GET /teams?q=...                    -> AsyncOption[]
 */

export async function searchProjects(
  query: string,
  signal: AbortSignal
): Promise<AsyncOption[]> {
  const { data } = await api.get<AsyncOption[]>("/projects", {
    params: { q: query },
    signal,
  });
  return data;
}

export async function searchSprints(
  query: string,
  projectId: string | undefined,
  signal: AbortSignal
): Promise<AsyncOption[]> {
  const { data } = await api.get<AsyncOption[]>("/sprints", {
    params: { q: query, projectId },
    signal,
  });
  return data;
}

export async function searchTeams(
  query: string,
  signal: AbortSignal
): Promise<AsyncOption[]> {
  const { data } = await api.get<AsyncOption[]>("/teams", {
    params: { q: query },
    signal,
  });
  return data;
}
