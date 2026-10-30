import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

// Preferred language for questions: "en" or "od".
// Saved in the browser, and on the profile when logged in.
const KEY = "odiprep_lang";
const LanguageContext = createContext(null);

const readSaved = () => {
  try {
    return localStorage.getItem(KEY) === "od" ? "od" : "en";
  } catch {
    return "en";
  }
};

export function LanguageProvider({ children }) {
  const { user, setUser } = useAuth();
  const [lang, setLangState] = useState(readSaved);

  // Logged-in user's saved choice wins
  useEffect(() => {
    if (user?.preferredLanguage) setLangState(user.preferredLanguage);
  }, [user?.preferredLanguage]);

  const setLang = useCallback(
    (next) => {
      setLangState(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      if (user && user.preferredLanguage !== next) {
        api
          .patch("/users/me", { preferredLanguage: next })
          .then((res) => setUser(res.data.data))
          .catch(() => {});
      }
    },
    [user, setUser]
  );

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
