import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { API_BASE } from "../api";
import { useAuth } from "../auth";

export function LoginPage() {
  const nav = useNavigate();
  const { accessToken, login, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ready && accessToken) {
    return <Navigate to="/home" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      nav("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="brand">
          <strong>MobiZone</strong>
          <span>iPhone Safari · same live API as Android</span>
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
        <button className="mz-btn-primary mz-btn-block" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="mz-muted" style={{ marginTop: 14, fontSize: 12 }}>
          API: {API_BASE}
        </p>
      </form>
    </div>
  );
}
