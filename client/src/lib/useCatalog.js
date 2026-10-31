import { useEffect, useState } from "react";
import { api } from "./api";

// Exams, subjects and topics for admin dropdowns (loaded once per page)
export function useCatalog() {
  const [catalog, setCatalog] = useState({ exams: [], subjects: [], topics: [], ready: false });

  useEffect(() => {
    let alive = true;
    Promise.all([api.get("/admin/exams"), api.get("/admin/subjects"), api.get("/admin/topics")])
      .then(([e, s, t]) => alive && setCatalog({ exams: e.data.data, subjects: s.data.data, topics: t.data.data, ready: true }))
      .catch(() => alive && setCatalog((c) => ({ ...c, ready: true, error: true })));
    return () => {
      alive = false;
    };
  }, []);

  return catalog;
}
