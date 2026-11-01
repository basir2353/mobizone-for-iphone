import { FormEvent, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  API_BASE,
  apiLogin,
  apiRefresh,
  decodeAccessClaims,
  isAccessTokenFresh,
  type AccessClaims,
} from "./api";

const ACCESS_KEY = "mz-iphone-access-token";
const REFRESH_KEY = "mz-iphone-refresh-token";

function saveTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await apiLogin(email.trim(), password);
      saveTokens(data.accessToken, data.refreshToken);
      nav("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <form className="card" onSubmit={onSubmit}>
        <div className="brand">
          <strong>MobiZone</strong>
          <span>iPhone web app · same live API as Android</span>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ marginTop: 14, color: "var(--muted)", fontSize: 12 }}>API: {API_BASE}</p>
      </form>
    </div>
  );
}

function HomePage() {
  const nav = useNavigate();
  const [claims, setClaims] = useState<AccessClaims | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      const access = localStorage.getItem(ACCESS_KEY);
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!access) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        if (isAccessTokenFresh(access)) {
          if (!cancelled) {
            setClaims(decodeAccessClaims(access));
            setReady(true);
          }
          return;
        }

        if (!refresh) throw new Error("Session expired. Sign in again.");
        const next = await apiRefresh(refresh);
        if (cancelled) return;
        saveTokens(next.accessToken, next.refreshToken);
        setClaims(decodeAccessClaims(next.accessToken));
      } catch (err) {
        if (!cancelled) {
          clearTokens();
          setClaims(null);
          setError(err instanceof Error ? err.message : "Session expired");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="app-shell">
        <p style={{ color: "var(--muted)" }}>Checking session…</p>
      </div>
    );
  }

  if (!claims) {
    return <Navigate to="/" replace />;
  }

  const title =
    claims.systemType === "mobizone"
      ? "MobiZone"
      : claims.role
        ? `Signed in · ${claims.role}`
        : "Welcome";

  return (
    <div className="app-shell">
      <div className="home">
        <div className="topbar">
          <strong>MobiZone for iPhone</strong>
          <button
            className="linkish"
            type="button"
            onClick={() => {
              clearTokens();
              nav("/", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
        <section className="hero">
          <h1>{title}</h1>
          <p>Safari / iPhone web shell connected to the live backend. Sell, purchase, and IMEI flows ship next.</p>
        </section>
        {error ? <p className="error">{error}</p> : null}
        <div className="grid">
          <div className="tile">
            <span>API</span>
            <strong>Live 600b</strong>
          </div>
          <div className="tile">
            <span>Role</span>
            <strong>{claims.role || "ok"}</strong>
          </div>
          <div className="tile">
            <span>Next</span>
            <strong>POS modules</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
