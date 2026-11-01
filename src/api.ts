/** Live Desktop API (same as Android / desktop apps). */
export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "https://backend-desktop-production-600b.up.railway.app";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AccessClaims = {
  sub: string;
  organizationId?: string;
  role?: string;
  systemType?: string | null;
  exp?: number;
};

export async function apiLogin(email: string, password: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Login failed (${res.status})`);
  }
  return res.json() as Promise<TokenPair>;
}

export async function apiRefresh(refreshToken: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Session expired. Sign in again." : `Refresh failed (${res.status})`);
  }
  return res.json() as Promise<TokenPair>;
}

/** Backend has no /v1/auth/me — session identity comes from the access JWT. */
export function decodeAccessClaims(token: string): AccessClaims {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("Invalid session token");
  const payload = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  const json = atob(padded);
  return JSON.parse(json) as AccessClaims;
}

export function isAccessTokenFresh(token: string, skewSeconds = 30): boolean {
  try {
    const claims = decodeAccessClaims(token);
    if (!claims.exp) return true;
    return claims.exp * 1000 > Date.now() + skewSeconds * 1000;
  } catch {
    return false;
  }
}
