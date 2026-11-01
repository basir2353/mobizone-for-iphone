import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  apiLogin,
  apiRefresh,
  decodeAccessClaims,
  isAccessTokenFresh,
  type AccessClaims,
} from "./api";

const ACCESS_KEY = "mz-iphone-access-token";
const REFRESH_KEY = "mz-iphone-refresh-token";

type AuthState = {
  ready: boolean;
  claims: AccessClaims | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function saveTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState<AccessClaims | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const access = localStorage.getItem(ACCESS_KEY);
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!access) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        if (isAccessTokenFresh(access)) {
          if (!cancelled) {
            setAccessToken(access);
            setClaims(decodeAccessClaims(access));
          }
        } else {
          if (!refresh) throw new Error("Session expired");
          const next = await apiRefresh(refresh);
          if (cancelled) return;
          saveTokens(next.accessToken, next.refreshToken);
          setAccessToken(next.accessToken);
          setClaims(decodeAccessClaims(next.accessToken));
        }
      } catch {
        clearTokens();
        if (!cancelled) {
          setAccessToken(null);
          setClaims(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    saveTokens(data.accessToken, data.refreshToken);
    setAccessToken(data.accessToken);
    setClaims(decodeAccessClaims(data.accessToken));
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAccessToken(null);
    setClaims(null);
  }, []);

  const value = useMemo(
    () => ({ ready, claims, accessToken, login, logout }),
    [ready, claims, accessToken, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, accessToken } = useAuth();
  const location = useLocation();
  if (!ready) {
    return (
      <div className="mz-loading mz-loading-full">
        <div className="mz-spinner" />
        <p>Checking session…</p>
      </div>
    );
  }
  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
