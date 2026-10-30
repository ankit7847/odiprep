import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  // On page load: if a token is saved, fetch the user
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const saveSession = useCallback(({ user: u, token }) => {
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const login = useCallback(
    async (email, password) => saveSession((await api.post("/auth/login", { email, password })).data.data),
    [saveSession]
  );

  const register = useCallback(
    async (name, email, password) =>
      saveSession((await api.post("/auth/register", { name, email, password })).data.data),
    [saveSession]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
