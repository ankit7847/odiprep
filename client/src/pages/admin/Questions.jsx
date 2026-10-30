import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Search } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useCatalog } from "../../lib/useCatalog";
import Button from "../../components/ui/Button";
import { ErrorState, Loading } from "../../components/ui/PageState";
import { Notice, PageHeader, Select, StatusPill, inputCls } from "../../components/admin/ui";

const FILTERS = ["exam", "subject", "status", "source", "batch", "search", "page"];

export default function Questions() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(FILTERS.map((k) => [k, params.get(k) || ""]));
  const [search, setSearch] = useState(f.search);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [notice, setNotice] = useState(null);
  const [tick, setTick] = useState(0);
  const query = params.toString();

  useEffect(() => {
    let alive = true;
    setError("");
    api
      .get(`/admin/questions?limit=25&${query}`)
      .then((r) => alive && setData(r.data.data))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [query, tick]);

  useEffect(() => setSelected([]), [query]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const run = async (fn, ok) => {
    try {
      const res = await fn();
      setNotice({ tone: "success", text: res?.data?.message || ok });
      setSelected([]);
      setTick((t) => t + 1);
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    }
  };

  const publishSelected = () => run(() => api.post("/admin/questions/publish", { ids: selected }));
  const archive = (q) => {
    if (window.confirm("Archive this question? Students will stop seeing it in new tests.")) {
      run(() => api.delete(`/admin/questions/${q._id}`));
    }
  };

  const subjectsForFilter = catalog.subjects;
  const items = data?.items || [];
  const allSelected = items.length > 0 && items.every((q) => selected.includes(q._id));

  return (
    <>
      <PageHeader title="Questions" subtitle={data ? `${data.total} question${data.total === 1 ? "" : "s"}` : " "}>
        <Button to="/admin/upload" variant="secondary" size="sm">
          Excel upload
        </Button>
        <Button to="/admin/questions/new" size="sm">
          <Plus className="size-4" aria-hidden="true" /> Add question
        </Button>
      </PageHeader>

      <div className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:grid-cols-2 xl:grid-cols-5">
        <form
          className="relative sm:col-span-2 xl:col-span-2"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter("search", search.trim());
          }}
        >
          <label htmlFor="q-search" className="sr-only">
            Search questions
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="q-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search question text…" className={`${inputCls} pl-9`} />
        </form>
        <Select value={f.exam} onChange={(v) => setFilter("exam", v)} aria-label="Exam">
          <option value="">All exams</option>
          {catalog.exams.map((x) => (
            <option key={x._id} value={x._id}>
              {x.name}
            </option>
          ))}
        </Select>
        <Select value={f.subject} onChange={(v) => setFilter("subject", v)} aria-label="Subject">
          <option value="">All subjects</option>
          {subjectsForFilter.map((x) => (
            <option key={x._id} value={x._id}>
              {x.name.en}
            </option>
          ))}
        </Select>
        <Select value={f.status} onChange={(v) => setFilter("status", v)} aria-label="Status">
          <option value="">Draft + published</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {f.batch && (
        <Notice tone="warn" onClose={() => setFilter("batch", "")}>
          Showing upload batch <b>{f.batch}</b>
        </Notice>
      )}
      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {error && <ErrorState message={error} onRetry={() => setTick((t) => t + 1)} />}
      {!data && !error && <Loading />}

      {data && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2">
            <label className="flex min-h-11 items-center gap-2 text-xs font-semibold text-ink">
              <input
                type="checkbox"
                className="size-4 accent-brand"
                checked={allSelected}
                onChange={(e) => setSelected(e.target.checked ? items.map((q) => q._id) : [])}
              />
              Select page
            </label>
            {selected.length > 0 && (
              <Button size="sm" onClick={publishSelected}>
                Publish {selected.length} selected
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted">No questions match these filters.</p>
          ) : (
            <ul>
              {items.map((q) => (
                <li key={q._id} className="flex items-start gap-3 border-b border-line px-4 py-3.5 last:border-0">
                  <input
                    type="checkbox"
                    aria-label="Select question"
                    className="mt-1 size-4 shrink-0 accent-brand"
                    checked={selected.includes(q._id)}
                    onChange={(e) => setSelected((s) => (e.target.checked ? [...s, q._id] : s.filter((x) => x !== q._id)))}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link to={`/admin/questions/${q._id}`} className="text-sm font-semibold text-ink hover:text-brand">
                      {q.text.en}
                    </Link>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                      <StatusPill status={q.status} />
                      <span>{q.exam?.name}</span>·<span>{q.subject?.name?.en}</span>
                      {q.topic && <>·<span>{q.topic.name.en}</span></>}
                      {q.year && <>·<span>{q.year}</span></>}
                      ·<span className="uppercase">{q.source}</span>·<span>Answer {q.correctOption}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Link to={`/admin/questions/${q._id}`} aria-label="Edit question" className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-brand">
                      <Pencil className="size-4" />
                    </Link>
                    {q.status !== "archived" && (
                      <button type="button" onClick={() => archive(q)} className="min-h-11 rounded-lg px-2 text-xs font-bold text-muted hover:text-danger">
                        Archive
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-xs text-muted">
                Page {data.page} of {data.pages}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={data.page <= 1} onClick={() => setFilter("page", String(data.page - 1))}>
                  Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={data.page >= data.pages} onClick={() => setFilter("page", String(data.page + 1))}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
