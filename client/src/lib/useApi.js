import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "./api";

// Small GET hook: const { data, error, loading, reload } = useApi("/exams")
export function useApi(url) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(url) });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(url)
      .then((res) => alive && setState({ data: res.data.data, error: null, loading: false }))
      .catch((err) => alive && setState({ data: null, error: errorMessage(err), loading: false, status: err?.response?.status }));
    return () => {
      alive = false;
    };
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
