import type { GraphResponse, PersonDetail } from "../types";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:8000";

export async function fetchGraph(): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE}/api/graph/`);
  if (!response.ok) {
    throw new Error(`The server returned ${response.status}. Is Django running?`);
  }
  return (await response.json()) as GraphResponse;
}

export async function fetchPersonDetail(id: string): Promise<PersonDetail> {
  const response = await fetch(`${API_BASE}/api/people/${id}/detail_full/`);
  if (!response.ok) {
    throw new Error(`Could not load this person (${response.status}).`);
  }
  return (await response.json()) as PersonDetail;
}
