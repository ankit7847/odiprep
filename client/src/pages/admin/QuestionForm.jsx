import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useCatalog } from "../../lib/useCatalog";
import Button from "../../components/ui/Button";
import { ErrorState, Loading } from "../../components/ui/PageState";
import { Field, Notice, PageHeader, Select, inputCls } from "../../components/admin/ui";

const KEYS = ["A", "B", "C", "D", "E"];
const empty = {
  exam: "",
  subject: "",
  topic: "",
  source: "pyq",
  year: "",
  text: { en: "", od: "" },
  options: KEYS.slice(0, 4).map((key) => ({ key, text: { en: "", od: "" } })),
  correctOption: "",
  explanation: { en: "", od: "" },
  difficulty: "medium",
  status: "draft",
};

// API question -> form state
const toForm = (q) => ({
  exam: q.exam?._id || q.exam,
  subject: q.subject?._id || q.subject,
  topic: q.topic?._id || q.topic || "",
  source: q.source,
  year: q.year ? String(q.year) : "",
  text: { en: q.text.en, od: q.text.od || "" },
  options: q.options.map((o) => ({ key: o.key, text: { en: o.text.en, od: o.text.od || "" } })),
  correctOption: q.correctOption,
  explanation: { en: q.explanation?.en || "", od: q.explanation?.od || "" },
  difficulty: q.difficulty,
  status: q.status,
});

// form state -> API body (drop empty optional strings)
const toBody = (f) => {
  const loc = (t) => ({ en: t.en.trim(), ...(t.od.trim() && { od: t.od.trim() }) });
  return {
    exam: f.exam,
    subject: f.subject,
    topic: f.topic || null,
    source: f.source,
    year: f.year ? Number(f.year) : null,
    text: loc(f.text),
    options: f.options.map((o) => ({ key: o.key, text: loc(o.text) })),
    correctOption: f.correctOption,
    ...(f.explanation.en.trim() || f.explanation.od.trim() ? { explanation: loc(f.explanation) } : {}),
    difficulty: f.difficulty,
    status: f.status,
  };
};

