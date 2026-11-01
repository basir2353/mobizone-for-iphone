import { FormEvent, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { API_BASE, apiLogin, apiMe } from "./api";

const TOKEN_KEY = "mz-iphone-access-token";

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
      localStorage.setItem(TOKEN_KEY, data.accessToken);
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
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem(TOKEN_KEY);

  useEffect(() => {
    if (!token) return;
    void apiMe(token)
      .then(setMe)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [token]);

  if (!token) return <Navigate to="/" replace />;

  return (
    <div className="app-shell">
      <div className="home">
        <div className="topbar">
          <strong>MobiZone for iPhone</strong>
          <button
            className="linkish"
            type="button"
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              nav("/", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
        <section className="hero">
          <h1>{me?.user?.name || me?.email || "Welcome"}</h1>
          <p>Safari / iPhone web shell connected to the live backend. Sell, purchase, and IMEI flows ship next.</p>
        </section>
        {error ? <p className="error">{error}</p> : null}
        <div className="grid">
          <div className="tile"><span>API</span><strong>Live 600b</strong></div>
          <div className="tile"><span>Login</span><strong>Working</strong></div>
          <div className="tile"><span>Next</span><strong>POS modules</strong></div>
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
