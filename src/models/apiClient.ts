import type { ApiResponse, TokenResponse, ValidationError } from "@/models/auth";

// Vercel environment values may be pasted with wrapping quotes or a trailing newline.
// Normalise the public API origin before composing request URLs.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/^['"]|['"]$/g, "");
let memoryToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let unauthenticatedHandler: (() => void) | undefined;

export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string, public data: ValidationError[] | null = null, public retryAfterSeconds?: number) { super(message); }
}

export const setAccessToken = (token: string | null) => { memoryToken = token; };
export const getAccessToken = () => memoryToken;
export const setUnauthenticatedHandler = (handler?: () => void) => { unauthenticatedHandler = handler; };

function canRefresh(path: string) { return !path.startsWith("/api/auth/refresh") && !path.startsWith("/api/auth/logout") && !path.startsWith("/api/auth/google"); }

async function requestEnvelope<T>(path: string, init: RequestInit = {}, retry = false): Promise<T> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (memoryToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${memoryToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  const envelope = await response.json().catch(() => null) as ApiResponse<T> | null;
  if (response.status === 401 && !retry && canRefresh(path)) {
    try { await refreshAccessToken(); return requestEnvelope<T>(path, init, true); }
    catch { unauthenticatedHandler?.(); }
  }
  if (!response.ok || !envelope || envelope.data === null || Array.isArray(envelope.data)) {
    throw new ApiClientError(response.status, envelope?.code ?? "NETWORK_ERROR", envelope?.message ?? `API request failed (${response.status}).`, Array.isArray(envelope?.data) ? envelope.data : null, envelope?.retryAfterSeconds);
  }
  return envelope.data;
}

async function refreshAccessToken() {
  if (!refreshPromise) refreshPromise = requestEnvelope<TokenResponse>("/api/auth/refresh", { method: "POST" }, true).then(({ accessToken }) => { setAccessToken(accessToken); return accessToken; }).finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export const apiClient = <T>(path: string, init: RequestInit = {}) => requestEnvelope<T>(path, init);
export const refreshSession = () => refreshAccessToken();
