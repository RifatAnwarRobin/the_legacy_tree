const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface AuthUser {
  username: string;
  name: string;
  is_admin: boolean;
  roles: string[];
}

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
}

export async function ensureCsrf(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/csrf/`, { credentials: "include" });
}

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/me/`, { credentials: "include" });
  if (!res.ok) throw new Error("Not authenticated");
  return (await res.json()) as AuthUser;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await post("/api/auth/login/", { username, password });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(data.detail ?? "Sign in failed.");
  }
  return (await res.json()) as AuthUser;
}

export async function logout(): Promise<void> {
  await post("/api/auth/logout/");
}
