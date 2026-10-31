import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import Button from "../../components/ui/Button";
import { ErrorState, Loading } from "../../components/ui/PageState";
import { Notice, PageHeader, StatusPill } from "../../components/admin/ui";

const typeLabel = { pyq: "PYQ", mock: "Mock", daily_quiz: "Daily quiz" };

export default function Tests() {
  const { data: tests, error, loading, reload } = useApi("/admin/tests");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState("");

  const act = async (id, fn) => {
    setBusy(id);
    try {
      const res = await fn();
      setNotice({ tone: "success", text: res.data.message });
      reload();
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <PageHeader title="Tests" subtitle="Papers students can take. New tests start as drafts.">
        <Button to="/admin/tests/new" size="sm">
          <Plus className="size-4" aria-hidden="true" /> New test
        </Button>
      </PageHeader>

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}
      {loading && !tests && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {tests && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {tests.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted">No tests yet. Create one from your published questions.</p>
          ) : (
            <ul>
              {tests.map((t) => (
                <li key={t._id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3.5 last:border-0">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link to={`/admin/tests/${t._id}`} className="text-sm font-bold text-ink hover:text-brand">
                      {t.title}
                    </Link>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                      <StatusPill status={t.isPublished ? "live" : "draft"} />
                      <span>{t.exam?.name}</span>·<span>{typeLabel[t.type]}</span>
                      {t.year && <>·<span>{t.year}</span></>}·<span>{t.totalQuestions} questions</span>·<span>{t.durationMinutes} min</span>·
                      <span>
                        {t.attempts} attempt{t.attempts === 1 ? "" : "s"}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button to={`/admin/tests/${t._id}`} variant="secondary" size="sm">
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={t.isPublished ? "secondary" : "primary"}
                      disabled={busy === t._id}
                      onClick={() => act(t._id, () => api.post(`/admin/tests/${t._id}/publish`, { isPublished: !t.isPublished }))}
                    >
                      {t.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
