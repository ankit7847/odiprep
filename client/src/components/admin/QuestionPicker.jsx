import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { inputCls } from "./ui";

// Search published questions for one exam (+ subject) and add them to a section
export default function QuestionPicker({ exam, subject, usedIds, onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const p = new URLSearchParams({ exam, status: "published", limit: "15", page: String(page) });
    if (subject) p.set("subject", subject);
    if (query) p.set("search", query);
    api
      .get(`/admin/questions?${p}`)
      .then((r) => alive && setData(r.data.data))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [exam, subject, query, page]);

  const free = (data?.items || []).filter((q) => !usedIds.has(q._id));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand-soft/40 p-3">
      {/* Not a <form>: the picker sits inside the test editor's form */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // don't submit the test form
              setPage(1);
              setQuery(search.trim());
            }
          }}
          placeholder="Search published questions… (Enter)"
          aria-label="Search questions"
          className={`${inputCls} pl-9`}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {data && data.items.length === 0 && <p className="px-1 py-3 text-xs text-muted">No published questions here yet. Upload and publish some first.</p>}
      <ul className="flex max-h-80 flex-col gap-1.5 overflow-auto">
        {(data?.items || []).map((q) => {
          const used = usedIds.has(q._id);
          return (
            <li key={q._id}>
              <button
                type="button"
                disabled={used}
                onClick={() => onAdd(q)}
                className="flex min-h-11 w-full items-start gap-2 rounded-lg bg-white px-3 py-2 text-left text-xs text-ink hover:ring-1 hover:ring-brand disabled:opacity-50"
              >
                <Plus className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden="true" />
                <span className="flex-1">{q.text.en}</span>
                <span className="shrink-0 text-[11px] text-muted">{used ? "Added" : q.year || q.source}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted">{data ? `${free.length} available on this page · ${data.total} total` : "Loading…"}</span>
        <div className="flex gap-1">
          {data?.pages > 1 && (
            <>
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="min-h-11 rounded-lg px-2 font-bold text-brand disabled:opacity-40">
                Prev
              </button>
              <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="min-h-11 rounded-lg px-2 font-bold text-brand disabled:opacity-40">
                Next
              </button>
            </>
          )}
          {free.length > 0 && (
            <button type="button" onClick={() => free.forEach(onAdd)} className="min-h-11 rounded-lg px-2 font-bold text-brand">
              Add all {free.length}
            </button>
          )}
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg px-2 font-bold text-muted">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
