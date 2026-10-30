import { FileSpreadsheet, Plus } from "lucide-react";
import { useApi } from "../../lib/useApi";
import { ErrorState, Loading } from "../../components/ui/PageState";
import Button from "../../components/ui/Button";
import { PageHeader } from "../../components/admin/ui";

function Stat({ label, value, note }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-5 shadow-card">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[28px] leading-tight font-extrabold text-ink tabular-nums">{value}</span>
      {note && <span className="text-[11px] text-muted">{note}</span>}
    </div>
  );
}

export default function Overview() {
  const { data, error, loading, reload } = useApi("/admin/stats");
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Admin overview" subtitle="What’s happening on OdiPrep.">
        <Button to="/admin/upload" variant="secondary" size="sm">
          <FileSpreadsheet className="size-4" aria-hidden="true" /> Upload questions
        </Button>
        <Button to="/admin/tests/new" size="sm">
          <Plus className="size-4" aria-hidden="true" /> New test
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Students" value={data.students} note={`${data.newStudents} joined this week`} />
        <Stat label="Tests taken today" value={data.attempts.today} note={`${data.attempts.total} in total`} />
        <Stat label="Live tests" value={data.tests.live} note={`${data.tests.total - data.tests.live} drafts`} />
        <Stat label="Published questions" value={data.questions.published} note={`${data.questions.draft} waiting in draft`} />
      </div>

      {data.questions.draft > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warn-soft p-4 text-sm text-warn">
          <span>
            <b>{data.questions.draft}</b> question{data.questions.draft === 1 ? " is" : "s are"} still in draft. Students can’t see them until you publish.
          </span>
          <Button to="/admin/questions?status=draft" variant="secondary" size="sm">
            Review drafts
          </Button>
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
        <h2 className="text-[17px] font-extrabold text-ink">Most taken this week</h2>
        {data.popularTests.length ? (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-muted">
                <th className="py-2 font-semibold">TEST</th>
                <th className="py-2 text-right font-semibold">ATTEMPTS</th>
                <th className="py-2 text-right font-semibold">AVG SCORE</th>
              </tr>
            </thead>
            <tbody>
              {data.popularTests.map((p) => (
                <tr key={p._id} className="border-t border-line">
                  <td className="py-3 text-ink">{p.test.title}</td>
                  <td className="py-3 text-right font-bold text-ink">{p.attempts}</td>
                  <td className="py-3 text-right text-muted">
                    {p.avgScore} / {p.test.totalMarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-sm text-muted">No tests taken in the last 7 days.</p>
        )}
      </section>
    </>
  );
}
