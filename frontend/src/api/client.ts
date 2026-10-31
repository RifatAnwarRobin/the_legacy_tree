import type { GraphResponse, PersonDetail } from "../types";

// Empty base = same origin; in dev the Vite proxy forwards /api to Django.
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export async function fetchGraph(): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE}/api/graph/`, { credentials: "include" });
  if (response.status === 401 || response.status === 403) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!response.ok) {
    throw new Error(`The server returned ${response.status}. Is Django running?`);
  }
  return (await response.json()) as GraphResponse;
}

export async function fetchPersonDetail(id: string): Promise<PersonDetail> {
  const response = await fetch(`${API_BASE}/api/people/${id}/detail_full/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Could not load this person (${response.status}).`);
  }
  return (await response.json()) as PersonDetail;
}
