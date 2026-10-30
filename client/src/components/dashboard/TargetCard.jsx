import { useEffect, useState } from "react";
import { Crosshair, Pencil } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

// Shows days left to the target exam, or a small form to set one
export default function TargetCard({ target, onSaved }) {
  const { setUser } = useAuth();
  const [editing, setEditing] = useState(!target);
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ exam: target?._id || "", date: target?.date ? target.date.slice(0, 10) : "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Until the dashboard reloads with the new target, keep showing the form
  const showForm = editing || !target;

  useEffect(() => {
    if (!showForm || exams.length) return;
    api
      .get("/exams")
      .then((r) => setExams(r.data.data))
      .catch(() => setError("Couldn’t load exams."));
  }, [showForm, exams.length]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.patch("/users/me", { targetExam: form.exam || null, targetExamDate: form.date || null });
      setUser(res.data.data);
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] bg-brand-soft p-[18px]">
      <div className="flex items-center gap-2">
        <Crosshair className="size-[17px] text-brand" aria-hidden="true" />
        <p className="flex-1 text-xs font-bold text-brand">YOUR TARGET</p>
        {!showForm && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Change target exam"
            className="-m-2 flex size-11 items-center justify-center rounded-lg text-brand hover:bg-white/60"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={save} className="flex flex-col gap-2.5">
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-ink">
            Exam
            <select
              required
              value={form.exam}
              onChange={(e) => setForm((f) => ({ ...f, exam: e.target.value }))}
              className="min-h-11 rounded-lg border border-line bg-white px-2 text-sm font-medium"
            >
              <option value="">Choose…</option>
              {exams.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-ink">
            Exam date (optional)
            <input
              type="date"
              min={istToday()}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="min-h-11 rounded-lg border border-line bg-white px-2 text-sm"
            />
          </label>
          {error && <p className="text-[11px] font-medium text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !form.exam} className="min-h-11 flex-1 rounded-lg bg-brand px-3 text-xs font-bold text-white disabled:opacity-60">
              {busy ? "Saving…" : "Save target"}
            </button>
            {target && (
              <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-lg px-3 text-xs font-bold text-brand">
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <>
          <p className="text-[17px] font-extrabold text-ink">{target.name}</p>
          {target.daysLeft !== null && target.daysLeft !== undefined ? (
            <>
              <p className="flex items-baseline gap-2 text-brand">
                <span className="text-[30px] leading-none font-extrabold">{target.daysLeft}</span>
                <span className="text-xs">{target.daysLeft === 1 ? "day" : "days"} to your goal</span>
              </p>
              <p className="text-[11px] text-muted">
                Exam date: {new Date(target.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted">Add your exam date to see a countdown.</p>
          )}
        </>
      )}
    </div>
  );
}
