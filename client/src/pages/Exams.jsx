import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useApi } from "../lib/useApi";
import { ErrorState, Loading } from "../components/ui/PageState";
import { examCards } from "../data/homeContent";

// Exam picker, used for /exams, /pyq and /mock-tests
export default function Exams({ title = "Choose your exam", subtitle = "Start with a previous-year paper or a timed mock." }) {
  const { data: exams, error, loading, reload } = useApi("/exams");

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-16 md:py-14">
      <h1 className="text-[28px] font-extrabold text-ink md:text-[32px]">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>

      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {exams && !exams.length && <p className="py-16 text-center text-sm text-muted">No exams added yet.</p>}

      {exams && exams.length > 0 && (
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {exams.map((e) => {
            const card = examCards.find((c) => c.slug === e.slug);
            const Icon = card?.icon;
            const total = e.testCounts.pyq + e.testCounts.mock;
            return (
              <li key={e._id}>
                <Link
                  to={`/exams/${e.slug}`}
                  className="group flex h-full flex-col gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-card transition-colors hover:border-brand/40 md:p-6"
                >
                  {Icon && <Icon className="size-[25px] text-brand" strokeWidth={1.75} aria-hidden="true" />}
                  <span className="flex flex-col gap-1">
                    <span className="text-[19px] font-extrabold text-ink">{e.name}</span>
                    <span className="text-xs text-muted">{card?.board || e.board}</span>
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-3">
                    <span className="text-xs text-muted">
                      {total ? `${e.testCounts.pyq} PYQs · ${e.testCounts.mock} mocks` : "Papers coming soon"}
                    </span>
                    <span className="flex min-h-11 items-center gap-1.5 text-xs font-bold text-brand">
                      View papers <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