export default function QuestionForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const catalog = useCatalog();
  const [form, setForm] = useState(isNew ? empty : null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const [saved, setSaved] = useState(location.state?.saved || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/admin/questions/${id}`)
      .then((r) => setForm(toForm(r.data.data)))
      .catch((err) => setLoadError(errorMessage(err)));
  }, [id, isNew]);

  if (loadError) return <ErrorState message={loadError} backTo="/admin/questions" />;
  if (!form || !catalog.ready) return <Loading />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setOption = (i, lang, value) =>
    set({ options: form.options.map((o, j) => (j === i ? { ...o, text: { ...o.text, [lang]: value } } : o)) });
  const topics = catalog.topics.filter((t) => t.subject === form.subject);

  const addOption = () => form.options.length < 5 && set({ options: [...form.options, { key: KEYS[form.options.length], text: { en: "", od: "" } }] });
  const removeOption = () => {
    if (form.options.length <= 2) return;
    const last = KEYS[form.options.length - 1];
    set({ options: form.options.slice(0, -1), correctOption: form.correctOption === last ? "" : form.correctOption });
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaved("");
    if (!form.correctOption) return setError("Choose the correct answer.");
    setBusy(true);
    try {
      const body = toBody(form);
      if (isNew) {
        const r = await api.post("/admin/questions", body);
        navigate(`/admin/questions/${r.data.data._id}`, { replace: true, state: { saved: "Question added." } });
      } else {
        await api.patch(`/admin/questions/${id}`, body);
        setSaved("Changes saved.");
      }
    } catch (err) {
      const d = err?.response?.data?.details;
      setError(d?.length ? `${d[0].field || "Form"}: ${d[0].message}` : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/admin/questions" className="flex min-h-11 items-center gap-1.5 self-start text-xs font-bold text-brand">
        <ArrowLeft className="size-4" aria-hidden="true" /> Questions
      </Link>
      <PageHeader title={isNew ? "Add a question" : "Edit question"} subtitle="English is required; Odia is optional but recommended." />

      <form onSubmit={save} className="flex flex-col gap-5">
        <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Exam">
            <Select required value={form.exam} onChange={(v) => set({ exam: v })}>
              <option value="">Choose…</option>
              {catalog.exams.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject">
            <Select required value={form.subject} onChange={(v) => set({ subject: v, topic: "" })}>
              <option value="">Choose…</option>
              {catalog.subjects.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.name.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Topic (optional)">
            <Select value={form.topic} onChange={(v) => set({ topic: v })} disabled={!form.subject}>
              <option value="">None</option>
              {topics.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.name.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source">
            <Select value={form.source} onChange={(v) => set({ source: v })}>
              <option value="pyq">Previous-year paper</option>
              <option value="practice">Practice</option>
            </Select>
          </Field>
          <Field label="Year (optional)">
            <input type="number" min="1990" max="2100" value={form.year} onChange={(e) => set({ year: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Difficulty">
            <Select value={form.difficulty} onChange={(v) => set({ difficulty: v })}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-sm font-extrabold text-ink">Question</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="English">
              <textarea required rows={3} value={form.text.en} onChange={(e) => set({ text: { ...form.text, en: e.target.value } })} className={`${inputCls} py-2.5`} />
            </Field>
            <Field label="Odia">
              <textarea lang="or" rows={3} value={form.text.od} onChange={(e) => set({ text: { ...form.text, od: e.target.value } })} className={`${inputCls} py-2.5 font-odia`} />
            </Field>
          </div>
        </section>

        <fieldset className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card">
          <legend className="sr-only">Options and correct answer</legend>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink">Options · pick the correct one</h2>
            <div className="flex gap-1">
              <button type="button" onClick={removeOption} disabled={form.options.length <= 2} className="min-h-11 rounded-lg px-3 text-xs font-bold text-muted disabled:opacity-40">
                − Option
              </button>
              <button type="button" onClick={addOption} disabled={form.options.length >= 5} className="min-h-11 rounded-lg px-3 text-xs font-bold text-brand disabled:opacity-40">
                + Option
              </button>
            </div>
          </div>
          {form.options.map((o, i) => (
            <div
              key={o.key}
              className={`grid items-center gap-3 rounded-xl border p-3 md:grid-cols-[auto_1fr_1fr] ${form.correctOption === o.key ? "border-success bg-success-soft" : "border-line"}`}
            >
              <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-ink">
                <input type="radio" name="correct" checked={form.correctOption === o.key} onChange={() => set({ correctOption: o.key })} className="size-4 accent-success" />
                {o.key}
              </label>
              <input required aria-label={`Option ${o.key} English`} placeholder="English" value={o.text.en} onChange={(e) => setOption(i, "en", e.target.value)} className={inputCls} />
              <input lang="or" aria-label={`Option ${o.key} Odia`} placeholder="ଓଡ଼ିଆ" value={o.text.od} onChange={(e) => setOption(i, "od", e.target.value)} className={`${inputCls} font-odia`} />
            </div>
          ))}
        </fieldset>

        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-sm font-extrabold text-ink">Explanation (shown after the test)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="English">
              <textarea rows={3} value={form.explanation.en} onChange={(e) => set({ explanation: { ...form.explanation, en: e.target.value } })} className={`${inputCls} py-2.5`} />
            </Field>
            <Field label="Odia">
              <textarea lang="or" rows={3} value={form.explanation.od} onChange={(e) => set({ explanation: { ...form.explanation, od: e.target.value } })} className={`${inputCls} py-2.5 font-odia`} />
            </Field>
          </div>
        </section>

        {error && <Notice tone="error">{error}</Notice>}
        {saved && <Notice>{saved}</Notice>}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
          <Field label="Status" className="w-48">
            <Select value={form.status} onChange={(v) => set({ status: v })}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : isNew ? "Add question" : "Save changes"}
          </Button>
        </div>
      </form>
    </>
  );
}
