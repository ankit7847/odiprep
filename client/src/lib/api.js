import axios from "axios";

const TOKEN_KEY = "odiprep_token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* private mode: stay logged in for this tab only */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

// In dev, Vite proxies /api to the server. In production set VITE_API_URL (e.g. https://odiprep-api.onrender.com/api)
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", timeout: 60000 }); // free Render server can take ~50s to wake up

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn any failure into one readable message for the UI
export function errorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === "ECONNABORTED") return "The server is waking up and took too long. Please try again in a moment.";
  if (err?.request && !err.response) return "Can't reach the server. Check your internet and try again.";
  return "Something went wrong. Please try again.";
}
